import { requireAuth } from "../../../_lib/auth";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { runAI, PROMPTS } from "../../../_lib/ai";
import { listStudentEnrollments } from "../../../_lib/enrollments";

function buildStudentContext(user, enrollments) {
  const activeEnrollments = enrollments.filter((item) => item.status === "active");

  const courses = activeEnrollments.map((item) => {
    const course = item.course ?? {};
    return {
      title: course.title || "Curso sin titulo",
      progressPercent: Number(item.enhancement?.progressPercent ?? 0),
    };
  });

  const upcomingAssignments = activeEnrollments.flatMap((item) => {
    const course = item.course ?? {};
    const assignments = Array.isArray(course.assignments) ? course.assignments : [];
    return assignments.map((a) => ({
      title: a.title || "Asignacion sin titulo",
      dueLabel: a.dueLabel || null,
    }));
  });

  return {
    studentName: user.fullName,
    courses,
    upcomingAssignments,
  };
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const message = String(body.message ?? "").trim();

    if (!message) {
      return error("El mensaje es requerido.", 400);
    }

    const enrollments = await listStudentEnrollments(context.env, auth.user.id);
    const studentContext = buildStudentContext(auth.user, enrollments);
    const systemPrompt = PROMPTS.studyBuddy(studentContext);

    const response = await runAI(context.env, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const cleaned = PROMPTS.cleanResponse(response);
    return json({
      response: cleaned,
      role: "assistant",
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
