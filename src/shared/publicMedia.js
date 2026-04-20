const LEGACY_PUBLIC_MEDIA_PATH = "/api/public/media";
const PUBLIC_MEDIA_PATH = "/media";
const DEFAULT_PUBLIC_ORIGIN = "https://gobeyondcr.org";
const IMAGE_FILE_EXTENSION_PATTERN = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:$|[?#])/i;
const NON_IMAGE_HOST_SUFFIXES = [
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
  "loom.com",
  "docs.google.com",
  "drive.google.com",
];

function hasExplicitProtocol(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(String(value ?? ""));
}

function isKnownNonImageHost(hostname) {
  const normalizedHostname = String(hostname ?? "").trim().toLowerCase();
  if (!normalizedHostname) {
    return false;
  }

  return NON_IMAGE_HOST_SUFFIXES.some(
    (hostSuffix) => normalizedHostname === hostSuffix || normalizedHostname.endsWith(`.${hostSuffix}`)
  );
}

export function buildPublicMediaUrl(key, origin = "") {
  const normalizedKey = String(key ?? "").trim();
  if (!normalizedKey) {
    return "";
  }

  const path = `${PUBLIC_MEDIA_PATH}?key=${encodeURIComponent(normalizedKey)}`;
  if (!origin) {
    return path;
  }

  return `${String(origin).replace(/\/+$/, "")}${path}`;
}

export function normalizePublicMediaUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw, DEFAULT_PUBLIC_ORIGIN);
    const key = parsed.searchParams.get("key");

    if (parsed.pathname !== LEGACY_PUBLIC_MEDIA_PATH || !key) {
      return raw;
    }

    const normalizedPath = buildPublicMediaUrl(key);
    if (!hasExplicitProtocol(raw) || parsed.origin === DEFAULT_PUBLIC_ORIGIN) {
      return normalizedPath;
    }

    return buildPublicMediaUrl(key, parsed.origin);
  } catch {
    return raw;
  }
}

export function normalizeRenderablePublicMediaUrl(value) {
  const normalizedUrl = normalizePublicMediaUrl(value);
  const raw = String(normalizedUrl ?? "").trim();

  if (!raw) {
    return "";
  }

  if (/^data:image\//i.test(raw) || /^blob:/i.test(raw)) {
    return raw;
  }

  try {
    const parsed = new URL(raw, DEFAULT_PUBLIC_ORIGIN);

    if (
      parsed.pathname === PUBLIC_MEDIA_PATH ||
      parsed.pathname === LEGACY_PUBLIC_MEDIA_PATH ||
      IMAGE_FILE_EXTENSION_PATTERN.test(parsed.pathname)
    ) {
      return raw;
    }

    if (isKnownNonImageHost(parsed.hostname)) {
      return "";
    }

    return raw;
  } catch {
    return raw;
  }
}
