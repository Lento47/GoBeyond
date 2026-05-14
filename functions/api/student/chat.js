import { requireAuth } from "../../_lib/auth";
import { getContent } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { assertTrustedOrigin, enforceRequestThrottle, readJsonBody, recordRequestAttempt, throttlePolicies } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";

const MODEL = "@cf/meta/llama-3.2-1b-instruct";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CONTENT = 500;
const MAX_CONTEXT_COURSES = 4;
const MAX_CONTEXT_PROGRAMS = 6;
const GENERIC_DENIAL_PATTERNS = [
  /^no tengo informaci[oó]n/i,
  /^no cuento con informaci[oó]n/i,
  /^no puedo acceder/i,
  /^no tengo acceso/i,
  /^no puedo ver/i,
  /^no puedo consultar/i,
  /mi capacidad se limita/i,
  /informaci[oó]n personal/i,
];

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

function formatActiveEnrollmentLine(item) {
  const course = item.course ?? {};
  const progress = Number(item.enhancement?.progressPercent ?? 0);
  const assignments = Array.isArray(course.assignments) ? course.assignments.length : 0;

  return [
    `- ${trimText(course.title, 100) || "Curso sin titulo"}`,
    `formato: ${trimText(course.format, 40) || "N/D"}`,
    `duracion: ${trimText(course.duration, 40) || "N/D"}`,
    `vence: ${item.accessExpiresAt ? new Date(item.accessExpiresAt).toLocaleDateString("es-CR") : "N/D"}`,
    `progreso: ${progress}%`,
    `asignaciones visibles: ${assignments}`,
    `detalle tareas: ${formatAssignments(course)}`,
  ].join(" | ");
}

function buildProgressSummary(activeEnrollments) {
  if (!activeEnrollments.length) {
    return "No tiene cursos activos en este momento.";
  }

  const averageProgress = Math.round(
    activeEnrollments.reduce((sum, item) => sum + Number(item.enhancement?.progressPercent ?? 0), 0) / activeEnrollments.length,
  );
  const nextExpiry = activeEnrollments
    .map((item) => item.accessExpiresAt)
    .filter(Boolean)
    .sort()[0];

  return [
    `Cursos activos: ${activeEnrollments.length}.`,
    `Progreso promedio visible: ${averageProgress}%.`,
    nextExpiry ? `Proximo vencimiento visible: ${new Date(nextExpiry).toLocaleDateString("es-CR")}.` : "No hay vencimientos visibles.",
  ].join(" ");
}

function buildContext(user, content, enrollments) {
  const activeEnrollments = enrollments
    .filter((item) => item.status === "active")
    .slice(0, MAX_CONTEXT_COURSES);

  const activeCourseLines = activeEnrollments.map(formatActiveEnrollmentLine);

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
    `Oferta principal de GoBeyond: Project Management, AI, Scrum y programas relacionados de empleabilidad, mejora continua y agilidad.`,
    `Estudiante: ${trimText(user.fullName, 80)}`,
    `Resumen operativo del estudiante: ${buildProgressSummary(activeEnrollments)}`,
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
  const activeCourseLines = activeEnrollments.slice(0, 4).map((item) => {
    const title = item.course?.title || "Curso sin titulo";
    const progress = Number(item.enhancement?.progressPercent ?? 0);
    const expires = item.accessExpiresAt ? new Date(item.accessExpiresAt).toLocaleDateString("es-CR") : "sin fecha visible";
    return `- ${title}: ${progress}% de progreso · acceso hasta ${expires}`;
  });

  if (
    normalized.includes("progreso") ||
    normalized.includes("avance") ||
    normalized.includes("como voy") ||
    normalized.includes("cómo voy")
  ) {
    if (activeCourseLines.length) {
      return ["Esto es lo visible en tu progreso actual dentro de GoBeyond:", ...activeCourseLines].join("\n");
    }

    return "Por ahora no veo cursos activos con progreso visible en tu portal.";
  }

  if (
    normalized.includes("mis cursos") ||
    normalized.includes("curso activo") ||
    normalized.includes("que llevo") ||
    normalized.includes("qué llevo") ||
    normalized.includes("matricul")
  ) {
    if (activeCourseLines.length) {
      return ["Estos son tus cursos activos visibles en este momento:", ...activeCourseLines].join("\n");
    }

    return "No veo matriculas activas en este momento dentro de tu portal.";
  }

  if (
    normalized.includes("vence") ||
    normalized.includes("vencimiento") ||
    normalized.includes("expira") ||
    normalized.includes("acceso")
  ) {
    if (activeEnrollments.length) {
      return [
        "Esto es lo visible sobre vigencia y acceso de tus cursos activos:",
        ...activeEnrollments.slice(0, 4).map((item) => {
          const title = item.course?.title || "Curso sin titulo";
          const expires = item.accessExpiresAt ? new Date(item.accessExpiresAt).toLocaleDateString("es-CR") : "sin fecha visible";
          return `- ${title}: acceso vigente hasta ${expires}`;
        }),
      ].join("\n");
    }

    return "Por ahora no veo accesos activos con fecha de vencimiento visible.";
  }

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

function isGenericDenialResponse(answer) {
  return GENERIC_DENIAL_PATTERNS.some((pattern) => pattern.test(answer));
}

function buildMessages(systemContext, history, message) {
  return [
    {
      role: "system",
      content: [
        "Eres el asistente puntual de GoBeyond para estudiantes.",
        "Responde siempre en espanol claro.",
        "Usa un tono breve, util y orientado a accion.",
        "SI tienes acceso al contexto del portal del estudiante incluido abajo.",
        "Cuando el estudiante pregunte por sus cursos, progreso, acceso, tareas o matriculas, responde primero con ese contexto personal visible.",
        "Nunca digas que no puedes acceder a informacion personal o del portal si el contexto incluido ya trae cursos activos, progreso, asignaciones o vencimientos.",
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
    assertTrustedOrigin(context.request, context.env);
    await enforceRequestThrottle(context.env, context.request, throttlePolicies.studentChat, {
      actorUserId: auth.user.id,
    });
    await recordRequestAttempt(context.env, context.request, throttlePolicies.studentChat, {
      actorUserId: auth.user.id,
      detailsJson: {
        route: "student.chat",
      },
    });
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
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
      !rawAnswer || isGenericDenialResponse(rawAnswer)
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
