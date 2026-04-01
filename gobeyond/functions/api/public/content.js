import { getContent } from "../../_lib/content";
import { json } from "../../_lib/response";

export async function onRequestGet(context) {
  const content = await getContent(context.env);
  return json(content);
}
