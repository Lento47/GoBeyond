import { requireAuth } from "../../../_lib/auth";
import { createCollectionItem, deleteCollectionItem, getContent, updateCollectionItem } from "../../../_lib/content";
import { assertTrustedOrigin, readJsonBody } from "../../../_lib/requestSecurity";
import { writeAuditLog } from "../../../_lib/audit";
import { error, json, options } from "../../../_lib/response";
import { createId, getClientIp } from "../../../_lib/util";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 64_000 });
    const normalizedId =
      typeof body.id === "string" && body.id.trim()
        ? body.id.trim()
        : createId(context.params.section);
    const item = {
      ...body,
      id: normalizedId,
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
    assertTrustedOrigin(context.request, context.env);
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
    assertTrustedOrigin(context.request, context.env);
    const itemId = new URL(context.request.url).searchParams.get("id");

    if (!itemId) {
      return error("Falta el id.", 400);
    }

    const body = await readJsonBody(context.request, { maxBytes: 64_000 });
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
