import { requireAuth } from "../../_lib/auth";
import { error, json } from "../../_lib/response";

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env);
    return json({ user: auth.user });
  } catch (requestError) {
    if (requestError.status === 401) {
      return json({ user: null });
    }
    return error(requestError.message, requestError.status ?? 500);
  }
}
