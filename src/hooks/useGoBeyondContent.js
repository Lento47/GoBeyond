import { useEffect, useState } from "react";
import {
  createAdminEnrollment,
  createAdminCollectionItem,
  createAdminUser,
  deleteAdminUser,
  deleteAdminEnrollment,
  deleteAdminCollectionItem,
  fetchAdminEnrollments,
  fetchAdminContent,
  fetchAdminUsers,
  fetchPublicContent,
  fetchStudentCommunity,
  fetchStudentDashboard,
  sendAdminUserPasswordReset,
  sendAdminUserVerification,
  setAdminUserPassword,
  submitPublicTestimonial,
  createStudentCommunityReply,
  createStudentCommunityThread,
  updateAdminCollectionItem,
  updateAdminEnrollment,
  updateAdminSection,
  updateAdminUser,
  updateStudentCommunityThread,
  uploadAdminAsset,
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

  async function createTestimonialSubmission(payload) {
    return submitPublicTestimonial(payload);
  }

  return {
    createTestimonialSubmission,
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

  async function updateCollectionItem(section, id, item) {
    try {
      const nextContent = await updateAdminCollectionItem(token, section, id, item);
      setContent(nextContent);
    } catch (updateError) {
      if (String(updateError?.message ?? "").includes("Elemento no encontrado")) {
        await createAdminCollectionItem(token, section, {
          ...item,
          id,
        });
        await refresh();
        return;
      }

      throw updateError;
    }
  }

  async function deleteCollectionItem(section, id) {
    await deleteAdminCollectionItem(token, section, id);
    await refresh();
  }

  async function uploadAsset(file, purpose) {
    return uploadAdminAsset(token, file, purpose);
  }

  return {
    content,
    error,
    loading,
    createCollectionItem,
    deleteCollectionItem,
    refresh,
    uploadAsset,
    updateCollectionItem,
    updateSection,
  };
}

export function useStudentDashboard(token) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!token) {
        setDashboard(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchStudentDashboard(token);
        if (!mounted) {
          return;
        }
        setDashboard(data);
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

  return {
    dashboard,
    error,
    loading,
  };
}

export function useStudentCommunity(token) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!token) {
        setThreads([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchStudentCommunity(token);
        if (!mounted) {
          return;
        }
        setThreads(data.threads ?? []);
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

  async function createThread(payload) {
    const data = await createStudentCommunityThread(token, payload);
    setThreads(data.threads ?? []);
    return data.thread;
  }

  async function reply(threadId, payload) {
    const data = await createStudentCommunityReply(token, threadId, payload);
    setThreads(data.threads ?? []);
    return data.thread;
  }

  async function updateThread(threadId, payload) {
    const data = await updateStudentCommunityThread(token, threadId, payload);
    setThreads(data.threads ?? []);
    return data.thread;
  }

  return {
    threads,
    loading,
    error,
    createThread,
    reply,
    updateThread,
  };
}

export function useAdminUsers(token) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!token) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminUsers(token);
        if (!mounted) {
          return;
        }
        setUsers(data.users ?? []);
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

  async function createUser(payload) {
    const data = await createAdminUser(token, payload);
    setUsers(data.users ?? []);
  }

  async function updateUser(userId, payload) {
    const data = await updateAdminUser(token, userId, payload);
    setUsers(data.users ?? []);
  }

  async function removeUser(userId) {
    const data = await deleteAdminUser(token, userId);
    setUsers(data.users ?? []);
    return data.user;
  }

  async function changeUserPassword(userId, payload) {
    const data = await setAdminUserPassword(token, userId, payload);
    setUsers(data.users ?? []);
    return data.user;
  }

  async function notifyUserPasswordReset(userId) {
    return sendAdminUserPasswordReset(token, userId);
  }

  async function notifyUserVerification(userId) {
    const data = await sendAdminUserVerification(token, userId);
    if (data.users) {
      setUsers(data.users ?? []);
    }
    return data;
  }

  return {
    users,
    loading,
    error,
    createUser,
    changeUserPassword,
    notifyUserPasswordReset,
    notifyUserVerification,
    removeUser,
    updateUser,
  };
}

export function useAdminEnrollments(token) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!token) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminEnrollments(token);
        if (!mounted) {
          return;
        }
        setEnrollments(data.enrollments ?? []);
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

  async function createEnrollment(payload) {
    const data = await createAdminEnrollment(token, payload);
    setEnrollments(data.enrollments ?? []);
  }

  async function updateEnrollment(enrollmentId, payload) {
    const data = await updateAdminEnrollment(token, enrollmentId, payload);
    setEnrollments(data.enrollments ?? []);
  }

  async function removeEnrollment(enrollmentId) {
    const data = await deleteAdminEnrollment(token, enrollmentId);
    setEnrollments(data.enrollments ?? []);
  }

  return {
    enrollments,
    loading,
    error,
    createEnrollment,
    updateEnrollment,
    removeEnrollment,
  };
}
