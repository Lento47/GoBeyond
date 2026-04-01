import { requireAuth } from "../../../_lib/auth";
import { createCollectionItem, deleteCollectionItem, getContent, updateCollectionItem } from "../../../_lib/content";
import { writeAuditLog } from "../../../_lib/audit";
import { error, json, options } from "../../../_lib/response";
import { createId, getClientIp } from "../../../_lib/util";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const body = await context.request.json();
    const item = {
      id: body.id ?? createId(context.params.section),
      ...body,
    };

    await createCollectionItem(context.env, context.params.section, item);

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "content.create_item",
      entityType: context.params.section,
      entityId: item.id,
    });

    const content = await getContent(context.env);
    return json(content, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const itemId = new URL(context.request.url).searchParams.get("id");

    if (!itemId) {
      return error("Falta el id.", 400);
    }

    await deleteCollectionItem(context.env, context.params.section, itemId);

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "content.delete_item",
      entityType: context.params.section,
      entityId: itemId,
    });

    const content = await getContent(context.env);
    return json(content);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    const itemId = new URL(context.request.url).searchParams.get("id");

    if (!itemId) {
      return error("Falta el id.", 400);
    }

    const body = await context.request.json();
    const item = {
      ...body,
      id: itemId,
    };

    await updateCollectionItem(context.env, context.params.section, item);

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "content.update_item",
      entityType: context.params.section,
      entityId: itemId,
    });

    const content = await getContent(context.env);
    return json(content);
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
