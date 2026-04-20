import { useEffect, useState } from "react";

function Input({ className = "", ...props }) {
  return (
    <input
      className={[
        "w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white",
        "placeholder:text-[#7f8796] focus:border-[#d6a46e] focus:outline-none focus:ring-2 focus:ring-[#d6a46e]/20",
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
        <p className="text-[0.65rem] uppercase tracking-[0.45em] text-[#d6a46e]">GoBeyond</p>
        <p className={`font-['Georgia'] text-white ${compact ? "text-lg" : "text-2xl"}`}>Secure access</p>
      </div>
    </div>
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
  const [showForgot, setShowForgot] = useState(false);
  const [showVerificationRequest, setShowVerificationRequest] = useState(false);
  const [clientError, setClientError] = useState("");

  const isResetFlow = Boolean(resetToken);
  const isVerificationFlow = Boolean(verificationToken);

  useEffect(() => {
    setShowForgot(false);
    setShowVerificationRequest(false);
    setClientError("");
  }, [mode, resetToken, verificationToken]);

  async function handleLogin(event) {
    event.preventDefault();
    setClientError("");
    await onLogin(loginForm);
  }

  async function handleRegister(event) {
    event.preventDefault();
    setClientError("");
    await onRegister(registerForm);
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setClientError("");
    await onRequestPasswordReset(forgotForm);
  }

  async function handleVerificationRequest(event) {
    event.preventDefault();
    setClientError("");
    await onRequestVerification(verificationRequestForm);
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
    <div className="relative min-h-screen overflow-hidden bg-[#070709] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,164,110,0.14),_transparent_30%),radial-gradient(circle_at_85%_20%,_rgba(36,22,15,0.55),_transparent_28%),linear-gradient(145deg,_#070709_0%,_#111318_55%,_#161016_100%)]" />
      <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[#d6a46e]/10 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-3rem] h-80 w-80 rounded-full bg-[#7a4c2d]/18 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <button className="group text-left" onClick={onBack} type="button">
            <BrandMark compact />
            <p className="mt-2 pl-[3.75rem] text-xs tracking-[0.2em] text-[#8c7668] transition-colors group-hover:text-white">
              Volver al inicio
            </p>
          </button>

          <button
            className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-[0.72rem] uppercase tracking-[0.28em] text-[#c7a37d] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#161016]"
            onClick={onBack}
            type="button"
          >
            Landing
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center py-8 lg:py-12">
          <div className="w-full max-w-xl">
            <section className="login-fade-up relative" style={{ animationDelay: "120ms" }}>
              <div className="absolute inset-x-8 top-5 h-24 rounded-full bg-[#d6a46e]/16 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(18,18,22,0.95)_0%,_rgba(14,14,18,0.88)_100%)] p-6 shadow-[0_26px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-8">
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#d6a46e]/12 blur-2xl" />

                <div className="relative">
                  <div>
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.34em] text-[#b68c67]">Portal de acceso</p>
                      <h2 className="mt-3 font-['Georgia'] text-3xl text-white">
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
                      <p className="mt-3 text-sm leading-7 text-[#9d9491]">
                        {isVerificationFlow
                          ? "Este enlace activa tu cuenta y confirma que el correo realmente te pertenece."
                          : isResetFlow
                          ? "El enlace es de un solo uso y expira rapido. Al confirmar, cerraremos tus sesiones activas para proteger la cuenta."
                          : mode === "register"
                          ? "Completa tus datos para crear tu cuenta."
                          : showForgot
                          ? "Te enviaremos un enlace seguro al correo registrado, sin exponer si la cuenta existe o no."
                          : "Ingresa tus credenciales para autenticarte."}
                      </p>
                    </div>
                  </div>

                  {!isResetFlow && !isVerificationFlow ? (
                    <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.05] p-1.5">
                      <button
                        className={`rounded-full px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.26em] transition-all ${
                          mode === "login" ? "bg-[#d6a46e] text-[#161016] shadow-[0_10px_25px_rgba(214,164,110,0.22)]" : "text-[#9f8b7c]"
                        }`}
                        onClick={() => onModeChange("login")}
                        type="button"
                      >
                        Ingresar
                      </button>
                      <button
                        className={`rounded-full px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.26em] transition-all ${
                          mode === "register" ? "bg-[#d6a46e] text-[#161016] shadow-[0_10px_25px_rgba(214,164,110,0.22)]" : "text-[#9f8b7c]"
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
                        className="mt-3 rounded-[1.35rem] bg-[#d6a46e] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#161016] shadow-[0_16px_35px_rgba(214,164,110,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1b483] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Verificando" : "Activar cuenta"}
                      </button>

                      <button
                        className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#d4c5b7] transition-all duration-200 hover:bg-white hover:text-[#161016]"
                        onClick={onVerificationFlowExit}
                        type="button"
                      >
                        Volver al login
                      </button>
                    </form>
                  ) : isResetFlow ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleResetPassword}>
                      <div>
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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
                        className="mt-3 rounded-[1.35rem] bg-[#d6a46e] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#161016] shadow-[0_16px_35px_rgba(214,164,110,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1b483] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Actualizando" : "Guardar nueva contrasena"}
                      </button>

                      <button
                        className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#d4c5b7] transition-all duration-200 hover:bg-white hover:text-[#161016]"
                        onClick={onResetFlowExit}
                        type="button"
                      >
                        Volver a ingresar
                      </button>
                    </form>
                  ) : mode === "register" ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleRegister}>
                      <div>
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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

                      <button
                        className="mt-3 rounded-[1.35rem] bg-[#d6a46e] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#161016] shadow-[0_16px_35px_rgba(214,164,110,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1b483] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Procesando" : "Crear cuenta"}
                      </button>
                    </form>
                  ) : showForgot ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleForgotPassword}>
                      <div>
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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

                      <button
                        className="mt-3 rounded-[1.35rem] bg-[#d6a46e] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#161016] shadow-[0_16px_35px_rgba(214,164,110,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1b483] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Enviando" : "Enviar enlace seguro"}
                      </button>

                      <button
                        className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#d4c5b7] transition-all duration-200 hover:bg-white hover:text-[#161016]"
                        onClick={() => {
                          setShowForgot(false);
                          setShowVerificationRequest(false);
                        }}
                        type="button"
                      >
                        Volver al login
                      </button>
                    </form>
                  ) : showVerificationRequest ? (
                    <form className="mt-8 grid gap-4" onSubmit={handleVerificationRequest}>
                      <div>
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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

                      <button
                        className="mt-3 rounded-[1.35rem] bg-[#d6a46e] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#161016] shadow-[0_16px_35px_rgba(214,164,110,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1b483] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Enviando" : "Reenviar verificacion"}
                      </button>

                      <button
                        className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#d4c5b7] transition-all duration-200 hover:bg-white hover:text-[#161016]"
                        onClick={() => {
                          setShowVerificationRequest(false);
                          setShowForgot(false);
                        }}
                        type="button"
                      >
                        Volver al login
                      </button>
                    </form>
                  ) : (
                    <form className="mt-8 grid gap-4" onSubmit={handleLogin}>
                      <div>
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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
                        <label className="mb-2 block text-[0.7rem] uppercase tracking-[0.24em] text-[#b8a18c]">
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
                        className="mt-3 rounded-[1.35rem] bg-[#d6a46e] px-5 py-4 text-sm uppercase tracking-[0.22em] text-[#161016] shadow-[0_16px_35px_rgba(214,164,110,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e1b483] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={authLoading}
                        type="submit"
                      >
                        {authLoading ? "Entrando" : "Ingresar al portal"}
                      </button>

                      <button
                        className="w-fit text-sm text-[#c9ab8b] transition-colors duration-200 hover:text-white"
                        onClick={() => {
                          setShowForgot(true);
                          setShowVerificationRequest(false);
                        }}
                        type="button"
                      >
                        Olvide mi contrasena
                      </button>

                      <button
                        className="w-fit text-sm text-[#c9ab8b] transition-colors duration-200 hover:text-white"
                        onClick={() => {
                          setShowVerificationRequest(true);
                          setShowForgot(false);
                        }}
                        type="button"
                      >
                        Reenviar enlace de verificacion
                      </button>
                    </form>
                  )}

                  {notice ? (
                    <div className="mt-5 rounded-[1.4rem] border border-[#325740] bg-[#112119] px-4 py-3 text-sm text-[#b8ecc7]">
                      {notice}
                    </div>
                  ) : null}

                  {clientError || error ? (
                    <div className="mt-5 rounded-[1.4rem] border border-[#6f3731] bg-[#2b1717] px-4 py-3 text-sm text-[#f0b4ad]">
                      {clientError || error}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="pb-2 pt-6 text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.42em] text-[#8d7e73]">
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
