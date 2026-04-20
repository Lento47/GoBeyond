import { createCollectionItem } from "../../_lib/content";
import { assertTrustedOrigin, enforceRequestThrottle, readJsonBody, recordRequestAttempt, throttlePolicies } from "../../_lib/requestSecurity";
import { error, json, options } from "../../_lib/response";
import { verifyTurnstileToken } from "../../_lib/turnstile";
import { createId } from "../../_lib/util";
import { validateRequiredString } from "../../_lib/validation";

export async function onRequestOptions() {
  return options();
}

export async function onRequestPost(context) {
  try {
    assertTrustedOrigin(context.request, context.env);
    await enforceRequestThrottle(context.env, context.request, throttlePolicies.publicTestimonial);
    await recordRequestAttempt(context.env, context.request, throttlePolicies.publicTestimonial, {
      detailsJson: {
        route: "public.testimonials",
      },
    });
    const body = await readJsonBody(context.request, { maxBytes: 8_192 });
    await verifyTurnstileToken(context.request, context.env, body.turnstileToken, { action: "public-testimonial" });
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
