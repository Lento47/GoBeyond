import { useState } from "react";
import { bootstrapAdmin } from "../../services/contentApi";
import { AdminWorkspace } from "./AdminWorkspace";

function SectionCard({ title, description, children, accent = "soft" }) {
  return (
    <section
      className={`overflow-hidden border p-6 shadow-[0_20px_40px_rgba(32,24,31,0.05)] ${
        accent === "dark"
          ? "border-[#2f2630] bg-[#20181f] text-white"
          : "border-[#d8cdbf] bg-white/85"
      }`}
    >
      <div className="mb-5">
        <h3 className="font-['Georgia'] text-2xl">{title}</h3>
        <p className={`mt-2 text-sm ${accent === "dark" ? "text-[#d8cdc5]" : "text-[#6d5a51]"}`}>
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function Input(props) {
  return <input className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" {...props} />;
}

function AdminAuthPanel({ onLogin, authLoading, authError }) {
  const [mode, setMode] = useState("login");
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    setupSecret: "",
  });
  const [localMessage, setLocalMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalMessage("");
    setLocalError("");

    try {
      if (mode === "bootstrap") {
        await bootstrapAdmin({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          setupSecret: form.setupSecret,
        });
        setLocalMessage("Administrador inicial creado. Ahora inicia sesion.");
        setMode("login");
        return;
      }

      await onLogin({
        email: form.email,
        password: form.password,
      });
    } catch (error) {
      setLocalError(error.message);
    }
  }

  return (
    <SectionCard
      title="Acceso administrativo"
      description="Zero-trust: cada accion sensible del panel se valida en backend, con autenticacion, roles y auditoria."
      accent="dark"
    >
      <div className="mb-6 flex gap-2">
        <button
          className={`px-4 py-2 text-sm ${mode === "login" ? "bg-[#d6a46e] text-[#20181f]" : "border border-white/25 text-white/80"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Iniciar sesion
        </button>
        <button
          className={`px-4 py-2 text-sm ${mode === "bootstrap" ? "bg-[#d6a46e] text-[#20181f]" : "border border-white/25 text-white/80"}`}
          onClick={() => setMode("bootstrap")}
          type="button"
        >
          Bootstrap admin
        </button>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="admin@gobeyond.com"
        />
        <Input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Contrasena segura"
        />

        {mode === "bootstrap" ? (
          <>
            <Input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              placeholder="Nombre completo"
            />
            <Input
              value={form.setupSecret}
              onChange={(event) => setForm({ ...form, setupSecret: event.target.value })}
              placeholder="Bootstrap secret"
            />
          </>
        ) : null}

        <button className="w-fit bg-[#d6a46e] px-5 py-3 text-sm font-medium text-[#20181f]" disabled={authLoading} type="submit">
          {authLoading ? "Procesando..." : mode === "bootstrap" ? "Crear administrador" : "Entrar"}
        </button>
      </form>

      {localMessage ? <p className="mt-4 text-sm text-[#f4d9b2]">{localMessage}</p> : null}
      {localError ? <p className="mt-4 text-sm text-[#ffb8a6]">{localError}</p> : null}
      {authError ? <p className="mt-4 text-sm text-[#ffb8a6]">{authError}</p> : null}
    </SectionCard>
  );
}

export function AdminExperience(props) {
  const { currentUser, authError, authLoading, loading, content, onLogin } = props;

  if (!currentUser) {
    return <AdminAuthPanel authError={authError} authLoading={authLoading} onLogin={onLogin} />;
  }

  if (loading || !content) {
    return (
      <SectionCard title="Panel administrativo" description="Cargando contenido protegido desde el backend.">
        <p className="text-sm text-[#6d5a51]">Un momento mientras validamos la sesion y cargamos el contenido.</p>
      </SectionCard>
    );
  }

  return <AdminWorkspace {...props} />;
}
