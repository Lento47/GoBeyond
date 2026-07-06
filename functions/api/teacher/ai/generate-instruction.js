import { requireAuth } from "../../../_lib/auth";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { runAI, MODELS } from "../../../_lib/ai";

const PROMPT = (ctx) => `Eres un asistente para docentes de GoBeyond. Genera instrucciones claras y bien estructuradas para una tarea o material de clase. Responde SOLO con el Markdown, sin explicaciones adicionales. En espanol.

Contexto: Titulo="${ctx.title}", Curso="${ctx.courseTitle}", Formato="${ctx.format}", Duracion="${ctx.duration}"

Estructura requerida:
## Objetivo
(1-2 lineas)
## Instrucciones
(pasos numerados concretos)
## Formato de entrega
(especificar)
## Criterios de evaluacion
(lista)`;

export async function onRequestOptions() { return options(); }

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["teacher", "admin"]);
    const body = await readJsonBody(context.request, { maxBytes: 4000 });
    const title = String(body.title || "").trim();
    if (!title) return error("Titulo requerido", 400);

    const response = await runAI(context.env, {
      model: MODELS.fast,
      messages: [
        { role: "system", content: PROMPT({ title, courseTitle: body.courseTitle || "", format: body.format || "", duration: body.duration || "" }) },
        { role: "user", content: `Genera instrucciones para: ${title}` },
      ],
      options: { max_tokens: 800, temperature: 0.7 },
    });

    return json({ instruction: response.trim() });
  } catch (err) {
    return error(err.message, err.status || 500);
  }
}
