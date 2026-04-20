// Standalone Worker example for a dedicated social-news service.
// The repo implementation uses Pages Functions equivalents, but this file
// keeps the exact Worker shape requested for a separate deployment.

const ALLOWED_ORIGIN = "https://gobeyondcr.org";

function buildJsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-Secret-Token");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Max-Age", "86400");

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}

function validatePayload(body = {}) {
  const titulo = String(body.titulo ?? "").trim();
  const contenido = String(body.contenido ?? "").trim();
  const urlOriginal = String(body.url_original ?? "").trim();
  const fuente = String(body.fuente ?? "").trim().toLowerCase();
  const imagenUrl = String(body.imagen_url ?? "").trim() || null;

  if (!titulo || !contenido || !urlOriginal) {
    throw new Error("titulo, contenido y url_original son obligatorios.");
  }

  if (!["facebook", "linkedin", "instagram"].includes(fuente)) {
    throw new Error("fuente debe ser facebook, linkedin o instagram.");
  }

  return {
    titulo,
    contenido,
    imagen_url: imagenUrl,
    url_original: urlOriginal,
    fuente,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return buildJsonResponse({}, { status: 204 });
    }

    if (request.method === "GET" && url.pathname === "/noticias") {
      const result = await env.DB.prepare(
        `SELECT id, titulo, contenido, imagen_url, url_original, fuente, publicado_en
         FROM noticias
         ORDER BY datetime(publicado_en) DESC, id DESC
         LIMIT 20`
      ).all();

      return buildJsonResponse({
        posts: result.results ?? [],
      });
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      const incomingSecret = String(request.headers.get("X-Secret-Token") ?? "").trim();
      if (!incomingSecret || incomingSecret !== String(env.WEBHOOK_SECRET ?? "").trim()) {
        return buildJsonResponse({ error: "Unauthorized" }, { status: 401 });
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        return buildJsonResponse({ error: "Invalid JSON body" }, { status: 400 });
      }

      let payload;
      try {
        payload = validatePayload(body);
      } catch (validationError) {
        return buildJsonResponse({ error: validationError.message }, { status: 400 });
      }

      await env.DB.prepare(
        `INSERT INTO noticias (titulo, contenido, imagen_url, url_original, fuente)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(
          payload.titulo,
          payload.contenido,
          payload.imagen_url,
          payload.url_original,
          payload.fuente
        )
        .run();

      return buildJsonResponse({ ok: true });
    }

    return buildJsonResponse({ error: "Not found" }, { status: 404 });
  },
};
