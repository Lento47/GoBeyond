import { getContent, getPublicContentView } from "../../_lib/content";
import { error, json } from "../../_lib/response";

export async function onRequestGet(context) {
  try {
    const content = await getContent(context.env);
    return json(getPublicContentView(content));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
