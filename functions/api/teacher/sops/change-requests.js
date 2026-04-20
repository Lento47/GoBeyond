import { requireAuth } from "../../../_lib/auth";
import { createTeacherSopChangeRequest } from "../../../_lib/sops";
import { assertTrustedOrigin, readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 16_000 });
    return json(await createTeacherSopChangeRequest(context.request, context.env, auth, body));
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
