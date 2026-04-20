export function createId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function parseJsonOrNull(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}
