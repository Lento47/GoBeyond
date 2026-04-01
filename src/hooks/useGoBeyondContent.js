import { useEffect, useState } from "react";
import {
  createAdminEnrollment,
  createAdminCollectionItem,
  createAdminUser,
  deleteAdminEnrollment,
  deleteAdminCollectionItem,
  fetchAdminEnrollments,
  fetchAdminContent,
  fetchAdminUsers,
  fetchPublicContent,
  fetchStudentDashboard,
  submitPublicTestimonial,
  updateAdminCollectionItem,
  updateAdminEnrollment,
  updateAdminSection,
  updateAdminUser,
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
    const nextContent = await updateAdminCollectionItem(token, section, id, item);
    setContent(nextContent);
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

  return {
    users,
    loading,
    error,
    createUser,
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
