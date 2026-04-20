import { adminSendManagedUserVerification, requireAuth } from "../../../../_lib/auth";
import { assertTrustedOrigin } from "../../../../_lib/requestSecurity";
import { error, json, options } from "../../../../_lib/response";
import { listUsers } from "../../../../_lib/users";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const result = await adminSendManagedUserVerification(context.request, context.env, auth, context.params.id);
    const users = await listUsers(context.env);
    return json({ ...result, users });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
