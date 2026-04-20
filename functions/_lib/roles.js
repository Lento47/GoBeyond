import { nowIso } from "./util";
import { badRequest, validateRole } from "./validation";

const ROLE_PRIORITY = {
  admin: 0,
  teacher: 1,
  student: 2,
};

function normalizeInputRoles(values) {
  const entries = Array.isArray(values) ? values : values == null ? [] : [values];

  return entries
    .flatMap((value) => (typeof value === "string" ? value.split(",") : [value]))
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .map((value) => validateRole(value));
}

export function sortRoles(roles, primaryRole = "") {
  return Array.from(new Set(roles))
    .filter(Boolean)
    .sort((left, right) => {
      if (left === primaryRole) {
        return -1;
      }

      if (right === primaryRole) {
        return 1;
      }

      return (ROLE_PRIORITY[left] ?? 99) - (ROLE_PRIORITY[right] ?? 99);
    });
}

export function normalizeRoles(values, { fallback = [] } = {}) {
  const normalized = normalizeInputRoles(values);
  const fallbackRoles = normalizeInputRoles(fallback);
  const resolved = normalized.length ? normalized : fallbackRoles;

  if (!resolved.length) {
    throw badRequest("Debes asignar al menos un rol.");
  }

  return sortRoles(resolved);
}

export function resolveRoleSelection(input, { fallbackRole = "student", existingRole = "", existingRoles = [] } = {}) {
  const requestedRoles = [
    ...(Array.isArray(input?.roles) ? input.roles : input?.roles ? [input.roles] : []),
  ];

  if (input?.role) {
    requestedRoles.unshift(input.role);
  }

  if (input?.primaryRole) {
    requestedRoles.unshift(input.primaryRole);
  }

  const fallbackRoles = existingRoles.length ? existingRoles : existingRole ? [existingRole] : [fallbackRole];
  const roles = normalizeRoles(requestedRoles, { fallback: fallbackRoles });
  const primaryRole = validateRole(input?.primaryRole ?? input?.role ?? existingRole ?? roles[0] ?? fallbackRole);

  return {
    primaryRole,
    roles: sortRoles([primaryRole, ...roles], primaryRole),
  };
}

export function parseRolesCsv(value, fallbackRole = "") {
  const roles = normalizeInputRoles(String(value ?? "").split(","));
  return roles.length ? sortRoles(roles) : fallbackRole ? [validateRole(fallbackRole)] : [];
}

export function userHasRole(user, role) {
  const normalizedRole = validateRole(role);
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : user?.role ? [user.role] : [];
  return roles.includes(normalizedRole);
}

export async function hasUserRolesTable(env) {
  const row = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_roles' LIMIT 1"
  ).first();

  return Boolean(row?.name);
}

export async function hasSessionActiveRoleColumn(env) {
  const result = await env.DB.prepare("PRAGMA table_info(sessions)").all();
  return (result.results ?? []).some((column) => column.name === "active_role");
}

export async function listUserRoles(env, userId, fallbackRole = "") {
  if (!(await hasUserRolesTable(env))) {
    return fallbackRole ? [validateRole(fallbackRole)] : [];
  }

  const result = await env.DB.prepare(
    `SELECT role
     FROM user_roles
     WHERE user_id = ?
     ORDER BY CASE role
       WHEN 'admin' THEN 0
       WHEN 'teacher' THEN 1
       WHEN 'student' THEN 2
       ELSE 99
     END, created_at ASC`
  )
    .bind(userId)
    .all();

  const roles = (result.results ?? []).map((row) => validateRole(row.role));
  return roles.length ? sortRoles(roles) : fallbackRole ? [validateRole(fallbackRole)] : [];
}

export async function replaceUserRoles(env, userId, roles) {
  const normalizedRoles = normalizeRoles(roles);

  if (!(await hasUserRolesTable(env))) {
    return normalizedRoles;
  }

  await env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?").bind(userId).run();

  for (const role of normalizedRoles) {
    await env.DB.prepare(
      `INSERT INTO user_roles (user_id, role, created_at)
       VALUES (?, ?, ?)`
    )
      .bind(userId, role, nowIso())
      .run();
  }

  return normalizedRoles;
}

export async function countUsersWithRole(env, role, { status = "active" } = {}) {
  const normalizedRole = validateRole(role);

  if (!(await hasUserRolesTable(env))) {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = ? AND COALESCE(status, 'active') = ?"
    )
      .bind(normalizedRole, status)
      .first();

    return Number(row?.count ?? 0);
  }

  const row = await env.DB.prepare(
    `SELECT COUNT(DISTINCT u.id) AS count
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     WHERE ur.role = ? AND COALESCE(u.status, 'active') = ?`
  )
    .bind(normalizedRole, status)
    .first();

  return Number(row?.count ?? 0);
}
