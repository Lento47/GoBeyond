import { useEffect, useMemo, useRef, useState } from "react";

const ROLE_META = {
  teacher: { id: "teacher", name: "Docente", description: "Gestion de catedras", color: "bg-[#f38020]" },
  admin: { id: "admin", name: "Administrador", description: "Control institucional", color: "bg-[#0051ad]" },
  student: { id: "student", name: "Estudiante", description: "Ruta academica", color: "bg-[#2563eb]" },
};

function ShellIcon({ children }) {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500">{children}</span>;
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M6.5 10.5V20h11v-9.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 5.5v16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M15.5 18a3.5 3.5 0 0 1 7 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M1.5 18a5.5 5.5 0 0 1 11 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M19 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 3 5 6v5c0 4.5 2.8 8.6 7 10 4.2-1.4 7-5.5 7-10V6l-7-3Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m9.5 12 1.7 1.7L15 10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function UserGroupIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M4 19a4 4 0 0 1 8 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 19a3.5 3.5 0 0 1 7 0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M17.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect height="6" rx="1.5" width="18" x="3" y="4" strokeWidth="1.8" />
      <rect height="6" rx="1.5" width="18" x="3" y="14" strokeWidth="1.8" />
      <path d="M7 7h.01M7 17h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect height="14" rx="2" width="18" x="3" y="5" strokeWidth="1.8" />
      <path d="M3 9.5h18M7 15h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect height="10" rx="3" width="14" x="5" y="8" strokeWidth="1.8" />
      <path d="M12 4v4M9 13h.01M15 13h.01M8 18v2M16 18v2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M7.5 18a4.5 4.5 0 1 1 .8-8.9 5.5 5.5 0 0 1 10.6 1.9A3.5 3.5 0 1 1 18 18H7.5Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SidebarItem({ label, icon, active = false, muted = false, onClick }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition ${
        active
          ? "bg-gray-900 text-white"
          : muted
            ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className={active ? "text-white" : "text-[#9ca3af]"}>{icon}</span>
      <span className="min-w-0 truncate text-sm font-semibold">{label}</span>
    </button>
  );
}

function TeacherMetric({ label, value, body }) {
  return (
    <article className="rounded-sm border border-[#e2e0db] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <ShellIcon>
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </ShellIcon>
      </div>
      <p className="mt-5 text-4xl font-light tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 font-['Georgia'] text-sm italic text-slate-600">{body}</p>
    </article>
  );
}

function TeacherPanel({ currentRole }) {
  const isTeacher = currentRole === "teacher";

  return (
    <div className="grid gap-6">
      <section className="rounded-sm border border-[#e2e0db] bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              {isTeacher ? "Dashboard Docente" : "Control Administrativo"}
            </p>
            <h1 className="mt-4 font-['Georgia'] text-4xl italic tracking-tight text-slate-950 sm:text-5xl">
              {isTeacher ? "Vision General Docente" : "Consola de Administracion"}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Este contexto concentra indicadores, accesos y herramientas de trabajo para el frente{" "}
              {isTeacher ? "academico" : "institucional"} con una lectura operativa mas clara y modular.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            <span className={`h-2.5 w-2.5 rounded-full ${isTeacher ? "bg-[#f38020]" : "bg-[#0051ad]"}`} />
            {isTeacher ? "Sesion firme docente" : "Sesion firme administrativa"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {isTeacher ? (
          <>
            <TeacherMetric body="Catedras con actividad reciente." label="Catedras" value="06" />
            <TeacherMetric body="Alumnos bajo seguimiento activo." label="Alumnos" value="128" />
            <TeacherMetric body="Entregables pendientes de revision." label="Pendientes" value="19" />
          </>
        ) : (
          <>
            <TeacherMetric body="Paneles institucionales activos." label="Control" value="04" />
            <TeacherMetric body="Usuarios bajo supervision." label="Usuarios" value="312" />
            <TeacherMetric body="Incidencias para auditoria." label="Auditoria" value="07" />
          </>
        )}
      </section>

      <section className="rounded-sm border border-[#e2e0db] bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Resumen operativo</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-sm border border-[#ece8e1] bg-[#faf8f4] p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              {isTeacher ? "Vista de docencia" : "Vista institucional"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {isTeacher
                ? "Este contexto esta orientado a catedras, seguimiento de grupos, analiticas de alumnos y asistencia operativa del docente."
                : "Este contexto simula un panel de control institucional con foco en usuarios, red, cumplimiento y operaciones de alto nivel."}
            </p>
          </div>
          <div className="rounded-sm border border-[#ece8e1] bg-[#faf8f4] p-5">
            <h2 className="text-lg font-semibold text-slate-950">Comportamiento del switcher</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              El selector de contexto cambia instantaneamente la navegacion lateral y el contenido principal sin recargar
              la pagina. La logica de autenticacion y sesion existente permanece intacta.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TeacherExperience({ currentUser, onLogout, onSwitchRole }) {
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const contextRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        setIsContextOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveTab("overview");
  }, [currentUser?.role]);

  const availableRoles = useMemo(() => {
    const assignedRoles = Array.isArray(currentUser?.roles) && currentUser.roles.length ? currentUser.roles : [currentUser?.role ?? "teacher"];
    return assignedRoles
      .map((role) => ROLE_META[role])
      .filter(Boolean);
  }, [currentUser?.role, currentUser?.roles]);

  const currentRole = currentUser?.role ?? "teacher";
  const currentRoleMeta = useMemo(
    () => availableRoles.find((role) => role.id === currentRole) ?? ROLE_META[currentRole] ?? availableRoles[0] ?? ROLE_META.teacher,
    [availableRoles, currentRole]
  );

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#1d1d1b]">
      <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-r border-[#e2e0db] bg-white">
          <div className="flex h-full flex-col px-4 py-5">
            <div className="border-b border-slate-100 px-4 pb-5">
              <div className="flex items-center gap-3">
                <img alt="Logo de GoBeyond" className="h-10 w-auto object-contain" src="/logo-icon.png" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">GoBeyond</p>
                  <p className="truncate text-sm font-semibold text-slate-900">Teacher workspace</p>
                </div>
              </div>
            </div>

            <div className="relative mb-6 px-4 pt-6" ref={contextRef}>
              <button
                className="w-full rounded-md border border-slate-200 bg-white p-2 text-left shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#f38020]"
                onClick={() => setIsContextOpen((current) => !current)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`h-6 w-6 shrink-0 rounded-sm ${currentRoleMeta.color} shadow-inner`} />
                    <div className="overflow-hidden leading-none">
                      <p className="text-[11px] font-bold uppercase tracking-tighter text-slate-400">Contexto Operativo</p>
                      <p className="truncate text-sm font-bold text-slate-900">{currentRoleMeta.name}</p>
                    </div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isContextOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </button>

              {isContextOpen ? (
                <div className="absolute left-4 right-4 z-[100] mt-2 overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50 p-2">
                    <p className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Cambiar de rol</p>
                  </div>
                  {availableRoles.map((role) => (
                    <button
                      className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 ${
                        currentRole === role.id ? "bg-orange-50/50" : ""
                      }`}
                      key={role.id}
                      onClick={async () => {
                        if (!onSwitchRole) {
                          setIsContextOpen(false);
                          return;
                        }

                        setIsContextOpen(false);
                        try {
                          await onSwitchRole(role.id);
                        } catch {
                          // El estado global ya gestiona el mensaje de error.
                        }
                      }}
                      type="button"
                    >
                      <div className={`h-5 w-5 rounded-sm ${role.color} shadow-sm`} />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{role.name}</p>
                        <p className="text-[10px] text-slate-500">{role.description}</p>
                      </div>
                      {currentRole === role.id ? (
                        <svg className="ml-auto h-4 w-4 text-[#f38020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                        </svg>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4">
              {currentRole === "teacher" ? (
                <>
                  <SidebarItem active={activeTab === "overview"} icon={<HomeIcon />} label="Dashboard Global" onClick={() => setActiveTab("overview")} />
                  <SidebarItem active={activeTab === "courses"} icon={<BookIcon />} label="Mis Catedras" onClick={() => setActiveTab("courses")} />
                  <SidebarItem active={activeTab === "students"} icon={<UsersIcon />} label="Analiticas de Alumnos" onClick={() => setActiveTab("students")} />
                </>
              ) : (
                <>
                  <SidebarItem active={activeTab === "overview"} icon={<ShieldCheckIcon />} label="Control Institucional" onClick={() => setActiveTab("overview")} />
                  <SidebarItem active={activeTab === "users"} icon={<UserGroupIcon />} label="Gestion de Usuarios" onClick={() => setActiveTab("users")} />
                  <SidebarItem active={activeTab === "network"} icon={<ServerIcon />} label="Configuracion de Red" onClick={() => setActiveTab("network")} />
                  <SidebarItem active={activeTab === "payments"} icon={<CreditCardIcon />} label="Auditoria de Pagos" onClick={() => setActiveTab("payments")} />
                </>
              )}

              <div className="mt-6 border-t border-slate-100 px-0 py-6">
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Servicios</p>
                <div className="space-y-1">
                  <SidebarItem icon={<BotIcon />} label="Neural Assistant" muted />
                  <SidebarItem icon={<CloudIcon />} label="Cloud Storage" muted />
                </div>
              </div>
            </nav>

            <div className="border-t border-slate-100 px-4 pt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Sesion Firme</p>
              <p className="mt-3 truncate text-sm font-black uppercase text-slate-900">{currentUser?.fullName || "Docente"}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{currentUser?.email}</p>
              <button
                className="mt-4 w-full rounded-md bg-[#1d1d1b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
                onClick={onLogout}
                type="button"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[#f7f3ed]">
          <header className="border-b border-[#e2e0db] bg-white">
            <div className="flex h-14 items-center justify-between px-5 sm:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  {currentRole === "teacher" ? "Dashboard Docente" : "Control Administrativo"}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {currentRole === "teacher" ? "Operacion academica" : "Operacion institucional"}
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Sesion Firme</span>
                <span className="truncate text-sm font-black uppercase text-slate-900">{currentUser?.fullName || "Docente"}</span>
              </div>
            </div>
          </header>

          <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
            <TeacherPanel currentRole={currentRole} />
          </div>
        </main>
      </div>
    </div>
  );
}
