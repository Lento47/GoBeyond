import { createCollectionItem } from "../../_lib/content";
import { error, json, options } from "../../_lib/response";
import { createId } from "../../_lib/util";
import { validateRequiredString } from "../../_lib/validation";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const item = {
      id: createId("testimonial"),
      quote: validateRequiredString(body.quote, "Testimonio", 2400),
      author: validateRequiredString(body.author, "Nombre", 255),
      organization: validateRequiredString(body.organization ?? "Comunidad GoBeyond", "Referencia", 255),
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    await createCollectionItem(context.env, "testimonialSubmissions", item);

    return json(
      {
        ok: true,
        message: "Gracias. Tu testimonio fue recibido y quedo pendiente de aprobacion.",
      },
      { status: 201 }
    );
  } catch (requestError) {
    return error(requestError.message, requestError.status ?? 500);
  }
}
