import { writeAuditLog } from "./audit";
import { getAppOrigin, sendTransactionalEmail } from "./email";
import { createId, getClientIp, nowIso, parseJsonOrNull } from "./util";
import { validateRequiredString } from "./validation";

const COURSE_ENROLLMENT_KIND = "course-enrollment";
const COURSE_ENROLLMENT_CTA_PATH = "/portal#portal-courses";
const SOP_CHANGE_RESOLVED_KIND = "sop-change-resolved";
const SOP_CHANGE_RESOLVED_CTA_PATH = "/teacher#teacher-sops";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isMissingNotificationsTableError(requestError) {
  return String(requestError?.message ?? "").includes("no such table: user_notifications");
}

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    ctaPath: row.cta_path ?? "",
    metadata: row.metadata_json ? parseJsonOrNull(row.metadata_json) ?? {} : {},
    emailSentAt: row.email_sent_at ?? null,
    emailFailedAt: row.email_failed_at ?? null,
    portalSeenAt: row.portal_seen_at ?? null,
    createdAt: row.created_at,
  };
}

function toPortalBanner(notification) {
  if (!notification) {
    return null;
  }

  return {
    id: notification.id,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    ctaPath: notification.ctaPath,
    metadata: notification.metadata,
  };
}

function formatDateLabel(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function hasExplicitProtocol(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(String(value ?? ""));
}

function resolveAbsoluteUrl(value, origin) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  if (hasExplicitProtocol(raw)) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${String(origin ?? "").replace(/\/+$/, "")}${raw}`;
  }

  return raw;
}

function resolveCourseImageUrl(course, origin) {
  if (!course || typeof course !== "object") {
    return "";
  }

  return (
    resolveAbsoluteUrl(course.coverImage, origin) ||
    resolveAbsoluteUrl(course.image, origin) ||
    resolveAbsoluteUrl(course.thumbnail, origin) ||
    ""
  );
}

function buildCoursePortalUrl(origin, courseId) {
  const normalizedOrigin = String(origin ?? "").replace(/\/+$/, "");
  const normalizedCourseId = String(courseId ?? "").trim();

  if (!normalizedCourseId) {
    return `${normalizedOrigin}${COURSE_ENROLLMENT_CTA_PATH}`;
  }

  return `${normalizedOrigin}/portal?course=${encodeURIComponent(normalizedCourseId)}#portal-courses`;
}

async function getNotificationById(env, notificationId) {
  const row = await env.DB.prepare(
    `SELECT id, user_id, kind, title, body, cta_path, metadata_json,
            email_sent_at, email_failed_at, portal_seen_at, created_at
     FROM user_notifications
     WHERE id = ?
     LIMIT 1`
  )
    .bind(notificationId)
    .first();

  return row ? mapNotification(row) : null;
}

async function createUserNotification(env, payload) {
  const notificationId = createId("notification");

  await env.DB.prepare(
    `INSERT INTO user_notifications (
       id,
       user_id,
       kind,
       title,
       body,
       cta_path,
       metadata_json,
       email_sent_at,
       email_failed_at,
       portal_seen_at,
       created_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, CURRENT_TIMESTAMP)`
  )
    .bind(
      notificationId,
      payload.userId,
      payload.kind,
      payload.title,
      payload.body,
      payload.ctaPath ?? null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    )
    .run();

  return getNotificationById(env, notificationId);
}

async function markNotificationEmailOutcome(env, notificationId, field) {
  const column = field === "sent" ? "email_sent_at" : "email_failed_at";
  await env.DB.prepare(`UPDATE user_notifications SET ${column} = ? WHERE id = ?`)
    .bind(nowIso(), notificationId)
    .run();
}

function buildEnrollmentNotificationContent(courseTitle, accessExpiresAt) {
  const expiresLabel = formatDateLabel(accessExpiresAt);
  const expirySentence = expiresLabel
    ? ` Su acceso actual estara habilitado hasta el ${expiresLabel}.`
    : "";

  return {
    title: `Has sido agregado a ${courseTitle}`,
    body: `Ya puedes ingresar al curso desde tu portal academico.${expirySentence}`.trim(),
  };
}

function buildEnrollmentEmailPayload(user, courseTitle, accessExpiresAt, portalUrl, courseUrl, courseImageUrl = "") {
  const recipientName = user.full_name ?? user.fullName ?? "estudiante";
  const safeCourseTitle = escapeHtml(courseTitle);
  const expiresLabel = formatDateLabel(accessExpiresAt);
  const expirationSentence = expiresLabel ? `Tu acceso vence el ${expiresLabel}.` : "Tu acceso ya se encuentra habilitado.";

  return {
    type: COURSE_ENROLLMENT_KIND,
    subject: `Ya tienes acceso a ${courseTitle} en GoBeyond`,
    actionUrl: courseUrl,
    actionLabel: "Entrar al curso",
    bodyIntro: `Has sido agregado al curso ${courseTitle}.`,
    bodyOutro: expirationSentence,
    metadata: {
      courseTitle,
      portalUrl,
      courseUrl,
      courseImageUrl,
    },
    templateVariables: {
      COURSE_TITLE: courseTitle,
      PORTAL_URL: portalUrl,
      COURSE_URL: courseUrl,
      ACCESS_EXPIRES_AT: expiresLabel,
      COURSE_IMAGE_URL: courseImageUrl,
      COURSE_IMAGE: courseImageUrl,
    },
    text: [
      `Hola ${recipientName},`,
      "",
      `Has sido agregado al curso "${courseTitle}" en GoBeyond.`,
      expirationSentence,
      "",
      "Ingresa a tu portal para revisar materiales, fechas y asignaciones:",
      courseUrl,
    ].join("\n"),
    html: [
      `<p>Hola ${escapeHtml(recipientName)},</p>`,
      `<p>Has sido agregado al curso <strong>${safeCourseTitle}</strong> en GoBeyond.</p>`,
      `<p>${escapeHtml(expirationSentence)}</p>`,
      `<p><a href="${escapeHtml(courseUrl)}">Ingresar al curso</a></p>`,
    ].join(""),
  };
}

export async function getNextPendingUserNotification(env, userId) {
  try {
    const row = await env.DB.prepare(
      `SELECT id, user_id, kind, title, body, cta_path, metadata_json,
              email_sent_at, email_failed_at, portal_seen_at, created_at
       FROM user_notifications
       WHERE user_id = ?
         AND portal_seen_at IS NULL
       ORDER BY created_at ASC, id ASC
       LIMIT 1`
    )
      .bind(userId)
      .first();

    return toPortalBanner(row ? mapNotification(row) : null);
  } catch (requestError) {
    if (isMissingNotificationsTableError(requestError)) {
      return null;
    }

    throw requestError;
  }
}

export async function acknowledgeUserNotification(request, env, auth, notificationId) {
  try {
    const normalizedId = validateRequiredString(notificationId, "Notificacion", 255);
    const notification = await env.DB.prepare(
      `SELECT id, user_id, kind, title, body, cta_path, metadata_json,
              email_sent_at, email_failed_at, portal_seen_at, created_at
       FROM user_notifications
       WHERE id = ?
         AND user_id = ?
       LIMIT 1`
    )
      .bind(normalizedId, auth.user.id)
      .first();

    if (!notification) {
      const missingError = new Error("Notificacion no encontrada.");
      missingError.status = 404;
      throw missingError;
    }

    const acknowledgedAt = notification.portal_seen_at ?? nowIso();

    if (!notification.portal_seen_at) {
      await env.DB.prepare("UPDATE user_notifications SET portal_seen_at = ? WHERE id = ?")
        .bind(acknowledgedAt, normalizedId)
        .run();

      await writeAuditLog(env, {
        actorUserId: auth.user.id,
        ipAddress: getClientIp(request),
        eventType: "student.notification_acknowledged",
        entityType: "user_notification",
        entityId: normalizedId,
        detailsJson: {
          kind: notification.kind,
        },
      });
    }

    return {
      ok: true,
      notification: toPortalBanner(
        mapNotification({
          ...notification,
          portal_seen_at: acknowledgedAt,
        })
      ),
    };
  } catch (requestError) {
    if (isMissingNotificationsTableError(requestError)) {
      const missingError = new Error("Notificacion no encontrada.");
      missingError.status = 404;
      throw missingError;
    }

    throw requestError;
  }
}

export async function notifyStudentEnrollment(request, env, auth, { user, course, enrollmentId, accessExpiresAt }) {
  const courseTitle = String(course?.title ?? "tu nuevo curso").trim() || "tu nuevo curso";
  const appOrigin = getAppOrigin(request, env);
  const courseImageUrl = resolveCourseImageUrl(course, appOrigin);
  const metadata = {
    courseId: course?.id ?? null,
    courseTitle,
    enrollmentId,
    accessExpiresAt: accessExpiresAt ?? null,
    courseImageUrl,
  };
  const content = buildEnrollmentNotificationContent(courseTitle, accessExpiresAt);
  const notification = await createUserNotification(env, {
    userId: user.id,
    kind: COURSE_ENROLLMENT_KIND,
    title: content.title,
    body: content.body,
    ctaPath: COURSE_ENROLLMENT_CTA_PATH,
    metadata,
  });

  if (!notification) {
    const error = new Error("No se pudo registrar la notificacion de matricula.");
    error.status = 500;
    throw error;
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "student.notification_created",
    entityType: "user_notification",
    entityId: notification.id,
    detailsJson: {
      kind: COURSE_ENROLLMENT_KIND,
      userId: user.id,
      courseId: metadata.courseId,
      enrollmentId,
    },
  });

  const portalUrl = `${appOrigin}/portal`;
  const courseUrl = buildCoursePortalUrl(appOrigin, metadata.courseId);

  try {
    const delivery = await sendTransactionalEmail(
      request,
      env,
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name ?? user.fullName,
        role: user.role ?? "student",
      },
      buildEnrollmentEmailPayload(user, courseTitle, accessExpiresAt, portalUrl, courseUrl, courseImageUrl)
    );

    if (delivery.delivered) {
      await markNotificationEmailOutcome(env, notification.id, "sent");
      await writeAuditLog(env, {
        actorUserId: auth.user.id,
        ipAddress: getClientIp(request),
        eventType: "student.notification_email_sent",
        entityType: "user_notification",
        entityId: notification.id,
        detailsJson: {
          deliveryMode: delivery.mode,
          kind: COURSE_ENROLLMENT_KIND,
        },
      });
    } else {
      await markNotificationEmailOutcome(env, notification.id, "failed");
      await writeAuditLog(env, {
        actorUserId: auth.user.id,
        ipAddress: getClientIp(request),
        eventType: "student.notification_email_failed",
        entityType: "user_notification",
        entityId: notification.id,
        detailsJson: {
          deliveryMode: delivery.mode,
          kind: COURSE_ENROLLMENT_KIND,
        },
      });
    }
  } catch (requestError) {
    await markNotificationEmailOutcome(env, notification.id, "failed");
    await writeAuditLog(env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(request),
      eventType: "student.notification_email_failed",
      entityType: "user_notification",
      entityId: notification.id,
      detailsJson: {
        error: requestError.message,
        kind: COURSE_ENROLLMENT_KIND,
      },
    });
  }

  return notification;
}

export async function notifySopChangeResolved(request, env, auth, { userId, sopId, sopTitle, resolutionNote, changeRequestId }) {
  const notification = await createUserNotification(env, {
    userId,
    kind: SOP_CHANGE_RESOLVED_KIND,
    title: `Cambios aplicados en ${String(sopTitle ?? "el SOP").trim() || "el SOP"}`,
    body: String(resolutionNote ?? "").trim() || "Tu solicitud de cambio fue atendida y el documento ya fue actualizado.",
    ctaPath: SOP_CHANGE_RESOLVED_CTA_PATH,
    metadata: {
      sopId: sopId ?? null,
      changeRequestId: changeRequestId ?? null,
    },
  });

  if (!notification) {
    const error = new Error("No se pudo registrar la notificacion de SOP.");
    error.status = 500;
    throw error;
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "teacher.sop_change_notification_created",
    entityType: "user_notification",
    entityId: notification.id,
    detailsJson: {
      kind: SOP_CHANGE_RESOLVED_KIND,
      userId,
      sopId: sopId ?? null,
      changeRequestId: changeRequestId ?? null,
    },
  });

  return notification;
}
