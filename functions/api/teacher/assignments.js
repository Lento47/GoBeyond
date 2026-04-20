import { requireAuth } from "../../_lib/auth";
import { createTeacherAssignment, deleteTeacherAssignment, updateTeacherAssignment } from "../../_lib/teacher";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const payload = await createTeacherAssignment(context.request, context.env, auth, body);
    return json(payload, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const payload = await updateTeacherAssignment(context.request, context.env, auth, body);
    return json(payload);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const payload = await deleteTeacherAssignment(context.request, context.env, auth, body);
    return json(payload);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
