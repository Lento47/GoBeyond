// Plain browser module for rendering the noticias feed without dependencies.
// It expects a container with id="noticias-grid" and an endpoint that returns
// `{ posts: [...] }` in the same shape as the Worker/Pages API.

const ENDPOINT = "https://your-worker.example.workers.dev/noticias";
const MAX_EXCERPT = 150;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildExcerpt(value, maxLength = MAX_EXCERPT) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function renderLoading(container) {
  container.innerHTML = '<p class="noticias-state">Cargando noticias...</p>';
}

function renderError(container, message) {
  container.innerHTML = `<p class="noticias-state noticias-state-error">${escapeHtml(message)}</p>`;
}

function renderPosts(container, posts) {
  if (!posts.length) {
    container.innerHTML = '<p class="noticias-state">Todavia no hay publicaciones disponibles.</p>';
    return;
  }

  container.innerHTML = posts
    .map((post) => {
      const imageMarkup = post.imagen_url
        ? `<img class="noticias-image" src="${escapeHtml(post.imagen_url)}" alt="${escapeHtml(post.titulo || "Noticia GoBeyond")}" loading="lazy">`
        : "";

      return `
        <article class="noticias-card">
          ${imageMarkup}
          <div class="noticias-body">
            <span class="noticias-badge">${escapeHtml(post.fuente || "social")}</span>
            <h2 class="noticias-title">${escapeHtml(post.titulo || "Publicacion de GoBeyond")}</h2>
            <p class="noticias-excerpt">${escapeHtml(buildExcerpt(post.contenido))}</p>
            <div class="noticias-meta">
              <time datetime="${escapeHtml(post.publicado_en || "")}">${escapeHtml(formatDate(post.publicado_en))}</time>
              <a href="${escapeHtml(post.url_original || "#")}" target="_blank" rel="noreferrer">Ver publicacion original</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

export async function initNoticiasGrid(endpoint = ENDPOINT) {
  const container = document.getElementById("noticias-grid");
  if (!container) {
    return;
  }

  renderLoading(container);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`No se pudieron cargar las noticias (${response.status}).`);
    }

    const payload = await response.json();
    renderPosts(container, payload.posts ?? []);
  } catch (error) {
    renderError(container, error.message || "No se pudieron cargar las noticias.");
  }
}
