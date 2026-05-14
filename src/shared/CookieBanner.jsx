import { useState } from "react";

const STORAGE_KEY = "gb_cookie_consent";

function readConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {}
}

export function CookieBanner() {
  const [visible, setVisible] = useState(() => readConsent() === null);

  if (!visible) return null;

  function accept(type) {
    writeConsent(type);
    setVisible(false);
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-5"
      role="region"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-[#0c0c0c]/95 px-5 py-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6">
        <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-gray-400">
          Usamos cookies esenciales para el funcionamiento del sitio y opcionales para mejorar tu
          experiencia.{" "}
          <a
            className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
            href="/cookies"
          >
            Política de cookies
          </a>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-300 transition hover:bg-white/10"
            onClick={() => accept("essential")}
            type="button"
          >
            Solo esenciales
          </button>
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-blue-500"
            onClick={() => accept("all")}
            type="button"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
