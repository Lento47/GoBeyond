export function getPublishedNews(items = []) {
  return [...items]
    .filter((item) => !item?.status || item.status === "published")
    .sort((left, right) => {
      if (Boolean(left?.featured) !== Boolean(right?.featured)) {
        return left?.featured ? -1 : 1;
      }

      const leftDate = new Date(left?.publishedAt || 0).getTime();
      const rightDate = new Date(right?.publishedAt || 0).getTime();
      return rightDate - leftDate;
    });
}

export function buildNewsExcerpt(value, maxLength = 150) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function normalizeSocialNewsItem(item = {}) {
  const normalizedSource = String(item.fuente ?? "").trim().toLowerCase();
  const fallbackTitle = buildNewsExcerpt(item.contenido, 72) || "Publicacion de GoBeyond";

  return {
    id: item.id,
    title: String(item.titulo ?? "").trim() || fallbackTitle,
    summary: String(item.contenido ?? "").trim(),
    excerpt: buildNewsExcerpt(item.contenido, 150),
    link: String(item.url_original ?? "").trim(),
    image: String(item.imagen_url ?? "").trim(),
    publishedAt: String(item.publicado_en ?? "").trim(),
    category: normalizedSource ? normalizedSource[0].toUpperCase() + normalizedSource.slice(1) : "Social",
    source: normalizedSource,
    sourceName: String(item.source_name ?? "").trim(),
    sourcePageUrl: String(item.source_page_url ?? "").trim(),
    featured: false,
  };
}
