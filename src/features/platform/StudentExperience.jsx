import { useState } from "react";
import { loginUser, registerStudent } from "../../services/contentApi";

function AuthCard({ mode, setMode, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form, mode);
  }

  return (
    <div className="mx-auto max-w-xl border border-[#d8cdbf] bg-white p-8 shadow-[0_18px_40px_rgba(122,73,58,0.08)]">
      <div className="mb-6 flex gap-2">
        <button
          className={`px-4 py-2 text-sm ${mode === "login" ? "bg-[#20181f] text-white" : "border border-[#d8cdbf]"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Iniciar sesion
        </button>
        <button
          className={`px-4 py-2 text-sm ${mode === "register" ? "bg-[#20181f] text-white" : "border border-[#d8cdbf]"}`}
          onClick={() => setMode("register")}
          type="button"
        >
          Crear cuenta
        </button>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <input
            className="border border-[#d8cdbf] px-4 py-3"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            placeholder="Nombre completo"
          />
        ) : null}

        <input
          className="border border-[#d8cdbf] px-4 py-3"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="Correo electronico"
        />
        <input
          className="border border-[#d8cdbf] px-4 py-3"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Contrasena"
        />

        <button className="w-fit bg-[#d6a46e] px-5 py-3 text-sm font-medium text-[#20181f]" disabled={loading} type="submit">
          {loading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Entrar al portal"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-[#8a3d31]">{error}</p> : null}
    </div>
  );
}

function DashboardCard({ eyebrow, title, body }) {
  return (
    <div className="border border-[#d8cdbf] bg-white p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{eyebrow}</p>
      <h3 className="mt-3 font-['Georgia'] text-2xl">{title}</h3>
      <p className="mt-3 text-[#5c4d46]">{body}</p>
    </div>
  );
}

export function StudentExperience({
  token,
  setToken,
  studentUser,
  setStudentUser,
  dashboard,
  dashboardLoading,
  dashboardError,
}) {
  const [mode, setMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function handleAuthSubmit(form, currentMode) {
    setAuthError("");
    setAuthLoading(true);

    try {
      const response =
        currentMode === "register"
          ? await registerStudent(form)
          : await loginUser({
              email: form.email,
              password: form.password,
            });

      window.localStorage.setItem("gobeyond_student_token", response.token);
      setToken(response.token);
      setStudentUser(response.user);
    } catch (requestError) {
      setAuthError(requestError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("gobeyond_student_token");
    setToken("");
    setStudentUser(null);
  }

  if (!token || !studentUser) {
    return (
      <div className="min-h-screen bg-[#f3ede3] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">Portal estudiantil</p>
            <h1 className="mt-4 font-['Georgia'] text-5xl leading-tight text-[#20181f]">
              Accede a tu espacio protegido para continuar tu ruta de aprendizaje.
            </h1>
            <p className="mt-4 text-lg text-[#5c4d46]">
              Este portal permite a estudiantes registrados revisar programas, contenidos y avances en un entorno
              privado.
            </p>
          </div>

          <AuthCard mode={mode} setMode={setMode} onSubmit={handleAuthSubmit} loading={authLoading} error={authError} />
        </div>
      </div>
    );
  }

  if (dashboardLoading || !dashboard) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f3ede3] text-[#20181f]">Cargando portal estudiantil...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f3ede3]">
      <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">Portal estudiantil</p>
            <h1 className="font-['Georgia'] text-2xl text-[#20181f]">{dashboard.dashboard.welcomeTitle}</h1>
          </div>

          <button className="border border-[#d8cdbf] px-4 py-2 text-sm" onClick={handleLogout} type="button">
            Cerrar sesion
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="max-w-3xl text-lg text-[#5c4d46]">{dashboard.dashboard.summary}</p>
        {dashboardError ? <p className="mt-4 text-sm text-[#8a3d31]">{dashboardError}</p> : null}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <DashboardCard eyebrow="Acceso" title={`${dashboard.dashboard.enrollments.length} activos`} body="Tus matriculas definen el contenido privado y el tiempo de acceso que tienes habilitado." />
          <DashboardCard eyebrow="Programas" title={`${dashboard.dashboard.courses.length} asignados`} body="Aqui aparecen solo los cursos que GoBeyond ha activado para tu cuenta." />
          <DashboardCard eyebrow="Descubrir" title={`${dashboard.dashboard.availableCourses.length} por explorar`} body="Si ves un programa interesante pero no esta habilitado, puedes solicitarlo al equipo administrativo." />
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-['Georgia'] text-3xl text-[#20181f]">Mis cursos activos</h2>
              <p className="mt-2 text-[#6d5a51]">Cada tarjeta refleja una matricula real con fecha de expiracion.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {dashboard.dashboard.courses.length ? (
              dashboard.dashboard.courses.map((course) => (
                <article key={course.enrollmentId} className="border border-[#d8cdbf] bg-white p-7">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{course.format} · {course.duration}</p>
                  <h3 className="mt-3 font-['Georgia'] text-3xl">{course.title}</h3>
                  <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#8b6d55]">{course.audience}</p>
                  <p className="mt-4 text-[#5c4d46]">{course.description}</p>
                  <p className="mt-4 text-sm text-[#5c4d46]">
                    <strong className="text-[#20181f]">Vence:</strong> {new Date(course.accessExpiresAt).toLocaleDateString()}
                  </p>
                  <p className="mt-4 border-t border-[#eadfce] pt-4 text-sm text-[#5c4d46]">
                    <strong className="text-[#20181f]">Resultados esperados:</strong> {course.outcomes}
                  </p>
                </article>
              ))
            ) : (
              <div className="border border-dashed border-[#cbb8a4] bg-[#fbf8f2] p-7 text-[#5c4d46]">
                Aun no tienes cursos asignados. Cuando el equipo admin te matricule, los veras aqui.
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="border border-[#d8cdbf] bg-white p-7">
            <h2 className="font-['Georgia'] text-3xl text-[#20181f]">Ruta de desarrollo</h2>
            <div className="mt-5 grid gap-4">
              {dashboard.dashboard.learningPath.map((item) => (
                <div key={item.id} className="border border-[#eadfce] bg-[#fbf8f2] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{item.type}</p>
                  <h3 className="mt-2 text-xl text-[#20181f]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#5c4d46]">{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#d8cdbf] bg-white p-7">
            <h2 className="font-['Georgia'] text-3xl text-[#20181f]">Tambien puedes explorar</h2>
            <div className="mt-5 grid gap-4">
              {dashboard.dashboard.availableCourses.length ? (
                dashboard.dashboard.availableCourses.map((course) => (
                  <div key={course.id} className="border border-[#eadfce] bg-[#fbf8f2] p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{course.format} · {course.duration}</p>
                    <h3 className="mt-2 text-xl text-[#20181f]">{course.title}</h3>
                    <p className="mt-2 text-sm text-[#5c4d46]">{course.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5c4d46]">Por ahora no hay mas cursos por descubrir fuera de tus matriculas activas.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
