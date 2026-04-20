import { error, json, options } from "../_lib/response";
import { listRecentNews } from "../_lib/socialNews";

export async function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    const posts = await listRecentNews(context.env, 20);
    return json({ posts });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
