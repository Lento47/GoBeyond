import { requireAuth } from "../../_lib/auth";
import { listTeacherCourses } from "../../_lib/teacher";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    const courses = await listTeacherCourses(context.env, auth.user.id);
    return json({ courses });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
