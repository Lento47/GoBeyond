import { resetPasswordWithToken } from "../../_lib/auth";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 8_192 });
    const result = await resetPasswordWithToken(context.request, context.env, body);
    return json(result);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
