import { requireAuth } from "../../../_lib/auth";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { runAI, PROMPTS } from "../../../_lib/ai";
import { listStudentEnrollments } from "../../../_lib/enrollments";

function parseCoachResponse(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.response === "string") {
      return {
        response: parsed.response,
        steps: Array.isArray(parsed.steps) ? parsed.steps : undefined,
        resources: Array.isArray(parsed.resources) ? parsed.resources : undefined,
      };
    }
  } catch {
    // Not valid JSON; fall through to wrap raw text
  }

  return { response: raw };
}

function buildCoachSystemPrompt(assignment, hasDraft, hasMessage) {
  const context = {
    assignmentTitle: assignment.title || "Sin titulo",
    assignmentInstructions: assignment.instructions || assignment.description || "No especificadas",
    dueLabel: assignment.dueLabel || assignment.dueDate || "No definida",
  };

  let prompt = PROMPTS.assignmentCoach(context);

  prompt += `\n\nDebes responder en el siguiente formato JSON (sin marcas de codigo, solo el objeto JSON):
{
  "response": "tu respuesta en espanol aqui",
  "steps": ["Paso 1...", "Paso 2...", "Paso 3..."],
  "resources": ["Recurso o tema 1", "Recurso o tema 2"]
}

Donde "response" es tu respuesta principal, "steps" son pasos accionables para completar la tarea, y "resources" son temas o recursos que el estudiante deberia revisar.
- Si el estudiante envio un borrador (draft), revisalo contra los criterios de la tarea y da retroalimentacion constructiva sin resolverlo por el.
- Si el estudiante hizo una pregunta (message), respondela especificamente sobre la tarea.
- Si solo proporciono el ID de la tarea sin borrador ni pregunta, ayuda a planificar como abordarla.`;

  return prompt;
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const assignmentId = String(body.assignmentId ?? "").trim();
    const message = String(body.message ?? "").trim();
    const draft = String(body.draft ?? "").trim();

    if (!assignmentId) {
      return error("El ID de la tarea es requerido.", 400);
    }

    // Fetch the student's enrollments and search only their courses for the assignment
    const enrollments = await listStudentEnrollments(context.env, auth.user.id);
    const activeCourseIds = enrollments
      .filter((item) => item.status === "active" && item.courseId)
      .map((item) => item.courseId);

    if (activeCourseIds.length === 0) {
      return error("No tienes cursos activos.", 404);
    }

    const placeholders = activeCourseIds.map(() => "?").join(",");
    const rows = await context.env.DB.prepare(
      `SELECT value_json FROM collection_items WHERE section = 'courses' AND id IN (${placeholders})`
    )
      .bind(...activeCourseIds)
      .all();

    let foundAssignment = null;

    for (const row of (rows.results ?? [])) {
      if (!row.value_json) continue;

      let course;
      try {
        course = JSON.parse(row.value_json);
      } catch {
        continue;
      }

      if (!Array.isArray(course?.assignments)) continue;

      const match = course.assignments.find(
        (a) => String(a.id ?? "") === assignmentId
      );

      if (match) {
        foundAssignment = {
          ...match,
          courseTitle: course.title || "",
        };
        break;
      }
    }

    if (!foundAssignment) {
      return error("Tarea no encontrada en tus cursos activos.", 404);
    }

    const hasDraft = draft.length > 0;
    const hasMessage = message.length > 0;
    const systemPrompt = buildCoachSystemPrompt(foundAssignment, hasDraft, hasMessage);

    let userContent = "";

    if (hasDraft && hasMessage) {
      userContent = `Esta es mi tarea y tengo una pregunta:\n\nTarea: ${foundAssignment.title}\n\nMi borrador:\n${draft}\n\nMi pregunta:\n${message}`;
    } else if (hasDraft) {
      userContent = `Este es mi borrador para la tarea "${foundAssignment.title}". Por favor revisalo:\n\n${draft}`;
    } else if (hasMessage) {
      userContent = `Sobre la tarea "${foundAssignment.title}": ${message}`;
    } else {
      userContent = `Ayudame a planificar como abordar la tarea "${foundAssignment.title}".`;
    }

    const rawResponse = await runAI(context.env, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      options: { max_tokens: 2048, temperature: 0.6 },
    });

    const result = parseCoachResponse(rawResponse);

    return json({
      response: result.response,
      steps: result.steps,
      resources: result.resources,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
