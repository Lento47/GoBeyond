import { useEffect, useRef, useState } from "react";
import { SecurityTurnstile } from "./components/SecurityTurnstile";

const labelClassName = "mb-2 block text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#6b7a90]";
const primaryButtonClassName =
  "rounded-[1.15rem] bg-[#1d4ed8] px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(29,78,216,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName =
  "rounded-[1.15rem] border border-[#d7e0ea] bg-[#f7f9fc] px-5 py-4 text-sm font-semibold text-[#172033] transition-all duration-200 hover:border-[#bbc8d9] hover:bg-white";
const textButtonClassName = "w-fit text-sm font-medium text-[#1d4ed8] transition-colors duration-200 hover:text-[#1e40af]";
const fullTurn = Math.PI * 2;

function Input({ className = "", ...props }) {
  return (
    <input
      className={[
        "w-full rounded-[1.15rem] border border-[#d7e0ea] bg-white px-4 py-4 text-sm text-[#172033] shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "placeholder:text-[#8a97ab] focus:border-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#dbeafe]",
        "transition-all duration-200",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

function BrandMark({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
      <div className={`shrink-0 ${compact ? "h-12 w-12" : "h-16 w-16"}`}>
        <img alt="Icono de GoBeyond" className="h-full w-full object-contain" src="/logo-icon.png" />
      </div>

      <div>
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-[#c07d36]">GoBeyond</p>
        <p className={`font-['Georgia'] text-[#172033] ${compact ? "text-lg" : "text-[1.85rem]"}`}>Secure access</p>
      </div>
    </div>
  );
}

function InteractiveDotField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const pointer = {
      active: false,
      lastMoveAt: 0,
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0,
    };
    const scene = {
      height: 0,
      points: [],
      spacing: 40,
      width: 0,
    };
    let frameId = 0;

    function rebuildScene() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      const spacing = width < 520 ? 28 : width < 900 ? 34 : width < 1280 ? 40 : 44;
      const inset = width < 640 ? 20 : 32;
      const columns = Math.max(8, Math.floor((width - inset * 2) / spacing) + 1);
      const rows = Math.max(12, Math.floor((height - inset * 2) / spacing) + 1);
      const gridWidth = (columns - 1) * spacing;
      const gridHeight = (rows - 1) * spacing;
      const offsetX = (width - gridWidth) / 2;
      const offsetY = (height - gridHeight) / 2;
      const centerColumn = (columns - 1) / 2;
      const centerRow = (rows - 1) / 2;
      const maxDistance = Math.max(1, Math.hypot(centerColumn, centerRow));
      const nextPoints = [];

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const distanceFromCenter = Math.hypot(column - centerColumn, row - centerRow);
          const normalizedDistance = distanceFromCenter / maxDistance;

          nextPoints.push({
            baseRadius: width < 640 ? 1.05 : 1.16,
            floatStrength: width < 640 ? 0.34 : 0.52,
            intensity: 1 - normalizedDistance * 0.42,
            phase: distanceFromCenter * 0.5,
            x: offsetX + column * spacing,
            y: offsetY + row * spacing,
          });
        }
      }

      scene.height = height;
      scene.points = nextPoints;
      scene.spacing = spacing;
      scene.width = width;
    }

    function drawFrame(timestamp) {
      const isReducedMotion = reduceMotionQuery.matches;
      const isFinePointer = finePointerQuery.matches;
      const pointerIsActive = !isReducedMotion && isFinePointer && pointer.active;
      const time = timestamp * 0.001;
      const influenceRadius = scene.spacing * 3.2;

      if (pointerIsActive) {
        pointer.x += (pointer.targetX - pointer.x) * 0.14;
        pointer.y += (pointer.targetY - pointer.y) * 0.14;

        if (timestamp - pointer.lastMoveAt > 1400) {
          pointer.active = false;
        }
      }

      context.clearRect(0, 0, scene.width, scene.height);

      for (const point of scene.points) {
        const breathingWave = isReducedMotion
          ? 0
          : Math.sin(time * 1.18 + point.phase) * 0.5 + Math.cos(time * 0.82 + point.phase * 0.92) * 0.5;
        const pulse = 0.5 + breathingWave * 0.5;
        const driftX = isReducedMotion ? 0 : Math.sin(time * 0.88 + point.phase * 1.08) * point.floatStrength;
        const driftY = isReducedMotion ? 0 : Math.cos(time * 0.96 + point.phase * 0.94) * point.floatStrength;

        let offsetX = driftX;
        let offsetY = driftY;
        let influence = 0;

        if (pointerIsActive) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const normalizedInfluence = Math.max(0, 1 - distance / influenceRadius);

          if (normalizedInfluence > 0) {
            const force = normalizedInfluence * normalizedInfluence;
            const distanceRatio = distance > 0 ? 1 / distance : 0;
            const travel = scene.spacing * 0.26 * force;

            offsetX += dx * distanceRatio * travel;
            offsetY += dy * distanceRatio * travel;
            influence = force;
          }
        }

        const x = point.x + offsetX;
        const y = point.y + offsetY;
        const radius = point.baseRadius + pulse * 0.26 + influence * 0.7;
        const baseAlpha = Math.min(0.34, 0.12 + point.intensity * 0.08 + pulse * 0.1 + influence * 0.26);

        if (influence > 0.02) {
          context.beginPath();
          context.fillStyle = `rgba(214,164,110,${0.03 + influence * 0.08})`;
          context.arc(x, y, radius * 5.2, 0, fullTurn);
          context.fill();

          context.beginPath();
          context.fillStyle = `rgba(29,78,216,${0.04 + influence * 0.14})`;
          context.arc(x, y, radius * 3.4, 0, fullTurn);
          context.fill();
        }

        context.beginPath();
        context.fillStyle = `rgba(98,116,140,${baseAlpha})`;
        context.arc(x, y, radius, 0, fullTurn);
        context.fill();
      }

      if (!isReducedMotion) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    }

    function handlePointerMove(event) {
      if (reduceMotionQuery.matches || !finePointerQuery.matches) {
        return;
      }

      if (!pointer.active) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      }

      pointer.active = true;
      pointer.lastMoveAt = performance.now();
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
    }

    function handlePointerExit() {
      pointer.active = false;
    }

    function handleResize() {
      rebuildScene();
      if (reduceMotionQuery.matches) {
        drawFrame(0);
      }
    }

    rebuildScene();
    drawFrame(0);

    window.addEventListener("resize", handleResize, { passive: true });

    if (!reduceMotionQuery.matches) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("blur", handlePointerExit);
      document.addEventListener("pointerleave", handlePointerExit);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerExit);
      document.removeEventListener("pointerleave", handlePointerExit);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none opacity-[0.95]"
      ref={canvasRef}
    />
  );
}

export function LoginExperience({
  authLoading,
  error,
  mode,
  notice,
  onBack,
  onLogin,
  onModeChange,
  onRegister,
  onRequestPasswordReset,
  onRequestVerification,
  onResetPassword,
  onResetFlowExit,
  resetToken,
  turnstileSiteKey,
  verificationToken,
  onVerifyAccount,
  onVerificationFlowExit,
}) {
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [forgotForm, setForgotForm] = useState({
    email: "",
  });
  const [verificationRequestForm, setVerificationRequestForm] = useState({
    email: "",
  });
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [registerTurnstileToken, setRegisterTurnstileToken] = useState("");
  const [forgotTurnstileToken, setForgotTurnstileToken] = useState("");
  const [verificationTurnstileToken, setVerificationTurnstileToken] = useState("");
  const [registerTurnstileResetKey, setRegisterTurnstileResetKey] = useState(0);
  const [forgotTurnstileResetKey, setForgotTurnstileResetKey] = useState(0);
  const [verificationTurnstileResetKey, setVerificationTurnstileResetKey] = useState(0);
  const [showForgot, setShowForgot] = useState(false);
  const [showVerificationRequest, setShowVerificationRequest] = useState(false);
  const [clientError, setClientError] = useState("");
  const requiresTurnstile = Boolean(turnstileSiteKey);

  const isResetFlow = Boolean(resetToken);
  const isVerificationFlow = Boolean(verificationToken);

  useEffect(() => {
    setShowForgot(false);
    setShowVerificationRequest(false);
    setClientError("");
    setRegisterTurnstileToken("");
    setForgotTurnstileToken("");
    setVerificationTurnstileToken("");
  }, [mode, resetToken, verificationToken]);

  useEffect(() => {
    if (!showForgot) {
      setForgotTurnstileToken("");
    }

    if (!showVerificationRequest) {
      setVerificationTurnstileToken("");
    }
  }, [showForgot, showVerificationRequest]);

  async function handleLogin(event) {
    event.preventDefault();
    setClientError("");
    await onLogin(loginForm);
  }

  async function handleRegister(event) {
    event.preventDefault();
    setClientError("");

    if (requiresTurnstile && !registerTurnstileToken) {
      setClientError("Completa la verificacion de seguridad.");
      return;
    }

    try {
      await onRegister({
        ...registerForm,
        turnstileToken: registerTurnstileToken,
      });
      setRegisterTurnstileResetKey((current) => current + 1);
      setRegisterTurnstileToken("");
    } catch (requestError) {
      setRegisterTurnstileResetKey((current) => current + 1);
      setRegisterTurnstileToken("");
      throw requestError;
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setClientError("");

    if (requiresTurnstile && !forgotTurnstileToken) {
      setClientError("Completa la verificacion de seguridad.");
      return;
    }

    try {
      await onRequestPasswordReset({
        ...forgotForm,
        turnstileToken: forgotTurnstileToken,
      });
      setForgotTurnstileResetKey((current) => current + 1);
      setForgotTurnstileToken("");
    } catch (requestError) {
      setForgotTurnstileResetKey((current) => current + 1);
      setForgotTurnstileToken("");
      throw requestError;
    }
  }

  async function handleVerificationRequest(event) {
    event.preventDefault();
    setClientError("");

    if (requiresTurnstile && !verificationTurnstileToken) {
      setClientError("Completa la verificacion de seguridad.");
      return;
    }

    try {
      await onRequestVerification({
        ...verificationRequestForm,
        turnstileToken: verificationTurnstileToken,
      });
      setVerificationTurnstileResetKey((current) => current + 1);
      setVerificationTurnstileToken("");
    } catch (requestError) {
      setVerificationTurnstileResetKey((current) => current + 1);
      setVerificationTurnstileToken("");
      throw requestError;
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (resetForm.password !== resetForm.confirmPassword) {
      setClientError("Las contrasenas no coinciden.");
      return;
    }

    setClientError("");
    await onResetPassword({
      token: resetToken,
      password: resetForm.password,
    });
    setResetForm({
      password: "",
      confirmPassword: "",
    });
  }

  async function handleVerifyAccount(event) {
    event.preventDefault();
    setClientError("");
    await onVerifyAccount({
      token: verificationToken,
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7fb] text-[#172033]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,164,110,0.18),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(29,78,216,0.10),_transparent_26%),linear-gradient(180deg,_#f9fbfe_0%,_#f3f7fc_48%,_#eef3f8_100%)]" />
      <InteractiveDotField />
      <div className="absolute left-[-7rem] top-16 h-72 w-72 rounded-full bg-[#d6a46e]/16 blur-3xl" />
      <div className="absolute right-[-5rem] top-24 h-80 w-80 rounded-full bg-[#dbeafe] blur-3xl" />
      <div className="absolute bottom-[-6rem] left-[18%] h-72 w-72 rounded-full bg-white/70 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center gap-4 rounded-[24px] border border-[#d7e0ea] bg-white/82 px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur sm:px-6">
          <button className="group text-left" onClick={onBack} type="button">
            <BrandMark compact />
            <p className="mt-2 pl-[3.75rem] text-xs font-semibold tracking-[0.16em] text-[#6b7a90] transition-colors group-hover:text-[#172033]">
              Volver al inicio
            </p>
          </button>
        </header>

        <main className="flex flex-1 items-center py-8 lg:py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
            <section className="login-fade-up order-2 relative overflow-hidden rounded-[2rem] border border-[#d7e0ea] bg-[linear-gradient(180deg,_rgba(255,255,255,0.86)_0%,_rgba(247,250,253,0.92)_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:order-1 lg:min-h-[38rem] lg:p-10" style={{ animationDelay: "120ms" }}>
              <div className="absolute inset-y-0 right-0 w-[32%] bg-[linear-gradient(180deg,_rgba(219,234,254,0.65)_0%,_rgba(255,255,255,0)_100%)]" />
              <div className="absolute left-[-3rem] top-[-2rem] h-40 w-40 rounded-full bg-[#f3e2cf] blur-3xl" />
              <div className="absolute bottom-[-2rem] right-10 h-48 w-48 rounded-full bg-[#dbeafe] blur-3xl" />

              <div className="relative flex h-full flex-col">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e8d4bf] bg-[#fff8f1] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#b66e2a]">
                  <span className="h-2 w-2 rounded-full bg-[#d6a46e]" />
                  Acceso GoBeyond
                </div>
                <div className="mt-6">
                  <BrandMark />
                </div>
                <h1 className="mt-8 max-w-xl text-[2rem] font-semibold leading-tight text-[#172033] sm:text-[2.65rem]">
                  Continúa en tu portal, comunidad o espacio administrativo desde una sola entrada segura.
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#536277] sm:text-base">
                  Una experiencia de acceso clara, protegida y coherente con el landing y el workspace privado de GoBeyond.
                </p>

                <div className="mt-8 grid gap-4">
                  {[
                    ["Portal estudiantil", "Cursos activos, avance academico y soporte en un solo lugar."],
                    ["Comunidad", "Preguntas, respuestas y contexto compartido entre estudiantes."],
                    ["Administrativo", "Gestion operativa con acceso controlado y vistas organizadas."],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-[1.35rem] border border-[#d7e0ea] bg-white/78 px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#536277]">{body}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="rounded-full border border-[#d7e0ea] bg-white px-4 py-2 text-[11px] font-semibold text-[#435066]">Verificacion por correo</div>
                  <div className="rounded-full border border-[#d7e0ea] bg-white px-4 py-2 text-[11px] font-semibold text-[#435066]">Recuperacion segura</div>
                  <div className="rounded-full border border-[#d7e0ea] bg-white px-4 py-2 text-[11px] font-semibold text-[#435066]">Acceso por rol</div>
                </div>
              </div>
            </section>

            <section className="login-fade-up order-1 relative lg:order-2" style={{ animationDelay: "220ms" }}>
              <div className="absolute inset-x-10 top-0 h-20 rounded-full bg-[#d6a46e]/16 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-[#d7e0ea] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:p-8">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#f3e2cf]/75 blur-2xl" />
                <div className="absolute bottom-[-2rem] left-[-1rem] h-28 w-28 rounded-full bg-[#dbeafe] blur-2xl" />

                <div className="relative">
                  <div>
                    <div>
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.34em] text-[#b66e2a]">Portal de acceso</p>
                      <h2 className="mt-3 font-['Georgia'] text-3xl text-[#172033]">
                        {isVerificationFlow
                          ? "Verifica tu cuenta"
                          : isResetFlow
                          ? "Restablece tu contrasena"
                          : mode === "register"
                          ? "Crea tu cuenta"
                          : showForgot
                          ? "Recupera tu acceso"
                          : "Ingresa a GoBeyond"}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[#536277]">
                        {isVerificationFlow
                          ? "Este enlace solo activa tu cuenta. No cambia tu contrasena y debe abrirse desde el correo de verificacion."
                          : isResetFlow
                          ? "Este enlace es solo para crear una nueva contrasena. Expira en 30 minutos y al confirmar cerraremos tus sesiones activas para proteger la cuenta."
                          : mode === "register"
                          ? "Completa tus datos para crear tu cuenta."
                          : showForgot
                          ? "Te enviaremos un enlace seguro al correo registrado, sin exponer si la cuenta existe o no."
                          : "Ingresa tus credenciales para autenticarte."}
                      </p>
                    </div>
                  </div>

                  {!isResetFlow && !isVerificationFlow ? (
                    <div className="mt-8 inline-flex rounded-full border border-[#d7e0ea] bg-[#f7f9fc] p-1.5">
                      <button
                        className={`rounded-full px-5 py-2.5 text-[0.72rem] font-black uppercase tracking-[0.26em] transition-all ${
                          mode === "login" ? "bg-[#1d4ed8] text-white shadow-[0_10px_25px_rgba(29,78,216,0.18)]" : "text-[#6b7a90]"
                        }`}
                        onClick={() => onModeChange("login")}
                        type="button"
                      >
                        Ingresar
                      </button>
                      <button
                        className={`rounded-full px-5 py-2.5 text-[0.72rem] font-black uppercase tracking-[0.26em] transition-all ${
                          mode === "register" ? "bg-[#1d4ed8] text-white shadow-[0_10px_25px_rgba(29,78,216,0.18)]" : "text-[#6b7a90]"
                        }`}
                        onClick={() => onModeChange("register")}
                        type="button"
                      >
                        Crear cuenta
                      </button>
                    </div>
                  ) : null}

                  {isVerificationFlow ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleVerifyAccount}>
                      <button
                        className={`mt-3 ${primaryButtonClassName}`}
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Verificando enlace" : "Activar cuenta"}
                      </button>

                      <button
                        className={secondaryButtonClassName}
                        onClick={onVerificationFlowExit}
                        type="button"
                      >
                        Volver al login
                      </button>
                    </form>
                  ) : isResetFlow ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleResetPassword}>
                      <div>
                        <label className={labelClassName}>
                          Nueva contrasena
                        </label>
                        <Input
                          autoComplete="new-password"
                          onChange={(event) => setResetForm({ ...resetForm, password: event.target.value })}
                          placeholder="Crea una nueva contrasena segura"
                          type="password"
                          value={resetForm.password}
                        />
                      </div>

                      <div>
                        <label className={labelClassName}>
                          Confirmar contrasena
                        </label>
                        <Input
                          autoComplete="new-password"
                          onChange={(event) => setResetForm({ ...resetForm, confirmPassword: event.target.value })}
                          placeholder="Repite la nueva contrasena"
                          type="password"
                          value={resetForm.confirmPassword}
                        />
                      </div>

                      <button
                        className={`mt-3 ${primaryButtonClassName}`}
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Actualizando contrasena" : "Guardar nueva contrasena"}
                      </button>

                      <button
                        className={secondaryButtonClassName}
                        onClick={onResetFlowExit}
                        type="button"
                      >
                        Volver a ingresar
                      </button>
                    </form>
                  ) : mode === "register" ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleRegister}>
                      <div>
                        <label className={labelClassName}>
                          Nombre completo
                        </label>
                        <Input
                          autoComplete="name"
                          onChange={(event) => setRegisterForm({ ...registerForm, fullName: event.target.value })}
                          placeholder="Tu nombre completo"
                          value={registerForm.fullName}
                        />
                      </div>

                      <div>
                        <label className={labelClassName}>
                          Correo electronico
                        </label>
                        <Input
                          autoComplete="email"
                          onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                          placeholder="nombre@correo.com"
                          type="email"
                          value={registerForm.email}
                        />
                      </div>

                      <div>
                        <label className={labelClassName}>
                          Contrasena
                        </label>
                        <Input
                          autoComplete="new-password"
                          onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                          placeholder="Crea una contrasena segura"
                          type="password"
                          value={registerForm.password}
                        />
                      </div>

                      <SecurityTurnstile
                        action="register"
                        className="overflow-hidden rounded-[1.15rem] border border-[#d7e0ea] bg-[#f7f9fc] p-3"
                        onTokenChange={setRegisterTurnstileToken}
                        resetKey={registerTurnstileResetKey}
                        siteKey={turnstileSiteKey}
                      />

                      <button
                        className={`mt-3 ${primaryButtonClassName}`}
                        disabled={authLoading || (requiresTurnstile && !registerTurnstileToken)}
                        type="submit"
                      >
                        {authLoading ? "Procesando" : "Crear cuenta"}
                      </button>
                    </form>
                  ) : showForgot ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleForgotPassword}>
                      <div>
                        <label className={labelClassName}>
                          Correo de la cuenta
                        </label>
                        <Input
                          autoComplete="email"
                          onChange={(event) => setForgotForm({ email: event.target.value })}
                          placeholder="usuario@correo.com"
                          type="email"
                          value={forgotForm.email}
                        />
                      </div>

                      <SecurityTurnstile
                        action="forgot-password"
                        className="overflow-hidden rounded-[1.15rem] border border-[#d7e0ea] bg-[#f7f9fc] p-3"
                        onTokenChange={setForgotTurnstileToken}
                        resetKey={forgotTurnstileResetKey}
                        siteKey={turnstileSiteKey}
                      />

                      <button
                        className={`mt-3 ${primaryButtonClassName}`}
                        disabled={authLoading || (requiresTurnstile && !forgotTurnstileToken)}
                        type="submit"
                      >
                        {authLoading ? "Enviando" : "Enviar enlace seguro"}
                      </button>

                      <button
                        className={secondaryButtonClassName}
                        onClick={() => {
                          setShowForgot(false);
                          setShowVerificationRequest(false);
                          setForgotTurnstileToken("");
                          setVerificationTurnstileToken("");
                        }}
                        type="button"
                      >
                        Volver al login
                      </button>
                    </form>
                  ) : showVerificationRequest ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleVerificationRequest}>
                      <div>
                        <label className={labelClassName}>
                          Correo de la cuenta
                        </label>
                        <Input
                          autoComplete="email"
                          onChange={(event) => setVerificationRequestForm({ email: event.target.value })}
                          placeholder="usuario@correo.com"
                          type="email"
                          value={verificationRequestForm.email}
                        />
                      </div>

                      <SecurityTurnstile
                        action="send-verification"
                        className="overflow-hidden rounded-[1.15rem] border border-[#d7e0ea] bg-[#f7f9fc] p-3"
                        onTokenChange={setVerificationTurnstileToken}
                        resetKey={verificationTurnstileResetKey}
                        siteKey={turnstileSiteKey}
                      />

                      <button
                        className={`mt-3 ${primaryButtonClassName}`}
                        disabled={authLoading || (requiresTurnstile && !verificationTurnstileToken)}
                        type="submit"
                      >
                        {authLoading ? "Enviando" : "Reenviar verificacion"}
                      </button>

                      <button
                        className={secondaryButtonClassName}
                        onClick={() => {
                          setShowVerificationRequest(false);
                          setShowForgot(false);
                          setVerificationTurnstileToken("");
                          setForgotTurnstileToken("");
                        }}
                        type="button"
                      >
                        Volver al login
                      </button>
                    </form>
                  ) : (
                    <form className="mt-8 grid gap-4" onSubmit={handleLogin}>
                      <div>
                        <label className={labelClassName}>
                          Correo electronico
                        </label>
                        <Input
                          autoComplete="email"
                          onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                          placeholder="usuario@correo.com"
                          type="email"
                          value={loginForm.email}
                        />
                      </div>

                      <div>
                        <label className={labelClassName}>
                          Contrasena
                        </label>
                        <Input
                          autoComplete="current-password"
                          onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                          placeholder="Ingresa tu contrasena"
                          type="password"
                          value={loginForm.password}
                        />
                      </div>

                      <button
                        className={`mt-3 ${primaryButtonClassName}`}
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Entrando" : "Ingresar al portal"}
                      </button>

                      <button
                        className={textButtonClassName}
                        onClick={() => {
                          setShowForgot(true);
                          setShowVerificationRequest(false);
                          setForgotTurnstileResetKey((current) => current + 1);
                          setForgotTurnstileToken("");
                          setVerificationTurnstileToken("");
                        }}
                        type="button"
                      >
                        Olvide mi contrasena
                      </button>

                      <button
                        className={textButtonClassName}
                        onClick={() => {
                          setShowVerificationRequest(true);
                          setShowForgot(false);
                          setVerificationTurnstileResetKey((current) => current + 1);
                          setVerificationTurnstileToken("");
                          setForgotTurnstileToken("");
                        }}
                        type="button"
                      >
                        Reenviar enlace de verificacion
                      </button>
                    </form>
                  )}

                  {notice ? (
                    <div className="mt-5 rounded-[1.2rem] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
                      {notice}
                    </div>
                  ) : null}

                  {clientError || error ? (
                    <div className="mt-5 rounded-[1.2rem] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">
                      {clientError || error}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="pb-2 pt-6 text-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#7b8798]">
            2026 GoBeyond · Acceso protegido
          </p>
        </footer>
      </div>

      <style>{`
        .login-fade-up {
          opacity: 0;
          transform: translateY(26px);
          animation: loginFadeUp 760ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes loginFadeUp {
          from {
            opacity: 0;
            transform: translateY(26px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
