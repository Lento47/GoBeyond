import { defaultContent } from "../../src/data/defaultContent";
import { listUserRoles } from "./roles";
import { writeAuditLog } from "./audit";
import { notifyStudentEnrollment } from "./notifications";
import { getClientIp, nowIso, parseJsonOrNull, createId } from "./util";
import { validateEnrollmentStatus, validatePositiveInteger, validateRequiredString } from "./validation";

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function normalizeDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error("Fecha invalida.");
    error.status = 400;
    throw error;
  }

  return date.toISOString();
}

function mapEnrollment(row) {
  const rawEnhancement = row.enhancement_json ? parseJsonOrNull(row.enhancement_json) : null;
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    status: row.status,
    completionStatus: row.completion_status ?? "in_progress",
    completedAt: row.completed_at ?? null,
    accessExpiresAt: row.access_expires_at,
    createdAt: row.created_at,
    student: {
      id: row.user_id,
      fullName: row.full_name,
      email: row.email,
      status: row.user_status ?? "active",
    },
    course: row.course_json ? parseJsonOrNull(row.course_json) : null,
    enhancement: rawEnhancement ?? {
      gamificationEnabled: false,
      progressPercent: 0,
      points: 0,
      streakDays: 0,
      passingThreshold: 80,
    },
  };
}

function resolveCompletion({ progressPercent, passingThreshold, completionStatusOverride, existingCompletionStatus, existingCompletedAt }) {
  if (completionStatusOverride === "failed") {
    return { completionStatus: "failed", completedAt: existingCompletedAt ?? nowIso() };
  }

  if (completionStatusOverride === "passed") {
    return { completionStatus: "passed", completedAt: existingCompletedAt ?? nowIso() };
  }

  if (completionStatusOverride === "in_progress") {
    return { completionStatus: "in_progress", completedAt: null };
  }

  if (existingCompletionStatus === "passed" || existingCompletionStatus === "failed") {
    return { completionStatus: existingCompletionStatus, completedAt: existingCompletedAt };
  }

  const threshold = Number(passingThreshold ?? 80);
  const progress = Number(progressPercent ?? 0);

  if (progress >= threshold) {
    return { completionStatus: "passed", completedAt: existingCompletedAt ?? nowIso() };
  }

  return { completionStatus: "in_progress", completedAt: null };
}

export async function listEnrollments(env) {
  const result = await env.DB.prepare(
    `SELECT e.id, e.user_id, e.course_id, e.status, e.completion_status, e.completed_at, e.access_expires_at, e.created_at,
            u.full_name, u.email, COALESCE(u.status, 'active') AS user_status,
            c.value_json AS course_json,
            ee.value_json AS enhancement_json
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN collection_items c ON c.id = e.course_id AND c.section = 'courses'
     LEFT JOIN collection_items ee ON ee.id = e.id AND ee.section = 'enrollmentEnhancements'
     ORDER BY e.created_at DESC`
  ).all();

  return (result.results ?? []).map(mapEnrollment);
}

async function upsertEnrollmentEnhancement(env, enrollmentId, enhancement) {
  const existing = await env.DB.prepare(
    "SELECT id, position FROM collection_items WHERE section = 'enrollmentEnhancements' AND id = ? LIMIT 1"
  )
    .bind(enrollmentId)
    .first();

  if (existing) {
    await env.DB.prepare(
      `UPDATE collection_items
       SET value_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE section = 'enrollmentEnhancements' AND id = ?`
    )
      .bind(JSON.stringify(enhancement), enrollmentId)
      .run();
    return;
  }

  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM collection_items WHERE section = 'enrollmentEnhancements'"
  ).first();

  const nextPosition = Number(positionRow?.maxPosition ?? -1) + 1;

  await env.DB.prepare(
    `INSERT INTO collection_items (id, section, value_json, position, created_at, updated_at)
     VALUES (?, 'enrollmentEnhancements', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(enrollmentId, JSON.stringify(enhancement), nextPosition)
    .run();
}

async function ensureStudentExists(env, userId) {
  const user = await env.DB.prepare(
    `SELECT id, full_name, email, role, COALESCE(status, 'active') AS status
     FROM users
     WHERE id = ?
     LIMIT 1`
  )
    .bind(userId)
    .first();

  const roles = user ? await listUserRoles(env, user.id, user.role) : [];

  if (!user || !roles.includes("student")) {
    const error = new Error("Estudiante no encontrado.");
    error.status = 404;
    throw error;
  }

  return user;
}

async function ensureCourseExists(env, courseId) {
  const course = await env.DB.prepare(
    "SELECT id, value_json FROM collection_items WHERE section = 'courses' AND id = ? LIMIT 1"
  )
    .bind(courseId)
    .first();

  if (!course) {
    const fallbackCourse = (defaultContent.courses ?? []).find((item) => item.id === courseId);

    if (!fallbackCourse) {
      const error = new Error("Curso no encontrado.");
      error.status = 404;
      throw error;
    }

    const positionRow = await env.DB.prepare(
      "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM collection_items WHERE section = 'courses'"
    ).first();

    const nextPosition = Number(positionRow?.maxPosition ?? -1) + 1;

    await env.DB.prepare(
      `INSERT INTO collection_items (id, section, value_json, position, created_at, updated_at)
       VALUES (?, 'courses', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(fallbackCourse.id, JSON.stringify(fallbackCourse), nextPosition)
      .run();

    return {
      id: fallbackCourse.id,
      value: fallbackCourse,
    };
  }

  return {
    id: course.id,
    value: parseJsonOrNull(course.value_json),
  };
}

async function triggerEnrollmentActivationNotification(request, env, auth, { student, course, enrollmentId, accessExpiresAt }) {
  const courseValue = course?.value && typeof course.value === "object" ? course.value : {};

  try {
    await notifyStudentEnrollment(request, env, auth, {
      user: student,
      course: {
        id: course?.id ?? null,
        ...courseValue,
      },
      enrollmentId,
      accessExpiresAt,
    });
  } catch (requestError) {
    await writeAuditLog(env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(request),
      eventType: "student.notification_enqueue_failed",
      entityType: "enrollment",
      entityId: enrollmentId,
      detailsJson: {
        userId: student.id,
        courseId: course?.id ?? null,
        error: requestError.message,
      },
    });
  }
}

function resolveAuditNamespace(options = {}) {
  return String(options.auditNamespace ?? "admin").trim().toLowerCase() || "admin";
}

export async function createEnrollment(request, env, auth, body, options = {}) {
  const userId = validateRequiredString(body.userId, "Estudiante", 255);
  const courseId = validateRequiredString(body.courseId, "Curso", 255);
  const status = validateEnrollmentStatus(body.status ?? "active");
  const accessDays = validatePositiveInteger(body.accessDays ?? 45, "Dias de acceso", {
    min: 1,
    max: 365,
  });

  const student = await ensureStudentExists(env, userId);
  const course = await ensureCourseExists(env, courseId);

  const existingEnrollment = await env.DB.prepare(
    "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1"
  )
    .bind(userId, courseId)
    .first();

  if (existingEnrollment) {
    const error = new Error("Ese estudiante ya tiene una matricula para este curso.");
    error.status = 409;
    throw error;
  }

  const enrollmentId = createId("enrollment");
  const accessExpiresAt = addDays(new Date(), accessDays).toISOString();
  const passingThreshold = Math.min(100, Math.max(1, Number(body.passingThreshold ?? 80)));
  const progressPercent = Number(body.progressPercent ?? 0);
  const enhancement = {
    gamificationEnabled: Boolean(body.gamificationEnabled),
    progressPercent,
    points: Number(body.points ?? 0),
    streakDays: Number(body.streakDays ?? 0),
    passingThreshold,
  };
  const { completionStatus, completedAt } = resolveCompletion({
    progressPercent,
    passingThreshold,
    completionStatusOverride: body.completionStatus ?? null,
    existingCompletionStatus: "in_progress",
    existingCompletedAt: null,
  });

  await env.DB.prepare(
    `INSERT INTO enrollments (id, user_id, course_id, status, completion_status, completed_at, access_expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(enrollmentId, userId, courseId, status, completionStatus, completedAt, accessExpiresAt, auth.user.id, nowIso())
    .run();

  await upsertEnrollmentEnhancement(env, enrollmentId, enhancement);

  const auditNamespace = resolveAuditNamespace(options);

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: `${auditNamespace}.enrollment_create`,
    entityType: "enrollment",
    entityId: enrollmentId,
    detailsJson: { userId, courseId, status, accessDays, enhancement },
  });

  if (status === "active") {
    await triggerEnrollmentActivationNotification(request, env, auth, {
      student,
      course,
      enrollmentId,
      accessExpiresAt,
    });
  }
}

export async function updateEnrollment(request, env, auth, enrollmentId, body, options = {}) {
  const existingEnrollment = await env.DB.prepare(
    "SELECT id, user_id, course_id, status, completion_status, completed_at, access_expires_at FROM enrollments WHERE id = ? LIMIT 1"
  )
    .bind(enrollmentId)
    .first();

  if (!existingEnrollment) {
    const error = new Error("Matricula no encontrada.");
    error.status = 404;
    throw error;
  }

  const status = validateEnrollmentStatus(body.status ?? existingEnrollment.status);
  const accessExpiresAt = body.accessExpiresAt
    ? normalizeDate(body.accessExpiresAt)
    : existingEnrollment.access_expires_at;
  const passingThreshold = Math.min(100, Math.max(1, Number(body.passingThreshold ?? 80)));
  const progressPercent = Number(body.progressPercent ?? 0);
  const enhancement = {
    gamificationEnabled: Boolean(body.gamificationEnabled),
    progressPercent,
    points: Number(body.points ?? 0),
    streakDays: Number(body.streakDays ?? 0),
    passingThreshold,
  };
  const { completionStatus, completedAt } = resolveCompletion({
    progressPercent,
    passingThreshold,
    completionStatusOverride: body.completionStatus ?? null,
    existingCompletionStatus: existingEnrollment.completion_status ?? "in_progress",
    existingCompletedAt: existingEnrollment.completed_at ?? null,
  });
  const resolvedStatus = completionStatus === "in_progress" ? status : "completed";

  await env.DB.prepare(
    "UPDATE enrollments SET status = ?, completion_status = ?, completed_at = ?, access_expires_at = ? WHERE id = ?"
  )
    .bind(resolvedStatus, completionStatus, completedAt, accessExpiresAt, enrollmentId)
    .run();

  await upsertEnrollmentEnhancement(env, enrollmentId, enhancement);

  const auditNamespace = resolveAuditNamespace(options);

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: `${auditNamespace}.enrollment_update`,
    entityType: "enrollment",
    entityId: enrollmentId,
    detailsJson: { status: resolvedStatus, completionStatus, completedAt, accessExpiresAt, enhancement },
  });

  if (existingEnrollment.status !== "active" && status === "active") {
    const [student, course] = await Promise.all([
      ensureStudentExists(env, existingEnrollment.user_id),
      ensureCourseExists(env, existingEnrollment.course_id),
    ]);

    await triggerEnrollmentActivationNotification(request, env, auth, {
      student,
      course,
      enrollmentId,
      accessExpiresAt,
    });
  }
}

export async function deleteEnrollment(request, env, auth, enrollmentId, options = {}) {
  await env.DB.prepare("DELETE FROM enrollments WHERE id = ?").bind(enrollmentId).run();
  await env.DB.prepare("DELETE FROM collection_items WHERE section = 'enrollmentEnhancements' AND id = ?")
    .bind(enrollmentId)
    .run();

  const auditNamespace = resolveAuditNamespace(options);

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: `${auditNamespace}.enrollment_delete`,
    entityType: "enrollment",
    entityId: enrollmentId,
  });
}

export async function listStudentEnrollments(env, userId) {
  const result = await env.DB.prepare(
    `SELECT e.id, e.user_id, e.course_id, e.status, e.completion_status, e.completed_at, e.access_expires_at, e.created_at,
            u.full_name, u.email, COALESCE(u.status, 'active') AS user_status,
            c.value_json AS course_json,
            ee.value_json AS enhancement_json
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN collection_items c ON c.id = e.course_id AND c.section = 'courses'
     LEFT JOIN collection_items ee ON ee.id = e.id AND ee.section = 'enrollmentEnhancements'
     WHERE e.user_id = ?
     ORDER BY e.created_at DESC`
  )
    .bind(userId)
    .all();

  return (result.results ?? []).map(mapEnrollment);
}
