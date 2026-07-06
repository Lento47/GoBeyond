import { writeAuditLog } from "./audit";
import { getClientIp } from "./util";

const defaultAllowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8788",
  "http://127.0.0.1:8788",
]);

export const throttlePolicies = {
  adminUploads: {
    cooldownMs: 15 * 60 * 1000,
    eventType: "security.request.admin_upload",
    maxAttempts: 18,
    message: "Demasiadas cargas recientes. Espera unos minutos antes de subir mas archivos.",
    scope: "user",
    windowMs: 15 * 60 * 1000,
  },
  forgotPassword: {
    cooldownMs: 30 * 60 * 1000,
    eventType: "security.request.forgot_password",
    maxAttempts: 5,
    message: "Demasiadas solicitudes de recuperacion. Intenta de nuevo mas tarde.",
    scope: "ip",
    windowMs: 30 * 60 * 1000,
  },
  publicTestimonial: {
    cooldownMs: 60 * 60 * 1000,
    eventType: "security.request.public_testimonial",
    maxAttempts: 4,
    message: "Demasiados envios recientes. Espera antes de enviar otro testimonio.",
    scope: "ip",
    windowMs: 60 * 60 * 1000,
  },
  register: {
    cooldownMs: 30 * 60 * 1000,
    eventType: "security.request.register",
    maxAttempts: 4,
    message: "Demasiados intentos de registro. Espera unos minutos antes de volver a intentarlo.",
    scope: "ip",
    windowMs: 30 * 60 * 1000,
  },
  sendVerification: {
    cooldownMs: 30 * 60 * 1000,
    eventType: "security.request.send_verification",
    maxAttempts: 5,
    message: "Demasiadas solicitudes de verificacion. Intenta de nuevo mas tarde.",
    scope: "ip",
    windowMs: 30 * 60 * 1000,
  },
  studentChat: {
    cooldownMs: 5 * 60 * 1000,
    eventType: "security.request.student_chat",
    maxAttempts: 18,
    message: "Demasiadas consultas en poco tiempo. Espera un momento antes de seguir usando el asistente.",
    scope: "user",
    windowMs: 5 * 60 * 1000,
  },
  studentTicket: {
    cooldownMs: 10 * 60 * 1000,
    eventType: "security.request.student_ticket",
    maxAttempts: 5,
    message: "Demasiados tickets creados en poco tiempo. Intenta de nuevo mas tarde.",
    scope: "user",
    windowMs: 10 * 60 * 1000,
  },
  studentCourseRequest: {
    cooldownMs: 60 * 60 * 1000,
    eventType: "security.request.student_course_request",
    maxAttempts: 3,
    message: "Demasiadas solicitudes de cursos. Intenta de nuevo mas tarde.",
    scope: "user",
    windowMs: 60 * 60 * 1000,
  },
  studentCommunityThread: {
    cooldownMs: 10 * 60 * 1000,
    eventType: "security.request.student_community_thread",
    maxAttempts: 5,
    message: "Demasiados hilos creados en la comunidad. Intenta de nuevo mas tarde.",
    scope: "user",
    windowMs: 10 * 60 * 1000,
  },
  studentCommunityReply: {
    cooldownMs: 10 * 60 * 1000,
    eventType: "security.request.student_community_reply",
    maxAttempts: 10,
    message: "Demasiadas respuestas en la comunidad. Intenta de nuevo mas tarde.",
    scope: "user",
    windowMs: 10 * 60 * 1000,
  },
};

function getAllowedOrigins(request, env) {
  const originSet = new Set(defaultAllowedOrigins);
  const configuredOrigin = String(env.APP_ORIGIN ?? "").trim();

  if (configuredOrigin) {
    originSet.add(configuredOrigin.replace(/\/+$/, ""));
  }

  try {
    originSet.add(new URL(request.url).origin.replace(/\/+$/, ""));
  } catch {
    // Ignorar URL invalida.
  }

  return originSet;
}

function toThrottleEntityId(request, policy, actorUserId) {
  if (policy.scope === "user" && actorUserId) {
    return `user:${actorUserId}`;
  }

  return `ip:${getClientIp(request)}`;
}

async function countAuditEventsSince(env, eventType, entityId, sinceIso) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE event_type = ?
       AND entity_id = ?
       AND created_at >= ?`
  )
    .bind(eventType, entityId, sinceIso)
    .first();

  return Number(row?.count ?? 0);
}

export function assertTrustedOrigin(request, env) {
  const originHeader = String(request.headers.get("Origin") ?? "").trim();
  if (!originHeader) {
    return;
  }

  const normalizedOrigin = originHeader.replace(/\/+$/, "");
  const allowedOrigins = getAllowedOrigins(request, env);

  if (!allowedOrigins.has(normalizedOrigin)) {
    const error = new Error("Origen no permitido.");
    error.status = 403;
    throw error;
  }
}

export async function readJsonBody(request, { maxBytes = 64_000 } = {}) {
  const raw = await request.clone().text();
  const byteLength = new TextEncoder().encode(raw).length;

  if (byteLength > maxBytes) {
    const error = new Error("Payload demasiado grande.");
    error.status = 413;
    throw error;
  }

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const error = new Error("JSON invalido.");
    error.status = 400;
    throw error;
  }
}

export async function assertBodySize(request, { maxBytes = 64_000 } = {}) {
  const clone = request.clone();
  const buffer = await clone.arrayBuffer();

  if (buffer.byteLength > maxBytes) {
    const error = new Error("Payload demasiado grande.");
    error.status = 413;
    throw error;
  }
}

export async function enforceRequestThrottle(env, request, policy, { actorUserId = null } = {}) {
  const entityId = toThrottleEntityId(request, policy, actorUserId);
  const now = Date.now();
  const blockedSinceIso = new Date(now - policy.cooldownMs).toISOString();
  const windowSinceIso = new Date(now - policy.windowMs).toISOString();

  const recentBlocks = await countAuditEventsSince(env, `${policy.eventType}.blocked`, entityId, blockedSinceIso);
  if (recentBlocks > 0) {
    const error = new Error(policy.message);
    error.status = 429;
    throw error;
  }

  const recentAttempts = await countAuditEventsSince(env, policy.eventType, entityId, windowSinceIso);
  if (recentAttempts >= policy.maxAttempts) {
    await writeAuditLog(env, {
      actorUserId,
      ipAddress: getClientIp(request),
      eventType: `${policy.eventType}.blocked`,
      entityType: "rate_limit",
      entityId,
      detailsJson: {
        maxAttempts: policy.maxAttempts,
        windowMs: policy.windowMs,
      },
    });

    const error = new Error(policy.message);
    error.status = 429;
    throw error;
  }

  return entityId;
}

export async function recordRequestAttempt(env, request, policy, { actorUserId = null, detailsJson = null } = {}) {
  const entityId = toThrottleEntityId(request, policy, actorUserId);

  await writeAuditLog(env, {
    actorUserId,
    ipAddress: getClientIp(request),
    eventType: policy.eventType,
    entityType: "rate_limit",
    entityId,
    detailsJson,
  });

  return entityId;
}

export async function countRecentAuditEvents(env, eventType, entityId, windowMs) {
  const sinceIso = new Date(Date.now() - windowMs).toISOString();
  return countAuditEventsSince(env, eventType, entityId, sinceIso);
}
