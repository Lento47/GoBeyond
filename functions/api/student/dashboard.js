import { requireAuth } from "../../_lib/auth";
import { cleanupCourseAssignmentFiles } from "../../_lib/assignmentFiles";
import { getContent } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { getNextPendingUserNotification } from "../../_lib/notifications";
import { error, json } from "../../_lib/response";

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const [content, enrollments, notificationBanner] = await Promise.all([
      getContent(context.env),
      listStudentEnrollments(context.env, auth.user.id),
      getNextPendingUserNotification(context.env, auth.user.id),
    ]);
    const activeEnrollments = enrollments.filter((item) => item.status === "active");
    const enrolledCourseIds = new Set(activeEnrollments.map((item) => item.courseId));
    const availableCourses = (content.courses ?? []).filter((course) => !enrolledCourseIds.has(course.id));

    return json({
      user: auth.user,
      notificationBanner,
      dashboard: {
        welcomeTitle: `Bienvenido, ${auth.user.fullName}`,
        summary:
          "Este es tu espacio protegido para revisar tus cursos activos, fechas de acceso y la ruta de desarrollo que GoBeyond ha preparado para ti.",
        enrollments: activeEnrollments,
        courses: (
          await Promise.all(
            activeEnrollments.map(async (item) => {
              const course = item.course ?? {};
              const nextCourse = await cleanupCourseAssignmentFiles(context.env, course);

              return {
                ...nextCourse,
                enrollmentId: item.id,
                enrollmentStatus: item.status,
                completionStatus: item.completionStatus ?? "in_progress",
                completedAt: item.completedAt ?? null,
                accessExpiresAt: item.accessExpiresAt,
                enhancement: item.enhancement ?? {
                  gamificationEnabled: false,
                  progressPercent: 0,
                  points: 0,
                  streakDays: 0,
                  passingThreshold: 80,
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
