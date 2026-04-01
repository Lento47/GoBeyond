import { requireAuth } from "../../_lib/auth";
import { createEnrollment, listEnrollments } from "../../_lib/enrollments";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    const enrollments = await listEnrollments(context.env);
    return json({ enrollments });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const body = await context.request.json();
    await createEnrollment(context.request, context.env, auth, body);
    const enrollments = await listEnrollments(context.env);
    return json({ enrollments }, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
