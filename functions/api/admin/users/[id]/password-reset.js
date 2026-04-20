import { adminSendManagedUserPasswordReset, requireAuth } from "../../../../_lib/auth";
import { error, json, options } from "../../../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const result = await adminSendManagedUserPasswordReset(context.request, context.env, auth, context.params.id);
    return json(result);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
