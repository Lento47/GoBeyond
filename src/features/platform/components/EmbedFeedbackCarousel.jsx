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
    <article className="w-[18.5rem] shrink-0 overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/30 sm:w-[20rem] lg:w-[22rem]">
      {item.embedUrl ? (
        <div className="h-[15rem] overflow-hidden bg-[#0b0f17] sm:h-[18rem] lg:h-[21rem]">
          <EmbedFrame src={item.embedUrl} title={item.title} />
        </div>
      ) : item.image ? (
        <div className="aspect-[16/10] overflow-hidden bg-[#0b0f17]">
          <img alt={item.title} className="h-full w-full object-cover" src={normalizePublicMediaUrl(item.image)} />
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

export function EmbedFeedbackCarousel({ items, speedMs = 28000 }) {
  const groupRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (!groupRef.current || items.length <= 1) {
      setScrollDistance(0);
      return undefined;
    }

    const measure = () => {
      setScrollDistance(groupRef.current?.offsetWidth ?? 0);
    };

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(groupRef.current);

    return () => observer.disconnect();
  }, [items]);

  if (!items.length) {
    return null;
  }

  if (items.length === 1) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <FeedbackCard item={items[0]} />
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className="embed-feedback-track flex w-max gap-5"
          style={{
            "--embed-feedback-distance": `${scrollDistance}px`,
            "--embed-feedback-duration": `${speedMs}ms`,
          }}
        >
          <div ref={groupRef} className="flex w-max shrink-0 gap-5">
            {items.map((item) => (
              <FeedbackCard key={item.id} item={item} />
            ))}
          </div>
          <div aria-hidden="true" className="flex w-max shrink-0 gap-5">
            {items.map((item) => (
              <FeedbackCard key={`${item.id}-clone`} item={item} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes embed-feedback-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-1 * var(--embed-feedback-distance, 0px)));
          }
        }

        .embed-feedback-track {
          animation: embed-feedback-marquee var(--embed-feedback-duration, 28000ms) linear infinite;
        }

        .embed-feedback-track:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .embed-feedback-track {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
