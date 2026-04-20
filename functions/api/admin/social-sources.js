import { requireAuth } from "../../_lib/auth";
import { writeAuditLog } from "../../_lib/audit";
import { assertTrustedOrigin, readJsonBody } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";
import {
  createSocialSource,
  deleteSocialSource,
  listSocialSources,
  updateSocialSource,
  validateSocialSourcePayload,
} from "../../_lib/socialNews";
import { createId, getClientIp } from "../../_lib/util";

export async function onRequestOptions() {
  return options();
}

export async function onRequestGet(context) {
  try {
    await requireAuth(context.request, context.env, ["admin"]);
    const sources = await listSocialSources(context.env);
    return json({ sources });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const body = await readJsonBody(context.request, { maxBytes: 32_000 });
    const payload = validateSocialSourcePayload(body);
    const sourceId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : createId("social_source");

    await createSocialSource(context.env, {
      id: sourceId,
      ...payload,
    });

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "social_source.create",
      entityType: "social_source",
      entityId: sourceId,
    });

    const sources = await listSocialSources(context.env);
    return json({ sources }, { status: 201 });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestPut(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const sourceId = new URL(context.request.url).searchParams.get("id");

    if (!sourceId) {
      return error("Falta el id.", 400);
    }

    const body = await readJsonBody(context.request, { maxBytes: 32_000 });
    const payload = validateSocialSourcePayload(body);

    await updateSocialSource(context.env, sourceId, payload);

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "social_source.update",
      entityType: "social_source",
      entityId: sourceId,
    });

    const sources = await listSocialSources(context.env);
    return json({ sources });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);
    assertTrustedOrigin(context.request, context.env);
    const sourceId = new URL(context.request.url).searchParams.get("id");

    if (!sourceId) {
      return error("Falta el id.", 400);
    }

    await deleteSocialSource(context.env, sourceId);

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "social_source.delete",
      entityType: "social_source",
      entityId: sourceId,
    });

    const sources = await listSocialSources(context.env);
    return json({ sources });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
