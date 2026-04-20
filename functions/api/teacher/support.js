import { requireAuth } from "../../_lib/auth";
import { updateTeacherSupportItem, listTeacherSupport } from "../../_lib/teacher";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    const support = await listTeacherSupport(context.env, auth.user.id);
    return json(support);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const support = await updateTeacherSupportItem(context.request, context.env, auth, body);
    return json(support);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
