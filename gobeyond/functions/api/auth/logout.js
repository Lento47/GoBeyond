import { logout, requireAuth } from "../../_lib/auth";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    await logout(context.request, context.env, auth);
    return json({ ok: true });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
