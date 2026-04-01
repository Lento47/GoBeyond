import { requireAuth } from "../../../_lib/auth";
import { error, json, options } from "../../../_lib/response";
import { listUsers, updateManagedUser } from "../../../_lib/users";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const body = await context.request.json();
    const user = await updateManagedUser(context.request, context.env, auth, context.params.id, body);
    const users = await listUsers(context.env);
    return json({ user, users });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
