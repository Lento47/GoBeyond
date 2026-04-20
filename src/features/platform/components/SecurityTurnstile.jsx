import { useEffect, useRef } from "react";

let turnstileScriptPromise = null;

function loadTurnstileScript() {
  if (globalThis.turnstile) {
    return Promise.resolve(globalThis.turnstile);
  }

  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-turnstile-script="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(globalThis.turnstile), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.dataset.turnstileScript = "true";
      script.onload = () => resolve(globalThis.turnstile);
      script.onerror = () => reject(new Error("No se pudo cargar Turnstile."));
      document.head.appendChild(script);
    });
  }

  return turnstileScriptPromise;
}

export function SecurityTurnstile({ action, className = "", onTokenChange, resetKey = 0, siteKey, theme = "auto" }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return undefined;
    }

    let mounted = true;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!mounted || !turnstile || widgetIdRef.current !== null || !containerRef.current) {
          return;
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          action,
          callback: (token) => onTokenChange?.(token),
          "error-callback": () => onTokenChange?.(""),
          "expired-callback": () => onTokenChange?.(""),
          sitekey: siteKey,
          theme,
        });
      })
      .catch(() => {
        onTokenChange?.("");
      });

    return () => {
      mounted = false;

      if (widgetIdRef.current !== null && globalThis.turnstile) {
        globalThis.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, onTokenChange, siteKey, theme]);

  useEffect(() => {
    if (widgetIdRef.current === null || !globalThis.turnstile) {
      return;
    }

    globalThis.turnstile.reset(widgetIdRef.current);
    onTokenChange?.("");
  }, [onTokenChange, resetKey]);

  if (!siteKey) {
    return null;
  }

  return <div className={className} ref={containerRef} />;
}
