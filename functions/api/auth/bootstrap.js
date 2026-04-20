import { bootstrapAdmin } from "../../_lib/auth";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 16_384 });
    const result = await bootstrapAdmin(context.request, context.env, body);
    return json(result, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
