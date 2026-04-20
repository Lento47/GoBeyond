import { defaultContent } from "../../src/data/defaultContent";
import { validateEmbedValue } from "../../src/shared/embedPolicy";
import { normalizePublicMediaUrl } from "../../src/shared/publicMedia";
import { purgeExpiredCommunityThreads } from "./community";
import { parseJsonOrNull } from "./util";

const blockSections = ["brand", "hero", "benefits", "accessTimeline", "subscription", "communityStats", "landing", "securitySettings"];
const collectionSections = [
  "liveSessions",
  "learningPath",
  "testimonials",
  "testimonialSubmissions",
  "courses",
  "institutions",
  "materialTemplates",
  "mediaLibrary",
  "news",
  "socialSources",
  "supportTickets",
  "courseInterestRequests",
  "cohorts",
  "enrollmentEnhancements",
  "communityThreads",
  "sops",
  "sopChangeRequests",
];

async function purgeExpiredClosedItems(env) {
  const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sectionsToClean = ["supportTickets", "courseInterestRequests"];

  for (const section of sectionsToClean) {
    const result = await env.DB.prepare(
      "SELECT id, value_json FROM collection_items WHERE section = ?"
    )
      .bind(section)
      .all();

    const expiredIds = (result.results ?? [])
      .map((row) => ({
        id: row.id,
        value: parseJsonOrNull(row.value_json),
      }))
      .filter(({ value }) => {
        if (!value || value.status !== "closed") {
          return false;
        }

        const referenceDate = String(value.closedAt || value.updatedAt || value.createdAt || "").trim();
        return referenceDate && referenceDate <= oneDayAgoIso;
      })
      .map(({ id }) => id);

    for (const id of expiredIds) {
      await deleteCollectionItem(env, section, id);
    }
  }
}

export async function getContent(env) {
  await purgeExpiredClosedItems(env);
  await purgeExpiredCommunityThreads(env);
  const content = structuredClone(defaultContent);

  const blockResult = await env.DB.prepare(
    "SELECT block_key, value_json FROM content_blocks"
  ).all();

  for (const row of blockResult.results ?? []) {
    const parsed = parseJsonOrNull(row.value_json);
    if (parsed !== null) {
      content[row.block_key] = parsed;
    }
  }

  for (const section of collectionSections) {
    const result = await env.DB.prepare(
      "SELECT id, value_json, position FROM collection_items WHERE section = ? ORDER BY position ASC"
    )
      .bind(section)
      .all();

    if ((result.results ?? []).length > 0) {
      const databaseItems = result.results
        .map((row) => parseJsonOrNull(row.value_json))
        .filter((item) => item && String(item.id ?? "").trim());

      const defaultItems = Array.isArray(content[section]) ? content[section] : [];
      const mergedById = new Map();

      for (const item of defaultItems) {
        const key = item?.id ?? JSON.stringify(item);
        mergedById.set(key, item);
      }

      for (const item of databaseItems) {
        const key = item?.id ?? JSON.stringify(item);
        mergedById.set(key, item);
      }

      content[section] = Array.from(mergedById.values());
    }
  }

  return content;
}

export function getPublicContentView(content) {
  const normalizeMediaItem = (item) => {
    if (!item || typeof item !== "object") {
      return item;
    }

    return {
      ...item,
      image: normalizePublicMediaUrl(item.image),
      coverImage: normalizePublicMediaUrl(item.coverImage),
    };
  };

  return {
    ...content,
    testimonials: (content.testimonials ?? [])
      .filter((item) => item.status !== "pending")
      .map(normalizeMediaItem),
    courses: (content.courses ?? []).map(normalizeMediaItem),
    institutions: (content.institutions ?? []).map(normalizeMediaItem),
    liveSessions: (content.liveSessions ?? []).map(normalizeMediaItem),
    news: (content.news ?? []).map(normalizeMediaItem),
    socialSources: undefined,
    testimonialSubmissions: undefined,
    materialTemplates: undefined,
    mediaLibrary: undefined,
    supportTickets: undefined,
    courseInterestRequests: undefined,
    cohorts: undefined,
    enrollmentEnhancements: undefined,
    communityThreads: undefined,
    sops: undefined,
    sopChangeRequests: undefined,
    securitySettings: undefined,
  };
}

function sanitizeCollectionItemForStorage(section, item) {
  if (!item || typeof item !== "object") {
    return item;
  }

  if (section === "news") {
    return {
      ...item,
      embed: validateEmbedValue(item.embed, "Embed de noticia"),
    };
  }

  if (section === "institutions") {
    return {
      ...item,
      embed: validateEmbedValue(item.embed, "Embed de institucion"),
    };
  }

  return item;
}

export async function saveBlock(env, section, value, userId) {
  if (!blockSections.includes(section)) {
    throw new Error("Seccion no permitida.");
  }

  await env.DB.prepare(
    `INSERT INTO content_blocks (block_key, value_json, updated_by, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(block_key) DO UPDATE SET
       value_json = excluded.value_json,
       updated_by = excluded.updated_by,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(section, JSON.stringify(value), userId)
    .run();
}

export async function createCollectionItem(env, section, item) {
  if (!collectionSections.includes(section)) {
    throw new Error("Coleccion no permitida.");
  }

  if (!String(item?.id ?? "").trim()) {
    const error = new Error("El elemento necesita un id valido.");
    error.status = 400;
    throw error;
  }

  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM collection_items WHERE section = ?"
  )
    .bind(section)
    .first();

  const nextPosition = Number(positionRow?.maxPosition ?? -1) + 1;
  const sanitizedItem = sanitizeCollectionItemForStorage(section, item);

  try {
    await env.DB.prepare(
      `INSERT INTO collection_items (id, section, value_json, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(sanitizedItem.id, section, JSON.stringify(sanitizedItem), nextPosition)
      .run();
  } catch (dbError) {
    if (String(dbError?.message ?? "").includes("SQLITE_TOOBIG")) {
      const error = new Error("El contenido incluye un archivo o imagen demasiado grande para guardarse en la plataforma. Usa una imagen mas ligera o un enlace externo.");
      error.status = 400;
      throw error;
    }

    throw dbError;
  }
}

export async function updateCollectionItem(env, section, item) {
  if (!collectionSections.includes(section)) {
    throw new Error("Coleccion no permitida.");
  }

  if (!String(item?.id ?? "").trim()) {
    const error = new Error("El elemento necesita un id valido.");
    error.status = 400;
    throw error;
  }

  const existing = await env.DB.prepare(
    "SELECT id, position FROM collection_items WHERE section = ? AND id = ? LIMIT 1"
  )
    .bind(section, item.id)
    .first();

  if (!existing) {
    const error = new Error("Elemento no encontrado.");
    error.status = 404;
    throw error;
  }

  const sanitizedItem = sanitizeCollectionItemForStorage(section, item);

  try {
    await env.DB.prepare(
      `UPDATE collection_items
       SET value_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE section = ? AND id = ?`
    )
      .bind(JSON.stringify(sanitizedItem), section, sanitizedItem.id)
      .run();
  } catch (dbError) {
    if (String(dbError?.message ?? "").includes("SQLITE_TOOBIG")) {
      const error = new Error("El contenido incluye un archivo o imagen demasiado grande para guardarse en la plataforma. Usa una imagen mas ligera o un enlace externo.");
      error.status = 400;
      throw error;
    }

    throw dbError;
  }
}

export async function deleteCollectionItem(env, section, id) {
  await env.DB.prepare("DELETE FROM collection_items WHERE section = ? AND id = ?")
    .bind(section, id)
    .run();
}
