import { requireAuth } from "../../../_lib/auth";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { error, json, options } from "../../../_lib/response";
import { runAI, PROMPTS } from "../../../_lib/ai";
import { listCommunityThreads } from "../../../_lib/community";

const VALID_ACTIONS = new Set(["tag", "deduplicate", "improve"]);

// ---------------------------------------------------------------------------
// Tag parsing — PROMPTS.autoTagThread already asks for JSON; parse it safely
// ---------------------------------------------------------------------------

function parseTagResponse(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.suggestedTitle === "string") {
      return {
        suggestedTitle: parsed.suggestedTitle,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        category: typeof parsed.category === "string" ? parsed.category : "general",
        isDuplicate: !!parsed.isDuplicate,
        duplicateHint: typeof parsed.duplicateHint === "string" ? parsed.duplicateHint : "",
      };
    }
  } catch {
    // Not valid JSON from AI; return null so the caller falls back
  }
  return null;
}

// ---------------------------------------------------------------------------
// Title / content similarity scoring for deduplication
// ---------------------------------------------------------------------------

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s,.;:!?()\[\]{}\/\\|]+/)
    .filter((w) => w.length > 2);
}

function computeSimilarity(a, b) {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  if (!aTokens.length || !bTokens.length) return 0;

  // Exact / substring match
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 1;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.85;

  // Token overlap (Jaccard-like)
  const aSet = new Set(aTokens);
  let common = 0;
  for (const t of bTokens) {
    if (aSet.has(t)) common++;
  }
  return common / Math.max(aTokens.length, bTokens.length);
}

// ---------------------------------------------------------------------------
// Improve-action prompt builder and response parser
// ---------------------------------------------------------------------------

function buildImprovePrompt(content) {
  return `Revisa el siguiente contenido de un hilo de comunidad y sugiere mejoras de formato. Evalua:

1. **Bloques de codigo**: Si hay codigo sin formato, recomienda envolverlo en bloques con triple comilla invertida (\`\`\`) y especificar el lenguaje.
2. **Listas**: Si hay listas sin formato (items en lineas separadas sin guion ni numero), sugiere usar guiones o numeros para mejor legibilidad.
3. **Enlaces**: Si hay URLs sin formato markdown, recomienda usar [texto](url).
4. **Parrafos**: Sugiere dividir parrafos muy largos (mas de 5 lineas) para mejorar la lectura en pantalla.
5. **Tono**: Sugiere mantener un tono respetuoso y constructivo, evitando mayusculas sostenidas o lenguaje que pueda interpretarse como agresivo.

Devuelve SOLO un objeto JSON valido con este formato exacto (sin marcas de codigo, solo el JSON):

{
  "suggestions": ["Sugerencia concreta 1", "Sugerencia concreta 2"],
  "hasCodeBlocks": false,
  "hasUnformattedLists": false,
  "hasBareUrls": false,
  "summary": "Resumen breve de las mejoras sugeridas"
}

Contenido a revisar:
${content.slice(0, 3000)}`;
}

function parseImproveResponse(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.suggestions)) {
      return {
        suggestions: parsed.suggestions,
        hasCodeBlocks: !!parsed.hasCodeBlocks,
        hasUnformattedLists: !!parsed.hasUnformattedLists,
        hasBareUrls: !!parsed.hasBareUrls,
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
      };
    }
  } catch {
    // Not valid JSON; fall through
  }
  return null;
}

// ---------------------------------------------------------------------------
// Exported handlers
// ---------------------------------------------------------------------------

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, [
      "student",
      "teacher",
      "admin",
    ]);

    const body = await readJsonBody(context.request, { maxBytes: 32_000 });
    const action = String(body.action ?? "").trim().toLowerCase();
    const content = String(body.content ?? "").trim();

    if (!action || !VALID_ACTIONS.has(action)) {
      return error("Accion no valida. Usa: tag, deduplicate, o improve.", 400);
    }

    if (!content) {
      return error("El contenido es requerido.", 400);
    }

    // ---- tag ----------------------------------------------------------------
    if (action === "tag") {
      const promptContent = PROMPTS.autoTagThread({
        content: content.slice(0, 2000),
      });

      const rawResponse = await runAI(context.env, {
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que clasifica contenido de foro de comunidad. Devuelves solo JSON valido.",
          },
          { role: "user", content: promptContent },
        ],
        options: { max_tokens: 512, temperature: 0.3 },
      });

      const parsed = parseTagResponse(rawResponse);
      if (!parsed) {
        // AI did not return parseable JSON — supply a minimal fallback
        return json({
          result: {
            suggestedTitle: content.slice(0, 80),
            tags: [],
            category: "general",
            isDuplicate: false,
            duplicateHint: "",
          },
        });
      }

      return json({
        result: {
          suggestedTitle: parsed.suggestedTitle,
          tags: parsed.tags,
          category: parsed.category,
          isDuplicate: parsed.isDuplicate,
          duplicateHint: parsed.duplicateHint,
        },
      });
    }

    // ---- deduplicate --------------------------------------------------------
    if (action === "deduplicate") {
      const threads = await listCommunityThreads(context.env);
      const contentWords = new Set(tokenize(content));

      const matches = threads
        .map((thread) => {
          const titleScore = computeSimilarity(content, thread.title);
          const bodyTokens = tokenize(thread.body || "");
          const bodyCommon = bodyTokens.filter((w) => contentWords.has(w)).length;
          const bodyScore = bodyTokens.length
            ? bodyCommon / Math.max(contentWords.size, bodyTokens.length)
            : 0;
          const combinedScore = Math.max(titleScore, bodyScore * 0.7);

          return { thread, score: combinedScore };
        })
        .filter((item) => item.score > 0.25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((item) => ({
          id: item.thread.id,
          title: item.thread.title,
          category: item.thread.category,
          similarityScore: Math.round(item.score * 100) / 100,
          replyCount: item.thread.replies?.length || 0,
          createdAt: item.thread.createdAt,
        }));

      return json({ result: { matches } });
    }

    // ---- improve ------------------------------------------------------------
    if (action === "improve") {
      const improvePrompt = buildImprovePrompt(content);

      const rawResponse = await runAI(context.env, {
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que revisa formato de contenido en un foro de comunidad. Devuelves solo JSON valido.",
          },
          { role: "user", content: improvePrompt },
        ],
        options: { max_tokens: 1024, temperature: 0.3 },
      });

      const parsed = parseImproveResponse(rawResponse);
      if (!parsed) {
        return json({
          result: {
            suggestions: [
              "No se pudieron generar sugerencias automaticas. Revisa el formato manualmente.",
            ],
            hasCodeBlocks: false,
            hasUnformattedLists: false,
            hasBareUrls: false,
            summary: "Revisa que el codigo use bloques, las listas tengan formato y los enlaces usen markdown.",
          },
        });
      }

      return json({ result: parsed });
    }

    // Should never reach here because of the action guard above
    return error("Accion no implementada.", 500);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
