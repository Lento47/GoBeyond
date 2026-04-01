import { hashPassword, randomHex, sha256, verifyPassword } from "./crypto";
import { writeAuditLog } from "./audit";
import { createId, getClientIp, nowIso } from "./util";
import {
  validateAccountStatus,
  validateEmail,
  validatePassword,
  validateRequiredString,
  validateRole,
} from "./validation";

const SESSION_HOURS = 12;

async function createSessionForUser(request, env, user) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const sessionId = createId("session");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(sessionId, user.id, tokenHash, expiresAt, nowIso())
    .run();

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress: getClientIp(request),
    eventType: "auth.login",
    entityType: "session",
    entityId: sessionId,
  });

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name ?? user.fullName,
      role: user.role,
      status: user.status ?? "active",
    },
  };
}

export async function bootstrapAdmin(request, env, body) {
  if (!env.BOOTSTRAP_SECRET) {
    throw new Error("BOOTSTRAP_SECRET no esta configurado.");
  }

  if (body.setupSecret !== env.BOOTSTRAP_SECRET) {
    const error = new Error("Bootstrap secret invalido.");
    error.status = 403;
    throw error;
  }

  const existingAdmin = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
  ).first();

  if (Number(existingAdmin?.count ?? 0) > 0) {
    const error = new Error("Ya existe un administrador.");
    error.status = 409;
    throw error;
  }

  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const fullName = validateRequiredString(body.fullName, "Nombre completo", 255);
  const passwordData = await hashPassword(password);
  const userId = createId("user");

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, full_name, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?)`
  )
    .bind(userId, email, passwordData.hash, passwordData.salt, fullName, nowIso())
    .run();

  await writeAuditLog(env, {
    actorUserId: userId,
    ipAddress: getClientIp(request),
    eventType: "auth.bootstrap_admin",
    entityType: "user",
    entityId: userId,
  });

  return {
    user: {
      id: userId,
      email,
      fullName,
      role: "admin",
    },
  };
}

export async function login(request, env, body) {
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const user = await env.DB.prepare(
    "SELECT id, email, full_name, role, COALESCE(status, 'active') AS status, password_hash, password_salt FROM users WHERE email = ? LIMIT 1"
  )
    .bind(email)
    .first();

  if (!user) {
    const error = new Error("Credenciales invalidas.");
    error.status = 401;
    throw error;
  }

  const valid = await verifyPassword(password, user.password_salt, user.password_hash);

  if (!valid) {
    const error = new Error("Credenciales invalidas.");
    error.status = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("La cuenta esta deshabilitada.");
    error.status = 403;
    throw error;
  }

  return createSessionForUser(request, env, user);
}

export async function registerStudent(request, env, body) {
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const fullName = validateRequiredString(body.fullName, "Nombre completo", 255);

  const existingUser = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ? LIMIT 1"
  )
    .bind(email)
    .first();

  if (existingUser) {
    const error = new Error("Ya existe una cuenta con este correo.");
    error.status = 409;
    throw error;
  }

  const passwordData = await hashPassword(password);
  const user = {
    id: createId("user"),
    email,
    full_name: fullName,
    role: "student",
    status: "active",
  };

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, full_name, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'student', 'active', ?)`
  )
    .bind(user.id, email, passwordData.hash, passwordData.salt, fullName, nowIso())
    .run();

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress: getClientIp(request),
    eventType: "auth.student_register",
    entityType: "user",
    entityId: user.id,
  });

  return createSessionForUser(request, env, user);
}

export async function requireAuth(request, env, allowedRoles = []) {
  const authorization = request.headers.get("Authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    const error = new Error("Autenticacion requerida.");
    error.status = 401;
    throw error;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const tokenHash = await sha256(token);

  const session = await env.DB.prepare(
    `SELECT s.id, s.user_id, s.expires_at, u.email, u.full_name, u.role, COALESCE(u.status, 'active') AS status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?
     LIMIT 1`
  )
    .bind(tokenHash)
    .first();

  if (!session) {
    const error = new Error("Sesion no valida.");
    error.status = 401;
    throw error;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(session.id).run();
    const error = new Error("Sesion expirada.");
    error.status = 401;
    throw error;
  }

  if ((session.status ?? "active") !== "active") {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(session.id).run();
    const error = new Error("La cuenta esta deshabilitada.");
    error.status = 403;
    throw error;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    const error = new Error("No autorizado.");
    error.status = 403;
    throw error;
  }

  return {
    tokenHash,
    sessionId: session.id,
    user: {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      role: session.role,
      status: session.status ?? "active",
    },
  };
}

export async function logout(request, env, auth) {
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(auth.tokenHash).run();

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "auth.logout",
    entityType: "session",
    entityId: auth.sessionId,
  });
}

export async function createManagedUser(request, env, auth, body) {
  const email = validateEmail(body.email);
  const password = validatePassword(body.password);
  const fullName = validateRequiredString(body.fullName, "Nombre completo", 255);
  const role = validateRole(body.role);
  const status = validateAccountStatus(body.status ?? "active");

  const existingUser = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ? LIMIT 1"
  )
    .bind(email)
    .first();

  if (existingUser) {
    const error = new Error("Ya existe una cuenta con este correo.");
    error.status = 409;
    throw error;
  }

  const passwordData = await hashPassword(password);
  const userId = createId("user");

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, full_name, role, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(userId, email, passwordData.hash, passwordData.salt, fullName, role, status, nowIso())
    .run();

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_create",
    entityType: "user",
    entityId: userId,
    detailsJson: { role, status },
  });

  return {
    id: userId,
    email,
    fullName,
    role,
    status,
  };
}
