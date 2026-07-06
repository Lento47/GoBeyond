import { requireAuth } from "../../_lib/auth";
import { error, json, options } from "../../_lib/response";
import { runAI, MODELS } from "../../_lib/ai";

export async function onRequestOptions() { return options(); }

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student", "teacher", "admin"]);
    const role = auth.user.role || "student";
    const name = auth.user.fullName?.split(" ")[0] || "Usuario";

    const roleContext = role === "admin"
      ? "un administrador que gestiona la plataforma, usuarios, cursos y contenido"
      : role === "teacher"
        ? "un docente que crea materiales, revisa tareas y apoya estudiantes"
        : "un estudiante que toma cursos, completa asignaciones y busca certificarse";
    const prompt = `Genera 3 sugerencias breves, personalizadas y utiles para ${name}, ${roleContext} en GoBeyond. Cada frase maximo 70 caracteres. Varialas: no uses siempre el mismo formato. Responde UNICAMENTE con un array JSON de 3 strings.`;

    const response = await runAI(context.env, {
      model: MODELS.fast,
      messages: [{ role: "user", content: prompt }],
      options: { max_tokens: 150, temperature: 0.9 },
    });

    // Robust parsing: try direct JSON first, then extract array from text
    let prompts = [];
    try {
      const cleaned = response.replace(/```json|```/g, "").trim();
      prompts = JSON.parse(cleaned);
    } catch {
      // Extract strings between quotes
      const matches = response.match(/"([^"]{3,80})"/g);
      if (matches) prompts = matches.map(m => m.slice(1, -1)).slice(0, 3);
    }
    return json({ prompts: Array.isArray(prompts) && prompts.length ? prompts.slice(0, 3) : ["Listo para aprender algo nuevo hoy", "Tu esfuerzo constante construye tu futuro", "Cada certificacion te acerca a tus metas"] });
  } catch (err) {
    return error(err.message, err.status || 500);
  }
}
