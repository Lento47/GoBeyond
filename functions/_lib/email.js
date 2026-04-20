import { getSecuritySettings } from "./security";

function isLocalOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getAppOrigin(request, env) {
  const fallbackOrigin = new URL(request.url).origin;
  const configuredOrigin = String(env.APP_ORIGIN ?? fallbackOrigin).trim();
  return (configuredOrigin || fallbackOrigin).replace(/\/+$/, "");
}

function resolveResendTemplateId(env, type) {
  if (type === "email-verification") {
    return String(env.RESEND_TEMPLATE_VERIFY ?? env.RESEND_TEMPLATE_AUTH ?? "").trim();
  }

  if (type === "password-reset") {
    return String(env.RESEND_TEMPLATE_RESET ?? env.RESEND_TEMPLATE_AUTH ?? "").trim();
  }

  if (type === "course-enrollment") {
    return String(env.RESEND_TEMPLATE_ENROLLMENT ?? "").trim();
  }

  return String(env.RESEND_TEMPLATE_AUTH ?? "").trim();
}

function extractTokenFromActionUrl(actionUrl) {
  if (!actionUrl) {
    return "";
  }

  try {
    return new URL(actionUrl).searchParams.get("token") ?? "";
  } catch {
    return "";
  }
}

export async function sendTransactionalEmail(request, env, user, payload) {
  const settings = await getSecuritySettings(env);
  const resendApiKey = String(env.RESEND_API_KEY ?? "").trim();
  const resendTemplateId = String(payload.templateId ?? "").trim() || resolveResendTemplateId(env, payload.type);
  const webhookUrl = String(payload.webhookUrl ?? env.AUTH_EMAIL_WEBHOOK_URL ?? env.RESET_EMAIL_WEBHOOK_URL ?? "").trim();
  const fromAddress = String(env.EMAIL_FROM_ADDRESS ?? settings.supportEmail ?? "it@gobeyondcr.org").trim();
  const fromName = String(env.EMAIL_FROM_NAME ?? "GoBeyond IT").trim();
  const replyTo = String(payload.replyTo ?? env.EMAIL_REPLY_TO ?? settings.supportEmail ?? fromAddress).trim();
  const appOrigin = getAppOrigin(request, env);

  if (!resendApiKey && !webhookUrl) {
    return {
      delivered: false,
      mode: isLocalOrigin(appOrigin) ? "debug" : "not_configured",
    };
  }

  if (resendApiKey) {
    const recipientName = user.full_name ?? user.fullName ?? "GoBeyond";
    const actionToken = extractTokenFromActionUrl(payload.actionUrl);
    const resendPayload = resendTemplateId
      ? {
          from: `${fromName} <${fromAddress}>`,
          to: [user.email],
          reply_to: replyTo,
          subject: payload.subject,
          template: {
            id: resendTemplateId,
            variables: {
              RECIPIENT_NAME: recipientName,
              ACTION_URL: payload.actionUrl ?? "",
              ACTION_LABEL: payload.actionLabel ?? "Abrir enlace",
              SUPPORT_EMAIL: settings.supportEmail ?? replyTo,
              EXPIRATION_LABEL: payload.expirationLabel ?? "",
              SUBJECT_LINE: payload.subject,
              BODY_INTRO: payload.bodyIntro ?? "",
              BODY_OUTRO: payload.bodyOutro ?? "",
              COMPANY_NAME: "GoBeyond",
              nombre: recipientName,
              token: actionToken,
              url: payload.actionUrl ?? "",
              enlace: payload.actionUrl ?? "",
              support_email: settings.supportEmail ?? replyTo,
              expiration_label: payload.expirationLabel ?? "",
              ...(payload.templateVariables ?? {}),
            },
          },
        }
      : {
          from: `${fromName} <${fromAddress}>`,
          reply_to: replyTo,
          to: [user.email],
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resendResponse.ok) {
      const resendBody = await resendResponse.text().catch(() => "");
      const error = new Error(
        resendBody
          ? `No se pudo enviar el correo transaccional con Resend: ${resendBody}`
          : "No se pudo enviar el correo transaccional con Resend."
      );
      error.status = 503;
      throw error;
    }

    return {
      delivered: true,
      mode: "resend",
    };
  }

  const webhookSecret = String(
    payload.webhookSecret ?? env.AUTH_EMAIL_WEBHOOK_SECRET ?? env.RESET_EMAIL_WEBHOOK_SECRET ?? ""
  ).trim();

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      replyTo,
      to: user.email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      metadata: {
        userId: user.id,
        role: user.role ?? user.primaryRole ?? null,
        appOrigin,
        type: payload.type,
        ...(payload.metadata ?? {}),
      },
    }),
  });

  if (!response.ok) {
    const error = new Error("No se pudo enviar el correo transaccional.");
    error.status = 503;
    throw error;
  }

  return {
    delivered: true,
    mode: "webhook",
  };
}
