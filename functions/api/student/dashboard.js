import { requireAuth } from "../../_lib/auth";
import { getContent } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { error, json } from "../../_lib/response";

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
        courses: activeEnrollments
          .map((item) => ({
            ...item.course,
            enrollmentId: item.id,
            enrollmentStatus: item.status,
            accessExpiresAt: item.accessExpiresAt,
          }))
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
