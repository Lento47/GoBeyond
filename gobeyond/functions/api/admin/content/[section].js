import { requireAuth } from "../../../_lib/auth";
import { getContent, saveBlock } from "../../../_lib/content";
import { writeAuditLog } from "../../../_lib/audit";
import { error, json, options } from "../../../_lib/response";
import { getClientIp } from "../../../_lib/util";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const body = await context.request.json();
    await saveBlock(context.env, context.params.section, body, auth.user.id);

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "content.update_section",
      entityType: "content_block",
      entityId: context.params.section,
    });

    const content = await getContent(context.env);
    return json(content);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
