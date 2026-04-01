import { registerStudent } from "../../_lib/auth";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const result = await registerStudent(context.request, context.env, body);
    return json(result, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
