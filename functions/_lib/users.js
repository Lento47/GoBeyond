import { writeAuditLog } from "./audit";
import { countUsersWithRole, hasUserRolesTable, listUserRoles, parseRolesCsv, replaceUserRoles, resolveRoleSelection } from "./roles";
import { getPasswordExpiresAt, getSecuritySettings, isPasswordExpired } from "./security";
import {
  hasTeacherCourseAssignmentsTable,
  listTeacherAssignmentsByUser,
  replaceTeacherCourseAssignments,
  validateTeacherCourseAssignments,
} from "./teacher";
import { getClientIp } from "./util";
import { validateAccountStatus, validateRequiredString } from "./validation";

function mapUser(row, securitySettings, teacherAssignmentsByUser = new Map()) {
  const passwordChangedAt = row.password_changed_at ?? row.created_at ?? null;
  const passwordExpiresAt = getPasswordExpiresAt(passwordChangedAt, securitySettings);
  const emailVerifiedAt = row.email_verified_at ?? null;
  const roles = row.roles_csv ? parseRolesCsv(row.roles_csv, row.role) : row.roles?.length ? row.roles : [row.role];
  const assignedCourses = teacherAssignmentsByUser.get(row.id) ?? [];

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    primaryRole: row.role,
    roles,
    status: row.status ?? "active",
    createdAt: row.created_at,
    emailVerifiedAt,
    emailVerified: Boolean(emailVerifiedAt),
    passwordChangedAt,
    passwordExpiresAt,
    passwordExpired: isPasswordExpired(passwordChangedAt, securitySettings),
    assignedCourseIds: assignedCourses.map((course) => course.id),
    assignedCourses,
  };
}

export async function listUsers(env) {
  const securitySettings = await getSecuritySettings(env);
  const teacherAssignmentsByUser = await listTeacherAssignmentsByUser(env);
  const query = (await hasUserRolesTable(env))
    ? `SELECT u.id, u.email, u.full_name, u.role, COALESCE(u.status, 'active') AS status, u.created_at, COALESCE(u.password_changed_at, u.created_at) AS password_changed_at, u.email_verified_at, GROUP_CONCAT(ur.role) AS roles_csv
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       GROUP BY u.id, u.email, u.full_name, u.role, u.status, u.created_at, u.password_changed_at, u.email_verified_at
       ORDER BY u.created_at DESC`
    : `SELECT id, email, full_name, role, COALESCE(status, 'active') AS status, created_at, COALESCE(password_changed_at, created_at) AS password_changed_at, email_verified_at
       FROM users
       ORDER BY created_at DESC`;

  const result = await env.DB.prepare(query).all();

  return (result.results ?? []).map((row) => mapUser(row, securitySettings, teacherAssignmentsByUser));
}

async function countActiveAdmins(env) {
  return countUsersWithRole(env, "admin");
}

export async function updateManagedUser(request, env, auth, userId, body) {
  const securitySettings = await getSecuritySettings(env);
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
  const existingRoles = await listUserRoles(env, userId, existingUser.role);
  const { primaryRole, roles } = resolveRoleSelection(body, {
    existingRole: existingUser.role,
    existingRoles,
  });

  if (roles.length > 1 && !(await hasUserRolesTable(env))) {
    const error = new Error("El acceso multi-rol aun no esta habilitado en esta base. Aplica la migracion 0006_multi_role_access.sql.");
    error.status = 409;
    throw error;
  }

  const assignedCourseIds = roles.includes("teacher")
    ? await validateTeacherCourseAssignments(env, body.assignedCourseIds)
    : [];

  const status = validateAccountStatus(body.status ?? existingUser.status);

  if (
    existingRoles.includes("admin") &&
    existingUser.status === "active" &&
    (!roles.includes("admin") || status !== "active")
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
    .bind(fullName, primaryRole, status, userId)
    .run();

  await replaceUserRoles(env, userId, roles);
  const supportsTeacherAssignments = await hasTeacherCourseAssignmentsTable(env);

  if (!roles.includes("teacher") && supportsTeacherAssignments) {
    await replaceTeacherCourseAssignments(env, userId, []);
  }

  if (roles.includes("teacher")) {
    await replaceTeacherCourseAssignments(env, userId, assignedCourseIds);
  }

  if (status !== "active") {
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_update",
    entityType: "user",
    entityId: userId,
    detailsJson: { role: primaryRole, roles, status, assignedCourseIds },
  });

  const teacherAssignmentsByUser = await listTeacherAssignmentsByUser(env);

  return {
    ...mapUser({ ...existingUser, roles }, securitySettings, teacherAssignmentsByUser),
    fullName,
    role: primaryRole,
    primaryRole,
    roles,
    status,
    assignedCourseIds,
  };
}

export async function deleteManagedUser(request, env, auth, userId) {
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

  if (auth.user.id === userId) {
    const error = new Error("No puedes eliminar tu propia cuenta desde la sesion actual.");
    error.status = 409;
    throw error;
  }

  const existingRoles = await listUserRoles(env, userId, existingUser.role);

  if (existingRoles.includes("admin") && existingUser.status === "active") {
    const activeAdmins = await countActiveAdmins(env);
    if (activeAdmins <= 1) {
      const error = new Error("Debe existir al menos un administrador activo.");
      error.status = 409;
      throw error;
    }
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.user_delete",
    entityType: "user",
    entityId: userId,
    detailsJson: {
      email: existingUser.email,
      role: existingUser.role,
      roles: existingRoles,
      status: existingUser.status,
    },
  });

  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

  return {
    id: existingUser.id,
    email: existingUser.email,
    fullName: existingUser.full_name,
    role: existingUser.role,
    primaryRole: existingUser.role,
    roles: existingRoles,
    status: existingUser.status,
  };
}
