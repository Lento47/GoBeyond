import { writeAuditLog } from "./audit";
import { listStudentEnrollments } from "./enrollments";
import { getClientIp, createId, nowIso, parseJsonOrNull } from "./util";
import { badRequest, validateRequiredString } from "./validation";

export const COMMUNITY_SECTION = "communityThreads";
const COMMUNITY_RETENTION_MONTHS = 6;
const THREAD_STATUSES = new Set(["open", "resolved", "closed"]);
const THREAD_VISIBILITIES = new Set(["visible", "hidden"]);

function addMonths(isoValue, months) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
}

function normalizeStatus(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return THREAD_STATUSES.has(normalized) ? normalized : "open";
}

function normalizeVisibility(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return THREAD_VISIBILITIES.has(normalized) ? normalized : "visible";
}

function cleanOptionalString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

function sanitizeTags(value) {
  const entries = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",");

  return Array.from(
    new Set(
      entries
        .map((item) => cleanOptionalString(item, 80).toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 8);
}

function normalizeReply(reply) {
  const createdAt = cleanOptionalString(reply?.createdAt, 80) || nowIso();

  return {
    id: cleanOptionalString(reply?.id, 255) || createId("reply"),
    authorId: cleanOptionalString(reply?.authorId, 255),
    authorName: cleanOptionalString(reply?.authorName, 255) || "Estudiante GoBeyond",
    authorEmail: cleanOptionalString(reply?.authorEmail, 255),
    body: cleanOptionalString(reply?.body, 3000),
    createdAt,
  };
}

export function normalizeCommunityThread(thread) {
  const createdAt = cleanOptionalString(thread?.createdAt, 80) || nowIso();
  const replies = Array.isArray(thread?.replies) ? thread.replies.map(normalizeReply) : [];
  const replyIds = new Set(replies.map((reply) => reply.id));
  const bestReplyId = cleanOptionalString(thread?.bestReplyId, 255);

  return {
    id: cleanOptionalString(thread?.id, 255) || createId("thread"),
    title: cleanOptionalString(thread?.title, 255),
    body: cleanOptionalString(thread?.body, 5000),
    category: cleanOptionalString(thread?.category, 80) || "general",
    courseId: cleanOptionalString(thread?.courseId, 255),
    courseTitle: cleanOptionalString(thread?.courseTitle, 255) || "Comunidad general",
    tags: sanitizeTags(thread?.tags),
    authorId: cleanOptionalString(thread?.authorId, 255),
    authorName: cleanOptionalString(thread?.authorName, 255) || "Estudiante GoBeyond",
    authorEmail: cleanOptionalString(thread?.authorEmail, 255),
    sourcePage: cleanOptionalString(thread?.sourcePage, 255) || "/comunidad",
    status: normalizeStatus(thread?.status),
    visibility: normalizeVisibility(thread?.visibility),
    createdAt,
    updatedAt: cleanOptionalString(thread?.updatedAt, 80) || createdAt,
    expiresAt: cleanOptionalString(thread?.expiresAt, 80) || addMonths(createdAt, COMMUNITY_RETENTION_MONTHS),
    replies,
    bestReplyId: replyIds.has(bestReplyId) ? bestReplyId : "",
    adminNote: cleanOptionalString(thread?.adminNote, 2000),
    lastAdminActionAt: cleanOptionalString(thread?.lastAdminActionAt, 80),
  };
}

function isExpiredThread(thread) {
  const expiresAtValue = cleanOptionalString(thread?.expiresAt, 80) || addMonths(thread?.createdAt || nowIso(), COMMUNITY_RETENTION_MONTHS);
  const expiresAt = new Date(expiresAtValue);
  if (!Number.isNaN(expiresAt.getTime())) {
    return expiresAt.getTime() <= Date.now();
  }

  const createdAt = new Date(thread?.createdAt || "");
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  createdAt.setUTCMonth(createdAt.getUTCMonth() + COMMUNITY_RETENTION_MONTHS);
  return createdAt.getTime() <= Date.now();
}

async function readCommunityRows(env) {
  const result = await env.DB.prepare(
    "SELECT id, value_json, position FROM collection_items WHERE section = ? ORDER BY position ASC"
  )
    .bind(COMMUNITY_SECTION)
    .all();

  return result.results ?? [];
}

async function saveCommunityThread(env, thread) {
  const normalizedThread = normalizeCommunityThread(thread);
  const existing = await env.DB.prepare(
    "SELECT id FROM collection_items WHERE section = ? AND id = ? LIMIT 1"
  )
    .bind(COMMUNITY_SECTION, normalizedThread.id)
    .first();

  if (existing) {
    await env.DB.prepare(
      `UPDATE collection_items
       SET value_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE section = ? AND id = ?`
    )
      .bind(JSON.stringify(normalizedThread), COMMUNITY_SECTION, normalizedThread.id)
      .run();

    return normalizedThread;
  }

  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM collection_items WHERE section = ?"
  )
    .bind(COMMUNITY_SECTION)
    .first();

  const nextPosition = Number(positionRow?.maxPosition ?? -1) + 1;

  await env.DB.prepare(
    `INSERT INTO collection_items (id, section, value_json, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(normalizedThread.id, COMMUNITY_SECTION, JSON.stringify(normalizedThread), nextPosition)
    .run();

  return normalizedThread;
}

export async function deleteCommunityThread(env, threadId) {
  await env.DB.prepare("DELETE FROM collection_items WHERE section = ? AND id = ?")
    .bind(COMMUNITY_SECTION, threadId)
    .run();
}

export async function purgeExpiredCommunityThreads(env) {
  const rows = await readCommunityRows(env);

  for (const row of rows) {
    const parsed = parseJsonOrNull(row.value_json);
    if (!parsed) {
      continue;
    }

    const normalizedThread = normalizeCommunityThread(parsed);
    if (isExpiredThread(normalizedThread)) {
      await deleteCommunityThread(env, row.id);
    }
  }
}

export async function listCommunityThreads(env, { includeHidden = false } = {}) {
  await purgeExpiredCommunityThreads(env);
  const rows = await readCommunityRows(env);

  return rows
    .map((row) => parseJsonOrNull(row.value_json))
    .filter(Boolean)
    .map(normalizeCommunityThread)
    .filter((thread) => includeHidden || thread.visibility !== "hidden")
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
}

export async function getCommunityThread(env, threadId) {
  await purgeExpiredCommunityThreads(env);

  const row = await env.DB.prepare(
    "SELECT id, value_json FROM collection_items WHERE section = ? AND id = ? LIMIT 1"
  )
    .bind(COMMUNITY_SECTION, threadId)
    .first();

  if (!row?.value_json) {
    return null;
  }

  const parsed = parseJsonOrNull(row.value_json);
  return parsed ? normalizeCommunityThread(parsed) : null;
}

async function resolveStudentCourse(env, studentUserId, courseId) {
  if (!courseId) {
    return {
      courseId: "",
      courseTitle: "Comunidad general",
    };
  }

  const enrollments = await listStudentEnrollments(env, studentUserId);
  const enrollment = enrollments.find((item) => item.courseId === courseId || item.course?.id === courseId);

  return {
    courseId: enrollment?.courseId || "",
    courseTitle: enrollment?.course?.title || "Comunidad general",
  };
}

export async function createCommunityThread(request, env, auth, body) {
  const title = validateRequiredString(body.title, "Titulo", 255);
  const threadBody = validateRequiredString(body.body, "Detalle", 5000);
  const category = cleanOptionalString(body.category, 80) || "general";
  const tags = sanitizeTags(body.tags);
  const relatedCourse = await resolveStudentCourse(env, auth.user.id, cleanOptionalString(body.courseId, 255));
  const createdAt = nowIso();

  const thread = await saveCommunityThread(env, {
    id: createId("thread"),
    title,
    body: threadBody,
    category,
    courseId: relatedCourse.courseId,
    courseTitle: relatedCourse.courseTitle,
    tags: Array.from(new Set([category, ...(relatedCourse.courseTitle !== "Comunidad general" ? sanitizeTags([relatedCourse.courseTitle]) : []), ...tags])),
    authorId: auth.user.id,
    authorName: auth.user.fullName,
    authorEmail: auth.user.email,
    sourcePage: "/comunidad",
    status: "open",
    visibility: "visible",
    createdAt,
    updatedAt: createdAt,
    expiresAt: addMonths(createdAt, COMMUNITY_RETENTION_MONTHS),
    replies: [],
    bestReplyId: "",
    adminNote: "",
  });

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "community.thread_create",
    entityType: COMMUNITY_SECTION,
    entityId: thread.id,
    detailsJson: { courseId: thread.courseId, category: thread.category },
  });

  return thread;
}

export async function replyToCommunityThread(request, env, auth, threadId, body) {
  const currentThread = await getCommunityThread(env, threadId);
  if (!currentThread || currentThread.visibility === "hidden") {
    const issue = new Error("Hilo no encontrado.");
    issue.status = 404;
    throw issue;
  }

  const replyBody = validateRequiredString(body.body, "Respuesta", 3000);
  const reply = normalizeReply({
    id: createId("reply"),
    authorId: auth.user.id,
    authorName: auth.user.fullName,
    authorEmail: auth.user.email,
    body: replyBody,
    createdAt: nowIso(),
  });

  const nextThread = await saveCommunityThread(env, {
    ...currentThread,
    replies: [...currentThread.replies, reply],
    updatedAt: reply.createdAt,
  });

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "community.reply_create",
    entityType: COMMUNITY_SECTION,
    entityId: threadId,
    detailsJson: { replyId: reply.id },
  });

  return nextThread;
}

export async function updateCommunityThreadByStudent(request, env, auth, threadId, body) {
  const currentThread = await getCommunityThread(env, threadId);
  if (!currentThread || currentThread.visibility === "hidden") {
    const issue = new Error("Hilo no encontrado.");
    issue.status = 404;
    throw issue;
  }

  if (currentThread.authorId !== auth.user.id && auth.user.role !== "admin") {
    const issue = new Error("No autorizado para editar este hilo.");
    issue.status = 403;
    throw issue;
  }

  let nextStatus = currentThread.status;
  let nextBestReplyId = currentThread.bestReplyId;

  if (body.status !== undefined) {
    nextStatus = normalizeStatus(body.status);
  }

  if (body.bestReplyId !== undefined) {
    const requestedReplyId = cleanOptionalString(body.bestReplyId, 255);
    if (requestedReplyId && !currentThread.replies.some((reply) => reply.id === requestedReplyId)) {
      throw badRequest("La respuesta seleccionada no existe en este hilo.");
    }

    nextBestReplyId = requestedReplyId;
    if (requestedReplyId) {
      nextStatus = "resolved";
    }
  }

  const nextThread = await saveCommunityThread(env, {
    ...currentThread,
    status: nextStatus,
    bestReplyId: nextBestReplyId,
    updatedAt: nowIso(),
  });

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "community.thread_update",
    entityType: COMMUNITY_SECTION,
    entityId: threadId,
    detailsJson: { status: nextStatus, bestReplyId: nextBestReplyId },
  });

  return nextThread;
}
