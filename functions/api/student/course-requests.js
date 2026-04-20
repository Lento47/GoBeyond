import { requireAuth } from "../../_lib/auth";
import { createCollectionItem } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { error, json, options } from "../../_lib/response";
import { createId } from "../../_lib/util";

function clean(value, limit = 500) {
  return String(value ?? "").trim().slice(0, limit);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function isValidNumericContact(value) {
  return /^\d{8,20}$/.test(String(value ?? "").trim());
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await context.request.json().catch(() => ({}));

    const courseId = clean(body.courseId, 120);
    const courseTitle = clean(body.courseTitle, 160);
    const contactChannel = clean(body.contactChannel, 40);
    const contactValue = clean(body.contactValue, 160);
    const note = clean(body.note, 1500);

    if (!courseId || !courseTitle) {
      const issue = new Error("El curso solicitado es requerido.");
      issue.status = 400;
      throw issue;
    }

    if (!contactChannel || !contactValue) {
      const issue = new Error("Debes indicar un medio de contacto para seguimiento.");
      issue.status = 400;
      throw issue;
    }

    if (contactChannel === "correo" && !isValidEmail(contactValue)) {
      const issue = new Error("Cuando el contacto es por correo, debes escribir un correo valido.");
      issue.status = 400;
      throw issue;
    }

    if (["whatsapp", "texto", "llamada"].includes(contactChannel) && !isValidNumericContact(contactValue)) {
      const issue = new Error("Cuando el contacto es por numero, solo se aceptan digitos validos.");
      issue.status = 400;
      throw issue;
    }

    const enrollments = await listStudentEnrollments(context.env, auth.user.id);
    const alreadyActive = enrollments.some((item) => item.status === "active" && item.courseId === courseId);

    if (alreadyActive) {
      const issue = new Error("Ya tienes este curso activo, no necesitas solicitar apertura.");
      issue.status = 409;
      throw issue;
    }

    const request = {
      id: createId("course_request"),
      courseId,
      courseTitle,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note,
      source: "student-portal",
      student: {
        id: auth.user.id,
        fullName: auth.user.fullName,
        email: auth.user.email,
      },
      contact: {
        channel: contactChannel,
        value: contactValue,
      },
      adminNote: "",
    };

    await createCollectionItem(context.env, "courseInterestRequests", request);

    return json({
      request,
      message:
        "Tu solicitud fue enviada. El equipo revisara el interes del grupo y te contactara por el medio que indicaste si el curso puede abrirse.",
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
