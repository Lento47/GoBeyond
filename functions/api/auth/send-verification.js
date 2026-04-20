import { requestEmailVerification } from "../../_lib/auth";
import { assertTrustedOrigin, enforceRequestThrottle, readJsonBody, recordRequestAttempt, throttlePolicies } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";
import { verifyTurnstileToken } from "../../_lib/turnstile";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    await enforceRequestThrottle(context.env, context.request, throttlePolicies.sendVerification);
    await recordRequestAttempt(context.env, context.request, throttlePolicies.sendVerification, {
      detailsJson: {
        route: "auth.send_verification",
      },
    });
    const body = await readJsonBody(context.request, { maxBytes: 8_192 });
    await verifyTurnstileToken(context.request, context.env, body.turnstileToken, { action: "send-verification" });
    const result = await requestEmailVerification(context.request, context.env, body);
    return json(result);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
