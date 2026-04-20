import { requireAuth } from "../../_lib/auth";
import { createTeacherEnrollment, listTeacherEnrollmentsView } from "../../_lib/teacher";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    const payload = await listTeacherEnrollmentsView(context.env, auth.user.id);
    return json(payload);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const payload = await createTeacherEnrollment(context.request, context.env, auth, body);
    return json(payload, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
