import { useEffect, useState } from "react";
import {
  createAdminCollectionItem,
  deleteAdminCollectionItem,
  fetchAdminContent,
  fetchPublicContent,
  updateAdminSection,
} from "../services/contentApi";

export function usePublicContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchPublicContent();
        if (!mounted) {
          return;
        }

        setContent(data);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    content,
    error,
    loading,
  };
}

export function useAdminContent(token) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!token) {
        setLoading(false);
        setContent(null);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminContent(token);
        if (!mounted) {
          return;
        }
        setContent(data);
        setError("");
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function refresh() {
    if (!token) {
      return;
    }
    const data = await fetchAdminContent(token);
    setContent(data);
  }

  async function updateSection(section, value) {
    const nextContent = await updateAdminSection(token, section, value);
    setContent(nextContent);
  }

  async function createCollectionItem(section, item) {
    await createAdminCollectionItem(token, section, item);
    await refresh();
  }

  async function deleteCollectionItem(section, id) {
    await deleteAdminCollectionItem(token, section, id);
    await refresh();
  }

  return {
    content,
    error,
    loading,
    createCollectionItem,
    deleteCollectionItem,
    refresh,
    updateSection,
  };
}
