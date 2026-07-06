import { requireAuth } from "../../../_lib/auth";
import { getContent } from "../../../_lib/content";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { runAI, PROMPTS } from "../../../_lib/ai";
import { listStudentEnrollments } from "../../../_lib/enrollments";

function aggregateMetrics(enrollments) {
  let completed = 0;
  let totalPoints = 0;
  let maxStreak = 0;

  for (const item of enrollments) {
    if (item.completionStatus === "passed") {
      completed++;
    }
    const enh = item.enhancement ?? {};
    totalPoints += Number(enh.points ?? 0);
    const sd = Number(enh.streakDays ?? 0);
    if (sd > maxStreak) maxStreak = sd;
  }

  return {
    completedCourses: completed,
    totalCourses: enrollments.length,
    points: totalPoints,
    streakDays: maxStreak,
  };
}

function buildNavigatorContext(action, authUser, enrollments, metrics, learningPath) {
  const activeEnrollments = enrollments.filter((item) => item.status === "active");
  const inProgress = activeEnrollments.filter(
    (item) => item.completionStatus !== "passed"
  );
  const passed = activeEnrollments.filter(
    (item) => item.completionStatus === "passed"
  );

  const coursesContext = activeEnrollments.map((item) => {
    const course = item.course ?? {};
    const enh = item.enhancement ?? {};
    return {
      title: course.title || "Curso sin titulo",
      progressPercent: Number(enh.progressPercent ?? 0),
      completionStatus: item.completionStatus ?? "in_progress",
      points: Number(enh.points ?? 0),
      streakDays: Number(enh.streakDays ?? 0),
    };
  });

  const base = {
    studentName: authUser.fullName,
    learningPath: learningPath ?? [],
    completedCourses: metrics.completedCourses,
    streakDays: metrics.streakDays,
    points: metrics.points,
    courses: coursesContext,
    inProgressCount: inProgress.length,
    completedCount: passed.length,
  };

  return base;
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const action = String(body.action ?? "").trim().toLowerCase();

    if (!["progress", "next", "weekly"].includes(action)) {
      return error(
        "Accion no valida. Usa: progress, next, o weekly.",
        400
      );
    }

    const [content, enrollments] = await Promise.all([
      getContent(context.env),
      listStudentEnrollments(context.env, auth.user.id),
    ]);

    const metrics = aggregateMetrics(enrollments);
    const learningPath = content.learningPath ?? [];

    const navContext = buildNavigatorContext(
      action,
      auth.user,
      enrollments,
      metrics,
      learningPath
    );

    let userMessage = "";

    if (action === "progress") {
      const completedList = enrollments
        .filter((item) => item.completionStatus === "passed")
        .map((item) => item.course?.title || "Curso finalizado");

      userMessage = `Genera un resumen de mi progreso actual. He completado ${metrics.completedCourses} de ${metrics.totalCourses} cursos.`;
      if (completedList.length > 0) {
        userMessage += ` Cursos completados: ${completedList.join(", ")}.`;
      }
      userMessage += ` Puntos totales: ${metrics.points}, racha actual: ${metrics.streakDays} dias.`;
    } else if (action === "next") {
      const nextSteps = learningPath.filter(
        (step) => step.progressState !== "completed"
      );
      const activeCourseTitles = enrollments
        .filter((item) => item.status === "active" && item.completionStatus !== "passed")
        .map((item) => item.course?.title || "Curso en progreso");

      userMessage = `Recomiendame el siguiente curso o hito en mi ruta de aprendizaje.`;
      if (nextSteps.length > 0) {
        userMessage += ` Proximos pasos en la ruta: ${nextSteps
          .map((s) => s.title)
          .join(", ")}.`;
      }
      if (activeCourseTitles.length > 0) {
        userMessage += ` Cursos en progreso: ${activeCourseTitles.join(", ")}.`;
      }
      userMessage += ` Puntos totales: ${metrics.points}, racha actual: ${metrics.streakDays} dias.`;
    } else if (action === "weekly") {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const recentCompletions = enrollments.filter(
        (item) =>
          item.completionStatus === "passed" &&
          item.completedAt &&
          new Date(item.completedAt) >= weekStart
      );

      userMessage = `Genera un resumen semanal de mi progreso.`;
      userMessage += ` Cursos completados esta semana: ${recentCompletions.length}.`;
      userMessage += ` Total completado: ${metrics.completedCourses} de ${metrics.totalCourses}.`;
      userMessage += ` Puntos acumulados: ${metrics.points}, racha: ${metrics.streakDays} dias.`;
      if (learningPath.length > 0) {
        const nextUp = learningPath.find(
          (step) => step.progressState !== "completed"
        );
        if (nextUp) {
          userMessage += ` Siguiente en la ruta: ${nextUp.title}.`;
        }
      }
    }

    const systemPrompt = PROMPTS.learningNavigator(navContext);

    const rawResponse = await runAI(context.env, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      options: { max_tokens: 1024, temperature: 0.7 },
    });

    return json({
      response: rawResponse,
      action,
      metrics: {
        completed: metrics.completedCourses,
        streak: metrics.streakDays,
        points: metrics.points,
      },
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
