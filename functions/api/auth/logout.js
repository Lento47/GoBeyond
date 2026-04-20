import { clearSessionCookie, logout, requireAuth } from "../../_lib/auth";
import { assertTrustedOrigin } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    const auth = await requireAuth(context.request, context.env);
    await logout(context.request, context.env, auth);
    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": clearSessionCookie(context.request),
        },
      }
    );
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
