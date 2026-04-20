function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateEmail(email) {
  const normalized = String(email ?? "").trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  if (!valid) {
    throw badRequest("Email invalido.");
  }

  return normalized;
}

function validatePassword(password) {
  const value = String(password ?? "");

  if (value.length < 12) {
    throw badRequest("La contrasena debe tener al menos 12 caracteres.");
  }

  return value;
}

function validateRequiredString(value, label, max = 4000) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw badRequest(`${label} es requerido.`);
  }

  if (normalized.length > max) {
    throw badRequest(`${label} supera el maximo permitido.`);
  }

  return normalized;
}

function validateEnum(value, options, label) {
  if (!options.includes(value)) {
    throw badRequest(`${label} invalido.`);
  }

  return value;
}

module.exports = {
  badRequest,
  validateEmail,
  validateEnum,
  validatePassword,
  validateRequiredString,
};
