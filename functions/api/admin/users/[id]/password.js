import { adminSetManagedUserPassword, requireAuth } from "../../../../_lib/auth";
import { error, json, options } from "../../../../_lib/response";
import { listUsers } from "../../../../_lib/users";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const body = await context.request.json();
    const user = await adminSetManagedUserPassword(context.request, context.env, auth, context.params.id, body);
    const users = await listUsers(context.env);
    return json({ user, users });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
