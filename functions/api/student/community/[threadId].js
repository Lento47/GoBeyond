import { requireAuth } from "../../../_lib/auth";
import { listCommunityThreads, replyToCommunityThread, updateCommunityThreadByStudent } from "../../../_lib/community";
import { error, json, options } from "../../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await context.request.json().catch(() => ({}));
    const action = String(body.action ?? "").trim().toLowerCase();

    if (action === "reply") {
      const thread = await replyToCommunityThread(context.request, context.env, auth, context.params.threadId, body);
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
