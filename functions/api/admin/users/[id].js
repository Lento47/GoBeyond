import { requireAuth } from "../../../_lib/auth";
import { assertTrustedOrigin, readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { deleteManagedUser, listUsers, updateManagedUser } from "../../../_lib/users";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 32_000 });
    const user = await updateManagedUser(context.request, context.env, auth, context.params.id, body);
    const users = await listUsers(context.env);
    return json({ user, users });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const user = await deleteManagedUser(context.request, context.env, auth, context.params.id);
    const users = await listUsers(context.env);
    return json({ user, users });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
