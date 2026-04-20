const crypto = require("node:crypto");

function required(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const config = {
  port: Number(process.env.PORT ?? 4000),
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? 12),
  bootstrapSecret: required("GOBEYOND_BOOTSTRAP_SECRET", "change-this-bootstrap-secret"),
  tokenSigningKey: required(
    "GOBEYOND_TOKEN_SIGNING_KEY",
    crypto.createHash("sha256").update("gobeyond-local-dev-signing-key").digest("hex")
  ),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120),
  loginRateLimitMaxRequests: Number(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS ?? 8),
};

module.exports = {
  config,
};
