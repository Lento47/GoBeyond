import { useEffect, useRef, useState } from "react";
import {
  useAdminContent,
  useAdminEnrollments,
  useAdminSocialSources,
  useAdminUsers,
  usePublicContent,
  useSocialNews,
  useStudentCommunity,
  useStudentDashboard,
  useTeacherCourses,
  useTeacherDashboard,
  useTeacherEnrollments,
  useTeacherSops,
  useTeacherSupport,
} from "../../hooks/useGoBeyondContent";
import {
  createAdminSop,
  deleteAdminSop,
  fetchCurrentUser,
  loginAdmin,
  logoutAdmin,
  requestEmailVerification,
  registerStudent,
  requestPasswordReset,
  resetPassword,
  switchCurrentRole,
  updateAdminSop,
  updateAdminSopChangeRequest,
  verifyEmail,
} from "../../services/contentApi";
import { AdminExperience } from "./AdminExperience";
import { LegalPage } from "./LegalPages";
import { LoginExperience } from "./LoginExperience";
import { NewsArchive } from "./NewsArchive";
import { StudentCommunityExperience } from "./StudentCommunityExperience";
import { PublicExperience } from "./PublicExperience";
import { StudentExperience } from "./StudentExperience";
import { TeacherExperience } from "./TeacherWorkspace";
import { adminNavigationGroups, adminViewLabels } from "./AdminWorkspace";
import { workspaceChrome } from "./workspaceTheme";

const authSyncChannelName = "gobeyond-auth";
const authSyncStorageKey = "gobeyond_auth_sync_event";

function getAuthRouteTokens(pathname, search) {
  const token = new URLSearchParams(search).get("token") ?? "";

  return {
    resetToken: pathname === "/reset-password" ? token : "",
    verificationToken: pathname === "/verify-account" ? token : "",
  };
}

function getViewModeFromPath(pathname) {
  if (pathname === "/login") {
    return "login";
  }

  if (pathname === "/reset-password") {
    return "reset-password";
  }

  if (pathname === "/verify-account") {
    return "verify-account";
  }

  if (pathname === "/admin") {
    return "admin";
  }

  if (pathname === "/portal") {
    return "portal";
  }

  if (pathname === "/teacher") {
    return "teacher";
  }

  if (pathname === "/comunidad") {
    return "comunidad";
  }

  if (pathname === "/noticias") {
    return "noticias";
  }

  if (pathname === "/terminos") {
    return "terminos";
  }

  if (pathname === "/privacidad") {
    return "privacidad";
  }

  if (pathname === "/cookies") {
    return "cookies";
  }

  if (pathname === "/aviso-legal") {
    return "aviso-legal";
  }

  return "landing";
}

function getDefaultWorkspaceSection(view) {
  if (view === "teacher") {
    return "teacher-overview";
  }

  if (view === "portal") {
    return "portal-overview";
  }

  if (view === "comunidad") {
    return "community-overview";
  }

  return "";
}

function getWorkspaceSectionFromLocation(pathname, hash) {
  const normalizedHash = String(hash ?? "").replace(/^#/, "");
  if (normalizedHash) {
    return normalizedHash;
  }

  return getDefaultWorkspaceSection(getViewModeFromPath(pathname));
}

function WorkspaceHomeButton({ subtitle, contextInitial }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 shrink-0 items-center">
        <img alt="Logo de GoBeyond" className="h-10 w-auto object-contain" src="/logo-icon.png" />
        <span className="sr-only">{contextInitial}</span>
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#6b7a90]">GoBeyond Workspace</p>
        <p className="truncate text-sm font-semibold leading-tight text-[#172033]">{subtitle}</p>
      </div>
    </div>
  );
}

function ShellMenuIcon({ open }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      ) : (
        <>
          <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M4 12h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M4 17h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </>
      )}
    </svg>
  );
}

function WorkspaceSidebarButton({ item, onSelect }) {
  return (
    <button
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        item.active
          ? "border-[#c6d4ec] bg-[#eef4ff] text-[#172033] shadow-[0_1px_2px_rgba(29,78,216,0.06)]"
          : "border-transparent bg-transparent text-[#536277] hover:border-[#d7e0ea] hover:bg-white"
      }`}
      onClick={() => onSelect(item)}
      type="button"
    >
      <p className="text-sm font-semibold leading-none">{item.label}</p>
      {item.caption ? <p className="mt-1 text-xs leading-relaxed text-inherit/80">{item.caption}</p> : null}
    </button>
  );
}

function WorkspaceStatusChip({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e0ea] bg-white px-3 py-2 text-[11px] font-semibold text-[#435066]">
      <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
      {children}
    </div>
  );
}

function WorkspaceContextGlyph({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-col items-center justify-center font-mono text-[11px] font-bold leading-[0.72] tracking-[-0.16em] ${className}`}
    >
      <span>{"<"}</span>
      <span>{">"}</span>
    </span>
  );
}

function WorkspaceContextSwitcher({ currentUser, onRoleSwitch, compact = false, menuPlacement = "bottom" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [currentUser?.role]);

  if (!currentUser || roles.length <= 1 || !onRoleSwitch) {
    return null;
  }

  const activeRoleMeta = workspaceRoleMeta[currentUser.role] ?? workspaceRoleMeta.student;
  const controlId = `workspace-context-options-${compact ? "compact" : "full"}`;

  return (
    <div className={`grid gap-2 ${compact ? "" : "rounded-[22px] border border-[#d7e0ea] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`} ref={containerRef}>
      {compact ? (
        <button
          aria-controls={controlId}
          aria-expanded={open}
          className={`grid w-full grid-cols-[minmax(0,1fr)_4.25rem_1.75rem] items-center gap-2 rounded-[18px] border px-3 py-2.5 text-left transition ${
            open
              ? "border-[#c8d7f2] bg-[linear-gradient(180deg,#f6f9ff_0%,#edf4ff_100%)] shadow-[0_10px_22px_rgba(29,78,216,0.1)]"
              : "border-[#d7e2f1] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:border-[#bfd0eb] hover:bg-[#fbfdff]"
          }`}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.95rem] border border-[#d9e3ef] bg-[#f8fbff]">
              <span className={`h-3.5 w-3.5 rounded-full ${activeRoleMeta.accent}`} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.96rem] font-semibold leading-none text-[#172033]">{activeRoleMeta.label}</span>
            </span>
          </span>
          <span className="flex h-6 w-[4.25rem] shrink-0 items-center justify-center rounded-full border border-[#d9e3ef] bg-white px-2 text-center text-[9px] font-black uppercase leading-none tracking-[0.16em] text-[#5f6f86]">
            {currentUser.status}
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d9e3ef] bg-white text-[#5f6f86]">
            <WorkspaceContextGlyph className="text-[10px]" />
          </span>
        </button>
      ) : (
        <button
          aria-controls={controlId}
          aria-expanded={open}
          className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
            open
              ? "border-[#c8d7f2] bg-[linear-gradient(180deg,#f6f9ff_0%,#edf4ff_100%)] shadow-[0_12px_26px_rgba(29,78,216,0.1)]"
              : "border-[#d7e2f1] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:border-[#bfd0eb]"
          }`}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-[#d9e3ef] bg-[#f8fbff]">
              <span className={`h-4 w-4 rounded-full ${activeRoleMeta.accent}`} />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Cambiar contexto</span>
              <span className="mt-1 block text-[0.98rem] font-semibold leading-none text-[#172033]">{activeRoleMeta.label}</span>
            </span>
          </span>
          <span className="shrink-0 rounded-full border border-[#d9e3ef] bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#5f6f86]">
            {currentUser.status}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9e3ef] bg-white text-[#5f6f86]">
            <WorkspaceContextGlyph className="text-[10px]" />
          </span>
        </button>
      )}

      {open ? (
        <div
          className={`grid gap-2 rounded-[20px] border border-[#d7e2f1] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-2.5 shadow-[0_12px_26px_rgba(15,23,42,0.06)] ${compact ? "" : "mt-1"}`}
          id={controlId}
          role="listbox"
        >
          {roles.map((role) => {
            const roleMeta = workspaceRoleMeta[role] ?? workspaceRoleMeta.student;
            const isActive = role === currentUser.role;

            return (
              <button
                aria-selected={isActive}
                className={`grid min-h-[4.2rem] w-full grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] items-center gap-2.5 rounded-[18px] border px-3 py-2.5 text-left transition ${
                  isActive
                    ? "border-[#c8d7f2] bg-[linear-gradient(180deg,#f3f7ff_0%,#eaf1ff_100%)] text-[#163067] shadow-[0_8px_18px_rgba(29,78,216,0.08)]"
                    : "border-[#dbe4ef] bg-white text-[#172033] hover:border-[#c8d6ea] hover:bg-[#f8fbff]"
                }`}
                key={role}
                onClick={async () => {
                  if (isActive) {
                    setOpen(false);
                    return;
                  }

                  setOpen(false);
                  try {
                    await onRoleSwitch(role);
                  } catch {
                    // El shell principal ya expone el error de autenticacion.
                  }
                }}
                type="button"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[1rem] border ${
                    isActive ? "border-[#c8d7f2] bg-white shadow-[0_4px_12px_rgba(29,78,216,0.08)]" : "border-[#d7e0ea] bg-[#f6f9fd]"
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full ${roleMeta.accent}`} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[0.98rem] font-semibold leading-[1.08] ${isActive ? "text-[#163067]" : "text-[#172033]"}`}>
                    {roleMeta.label}
                  </span>
                  <span className={`mt-0.5 block text-[0.82rem] leading-[1.15] ${isActive ? "text-[#45608d]" : "text-[#617085]"}`}>
                    {roleMeta.description}
                  </span>
                </span>
                <span className="flex h-6 w-6 items-center justify-center justify-self-end">
                  {isActive ? <span className={`h-2.5 w-2.5 rounded-full ${roleMeta.accent}`} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function groupWorkspaceNavigationItems(items) {
  const groups = [];
  const groupMap = new Map();

  for (const item of items) {
    const label = item.group ?? "";

    if (!groupMap.has(label)) {
      const group = { label, items: [] };
      groupMap.set(label, group);
      groups.push(group);
    }

    groupMap.get(label).items.push(item);
  }

  return groups;
}

const workspaceRoleLabels = {
  admin: "Administrador",
  teacher: "Docente",
  student: "Estudiante",
};

const workspaceRoleMeta = {
  admin: {
    label: "Administrador",
    description: "Control institucional",
    accent: "bg-[#1d4ed8]",
  },
  teacher: {
    label: "Docente",
    description: "Operación académica",
    accent: "bg-[#f38020]",
  },
  student: {
    label: "Estudiante",
    description: "Ruta académica",
    accent: "bg-[#2563eb]",
  },
};

function formatUserRoles(user) {
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : user?.role ? [user.role] : [];
  return roles.map((role) => workspaceRoleLabels[role] ?? role).join(" · ");
}

function getWorkspaceViewForUser(user) {
  if (user?.role === "admin") {
    return "admin";
  }

  if (user?.role === "teacher") {
    return "teacher";
  }

  return "portal";
}

function WorkspaceShell({
  subtitle,
  contextInitial,
  currentUser,
  children,
  wide = false,
  navigationItems = [],
  utility = null,
  actions = null,
  sessionAction = null,
  accessDetail = null,
  onRoleSwitch = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const groupedNavigationItems = groupWorkspaceNavigationItems(navigationItems);

  function handleNavigation(item) {
    setSidebarOpen(false);
    item.onClick?.();
  }

  return (
    <div className={`min-h-screen ${workspaceChrome.canvas} text-[#172033]`}>
      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div
          aria-hidden={!sidebarOpen}
          className={`fixed inset-0 z-40 bg-[#0f172a]/32 backdrop-blur-[2px] transition lg:hidden ${
            sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-[#d7e0ea] bg-[#fbfcfe] px-4 py-5 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full min-h-0 flex-col gap-5">
            <div className={`${workspaceChrome.shellPanel} p-4`}>
              <WorkspaceHomeButton contextInitial={contextInitial} subtitle={subtitle} />
              <div className="mt-4 rounded-2xl border border-[#e7edf5] bg-[#f7f9fc] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Acceso</p>
                <p className="mt-2 text-sm font-semibold text-[#172033]">
                  {currentUser?.role === "admin"
                    ? "Control administrativo"
                    : currentUser?.role === "teacher"
                      ? "Experiencia docente"
                      : "Experiencia estudiantil"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#5d6b80]">
                  {accessDetail ?? (currentUser ? `${currentUser.email} · ${formatUserRoles(currentUser)}` : "Workspace operativo seguro")}
                </p>
              </div>
            </div>

            <nav className={`${workspaceChrome.shellPanel} flex-1 min-h-0 overflow-hidden p-3`}>
              <p className="px-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Navegacion</p>
              <div className="mt-3 grid max-h-full gap-2 overflow-y-auto pr-1">
                {navigationItems.length ? (
                  groupedNavigationItems.map((group, index) => (
                    <div className="grid gap-2" key={group.label || `nav-group-${index}`}>
                      {group.label ? (
                        <p className="px-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{group.label}</p>
                      ) : null}
                      {group.items.map((item) => (
                        <WorkspaceSidebarButton item={item} key={`${group.label}-${item.label}`} onSelect={handleNavigation} />
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d7e0ea] bg-[#f7f9fc] px-4 py-5 text-sm leading-relaxed text-[#5d6b80]">
                    Esta vista no expone accesos secundarios.
                  </div>
                )}
              </div>
            </nav>

            <div className={`${workspaceChrome.shellPanel} p-4`}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Sesión</p>
              {currentUser ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-[#172033]">{currentUser.fullName}</p>
                  <div className="mt-1">
                    {currentUser?.roles?.length > 1 && onRoleSwitch ? (
                      <WorkspaceContextSwitcher currentUser={currentUser} compact menuPlacement="top" onRoleSwitch={onRoleSwitch} />
                    ) : (
                      <p className="text-xs uppercase tracking-[0.18em] text-[#6b7a90]">
                        {workspaceRoleLabels[currentUser.role] ?? currentUser.role} · {currentUser.status}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#617085]">{currentUser.email}</p>
                  {sessionAction ? <div className="mt-4">{sessionAction}</div> : null}
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-[#5d6b80]">Validando identidad del workspace.</p>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-2">
          <header className={`${workspaceChrome.topbar} sticky top-0 z-30`}>
            <div className="flex min-h-[4.6rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7e0ea] bg-white text-[#172033] lg:hidden"
                onClick={() => setSidebarOpen((current) => !current)}
                type="button"
              >
                <ShellMenuIcon open={sidebarOpen} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#6b7a90]">Workspace</p>
                <h1 className="truncate text-lg font-semibold text-[#172033] sm:text-[1.35rem]">{subtitle}</h1>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
                {utility}
                {actions}
              </div>
            </div>
            {(utility || actions) ? <div className="flex flex-wrap items-center gap-3 border-t border-[#e7edf5] px-4 py-3 lg:hidden sm:px-6">{utility}{actions}</div> : null}
          </header>

          <div className={`mx-auto w-full ${wide ? "max-w-[120rem]" : "max-w-[96rem]"} px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoBeyondApp() {
  const initialTokens = getAuthRouteTokens(window.location.pathname, window.location.search);
  const [viewMode, setViewMode] = useState(() => getViewModeFromPath(window.location.pathname));
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState(() =>
    getWorkspaceSectionFromLocation(window.location.pathname, window.location.hash)
  );
  const [loginMode, setLoginMode] = useState("login");
  const [resetToken, setResetToken] = useState(() => initialTokens.resetToken);
  const [verificationToken, setVerificationToken] = useState(() => initialTokens.verificationToken);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [adminView, setAdminView] = useState("queue");
  const isAdmin = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";
  const isStudent = currentUser?.role === "student";
  const {
    content: publicContent,
    loading: publicLoading,
    error: publicError,
    createTestimonialSubmission,
  } = usePublicContent();
  const {
    content: adminContent,
    loading: adminLoading,
    error: adminError,
    refresh: refreshAdminContent,
    updateSection,
    createCollectionItem,
    deleteCollectionItem,
    updateCollectionItem,
    uploadAsset,
  } = useAdminContent(isAdmin);
  const {
    sources: socialSources,
    loading: socialSourcesLoading,
    error: socialSourcesError,
    createSource: createSocialSource,
    updateSource: updateSocialSource,
    removeSource: removeSocialSource,
  } = useAdminSocialSources(isAdmin);
  const {
    posts: socialNewsPosts,
    loading: socialNewsLoading,
    error: socialNewsError,
  } = useSocialNews();
  const {
    users: adminUsers,
    loading: usersLoading,
    error: usersError,
    changeUserPassword,
    createUser,
    notifyUserPasswordReset,
    notifyUserVerification,
    removeUser,
    updateUser,
  } = useAdminUsers(isAdmin);
  const {
    enrollments,
    loading: enrollmentsLoading,
    error: enrollmentsError,
    createEnrollment,
    updateEnrollment,
    removeEnrollment,
  } = useAdminEnrollments(isAdmin);
  const {
    dashboard: studentDashboard,
    loading: studentDashboardLoading,
    error: studentDashboardError,
  } = useStudentDashboard(isStudent);
  const {
    threads: studentCommunityThreads,
    loading: studentCommunityLoading,
    error: studentCommunityError,
    createThread: createStudentCommunityThread,
    reply: replyToStudentCommunityThread,
    updateThread: updateStudentCommunityThread,
  } = useStudentCommunity(isStudent);
  const {
    dashboard: teacherDashboard,
    loading: teacherDashboardLoading,
    error: teacherDashboardError,
  } = useTeacherDashboard(isTeacher);
  const {
    courses: teacherCourses,
    loading: teacherCoursesLoading,
    error: teacherCoursesError,
    createAssignment: createTeacherCourseAssignment,
    editAssignment: updateTeacherCourseAssignment,
    removeAssignment: deleteTeacherCourseAssignment,
  } = useTeacherCourses(isTeacher);
  const {
    enrollmentsView: teacherEnrollmentsView,
    loading: teacherEnrollmentsLoading,
    error: teacherEnrollmentsError,
    createEnrollment: createTeacherScopedEnrollment,
    updateEnrollment: updateTeacherScopedEnrollment,
    removeEnrollment: removeTeacherScopedEnrollment,
  } = useTeacherEnrollments(isTeacher);
  const {
    support: teacherSupport,
    loading: teacherSupportLoading,
    error: teacherSupportError,
    updateSupportItem: updateTeacherScopedSupport,
  } = useTeacherSupport(isTeacher);
  const {
    sops: teacherSops,
    activeRequests: teacherSopActiveRequests,
    loading: teacherSopsLoading,
    error: teacherSopsError,
    notificationBanner: teacherSopNotification,
    acknowledgeNotification: acknowledgeTeacherSopNotification,
    requestChange: requestTeacherSopChange,
  } = useTeacherSops(isTeacher);

  async function handleCreateAdminSop(payload) {
    const response = await createAdminSop(undefined, payload);
    await refreshAdminContent();
    return response;
  }

  async function handleUpdateAdminSop(sopId, payload) {
    const response = await updateAdminSop(undefined, sopId, payload);
    await refreshAdminContent();
    return response;
  }

  async function handleDeleteAdminSop(sopId) {
    const response = await deleteAdminSop(undefined, sopId);
    await refreshAdminContent();
    return response;
  }

  async function handleUpdateAdminSopChangeRequest(requestId, payload) {
    const response = await updateAdminSopChangeRequest(undefined, requestId, payload);
    await refreshAdminContent();
    return response;
  }

  useEffect(() => {
    function handlePopState() {
      const nextPath = window.location.pathname;
      const nextTokens = getAuthRouteTokens(nextPath, window.location.search);
      setViewMode(getViewModeFromPath(nextPath));
      setActiveWorkspaceSection(getWorkspaceSectionFromLocation(nextPath, window.location.hash));
      setResetToken(nextTokens.resetToken);
      setVerificationToken(nextTokens.verificationToken);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const metaName = "robots";
    let robotsMeta = document.querySelector(`meta[name="${metaName}"]`);

    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", metaName);
      document.head.appendChild(robotsMeta);
    }

    robotsMeta.setAttribute(
      "content",
      viewMode === "landing" ||
        viewMode === "noticias" ||
        viewMode === "terminos" ||
        viewMode === "privacidad" ||
        viewMode === "cookies" ||
        viewMode === "aviso-legal"
        ? "index,follow"
        : "noindex,nofollow,noarchive"
    );
  }, [viewMode]);

  function navigateTo(nextView) {
    const nextPath = nextView === "landing" ? "/" : `/${nextView}`;
    window.history.pushState({}, "", nextPath);
    setViewMode(nextView);
    setActiveWorkspaceSection(getDefaultWorkspaceSection(nextView));
    setResetToken("");
    setVerificationToken("");
  }

  function scrollToSection(sectionId) {
    if (!sectionId) {
      return;
    }

    setActiveWorkspaceSection(sectionId);
    window.history.replaceState({}, "", `${window.location.pathname}#${sectionId}`);

    let attempts = 0;

    function tryScroll() {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < 18) {
        window.setTimeout(tryScroll, 90);
      }
    }

    window.requestAnimationFrame(tryScroll);
  }

  function navigateToWorkspaceSection(nextView, sectionId) {
    if (viewMode !== nextView) {
      navigateTo(nextView);
    }
    scrollToSection(sectionId);
  }

  function broadcastAuthChange(type) {
    const payload = { type, at: Date.now() };

    if (typeof globalThis.BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(authSyncChannelName);
        channel.postMessage(payload);
        channel.close();
      } catch {
        // Fallback below.
      }
    }

    try {
      window.localStorage.setItem(authSyncStorageKey, JSON.stringify(payload));
    } catch {
      // Ignorar si el navegador bloquea storage.
    }
  }

  async function refreshSessionState() {
    try {
      setAuthLoading(true);
      const response = await fetchCurrentUser();
      setCurrentUser(response.user);
      setAuthError("");
      return response.user;
    } catch (error) {
      setCurrentUser(null);
      if (error.message !== "Autenticacion requerida." && error.message !== "Sesion no valida.") {
        setAuthError(error.message);
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      const nextUser = await refreshSessionState();
      if (!mounted) {
        return;
      }

      const redirectableView =
        viewMode === "landing" || viewMode === "login" || viewMode === "reset-password" || viewMode === "verify-account";
      if (nextUser && redirectableView) {
        navigateTo(getWorkspaceViewForUser(nextUser));
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function syncSessionAcrossTabs() {
      const nextUser = await refreshSessionState();

      if (nextUser) {
        navigateTo(getWorkspaceViewForUser(nextUser));
        return;
      }

      if (!nextUser) {
        navigateTo("login");
      }
    }

    let channel = null;
    if (typeof globalThis.BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(authSyncChannelName);
      channel.onmessage = () => {
        syncSessionAcrossTabs();
      };
    }

    function handleStorage(event) {
      if (event.key === authSyncStorageKey && event.newValue) {
        syncSessionAcrossTabs();
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, [viewMode]);

  async function handleLogin(credentials) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const session = await loginAdmin(credentials);
      setCurrentUser(session.user);
      broadcastAuthChange("login");
      navigateTo(getWorkspaceViewForUser(session.user));
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleStudentRegistration(payload) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const session = await registerStudent(payload);
      if (session.requiresVerification) {
        setAuthNotice(
          session.debugVerificationUrl
            ? `${session.message} En entorno local puedes abrir: ${session.debugVerificationUrl}`
            : session.message
        );
        setLoginMode("login");
        navigateTo("login");
        return;
      }
      setCurrentUser(session.user);
      broadcastAuthChange("register");
      navigateTo("portal");
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handlePasswordResetRequest(payload) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const response = await requestPasswordReset(payload);
      setAuthNotice(
        response.debugResetUrl
          ? `${response.message} En entorno local puedes abrir: ${response.debugResetUrl}`
          : response.message
      );
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerificationRequest(payload) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const response = await requestEmailVerification(payload);
      setAuthNotice(
        response.debugVerificationUrl
          ? `${response.message} En entorno local puedes abrir: ${response.debugVerificationUrl}`
          : response.message
      );
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handlePasswordReset(payload) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const response = await resetPassword(payload);
      setAuthNotice(response.message);
      setLoginMode("login");
      window.history.replaceState({}, "", "/login");
      setViewMode("login");
      setResetToken("");
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleEmailVerification(payload) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const response = await verifyEmail(payload);
      setAuthNotice(response.message);
      setLoginMode("login");
      window.history.replaceState({}, "", "/login");
      setViewMode("login");
      setVerificationToken("");
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {
      // No bloquear cierre local por un error remoto.
    }
    setCurrentUser(null);
    broadcastAuthChange("logout");
  }

  async function handleStudentLogout() {
    await handleLogout();
    navigateTo("login");
  }

  async function handleRoleSwitch(nextRole) {
    if (!currentUser || nextRole === currentUser.role) {
      return;
    }

    try {
      setAuthError("");
      const response = await switchCurrentRole({ role: nextRole });
      setCurrentUser(response.user);
      broadcastAuthChange("role-switch");
      navigateTo(getWorkspaceViewForUser(response.user));
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  useEffect(() => {
    if (viewMode === "admin" && !authLoading) {
      if (!currentUser) {
        navigateTo("login");
      } else if (!isAdmin) {
        navigateTo(getWorkspaceViewForUser(currentUser));
      }
    }
  }, [viewMode, authLoading, currentUser, isAdmin]);

  useEffect(() => {
    if (viewMode === "teacher" && !authLoading) {
      if (!currentUser) {
        navigateTo("login");
      } else if (!isTeacher) {
        navigateTo(getWorkspaceViewForUser(currentUser));
      }
    }
  }, [viewMode, authLoading, currentUser, isTeacher]);

  useEffect(() => {
    if ((viewMode === "portal" || viewMode === "comunidad") && !authLoading && !isStudent) {
      if (isAdmin) {
        navigateTo("admin");
      } else if (isTeacher) {
        navigateTo("teacher");
      } else {
        navigateTo("login");
      }
    }
  }, [viewMode, authLoading, isStudent, isAdmin, isTeacher]);

  useEffect(() => {
    if (
      !authLoading &&
      currentUser &&
      (viewMode === "landing" || viewMode === "login" || viewMode === "reset-password" || viewMode === "verify-account")
    ) {
      navigateTo(getWorkspaceViewForUser(currentUser));
    }
  }, [authLoading, currentUser, viewMode]);

  if (publicLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fa] text-[#172033]">
        Cargando GoBeyond...
      </div>
    );
  }

  if (!publicContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fa] px-6 text-center text-[#172033]">
        <div>
          <h1 className="font-['Georgia'] text-3xl">No pudimos cargar GoBeyond</h1>
          <p className="mt-3 text-[#617085]">{publicError || "Ocurrio un error inesperado al cargar el sitio."}</p>
        </div>
      </div>
    );
  }

  return (
      <div className={`min-h-screen ${workspaceChrome.canvas} text-[#1d1d1b]`}>
        {viewMode === "landing" ? (
          <div className="relative">
            <PublicExperience
              content={publicContent}
              createTestimonialSubmission={createTestimonialSubmission}
              noticiasError={socialNewsError}
              noticiasLoading={socialNewsLoading}
              noticiasPosts={socialNewsPosts}
              onNavigateToNewsArchive={() => navigateTo("noticias")}
              onRequestLogin={() => navigateTo("login")}
            />
        </div>
        ) : viewMode === "noticias" ? (
          <NewsArchive
            content={publicContent}
            noticiasError={socialNewsError}
            noticiasLoading={socialNewsLoading}
            noticiasPosts={socialNewsPosts}
            onBack={() => navigateTo("landing")}
            onRequestLogin={() => navigateTo("login")}
          />
        ) : viewMode === "terminos" ||
          viewMode === "privacidad" ||
          viewMode === "cookies" ||
          viewMode === "aviso-legal" ? (
          <LegalPage
            brand={publicContent?.brand}
            onBack={() => navigateTo("landing")}
            onRequestLogin={() => navigateTo("login")}
            pageKey={viewMode}
          />
        ) : viewMode === "login" || viewMode === "reset-password" || viewMode === "verify-account" ? (
          <LoginExperience
            authLoading={authLoading}
          error={authError}
          mode={loginMode}
          notice={authNotice}
          onBack={() => navigateTo("landing")}
          onLogin={handleLogin}
          onModeChange={setLoginMode}
          onRequestPasswordReset={handlePasswordResetRequest}
          onRequestVerification={handleVerificationRequest}
          onRegister={handleStudentRegistration}
          onResetFlowExit={() => {
            setAuthError("");
            setAuthNotice("");
            setLoginMode("login");
            window.history.replaceState({}, "", "/login");
            setViewMode("login");
            setResetToken("");
          }}
          onResetPassword={handlePasswordReset}
          resetToken={resetToken}
          turnstileSiteKey={publicContent?.securityPublic?.siteKey ?? ""}
          verificationToken={verificationToken}
          onVerifyAccount={handleEmailVerification}
          onVerificationFlowExit={() => {
            setAuthError("");
            setAuthNotice("");
            setLoginMode("login");
            window.history.replaceState({}, "", "/login");
            setViewMode("login");
            setVerificationToken("");
          }}
        />
      ) : viewMode === "portal" ? (
        <WorkspaceShell
          contextInitial="E"
          currentUser={currentUser}
          navigationItems={[
            {
              label: "Resumen",
              caption: "Vista general de tu cuenta",
              active: activeWorkspaceSection === "portal-overview",
              onClick: () => navigateToWorkspaceSection("portal", "portal-overview"),
            },
            {
              label: "Cursos",
              caption: "Programas activos y progreso",
              active: activeWorkspaceSection === "portal-courses",
              onClick: () => navigateToWorkspaceSection("portal", "portal-courses"),
            },
            {
              label: "Trayectoria",
              caption: "Ruta academica y seguimiento",
              active: activeWorkspaceSection === "portal-path",
              onClick: () => navigateToWorkspaceSection("portal", "portal-path"),
            },
            {
              label: "Aperturas",
              caption: "Programas disponibles para aplicar",
              active: activeWorkspaceSection === "portal-openings",
              onClick: () => navigateToWorkspaceSection("portal", "portal-openings"),
            },
            {
              label: "Soporte",
              caption: "Consultas y tickets formales",
              active: activeWorkspaceSection === "portal-support",
              onClick: () => navigateToWorkspaceSection("portal", "portal-support"),
            },
            {
              label: "Comunidad",
              caption: "Preguntas y respuestas entre estudiantes",
              active: viewMode === "comunidad",
              onClick: () => navigateTo("comunidad"),
            },
          ]}
          accessDetail="Portal academico protegido"
          onRoleSwitch={handleRoleSwitch}
          sessionAction={
            <button
              className="w-full rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              onClick={handleStudentLogout}
              type="button"
            >
              Cerrar sesión
            </button>
          }
          subtitle="Portal estudiantil"
          utility={<WorkspaceStatusChip>{currentUser?.fullName || "Sesion estudiantil"}</WorkspaceStatusChip>}
          wide
        >
          <StudentExperience
            dashboard={studentDashboard}
            dashboardError={studentDashboardError}
            dashboardLoading={studentDashboardLoading}
            onOpenCommunity={() => navigateTo("comunidad")}
            onLogout={handleStudentLogout}
          />
        </WorkspaceShell>
      ) : viewMode === "comunidad" ? (
        <WorkspaceShell
          contextInitial="E"
          currentUser={currentUser}
          navigationItems={[
            {
              label: "Comunidad",
              caption: "Vista general y estadisticas",
              active: activeWorkspaceSection === "community-overview",
              onClick: () => navigateToWorkspaceSection("comunidad", "community-overview"),
            },
            {
              label: "Hilos",
              caption: "Listado principal de conversaciones",
              active: activeWorkspaceSection === "community-threads",
              onClick: () => navigateToWorkspaceSection("comunidad", "community-threads"),
            },
            {
              label: "Responder",
              caption: "Zona de respuesta contextual",
              active: activeWorkspaceSection === "community-reply",
              onClick: () => navigateToWorkspaceSection("comunidad", "community-reply"),
            },
            {
              label: "Portal",
              caption: "Volver al portal del estudiante",
              active: viewMode === "portal",
              onClick: () => navigateTo("portal"),
            },
          ]}
          onRoleSwitch={handleRoleSwitch}
          sessionAction={
            <button
              className="w-full rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              onClick={handleStudentLogout}
              type="button"
            >
              Cerrar sesion
            </button>
          }
          subtitle="Comunidad estudiantil"
          utility={<WorkspaceStatusChip>{currentUser?.email || "Comunidad activa"}</WorkspaceStatusChip>}
          wide
        >
          <StudentCommunityExperience
            dashboard={studentDashboard}
            communityError={studentCommunityError}
            communityLoading={studentCommunityLoading}
            communityThreads={studentCommunityThreads}
            dashboardError={studentDashboardError}
            dashboardLoading={studentDashboardLoading}
            onCreateThread={createStudentCommunityThread}
            onBack={() => navigateTo("portal")}
            onLogout={handleStudentLogout}
            onReply={replyToStudentCommunityThread}
            onUpdateThread={updateStudentCommunityThread}
          />
        </WorkspaceShell>
      ) : viewMode === "teacher" ? (
        <WorkspaceShell
          contextInitial="D"
          currentUser={currentUser}
          navigationItems={[
            {
              label: "Resumen",
              caption: "Metricas operativas y casos recientes",
              active: activeWorkspaceSection === "teacher-overview",
              onClick: () => navigateToWorkspaceSection("teacher", "teacher-overview"),
            },
            {
              label: "Cursos y grupos",
              caption: "Cursos asignados y cohortes activas",
              active: activeWorkspaceSection === "teacher-courses",
              onClick: () => navigateToWorkspaceSection("teacher", "teacher-courses"),
            },
            {
              label: "Tareas y evaluaciones",
              caption: "Asignaciones y entregables docentes",
              active: activeWorkspaceSection === "teacher-assignments",
              onClick: () => navigateToWorkspaceSection("teacher", "teacher-assignments"),
            },
            {
              label: "Matriculas y soporte",
              caption: "Altas, incidencias y comunidad ligada a tus cursos",
              active: activeWorkspaceSection === "teacher-operations",
              onClick: () => navigateToWorkspaceSection("teacher", "teacher-operations"),
            },
            {
              label: "SOPs",
              caption: "Procedimientos y solicitudes de cambio",
              active: activeWorkspaceSection === "teacher-sops",
              onClick: () => navigateToWorkspaceSection("teacher", "teacher-sops"),
            },
          ]}
          onRoleSwitch={handleRoleSwitch}
          sessionAction={
            <button
              className="w-full rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              onClick={handleStudentLogout}
              type="button"
            >
              Cerrar sesion
            </button>
          }
          subtitle="Workspace docente"
          utility={<WorkspaceStatusChip>{currentUser?.email || "Sesion docente"}</WorkspaceStatusChip>}
          wide
        >
          <TeacherExperience
            courses={teacherCourses}
            coursesError={teacherCoursesError}
            coursesLoading={teacherCoursesLoading}
            currentUser={currentUser}
            dashboard={teacherDashboard}
            dashboardError={teacherDashboardError}
            dashboardLoading={teacherDashboardLoading}
            enrollmentsError={teacherEnrollmentsError}
            enrollmentsLoading={teacherEnrollmentsLoading}
            enrollmentsView={teacherEnrollmentsView}
            onCreateAssignment={createTeacherCourseAssignment}
            onCreateEnrollment={createTeacherScopedEnrollment}
            onDeleteAssignment={deleteTeacherCourseAssignment}
            onDeleteEnrollment={removeTeacherScopedEnrollment}
            onLogout={handleStudentLogout}
            onAcknowledgeSopNotification={acknowledgeTeacherSopNotification}
            onRequestSopChange={requestTeacherSopChange}
            onUpdateAssignment={updateTeacherCourseAssignment}
            onUpdateEnrollment={updateTeacherScopedEnrollment}
            onUpdateSupportItem={updateTeacherScopedSupport}
            sopActiveRequests={teacherSopActiveRequests}
            sopNotification={teacherSopNotification}
            sops={teacherSops}
            sopsError={teacherSopsError}
            sopsLoading={teacherSopsLoading}
            support={teacherSupport}
            supportError={teacherSupportError}
            supportLoading={teacherSupportLoading}
          />
        </WorkspaceShell>
      ) : (
        <WorkspaceShell
          contextInitial="A"
          currentUser={currentUser}
          navigationItems={adminNavigationGroups.flatMap((group) =>
            group.items.map((view) => ({
              label: adminViewLabels[view],
              active: adminView === view,
              group: group.label,
              onClick: () => setAdminView(view),
            }))
          )}
          onRoleSwitch={handleRoleSwitch}
          sessionAction={
            <button
              className="w-full rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
              onClick={handleLogout}
              type="button"
            >
              Cerrar sesion
            </button>
          }
          subtitle="Panel administrativo"
          utility={<WorkspaceStatusChip>{currentUser?.email || "Sesion administrativa"}</WorkspaceStatusChip>}
          wide
        >
          <div>
            <AdminExperience
              activeView={adminView}
              authError={authError || adminError || usersError || enrollmentsError || socialSourcesError}
              authLoading={authLoading}
              createEnrollment={createEnrollment}
              content={adminContent}
              createUser={createUser}
              changeUserPassword={changeUserPassword}
              currentUser={currentUser}
              deleteCollectionItem={deleteCollectionItem}
              enrollments={enrollments}
              enrollmentsLoading={enrollmentsLoading}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onActiveViewChange={setAdminView}
              onRequestLogin={() => navigateTo("login")}
              notifyUserPasswordReset={notifyUserPasswordReset}
              notifyUserVerification={notifyUserVerification}
              createSop={handleCreateAdminSop}
              removeUser={removeUser}
              removeEnrollment={removeEnrollment}
              deleteSop={handleDeleteAdminSop}
              updateSection={updateSection}
              createCollectionItem={createCollectionItem}
              createSocialSource={createSocialSource}
              updateCollectionItem={updateCollectionItem}
              updateSocialSource={updateSocialSource}
              updateSop={handleUpdateAdminSop}
              updateSopChangeRequest={handleUpdateAdminSopChangeRequest}
              updateEnrollment={updateEnrollment}
              updateUser={updateUser}
              uploadAsset={uploadAsset}
              loading={adminLoading}
              socialSources={socialSources}
              socialSourcesError={socialSourcesError}
              socialSourcesLoading={socialSourcesLoading}
              removeSocialSource={removeSocialSource}
              users={adminUsers}
              usersLoading={usersLoading}
            />
          </div>
        </WorkspaceShell>
      )}

      {publicError ? (
        <div className="border-t border-[#d8e2ec] bg-[#fff7ed] px-6 py-3 text-sm text-[#8a3d31]">
          {publicError}
        </div>
      ) : null}
    </div>
  );
}
