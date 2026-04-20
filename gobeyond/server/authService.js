const crypto = require("node:crypto");
const { config } = require("./config");
const { appendAuditEvent } = require("./auditStore");
const { createOpaqueToken, hashPassword, hashToken, verifyPassword } = require("./lib/crypto");
const { validateEmail, validatePassword, validateRequiredString } = require("./lib/validation");
const { createSession, deleteSessionByHash, findSessionByHash } = require("./sessionStore");
const { createUser, findUserByEmail, findUserById, hasAdminUser } = require("./userStore");

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function bootstrapAdmin({ email, password, fullName, setupSecret, ipAddress }) {
  if (setupSecret !== config.bootstrapSecret) {
    const error = new Error("Bootstrap secret invalido.");
    error.statusCode = 403;
    throw error;
  }

  if (await hasAdminUser()) {
    const error = new Error("Ya existe un administrador.");
    error.statusCode = 409;
    throw error;
  }

  const normalizedEmail = validateEmail(email);
  const safePassword = validatePassword(password);
  const safeName = validateRequiredString(fullName, "Nombre completo", 255);
  const passwordHash = await hashPassword(safePassword);

  const user = await createUser({
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash,
    fullName: safeName,
    role: "admin",
    createdAt: new Date().toISOString(),
  });

  await appendAuditEvent({
    type: "auth.bootstrap_admin",
    actorUserId: user.id,
    ipAddress,
    createdAt: new Date().toISOString(),
  });

  return sanitizeUser(user);
}

async function login({ email, password, ipAddress }) {
  const normalizedEmail = validateEmail(email);
  const safePassword = validatePassword(password);
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const error = new Error("Credenciales invalidas.");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await verifyPassword(safePassword, user.passwordHash);

  if (!validPassword) {
    const error = new Error("Credenciales invalidas.");
    error.statusCode = 401;
    throw error;
  }

  const rawToken = createOpaqueToken();
  const tokenHash = hashToken(rawToken, config.tokenSigningKey);
  const expiresAt = new Date(Date.now() + config.sessionTtlHours * 60 * 60 * 1000).toISOString();

  await createSession({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  await appendAuditEvent({
    type: "auth.login",
    actorUserId: user.id,
    ipAddress,
    createdAt: new Date().toISOString(),
  });

  return {
    token: rawToken,
    expiresAt,
    user: sanitizeUser(user),
  };
}

async function authenticateRequest(request) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    const error = new Error("Autenticacion requerida.");
    error.statusCode = 401;
    throw error;
  }

  const rawToken = authorization.slice("Bearer ".length).trim();
  if (!rawToken) {
    const error = new Error("Token invalido.");
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashToken(rawToken, config.tokenSigningKey);
  const session = await findSessionByHash(tokenHash);

  if (!session) {
    const error = new Error("Sesion no valida.");
    error.statusCode = 401;
    throw error;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await deleteSessionByHash(tokenHash);
    const error = new Error("Sesion expirada.");
    error.statusCode = 401;
    throw error;
  }

  const user = await findUserById(session.userId);

  if (!user) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 401;
    throw error;
  }

  return {
    rawToken,
    session,
    user,
  };
}

function requireRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    const error = new Error("No autorizado.");
    error.statusCode = 403;
    throw error;
  }
}

async function logout(rawToken, actorUserId, ipAddress) {
  const tokenHash = hashToken(rawToken, config.tokenSigningKey);
  await deleteSessionByHash(tokenHash);

  await appendAuditEvent({
    type: "auth.logout",
    actorUserId,
    ipAddress,
    createdAt: new Date().toISOString(),
  });
}

module.exports = {
  authenticateRequest,
  bootstrapAdmin,
  login,
  logout,
  requireRole,
  sanitizeUser,
};
