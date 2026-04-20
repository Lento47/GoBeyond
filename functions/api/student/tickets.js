import { requireAuth } from "../../_lib/auth";
import { createCollectionItem } from "../../_lib/content";
import { listStudentEnrollments } from "../../_lib/enrollments";
import { error, json, options } from "../../_lib/response";

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function clean(value, limit = 500) {
  return String(value ?? "").trim().slice(0, limit);
}

export function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const auth = await requireAuth(context.request, context.env, ["student"]);
    const body = await context.request.json().catch(() => ({}));
    const subject = clean(body.subject, 140);
    const description = clean(body.description, 2000);
    const category = clean(body.category, 80) || "soporte";
    const courseId = clean(body.courseId, 120);

    if (!subject) {
      const issue = new Error("El asunto del ticket es requerido.");
      issue.status = 400;
      throw issue;
    }

    if (!description) {
      const issue = new Error("La descripcion del ticket es requerida.");
      issue.status = 400;
      throw issue;
    }

    const enrollments = await listStudentEnrollments(context.env, auth.user.id);
    const relatedEnrollment = courseId
      ? enrollments.find((item) => item.courseId === courseId || item.course?.id === courseId)
      : null;

    const ticket = {
      id: createId("ticket"),
      subject,
      description,
      category,
      status: "open",
      priority: "normal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "student-portal",
      student: {
        id: auth.user.id,
        fullName: auth.user.fullName,
        email: auth.user.email,
      },
      courseId: relatedEnrollment?.courseId || courseId || "",
      courseTitle: relatedEnrollment?.course?.title || "",
      adminNote: "",
    };

    await createCollectionItem(context.env, "supportTickets", ticket);

    return json({
      ticket,
      message: "Tu ticket fue enviado al equipo administrativo.",
    });
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
