import { defaultContent } from "../../src/data/defaultContent";
import { cleanupCourseAssignmentFiles } from "./assignmentFiles";
import { writeAuditLog } from "./audit";
import { normalizeCommunityThread } from "./community";
import { getContent, updateCollectionItem } from "./content";
import { createEnrollment, deleteEnrollment, listEnrollments, updateEnrollment } from "./enrollments";
import { hasUserRolesTable } from "./roles";
import { getClientIp, createId, nowIso, parseJsonOrNull } from "./util";
import { badRequest, validateRequiredString } from "./validation";

const SUPPORT_TICKET_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);
const SUPPORT_TICKET_PRIORITIES = new Set(["low", "normal", "high"]);
const COURSE_REQUEST_STATUSES = new Set(["open", "reviewing", "contacted", "waitlist", "closed"]);
const COMMUNITY_THREAD_STATUSES = new Set(["open", "resolved", "closed"]);
const COMMUNITY_THREAD_VISIBILITIES = new Set(["visible", "hidden"]);

function cleanOptionalString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeStringArray(values) {
  const entries = Array.isArray(values) ? values : values == null ? [] : [values];
  return Array.from(
    new Set(
      entries
        .flatMap((value) => (typeof value === "string" ? value.split(",") : [value]))
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeSupportTicketStatus(value) {
  const normalized = cleanOptionalString(value, 40).toLowerCase();
  if (!SUPPORT_TICKET_STATUSES.has(normalized)) {
    throw badRequest("Estado de ticket invalido.");
  }
  return normalized;
}

function normalizeSupportTicketPriority(value) {
  const normalized = cleanOptionalString(value, 40).toLowerCase();
  if (!SUPPORT_TICKET_PRIORITIES.has(normalized)) {
    throw badRequest("Prioridad invalida.");
  }
  return normalized;
}

function normalizeCourseRequestStatus(value) {
  const normalized = cleanOptionalString(value, 40).toLowerCase();
  if (!COURSE_REQUEST_STATUSES.has(normalized)) {
    throw badRequest("Estado de solicitud invalido.");
  }
  return normalized;
}

function normalizeCommunityThreadStatus(value) {
  const normalized = cleanOptionalString(value, 40).toLowerCase();
  if (!COMMUNITY_THREAD_STATUSES.has(normalized)) {
    throw badRequest("Estado de hilo invalido.");
  }
  return normalized;
}

function normalizeCommunityThreadVisibility(value) {
  const normalized = cleanOptionalString(value, 40).toLowerCase();
  if (!COMMUNITY_THREAD_VISIBILITIES.has(normalized)) {
    throw badRequest("Visibilidad invalida.");
  }
  return normalized;
}

function mapCourseLookup(content) {
  return new Map((content?.courses ?? []).map((course) => [course.id, course]));
}

function getDefaultCourse(courseId) {
  return (defaultContent.courses ?? []).find((course) => course.id === courseId) ?? null;
}

function mergeCourseRecord(courseId, ...sources) {
  const normalizedSources = sources.filter((source) => source && typeof source === "object");
  const merged = normalizedSources.reduce((record, source) => {
    if (!source || typeof source !== "object") {
      return record;
    }

    return {
      ...record,
      ...source,
    };
  }, {});

  if (!Object.keys(merged).length) {
    return null;
  }

  const title = normalizedSources
    .map((source) => cleanOptionalString(source.title, 255))
    .filter(Boolean)
    .at(-1);
  const detailSummary = cleanOptionalString(merged.detailSummary, 255);
  const description = cleanOptionalString(merged.description, 255);
  const resolvedId = normalizedSources
    .map((source) => cleanOptionalString(source.id, 255))
    .filter(Boolean)
    .at(-1);

  return {
    ...merged,
    id: resolvedId || courseId,
    title: title || detailSummary || description || `Curso ${courseId}`,
  };
}

async function resolveTeacherCourseId(env, rawCourseId, courseLookup = null) {
  const courseId = cleanOptionalString(rawCourseId, 255);
  if (!courseId) {
    return "";
  }

  const lookup = courseLookup ?? mapCourseLookup(await getContent(env));
  if (lookup.has(courseId) || getDefaultCourse(courseId)) {
    return courseId;
  }

  const persistedMatch = await env.DB.prepare(
    "SELECT id FROM collection_items WHERE section = 'courses' AND id = ? LIMIT 1"
  )
    .bind(courseId)
    .first();

  if (persistedMatch?.id) {
    return persistedMatch.id;
  }

  if (!/^\d+$/.test(courseId)) {
    return courseId;
  }

  const legacyPositionMatch = await env.DB.prepare(
    "SELECT id FROM collection_items WHERE section = 'courses' AND position = ? LIMIT 1"
  )
    .bind(Number(courseId))
    .first();

  if (legacyPositionMatch?.id) {
    return legacyPositionMatch.id;
  }

  if (Number(courseId) > 0) {
    const oneBasedLegacyMatch = await env.DB.prepare(
      "SELECT id FROM collection_items WHERE section = 'courses' AND position = ? LIMIT 1"
    )
      .bind(Number(courseId) - 1)
      .first();

    if (oneBasedLegacyMatch?.id) {
      return oneBasedLegacyMatch.id;
    }
  }

  return courseId;
}

async function resolveTeacherCourse(env, rawCourseId, courseLookup = null) {
  const canonicalCourseId = await resolveTeacherCourseId(env, rawCourseId, courseLookup);
  if (!canonicalCourseId) {
    return null;
  }

  const lookup = courseLookup ?? mapCourseLookup(await getContent(env));
  const fallbackCourse = lookup.get(canonicalCourseId) ?? getDefaultCourse(canonicalCourseId);
  const row = await env.DB.prepare(
    "SELECT value_json FROM collection_items WHERE section = 'courses' AND id = ? LIMIT 1"
  )
    .bind(canonicalCourseId)
    .first();

  const persistedCourse = parseJsonOrNull(row?.value_json);
  const mergedCourse = mergeCourseRecord(canonicalCourseId, fallbackCourse, persistedCourse);

  if (!mergedCourse) {
    return null;
  }

  return cleanupCourseAssignmentFiles(env, mergedCourse);
}

function sortByUpdatedAt(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function uniqueActiveStudents(enrollments) {
  return new Set(
    enrollments
      .filter((item) => item.status === "active")
      .map((item) => item.student?.id)
      .filter(Boolean)
  ).size;
}

export async function hasTeacherCourseAssignmentsTable(env) {
  const row = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'teacher_course_assignments' LIMIT 1"
  ).first();

  return Boolean(row?.name);
}

async function ensureTeacherAssignmentsReady(env) {
  if (!(await hasTeacherCourseAssignmentsTable(env))) {
    const error = new Error(
      "El alcance docente aun no esta habilitado en esta base. Aplica la migracion 0007_teacher_course_assignments.sql."
    );
    error.status = 409;
    throw error;
  }
}

async function ensureCoursePersisted(env, courseId, courseLookup = null) {
  const existing = await env.DB.prepare(
    "SELECT id FROM collection_items WHERE section = 'courses' AND id = ? LIMIT 1"
  )
    .bind(courseId)
    .first();

  if (existing?.id) {
    return existing.id;
  }

  const lookup = courseLookup ?? mapCourseLookup(await getContent(env));
  const fallbackCourse = lookup.get(courseId) ?? (defaultContent.courses ?? []).find((item) => item.id === courseId);

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

  return fallbackCourse.id;
}

export async function listTeacherAssignedCourseIds(env, teacherUserId) {
  await ensureTeacherAssignmentsReady(env);

  const result = await env.DB.prepare(
    `SELECT course_id
     FROM teacher_course_assignments
     WHERE teacher_user_id = ?
     ORDER BY created_at ASC`
  )
    .bind(teacherUserId)
    .all();

  const courseLookup = mapCourseLookup(await getContent(env));
  const resolvedCourseIds = await Promise.all(
    (result.results ?? []).map((row) => resolveTeacherCourseId(env, row.course_id, courseLookup))
  );

  return Array.from(new Set(resolvedCourseIds.filter(Boolean)));
}

export async function listTeacherAssignmentsByUser(env) {
  if (!(await hasTeacherCourseAssignmentsTable(env))) {
    return new Map();
  }

  const result = await env.DB.prepare(
    `SELECT t.teacher_user_id, t.course_id, c.value_json AS course_json
     FROM teacher_course_assignments t
     LEFT JOIN collection_items c ON c.section = 'courses' AND c.id = t.course_id
     ORDER BY t.created_at ASC`
  ).all();

  const courseLookup = mapCourseLookup(await getContent(env));
  const assignments = new Map();

  for (const row of result.results ?? []) {
    const resolvedCourseId = await resolveTeacherCourseId(env, row.course_id, courseLookup);
    const parsedCourse = parseJsonOrNull(row.course_json);
    const fallbackCourse = courseLookup.get(resolvedCourseId) ?? getDefaultCourse(resolvedCourseId);
    const course = mergeCourseRecord(resolvedCourseId || row.course_id, fallbackCourse, parsedCourse);

    if (!assignments.has(row.teacher_user_id)) {
      assignments.set(row.teacher_user_id, []);
    }

    assignments.get(row.teacher_user_id).push({
      id: resolvedCourseId || row.course_id,
      title: course?.title ?? `Curso ${resolvedCourseId || row.course_id}`,
    });
  }

  return assignments;
}

export async function replaceTeacherCourseAssignments(env, teacherUserId, courseIds) {
  await ensureTeacherAssignmentsReady(env);

  const normalizedCourseIds = await validateTeacherCourseAssignments(env, courseIds);
  const content = await getContent(env);
  const courseLookup = mapCourseLookup(content);

  await env.DB.prepare("DELETE FROM teacher_course_assignments WHERE teacher_user_id = ?")
    .bind(teacherUserId)
    .run();

  for (const courseId of normalizedCourseIds) {
    await ensureCoursePersisted(env, courseId, courseLookup);
    await env.DB.prepare(
      `INSERT INTO teacher_course_assignments (teacher_user_id, course_id, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(teacherUserId, courseId, nowIso())
      .run();
  }

  return normalizedCourseIds;
}

export async function validateTeacherCourseAssignments(env, courseIds) {
  await ensureTeacherAssignmentsReady(env);

  const normalizedCourseIds = normalizeStringArray(courseIds);
  const content = await getContent(env);
  const courseLookup = mapCourseLookup(content);

  for (const courseId of normalizedCourseIds) {
    if (!courseLookup.has(courseId)) {
      const error = new Error("Uno de los cursos asignados no existe.");
      error.status = 400;
      throw error;
    }
  }

  return normalizedCourseIds;
}

async function getAssignedCourseSet(env, teacherUserId) {
  return new Set(await listTeacherAssignedCourseIds(env, teacherUserId));
}

async function assertTeacherOwnsCourse(env, teacherUserId, courseId) {
  const assignedCourseIds = await getAssignedCourseSet(env, teacherUserId);
  if (!assignedCourseIds.has(courseId)) {
    const error = new Error("No puedes operar un curso fuera de tu alcance docente.");
    error.status = 403;
    throw error;
  }
  return assignedCourseIds;
}

async function loadTeacherScopedCollections(env, teacherUserId) {
  const courseIds = await getAssignedCourseSet(env, teacherUserId);
  const content = await getContent(env);
  const courseLookup = mapCourseLookup(content);
  const enrollments = (await listEnrollments(env)).filter((item) => courseIds.has(item.courseId));
  const tickets = sortByUpdatedAt((content.supportTickets ?? []).filter((item) => courseIds.has(item.courseId)));
  const courseRequests = sortByUpdatedAt((content.courseInterestRequests ?? []).filter((item) => courseIds.has(item.courseId)));
  const threads = sortByUpdatedAt((content.communityThreads ?? []).filter((item) => courseIds.has(item.courseId)));

  const courses = await Promise.all(
    Array.from(courseIds).map(async (courseId) => {
        const cleanedCourse = await resolveTeacherCourse(env, courseId, courseLookup);
        if (!cleanedCourse) {
          return null;
        }
        const courseEnrollments = enrollments.filter((item) => item.courseId === cleanedCourse.id);

        return {
          ...cleanedCourse,
          enrollments: courseEnrollments,
          students: courseEnrollments.map((item) => ({
            enrollmentId: item.id,
            id: item.student?.id ?? item.userId,
            fullName: item.student?.fullName ?? "Sin estudiante",
            email: item.student?.email ?? "",
            status: item.status,
            accessExpiresAt: item.accessExpiresAt,
            progressPercent: item.enhancement?.progressPercent ?? 0,
            points: item.enhancement?.points ?? 0,
            streakDays: item.enhancement?.streakDays ?? 0,
          })),
          enrollmentCount: courseEnrollments.length,
          activeStudentCount: courseEnrollments.filter((item) => item.status === "active").length,
          assignmentCount: (cleanedCourse.assignments ?? []).length,
          openTicketCount: tickets.filter((item) => item.courseId === cleanedCourse.id && item.status !== "closed").length,
          openRequestCount: courseRequests.filter((item) => item.courseId === cleanedCourse.id && item.status !== "closed").length,
          openThreadCount: threads.filter((item) => item.courseId === cleanedCourse.id && item.status !== "closed").length,
        };
      })
  );

  return {
    courseIds,
    courses: courses.filter(Boolean),
    enrollments,
    tickets,
    courseRequests,
    threads,
  };
}

async function listTeacherStudentOptions(env) {
  const query = (await hasUserRolesTable(env))
    ? `SELECT DISTINCT u.id, u.full_name, u.email
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE ur.role = 'student' AND COALESCE(u.status, 'active') = 'active'
       ORDER BY u.full_name COLLATE NOCASE ASC`
    : `SELECT id, full_name, email
       FROM users
       WHERE role = 'student' AND COALESCE(status, 'active') = 'active'
       ORDER BY full_name COLLATE NOCASE ASC`;

  const result = await env.DB.prepare(query).all();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
  }));
}

async function getPersistedCourse(env, courseId) {
  await ensureCoursePersisted(env, courseId);

  const row = await env.DB.prepare(
    "SELECT value_json FROM collection_items WHERE section = 'courses' AND id = ? LIMIT 1"
  )
    .bind(courseId)
    .first();

  if (!row?.value_json) {
    const error = new Error("Curso no encontrado.");
    error.status = 404;
    throw error;
  }

  const course = parseJsonOrNull(row.value_json);
  if (!course) {
    const error = new Error("Curso invalido.");
    error.status = 500;
    throw error;
  }

  return cleanupCourseAssignmentFiles(env, course);
}

export async function getTeacherDashboard(env, teacherUserId, teacherName = "") {
  const { courses, enrollments, tickets, courseRequests, threads } = await loadTeacherScopedCollections(env, teacherUserId);
  const openCases =
    tickets.filter((item) => item.status !== "closed").length +
    courseRequests.filter((item) => item.status !== "closed").length +
    threads.filter((item) => item.status !== "closed").length;

  return {
    welcomeTitle: teacherName ? `Panel docente de ${teacherName}` : "Panel docente",
    summary:
      "Administra tus cursos asignados, publica tareas, matricula estudiantes y da seguimiento a incidencias relacionadas con tus cohortes.",
    metrics: {
      assignedCourses: courses.length,
      activeStudents: uniqueActiveStudents(enrollments),
      pendingAssignments: courses.reduce((total, course) => total + (course.assignments ?? []).length, 0),
      openCases,
    },
    courseSnapshots: courses.slice(0, 4).map((course) => ({
      id: course.id,
      title: course.title,
      format: course.format,
      duration: course.duration,
      activeStudentCount: course.activeStudentCount,
      assignmentCount: course.assignmentCount,
      openCases: course.openTicketCount + course.openRequestCount + course.openThreadCount,
    })),
    recentCases: sortByUpdatedAt([
      ...tickets.map((item) => ({
        id: item.id,
        kind: "ticket",
        title: item.subject,
        subtitle: item.student?.fullName ?? item.courseTitle ?? "Ticket",
        status: item.status,
        updatedAt: item.updatedAt || item.createdAt,
      })),
      ...courseRequests.map((item) => ({
        id: item.id,
        kind: "course-request",
        title: item.courseTitle,
        subtitle: item.student?.fullName ?? "Solicitud de apertura",
        status: item.status,
        updatedAt: item.updatedAt || item.createdAt,
      })),
      ...threads.map((item) => ({
        id: item.id,
        kind: "thread",
        title: item.title,
        subtitle: item.authorName ?? item.courseTitle ?? "Hilo",
        status: item.status,
        updatedAt: item.updatedAt || item.createdAt,
      })),
    ]).slice(0, 6),
  };
}

export async function listTeacherCourses(env, teacherUserId) {
  const { courses } = await loadTeacherScopedCollections(env, teacherUserId);
  return courses;
}

export async function listTeacherEnrollmentsView(env, teacherUserId) {
  const { courses, enrollments } = await loadTeacherScopedCollections(env, teacherUserId);

  return {
    enrollments,
    courseOptions: courses.map((course) => ({
      id: course.id,
      title: course.title,
    })),
    studentOptions: await listTeacherStudentOptions(env),
  };
}

export async function listTeacherSupport(env, teacherUserId) {
  const { tickets, courseRequests, threads } = await loadTeacherScopedCollections(env, teacherUserId);
  return {
    tickets,
    courseRequests,
    threads,
  };
}

export async function createTeacherEnrollment(request, env, auth, body) {
  const courseId = validateRequiredString(body.courseId, "Curso", 255);
  await assertTeacherOwnsCourse(env, auth.user.id, courseId);
  await createEnrollment(request, env, auth, body, { auditNamespace: "teacher" });
  return listTeacherEnrollmentsView(env, auth.user.id);
}

async function getTeacherScopedEnrollment(env, teacherUserId, enrollmentId) {
  const result = await env.DB.prepare(
    `SELECT id, course_id
     FROM enrollments
     WHERE id = ?
     LIMIT 1`
  )
    .bind(enrollmentId)
    .first();

  if (!result?.id) {
    const error = new Error("Matricula no encontrada.");
    error.status = 404;
    throw error;
  }

  await assertTeacherOwnsCourse(env, teacherUserId, result.course_id);
  return result;
}

export async function updateTeacherEnrollment(request, env, auth, enrollmentId, body) {
  await getTeacherScopedEnrollment(env, auth.user.id, enrollmentId);
  await updateEnrollment(request, env, auth, enrollmentId, body, { auditNamespace: "teacher" });
  return listTeacherEnrollmentsView(env, auth.user.id);
}

export async function deleteTeacherEnrollment(request, env, auth, enrollmentId) {
  await getTeacherScopedEnrollment(env, auth.user.id, enrollmentId);
  await deleteEnrollment(request, env, auth, enrollmentId, { auditNamespace: "teacher" });
  return listTeacherEnrollmentsView(env, auth.user.id);
}

function normalizeAssignmentDraft(input, fallback = {}) {
  const dueAtCandidate = cleanOptionalString(input.dueAt ?? fallback.dueAt, 64);
  const dueAtDate = dueAtCandidate ? new Date(dueAtCandidate) : null;
  const normalizedDueAt = dueAtDate && !Number.isNaN(dueAtDate.getTime()) ? dueAtDate.toISOString() : "";
  const fallbackLabel = normalizedDueAt
    ? dueAtDate.toLocaleString("es-CR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return {
    ...fallback,
    title: validateRequiredString(input.title ?? fallback.title, "Titulo de la asignacion", 255),
    instruction: validateRequiredString(input.instruction ?? fallback.instruction, "Instruccion", 5000),
    dueAt: normalizedDueAt || fallback.dueAt || "",
    dueLabel: cleanOptionalString(input.dueLabel ?? fallback.dueLabel ?? fallbackLabel, 120),
    fileKey: cleanOptionalString(input.fileKey ?? fallback.fileKey, 255),
    fileName: cleanOptionalString(input.fileName ?? fallback.fileName, 255),
    fileType: cleanOptionalString(input.fileType ?? fallback.fileType, 255),
    fileUploadedAt: cleanOptionalString(input.fileUploadedAt ?? fallback.fileUploadedAt, 64),
    fileExpiresAt: cleanOptionalString(input.fileExpiresAt ?? fallback.fileExpiresAt, 64),
    attachments: Array.isArray(input.attachments)
      ? input.attachments.map((attachment, index) => ({
          id: cleanOptionalString(attachment?.id, 255) || `attachment-${index + 1}`,
          fileKey: cleanOptionalString(attachment?.fileKey, 255),
          fileName: cleanOptionalString(attachment?.fileName, 255),
          fileType: cleanOptionalString(attachment?.fileType, 255),
          fileUploadedAt: cleanOptionalString(attachment?.fileUploadedAt, 64),
          fileExpiresAt: cleanOptionalString(attachment?.fileExpiresAt, 64),
        }))
      : Array.isArray(fallback.attachments)
        ? fallback.attachments
        : [],
  };
}

export async function createTeacherAssignment(request, env, auth, body) {
  const courseId = validateRequiredString(body.courseId, "Curso", 255);
  await assertTeacherOwnsCourse(env, auth.user.id, courseId);
  const course = await getPersistedCourse(env, courseId);
  const assignment = {
    id: createId("assignment"),
    fileData: "",
    fileUrl: "",
    ...normalizeAssignmentDraft(body),
  };

  await updateCollectionItem(env, "courses", {
    ...course,
    assignments: [...(course.assignments ?? []), assignment],
  });

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "teacher.assignment_create",
    entityType: "course",
    entityId: courseId,
    detailsJson: { assignmentId: assignment.id, title: assignment.title },
  });

  return {
    assignment,
    courses: await listTeacherCourses(env, auth.user.id),
  };
}

export async function updateTeacherAssignment(request, env, auth, body) {
  const courseId = validateRequiredString(body.courseId, "Curso", 255);
  const assignmentId = validateRequiredString(body.assignmentId, "Asignacion", 255);
  await assertTeacherOwnsCourse(env, auth.user.id, courseId);
  const course = await getPersistedCourse(env, courseId);
  const currentAssignment = (course.assignments ?? []).find((item) => item.id === assignmentId);

  if (!currentAssignment) {
    const error = new Error("Asignacion no encontrada.");
    error.status = 404;
    throw error;
  }

  const nextAssignment = {
    ...currentAssignment,
    ...normalizeAssignmentDraft(body, currentAssignment),
  };

  await updateCollectionItem(env, "courses", {
    ...course,
    assignments: (course.assignments ?? []).map((item) => (item.id === assignmentId ? nextAssignment : item)),
  });

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "teacher.assignment_update",
    entityType: "course",
    entityId: courseId,
    detailsJson: { assignmentId, title: nextAssignment.title },
  });

  return {
    assignment: nextAssignment,
    courses: await listTeacherCourses(env, auth.user.id),
  };
}

export async function deleteTeacherAssignment(request, env, auth, body) {
  const courseId = validateRequiredString(body.courseId, "Curso", 255);
  const assignmentId = validateRequiredString(body.assignmentId, "Asignacion", 255);
  await assertTeacherOwnsCourse(env, auth.user.id, courseId);
  const course = await getPersistedCourse(env, courseId);
  const currentAssignment = (course.assignments ?? []).find((item) => item.id === assignmentId);

  if (!currentAssignment) {
    const error = new Error("Asignacion no encontrada.");
    error.status = 404;
    throw error;
  }

  if (currentAssignment.fileKey && env.MEDIA_BUCKET) {
    await env.MEDIA_BUCKET.delete(currentAssignment.fileKey);
  }

  const attachmentKeys = Array.isArray(currentAssignment.attachments)
    ? currentAssignment.attachments.map((attachment) => attachment?.fileKey).filter(Boolean)
    : [];

  if (attachmentKeys.length && env.MEDIA_BUCKET) {
    await Promise.all(attachmentKeys.map((fileKey) => env.MEDIA_BUCKET.delete(fileKey)));
  }

  await updateCollectionItem(env, "courses", {
    ...course,
    assignments: (course.assignments ?? []).filter((item) => item.id !== assignmentId),
  });

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "teacher.assignment_delete",
    entityType: "course",
    entityId: courseId,
    detailsJson: { assignmentId },
  });

  return {
    courses: await listTeacherCourses(env, auth.user.id),
  };
}

function findTeacherScopedItem(items, id, courseIds, label) {
  const item = items.find((entry) => entry.id === id);
  if (!item) {
    const error = new Error(`${label} no encontrado.`);
    error.status = 404;
    throw error;
  }

  if (!courseIds.has(item.courseId)) {
    const error = new Error(`No puedes gestionar un ${label.toLowerCase()} fuera de tu alcance docente.`);
    error.status = 403;
    throw error;
  }

  return item;
}

export async function updateTeacherSupportItem(request, env, auth, body) {
  const kind = cleanOptionalString(body.kind, 40).toLowerCase();
  const itemId = validateRequiredString(body.id, "Elemento", 255);
  const teacherCollections = await loadTeacherScopedCollections(env, auth.user.id);

  if (kind === "ticket") {
    const currentTicket = findTeacherScopedItem(teacherCollections.tickets, itemId, teacherCollections.courseIds, "Ticket");
    const nextStatus = normalizeSupportTicketStatus(body.status ?? currentTicket.status ?? "open");
    const isClosingNow = nextStatus === "closed" && currentTicket.status !== "closed";
    const isReopening = nextStatus !== "closed" && currentTicket.status === "closed";

    await updateCollectionItem(env, "supportTickets", {
      ...currentTicket,
      status: nextStatus,
      priority: normalizeSupportTicketPriority(body.priority ?? currentTicket.priority ?? "normal"),
      adminNote: cleanOptionalString(body.adminNote ?? currentTicket.adminNote, 2000),
      closedAt: isClosingNow ? nowIso() : isReopening ? "" : currentTicket.closedAt || "",
      updatedAt: nowIso(),
    });

    await writeAuditLog(env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(request),
      eventType: "teacher.support_ticket_update",
      entityType: "supportTicket",
      entityId: itemId,
      detailsJson: { status: nextStatus },
    });

    return listTeacherSupport(env, auth.user.id);
  }

  if (kind === "course-request") {
    const currentRequest = findTeacherScopedItem(
      teacherCollections.courseRequests,
      itemId,
      teacherCollections.courseIds,
      "Solicitud"
    );
    const nextStatus = normalizeCourseRequestStatus(body.status ?? currentRequest.status ?? "open");
    const isClosingNow = nextStatus === "closed" && currentRequest.status !== "closed";
    const isReopening = nextStatus !== "closed" && currentRequest.status === "closed";

    await updateCollectionItem(env, "courseInterestRequests", {
      ...currentRequest,
      status: nextStatus,
      adminNote: cleanOptionalString(body.adminNote ?? currentRequest.adminNote, 2000),
      closedAt: isClosingNow ? nowIso() : isReopening ? "" : currentRequest.closedAt || "",
      updatedAt: nowIso(),
    });

    await writeAuditLog(env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(request),
      eventType: "teacher.course_request_update",
      entityType: "courseInterestRequest",
      entityId: itemId,
      detailsJson: { status: nextStatus },
    });

    return listTeacherSupport(env, auth.user.id);
  }

  if (kind === "thread") {
    const currentThread = findTeacherScopedItem(teacherCollections.threads, itemId, teacherCollections.courseIds, "Hilo");
    const bestReplyId = cleanOptionalString(body.bestReplyId ?? currentThread.bestReplyId, 255);

    if (bestReplyId && !(currentThread.replies ?? []).some((reply) => reply.id === bestReplyId)) {
      throw badRequest("La respuesta seleccionada no existe en este hilo.");
    }

    await updateCollectionItem(env, "communityThreads", normalizeCommunityThread({
      ...currentThread,
      status: normalizeCommunityThreadStatus(body.status ?? currentThread.status ?? "open"),
      visibility: normalizeCommunityThreadVisibility(body.visibility ?? currentThread.visibility ?? "visible"),
      bestReplyId,
      adminNote: cleanOptionalString(body.adminNote ?? currentThread.adminNote, 2000),
      lastAdminActionAt: nowIso(),
      updatedAt: nowIso(),
    }));

    await writeAuditLog(env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(request),
      eventType: "teacher.community_thread_update",
      entityType: "communityThread",
      entityId: itemId,
      detailsJson: { status: body.status, visibility: body.visibility, bestReplyId },
    });

    return listTeacherSupport(env, auth.user.id);
  }

  throw badRequest("Tipo de soporte invalido.");
}
