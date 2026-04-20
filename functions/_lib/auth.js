import { hashPassword, randomHex, sha256, verifyPassword } from "./crypto";
import { writeAuditLog } from "./audit";
import { getPasswordExpiresAt, getSecuritySettings, isPasswordExpired } from "./security";
import { createId, getClientIp, nowIso } from "./util";
import {
  validateAccountStatus,
  validateEmail,
  validatePassword,
  validateRequiredString,
  validateRole,
} from "./validation";

const SESSION_HOURS = 12;
const PASSWORD_RESET_MINUTES = 30;
const EMAIL_VERIFICATION_MINUTES = 24 * 60;
const PASSWORD_RESET_MESSAGE =
  "Si la cuenta existe y esta activa, enviaremos un enlace seguro de restablecimiento al correo registrado.";
const EMAIL_VERIFICATION_MESSAGE =
  "Tu cuenta necesita verificacion. Te enviamos un enlace seguro al correo registrado para activarla.";
const EMAIL_VERIFICATION_REQUEST_MESSAGE =
  "Si la cuenta existe, esta activa y aun no ha sido verificada, enviaremos un nuevo enlace seguro al correo registrado.";

function getAppOrigin(request, env) {
  const fallbackOrigin = new URL(request.url).origin;
  const configuredOrigin = String(env.APP_ORIGIN ?? fallbackOrigin).trim();
  return (configuredOrigin || fallbackOrigin).replace(/\/+$/, "");
}

function isLocalOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolveResendTemplateId(env, type) {
  if (type === "email-verification") {
    return String(env.RESEND_TEMPLATE_VERIFY ?? env.RESEND_TEMPLATE_AUTH ?? "").trim();
  }

  if (type === "password-reset") {
    return String(env.RESEND_TEMPLATE_RESET ?? env.RESEND_TEMPLATE_AUTH ?? "").trim();
  }

  return String(env.RESEND_TEMPLATE_AUTH ?? "").trim();
}

async function purgeExpiredPasswordResetTokens(env) {
  await env.DB.prepare(
    "DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at < ?"
  )
    .bind(nowIso())
    .run();
}

async function purgeExpiredEmailVerificationTokens(env) {
  await env.DB.prepare(
    "DELETE FROM email_verification_tokens WHERE used_at IS NOT NULL OR expires_at < ?"
  )
    .bind(nowIso())
    .run();
}

function passwordExpiredMessage() {
  const error = new Error("La contrasena expiro. Solicita un enlace de recuperacion o contacta a administracion.");
  error.status = 403;
  return error;
}

function verificationRequiredMessage(supportEmail) {
  const contactHint = supportEmail ? ` Si necesitas ayuda, escribe a ${supportEmail}.` : "";
  const error = new Error(`Debes verificar tu cuenta desde el enlace enviado a tu correo antes de ingresar.${contactHint}`);
  error.status = 403;
  return error;
}

async function validatePasswordState(request, env, user, { sessionId = null, eventType = "auth.password_expired" } = {}) {
  const settings = await getSecuritySettings(env);
  const passwordChangedAt = user.password_changed_at ?? user.passwordChangedAt ?? user.created_at ?? user.createdAt ?? nowIso();
  const passwordExpiresAt = getPasswordExpiresAt(passwordChangedAt, settings);

  if (!isPasswordExpired(passwordChangedAt, settings)) {
    return {
      passwordChangedAt,
      passwordExpiresAt,
      settings,
    };
  }

  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress: getClientIp(request),
    eventType,
    entityType: "user",
    entityId: user.id,
    detailsJson: {
      email: user.email,
      passwordExpiresAt,
    },
  });

  throw passwordExpiredMessage();
}

async function validateVerificationState(request, env, user, { sessionId = null, eventType = "auth.email_verification_required" } = {}) {
  const settings = await getSecuritySettings(env);
  if (!settings.requireEmailVerification) {
    return { settings };
  }

  const emailVerifiedAt = user.email_verified_at ?? user.emailVerifiedAt ?? null;
  if (emailVerifiedAt) {
    return { settings, emailVerifiedAt };
  }

  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress: getClientIp(request),
    eventType,
    entityType: "user",
    entityId: user.id,
    detailsJson: {
      email: user.email,
      supportEmail: settings.supportEmail,
    },
  });

  throw verificationRequiredMessage(settings.supportEmail);
}

async function sendTransactionalAuthEmail(request, env, user, payload) {
  const settings = await getSecuritySettings(env);
  const resendApiKey = String(env.RESEND_API_KEY ?? "").trim();
  const resendTemplateId = resolveResendTemplateId(env, payload.type);
  const webhookUrl = String(env.AUTH_EMAIL_WEBHOOK_URL ?? env.RESET_EMAIL_WEBHOOK_URL ?? "").trim();
  const fromAddress = String(env.EMAIL_FROM_ADDRESS ?? settings.supportEmail ?? "it@gobeyondcr.org").trim();
  const fromName = String(env.EMAIL_FROM_NAME ?? "GoBeyond IT").trim();
  const replyTo = String(env.EMAIL_REPLY_TO ?? settings.supportEmail ?? fromAddress).trim();

  if (!resendApiKey && !webhookUrl) {
    return {
      delivered: false,
      mode: isLocalOrigin(getAppOrigin(request, env)) ? "debug" : "not_configured",
    };
  }

  if (resendApiKey) {
    const resendPayload = resendTemplateId
      ? {
          from: `${fromName} <${fromAddress}>`,
          to: [user.email],
          reply_to: replyTo,
          subject: payload.subject,
          template: {
            id: resendTemplateId,
            variables: {
              RECIPIENT_NAME: user.full_name ?? user.fullName ?? "GoBeyond",
              ACTION_URL: payload.actionUrl ?? "",
              ACTION_LABEL: payload.actionLabel ?? "Abrir enlace",
              SUPPORT_EMAIL: settings.supportEmail ?? replyTo,
              EXPIRATION_LABEL: payload.expirationLabel ?? "",
              SUBJECT_LINE: payload.subject,
              BODY_INTRO: payload.bodyIntro ?? "",
              BODY_OUTRO: payload.bodyOutro ?? "",
              COMPANY_NAME: "GoBeyond",
            },
          },
        }
      : {
          from: `${fromName} <${fromAddress}>`,
          reply_to: replyTo,
          to: [user.email],
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resendResponse.ok) {
      const resendBody = await resendResponse.text().catch(() => "");
      const error = new Error(
        resendBody
          ? `No se pudo enviar el correo transaccional con Resend: ${resendBody}`
          : "No se pudo enviar el correo transaccional con Resend."
      );
      error.status = 503;
      throw error;
    }

    return {
      delivered: true,
      mode: "resend",
    };
  }

  const webhookSecret = String(env.AUTH_EMAIL_WEBHOOK_SECRET ?? env.RESET_EMAIL_WEBHOOK_SECRET ?? "").trim();

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      replyTo,
      to: user.email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      metadata: {
        userId: user.id,
        role: user.role,
        appOrigin: getAppOrigin(request, env),
        type: payload.type,
      },
    }),
  });

  if (!response.ok) {
    const error = new Error("No se pudo enviar el correo transaccional.");
    error.status = 503;
    throw error;
  }

  return {
    delivered: true,
    mode: "webhook",
  };
}

async function sendPasswordResetEmail(request, env, user, resetUrl) {
  return sendTransactionalAuthEmail(request, env, user, {
    type: "password-reset",
    subject: "Restablece tu contrasena de GoBeyond",
    actionUrl: resetUrl,
    actionLabel: "Restablecer contrasena",
    expirationLabel: `${PASSWORD_RESET_MINUTES} minutos`,
    bodyIntro: "Recibimos una solicitud para restablecer la contrasena de tu cuenta.",
    bodyOutro: "Si no solicitaste este cambio, puedes ignorar este mensaje.",
    text: [
      `Hola ${user.full_name ?? user.fullName ?? "GoBeyond"},`,
      "",
      "Recibimos una solicitud para restablecer la contrasena de tu cuenta.",
      "Si fuiste tu, abre este enlace seguro:",
      resetUrl,
      "",
      `El enlace expirara en ${PASSWORD_RESET_MINUTES} minutos y solo puede usarse una vez.`,
      "Si no solicitaste este cambio, puedes ignorar este mensaje.",
    ].join("\n"),
    html: `
      <p>Hola ${user.full_name ?? user.fullName ?? "GoBeyond"},</p>
      <p>Recibimos una solicitud para restablecer la contrasena de tu cuenta.</p>
      <p>Si fuiste tu, abre este enlace seguro:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>El enlace expirara en ${PASSWORD_RESET_MINUTES} minutos y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
    `,
  });
}

async function sendVerificationEmail(request, env, user, verificationUrl) {
  return sendTransactionalAuthEmail(request, env, user, {
    type: "email-verification",
    subject: "Verifica tu cuenta de GoBeyond",
    actionUrl: verificationUrl,
    actionLabel: "Activar cuenta",
    expirationLabel: `${Math.round(EMAIL_VERIFICATION_MINUTES / 60)} horas`,
    bodyIntro: "Para activar tu cuenta, abre este enlace de verificacion.",
    bodyOutro: "",
    text: [
      `Hola ${user.full_name ?? user.fullName ?? "GoBeyond"},`,
      "",
      "Para activar tu cuenta, abre este enlace de verificacion:",
      verificationUrl,
      "",
      `El enlace expirara en ${Math.round(EMAIL_VERIFICATION_MINUTES / 60)} horas y solo puede usarse una vez.`,
    ].join("\n"),
    html: `
      <p>Hola ${user.full_name ?? user.fullName ?? "GoBeyond"},</p>
      <p>Para activar tu cuenta, abre este enlace de verificacion:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>El enlace expirara en ${Math.round(EMAIL_VERIFICATION_MINUTES / 60)} horas y solo puede usarse una vez.</p>
    `,
  });
}

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
  const passwordChangedAt = nowIso();
  const emailVerifiedAt = nowIso();

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, full_name, role, status, created_at, password_changed_at, email_verified_at)
     VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?, ?, ?)`
  )
    .bind(userId, email, passwordData.hash, passwordData.salt, fullName, passwordChangedAt, passwordChangedAt, emailVerifiedAt)
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
    "SELECT id, email, full_name, role, COALESCE(status, 'active') AS status, password_hash, password_salt, COALESCE(password_changed_at, created_at) AS password_changed_at, email_verified_at FROM users WHERE email = ? LIMIT 1"
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

  await validateVerificationState(request, env, user, {
    eventType: "auth.email_verification_login_blocked",
  });

  await validatePasswordState(request, env, user, {
    eventType: "auth.password_expired_login_blocked",
  });

  return createSessionForUser(request, env, user);
}

export async function registerStudent(request, env, body) {
  const settings = await getSecuritySettings(env);
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
  const passwordChangedAt = nowIso();
  const emailVerifiedAt = settings.requireEmailVerification ? null : nowIso();
  const user = {
    id: createId("user"),
    email,
    full_name: fullName,
    role: "student",
    status: "active",
    password_changed_at: passwordChangedAt,
    email_verified_at: emailVerifiedAt,
  };

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, full_name, role, status, created_at, password_changed_at, email_verified_at)
     VALUES (?, ?, ?, ?, ?, 'student', 'active', ?, ?, ?)`
  )
    .bind(user.id, email, passwordData.hash, passwordData.salt, fullName, passwordChangedAt, passwordChangedAt, emailVerifiedAt)
    .run();

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress: getClientIp(request),
    eventType: "auth.student_register",
    entityType: "user",
    entityId: user.id,
  });

  if (!settings.requireEmailVerification) {
    return createSessionForUser(request, env, user);
  }

  try {
    const delivery = await issueVerificationForUser(request, env, user);

    if (delivery.deliveryMode === "not_configured") {
      await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(user.id).run();
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();
      const error = new Error("No hay un proveedor de correo configurado para verificar cuentas nuevas.");
      error.status = 503;
      throw error;
    }

    return {
      requiresVerification: true,
      message: EMAIL_VERIFICATION_MESSAGE,
      ...(delivery.deliveryMode === "debug" ? { debugVerificationUrl: delivery.verificationUrl } : {}),
    };
  } catch (verificationError) {
    await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();
    throw verificationError;
  }
}

async function issuePasswordResetForUser(request, env, user) {
  const ipAddress = getClientIp(request);
  const appOrigin = getAppOrigin(request, env);

  await purgeExpiredPasswordResetTokens(env);
  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(user.id).run();

  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const resetId = createId("reset");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000).toISOString();
  const resetUrl = `${appOrigin}/reset-password?token=${encodeURIComponent(token)}`;

  await env.DB.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, requested_ip, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?)`
  )
    .bind(resetId, user.id, tokenHash, expiresAt, ipAddress, nowIso())
    .run();

  const delivery = await sendPasswordResetEmail(request, env, user, resetUrl);

  return {
    deliveryMode: delivery.mode,
    expiresAt,
    resetUrl,
  };
}

async function issueVerificationForUser(request, env, user) {
  const ipAddress = getClientIp(request);
  const appOrigin = getAppOrigin(request, env);

  await purgeExpiredEmailVerificationTokens(env);
  await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(user.id).run();

  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const verificationId = createId("verify");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_MINUTES * 60 * 1000).toISOString();
  const verificationUrl = `${appOrigin}/verify-account?token=${encodeURIComponent(token)}`;

  await env.DB.prepare(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, used_at, requested_ip, created_at)
     VALUES (?, ?, ?, ?, NULL, ?, ?)`
  )
    .bind(verificationId, user.id, tokenHash, expiresAt, ipAddress, nowIso())
    .run();

  const delivery = await sendVerificationEmail(request, env, user, verificationUrl);

  return {
    deliveryMode: delivery.mode,
    expiresAt,
    verificationUrl,
  };
}

export async function requestPasswordReset(request, env, body) {
  const email = validateEmail(body.email);
  const ipAddress = getClientIp(request);

  await purgeExpiredPasswordResetTokens(env);

  const user = await env.DB.prepare(
    `SELECT id, email, full_name, role, COALESCE(status, 'active') AS status
     FROM users
     WHERE email = ?
     LIMIT 1`
  )
    .bind(email)
    .first();

  if (!user || user.status !== "active") {
    await writeAuditLog(env, {
      actorUserId: user?.id ?? null,
      ipAddress,
      eventType: "auth.password_reset_requested",
      entityType: "user",
      entityId: user?.id ?? null,
      detailsJson: {
        email,
        outcome: "ignored",
      },
    });

    return {
      ok: true,
      message: PASSWORD_RESET_MESSAGE,
    };
  }

  let deliveryMode = "not_configured";
  let expiresAt = null;
  let resetUrl = "";

  try {
    const delivery = await issuePasswordResetForUser(request, env, user);
    deliveryMode = delivery.deliveryMode;
    expiresAt = delivery.expiresAt;
    resetUrl = delivery.resetUrl;
    if (deliveryMode === "not_configured") {
      await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(user.id).run();
    }
  } catch (deliveryError) {
    await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(user.id).run();
    await writeAuditLog(env, {
      actorUserId: user.id,
      ipAddress,
      eventType: "auth.password_reset_delivery_failed",
      entityType: "user",
      entityId: user.id,
      detailsJson: {
        email: user.email,
        message: deliveryError.message,
      },
    });
  }

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress,
    eventType: "auth.password_reset_requested",
    entityType: "user",
    entityId: user.id,
    detailsJson: {
      email: user.email,
      expiresAt,
      deliveryMode,
    },
  });

  return {
    ok: true,
    message: PASSWORD_RESET_MESSAGE,
    ...(deliveryMode === "debug" ? { debugResetUrl: resetUrl } : {}),
  };
}

export async function requestEmailVerification(request, env, body) {
  const email = validateEmail(body.email);
  const ipAddress = getClientIp(request);

  await purgeExpiredEmailVerificationTokens(env);

  const user = await env.DB.prepare(
    `SELECT id, email, full_name, role, COALESCE(status, 'active') AS status, email_verified_at
     FROM users
     WHERE email = ?
     LIMIT 1`
  )
    .bind(email)
    .first();

  if (!user || user.status !== "active" || user.email_verified_at) {
    await writeAuditLog(env, {
      actorUserId: user?.id ?? null,
      ipAddress,
      eventType: "auth.email_verification_requested",
      entityType: "user",
      entityId: user?.id ?? null,
      detailsJson: {
        email,
        outcome: "ignored",
      },
    });

    return {
      ok: true,
      message: EMAIL_VERIFICATION_REQUEST_MESSAGE,
    };
  }

  let deliveryMode = "not_configured";
  let expiresAt = null;
  let verificationUrl = "";

  try {
    const delivery = await issueVerificationForUser(request, env, user);
    deliveryMode = delivery.deliveryMode;
    expiresAt = delivery.expiresAt;
    verificationUrl = delivery.verificationUrl;

    if (deliveryMode === "not_configured") {
      await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(user.id).run();
    }
  } catch (deliveryError) {
    await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(user.id).run();
    await writeAuditLog(env, {
      actorUserId: user.id,
      ipAddress,
      eventType: "auth.email_verification_delivery_failed",
      entityType: "user",
      entityId: user.id,
      detailsJson: {
        email: user.email,
        message: deliveryError.message,
      },
    });
    throw deliveryError;
  }

  await writeAuditLog(env, {
    actorUserId: user.id,
    ipAddress,
    eventType: "auth.email_verification_requested",
    entityType: "user",
    entityId: user.id,
    detailsJson: {
      email: user.email,
      expiresAt,
      deliveryMode,
    },
  });

  return {
    ok: true,
    message: EMAIL_VERIFICATION_REQUEST_MESSAGE,
    ...(deliveryMode === "debug" ? { debugVerificationUrl: verificationUrl } : {}),
  };
}

export async function resetPasswordWithToken(request, env, body) {
  const token = validateRequiredString(body.token, "Token de recuperacion", 512);
  const password = validatePassword(body.password);
  const tokenHash = await sha256(token);
  const ipAddress = getClientIp(request);

  await purgeExpiredPasswordResetTokens(env);

  const resetRecord = await env.DB.prepare(
    `SELECT prt.id, prt.user_id, prt.expires_at, u.email, u.full_name, u.role, COALESCE(u.status, 'active') AS status
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token_hash = ?
       AND prt.used_at IS NULL
     LIMIT 1`
  )
    .bind(tokenHash)
    .first();

  if (!resetRecord || resetRecord.status !== "active") {
    const error = new Error("El enlace de recuperacion no es valido o ya expiro.");
    error.status = 400;
    throw error;
  }

  if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM password_reset_tokens WHERE id = ?").bind(resetRecord.id).run();
    const error = new Error("El enlace de recuperacion no es valido o ya expiro.");
    error.status = 400;
    throw error;
  }

  const passwordData = await hashPassword(password);
  const usedAt = nowIso();

  await env.DB.prepare(
    "UPDATE users SET password_hash = ?, password_salt = ?, password_changed_at = ? WHERE id = ?"
  )
    .bind(passwordData.hash, passwordData.salt, usedAt, resetRecord.user_id)
    .run();

  await env.DB.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?")
    .bind(usedAt, resetRecord.id)
    .run();

  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?")
    .bind(resetRecord.user_id)
    .run();

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?")
    .bind(resetRecord.user_id)
    .run();

  await writeAuditLog(env, {
    actorUserId: resetRecord.user_id,
    ipAddress,
    eventType: "auth.password_reset_completed",
    entityType: "user",
    entityId: resetRecord.user_id,
    detailsJson: {
      email: resetRecord.email,
    },
  });

  return {
    ok: true,
    message: "Contrasena actualizada. Ya puedes ingresar con tu nueva clave.",
  };
}

export async function verifyEmailWithToken(request, env, body) {
  const token = validateRequiredString(body.token, "Token de verificacion", 512);
  const tokenHash = await sha256(token);
  const ipAddress = getClientIp(request);

  await purgeExpiredEmailVerificationTokens(env);

  const verificationRecord = await env.DB.prepare(
    `SELECT evt.id, evt.user_id, evt.expires_at, u.email, u.full_name, u.role, COALESCE(u.status, 'active') AS status
     FROM email_verification_tokens evt
     JOIN users u ON u.id = evt.user_id
     WHERE evt.token_hash = ?
       AND evt.used_at IS NULL
     LIMIT 1`
  )
    .bind(tokenHash)
    .first();

  if (!verificationRecord || verificationRecord.status !== "active") {
    const error = new Error("El enlace de verificacion no es valido o ya expiro.");
    error.status = 400;
    throw error;
  }

  if (new Date(verificationRecord.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM email_verification_tokens WHERE id = ?").bind(verificationRecord.id).run();
    const error = new Error("El enlace de verificacion no es valido o ya expiro.");
    error.status = 400;
    throw error;
  }

  const verifiedAt = nowIso();

  await env.DB.prepare("UPDATE users SET email_verified_at = ? WHERE id = ?")
    .bind(verifiedAt, verificationRecord.user_id)
    .run();

  await env.DB.prepare("UPDATE email_verification_tokens SET used_at = ? WHERE id = ?")
    .bind(verifiedAt, verificationRecord.id)
    .run();

  await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?")
    .bind(verificationRecord.user_id)
    .run();

  await writeAuditLog(env, {
    actorUserId: verificationRecord.user_id,
    ipAddress,
    eventType: "auth.email_verified",
    entityType: "user",
    entityId: verificationRecord.user_id,
    detailsJson: {
      email: verificationRecord.email,
    },
  });

  return {
    ok: true,
    message: "Cuenta verificada. Ya puedes ingresar a GoBeyond.",
  };
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
    `SELECT s.id, s.user_id, s.expires_at, u.email, u.full_name, u.role, COALESCE(u.status, 'active') AS status, COALESCE(u.password_changed_at, u.created_at) AS password_changed_at, u.email_verified_at
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

  await validateVerificationState(request, env, {
    id: session.user_id,
    email: session.email,
    email_verified_at: session.email_verified_at,
  }, {
    sessionId: session.id,
    eventType: "auth.email_verification_session_blocked",
  });

  await validatePasswordState(request, env, {
    id: session.user_id,
    email: session.email,
    password_changed_at: session.password_changed_at,
  }, {
    sessionId: session.id,
    eventType: "auth.password_expired_session_blocked",
  });

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
  const settings = await getSecuritySettings(env);
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
  const passwordChangedAt = nowIso();
  const emailVerifiedAt = settings.requireEmailVerification && role === "student" ? null : nowIso();

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, full_name, role, status, created_at, password_changed_at, email_verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(userId, email, passwordData.hash, passwordData.salt, fullName, role, status, passwordChangedAt, passwordChangedAt, emailVerifiedAt)
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

export async function adminSetManagedUserPassword(request, env, auth, userId, body) {
  const settings = await getSecuritySettings(env);
  if (!settings.allowAdminPasswordChange) {
    const error = new Error("La politica actual no permite que administracion cambie contrasenas manualmente.");
    error.status = 403;
    throw error;
  }

  const password = validatePassword(body.password);
  const user = await env.DB.prepare(
    "SELECT id, email, full_name, role, COALESCE(status, 'active') AS status FROM users WHERE id = ? LIMIT 1"
  )
    .bind(userId)
    .first();

  if (!user) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  const passwordData = await hashPassword(password);
  const passwordChangedAt = nowIso();

  await env.DB.prepare(
    "UPDATE users SET password_hash = ?, password_salt = ?, password_changed_at = ? WHERE id = ?"
  )
    .bind(passwordData.hash, passwordData.salt, passwordChangedAt, userId)
    .run();

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_password_changed",
    entityType: "user",
    entityId: userId,
    detailsJson: {
      email: user.email,
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    passwordChangedAt,
  };
}

export async function adminSendManagedUserPasswordReset(request, env, auth, userId) {
  const settings = await getSecuritySettings(env);
  if (!settings.allowAdminResetNotification) {
    const error = new Error("La politica actual no permite enviar enlaces de recuperacion desde administracion.");
    error.status = 403;
    throw error;
  }

  const user = await env.DB.prepare(
    "SELECT id, email, full_name, role, COALESCE(status, 'active') AS status FROM users WHERE id = ? LIMIT 1"
  )
    .bind(userId)
    .first();

  if (!user) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Solo puedes enviar recuperacion a cuentas activas.");
    error.status = 409;
    throw error;
  }

  const delivery = await issuePasswordResetForUser(request, env, user);

  if (delivery.deliveryMode === "not_configured") {
    await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(user.id).run();
    const error = new Error("No hay un proveedor de correo configurado para enviar el enlace de recuperacion.");
    error.status = 409;
    throw error;
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_password_reset_notification",
    entityType: "user",
    entityId: userId,
    detailsJson: {
      email: user.email,
      deliveryMode: delivery.deliveryMode,
      expiresAt: delivery.expiresAt,
    },
  });

  return {
    ok: true,
    message:
      delivery.deliveryMode === "debug"
        ? `Enlace generado en modo local: ${delivery.resetUrl}`
        : "Enlace de recuperacion enviado al correo del usuario.",
  };
}

export async function adminSendManagedUserVerification(request, env, auth, userId) {
  const settings = await getSecuritySettings(env);
  if (!settings.allowAdminVerificationNotification) {
    const error = new Error("La politica actual no permite enviar enlaces de verificacion desde administracion.");
    error.status = 403;
    throw error;
  }

  const user = await env.DB.prepare(
    "SELECT id, email, full_name, role, COALESCE(status, 'active') AS status, email_verified_at FROM users WHERE id = ? LIMIT 1"
  )
    .bind(userId)
    .first();

  if (!user) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Solo puedes enviar verificacion a cuentas activas.");
    error.status = 409;
    throw error;
  }

  if (user.email_verified_at) {
    const error = new Error("La cuenta ya esta verificada.");
    error.status = 409;
    throw error;
  }

  const delivery = await issueVerificationForUser(request, env, user);

  if (delivery.deliveryMode === "not_configured") {
    await env.DB.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").bind(user.id).run();
    const error = new Error("No hay un proveedor de correo configurado para enviar la verificacion.");
    error.status = 409;
    throw error;
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_verification_notification",
    entityType: "user",
    entityId: userId,
    detailsJson: {
      email: user.email,
      deliveryMode: delivery.deliveryMode,
      expiresAt: delivery.expiresAt,
    },
  });

  return {
    ok: true,
    message:
      delivery.deliveryMode === "debug"
        ? `Enlace de verificacion generado en modo local: ${delivery.verificationUrl}`
        : "Enlace de verificacion enviado al correo del usuario.",
  };
}
