import { resolveAssignmentFileDownload } from "../../_lib/assignmentFiles";
import { requireAuth } from "../../_lib/auth";
import { applyApiSecurityHeaders, error } from "../../_lib/response";

export async function onRequestGet(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin", "student"]);
    const url = new URL(context.request.url);
    const courseId = String(url.searchParams.get("courseId") ?? "").trim();
    const assignmentId = String(url.searchParams.get("assignmentId") ?? "").trim();

    if (!courseId || !assignmentId) {
      return error("Faltan parametros para descargar el archivo.", 400);
    }

    const asset = await resolveAssignmentFileDownload(context.env, auth, courseId, assignmentId);
    const headers = new Headers();
    asset.object.writeHttpMetadata(headers);
    headers.set("Content-Disposition", `attachment; filename="${asset.fileName || "archivo"}"`);
    headers.set("Content-Type", asset.contentType);
    headers.set("etag", asset.object.httpEtag);
    applyApiSecurityHeaders(headers, { cacheControl: "no-store" });

    return new Response(asset.object.body, {
      headers,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
