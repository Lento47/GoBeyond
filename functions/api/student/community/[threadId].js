import { requireAuth } from "../../../_lib/auth";
import { listCommunityThreads, replyToCommunityThread, updateCommunityThreadByStudent } from "../../../_lib/community";
import { assertTrustedOrigin, readJsonBody, enforceRequestThrottle, recordRequestAttempt, throttlePolicies } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const action = String(body.action ?? "").trim().toLowerCase();

    if (action === "reply") {
      await enforceRequestThrottle(context.env, context.request, throttlePolicies.studentCommunityReply, { actorUserId: auth.user.id });
      const thread = await replyToCommunityThread(context.request, context.env, auth, context.params.threadId, body);
      await recordRequestAttempt(context.env, context.request, throttlePolicies.studentCommunityReply, { actorUserId: auth.user.id });
      const threads = await listCommunityThreads(context.env);
      return json({ thread, threads });
    }

    const thread = await updateCommunityThreadByStudent(context.request, context.env, auth, context.params.threadId, body);
    const threads = await listCommunityThreads(context.env);
    return json({ thread, threads });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
