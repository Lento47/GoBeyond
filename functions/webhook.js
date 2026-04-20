import { error } from "./_lib/response";
import { readJsonBody } from "./_lib/requestSecurity";
import { insertNewsPost, resolveWebhookSource, validateWebhookPayload } from "./_lib/socialNews";

function buildWebhookHeaders() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "https://gobeyondcr.org",
    "Access-Control-Allow-Headers": "Content-Type, X-Secret-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: buildWebhookHeaders(),
  });
}

export async function onRequestPost(context) {
  try {
    const incomingSecret = String(context.request.headers.get("X-Secret-Token") ?? "").trim();
    const expectedSecret = String(context.env.WEBHOOK_SECRET ?? "").trim();

    if (!incomingSecret || !expectedSecret || incomingSecret !== expectedSecret) {
      return error("Token no autorizado.", 401);
    }

    const body = await readJsonBody(context.request, { maxBytes: 32_000 });
    const payload = validateWebhookPayload(body);
    const sourceId = await resolveWebhookSource(context.env, payload.source_id, payload.fuente, payload.url_original);

    await insertNewsPost(context.env, {
      ...payload,
      source_id: sourceId,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: buildWebhookHeaders(),
    });
  } catch (requestError) {
    return new Response(JSON.stringify({ error: requestError.message }), {
      status: requestError.status ?? 500,
      headers: buildWebhookHeaders(),
    });
  }
}
