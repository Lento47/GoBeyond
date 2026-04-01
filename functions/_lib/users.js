import { writeAuditLog } from "./audit";
import { getClientIp } from "./util";
import { validateAccountStatus, validateRequiredString, validateRole } from "./validation";

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status ?? "active",
    createdAt: row.created_at,
  };
}

export async function listUsers(env) {
  const result = await env.DB.prepare(
    `SELECT id, email, full_name, role, COALESCE(status, 'active') AS status, created_at
     FROM users
     ORDER BY created_at DESC`
  ).all();

  return (result.results ?? []).map(mapUser);
}

async function countActiveAdmins(env) {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND COALESCE(status, 'active') = 'active'"
  ).first();

  return Number(row?.count ?? 0);
}

export async function updateManagedUser(request, env, auth, userId, body) {
  const existingUser = await env.DB.prepare(
    `SELECT id, email, full_name, role, COALESCE(status, 'active') AS status
     FROM users
     WHERE id = ?
     LIMIT 1`
  )
    .bind(userId)
    .first();

  if (!existingUser) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }

  const fullName = validateRequiredString(body.fullName ?? existingUser.full_name, "Nombre completo", 255);
  const role = validateRole(body.role ?? existingUser.role);
  const status = validateAccountStatus(body.status ?? existingUser.status);

  if (
    existingUser.role === "admin" &&
    existingUser.status === "active" &&
    (role !== "admin" || status !== "active")
  ) {
    const activeAdmins = await countActiveAdmins(env);

    if (activeAdmins <= 1) {
      const error = new Error("Debe existir al menos un administrador activo.");
      error.status = 409;
      throw error;
    }
  }

  await env.DB.prepare(
    "UPDATE users SET full_name = ?, role = ?, status = ? WHERE id = ?"
  )
    .bind(fullName, role, status, userId)
    .run();

  if (status !== "active") {
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_update",
    entityType: "user",
    entityId: userId,
    detailsJson: { role, status },
  });

  return {
    ...mapUser(existingUser),
    fullName,
    role,
    status,
  };
}
