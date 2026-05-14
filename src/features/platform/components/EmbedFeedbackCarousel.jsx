import { useEffect, useRef, useState } from "react";
import { EMBED_IFRAME_ALLOW, EMBED_IFRAME_SANDBOX } from "../../../shared/embedPolicy";
import { normalizePublicMediaUrl } from "../embedUtils";

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
  return (
    <article className="w-[min(88vw,22rem)] shrink-0 overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30">
      {item.embedUrl ? (
        <div className="h-[15rem] overflow-hidden bg-[#0b0f17] sm:h-[18rem] lg:h-[21rem]">
          <EmbedFrame src={item.embedUrl} title={item.title} />
        </div>
      ) : item.image ? (
        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-white p-7">
          <img alt={item.title} className="h-full w-full object-contain" src={normalizePublicMediaUrl(item.image)} />
        </div>
      ) : (
        <div className="flex aspect-[16/10] flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(8,8,8,0.92))] px-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-300">
            {item.domainLabel || "Referencia externa"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">
            {item.fallbackBody}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-blue-400">{item.label}</p>
          <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
        </div>
        {item.href ? (
          <a className="text-sm font-semibold text-blue-400 transition hover:text-blue-300" href={item.href} rel="noreferrer" target="_blank">
            Abrir
          </a>
        ) : (
          <span className="text-blue-500">&rarr;</span>
        )}
      </div>
    </article>
  );
}

export function EmbedFeedbackCarousel({ controlsLabel = "Convenios activos", items, speedMs = 28000 }) {
  const groupRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleItems = items.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => {
    if (!hasMultipleItems) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, Math.max(speedMs / items.length, 4500));

    return () => window.clearInterval(intervalId);
  }, [hasMultipleItems, items.length, speedMs]);

  if (!items.length) {
    return null;
  }

  if (items.length === 1) {
    return (
      <div className="overflow-hidden">
        <FeedbackCard item={items[0]} />
      </div>
    );
  }

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % items.length);
  };

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">
          {controlsLabel}
        </p>
        <div className="flex items-center gap-2">
          <button
            aria-label="Institucion anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-blue-500/30 hover:bg-white/[0.06]"
            onClick={goToPrevious}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="Siguiente institucion"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-blue-500/30 hover:bg-white/[0.06]"
            onClick={goToNext}
            type="button"
          >
            →
          </button>
        </div>
      </div>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div
          ref={groupRef}
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
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-blue-400" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
            key={`${item.id}-indicator`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
