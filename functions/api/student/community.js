import { requireAuth } from "../../_lib/auth";
import { createCommunityThread, listCommunityThreads } from "../../_lib/community";
import { assertTrustedOrigin, readJsonBody, enforceRequestThrottle, recordRequestAttempt, throttlePolicies } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["student"]);
    const threads = await listCommunityThreads(context.env);
    return json({ threads });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    assertTrustedOrigin(context.request, context.env);
    await enforceRequestThrottle(context.env, context.request, throttlePolicies.studentCommunityThread, { actorUserId: auth.user.id });
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const thread = await createCommunityThread(context.request, context.env, auth, body);
    await recordRequestAttempt(context.env, context.request, throttlePolicies.studentCommunityThread, { actorUserId: auth.user.id });
    const threads = await listCommunityThreads(context.env);
    return json({ thread, threads }, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
