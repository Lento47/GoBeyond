import { useEffect, useState } from "react";
import {
  createAdminEnrollment,
  createAdminCollectionItem,
  createAdminUser,
  createAdminSocialSource,
  createTeacherAssignment,
  createTeacherEnrollment,
  createTeacherSopChangeRequest,
  deleteAdminUser,
  deleteAdminEnrollment,
  deleteAdminCollectionItem,
  deleteAdminSocialSource,
  deleteTeacherAssignment,
  deleteTeacherEnrollment,
  fetchAdminEnrollments,
  fetchAdminContent,
  fetchAdminSocialSources,
  fetchAdminUsers,
  fetchPublicContent,
  fetchSocialNews,
  fetchStudentCommunity,
  fetchStudentDashboard,
  fetchTeacherCourses,
  fetchTeacherDashboard,
  fetchTeacherEnrollments,
  fetchTeacherSops,
  fetchTeacherSupport,
  ackTeacherNotification,
  sendAdminUserPasswordReset,
  sendAdminUserVerification,
  setAdminUserPassword,
  submitPublicTestimonial,
  createStudentCommunityReply,
  createStudentCommunityThread,
  updateAdminCollectionItem,
  updateAdminEnrollment,
  updateAdminSocialSource,
  updateAdminSection,
  updateAdminUser,
  updateTeacherAssignment,
  updateTeacherEnrollment,
  updateTeacherSupportItem,
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

export function useSocialNews() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchSocialNews();
        if (!mounted) {
          return;
        }

        setPosts(data.posts ?? []);
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
  }, []);

  async function refresh() {
    const data = await fetchSocialNews();
    setPosts(data.posts ?? []);
  }

  return {
    posts,
    loading,
    error,
    refresh,
  };
}

export function useAdminContent(enabled) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setLoading(false);
        setContent(null);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminContent();
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
  }, [enabled]);

  async function refresh() {
    if (!enabled) {
      return;
    }
    const data = await fetchAdminContent();
    setContent(data);
  }

  async function updateSection(section, value) {
    const nextContent = await updateAdminSection(undefined, section, value);
    setContent(nextContent);
  }

  async function createCollectionItem(section, item) {
    await createAdminCollectionItem(undefined, section, item);
    await refresh();
  }

  async function updateCollectionItem(section, id, item) {
    try {
      const nextContent = await updateAdminCollectionItem(undefined, section, id, item);
      setContent(nextContent);
    } catch (updateError) {
      if (String(updateError?.message ?? "").includes("Elemento no encontrado")) {
        await createAdminCollectionItem(undefined, section, {
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
    await deleteAdminCollectionItem(undefined, section, id);
    await refresh();
  }

  async function uploadAsset(file, purpose) {
    return uploadAdminAsset(undefined, file, purpose);
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

export function useAdminSocialSources(enabled) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setSources([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminSocialSources();
        if (!mounted) {
          return;
        }

        setSources(data.sources ?? []);
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
  }, [enabled]);

  async function createSource(payload) {
    const data = await createAdminSocialSource(undefined, payload);
    setSources(data.sources ?? []);
  }

  async function updateSource(sourceId, payload) {
    const data = await updateAdminSocialSource(undefined, sourceId, payload);
    setSources(data.sources ?? []);
  }

  async function removeSource(sourceId) {
    const data = await deleteAdminSocialSource(undefined, sourceId);
    setSources(data.sources ?? []);
  }

  async function refresh() {
    if (!enabled) {
      return;
    }

    const data = await fetchAdminSocialSources();
    setSources(data.sources ?? []);
  }

  return {
    sources,
    loading,
    error,
    createSource,
    updateSource,
    removeSource,
    refresh,
  };
}

export function useStudentDashboard(enabled) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setDashboard(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchStudentDashboard();
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
  }, [enabled]);

  return {
    dashboard,
    error,
    loading,
  };
}

export function useStudentCommunity(enabled) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setThreads([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchStudentCommunity();
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
  }, [enabled]);

  async function createThread(payload) {
    const data = await createStudentCommunityThread(undefined, payload);
    setThreads(data.threads ?? []);
    return data.thread;
  }

  async function reply(threadId, payload) {
    const data = await createStudentCommunityReply(undefined, threadId, payload);
    setThreads(data.threads ?? []);
    return data.thread;
  }

  async function updateThread(threadId, payload) {
    const data = await updateStudentCommunityThread(undefined, threadId, payload);
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

export function useTeacherDashboard(enabled) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setDashboard(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchTeacherDashboard();
        if (!mounted) {
          return;
        }
        setDashboard(data.dashboard ?? null);
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
  }, [enabled]);

  return {
    dashboard,
    error,
    loading,
  };
}

export function useTeacherCourses(enabled) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setCourses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchTeacherCourses();
        if (!mounted) {
          return;
        }
        setCourses(data.courses ?? []);
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
  }, [enabled]);

  async function createAssignment(payload) {
    const data = await createTeacherAssignment(undefined, payload);
    setCourses(data.courses ?? []);
    return data.assignment;
  }

  async function editAssignment(payload) {
    const data = await updateTeacherAssignment(undefined, payload);
    setCourses(data.courses ?? []);
    return data.assignment;
  }

  async function removeAssignment(payload) {
    const data = await deleteTeacherAssignment(undefined, payload);
    setCourses(data.courses ?? []);
  }

  return {
    courses,
    error,
    loading,
    createAssignment,
    editAssignment,
    removeAssignment,
  };
}

export function useTeacherEnrollments(enabled) {
  const [enrollmentsView, setEnrollmentsView] = useState({
    enrollments: [],
    courseOptions: [],
    studentOptions: [],
  });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setEnrollmentsView({
          enrollments: [],
          courseOptions: [],
          studentOptions: [],
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchTeacherEnrollments();
        if (!mounted) {
          return;
        }
        setEnrollmentsView({
          enrollments: data.enrollments ?? [],
          courseOptions: data.courseOptions ?? [],
          studentOptions: data.studentOptions ?? [],
        });
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
  }, [enabled]);

  async function createEnrollment(payload) {
    const data = await createTeacherEnrollment(undefined, payload);
    setEnrollmentsView({
      enrollments: data.enrollments ?? [],
      courseOptions: data.courseOptions ?? [],
      studentOptions: data.studentOptions ?? [],
    });
  }

  async function updateEnrollment(enrollmentId, payload) {
    const data = await updateTeacherEnrollment(undefined, enrollmentId, payload);
    setEnrollmentsView({
      enrollments: data.enrollments ?? [],
      courseOptions: data.courseOptions ?? [],
      studentOptions: data.studentOptions ?? [],
    });
  }

  async function removeEnrollment(enrollmentId) {
    const data = await deleteTeacherEnrollment(undefined, enrollmentId);
    setEnrollmentsView({
      enrollments: data.enrollments ?? [],
      courseOptions: data.courseOptions ?? [],
      studentOptions: data.studentOptions ?? [],
    });
  }

  return {
    enrollmentsView,
    error,
    loading,
    createEnrollment,
    removeEnrollment,
    updateEnrollment,
  };
}

export function useTeacherSupport(enabled) {
  const [support, setSupport] = useState({
    tickets: [],
    courseRequests: [],
    threads: [],
  });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setSupport({
          tickets: [],
          courseRequests: [],
          threads: [],
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchTeacherSupport();
        if (!mounted) {
          return;
        }
        setSupport({
          tickets: data.tickets ?? [],
          courseRequests: data.courseRequests ?? [],
          threads: data.threads ?? [],
        });
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
  }, [enabled]);

  async function updateSupportItem(payload) {
    const data = await updateTeacherSupportItem(undefined, payload);
    setSupport({
      tickets: data.tickets ?? [],
      courseRequests: data.courseRequests ?? [],
      threads: data.threads ?? [],
    });
  }

  return {
    support,
    error,
    loading,
    updateSupportItem,
  };
}

export function useTeacherSops(enabled) {
  const [state, setState] = useState({
    sops: [],
    activeRequests: [],
    notificationBanner: null,
  });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setState({
          sops: [],
          activeRequests: [],
          notificationBanner: null,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchTeacherSops();
        if (!mounted) {
          return;
        }
        setState({
          sops: data.sops ?? [],
          activeRequests: data.activeRequests ?? [],
          notificationBanner: data.notificationBanner ?? null,
        });
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
  }, [enabled]);

  async function refresh() {
    if (!enabled) {
      return;
    }
    const data = await fetchTeacherSops();
    setState({
      sops: data.sops ?? [],
      activeRequests: data.activeRequests ?? [],
      notificationBanner: data.notificationBanner ?? null,
    });
  }

  async function requestChange(payload) {
    await createTeacherSopChangeRequest(undefined, payload);
    await refresh();
  }

  async function acknowledgeNotification(notificationId) {
    await ackTeacherNotification(undefined, notificationId);
    setState((current) => ({
      ...current,
      notificationBanner: null,
    }));
  }

  return {
    sops: state.sops,
    activeRequests: state.activeRequests,
    notificationBanner: state.notificationBanner,
    error,
    loading,
    acknowledgeNotification,
    refresh,
    requestChange,
  };
}

export function useAdminUsers(enabled) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminUsers();
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
  }, [enabled]);

  async function createUser(payload) {
    const data = await createAdminUser(undefined, payload);
    setUsers(data.users ?? []);
  }

  async function updateUser(userId, payload) {
    const data = await updateAdminUser(undefined, userId, payload);
    setUsers(data.users ?? []);
  }

  async function removeUser(userId) {
    const data = await deleteAdminUser(undefined, userId);
    setUsers(data.users ?? []);
    return data.user;
  }

  async function changeUserPassword(userId, payload) {
    const data = await setAdminUserPassword(undefined, userId, payload);
    setUsers(data.users ?? []);
    return data.user;
  }

  async function notifyUserPasswordReset(userId) {
    return sendAdminUserPasswordReset(undefined, userId);
  }

  async function notifyUserVerification(userId) {
    const data = await sendAdminUserVerification(undefined, userId);
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

export function useAdminEnrollments(enabled) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!enabled) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAdminEnrollments();
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
  }, [enabled]);

  async function createEnrollment(payload) {
    const data = await createAdminEnrollment(undefined, payload);
    setEnrollments(data.enrollments ?? []);
  }

  async function updateEnrollment(enrollmentId, payload) {
    const data = await updateAdminEnrollment(undefined, enrollmentId, payload);
    setEnrollments(data.enrollments ?? []);
  }

  async function removeEnrollment(enrollmentId) {
    const data = await deleteAdminEnrollment(undefined, enrollmentId);
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
