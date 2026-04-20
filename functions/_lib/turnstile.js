import { getClientIp } from "./util";

function turnstileConfigured(env) {
  return Boolean(String(env.TURNSTILE_SECRET_KEY ?? "").trim() && String(env.TURNSTILE_SITE_KEY ?? "").trim());
}

function expectedTurnstileHostname(request, env) {
  const configuredOrigin = String(env.APP_ORIGIN ?? "").trim();

  try {
    return new URL(configuredOrigin || request.url).hostname;
  } catch {
    return "";
  }
}

export function getPublicTurnstileConfig(env) {
  const enabled = turnstileConfigured(env);
  const siteKey = enabled ? String(env.TURNSTILE_SITE_KEY ?? "").trim() : "";

  return {
    enabled,
    siteKey,
  };
}

export async function verifyTurnstileToken(request, env, token, { action = "" } = {}) {
  if (!turnstileConfigured(env)) {
    return {
      enforced: false,
      ok: true,
    };
  }

  const responseToken = String(token ?? "").trim();
  if (!responseToken) {
    const error = new Error("Completa la verificacion de seguridad.");
    error.status = 400;
    throw error;
  }

  const payload = new URLSearchParams();
  payload.set("secret", String(env.TURNSTILE_SECRET_KEY ?? "").trim());
  payload.set("response", responseToken);

  const remoteIp = getClientIp(request);
  if (remoteIp && remoteIp !== "unknown") {
    payload.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    body: payload,
    method: "POST",
  });

  if (!response.ok) {
    const error = new Error("No se pudo validar la verificacion de seguridad.");
    error.status = 503;
    throw error;
  }

  const result = await response.json().catch(() => ({}));
  if (!result?.success) {
    const error = new Error("La verificacion de seguridad no fue valida. Intenta nuevamente.");
    error.status = 400;
    throw error;
  }

  const expectedHostname = expectedTurnstileHostname(request, env);
  if (expectedHostname && result.hostname && result.hostname !== expectedHostname) {
    const error = new Error("La verificacion de seguridad no corresponde a este dominio.");
    error.status = 400;
    throw error;
  }

  if (action && result.action && result.action !== action) {
    const error = new Error("La verificacion de seguridad no corresponde a esta accion.");
    error.status = 400;
    throw error;
  }

  return {
    enforced: true,
    ok: true,
    result,
  };
}
