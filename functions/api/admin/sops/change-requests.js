import { requireAuth } from "../../../_lib/auth";
import { listAdminSopChangeRequests, updateAdminSopChangeRequest } from "../../../_lib/sops";
import { assertTrustedOrigin, readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    return json(await listAdminSopChangeRequests(context.env));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const requestId = String(new URL(context.request.url).searchParams.get("id") ?? "").trim();
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });

    if (!requestId) {
      return error("Falta el id de la solicitud.", 400);
    }

    return json(await updateAdminSopChangeRequest(context.request, context.env, auth, requestId, body));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
