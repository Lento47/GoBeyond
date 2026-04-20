import { requireAuth } from "../../_lib/auth";
import { createAdminSop, deleteAdminSop, listAdminSops, updateAdminSop } from "../../_lib/sops";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    return json(await listAdminSops(context.env));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 128_000 });
    return json(await createAdminSop(context.request, context.env, auth, body));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const sopId = String(new URL(context.request.url).searchParams.get("id") ?? "").trim();
    const body = await readJsonBody(context.request, { maxBytes: 128_000 });

    if (!sopId) {
      return error("Falta el id del SOP.", 400);
    }

    return json(await updateAdminSop(context.request, context.env, auth, sopId, body));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const sopId = String(new URL(context.request.url).searchParams.get("id") ?? "").trim();

    if (!sopId) {
      return error("Falta el id del SOP.", 400);
    }

    return json(await deleteAdminSop(context.request, context.env, auth, sopId));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
