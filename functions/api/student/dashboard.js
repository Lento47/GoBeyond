import { requireAuth } from "../../_lib/auth";
import { getContent } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { error, json } from "../../_lib/response";

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

function sanitizeAssignments(assignments) {
  let changed = false;

  const nextAssignments = (assignments ?? []).map((assignment) => {
    const uploadedAt = assignment.fileUploadedAt ? new Date(assignment.fileUploadedAt) : null;
    const expiresAt = assignment.fileExpiresAt
      ? new Date(assignment.fileExpiresAt)
      : uploadedAt
        ? addBusinessDays(uploadedAt, 5)
        : null;

    const isExpired = expiresAt ? Date.now() > expiresAt.getTime() : false;

    if (isExpired && (assignment.fileData || assignment.fileName || assignment.fileKey || assignment.fileUrl)) {
      changed = true;
    }

    return {
      ...assignment,
      fileData: isExpired ? "" : assignment.fileData ?? "",
      fileUrl: isExpired ? "" : assignment.fileUrl ?? "",
      fileKey: isExpired ? "" : assignment.fileKey ?? "",
      fileName: isExpired ? "" : assignment.fileName ?? "",
      fileExpired: isExpired,
      fileExpiresAt: expiresAt ? expiresAt.toISOString() : assignment.fileExpiresAt ?? "",
    };
  });

  return {
    assignments: nextAssignments,
    changed,
  };
}

async function cleanupCourseAssignments(env, course) {
  const { assignments, changed } = sanitizeAssignments(course.assignments);

  if (!changed) {
    return {
      ...course,
      assignments,
    };
  }

  const nextCourse = {
    ...course,
    assignments,
  };

  const currentAssignments = course.assignments ?? [];
  const deletionPromises = currentAssignments
    .filter((assignment) => {
      const uploadedAt = assignment.fileUploadedAt ? new Date(assignment.fileUploadedAt) : null;
      const expiresAt = assignment.fileExpiresAt
        ? new Date(assignment.fileExpiresAt)
        : uploadedAt
          ? addBusinessDays(uploadedAt, 5)
          : null;
      const isExpired = expiresAt ? Date.now() > expiresAt.getTime() : false;
      return isExpired && assignment.fileKey;
    })
    .map((assignment) => env.MEDIA_BUCKET?.delete(assignment.fileKey));

  await Promise.all(deletionPromises);

  await env.DB.prepare(
    `UPDATE collection_items
     SET value_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE section = 'courses' AND id = ?`
  )
    .bind(JSON.stringify(nextCourse), course.id)
    .run();

  return nextCourse;
}

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const content = await getContent(context.env);
    const enrollments = await listStudentEnrollments(context.env, auth.user.id);
    const activeEnrollments = enrollments.filter((item) => item.status === "active");
    const enrolledCourseIds = new Set(activeEnrollments.map((item) => item.courseId));
    const availableCourses = (content.courses ?? []).filter((course) => !enrolledCourseIds.has(course.id));

    return json({
      user: auth.user,
      dashboard: {
        welcomeTitle: `Bienvenido, ${auth.user.fullName}`,
        summary:
          "Este es tu espacio protegido para revisar tus cursos activos, fechas de acceso y la ruta de desarrollo que GoBeyond ha preparado para ti.",
        enrollments: activeEnrollments,
        courses: (
          await Promise.all(
            activeEnrollments.map(async (item) => {
              const course = item.course ?? {};
              const nextCourse = await cleanupCourseAssignments(context.env, course);

              return {
                ...nextCourse,
                enrollmentId: item.id,
                enrollmentStatus: item.status,
                accessExpiresAt: item.accessExpiresAt,
                enhancement: item.enhancement ?? {
                  gamificationEnabled: false,
                  progressPercent: 0,
                  points: 0,
                  streakDays: 0,
                },
              };
            })
          )
        )
          .filter((course) => Boolean(course?.id)),
        availableCourses,
        learningPath: content.learningPath ?? [],
        upcomingTopics: content.liveSessions ?? [],
      },
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
