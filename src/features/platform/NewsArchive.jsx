import { useMemo } from "react";

import { EMBED_IFRAME_ALLOW, EMBED_IFRAME_SANDBOX } from "../../shared/embedPolicy";
import { MarkdownContent } from "../../shared/MarkdownContent";
import { PublicImageWithFallback } from "../../shared/PublicImageWithFallback";
import { getDomainLabel, getEmbedDescriptor } from "./embedUtils";
import { getPublishedNews, normalizeSocialNewsItem } from "./newsUtils";

function EmptyState({ title, body }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-gray-500">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-3 leading-relaxed">{body}</p>
    </div>
  );
}

function EmbedFrame({ src, title }) {
  return (
    <iframe
      allow={EMBED_IFRAME_ALLOW}
      allowFullScreen
      className="h-full w-full border-0"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox={EMBED_IFRAME_SANDBOX}
      src={src}
      title={title}
    />
  );
}

function NewsCard({ item, compact = false }) {
  const embed = getEmbedDescriptor(item.embed);
  const publishedLabel = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("es-CR") : "Sin fecha";
  const sourceLabel = item.source === "facebook" || item.source === "linkedin" || item.source === "instagram"
    ? item.source
    : item.category || "Noticia";

  if (compact) {
    return (
      <article className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30">
        <div className="grid gap-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div className="h-full min-h-[9rem] overflow-hidden bg-[#0b0f17]">
            <PublicImageWithFallback
              alt={item.title}
              className="h-full w-full object-cover"
              fallback={
                embed.embedUrl ? (
                  <EmbedFrame src={embed.embedUrl} title={item.title} />
                ) : (
                  <div className="flex h-full min-h-[9rem] flex-col items-center justify-center bg-white/[0.03] px-4 text-center text-xs text-gray-500">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-blue-300">
                      {getDomainLabel(item.link || embed.externalUrl) || "Noticia editorial"}
                    </p>
                    <p className="mt-2">Noticia editorial de GoBeyond</p>
                  </div>
                )
              }
              src={item.image}
            />
          </div>
          <div className="p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-blue-400">
              {sourceLabel} · {publishedLabel}
            </p>
            <h3 className="mt-3 text-xl font-black tracking-tight text-white">{item.title}</h3>
            {item.summary ? <MarkdownContent className="mt-3 text-sm leading-relaxed text-gray-400">{item.summary}</MarkdownContent> : null}
            {item.link ? (
              <a
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:gap-3 hover:text-blue-300"
                href={item.link}
                rel="noreferrer"
                target="_blank"
              >
                Ver referencia
                <span>&rarr;</span>
              </a>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_28px_70px_rgba(0,0,0,0.22)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30">
      <div className="aspect-[16/8] overflow-hidden bg-[#0b0f17]">
        <PublicImageWithFallback
          alt={item.title}
          className="h-full w-full object-cover"
          fallback={
            embed.embedUrl ? (
              <EmbedFrame src={embed.embedUrl} title={item.title} />
            ) : (
              <div className="flex h-full flex-col justify-end bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(8,8,8,0.95))] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-blue-300">
                  {getDomainLabel(item.link || embed.externalUrl) || "Referencia externa"}
                </p>
              </div>
            )
          }
          src={item.image}
        />
      </div>
      <div className="p-7 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-blue-400">
          {sourceLabel}
          {item.featured ? " · Destacada" : ""}
          {` · ${publishedLabel}`}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">{item.title}</h2>
        {item.summary ? <MarkdownContent className="mt-5 max-w-3xl text-base leading-relaxed text-gray-400">{item.summary}</MarkdownContent> : null}
        {item.link ? (
          <a
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:gap-3 hover:text-blue-300"
            href={item.link}
            rel="noreferrer"
            target="_blank"
          >
            Abrir noticia
            <span>&rarr;</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function NewsArchive({ content, noticiasPosts = [], noticiasLoading = false, noticiasError = "", onBack, onRequestLogin }) {
  const brand = content?.brand ?? {};
  const publishedNews = useMemo(() => {
    if (noticiasPosts.length) {
      return noticiasPosts.map((item) => normalizeSocialNewsItem(item));
    }

    return getPublishedNews(content?.news ?? []);
  }, [content?.news, noticiasPosts]);
  const featuredStory = publishedNews[0] ?? null;
  const remainingStories = featuredStory ? publishedNews.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/5 bg-[#050505]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
          <button className="flex items-center gap-3 text-left" onClick={onBack} type="button">
            <img alt="Logo de GoBeyond" className="h-10 w-10 object-contain" src="/logo-icon.png" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">Archivo editorial</p>
              <p className="text-lg font-black tracking-tight text-white">{brand.name || "GoBeyond"}</p>
            </div>
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:bg-white/5"
              onClick={onBack}
              type="button"
            >
              Volver al landing
            </button>
            <button
              className="rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-black transition hover:bg-blue-50"
              onClick={onRequestLogin}
              type="button"
            >
              Ingresar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-blue-400">Noticias</p>
          <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">
            Archivo de noticias de GoBeyond
          </h1>
          <p className="mt-6 text-base leading-relaxed text-gray-400 sm:text-lg">
            Aqui reunimos anuncios, alianzas, novedades y publicaciones oficiales para que el landing siga limpio sin
            perder visibilidad editorial.
          </p>
        </div>

        <div className="mt-14 grid gap-8">
          {noticiasLoading ? (
            <EmptyState
              body="Estamos consultando las publicaciones mas recientes de las redes sociales de GoBeyond."
              title="Cargando noticias"
            />
          ) : null}

          {noticiasError ? (
            <EmptyState
              body={noticiasError}
              title="No pudimos cargar las noticias automaticas"
            />
          ) : null}

          {featuredStory ? <NewsCard item={featuredStory} /> : null}

          {remainingStories.length ? (
            <div className="grid gap-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-blue-400">Mas publicaciones</p>
              <div className="grid gap-6 lg:grid-cols-2">
                {remainingStories.map((item) => (
                  <NewsCard key={item.id} compact item={item} />
                ))}
              </div>
            </div>
          ) : null}

          {!publishedNews.length ? (
            <EmptyState
              body="Cuando Make.com envie nuevas publicaciones desde Facebook o LinkedIn, apareceran aqui ordenadas por fecha."
              title="Sin noticias publicadas"
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
