import { requireAuth } from "../../_lib/auth";
import { applyApiSecurityHeaders, error } from "../../_lib/response";
import { resolveSopFileDownload } from "../../_lib/sops";

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin", "teacher"]);
    const sopId = String(new URL(context.request.url).searchParams.get("id") ?? "").trim();

    if (!sopId) {
      return error("Falta el id del SOP.", 400);
    }

    const asset = await resolveSopFileDownload(context.env, sopId);
    const headers = new Headers();
    asset.object.writeHttpMetadata(headers);
    headers.set("Content-Disposition", `attachment; filename="${asset.fileName}"`);
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
