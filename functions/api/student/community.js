import { requireAuth } from "../../_lib/auth";
import { createCommunityThread, listCommunityThreads } from "../../_lib/community";
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
    const body = await context.request.json().catch(() => ({}));
    const thread = await createCommunityThread(context.request, context.env, auth, body);
    const threads = await listCommunityThreads(context.env);
    return json({ thread, threads }, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
