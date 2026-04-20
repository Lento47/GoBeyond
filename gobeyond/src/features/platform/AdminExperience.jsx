import { useState } from "react";
import { bootstrapAdmin } from "../../services/contentApi";

function SectionCard({ title, description, children }) {
  return (
    <section className="border border-[#d8cdbf] bg-white/80 p-6">
      <div className="mb-5">
        <h3 className="font-['Georgia'] text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-[#6d5a51]">{description}</p>
      </div>
      {children}
    </section>
  );
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
      description="Zero-trust: el panel admin ya no esta abierto por la UI. Debes autenticarte con una cuenta de administrador."
    >
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 text-sm ${mode === "login" ? "bg-[#1e1820] text-white" : "border border-[#d8cdbf]"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Iniciar sesion
        </button>
        <button
          className={`px-4 py-2 text-sm ${mode === "bootstrap" ? "bg-[#1e1820] text-white" : "border border-[#d8cdbf]"}`}
          onClick={() => setMode("bootstrap")}
          type="button"
        >
          Bootstrap admin
        </button>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <input
          className="border border-[#d8cdbf] px-4 py-3"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="admin@gobeyond.com"
        />
        <input
          className="border border-[#d8cdbf] px-4 py-3"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Contrasena segura"
        />

        {mode === "bootstrap" ? (
          <>
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              placeholder="Nombre completo"
            />
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={form.setupSecret}
              onChange={(event) => setForm({ ...form, setupSecret: event.target.value })}
              placeholder="Bootstrap secret"
            />
          </>
        ) : null}

        <button className="w-fit bg-[#1e1820] px-5 py-3 text-sm text-white" disabled={authLoading} type="submit">
          {authLoading ? "Procesando..." : mode === "bootstrap" ? "Crear administrador" : "Entrar"}
        </button>
      </form>

      {localMessage ? <p className="mt-4 text-sm text-[#2f6b3b]">{localMessage}</p> : null}
      {localError ? <p className="mt-4 text-sm text-[#8a3d31]">{localError}</p> : null}
      {authError ? <p className="mt-4 text-sm text-[#8a3d31]">{authError}</p> : null}
    </SectionCard>
  );
}

export function AdminExperience({
  authError,
  authLoading,
  content,
  createCollectionItem,
  currentUser,
  deleteCollectionItem,
  loading,
  onLogin,
  onLogout,
  updateSection,
}) {
  if (!currentUser) {
    return <AdminAuthPanel authError={authError} authLoading={authLoading} onLogin={onLogin} />;
  }

  if (loading || !content) {
    return (
      <SectionCard
        title="Panel administrativo"
        description="Cargando contenido protegido desde el backend."
      >
        <p className="text-sm text-[#6d5a51]">Un momento mientras validamos la sesion y cargamos el contenido.</p>
      </SectionCard>
    );
  }

  const [brandForm, setBrandForm] = useState(content.brand);
  const [heroForm, setHeroForm] = useState(content.hero);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    date: "",
    format: "Sincronica",
  });
  const [pathForm, setPathForm] = useState({
    title: "",
    type: "Asincronico",
    status: "",
  });

  async function saveBrand(event) {
    event.preventDefault();
    await updateSection("brand", brandForm);
  }

  async function saveHero(event) {
    event.preventDefault();
    await updateSection("hero", heroForm);
  }

  async function addSession(event) {
    event.preventDefault();
    if (!sessionForm.title || !sessionForm.date) {
      return;
    }

    await createCollectionItem("liveSessions", sessionForm);
    setSessionForm({ title: "", date: "", format: "Sincronica" });
  }

  async function addLearningItem(event) {
    event.preventDefault();
    if (!pathForm.title || !pathForm.status) {
      return;
    }

    await createCollectionItem("learningPath", pathForm);
    setPathForm({ title: "", type: "Asincronico", status: "" });
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Sesion administrativa"
        description="Todo cambio queda restringido al backend y auditado."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[#5c4d46]">
            <p>
              <strong>{currentUser.fullName}</strong> · {currentUser.email}
            </p>
            <p>Rol: {currentUser.role}</p>
          </div>
          <button className="w-fit border border-[#d8cdbf] px-4 py-2 text-sm" onClick={onLogout} type="button">
            Cerrar sesion
          </button>
        </div>
        {authError ? <p className="mt-3 text-sm text-[#8a3d31]">{authError}</p> : null}
      </SectionCard>

      <SectionCard
        title="Panel administrativo"
        description="Esta vista representa la direccion correcta del proyecto: el contenido se administra desde una Web UI y luego se publica en la experiencia del estudiante."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-[#d8cdbf] bg-[#fbf8f2] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Backend-ready</p>
            <p className="mt-2 text-sm text-[#5c4d46]">La UI ya consume una capa API separada del render.</p>
          </div>
          <div className="border border-[#d8cdbf] bg-[#fbf8f2] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Contenido editable</p>
            <p className="mt-2 text-sm text-[#5c4d46]">Marca, sesiones y modulos dejan de vivir hardcoded en la vista.</p>
          </div>
          <div className="border border-[#d8cdbf] bg-[#fbf8f2] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Siguiente paso</p>
            <p className="mt-2 text-sm text-[#5c4d46]">Reemplazar persistencia en archivo por PostgreSQL autogestionado.</p>
          </div>
        </div>
      </SectionCard>

      {loading ? <p className="text-sm text-[#6d5a51]">Cargando contenido administrativo...</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Marca y mensaje" description="Edita el encabezado principal sin tocar codigo.">
          <form className="grid gap-4" onSubmit={saveBrand}>
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={brandForm.name}
              onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })}
              placeholder="Nombre del proyecto"
            />
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={brandForm.tagline}
              onChange={(event) => setBrandForm({ ...brandForm, tagline: event.target.value })}
              placeholder="Tagline"
            />
            <textarea
              className="min-h-[120px] border border-[#d8cdbf] px-4 py-3"
              value={brandForm.description}
              onChange={(event) => setBrandForm({ ...brandForm, description: event.target.value })}
              placeholder="Descripcion"
            />
            <button className="w-fit bg-[#1e1820] px-5 py-3 text-sm text-white" type="submit">
              Guardar marca
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Hero principal" description="Controla el mensaje comercial y educativo del home.">
          <form className="grid gap-4" onSubmit={saveHero}>
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={heroForm.eyebrow}
              onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })}
              placeholder="Eyebrow"
            />
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={heroForm.title}
              onChange={(event) => setHeroForm({ ...heroForm, title: event.target.value })}
              placeholder="Titulo"
            />
            <textarea
              className="min-h-[120px] border border-[#d8cdbf] px-4 py-3"
              value={heroForm.description}
              onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })}
              placeholder="Descripcion"
            />
            <button className="w-fit bg-[#1e1820] px-5 py-3 text-sm text-white" type="submit">
              Guardar hero
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Sesiones en vivo" description="Agrega nuevas clases sincronicas desde la interfaz.">
          <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={addSession}>
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={sessionForm.title}
              onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })}
              placeholder="Titulo de la sesion"
            />
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={sessionForm.date}
              onChange={(event) => setSessionForm({ ...sessionForm, date: event.target.value })}
              placeholder="Fecha o horario"
            />
            <select
              className="border border-[#d8cdbf] px-4 py-3"
              value={sessionForm.format}
              onChange={(event) => setSessionForm({ ...sessionForm, format: event.target.value })}
            >
              <option value="Sincronica">Sincronica</option>
              <option value="Asincronica">Asincronica</option>
            </select>
            <button className="w-fit bg-[#1e1820] px-5 py-3 text-sm text-white" type="submit">
              Crear sesion
            </button>
          </form>

          <div className="mt-5 grid gap-3">
            {content.liveSessions.map((item) => (
              <div key={item.id} className="flex items-center justify-between border border-[#eadfce] px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[#6d5a51]">{item.date}</p>
                </div>
                <button
                  className="text-sm text-[#8a3d31]"
                  onClick={() => deleteCollectionItem("liveSessions", item.id)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Ruta de aprendizaje" description="Crea modulos, hitos o recursos sin tocar el componente principal.">
          <form className="grid gap-4 border-b border-[#eadfce] pb-5" onSubmit={addLearningItem}>
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={pathForm.title}
              onChange={(event) => setPathForm({ ...pathForm, title: event.target.value })}
              placeholder="Titulo del modulo"
            />
            <select
              className="border border-[#d8cdbf] px-4 py-3"
              value={pathForm.type}
              onChange={(event) => setPathForm({ ...pathForm, type: event.target.value })}
            >
              <option value="Asincronico">Asincronico</option>
              <option value="Sincronico">Sincronico</option>
            </select>
            <input
              className="border border-[#d8cdbf] px-4 py-3"
              value={pathForm.status}
              onChange={(event) => setPathForm({ ...pathForm, status: event.target.value })}
              placeholder="Estado"
            />
            <button className="w-fit bg-[#1e1820] px-5 py-3 text-sm text-white" type="submit">
              Crear modulo
            </button>
          </form>

          <div className="mt-5 grid gap-3">
            {content.learningPath.map((item) => (
              <div key={item.id} className="flex items-center justify-between border border-[#eadfce] px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-[#6d5a51]">
                    {item.type} · {item.status}
                  </p>
                </div>
                <button
                  className="text-sm text-[#8a3d31]"
                  onClick={() => deleteCollectionItem("learningPath", item.id)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
