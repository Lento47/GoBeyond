const EASING = "cubic-bezier(0.33, 1, 0.68, 1)";

function reduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function revealPane(el) {
  if (!el || reduced()) return;
  el.animate(
    [
      { opacity: 0, transform: "translateY(-7px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 240, easing: EASING, fill: "forwards" }
  );
}

export function staggerCards(container) {
  if (!container || reduced()) return;
  const cards = container.querySelectorAll(".ws-card");
  if (!cards.length) return;
  cards.forEach((card, i) => {
    card.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 300, delay: i * 55, easing: EASING, fill: "forwards" }
    );
  });
}

export function revealModal(el) {
  if (!el || reduced()) return;
  el.animate(
    [
      { opacity: 0, transform: "scale(0.97) translateY(-4px)" },
      { opacity: 1, transform: "scale(1) translateY(0)" },
    ],
    { duration: 210, easing: EASING, fill: "forwards" }
  );
}

export function countUp(el, rawValue) {
  if (!el) return;
  const str = String(rawValue ?? "");
  const num = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num <= 0) return;
  const suffix = str.replace(/^[^0-9]*[\d,.]+/, "");
  const prefix = str.slice(0, str.search(/\d/));

  if (reduced()) {
    el.textContent = rawValue;
    return;
  }

  const start = performance.now();
  const duration = 1000;
  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = `${prefix}${Math.round(num * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
