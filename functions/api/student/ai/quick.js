import { requireAuth } from "../../../_lib/auth";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { runAI, MODELS } from "../../../_lib/ai";

const MAX_CONTENT_LENGTH = 4000;
const SUPPORTED_ACTIONS = ["summarize", "explain", "quiz"];

function buildSystemPrompt(action) {
  const prompts = {
    summarize:
      "Eres un asistente de resumen de GoBeyond. Genera un resumen de exactamente 3 bullets en espanol claro y conciso a partir del contenido proporcionado. Cada bullet debe capturar una idea principal. Usa lenguaje directo y evita adornos. Devuelve SOLO los 3 bullets, cada uno comenzando con un guion (-). No incluyas introducciones, ni comentarios adicionales.",

    explain:
      "Eres un tutor de GoBeyond que explica conceptos de forma sencilla. Explica el contenido proporcionado como si se lo estuvieras describiendo a un principiante absoluto. Usa analogias simples, evita jerga tecnica, y manten las oraciones cortas. Tu respuesta debe ser en espanol claro, de no mas de 4 parrafos breves. No asumas conocimiento previo del tema.",

    quiz:
      "Eres un generador de preguntas de practica de GoBeyond. A partir del contenido proporcionado, genera exactamente 3 preguntas de practica con sus respuestas. Formatea cada pregunta como:\n\n**Pregunta 1:** [pregunta]\n**Respuesta 1:** [respuesta]\n\n**Pregunta 2:** [pregunta]\n**Respuesta 2:** [respuesta]\n\n**Pregunta 3:** [pregunta]\n**Respuesta 3:** [respuesta]\n\nLas preguntas deben evaluar comprension del contenido, no memoria superficial. Las respuestas deben ser correctas y estar basadas unicamente en el contenido proporcionado. Responde en espanol.",
  };

  return prompts[action] ?? prompts.summarize;
}

function cleanContent(value) {
  return String(value ?? "").trim().slice(0, MAX_CONTENT_LENGTH);
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await readJsonBody(context.request, { maxBytes: 24_000 });
    const action = String(body.action ?? "").trim();
    const content = cleanContent(body.content);

    if (!SUPPORTED_ACTIONS.includes(action)) {
      return error(
        `Accion no soportada. Las acciones disponibles son: ${SUPPORTED_ACTIONS.join(", ")}.`,
        400,
      );
    }

    if (!content) {
      return error("El contenido es requerido.", 400);
    }

    const systemPrompt = buildSystemPrompt(action);

    const response = await runAI(context.env, {
      model: MODELS.fast,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Contenido:\n\n${content}`,
        },
      ],
      options: { max_tokens: 800, temperature: 0.3 },
    });

    return json({ result: response });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
