import { createId } from "./util";

export async function writeAuditLog(env, event) {
  await env.DB.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, ip_address, event_type, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      createId("audit"),
      event.actorUserId ?? null,
      event.ipAddress ?? null,
      event.eventType,
      event.entityType ?? null,
      event.entityId ?? null,
      event.detailsJson ? JSON.stringify(event.detailsJson) : null
    )
    .run();
}
