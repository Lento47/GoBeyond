import { writeAuditLog } from "./audit";
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
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    status: row.status,
    accessExpiresAt: row.access_expires_at,
    createdAt: row.created_at,
    student: {
      id: row.user_id,
      fullName: row.full_name,
      email: row.email,
      status: row.user_status ?? "active",
    },
    course: row.course_json ? parseJsonOrNull(row.course_json) : null,
  };
}

export async function listEnrollments(env) {
  const result = await env.DB.prepare(
    `SELECT e.id, e.user_id, e.course_id, e.status, e.access_expires_at, e.created_at,
            u.full_name, u.email, COALESCE(u.status, 'active') AS user_status,
            c.value_json AS course_json
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN collection_items c ON c.id = e.course_id AND c.section = 'courses'
     ORDER BY e.created_at DESC`
  ).all();

  return (result.results ?? []).map(mapEnrollment);
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

  if (!user || user.role !== "student") {
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
    const error = new Error("Curso no encontrado.");
    error.status = 404;
    throw error;
  }

  return {
    id: course.id,
    value: parseJsonOrNull(course.value_json),
  };
}

export async function createEnrollment(request, env, auth, body) {
  const userId = validateRequiredString(body.userId, "Estudiante", 255);
  const courseId = validateRequiredString(body.courseId, "Curso", 255);
  const status = validateEnrollmentStatus(body.status ?? "active");
  const accessDays = validatePositiveInteger(body.accessDays ?? 45, "Dias de acceso", {
    min: 1,
    max: 365,
  });

  await ensureStudentExists(env, userId);
  await ensureCourseExists(env, courseId);

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

  await env.DB.prepare(
    `INSERT INTO enrollments (id, user_id, course_id, status, access_expires_at, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(enrollmentId, userId, courseId, status, accessExpiresAt, auth.user.id, nowIso())
    .run();

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.enrollment_create",
    entityType: "enrollment",
    entityId: enrollmentId,
    detailsJson: { userId, courseId, status, accessDays },
  });
}

export async function updateEnrollment(request, env, auth, enrollmentId, body) {
  const existingEnrollment = await env.DB.prepare(
    "SELECT id, user_id, course_id, status, access_expires_at FROM enrollments WHERE id = ? LIMIT 1"
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

  await env.DB.prepare(
    "UPDATE enrollments SET status = ?, access_expires_at = ? WHERE id = ?"
  )
    .bind(status, accessExpiresAt, enrollmentId)
    .run();

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.enrollment_update",
    entityType: "enrollment",
    entityId: enrollmentId,
    detailsJson: { status, accessExpiresAt },
  });
}

export async function deleteEnrollment(request, env, auth, enrollmentId) {
  await env.DB.prepare("DELETE FROM enrollments WHERE id = ?").bind(enrollmentId).run();

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.enrollment_delete",
    entityType: "enrollment",
    entityId: enrollmentId,
  });
}

export async function listStudentEnrollments(env, userId) {
  const result = await env.DB.prepare(
    `SELECT e.id, e.user_id, e.course_id, e.status, e.access_expires_at, e.created_at,
            u.full_name, u.email, COALESCE(u.status, 'active') AS user_status,
            c.value_json AS course_json
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     LEFT JOIN collection_items c ON c.id = e.course_id AND c.section = 'courses'
     WHERE e.user_id = ?
     ORDER BY e.created_at DESC`
  )
    .bind(userId)
    .all();

  return (result.results ?? []).map(mapEnrollment);
}
