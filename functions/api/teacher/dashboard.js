import { requireAuth } from "../../_lib/auth";
import { getTeacherDashboard } from "../../_lib/teacher";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    const dashboard = await getTeacherDashboard(context.env, auth.user.id, auth.user.fullName);
    return json({ user: auth.user, dashboard });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
