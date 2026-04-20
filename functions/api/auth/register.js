import { createSessionCookie, registerStudent } from "../../_lib/auth";
import { assertTrustedOrigin, enforceRequestThrottle, readJsonBody, recordRequestAttempt, throttlePolicies } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";
import { verifyTurnstileToken } from "../../_lib/turnstile";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    await enforceRequestThrottle(context.env, context.request, throttlePolicies.register);
    await recordRequestAttempt(context.env, context.request, throttlePolicies.register, {
      detailsJson: {
        route: "auth.register",
      },
    });
    const body = await readJsonBody(context.request, { maxBytes: 16_384 });
    await verifyTurnstileToken(context.request, context.env, body.turnstileToken, { action: "register" });
    const result = await registerStudent(context.request, context.env, body);
    const token = result?.token;
    const responseBody =
      token && result?.expiresAt
        ? (({ token: omittedToken, ...rest }) => rest)(result)
        : result;
    const headers =
      token && result?.expiresAt
        ? {
            "Set-Cookie": createSessionCookie(context.request, token, result.expiresAt),
          }
        : undefined;
    return json(responseBody, { status: 201, headers });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
