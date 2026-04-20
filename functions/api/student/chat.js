import { requireAuth } from "../../_lib/auth";
import { getContent } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { error, json, options } from "../../_lib/response";

const MODEL = "@cf/meta/llama-3.2-1b-instruct";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CONTENT = 500;
const MAX_CONTEXT_COURSES = 4;
const MAX_CONTEXT_PROGRAMS = 6;

function trimText(value, limit) {
  return String(value ?? "").trim().slice(0, limit);
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      content: trimText(item.content, MAX_HISTORY_CONTENT),
    }))
    .filter((item) => item.content);
}

function formatAssignments(course) {
  const assignments = Array.isArray(course.assignments) ? course.assignments.slice(0, 3) : [];
  if (!assignments.length) {
    return "Sin asignaciones visibles.";
  }

  return assignments
    .map((assignment) => {
      const due = assignment.dueLabel ? ` (${trimText(assignment.dueLabel, 80)})` : "";
      return `${trimText(assignment.title, 80)}${due}`;
    })
    .join("; ");
}

function buildContext(user, content, enrollments) {
  const activeEnrollments = enrollments
    .filter((item) => item.status === "active")
    .slice(0, MAX_CONTEXT_COURSES);

  const activeCourseLines = activeEnrollments.map((item) => {
    const course = item.course ?? {};
    const progress = Number(item.enhancement?.progressPercent ?? 0);
    return [
      `- ${trimText(course.title, 100) || "Curso sin titulo"}`,
      `formato: ${trimText(course.format, 40) || "N/D"}`,
      `duracion: ${trimText(course.duration, 40) || "N/D"}`,
      `vence: ${item.accessExpiresAt ? new Date(item.accessExpiresAt).toLocaleDateString("es-CR") : "N/D"}`,
      `progreso: ${progress}%`,
      `asignaciones: ${formatAssignments(course)}`,
    ].join(" | ");
  });

  const visibleCourses = (content.courses ?? [])
    .filter((course) => !activeEnrollments.some((item) => item.courseId === course.id))
    .slice(0, 4)
    .map((course) => `- ${trimText(course.title, 100)} (${trimText(course.format, 40)} · ${trimText(course.duration, 40)})`);

  const liveSessions = (content.liveSessions ?? [])
    .slice(0, 3)
    .map((session) => `- ${trimText(session.title, 100)} (${trimText(session.date, 60)})`);

  const learningPath = (content.learningPath ?? [])
    .slice(0, MAX_CONTEXT_PROGRAMS)
    .map((item) => `- ${trimText(item.title, 100)}: ${trimText(item.status, 180)}`);

  const allPrograms = (content.courses ?? [])
    .slice(0, MAX_CONTEXT_PROGRAMS)
    .map((course) => {
      const title = trimText(course.title, 100);
      const format = trimText(course.format, 40);
      const duration = trimText(course.duration, 40);
      const description = trimText(course.description, 180);
      return `- ${title} (${format} · ${duration}): ${description}`;
    });

  return [
    `Programa: ${trimText(content.brand?.name, 80)}`,
    `Descripcion institucional: ${trimText(content.brand?.description, 220)}`,
    `Oferta principal de GoBeyond: Project Management, Six Sigma, Scrum y programas relacionados de empleabilidad, mejora continua y agilidad.`,
    `Estudiante: ${trimText(user.fullName, 80)}`,
    `Cursos activos (${activeCourseLines.length}):`,
    activeCourseLines.length ? activeCourseLines.join("\n") : "- No tiene cursos activos en este momento.",
    `Cursos visibles para explorar:`,
    visibleCourses.length ? visibleCourses.join("\n") : "- No hay cursos adicionales visibles.",
    `Oferta general y programas disponibles en GoBeyond:`,
    allPrograms.length ? allPrograms.join("\n") : "- No hay programas cargados en la plataforma.",
    `Ruta de aprendizaje institucional:`,
    learningPath.length ? learningPath.join("\n") : "- No hay ruta de aprendizaje visible por ahora.",
    `Sesiones o temas proximos:`,
    liveSessions.length ? liveSessions.join("\n") : "- No hay sesiones visibles por ahora.",
    `Regla importante: responde solo con informacion de GoBeyond, cursos, acceso, progreso, asignaciones y pasos practicos. Si algo no esta en el contexto, dilo claramente sin inventar.`,
  ].join("\n");
}

function buildFallbackAnswer(message, content, enrollments) {
  const normalized = trimText(message, 400).toLowerCase();
  const courses = content.courses ?? [];
  const activeEnrollments = enrollments.filter((item) => item.status === "active");

  if (normalized.includes("programa") || normalized.includes("curso") || normalized.includes("oferta")) {
    if (courses.length) {
      const programLines = courses
        .slice(0, 4)
        .map((course) => `- ${course.title}: ${course.format} · ${course.duration}`);

      return [
        "Estos son algunos programas visibles de GoBeyond:",
        ...programLines,
        activeEnrollments.length
          ? "Tambien puedo ayudarte a revisar cuales de ellos ya tienes activos en tu portal."
          : "Si quieres, tambien puedo orientarte sobre cual podria ajustarse mejor a tu perfil.",
      ].join("\n");
    }
  }

  if (normalized.includes("asignacion") || normalized.includes("tarea")) {
    const assignments = activeEnrollments
      .flatMap((item) => (item.course?.assignments ?? []).map((assignment) => `${item.course?.title || "Curso"}: ${assignment.title}`))
      .slice(0, 4);

    if (assignments.length) {
      return ["Estas son asignaciones visibles en tus cursos activos:", ...assignments.map((item) => `- ${item}`)].join("\n");
    }

    return "Por ahora no veo asignaciones publicadas en tus cursos activos.";
  }

  return "Puedo ayudarte con tus cursos activos, progreso, asignaciones y la oferta visible de GoBeyond. Hazme una pregunta puntual y te respondo con lo disponible en tu portal.";
}

function buildMessages(systemContext, history, message) {
  return [
    {
      role: "system",
      content: [
        "Eres el asistente puntual de GoBeyond para estudiantes.",
        "Responde siempre en espanol claro.",
        "Usa un tono breve, util y orientado a accion.",
        "No inventes datos, politicas, fechas ni accesos.",
        "Si el estudiante pregunta algo fuera del contexto disponible, indicale que debe consultar al equipo administrativo.",
        "Da respuestas de maximo 5 lineas o 3 bullets cortos.",
        `Contexto operativo:\n${systemContext}`,
      ].join("\n"),
    },
    ...history,
    {
      role: "user",
      content: message,
    },
  ];
}

function shouldSuggestTicket(message, answer) {
  const combined = `${trimText(message, 500)} ${trimText(answer, 800)}`.toLowerCase();

  return [
    "administrador",
    "admin",
    "contact",
    "problema",
    "error",
    "soporte",
    "ayuda",
    "ticket",
    "incidencia",
  ].some((keyword) => combined.includes(keyword));
}

function buildSuggestedTicket(message, enrollments) {
  const activeEnrollment = enrollments.find((item) => item.status === "active");

  return {
    subject: trimText(message, 120) || "Solicitud de soporte desde el portal",
    description: `El estudiante solicita ayuda desde el asistente de GoBeyond.\n\nConsulta original:\n${trimText(message, 1000)}`,
    category: "soporte",
    courseId: activeEnrollment?.courseId ?? "",
  };
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    if (!context.env.AI) {
      const unavailable = new Error("El asistente IA aun no esta configurado en Cloudflare para este entorno.");
      unavailable.status = 503;
      throw unavailable;
    }

    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await context.request.json().catch(() => ({}));
    const message = trimText(body.message, MAX_MESSAGE_LENGTH);

    if (!message) {
      const invalid = new Error("La pregunta es requerida.");
      invalid.status = 400;
      throw invalid;
    }

    const history = sanitizeHistory(body.history);
    const [content, enrollments] = await Promise.all([
      getContent(context.env),
      listStudentEnrollments(context.env, auth.user.id),
    ]);

    const systemContext = buildContext(auth.user, content, enrollments);
    const result = await context.env.AI.run(MODEL, {
      messages: buildMessages(systemContext, history, message),
      max_tokens: 140,
      temperature: 0.2,
      top_p: 0.85,
      repetition_penalty: 1.05,
    });

    const rawAnswer = trimText(result?.response, 1400);
    const answer =
      !rawAnswer ||
      /^no tengo informaci[oó]n/i.test(rawAnswer) ||
      /^no cuento con informaci[oó]n/i.test(rawAnswer)
        ? buildFallbackAnswer(message, content, enrollments)
        : rawAnswer;

    return json({
      answer,
      suggestTicket: shouldSuggestTicket(message, answer),
      suggestedTicket: buildSuggestedTicket(message, enrollments),
      usage: result?.usage ?? null,
      model: MODEL,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
