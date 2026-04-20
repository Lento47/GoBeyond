import { requireAuth } from "../../_lib/auth";
import { writeAuditLog } from "../../_lib/audit";
import { error, json, options } from "../../_lib/response";
import { createId, getClientIp } from "../../_lib/util";

const allowedPurposes = new Set(["course-cover", "news-image", "institution-image", "assignment-file"]);

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

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["admin"]);

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
          url: item.url,
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
      url: `/api/public/media?key=${encodeURIComponent(objectKey)}`,
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
      url: `/api/public/media?key=${encodeURIComponent(objectKey)}`,
      fileName: safeName,
      contentType: contentTypeFor(file),
      mediaId,
      deduplicated: false,
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
