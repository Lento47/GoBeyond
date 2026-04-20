import { listStudentEnrollments } from "./enrollments";

function addBusinessDays(startDate, businessDays) {
  const result = new Date(startDate);
  let remaining = businessDays;

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return result;
}

function getAssignmentExpiry(assignment) {
  const uploadedAt = assignment?.fileUploadedAt ? new Date(assignment.fileUploadedAt) : null;

  if (assignment?.fileExpiresAt) {
    const explicitExpiry = new Date(assignment.fileExpiresAt);
    return Number.isNaN(explicitExpiry.getTime()) ? null : explicitExpiry;
  }

  if (!uploadedAt || Number.isNaN(uploadedAt.getTime())) {
    return null;
  }

  return addBusinessDays(uploadedAt, 5);
}

function isExpiredAssignment(assignment) {
  const expiresAt = getAssignmentExpiry(assignment);
  return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
}

function buildAssignmentDownloadUrl(courseId, assignmentId) {
  return `/api/secure/assignment-file?courseId=${encodeURIComponent(courseId)}&assignmentId=${encodeURIComponent(assignmentId)}`;
}

export function sanitizeCourseAssignments(course) {
  let changed = false;

  const assignments = (course?.assignments ?? []).map((assignment) => {
    const expired = isExpiredAssignment(assignment);
    const expiresAt = getAssignmentExpiry(assignment);

    if (expired && (assignment.fileData || assignment.fileName || assignment.fileKey || assignment.fileUrl)) {
      changed = true;
    }

    return {
      ...assignment,
      fileData: expired ? "" : assignment.fileData ?? "",
      fileExpired: expired,
      fileExpiresAt: expiresAt ? expiresAt.toISOString() : assignment.fileExpiresAt ?? "",
      fileKey: expired ? "" : assignment.fileKey ?? "",
      fileName: expired ? "" : assignment.fileName ?? "",
      fileUrl: expired
        ? ""
        : assignment.fileKey && assignment.id && course?.id
          ? buildAssignmentDownloadUrl(course.id, assignment.id)
          : assignment.fileUrl ?? "",
    };
  });

  return {
    changed,
    course: {
      ...course,
      assignments,
    },
    expiredKeys: (course?.assignments ?? [])
      .filter((assignment) => isExpiredAssignment(assignment) && assignment.fileKey)
      .map((assignment) => assignment.fileKey),
  };
}

export async function cleanupCourseAssignmentFiles(env, course) {
  const { changed, course: nextCourse, expiredKeys } = sanitizeCourseAssignments(course);

  if (!changed) {
    return nextCourse;
  }

  await Promise.all(expiredKeys.map((fileKey) => env.MEDIA_BUCKET?.delete(fileKey)));

  await env.DB.prepare(
    `UPDATE collection_items
     SET value_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE section = 'courses' AND id = ?`
  )
    .bind(JSON.stringify(nextCourse), nextCourse.id)
    .run();

  return nextCourse;
}

function cleanDownloadName(name) {
  return String(name ?? "archivo")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function resolveAssignmentFileDownload(env, auth, courseId, assignmentId) {
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

  const course = JSON.parse(row.value_json);
  const assignment = (course.assignments ?? []).find((item) => item?.id === assignmentId);

  if (!assignment || !assignment.fileKey) {
    const error = new Error("Archivo no encontrado.");
    error.status = 404;
    throw error;
  }

  if (auth.user.role === "student") {
    const enrollments = await listStudentEnrollments(env, auth.user.id);
    const hasActiveEnrollment = enrollments.some(
      (item) => item.status === "active" && (item.courseId === courseId || item.course?.id === courseId)
    );

    if (!hasActiveEnrollment) {
      const error = new Error("No autorizado para descargar este archivo.");
      error.status = 403;
      throw error;
    }
  }

  if (isExpiredAssignment(assignment)) {
    const error = new Error("El archivo adjunto ya expiro.");
    error.status = 410;
    throw error;
  }

  if (!env.MEDIA_BUCKET) {
    const error = new Error("MEDIA_BUCKET no esta configurado.");
    error.status = 500;
    throw error;
  }

  const object = await env.MEDIA_BUCKET.get(assignment.fileKey);
  if (!object) {
    const error = new Error("Archivo no encontrado.");
    error.status = 404;
    throw error;
  }

  return {
    contentType: assignment.fileType || object.httpMetadata?.contentType || "application/octet-stream",
    fileName: cleanDownloadName(assignment.fileName),
    object,
  };
}
