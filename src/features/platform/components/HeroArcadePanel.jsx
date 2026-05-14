import { useEffect, useRef, useState } from "react";

const WORD_LAYOUT = [
  { label: "GoBeyond", x: 0.28, y: 0.22, hue: "#23b3ff", floatX: 10, floatY: 8, phase: 0.2 },
  { label: "Impacto", x: 0.68, y: 0.2, hue: "#ff6b1a", floatX: 12, floatY: 10, phase: 1.4 },
  { label: "Oportunidades", x: 0.74, y: 0.44, hue: "#ffffff", floatX: 14, floatY: 12, phase: 2.1 },
  { label: "Juventud", x: 0.24, y: 0.46, hue: "#86d957", floatX: 12, floatY: 14, phase: 2.8 },
  { label: "Limon", x: 0.47, y: 0.66, hue: "#ffc62a", floatX: 11, floatY: 10, phase: 3.5 },
  { label: "Scrum", x: 0.18, y: 0.76, hue: "#23b3ff", floatX: 10, floatY: 8, phase: 4.2 },
  { label: "IA", x: 0.68, y: 0.78, hue: "#86d957", floatX: 12, floatY: 10, phase: 4.9 },
  { label: "Project Management", x: 0.47, y: 0.88, hue: "#ff6b1a", floatX: 14, floatY: 8, phase: 5.6 },
];

const TRAIL_COLORS = ["#0b2037", "#23b3ff", "#ff6b1a", "#ffc62a", "#86d957", "#ffffff"];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function buildWordState(width, height) {
  return WORD_LAYOUT.map((item) => ({
    ...item,
    homeX: width * item.x,
    homeY: height * item.y,
    x: width * item.x,
    y: height * item.y,
    vx: 0,
    vy: 0,
    reveal: item.label === "GoBeyond" ? 0.46 : 0.12,
  }));
}

export default function HeroArcadePanel() {
  const panelRef = useRef(null);
  const cometRef = useRef(null);
  const cometGlowRef = useRef(null);
  const trailRefs = useRef([]);
  const wordRefs = useRef([]);
  const [environment, setEnvironment] = useState({ autoMotion: false, reducedMotion: false });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const autoMotionQuery = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncEnvironment = () => {
      setEnvironment({
        autoMotion: autoMotionQuery.matches,
        reducedMotion: reducedMotionQuery.matches,
      });
    };

    syncEnvironment();
    autoMotionQuery.addEventListener?.("change", syncEnvironment);
    reducedMotionQuery.addEventListener?.("change", syncEnvironment);

    return () => {
      autoMotionQuery.removeEventListener?.("change", syncEnvironment);
      reducedMotionQuery.removeEventListener?.("change", syncEnvironment);
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    const cometNode = cometRef.current;
    const cometGlowNode = cometGlowRef.current;
    const trailNodes = trailRefs.current.filter(Boolean);
    const wordNodes = wordRefs.current.filter(Boolean);

    if (!panel || !cometNode || !cometGlowNode || !trailNodes.length || !wordNodes.length) {
      return undefined;
    }

    let animationFrameId = 0;
    let resizeAnimationFrameId = 0;
    let resizeObserver;
    let mounted = true;

    const scene = {
      height: 0,
      pointer: {
        active: false,
        angle: 0,
        targetX: 0,
        targetY: 0,
        x: 0,
        y: 0,
      },
      time: 0,
      trail: trailNodes.map(() => ({ x: 0, y: 0 })),
      width: 0,
      words: [],
    };

    function positionWords(width, height, preserveVelocity) {
      const currentWords = preserveVelocity ? scene.words : buildWordState(width, height);

      scene.words = currentWords.map((word, index) => {
        const layout = WORD_LAYOUT[index];
        const nextHomeX = width * layout.x;
        const nextHomeY = height * layout.y;

        if (!preserveVelocity) {
          return {
            ...word,
            homeX: nextHomeX,
            homeY: nextHomeY,
            x: nextHomeX,
            y: nextHomeY,
          };
        }

        return {
          ...word,
          homeX: nextHomeX,
          homeY: nextHomeY,
          x: clamp(word.x, 36, width - 36),
          y: clamp(word.y, 32, height - 32),
        };
      });
    }

    function syncBounds(preserveVelocity = false) {
      const rect = panel.getBoundingClientRect();
      const nextWidth = Math.max(rect.width, 320);
      const nextHeight = Math.max(rect.height, 260);

      const hadBounds = scene.width > 0 && scene.height > 0;
      scene.width = nextWidth;
      scene.height = nextHeight;

      if (!hadBounds) {
        scene.pointer.x = nextWidth * 0.48;
        scene.pointer.y = nextHeight * 0.54;
        scene.pointer.targetX = scene.pointer.x;
        scene.pointer.targetY = scene.pointer.y;
        scene.trail.forEach((node) => {
          node.x = scene.pointer.x;
          node.y = scene.pointer.y;
        });
      } else {
        scene.pointer.x = clamp(scene.pointer.x, 32, nextWidth - 32);
        scene.pointer.y = clamp(scene.pointer.y, 32, nextHeight - 32);
        scene.pointer.targetX = clamp(scene.pointer.targetX, 32, nextWidth - 32);
        scene.pointer.targetY = clamp(scene.pointer.targetY, 32, nextHeight - 32);
      }

      positionWords(nextWidth, nextHeight, preserveVelocity);
    }

    function queueResize() {
      cancelAnimationFrame(resizeAnimationFrameId);
      resizeAnimationFrameId = window.requestAnimationFrame(() => syncBounds(true));
    }

    function updatePointerTarget(clientX, clientY) {
      const rect = panel.getBoundingClientRect();
      scene.pointer.targetX = clamp(clientX - rect.left, 30, scene.width - 30);
      scene.pointer.targetY = clamp(clientY - rect.top, 30, scene.height - 30);
    }

    function handlePointerEnter(event) {
      if (environment.autoMotion) {
        return;
      }

      scene.pointer.active = true;
      updatePointerTarget(event.clientX, event.clientY);
    }

    function handlePointerMove(event) {
      if (environment.autoMotion) {
        return;
      }

      scene.pointer.active = true;
      updatePointerTarget(event.clientX, event.clientY);
    }

    function handlePointerLeave() {
      if (environment.autoMotion) {
        return;
      }

      scene.pointer.active = false;
    }

    syncBounds(false);

    panel.addEventListener("pointerenter", handlePointerEnter);
    panel.addEventListener("pointermove", handlePointerMove);
    panel.addEventListener("pointerleave", handlePointerLeave);

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => queueResize());
      resizeObserver.observe(panel);
    } else {
      window.addEventListener("resize", queueResize, { passive: true });
    }

    let previousTimestamp = 0;

    function animate(timestamp) {
      if (!mounted) {
        return;
      }

      const delta = previousTimestamp ? Math.min(timestamp - previousTimestamp, 32) : 16;
      previousTimestamp = timestamp;
      scene.time += delta;

      const autoDriving = environment.autoMotion || !scene.pointer.active;

      if (autoDriving) {
        const driftFactor = environment.reducedMotion ? 0.34 : 1;
        scene.pointer.targetX =
          scene.width * (0.5 + Math.cos(scene.time * 0.00042) * 0.28 * driftFactor + Math.sin(scene.time * 0.0011) * 0.05);
        scene.pointer.targetY =
          scene.height * (0.54 + Math.sin(scene.time * 0.00048) * 0.24 * driftFactor + Math.cos(scene.time * 0.00087) * 0.04);
      }

      const previousX = scene.pointer.x;
      const previousY = scene.pointer.y;
      const pointerLerp = environment.reducedMotion ? 0.08 : 0.16;

      scene.pointer.x += (scene.pointer.targetX - scene.pointer.x) * pointerLerp;
      scene.pointer.y += (scene.pointer.targetY - scene.pointer.y) * pointerLerp;

      const velocityX = scene.pointer.x - previousX;
      const velocityY = scene.pointer.y - previousY;

      if (Math.abs(velocityX) > 0.02 || Math.abs(velocityY) > 0.02) {
        scene.pointer.angle = Math.atan2(velocityY, velocityX);
      }

      scene.trail.forEach((trailNode, index) => {
        const leader = index === 0 ? scene.pointer : scene.trail[index - 1];
        const followStrength = environment.reducedMotion ? 0.12 : Math.max(0.18, 0.34 - index * 0.035);

        trailNode.x += (leader.x - trailNode.x) * followStrength;
        trailNode.y += (leader.y - trailNode.y) * followStrength;

        const trailElement = trailNodes[index];
        const scale = environment.reducedMotion ? 0.58 - index * 0.045 : 1.05 - index * 0.09;
        const opacity = environment.reducedMotion ? 0.12 - index * 0.014 : 0.52 - index * 0.06;

        trailElement.style.transform = `translate3d(${trailNode.x}px, ${trailNode.y}px, 0) translate(-50%, -50%) scale(${Math.max(scale, 0.18)})`;
        trailElement.style.opacity = `${Math.max(opacity, 0.05)}`;
      });

      scene.words.forEach((word, index) => {
        const timeFactor = scene.time * 0.001;
        const floatX = Math.cos(timeFactor * 0.48 + word.phase) * word.floatX;
        const floatY = Math.sin(timeFactor * 0.42 + word.phase * 1.3) * word.floatY;
        const desiredX = word.homeX + (environment.reducedMotion ? floatX * 0.25 : floatX);
        const desiredY = word.homeY + (environment.reducedMotion ? floatY * 0.25 : floatY);
        const diffX = word.x - scene.pointer.x;
        const diffY = word.y - scene.pointer.y;
        const distance = Math.hypot(diffX, diffY) || 1;
        const repelRadius = environment.reducedMotion ? 72 : 124;

        if (!environment.reducedMotion && distance < repelRadius) {
          const force = (1 - distance / repelRadius) * 1.85;
          word.vx += (diffX / distance) * force;
          word.vy += (diffY / distance) * force;
        }

        word.vx += (desiredX - word.x) * (environment.reducedMotion ? 0.018 : 0.04);
        word.vy += (desiredY - word.y) * (environment.reducedMotion ? 0.018 : 0.04);
        word.vx *= environment.reducedMotion ? 0.84 : 0.9;
        word.vy *= environment.reducedMotion ? 0.84 : 0.9;
        word.x = clamp(word.x + word.vx, 38, scene.width - 38);
        word.y = clamp(word.y + word.vy, 30, scene.height - 30);

        let nearestTrailDistance = distance;
        for (let trailIndex = 0; trailIndex < Math.min(scene.trail.length, 4); trailIndex += 1) {
          const trailNode = scene.trail[trailIndex];
          nearestTrailDistance = Math.min(
            nearestTrailDistance,
            Math.hypot(word.x - trailNode.x, word.y - trailNode.y)
          );
        }

        const baseReveal = word.label === "GoBeyond" ? 0.46 : environment.reducedMotion ? 0.16 : 0.08;
        const revealRadius = environment.reducedMotion ? 92 : 132;
        const nextReveal = nearestTrailDistance < revealRadius ? 1 : baseReveal;
        word.reveal += (nextReveal - word.reveal) * (environment.reducedMotion ? 0.045 : 0.11);

        const wordNode = wordNodes[index];
        const scale = 0.86 + word.reveal * 0.22;
        const opacity = 0.16 + word.reveal * 0.84;
        const rotate = Math.sin(timeFactor * 0.22 + word.phase) * 2.8;

        wordNode.style.transform = `translate3d(${word.x}px, ${word.y}px, 0) translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`;
        wordNode.style.opacity = `${opacity}`;
        wordNode.style.borderColor = `color-mix(in srgb, ${word.hue} ${Math.round(44 + word.reveal * 42)}%, rgba(255,255,255,0.12))`;
        wordNode.style.boxShadow = `0 0 ${16 + word.reveal * 30}px color-mix(in srgb, ${word.hue} ${Math.round(
          18 + word.reveal * 28
        )}%, transparent)`;
      });

      const cometScale = environment.reducedMotion ? 0.9 : 1 + Math.min(Math.hypot(velocityX, velocityY) / 12, 0.14);
      const cometAngle = `${scene.pointer.angle}rad`;

      cometNode.style.transform = `translate3d(${scene.pointer.x}px, ${scene.pointer.y}px, 0) translate(-50%, -50%) rotate(${cometAngle}) scale(${cometScale})`;
      cometGlowNode.style.transform = `translate(-12%, -50%) scaleX(${environment.reducedMotion ? 0.7 : 1})`;
      cometGlowNode.style.opacity = environment.reducedMotion ? "0.32" : `${0.42 + Math.min(Math.hypot(velocityX, velocityY) / 20, 0.28)}`;

      animationFrameId = window.requestAnimationFrame(animate);
    }

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(resizeAnimationFrameId);
      panel.removeEventListener("pointerenter", handlePointerEnter);
      panel.removeEventListener("pointermove", handlePointerMove);
      panel.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", queueResize);
    };
  }, [environment.autoMotion, environment.reducedMotion]);

  return (
    <div
      ref={panelRef}
      aria-hidden="true"
      className="relative isolate h-full w-full overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#07111f] shadow-[0_36px_120px_rgba(0,0,0,0.46)]"
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 18% 18%, rgba(35,179,255,0.24), transparent 30%)",
            "radial-gradient(circle at 82% 20%, rgba(255,107,26,0.18), transparent 28%)",
            "radial-gradient(circle at 50% 78%, rgba(134,217,87,0.18), transparent 32%)",
            "linear-gradient(180deg, rgba(6,12,24,0.92), rgba(5,11,20,0.72))",
          ].join(", "),
        }}
      />
      <div
        className="absolute inset-[8%] rounded-[2.5rem] border border-white/[0.08] opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.03), rgba(255,255,255,0) 70%), repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 28px)",
        }}
      />
      <div className="absolute -left-[12%] top-[14%] h-[38%] w-[68%] rounded-full border border-[#23b3ff]/12" />
      <div className="absolute right-[-18%] top-[26%] h-[52%] w-[74%] rounded-full border border-white/8" />
      <div className="absolute left-[6%] top-[56%] h-[34%] w-[44%] rounded-full border border-[#86d957]/12" />
      <div className="absolute inset-x-[12%] top-[12%] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="absolute inset-x-[20%] bottom-[16%] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      {WORD_LAYOUT.map((word, index) => (
        <div
          key={word.label}
          ref={(node) => {
            wordRefs.current[index] = node;
          }}
          className="pointer-events-none absolute left-0 top-0 rounded-full border bg-[#091426]/78 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white/90 opacity-0 backdrop-blur-md will-change-transform sm:text-[11px]"
          style={{ color: word.hue }}
        >
          {word.label}
        </div>
      ))}

      {TRAIL_COLORS.map((color, index) => (
        <div
          key={`${color}-${index}`}
          ref={(node) => {
            trailRefs.current[index] = node;
          }}
          className="pointer-events-none absolute left-0 top-0 h-16 w-16 rounded-full opacity-0 blur-xl will-change-transform"
          style={{
            background: `radial-gradient(circle, ${color} 0%, ${color} 38%, transparent 72%)`,
            mixBlendMode: index === 0 ? "normal" : "screen",
          }}
        />
      ))}

      <div
        ref={cometRef}
        className="pointer-events-none absolute left-0 top-0 h-[88px] w-[88px] will-change-transform"
      >
        <div
          ref={cometGlowRef}
          className="absolute left-[18%] top-1/2 h-9 w-28 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,198,42,0.3),rgba(255,107,26,0.46),rgba(35,179,255,0.68))] blur-lg"
        />
        <svg
          className="absolute inset-0 overflow-visible drop-shadow-[0_0_18px_rgba(35,179,255,0.32)]"
          viewBox="0 0 88 88"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gb-rocket-flame" x1="0%" x2="100%" y1="50%" y2="50%">
              <stop offset="0%" stopColor="#23b3ff" stopOpacity="0" />
              <stop offset="42%" stopColor="#ff6b1a" stopOpacity="0.92" />
              <stop offset="72%" stopColor="#ffc62a" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#fff1b5" stopOpacity="0.98" />
            </linearGradient>
            <linearGradient id="gb-rocket-body" x1="18%" x2="100%" y1="22%" y2="84%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f3efe4" />
              <stop offset="100%" stopColor="#d9d3c8" />
            </linearGradient>
          </defs>

          <path
            d="M8 44C18 36 28 34 37 35C30 41 30 47 37 53C28 54 18 52 8 44Z"
            fill="url(#gb-rocket-flame)"
            opacity="0.98"
          />
          <path
            d="M28 54L18 68L33 62L38 53Z"
            fill="#ff6b1a"
            stroke="#0b2037"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M28 34L18 20L33 26L38 35Z"
            fill="#ff6b1a"
            stroke="#0b2037"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M31 44C31 30 45 18 57 16C63 15 68 15 73 16C74 21 74 26 73 31C71 43 59 57 45 57H31V44Z"
            fill="url(#gb-rocket-body)"
            stroke="#0b2037"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path
            d="M57 16C63 15 68 15 73 16C74 21 74 26 73 31C70 29 66 27 61 25C59 22 58 19 57 16Z"
            fill="#ff6b1a"
            stroke="#0b2037"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <circle cx="52" cy="36" fill="#23b3ff" r="7.5" stroke="#0b2037" strokeWidth="3" />
          <circle cx="52" cy="36" fill="#dff7ff" r="3.3" />
          <path
            d="M37 35L31 29"
            stroke="#0b2037"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M37 53L31 59"
            stroke="#0b2037"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M28 44H40"
            stroke="#0b2037"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.34em] text-white/30 sm:inset-x-8 sm:text-[10px]">
        <span>Go Beyond Signal</span>
        <span>Impacto en movimiento</span>
      </div>
    </div>
  );
}
