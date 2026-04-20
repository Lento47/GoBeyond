import { requireAuth } from "../../_lib/auth";
import { error, json } from "../../_lib/response";

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    return json({ user: auth.user });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
