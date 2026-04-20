import { applyApiSecurityHeaders, error } from "./_lib/response";

export async function onRequestGet(context) {
  try {
    if (!context.env.MEDIA_BUCKET) {
      return error("MEDIA_BUCKET no esta configurado.", 500);
    }

    const url = new URL(context.request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return error("Falta la clave del archivo.", 400);
    }

    if (key.startsWith("assignment-file/") || key.startsWith("sop-file/")) {
      return error("Archivo no disponible en la ruta publica.", 403);
    }

    const object = await context.env.MEDIA_BUCKET.get(key);
    if (!object) {
      return error("Archivo no encontrado.", 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=3600");
    applyApiSecurityHeaders(headers, { cacheControl: "public, max-age=3600" });

    return new Response(object.body, {
      headers,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
