import { requireAuth } from "../../../_lib/auth";
import { readJsonBody } from "../../../_lib/requestSecurity";
import { PROMPTS, MODELS } from "../../../_lib/ai";
import { getAppOrigin } from "../../../_lib/email";

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const url = new URL(context.request.url);
    const message = url.searchParams.get("message")?.trim();
    if (!message) return new Response("Missing message", { status: 400 });
    if (!context.env.AI) return new Response("AI binding not configured", { status: 503 });

    const systemPrompt = PROMPTS.studyBuddy({
      studentName: auth.user.fullName || "Estudiante",
      courses: [],
      upcomingAssignments: [],
    });

    const aiStream = await context.env.AI.run(MODELS.primary, {
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
      stream: true, max_tokens: 1024, temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let jsonBuf = "", thinkBuf = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of aiStream) {
            let raw = "";
            if (typeof chunk === "string") raw = chunk;
            else if (chunk instanceof Uint8Array) raw = decoder.decode(chunk);
            else if (chunk?.response) raw = String(chunk.response);
            else if (chunk != null) raw = String(chunk);
            if (!raw) continue;

            jsonBuf += raw;

            // Extract complete JSON objects from buffer (chunks are individual chars)
            while (true) {
              const start = jsonBuf.indexOf("{");
              if (start === -1) { jsonBuf = ""; break; }
              jsonBuf = jsonBuf.slice(start);
              let depth = 0, end = -1;
              for (let i = 0; i < jsonBuf.length; i++) {
                if (jsonBuf[i] === "{") depth++;
                else if (jsonBuf[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
              }
              if (end === -1) break; // incomplete object

              const objStr = jsonBuf.slice(0, end);
              jsonBuf = jsonBuf.slice(end);

              try {
                const parsed = JSON.parse(objStr);
                let text = parsed?.response || "";
                if (!text) continue;

                // Filter <think> blocks
                thinkBuf += text;
                if (thinkBuf.includes("<think>")) {
                  const closeIdx = thinkBuf.indexOf("</think>");
                  if (closeIdx === -1) continue;
                  text = thinkBuf.slice(closeIdx + 8);
                  thinkBuf = "";
                }
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
          controller.close();
        }
      },
    });

    const origin = getAppOrigin(context.request, context.env);
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": origin },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status || 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": getAppOrigin(context.request, context.env) } });
  }
}

export async function onRequestPost(context) {
  const body = await readJsonBody(context.request, { maxBytes: 8000 });
  const url = new URL(context.request.url);
  url.searchParams.set("message", body.message || "");
  return onRequestGet({ ...context, request: new Request(url.toString(), context.request) });
}

export function onRequestOptions(context) {
  const origin = getAppOrigin(context.request, context.env);
  return new Response(null, { headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
}
