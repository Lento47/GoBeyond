import { useEffect, useRef } from "react";

export default function BlueprintDiscovery({ nodes = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const labels = container.querySelectorAll(".bp-label");
      labels.forEach((el) => {
        const speed = parseFloat(el.dataset.speed || "0.15");
        const baseY = parseFloat(el.dataset.baseY || "0");
        el.style.transform = `translateY(${baseY - scrollY * speed}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!nodes.length) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Blueprint grid lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bp-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <pattern id="bp-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="#94a3b8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bp-grid)" />
        <rect width="100%" height="100%" fill="url(#bp-dots)" />
      </svg>

      {/* Floating labels */}
      {nodes.map((node, i) => (
        <span
          key={`${node.label}-${i}`}
          data-base-y={node.y}
          data-speed={0.08 + (i % 5) * 0.03}
          className="bp-label absolute text-[10px] font-black uppercase tracking-[0.35em] text-slate-300/40 select-none whitespace-nowrap"
          style={{ left: node.x, top: node.y }}
        >
          {node.label}
        </span>
      ))}
    </div>
  );
}
