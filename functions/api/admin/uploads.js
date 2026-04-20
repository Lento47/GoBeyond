import { requireAuth } from "../../_lib/auth";
import { assertBodySize, assertTrustedOrigin, enforceRequestThrottle, recordRequestAttempt, throttlePolicies } from "../../_lib/requestSecurity";
import { writeAuditLog } from "../../_lib/audit";
import { error, json, options } from "../../_lib/response";
import { createId, getClientIp } from "../../_lib/util";
import { buildPublicMediaUrl } from "../../../src/shared/publicMedia";

const allowedPurposes = new Set(["course-cover", "news-image", "institution-image", "assignment-file", "sop-file"]);
const imageUploadPolicy = {
  allowedContentTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  allowedExtensions: new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]),
  maxBytes: 6 * 1024 * 1024,
};
const uploadPolicies = {
  "assignment-file": {
    allowedContentTypes: new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ]),
    allowedExtensions: new Set([".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".csv"]),
    maxBytes: 12 * 1024 * 1024,
  },
  "sop-file": {
    allowedContentTypes: new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/markdown",
      "text/plain",
      "text/csv",
    ]),
    allowedExtensions: new Set([".pdf", ".docx", ".xlsx", ".pptx", ".md", ".markdown", ".txt", ".csv"]),
    maxBytes: 12 * 1024 * 1024,
  },
  "course-cover": imageUploadPolicy,
  "news-image": imageUploadPolicy,
  "institution-image": imageUploadPolicy,
};

function sanitizeFilename(name) {
  return String(name ?? "archivo")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function contentTypeFor(file) {
  return file.type || "application/octet-stream";
}

function fileExtension(name) {
  const normalized = String(name ?? "").trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  return lastDot >= 0 ? normalized.slice(lastDot) : "";
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function buildStoredMediaUrl(objectKey, purpose) {
  return purpose === "assignment-file" || purpose === "sop-file" ? "" : buildPublicMediaUrl(objectKey);
}

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin", "teacher"]);
    assertTrustedOrigin(context.request, context.env);
    await enforceRequestThrottle(context.env, context.request, throttlePolicies.adminUploads, {
      actorUserId: auth.user.id,
    });
    await recordRequestAttempt(context.env, context.request, throttlePolicies.adminUploads, {
      actorUserId: auth.user.id,
      detailsJson: {
        route: "admin.uploads",
      },
    });
    await assertBodySize(context.request, { maxBytes: 14 * 1024 * 1024 });

    if (!context.env.MEDIA_BUCKET) {
      const configuredError = new Error("MEDIA_BUCKET no esta configurado. Crea el bucket R2 y agrega el binding antes de subir archivos.");
      configuredError.status = 500;
      throw configuredError;
    }

    const formData = await context.request.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") ?? "");

    if (!(file instanceof File)) {
      return error("Archivo requerido.", 400);
    }

    if (!allowedPurposes.has(purpose)) {
      return error("Tipo de subida no permitido.", 400);
    }

    const uploadPolicy = uploadPolicies[purpose];
    const extension = fileExtension(file.name);
    const fileContentType = contentTypeFor(file).toLowerCase();

    if (!uploadPolicy) {
      return error("Tipo de subida no permitido.", 400);
    }

    if (!uploadPolicy.allowedExtensions.has(extension)) {
      return error("Extension de archivo no permitida para esta subida.", 400);
    }

    if (fileContentType && fileContentType !== "application/octet-stream" && !uploadPolicy.allowedContentTypes.has(fileContentType)) {
      return error("Tipo de archivo no permitido para esta subida.", 400);
    }

    if (Number(file.size ?? 0) <= 0 || Number(file.size ?? 0) > uploadPolicy.maxBytes) {
      return error("El archivo excede el tamano permitido para esta subida.", 413);
    }

    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hash = toHex(hashBuffer);
    const libraryRows = await context.env.DB.prepare(
      "SELECT id, value_json FROM collection_items WHERE section = 'mediaLibrary' ORDER BY created_at DESC"
    ).all();

    for (const row of libraryRows.results ?? []) {
      const item = JSON.parse(row.value_json);
      if (item?.hash === hash) {
        return json({
          key: item.key,
          url: purpose === "assignment-file" ? "" : item.url,
          fileName: item.fileName,
          contentType: item.contentType,
          mediaId: item.id,
          deduplicated: true,
        });
      }
    }

    const objectId = createId(purpose);
    const safeName = sanitizeFilename(file.name);
    const objectKey = `${purpose}/${objectId}-${safeName}`;
    const mediaId = createId("media");

    await context.env.MEDIA_BUCKET.put(objectKey, arrayBuffer, {
      httpMetadata: {
        contentType: contentTypeFor(file),
        contentDisposition: purpose === "assignment-file" ? `attachment; filename="${safeName}"` : "inline",
      },
      customMetadata: {
        originalName: safeName,
        purpose,
        uploadedBy: auth.user.id,
      },
    });

    const positionRow = await context.env.DB.prepare(
      "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM collection_items WHERE section = 'mediaLibrary'"
    ).first();

    const mediaItem = {
      id: mediaId,
      purpose,
      fileName: safeName,
      key: objectKey,
      url: buildStoredMediaUrl(objectKey, purpose),
      contentType: contentTypeFor(file),
      size: file.size,
      hash,
      createdAt: new Date().toISOString(),
    };

    await context.env.DB.prepare(
      `INSERT INTO collection_items (id, section, value_json, position, created_at, updated_at)
       VALUES (?, 'mediaLibrary', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
      .bind(mediaId, JSON.stringify(mediaItem), Number(positionRow?.maxPosition ?? -1) + 1)
      .run();

    await writeAuditLog(context.env, {
      actorUserId: auth.user.id,
      ipAddress: getClientIp(context.request),
      eventType: "media.upload",
      entityType: purpose,
      entityId: objectKey,
    });

    return json({
      key: objectKey,
      url: buildStoredMediaUrl(objectKey, purpose),
      fileName: safeName,
      contentType: contentTypeFor(file),
      mediaId,
      deduplicated: false,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
