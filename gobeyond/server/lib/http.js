const { config } = require("../config");

const generalRateLimiter = new Map();
const loginRateLimiter = new Map();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Access-Control-Allow-Origin": config.appOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  });
  response.end(JSON.stringify(payload));
}

function getIpAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return request.socket.remoteAddress ?? "unknown";
}

function applyRateLimit(map, key, limit) {
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, {
      count: 1,
      resetAt: now + config.rateLimitWindowMs,
    });
    return;
  }

  entry.count += 1;
  if (entry.count > limit) {
    const error = new Error("Demasiadas solicitudes.");
    error.statusCode = 429;
    throw error;
  }
}

function enforceRateLimit(request) {
  const ip = getIpAddress(request);
  const routeKey = `${ip}:${request.method}:${request.url}`;
  const isLogin = request.url.startsWith("/api/auth/login");
  applyRateLimit(generalRateLimiter, routeKey, config.rateLimitMaxRequests);

  if (isLogin) {
    applyRateLimit(loginRateLimiter, ip, config.loginRateLimitMaxRequests);
  }
}

function assertOrigin(request) {
  const origin = request.headers.origin;

  if (!origin) {
    return;
  }

  if (origin !== config.appOrigin) {
    const error = new Error("Origen no permitido.");
    error.statusCode = 403;
    throw error;
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        const error = new Error("Payload demasiado grande.");
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        const invalidJsonError = new Error("JSON invalido.");
        invalidJsonError.statusCode = 400;
        reject(invalidJsonError);
      }
    });

    request.on("error", reject);
  });
}

module.exports = {
  assertOrigin,
  enforceRateLimit,
  getIpAddress,
  readBody,
  sendJson,
};
