import { requireAuth } from "../../../_lib/auth";
import { runAI, PROMPTS } from "../../../_lib/ai";
import { assertTrustedOrigin, readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { validateRequiredString } from "../../../_lib/validation";

const VALID_CONTENT_TYPES = new Set(["thread", "announcement", "course", "assignment"]);

const CONTENT_TYPE_LABELS = {
  thread: "publicacion de comunidad",
  announcement: "anuncio oficial",
  course: "descripcion de curso",
  assignment: "instrucciones de tarea",
};

const CONTENT_GUIDELINES = {
  thread:
    "Genera una publicacion de comunidad atractiva y conversacional con un titulo llamativo. " +
    "Incluye un cuerpo que invite a la discusion, plantee preguntas abiertas y fomente la participacion de los estudiantes. " +
    "Usa un tono cercano pero respetuoso.",
  announcement:
    "Genera un anuncio oficial claro y bien estructurado. " +
    "Usa formato formal pero accesible. Incluye un asunto destacado, cuerpo informativo y un llamado a la accion claro. " +
    "Separa secciones con encabezados y usa listas para informacion clave.",
  course:
    "Genera una descripcion completa de curso. " +
    "Incluye: titulo sugerido, descripcion general, objetivos de aprendizaje (3-5 resultados), " +
    "temario resumido, audiencia objetivo, y relevancia practica. " +
    "Organiza con encabuesos y listas.",
  assignment:
    "Genera instrucciones de tarea con estructura clara. " +
    "Incluye: titulo, objetivo de aprendizaje, instrucciones paso a paso, criterios de evaluacion, " +
    "formato de entrega, y fecha de referencia. " +
    "Usa listas numeradas para los pasos y viñetas para los criterios.",
};

const TONE_OPTIONS = [
  "profesional y accesible",
  "formal",
  "motivacional",
  "conversacional",
  "didactico",
];

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);

    const body = await readJsonBody(context.request, { maxBytes: 64_000 });

    const prompt = validateRequiredString(body.prompt, "El prompt", 4000);
    const contentType = String(body.contentType ?? "general").trim().toLowerCase();
    const tone = String(body.tone ?? "profesional y accesible").trim().toLowerCase();

    if (contentType !== "general" && !VALID_CONTENT_TYPES.has(contentType)) {
      return error(
        `Tipo de contenido invalido. Valores permitidos: ${[...VALID_CONTENT_TYPES].join(", ")}.`,
        400
      );
    }

    if (!TONE_OPTIONS.includes(tone)) {
      return error(
        `Tono invalido. Opciones: ${TONE_OPTIONS.join(", ")}.`,
        400
      );
    }

    const aiContext = {
      prompt,
      contentType: CONTENT_TYPE_LABELS[contentType] ?? contentType,
      tone,
      format: "markdown",
      guidelines: CONTENT_GUIDELINES[contentType] ?? "",
    };

    const systemPrompt = PROMPTS.adminContentGenerator(aiContext);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    const options_ = {
      max_tokens: contentType === "course" || contentType === "assignment" ? 2048 : 1024,
      temperature: contentType === "thread" ? 0.8 : 0.6,
    };

    const content = await runAI(context.env, {
      messages,
      options: options_,
    });

    return json({ content });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
