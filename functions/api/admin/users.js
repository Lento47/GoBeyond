import { createManagedUser, requireAuth } from "../../_lib/auth";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";
import { listUsers } from "../../_lib/users";

export async function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    const users = await listUsers(context.env);
    return json({ users });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 32_000 });
    const user = await createManagedUser(context.request, context.env, auth, body);
    const users = await listUsers(context.env);
    return json({ user, users }, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
