import { getContent, getPublicContentView } from "../../_lib/content";
import { error, json } from "../../_lib/response";
import { getPublicTurnstileConfig } from "../../_lib/turnstile";

export async function onRequestGet(context) {
  try {
    const content = await getContent(context.env);
    return json({
      ...getPublicContentView(content),
      securityPublic: getPublicTurnstileConfig(context.env),
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
