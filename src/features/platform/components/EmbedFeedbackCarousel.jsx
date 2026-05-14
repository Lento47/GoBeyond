import { useEffect, useState } from "react";
import { EMBED_IFRAME_ALLOW, EMBED_IFRAME_SANDBOX } from "../../../shared/embedPolicy";
import { normalizePublicMediaUrl } from "../embedUtils";
import { PublicImageWithFallback } from "../../../shared/PublicImageWithFallback";

function EmbedFrame({ src, title }) {
  return (
    <iframe
      allow={EMBED_IFRAME_ALLOW}
      allowFullScreen
      className="h-full w-full border-0"
      height="100%"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox={EMBED_IFRAME_SANDBOX}
      src={src}
      title={title}
      width="100%"
    />
  );
}


function FeedbackCard({ item }) {
  const imageSrc = normalizePublicMediaUrl(item.image);

  return (
    <article className="w-[min(88vw,22rem)] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.02] transition-colors hover:border-white/14">
      {item.embedUrl ? (
        <div className="h-[14rem] overflow-hidden bg-[#0b0f17] sm:h-[17rem]">
          <EmbedFrame src={item.embedUrl} title={item.title} />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-white p-6">
          <PublicImageWithFallback
            alt={item.title}
            className="h-full w-full object-contain"
            src={imageSrc}
            fallback={
              <div className="flex h-full w-full flex-col items-center justify-center bg-white gap-2">
                <span className="text-2xl font-black text-gray-300">
                  {String(item.title ?? "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase() ?? "")
                    .join("") || "GB"}
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {item.title}
                </p>
              </div>
            }
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.26em] text-blue-400 truncate">{item.label}</p>
          <p className="mt-1 truncate text-base font-semibold text-white">{item.title}</p>
        </div>
        {item.href ? (
          <a
            className="shrink-0 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            href={item.href}
            rel="noreferrer"
            target="_blank"
          >
            Abrir
          </a>
        ) : (
          <span className="shrink-0 text-blue-500">&rarr;</span>
        )}
      </div>
    </article>
  );
}

export function EmbedFeedbackCarousel({ controlsLabel = "Convenios activos", items, speedMs = 28000 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = items.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    if (!hasMultiple) return undefined;
    const id = window.setInterval(
      () => setActiveIndex((c) => (c + 1) % items.length),
      Math.max(speedMs / items.length, 4500)
    );
    return () => window.clearInterval(id);
  }, [hasMultiple, items.length, speedMs]);

  if (!items.length) return null;

  if (items.length === 1) {
    return (
      <div className="overflow-hidden">
        <FeedbackCard item={items[0]} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-blue-400">
          {controlsLabel}
        </p>
        <div className="flex gap-2">
          <button
            aria-label="Anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/20"
            onClick={() => setActiveIndex((c) => (c - 1 + items.length) % items.length)}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="Siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/20"
            onClick={() => setActiveIndex((c) => (c + 1) % items.length)}
            type="button"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div
          className="flex gap-5 transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(calc(${activeIndex} * -1 * (min(88vw, 22rem) + 1.25rem)))`,
          }}
        >
          {items.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {items.map((item, index) => (
          <button
            aria-label={`Ver ${item.title}`}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? "w-7 bg-blue-400" : "w-1.5 bg-white/20 hover:bg-white/35"
            }`}
            key={`${item.id}-dot`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
