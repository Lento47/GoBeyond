import { useEffect, useState } from "react";
import { useAdminContent, usePublicContent } from "../../hooks/useGoBeyondContent";
import { fetchCurrentUser, loginAdmin, logoutAdmin } from "../../services/contentApi";
import { AdminExperience } from "./AdminExperience";
import { PublicExperience } from "./PublicExperience";

const storageKey = "gobeyond_admin_token";

export default function GoBeyondApp() {
  const [active, setActive] = useState("Inicio");
  const [viewMode, setViewMode] = useState("student");
  const [token, setToken] = useState(() => window.localStorage.getItem(storageKey) ?? "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState("");
  const { content: publicContent, loading: publicLoading, error: publicError } = usePublicContent();
  const {
    content: adminContent,
    loading: adminLoading,
    error: adminError,
    updateSection,
    createCollectionItem,
    deleteCollectionItem,
  } = useAdminContent(token);

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

  if (publicLoading || !publicContent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4efe7] text-[#1f1720]">
        Cargando GoBeyond...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4efe7] text-[#1f1720]">
      <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">GoBeyond workspace</p>
            <h1 className="font-['Georgia'] text-2xl">Frontend modular + backend-ready</h1>
          </div>

          <div className="flex gap-2">
            <button
              className={`px-4 py-2 text-sm ${viewMode === "student" ? "bg-[#1e1820] text-white" : "border border-[#d8cdbf]"}`}
              onClick={() => setViewMode("student")}
              type="button"
            >
              Vista estudiante
            </button>
            <button
              className={`px-4 py-2 text-sm ${viewMode === "admin" ? "bg-[#1e1820] text-white" : "border border-[#d8cdbf]"}`}
              onClick={() => setViewMode("admin")}
              type="button"
            >
              Vista admin
            </button>
          </div>
        </div>
      </div>

      {viewMode === "student" ? (
        <PublicExperience active={active} setActive={setActive} content={publicContent} />
      ) : (
        <div className="px-6 py-8 sm:px-10 lg:px-14">
          <AdminExperience
            authError={authError || adminError}
            authLoading={authLoading}
            content={adminContent}
            currentUser={currentUser}
            deleteCollectionItem={deleteCollectionItem}
            onLogin={handleLogin}
            onLogout={handleLogout}
            updateSection={updateSection}
            createCollectionItem={createCollectionItem}
            loading={adminLoading}
          />
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
