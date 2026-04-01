import { defaultContent } from "../../src/data/defaultContent";
import { parseJsonOrNull } from "./util";

const blockSections = ["brand", "hero", "benefits", "accessTimeline", "subscription", "communityStats", "landing"];
const collectionSections = ["liveSessions", "learningPath", "testimonials", "testimonialSubmissions", "courses"];

export async function getContent(env) {
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
      content[section] = result.results
        .map((row) => parseJsonOrNull(row.value_json))
        .filter(Boolean);
    }
  }

  return content;
}

export function getPublicContentView(content) {
  return {
    ...content,
    testimonials: (content.testimonials ?? []).filter((item) => item.status !== "pending"),
    testimonialSubmissions: undefined,
  };
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

  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM collection_items WHERE section = ?"
  )
    .bind(section)
    .first();

  const nextPosition = Number(positionRow?.maxPosition ?? -1) + 1;

  await env.DB.prepare(
    `INSERT INTO collection_items (id, section, value_json, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(item.id, section, JSON.stringify(item), nextPosition)
    .run();
}

export async function updateCollectionItem(env, section, item) {
  if (!collectionSections.includes(section)) {
    throw new Error("Coleccion no permitida.");
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

  await env.DB.prepare(
    `UPDATE collection_items
     SET value_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE section = ? AND id = ?`
  )
    .bind(JSON.stringify(item), section, item.id)
    .run();
}

export async function deleteCollectionItem(env, section, id) {
  await env.DB.prepare("DELETE FROM collection_items WHERE section = ? AND id = ?")
    .bind(section, id)
    .run();
}
