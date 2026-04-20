import { badRequest, validateRequiredString } from "./validation";

const allowedPlatforms = new Set(["facebook", "linkedin", "instagram"]);
const activePlatforms = new Set(["facebook", "linkedin", "instagram"]);

function normalizeOptionalString(value, max = 4000) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length > max) {
    throw badRequest("Uno de los campos supera el maximo permitido.");
  }

  return normalized;
}

export function validateSocialPlatform(value, { allowPlanned = true } = {}) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!allowedPlatforms.has(normalized)) {
    throw badRequest("Plataforma social invalida.");
  }

  if (!allowPlanned && !activePlatforms.has(normalized)) {
    throw badRequest("La plataforma aun no esta habilitada para ingestion automatica.");
  }

  return normalized;
}

export function validateSocialSourcePayload(payload = {}) {
  return {
    nombre: validateRequiredString(payload.nombre, "Nombre", 120),
    plataforma: validateSocialPlatform(payload.plataforma),
    page_url: validateRequiredString(payload.page_url, "URL publica", 1000),
    page_identifier: validateRequiredString(payload.page_identifier, "Identificador de pagina", 255),
    activo: payload.activo === false || payload.activo === 0 || payload.activo === "0" ? 0 : 1,
  };
}

export function validateWebhookPayload(payload = {}) {
  return {
    titulo: validateRequiredString(payload.titulo, "Titulo", 255),
    contenido: validateRequiredString(payload.contenido, "Contenido", 12000),
    imagen_url: normalizeOptionalString(payload.imagen_url, 2000) || null,
    url_original: validateRequiredString(payload.url_original, "URL original", 2000),
    fuente: validateSocialPlatform(payload.fuente, { allowPlanned: false }),
    source_id: normalizeOptionalString(payload.source_id, 255) || null,
  };
}

export async function listSocialSources(env) {
  const result = await env.DB.prepare(
    `SELECT id, nombre, plataforma, page_url, page_identifier, activo, created_at, updated_at
     FROM social_sources
     ORDER BY activo DESC, plataforma ASC, nombre ASC`
  ).all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    plataforma: row.plataforma,
    page_url: row.page_url,
    page_identifier: row.page_identifier,
    activo: Boolean(row.activo),
    automationStatus: activePlatforms.has(row.plataforma) ? "active" : "planned",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function getSocialSourceById(env, id) {
  return env.DB.prepare(
    `SELECT id, nombre, plataforma, page_url, page_identifier, activo, created_at, updated_at
     FROM social_sources
     WHERE id = ?
     LIMIT 1`
  )
    .bind(id)
    .first();
}

export async function createSocialSource(env, source) {
  await env.DB.prepare(
    `INSERT INTO social_sources (id, nombre, plataforma, page_url, page_identifier, activo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(source.id, source.nombre, source.plataforma, source.page_url, source.page_identifier, source.activo)
    .run();
}

export async function updateSocialSource(env, id, source) {
  const existing = await getSocialSourceById(env, id);

  if (!existing) {
    const error = new Error("Fuente social no encontrada.");
    error.status = 404;
    throw error;
  }

  await env.DB.prepare(
    `UPDATE social_sources
     SET nombre = ?, plataforma = ?, page_url = ?, page_identifier = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(source.nombre, source.plataforma, source.page_url, source.page_identifier, source.activo, id)
    .run();
}

export async function deleteSocialSource(env, id) {
  await env.DB.prepare("DELETE FROM social_sources WHERE id = ?").bind(id).run();
}

export async function resolveWebhookSource(env, sourceId, fuente, urlOriginal) {
  const normalizedSourceId = String(sourceId ?? "").trim();
  if (normalizedSourceId) {
    const source = await getSocialSourceById(env, normalizedSourceId);

    if (!source) {
      const error = new Error("La fuente social indicada no existe.");
      error.status = 400;
      throw error;
    }

    if (!source.activo) {
      const error = new Error("La fuente social indicada esta inactiva.");
      error.status = 409;
      throw error;
    }

    if (source.plataforma !== fuente) {
      const error = new Error("La fuente social no coincide con la plataforma recibida.");
      error.status = 400;
      throw error;
    }

    return source.id;
  }

  const normalizedUrl = String(urlOriginal ?? "").trim();
  if (!normalizedUrl) {
    return null;
  }

  const match = await env.DB.prepare(
    `SELECT id
     FROM social_sources
     WHERE plataforma = ?
       AND activo = 1
       AND (? LIKE '%' || page_identifier || '%' OR ? = page_url)
     ORDER BY updated_at DESC
     LIMIT 1`
  )
    .bind(fuente, normalizedUrl, normalizedUrl)
    .first();

  return match?.id ?? null;
}

export async function insertNewsPost(env, payload) {
  await env.DB.prepare(
    `INSERT INTO noticias (source_id, titulo, contenido, imagen_url, url_original, fuente, publicado_en, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(payload.source_id, payload.titulo, payload.contenido, payload.imagen_url, payload.url_original, payload.fuente)
    .run();
}

export async function listRecentNews(env, limit = 20) {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
  const result = await env.DB.prepare(
    `SELECT
       noticias.id,
       noticias.source_id,
       noticias.titulo,
       noticias.contenido,
       noticias.imagen_url,
       noticias.url_original,
       noticias.fuente,
       noticias.publicado_en,
       social_sources.nombre AS source_name,
       social_sources.page_url AS source_page_url
     FROM noticias
     LEFT JOIN social_sources ON social_sources.id = noticias.source_id
     ORDER BY datetime(noticias.publicado_en) DESC, noticias.id DESC
     LIMIT ?`
  )
    .bind(safeLimit)
    .all();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    source_id: row.source_id,
    titulo: row.titulo,
    contenido: row.contenido,
    imagen_url: row.imagen_url,
    url_original: row.url_original,
    fuente: row.fuente,
    publicado_en: row.publicado_en,
    source_name: row.source_name,
    source_page_url: row.source_page_url,
  }));
}
