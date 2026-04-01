import { useEffect, useState } from "react";
import {
  useAdminContent,
  useAdminEnrollments,
  useAdminUsers,
  usePublicContent,
  useStudentDashboard,
} from "../../hooks/useGoBeyondContent";
import { fetchCurrentUser, loginAdmin, logoutAdmin } from "../../services/contentApi";
import { AdminExperience } from "./AdminExperience";
import { PublicExperience } from "./PublicExperience";
import { StudentExperience } from "./StudentExperience";

const storageKey = "gobeyond_admin_token";
const studentStorageKey = "gobeyond_student_token";

export default function GoBeyondApp() {
  const [viewMode, setViewMode] = useState("landing");
  const [token, setToken] = useState(() => window.localStorage.getItem(storageKey) ?? "");
  const [studentToken, setStudentToken] = useState(() => window.localStorage.getItem(studentStorageKey) ?? "");
  const [currentUser, setCurrentUser] = useState(null);
  const [studentUser, setStudentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState("");
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
  } = useAdminContent(token);
  const {
    users: adminUsers,
    loading: usersLoading,
    error: usersError,
    createUser,
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
      const session = await loginAdmin(credentials);
      window.localStorage.setItem(storageKey, session.token);
      setToken(session.token);
      setCurrentUser(session.user);
      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
      throw error;
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
          <div className="absolute right-6 top-6 z-20 flex gap-2">
            <button
              className="border border-[#d8cdbf] bg-white/90 px-4 py-2 text-sm text-[#5c4d46] backdrop-blur"
              onClick={() => setViewMode("portal")}
              type="button"
            >
              Portal estudiantil
            </button>
            <button
              className="border border-[#d8cdbf] bg-white/90 px-4 py-2 text-sm text-[#5c4d46] backdrop-blur"
              onClick={() => setViewMode("admin")}
              type="button"
            >
              Acceso admin
            </button>
          </div>
          <PublicExperience content={publicContent} createTestimonialSubmission={createTestimonialSubmission} />
        </div>
      ) : viewMode === "portal" ? (
        <div>
          <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">GoBeyond workspace</p>
                <h1 className="font-['Georgia'] text-2xl">Portal estudiantil</h1>
              </div>

              <button
                className="border border-[#d8cdbf] px-4 py-2 text-sm"
                onClick={() => setViewMode("landing")}
                type="button"
              >
                Volver al landing
              </button>
            </div>
          </div>

          <StudentExperience
            dashboard={studentDashboard}
            dashboardError={studentDashboardError}
            dashboardLoading={studentDashboardLoading}
            setStudentUser={setStudentUser}
            setToken={setStudentToken}
            studentUser={studentUser}
            token={studentToken}
          />
        </div>
      ) : (
        <div>
          <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">GoBeyond workspace</p>
                <h1 className="font-['Georgia'] text-2xl">Panel administrativo</h1>
              </div>

              <button
                className="border border-[#d8cdbf] px-4 py-2 text-sm"
                onClick={() => setViewMode("landing")}
                type="button"
              >
                Volver al landing
              </button>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 lg:px-14">
            <AdminExperience
              authError={authError || adminError || usersError || enrollmentsError}
              authLoading={authLoading}
              createEnrollment={createEnrollment}
              content={adminContent}
              createUser={createUser}
              currentUser={currentUser}
              deleteCollectionItem={deleteCollectionItem}
              enrollments={enrollments}
              enrollmentsLoading={enrollmentsLoading}
              onLogin={handleLogin}
              onLogout={handleLogout}
              removeEnrollment={removeEnrollment}
              updateSection={updateSection}
              createCollectionItem={createCollectionItem}
              updateCollectionItem={updateCollectionItem}
              updateEnrollment={updateEnrollment}
              updateUser={updateUser}
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
