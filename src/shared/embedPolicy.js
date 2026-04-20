const EMBED_HOST_SUFFIXES = [
  "youtube.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "loom.com",
  "docs.google.com",
  "drive.google.com",
];

export const EMBED_ALLOWED_HOSTS = [...EMBED_HOST_SUFFIXES];
export const EMBED_IFRAME_ALLOW = "clipboard-write; encrypted-media; picture-in-picture; web-share";
export const EMBED_IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-popups allow-forms allow-presentation";

function isAllowedEmbedHostname(hostname) {
  const normalizedHostname = String(hostname ?? "").trim().toLowerCase();

  return EMBED_HOST_SUFFIXES.some(
    (allowedHost) => normalizedHostname === allowedHost || normalizedHostname.endsWith(`.${allowedHost}`)
  );
}

function toSafeUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || !isAllowedEmbedHostname(url.hostname)) {
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function extractEmbedUrl(value) {
  const input = String(value ?? "").trim();
  if (!input) {
    return "";
  }

  const iframeMatch = input.match(/src=["']([^"']+)["']/i);
  const candidate = iframeMatch?.[1] ? iframeMatch[1].trim() : input;
  return toSafeUrl(candidate);
}

export function validateEmbedValue(value, label = "Embed") {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }

  const embedUrl = extractEmbedUrl(normalized);
  if (!embedUrl) {
    const error = new Error(
      `${label} no permitido. Usa una URL HTTPS de una fuente aprobada como YouTube, Vimeo, Facebook, Instagram, LinkedIn, TikTok o Google.`
    );
    error.status = 400;
    throw error;
  }

  return embedUrl;
}
