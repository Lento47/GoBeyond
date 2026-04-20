import { extractEmbedUrl } from "../../shared/embedPolicy";
import { normalizePublicMediaUrl } from "../../shared/publicMedia";

function getYouTubeId(url) {
  const host = url.hostname.replace(/^www\./i, "");
  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? "";
  }

  if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
    if (url.pathname.includes("/embed/")) {
      return url.pathname.split("/embed/")[1]?.split("/")[0] ?? "";
    }
    return url.searchParams.get("v") ?? "";
  }

  return "";
}

function getVimeoId(url) {
  const host = url.hostname.replace(/^www\./i, "");
  if (!host.includes("vimeo.com")) return "";

  const segments = url.pathname.split("/").filter(Boolean);
  if (!segments.length) return "";
  if (segments[0] === "video" && segments[1]) return segments[1];
  return segments.find((segment) => /^\d+$/.test(segment)) ?? "";
}

function getLoomId(url) {
  const host = url.hostname.replace(/^www\./i, "");
  if (!host.includes("loom.com")) return "";

  const segments = url.pathname.split("/").filter(Boolean);
  if (!segments.length) return "";
  if ((segments[0] === "share" || segments[0] === "embed") && segments[1]) return segments[1];
  return "";
}

function getFacebookEmbedUrl(url, rawUrl) {
  const host = url.hostname.replace(/^www\./i, "");
  if (!host.includes("facebook.com")) return "";

  const pathname = decodeURIComponent(url.pathname);

  if (/^\/plugins\/(post|video)\.php$/i.test(pathname)) {
    return rawUrl;
  }

  const isVideo =
    pathname.includes("/videos/") ||
    pathname.includes("/watch") ||
    pathname.includes("/reel/") ||
    url.searchParams.has("v");

  const pluginPath = isVideo ? "video.php" : "post.php";
  const params = new URLSearchParams({
    href: rawUrl,
    show_text: isVideo ? "false" : "true",
    width: "500",
  });

  return `https://www.facebook.com/plugins/${pluginPath}?${params.toString()}`;
}

function getInstagramEmbedUrl(url) {
  const host = url.hostname.replace(/^www\./i, "");
  if (!host.includes("instagram.com")) return "";

  const pathname = decodeURIComponent(url.pathname);

  if (/^\/(p|reel|reels|tv)\/[^/]+\/embed\/?/i.test(pathname)) {
    return `https://www.instagram.com${pathname}`;
  }

  const match = pathname.match(/^\/(p|reel|reels|tv)\/([^/]+)/i);
  if (!match?.[1] || !match?.[2]) {
    return "";
  }

  return `https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned`;
}

function getLinkedInEmbedUrl(url) {
  const host = url.hostname.replace(/^www\./i, "");
  if (!host.includes("linkedin.com")) return "";

  const pathname = decodeURIComponent(url.pathname);

  if (/^\/embed\/feed\/update\/urn:li:(share|ugcPost|activity):/i.test(pathname)) {
    return `https://www.linkedin.com${pathname}`;
  }

  const shareUrnMatch = pathname.match(/urn:li:(share|ugcPost):([A-Za-z0-9-]+)/i);
  if (shareUrnMatch?.[1] && shareUrnMatch?.[2]) {
    return `https://www.linkedin.com/embed/feed/update/urn:li:${shareUrnMatch[1]}:${shareUrnMatch[2]}`;
  }

  const activityMatch =
    pathname.match(/urn:li:activity:([A-Za-z0-9-]+)/i) ??
    pathname.match(/activity-([A-Za-z0-9-]+)/i);

  if (activityMatch?.[1]) {
    return `https://www.linkedin.com/embed/feed/update/urn:li:share:${activityMatch[1]}`;
  }

  return "";
}

function getTikTokEmbedUrl(url) {
  const host = url.hostname.replace(/^www\./i, "");
  if (!host.includes("tiktok.com")) return "";

  const pathname = decodeURIComponent(url.pathname);

  if (/^\/embed\/v2\/\d+/i.test(pathname)) {
    return `https://www.tiktok.com${pathname}`;
  }

  const videoMatch = pathname.match(/\/video\/(\d+)/i);
  if (!videoMatch?.[1]) {
    return "";
  }

  return `https://www.tiktok.com/embed/v2/${videoMatch[1]}`;
}

function getGoogleEmbedUrl(url) {
  const host = url.hostname.replace(/^www\./i, "");
  const pathname = decodeURIComponent(url.pathname);

  if (host.includes("drive.google.com")) {
    const fileMatch = pathname.match(/\/file\/d\/([^/]+)/i);
    if (fileMatch?.[1]) {
      return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }

    if (pathname.endsWith("/preview")) {
      return url.toString();
    }

    const fileId = url.searchParams.get("id");
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return "";
  }

  if (!host.includes("docs.google.com")) {
    return "";
  }

  if (pathname.endsWith("/preview") || pathname.endsWith("/embed")) {
    return url.toString();
  }

  const documentMatch = pathname.match(/^\/document\/d\/([^/]+)/i);
  if (documentMatch?.[1]) {
    return `https://docs.google.com/document/d/${documentMatch[1]}/preview`;
  }

  const spreadsheetMatch = pathname.match(/^\/spreadsheets\/d\/([^/]+)/i);
  if (spreadsheetMatch?.[1]) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetMatch[1]}/preview`;
  }

  const presentationMatch = pathname.match(/^\/presentation\/d\/([^/]+)/i);
  if (presentationMatch?.[1]) {
    return `https://docs.google.com/presentation/d/${presentationMatch[1]}/embed`;
  }

  const formMatch = pathname.match(/^\/forms\/d\/e\/([^/]+)/i);
  if (formMatch?.[1]) {
    return `https://docs.google.com/forms/d/e/${formMatch[1]}/viewform?embedded=true`;
  }

  return "";
}

function isLikelyDirectEmbedUrl(url) {
  const pathname = decodeURIComponent(url.pathname).toLowerCase();

  return (
    pathname.includes("/embed") ||
    pathname.endsWith("/preview") ||
    url.searchParams.get("embedded") === "true" ||
    url.searchParams.get("embed") === "true"
  );
}

export function getDomainLabel(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export function getEmbedDescriptor(value) {
  const rawUrl = extractEmbedUrl(value);
  if (!rawUrl) {
    return {
      embedUrl: "",
      externalUrl: "",
      provider: "",
      domainLabel: "",
    };
  }

  try {
    const url = new URL(rawUrl);
    const domainLabel = getDomainLabel(rawUrl);
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
        externalUrl: rawUrl,
        provider: "youtube",
        domainLabel,
      };
    }

    const vimeoId = getVimeoId(url);
    if (vimeoId) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        externalUrl: rawUrl,
        provider: "vimeo",
        domainLabel,
      };
    }

    const loomId = getLoomId(url);
    if (loomId) {
      return {
        embedUrl: `https://www.loom.com/embed/${loomId}`,
        externalUrl: rawUrl,
        provider: "loom",
        domainLabel,
      };
    }

    const facebookEmbedUrl = getFacebookEmbedUrl(url, rawUrl);
    if (facebookEmbedUrl) {
      return {
        embedUrl: facebookEmbedUrl,
        externalUrl: rawUrl,
        provider: "facebook",
        domainLabel,
      };
    }

    const instagramEmbedUrl = getInstagramEmbedUrl(url);
    if (instagramEmbedUrl) {
      return {
        embedUrl: instagramEmbedUrl,
        externalUrl: rawUrl,
        provider: "instagram",
        domainLabel,
      };
    }

    const linkedInEmbedUrl = getLinkedInEmbedUrl(url);
    if (linkedInEmbedUrl) {
      return {
        embedUrl: linkedInEmbedUrl,
        externalUrl: rawUrl,
        provider: "linkedin",
        domainLabel,
      };
    }

    const tikTokEmbedUrl = getTikTokEmbedUrl(url);
    if (tikTokEmbedUrl) {
      return {
        embedUrl: tikTokEmbedUrl,
        externalUrl: rawUrl,
        provider: "tiktok",
        domainLabel,
      };
    }

    const googleEmbedUrl = getGoogleEmbedUrl(url);
    if (googleEmbedUrl) {
      return {
        embedUrl: googleEmbedUrl,
        externalUrl: rawUrl,
        provider: "google",
        domainLabel,
      };
    }

    if (isLikelyDirectEmbedUrl(url)) {
      return {
        embedUrl: rawUrl,
        externalUrl: rawUrl,
        provider: "",
        domainLabel,
      };
    }

    return {
      embedUrl: "",
      externalUrl: rawUrl,
      provider: "",
      domainLabel,
    };
  } catch {
    return {
      embedUrl: "",
      externalUrl: "",
      provider: "",
      domainLabel: "",
    };
  }
}

export { normalizePublicMediaUrl };
