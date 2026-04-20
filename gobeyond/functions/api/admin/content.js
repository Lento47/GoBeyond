import { requireAuth } from "../../_lib/auth";
import { getContent } from "../../_lib/content";
import { error, json } from "../../_lib/response";

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    const content = await getContent(context.env);
    return json(content);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
