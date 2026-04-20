import { requireAuth } from "../../../../_lib/auth";
import { acknowledgeUserNotification } from "../../../../_lib/notifications";
import { assertTrustedOrigin } from "../../../../_lib/requestSecurity";
import { error, json, options } from "../../../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    assertTrustedOrigin(context.request, context.env);
    const result = await acknowledgeUserNotification(context.request, context.env, auth, context.params.id);
    return json(result);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
