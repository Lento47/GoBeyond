import { requireAuth } from "../../_lib/auth";
import { getNextPendingUserNotification } from "../../_lib/notifications";
import { listTeacherSops } from "../../_lib/sops";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    const [payload, notificationBanner] = await Promise.all([
      listTeacherSops(context.env),
      getNextPendingUserNotification(context.env, auth.user.id),
    ]);
    return json({
      ...payload,
      notificationBanner,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
