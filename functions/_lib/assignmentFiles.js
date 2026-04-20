import { listStudentEnrollments } from "./enrollments";

function normalizeAssignmentAttachment(attachment, courseId, assignmentId) {
  const expired = isExpiredAssignment(attachment);
  const expiresAt = getAssignmentExpiry(attachment);

  return {
    ...attachment,
    fileData: expired ? "" : attachment?.fileData ?? "",
    fileExpired: expired,
    fileExpiresAt: expiresAt ? expiresAt.toISOString() : attachment?.fileExpiresAt ?? "",
    fileKey: expired ? "" : attachment?.fileKey ?? "",
    fileName: expired ? "" : attachment?.fileName ?? "",
    fileType: attachment?.fileType ?? "",
    fileUrl: expired
      ? ""
      : attachment?.fileKey && assignmentId && courseId
        ? buildAssignmentDownloadUrl(courseId, assignmentId, attachment.id)
        : attachment?.fileUrl ?? "",
    id: attachment?.id || attachment?.fileKey || `attachment-${assignmentId || "item"}`,
  };
}

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

function buildAssignmentDownloadUrl(courseId, assignmentId, attachmentId = "") {
  const params = new URLSearchParams({
    courseId: String(courseId ?? ""),
    assignmentId: String(assignmentId ?? ""),
  });

  if (attachmentId) {
    params.set("attachmentId", String(attachmentId));
  }

  return `/api/secure/assignment-file?${params.toString()}`;
}

export function sanitizeCourseAssignments(course) {
  let changed = false;

  const assignments = (course?.assignments ?? []).map((assignment) => {
    const legacyAttachment =
      assignment?.fileKey || assignment?.fileName || assignment?.fileUrl || assignment?.fileData
        ? {
            id: "legacy",
            fileData: assignment.fileData ?? "",
            fileExpiresAt: assignment.fileExpiresAt ?? "",
            fileKey: assignment.fileKey ?? "",
            fileName: assignment.fileName ?? "",
            fileType: assignment.fileType ?? "",
            fileUploadedAt: assignment.fileUploadedAt ?? "",
            fileUrl: assignment.fileUrl ?? "",
          }
        : null;
    const sourceAttachments = Array.isArray(assignment?.attachments) && assignment.attachments.length
      ? assignment.attachments
      : legacyAttachment
        ? [legacyAttachment]
        : [];
    const attachments = sourceAttachments.map((attachment) => normalizeAssignmentAttachment(attachment, course?.id, assignment?.id));
    const primaryAttachment = attachments[0] ?? null;

    if (sourceAttachments.some((attachment) => isExpiredAssignment(attachment) && (attachment.fileData || attachment.fileName || attachment.fileKey || attachment.fileUrl))) {
      changed = true;
    }
    if (!Array.isArray(assignment?.attachments) && attachments.length) {
      changed = true;
    }

    return {
      ...assignment,
      attachments,
      fileData: primaryAttachment?.fileData ?? "",
      fileExpired: primaryAttachment?.fileExpired ?? false,
      fileExpiresAt: primaryAttachment?.fileExpiresAt ?? "",
      fileKey: primaryAttachment?.fileKey ?? "",
      fileName: primaryAttachment?.fileName ?? "",
      fileType: primaryAttachment?.fileType ?? "",
      fileUploadedAt: primaryAttachment?.fileUploadedAt ?? "",
      fileUrl: primaryAttachment?.fileUrl ?? "",
    };
  });

  return {
    changed,
    course: {
      ...course,
      assignments,
    },
    expiredKeys: assignments.flatMap((assignment) =>
      (assignment.attachments ?? [])
        .filter((attachment) => attachment.fileExpired && attachment.fileKey)
        .map((attachment) => attachment.fileKey)
    ),
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

export async function resolveAssignmentFileDownload(env, auth, courseId, assignmentId, attachmentId = "") {
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
  const attachments = Array.isArray(assignment?.attachments) && assignment.attachments.length
    ? assignment.attachments
    : assignment?.fileKey
      ? [{
          id: "legacy",
          fileExpiresAt: assignment.fileExpiresAt ?? "",
          fileKey: assignment.fileKey ?? "",
          fileName: assignment.fileName ?? "",
          fileType: assignment.fileType ?? "",
          fileUploadedAt: assignment.fileUploadedAt ?? "",
        }]
      : [];
  const targetAttachment = attachmentId
    ? attachments.find((item) => String(item?.id ?? "") === attachmentId)
    : attachments[0];

  if (!assignment || !targetAttachment?.fileKey) {
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

  if (isExpiredAssignment(targetAttachment)) {
    const error = new Error("El archivo adjunto ya expiro.");
    error.status = 410;
    throw error;
  }

  if (!env.MEDIA_BUCKET) {
    const error = new Error("MEDIA_BUCKET no esta configurado.");
    error.status = 500;
    throw error;
  }

  const object = await env.MEDIA_BUCKET.get(targetAttachment.fileKey);
  if (!object) {
    const error = new Error("Archivo no encontrado.");
    error.status = 404;
    throw error;
  }

  return {
    contentType: targetAttachment.fileType || object.httpMetadata?.contentType || "application/octet-stream",
    fileName: cleanDownloadName(targetAttachment.fileName),
    object,
  };
}
