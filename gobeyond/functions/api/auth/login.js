import { login } from "../../_lib/auth";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const result = await login(context.request, context.env, body);
    return json(result);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
