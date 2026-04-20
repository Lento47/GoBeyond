import { writeAuditLog } from "./audit";
import { createCollectionItem, deleteCollectionItem, getContent, updateCollectionItem } from "./content";
import { notifySopChangeResolved } from "./notifications";
import { createId, getClientIp, nowIso } from "./util";
import { badRequest, validateRequiredString } from "./validation";

const CHANGE_REQUEST_STATUSES = new Set(["open", "in_progress", "completed"]);
const SOP_VISIBILITY = new Set(["visible", "hidden"]);
const SOP_STATUSES = new Set(["draft", "in_review", "active", "obsolete"]);
const SOP_TYPES = new Set(["Politica", "SOP", "Instructivo", "Checklist", "Formato / Registro"]);

function cleanOptionalString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeChangeRequestStatus(value) {
  const normalized = cleanOptionalString(value, 40).toLowerCase();
  if (!CHANGE_REQUEST_STATUSES.has(normalized)) {
    throw badRequest("Estado de solicitud de SOP invalido.");
  }
  return normalized;
}

function sortByUpdatedAt(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function buildSopDownloadUrl(sopId) {
  return `/api/secure/sop-file?id=${encodeURIComponent(sopId)}`;
}

function normalizeSopVisibility(value) {
  const normalized = cleanOptionalString(value || "visible", 40).toLowerCase();
  if (!SOP_VISIBILITY.has(normalized)) {
    throw badRequest("La visibilidad del SOP es invalida.");
  }
  return normalized;
}

function normalizeSopStatus(value) {
  const normalized = cleanOptionalString(value || "draft", 40).toLowerCase();
  if (!SOP_STATUSES.has(normalized)) {
    throw badRequest("El estado del documento es invalido.");
  }
  return normalized;
}

function normalizeSopType(value) {
  const normalized = cleanOptionalString(value || "SOP", 80);
  if (!SOP_TYPES.has(normalized)) {
    throw badRequest("El tipo documental es invalido.");
  }
  return normalized;
}

function mapSopForClient(sop) {
  if (!sop || typeof sop !== "object") {
    return null;
  }

  return {
    ...sop,
    downloadUrl: sop.fileKey ? buildSopDownloadUrl(sop.id) : "",
  };
}

function mapChangeRequestForClient(changeRequest, sopLookup) {
  if (!changeRequest || typeof changeRequest !== "object") {
    return null;
  }

  const sop = sopLookup.get(changeRequest.sopId) ?? null;
  const comments = Array.isArray(changeRequest.comments) ? changeRequest.comments : [];
  const lastComment = comments.length ? comments[comments.length - 1] : null;

  return {
    ...changeRequest,
    comments,
    commentCount: comments.length,
    lastComment,
    sopTitle: sop?.title || changeRequest.sopTitle || "SOP sin titulo",
    sopCategory: sop?.category || "",
    sopVersion: sop?.version || "",
    downloadUrl: sop?.id ? buildSopDownloadUrl(sop.id) : "",
  };
}

function normalizeSopInput(input, fallback = {}, actorUserId = "") {
  const currentTime = nowIso();
  const next = {
    ...fallback,
    ...input,
  };

  const normalized = {
    id: validateRequiredString(next.id ?? fallback.id, "SOP", 255),
    title: validateRequiredString(next.title ?? fallback.title, "Titulo", 255),
    code: cleanOptionalString(next.code ?? fallback.code, 120),
    type: normalizeSopType(next.type ?? fallback.type),
    category: validateRequiredString(next.category ?? fallback.category, "Categoria", 120),
    description: validateRequiredString(next.description ?? fallback.description, "Descripcion", 4000),
    version: validateRequiredString(next.version ?? fallback.version, "Version", 60),
    status: normalizeSopStatus(next.status ?? fallback.status),
    visibility: normalizeSopVisibility(next.visibility ?? fallback.visibility),
    effectiveDate: cleanOptionalString(next.effectiveDate ?? fallback.effectiveDate, 120),
    areaOwner: cleanOptionalString(next.areaOwner ?? fallback.areaOwner, 255),
    preparedBy: cleanOptionalString(next.preparedBy ?? fallback.preparedBy, 255),
    reviewedBy: cleanOptionalString(next.reviewedBy ?? fallback.reviewedBy, 255),
    approvedBy: cleanOptionalString(next.approvedBy ?? fallback.approvedBy, 255),
    summary: cleanOptionalString(next.summary ?? fallback.summary, 4000),
    body: validateRequiredString(next.body ?? fallback.body, "Contenido del documento", 64_000),
    fileName: cleanOptionalString(next.fileName ?? fallback.fileName, 255),
    fileKey: cleanOptionalString(next.fileKey ?? fallback.fileKey, 1024),
    contentType: cleanOptionalString(next.contentType ?? fallback.contentType, 255) || "",
    size: Number(next.size ?? fallback.size ?? 0),
    uploadedAt: cleanOptionalString(next.uploadedAt ?? fallback.uploadedAt, 64) || "",
    updatedAt: currentTime,
    uploadedBy: cleanOptionalString(next.uploadedBy ?? fallback.uploadedBy, 255) || actorUserId,
  };

  if (normalized.fileKey && (!Number.isFinite(normalized.size) || normalized.size <= 0)) {
    throw badRequest("El archivo del SOP es invalido.");
  }

  if (!normalized.fileKey) {
    normalized.fileName = "";
    normalized.contentType = "";
    normalized.size = 0;
    normalized.uploadedAt = "";
  } else if (!normalized.contentType) {
    normalized.contentType = "application/octet-stream";
  }

  return normalized;
}

function createCommentPayload(auth, body) {
  return {
    id: createId("sop_comment"),
    authorUserId: auth.user.id,
    authorName: auth.user.fullName,
    authorEmail: auth.user.email,
    body: validateRequiredString(body.comment, "Comentario", 2000),
    createdAt: nowIso(),
  };
}

function findSop(content, sopId) {
  const sop = (content.sops ?? []).find((item) => item.id === sopId);
  if (!sop) {
    const error = new Error("SOP no encontrado.");
    error.status = 404;
    throw error;
  }
  return sop;
}

function findChangeRequest(content, requestId) {
  const request = (content.sopChangeRequests ?? []).find((item) => item.id === requestId);
  if (!request) {
    const error = new Error("Solicitud de SOP no encontrada.");
    error.status = 404;
    throw error;
  }
  return request;
}

function findOpenChangeRequest(content, sopId) {
  return (content.sopChangeRequests ?? []).find((item) => item.sopId === sopId && item.status !== "completed") ?? null;
}

export async function listAdminSops(env) {
  const content = await getContent(env);
  return {
    sops: sortByUpdatedAt((content.sops ?? []).map(mapSopForClient).filter(Boolean)),
  };
}

export async function listAdminSopChangeRequests(env) {
  const content = await getContent(env);
  const sopLookup = new Map((content.sops ?? []).map((sop) => [sop.id, sop]));
  return {
    changeRequests: sortByUpdatedAt((content.sopChangeRequests ?? []).map((item) => mapChangeRequestForClient(item, sopLookup)).filter(Boolean)),
  };
}

export async function createAdminSop(request, env, auth, body) {
  const normalized = normalizeSopInput(
    {
      ...body,
      id: body?.id || createId("sop"),
    },
    {},
    auth.user.id
  );

  await createCollectionItem(env, "sops", normalized);
  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.sop_create",
    entityType: "sop",
    entityId: normalized.id,
    detailsJson: {
      title: normalized.title,
      version: normalized.version,
    },
  });

  return { sop: mapSopForClient(normalized) };
}

export async function updateAdminSop(request, env, auth, sopId, body) {
  const content = await getContent(env);
  const currentSop = findSop(content, sopId);
  const nextSop = normalizeSopInput(
    {
      ...body,
      id: sopId,
    },
    currentSop,
    auth.user.id
  );

  if (currentSop.fileKey && currentSop.fileKey !== nextSop.fileKey && env.MEDIA_BUCKET) {
    await env.MEDIA_BUCKET.delete(currentSop.fileKey);
  }

  await updateCollectionItem(env, "sops", nextSop);
  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.sop_update",
    entityType: "sop",
    entityId: sopId,
    detailsJson: {
      title: nextSop.title,
      version: nextSop.version,
    },
  });

  return { sop: mapSopForClient(nextSop) };
}

export async function deleteAdminSop(request, env, auth, sopId) {
  const content = await getContent(env);
  const currentSop = findSop(content, sopId);
  const relatedRequests = (content.sopChangeRequests ?? []).filter((item) => item.sopId === sopId);

  if (currentSop.fileKey && env.MEDIA_BUCKET) {
    await env.MEDIA_BUCKET.delete(currentSop.fileKey);
  }

  for (const changeRequest of relatedRequests) {
    await deleteCollectionItem(env, "sopChangeRequests", changeRequest.id);
  }

  await deleteCollectionItem(env, "sops", sopId);
  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.sop_delete",
    entityType: "sop",
    entityId: sopId,
    detailsJson: {
      relatedRequestCount: relatedRequests.length,
    },
  });

  return { ok: true };
}

export async function listTeacherSops(env) {
  const content = await getContent(env);
  const visibleSops = (content.sops ?? []).filter((item) => normalizeSopVisibility(item.visibility ?? "visible") === "visible");
  const sops = sortByUpdatedAt(visibleSops.map(mapSopForClient).filter(Boolean));
  const sopLookup = new Map(visibleSops.map((sop) => [sop.id, sop]));
  const activeRequests = sortByUpdatedAt(
    (content.sopChangeRequests ?? [])
      .filter((item) => item.status !== "completed" && sopLookup.has(item.sopId))
      .map((item) => mapChangeRequestForClient(item, sopLookup))
      .filter(Boolean)
  );

  return {
    sops,
    activeRequests,
  };
}

export async function createTeacherSopChangeRequest(request, env, auth, body) {
  const content = await getContent(env);
  const sopId = validateRequiredString(body.sopId, "SOP", 255);
  const sop = findSop(content, sopId);
  const comment = createCommentPayload(auth, body);
  const currentRequest = findOpenChangeRequest(content, sopId);
  let nextRequest;
  let eventType;

  if (currentRequest) {
    nextRequest = {
      ...currentRequest,
      comments: [...(currentRequest.comments ?? []), comment],
      updatedAt: nowIso(),
    };
    await updateCollectionItem(env, "sopChangeRequests", nextRequest);
    eventType = "teacher.sop_change_request_comment";
  } else {
    nextRequest = {
      id: createId("sop_request"),
      sopId,
      sopTitle: sop.title,
      status: "open",
      requesterUserId: auth.user.id,
      requesterName: auth.user.fullName,
      requesterEmail: auth.user.email,
      comments: [comment],
      adminResolutionNote: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      closedAt: "",
    };
    await createCollectionItem(env, "sopChangeRequests", nextRequest);
    eventType = "teacher.sop_change_request_create";
  }

  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType,
    entityType: "sopChangeRequest",
    entityId: nextRequest.id,
    detailsJson: {
      sopId,
      commentId: comment.id,
    },
  });

  return {
    request: mapChangeRequestForClient(nextRequest, new Map([[sop.id, sop]])),
  };
}

export async function updateAdminSopChangeRequest(request, env, auth, requestId, body) {
  const content = await getContent(env);
  const currentRequest = findChangeRequest(content, requestId);
  const sop = findSop(content, currentRequest.sopId);
  const nextStatus = normalizeChangeRequestStatus(body.status ?? currentRequest.status ?? "open");
  const resolutionNote = cleanOptionalString(body.adminResolutionNote ?? currentRequest.adminResolutionNote, 2000);

  if (nextStatus === "completed" && !resolutionNote) {
    throw badRequest("La nota de resolución es obligatoria para completar la solicitud.");
  }

  const isCompletingNow = nextStatus === "completed" && currentRequest.status !== "completed";
  const isReopening = nextStatus !== "completed" && currentRequest.status === "completed";
  const nextRequest = {
    ...currentRequest,
    status: nextStatus,
    adminResolutionNote: resolutionNote,
    updatedAt: nowIso(),
    closedAt: isCompletingNow ? nowIso() : isReopening ? "" : currentRequest.closedAt || "",
  };

  await updateCollectionItem(env, "sopChangeRequests", nextRequest);
  await writeAuditLog(env, {
    actorUserId: auth.user.id,
    ipAddress: getClientIp(request),
    eventType: "admin.sop_change_request_update",
    entityType: "sopChangeRequest",
    entityId: requestId,
    detailsJson: {
      sopId: currentRequest.sopId,
      status: nextStatus,
    },
  });

  if (isCompletingNow && currentRequest.requesterUserId) {
    await notifySopChangeResolved(request, env, auth, {
      userId: currentRequest.requesterUserId,
      sopId: currentRequest.sopId,
      sopTitle: sop.title,
      resolutionNote,
      changeRequestId: requestId,
    });
  }

  return {
    request: mapChangeRequestForClient(nextRequest, new Map([[sop.id, sop]])),
  };
}

export async function resolveSopFileDownload(env, sopId) {
  const content = await getContent(env);
  const sop = findSop(content, sopId);

  if (!sop.fileKey) {
    const error = new Error("Este SOP no tiene un archivo disponible.");
    error.status = 404;
    throw error;
  }

  if (!env.MEDIA_BUCKET) {
    const error = new Error("MEDIA_BUCKET no esta configurado.");
    error.status = 500;
    throw error;
  }

  const object = await env.MEDIA_BUCKET.get(sop.fileKey);
  if (!object) {
    const error = new Error("Archivo no encontrado.");
    error.status = 404;
    throw error;
  }

  return {
    sop,
    object,
    fileName: cleanOptionalString(sop.fileName, 255) || "sop",
    contentType: cleanOptionalString(sop.contentType, 255) || object.httpMetadata?.contentType || "application/octet-stream",
  };
}
