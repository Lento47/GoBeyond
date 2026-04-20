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
