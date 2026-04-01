export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function validateRequiredString(value, label, max = 4000) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw badRequest(`${label} es requerido.`);
  }

  if (normalized.length > max) {
    throw badRequest(`${label} supera el maximo permitido.`);
  }

  return normalized;
}

export function validateEmail(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw badRequest("Email invalido.");
  }

  return normalized;
}

export function validatePassword(value) {
  const normalized = String(value ?? "");

  if (normalized.length < 12) {
    throw badRequest("La contrasena debe tener al menos 12 caracteres.");
  }

  return normalized;
}

export function validateRole(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const allowedRoles = new Set(["admin", "teacher", "student"]);

  if (!allowedRoles.has(normalized)) {
    throw badRequest("Rol invalido.");
  }

  return normalized;
}

export function validateAccountStatus(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const allowedStatuses = new Set(["active", "disabled"]);

  if (!allowedStatuses.has(normalized)) {
    throw badRequest("Estado de cuenta invalido.");
  }

  return normalized;
}

export function validateEnrollmentStatus(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const allowedStatuses = new Set(["active", "paused", "completed", "expired"]);

  if (!allowedStatuses.has(normalized)) {
    throw badRequest("Estado de matricula invalido.");
  }

  return normalized;
}

export function validatePositiveInteger(value, label, { min = 1, max = 3650 } = {}) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw badRequest(`${label} es invalido.`);
  }

  return parsed;
}
