import { useEffect, useState } from "react";
import {
  useAdminContent,
  useAdminEnrollments,
  useAdminUsers,
  usePublicContent,
  useStudentCommunity,
  useStudentDashboard,
} from "../../hooks/useGoBeyondContent";
import {
  fetchCurrentUser,
  loginAdmin,
  logoutAdmin,
  requestEmailVerification,
  registerStudent,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "../../services/contentApi";
import { AdminExperience } from "./AdminExperience";
import { LoginExperience } from "./LoginExperience";
import { NewsArchive } from "./NewsArchive";
import { StudentCommunityExperience } from "./StudentCommunityExperience";
import { PublicExperience } from "./PublicExperience";
import { StudentExperience } from "./StudentExperience";

const storageKey = "gobeyond_admin_token";
const studentStorageKey = "gobeyond_student_token";

function getResetTokenFromSearch(search) {
  return new URLSearchParams(search).get("token") ?? "";
}

function getVerificationTokenFromSearch(search) {
  return new URLSearchParams(search).get("token") ?? "";
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

  if (pathname === "/comunidad") {
    return "comunidad";
  }

  if (pathname === "/noticias") {
    return "noticias";
  }

  return "landing";
}

function WorkspaceHomeButton({ subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <img alt="Logo de GoBeyond" className="h-12 w-12 object-contain" src="/logo-icon.png" />
      <div className="text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">GoBeyond workspace</p>
        <p className="font-['Georgia'] text-2xl">{subtitle}</p>
      </div>
    </div>
  );
}

export default function GoBeyondApp() {
  const [viewMode, setViewMode] = useState(() => getViewModeFromPath(window.location.pathname));
  const [loginMode, setLoginMode] = useState("login");
  const [resetToken, setResetToken] = useState(() => getResetTokenFromSearch(window.location.search));
  const [verificationToken, setVerificationToken] = useState(() => getVerificationTokenFromSearch(window.location.search));
  const [token, setToken] = useState(() => window.localStorage.getItem(storageKey) ?? "");
  const [studentToken, setStudentToken] = useState(() => window.localStorage.getItem(studentStorageKey) ?? "");
  const [currentUser, setCurrentUser] = useState(null);
  const [studentUser, setStudentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
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
    updateSection,
    createCollectionItem,
    deleteCollectionItem,
    updateCollectionItem,
    uploadAsset,
  } = useAdminContent(token);
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
  } = useAdminUsers(token);
  const {
    enrollments,
    loading: enrollmentsLoading,
    error: enrollmentsError,
    createEnrollment,
    updateEnrollment,
    removeEnrollment,
  } = useAdminEnrollments(token);
  const {
    dashboard: studentDashboard,
    loading: studentDashboardLoading,
    error: studentDashboardError,
  } = useStudentDashboard(studentToken);
  const {
    threads: studentCommunityThreads,
    loading: studentCommunityLoading,
    error: studentCommunityError,
    createThread: createStudentCommunityThread,
    reply: replyToStudentCommunityThread,
    updateThread: updateStudentCommunityThread,
  } = useStudentCommunity(studentToken);

  useEffect(() => {
    function handlePopState() {
      setViewMode(getViewModeFromPath(window.location.pathname));
      setResetToken(getResetTokenFromSearch(window.location.search));
      setVerificationToken(getVerificationTokenFromSearch(window.location.search));
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
      viewMode === "landing" || viewMode === "noticias" ? "index,follow" : "noindex,nofollow,noarchive"
    );
  }, [viewMode]);

  function navigateTo(nextView) {
    const nextPath = nextView === "landing" ? "/" : `/${nextView}`;
    window.history.pushState({}, "", nextPath);
    setViewMode(nextView);
    setResetToken("");
    setVerificationToken("");
  }

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      if (!token) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        setAuthLoading(true);
        const response = await fetchCurrentUser(token);
        if (!mounted) {
          return;
        }
        setCurrentUser(response.user);
        setAuthError("");
      } catch (error) {
        if (!mounted) {
          return;
        }
        window.localStorage.removeItem(storageKey);
        setToken("");
        setCurrentUser(null);
        setAuthError(error.message);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;

    async function hydrateStudentSession() {
      if (!studentToken) {
        setStudentUser(null);
        return;
      }

      try {
        const response = await fetchCurrentUser(studentToken);
        if (!mounted) {
          return;
        }
        if (response.user.role !== "student") {
          window.localStorage.removeItem(studentStorageKey);
          setStudentToken("");
          setStudentUser(null);
          return;
        }
        setStudentUser(response.user);
      } catch {
        if (!mounted) {
          return;
        }
        window.localStorage.removeItem(studentStorageKey);
        setStudentToken("");
        setStudentUser(null);
      }
    }

    hydrateStudentSession();

    return () => {
      mounted = false;
    };
  }, [studentToken]);

  async function handleLogin(credentials) {
    try {
      setAuthError("");
      setAuthNotice("");
      setAuthLoading(true);
      const session = await loginAdmin(credentials);
      if (session.user.role === "student") {
        window.localStorage.setItem(studentStorageKey, session.token);
        window.localStorage.removeItem(storageKey);
        setStudentToken(session.token);
        setStudentUser(session.user);
        setToken("");
        setCurrentUser(null);
        navigateTo("portal");
      } else {
        window.localStorage.setItem(storageKey, session.token);
        window.localStorage.removeItem(studentStorageKey);
        setToken(session.token);
        setCurrentUser(session.user);
        setStudentToken("");
        setStudentUser(null);
        navigateTo("admin");
      }
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
      window.localStorage.setItem(studentStorageKey, session.token);
      window.localStorage.removeItem(storageKey);
      setStudentToken(session.token);
      setStudentUser(session.user);
      setToken("");
      setCurrentUser(null);
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
    if (token) {
      try {
        await logoutAdmin(token);
      } catch {
        // No bloquear cierre local por un error remoto.
      }
    }

    window.localStorage.removeItem(storageKey);
    setToken("");
    setCurrentUser(null);
  }

  function handleStudentLogout() {
    window.localStorage.removeItem(studentStorageKey);
    setStudentToken("");
    setStudentUser(null);
    navigateTo("login");
  }

  useEffect(() => {
    if (viewMode === "admin" && !authLoading && !currentUser) {
      navigateTo("login");
    }
  }, [viewMode, authLoading, currentUser]);

  useEffect(() => {
    if ((viewMode === "portal" || viewMode === "comunidad") && !studentToken && !studentUser) {
      navigateTo("login");
    }
  }, [viewMode, studentToken, studentUser]);

  if (publicLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4efe7] text-[#1f1720]">
        Cargando GoBeyond...
      </div>
    );
  }

  if (!publicContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4efe7] px-6 text-center text-[#1f1720]">
        <div>
          <h1 className="font-['Georgia'] text-3xl">No pudimos cargar GoBeyond</h1>
          <p className="mt-3 text-[#6d5a51]">{publicError || "Ocurrio un error inesperado al cargar el sitio."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4efe7] text-[#1f1720]">
      {viewMode === "landing" ? (
        <div className="relative">
          <PublicExperience
            content={publicContent}
            createTestimonialSubmission={createTestimonialSubmission}
            onNavigateToNewsArchive={() => navigateTo("noticias")}
            onRequestLogin={() => navigateTo("login")}
          />
        </div>
      ) : viewMode === "noticias" ? (
        <NewsArchive
          content={publicContent}
          onBack={() => navigateTo("landing")}
          onRequestLogin={() => navigateTo("login")}
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
        <div>
          <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-6 py-4">
            <WorkspaceHomeButton subtitle="Portal estudiantil" />
          </div>

          <StudentExperience
            dashboard={studentDashboard}
            dashboardError={studentDashboardError}
            dashboardLoading={studentDashboardLoading}
            onOpenCommunity={() => navigateTo("comunidad")}
            onLogout={handleStudentLogout}
            token={studentToken}
          />
        </div>
      ) : viewMode === "comunidad" ? (
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
      ) : (
        <div>
          <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-6 py-4">
            <WorkspaceHomeButton subtitle="Panel administrativo" />
          </div>

          <div className="px-6 py-8 sm:px-10 lg:px-14">
            <AdminExperience
              authError={authError || adminError || usersError || enrollmentsError}
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
              onRequestLogin={() => navigateTo("login")}
              notifyUserPasswordReset={notifyUserPasswordReset}
              notifyUserVerification={notifyUserVerification}
              removeUser={removeUser}
              removeEnrollment={removeEnrollment}
              updateSection={updateSection}
              createCollectionItem={createCollectionItem}
              updateCollectionItem={updateCollectionItem}
              updateEnrollment={updateEnrollment}
              updateUser={updateUser}
              uploadAsset={uploadAsset}
              loading={adminLoading}
              users={adminUsers}
              usersLoading={usersLoading}
            />
          </div>
        </div>
      )}

      {publicError ? (
        <div className="border-t border-[#d8cdbf] bg-[#fff7ed] px-6 py-3 text-sm text-[#8a3d31]">
          {publicError}
        </div>
      ) : null}
    </div>
  );
}
