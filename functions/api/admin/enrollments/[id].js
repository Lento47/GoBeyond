import { requireAuth } from "../../../_lib/auth";
import { deleteEnrollment, listEnrollments, updateEnrollment } from "../../../_lib/enrollments";
import { error, json, options } from "../../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const body = await context.request.json();
    await updateEnrollment(context.request, context.env, auth, context.params.id, body);
    const enrollments = await listEnrollments(context.env);
    return json({ enrollments });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    await deleteEnrollment(context.request, context.env, auth, context.params.id);
    const enrollments = await listEnrollments(context.env);
    return json({ enrollments });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
