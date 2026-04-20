import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  EmptyState,
  FilterInput,
  Input,
  MediaLibraryStrip,
  ModalShell,
  PillButton,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  SectionToolbar,
  Select,
  SmallStat,
  Textarea,
} from "./components/admin/AdminUI";
import { CatalogSection } from "./sections/CatalogSection";
import { IdentitySection } from "./sections/IdentitySection";
import { PeopleSection } from "./sections/PeopleSection";

const initialSessionForm = {
  id: "",
  title: "",
  date: "",
  dateInput: "",
  timeInput: "",
  format: "Sincronica",
};

const initialLearningForm = {
  id: "",
  title: "",
  type: "Asincronico",
  status: "",
};

const initialCourseForm = {
  id: "",
  title: "",
  audience: "",
  format: "",
  duration: "",
  description: "",
  outcomes: "",
  coverImage: "",
  detailSummary: "",
  assignments: [],
  gamificationRules: [],
};

const initialUserForm = {
  id: "",
  fullName: "",
  email: "",
  password: "",
  role: "student",
  status: "active",
};

const initialEnrollmentForm = {
  id: "",
  userId: "",
  courseId: "",
  accessDays: "45",
  accessExpiresAt: "",
  status: "active",
  gamificationEnabled: false,
  progressPercent: "0",
  points: "0",
  streakDays: "0",
};

const initialTestimonialForm = {
  quote: "",
  author: "",
  organization: "",
};

const initialNewsForm = {
  id: "",
  title: "",
  category: "",
  summary: "",
  link: "",
  embed: "",
  status: "published",
  featured: false,
  publishedAt: "",
};

const initialInstitutionForm = {
  id: "",
  name: "",
  link: "",
  embed: "",
  featured: true,
};

const initialSupportTicketForm = {
  id: "",
  status: "open",
  priority: "normal",
  adminNote: "",
};

const initialCourseInterestForm = {
  id: "",
  status: "open",
  adminNote: "",
};

const initialCommunityThreadForm = {
  id: "",
  status: "open",
  visibility: "visible",
  bestReplyId: "",
  adminNote: "",
};

const initialAssignmentDraft = {
  id: "",
  title: "",
  instruction: "",
  dueLabel: "",
  fileName: "",
  fileData: "",
  fileUrl: "",
  fileKey: "",
  fileContentType: "",
  fileUploadedAt: "",
  fileExpiresAt: "",
};

const initialRuleDraft = {
  id: "",
  title: "",
  condition: "",
  points: "10",
};

function normalizeLandingState(landing = {}) {
  return {
    ...landing,
    socialLinks: {
      facebook: landing?.socialLinks?.facebook ?? "",
      linkedin: landing?.socialLinks?.linkedin ?? "",
    },
  };
}

function normalizeSecuritySettingsState(settings = {}) {
  return {
    allowAdminPasswordChange: settings?.allowAdminPasswordChange !== false,
    allowAdminResetNotification: settings?.allowAdminResetNotification !== false,
    allowAdminVerificationNotification: settings?.allowAdminVerificationNotification !== false,
    requireEmailVerification: settings?.requireEmailVerification !== false,
    passwordExpirationEnabled: Boolean(settings?.passwordExpirationEnabled),
    passwordExpirationDays: String(settings?.passwordExpirationDays ?? 90),
    supportEmail: String(settings?.supportEmail ?? "it@gobeyondcr.org"),
  };
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha definida";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function createItemId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function includesQuery(values, query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
}

function addBusinessDays(startDate, businessDays) {
  const result = new Date(startDate);
  let remaining = businessDays;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return result;
}

function parseSessionDateParts(value) {
  if (!value) {
    return { dateInput: "", timeInput: "" };
  }

  const isoMatch = String(value).match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/);
  if (isoMatch) {
    return {
      dateInput: isoMatch[1] ?? "",
      timeInput: isoMatch[2] ?? "",
    };
  }

  return {
    dateInput: "",
    timeInput: "",
  };
}

function extractEmbedUrl(value) {
  const input = String(value ?? "").trim();
  if (!input) {
    return "";
  }

  const iframeMatch = input.match(/src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    return iframeMatch[1].trim();
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  return "";
}

function formatSessionLabel(dateInput, timeInput) {
  if (!dateInput) {
    return "";
  }

  const normalized = new Date(`${dateInput}T${timeInput || "00:00"}`);
  if (Number.isNaN(normalized.getTime())) {
    return timeInput ? `${dateInput} · ${timeInput}` : dateInput;
  }

  const dateLabel = normalized.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  if (!timeInput) {
    return dateLabel;
  }

  const timeLabel = normalized.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateLabel} · ${timeLabel}`;
}

export function AdminWorkspace({
  authError,
  changeUserPassword,
  content,
  createCollectionItem,
  createEnrollment,
  createUser,
  currentUser,
  deleteCollectionItem,
  enrollments,
  enrollmentsLoading,
  notifyUserPasswordReset,
  notifyUserVerification,
  onLogout,
  removeUser,
  removeEnrollment,
  updateCollectionItem,
  updateEnrollment,
  updateSection,
  updateUser,
  uploadAsset,
  users,
  usersLoading,
}) {
  const [activeView, setActiveView] = useState("identity");
  const [modal, setModal] = useState(null);
  const [brandForm, setBrandForm] = useState(content.brand);
  const [heroForm, setHeroForm] = useState(content.hero);
  const [landingForm, setLandingForm] = useState(() => normalizeLandingState(content.landing));
  const [securitySettingsForm, setSecuritySettingsForm] = useState(() => normalizeSecuritySettingsState(content.securitySettings));
  const [sessionForm, setSessionForm] = useState(initialSessionForm);
  const [learningForm, setLearningForm] = useState(initialLearningForm);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [assignmentDraft, setAssignmentDraft] = useState(initialAssignmentDraft);
  const [ruleDraft, setRuleDraft] = useState(initialRuleDraft);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [testimonialForm, setTestimonialForm] = useState(initialTestimonialForm);
  const [newsForm, setNewsForm] = useState(initialNewsForm);
  const [institutionForm, setInstitutionForm] = useState(initialInstitutionForm);
  const [supportTicketForm, setSupportTicketForm] = useState(initialSupportTicketForm);
  const [courseInterestForm, setCourseInterestForm] = useState(initialCourseInterestForm);
  const [communityThreadForm, setCommunityThreadForm] = useState(initialCommunityThreadForm);
  const [templateSelections, setTemplateSelections] = useState({
    session: "",
    learning: "",
    course: "",
  });
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [viewFilters, setViewFilters] = useState({
    sessions: "",
    learning: "",
    institutions: "",
    media: "",
    courses: "",
    users: "",
    enrollments: "",
    news: "",
    testimonials: "",
    tickets: "",
    courseRequests: "",
    communityThreads: "",
  });
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");

  useEffect(() => {
    setBrandForm(content.brand);
    setHeroForm(content.hero);
    setLandingForm(normalizeLandingState(content.landing));
    setSecuritySettingsForm(normalizeSecuritySettingsState(content.securitySettings));
  }, [content]);

  const studentOptions = useMemo(() => users.filter((user) => user.role === "student"), [users]);
  const materialTemplates = useMemo(() => content.materialTemplates ?? [], [content.materialTemplates]);
  const institutions = useMemo(() => content.institutions ?? [], [content.institutions]);
  const mediaLibrary = useMemo(() => content.mediaLibrary ?? [], [content.mediaLibrary]);
  const imageLibraryItems = useMemo(
    () => mediaLibrary.filter((item) => String(item.contentType ?? "").startsWith("image/")),
    [mediaLibrary]
  );
  const sessionTemplates = useMemo(
    () => materialTemplates.filter((item) => item.kind === "session"),
    [materialTemplates]
  );
  const learningTemplates = useMemo(
    () => materialTemplates.filter((item) => item.kind === "learning"),
    [materialTemplates]
  );
  const courseTemplates = useMemo(
    () => materialTemplates.filter((item) => item.kind === "course"),
    [materialTemplates]
  );
  const filteredSessions = useMemo(
    () =>
      (content.liveSessions ?? []).filter((item) =>
        includesQuery([item.title, item.format, item.date], viewFilters.sessions)
      ),
    [content.liveSessions, viewFilters.sessions]
  );
  const filteredLearning = useMemo(
    () =>
      (content.learningPath ?? []).filter((item) =>
        includesQuery([item.title, item.type, item.status], viewFilters.learning)
      ),
    [content.learningPath, viewFilters.learning]
  );
  const filteredInstitutions = useMemo(
    () =>
      institutions.filter((item) =>
        includesQuery([item.name, item.link, item.embed, item.featured ? "destacada" : "oculta"], viewFilters.institutions)
      ),
    [institutions, viewFilters.institutions]
  );
  const filteredMediaLibrary = useMemo(
    () =>
      mediaLibrary.filter((item) =>
        includesQuery([item.fileName, item.purpose, item.contentType, item.hash], viewFilters.media)
      ),
    [mediaLibrary, viewFilters.media]
  );
  const filteredCourses = useMemo(
    () =>
      (content.courses ?? []).filter((item) =>
        includesQuery([item.title, item.audience, item.format, item.duration, item.description, item.outcomes], viewFilters.courses)
      ),
    [content.courses, viewFilters.courses]
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((item) =>
        includesQuery(
          [
            item.fullName,
            item.email,
            item.role,
            item.status,
            item.emailVerified ? "verificada" : "pendiente",
            item.passwordExpired ? "expirada" : "vigente",
            item.emailVerifiedAt,
            item.passwordExpiresAt,
          ],
          viewFilters.users
        )
      ),
    [users, viewFilters.users]
  );
  const currentEditingUser = useMemo(
    () => users.find((item) => item.id === userForm.id) ?? null,
    [users, userForm.id]
  );
  const expiredUsersCount = useMemo(
    () => users.filter((item) => item.passwordExpired).length,
    [users]
  );
  const usersWithPasswordScheduleCount = useMemo(
    () => users.filter((item) => item.passwordExpiresAt).length,
    [users]
  );
  const enrollmentsByStudent = useMemo(() => {
    const grouped = new Map();

    for (const enrollment of enrollments) {
      const key = enrollment.userId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          student: enrollment.student,
          items: [],
        });
      }

      grouped.get(key).items.push(enrollment);
    }

    return Array.from(grouped.values()).sort((left, right) =>
      left.student.fullName.localeCompare(right.student.fullName, "es")
    );
  }, [enrollments]);
  const filteredEnrollmentsByStudent = useMemo(
    () =>
      enrollmentsByStudent
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            includesQuery(
              [
                group.student.fullName,
                group.student.email,
                item.course?.title,
                item.status,
                item.accessExpiresAt,
              ],
              viewFilters.enrollments
            )
          ),
        }))
        .filter((group) => group.items.length > 0),
    [enrollmentsByStudent, viewFilters.enrollments]
  );
  const filteredNews = useMemo(
    () =>
      (content.news ?? []).filter((item) =>
        includesQuery(
          [
            item.title,
            item.category,
            item.summary,
            item.link,
            item.embed,
            item.status,
            item.featured ? "destacada" : "normal",
            item.publishedAt,
          ],
          viewFilters.news
        )
      ),
    [content.news, viewFilters.news]
  );
  const filteredTestimonials = useMemo(
    () =>
      (content.testimonials ?? []).filter((item) =>
        includesQuery([item.author, item.organization, item.quote], viewFilters.testimonials)
      ),
    [content.testimonials, viewFilters.testimonials]
  );
  const filteredSupportTickets = useMemo(
    () =>
      (content.supportTickets ?? []).filter((item) =>
        includesQuery(
          [
            item.subject,
            item.description,
            item.category,
            item.status,
            item.priority,
            item.student?.fullName,
            item.student?.email,
            item.courseTitle,
            item.adminNote,
          ],
          viewFilters.tickets
        )
      ),
    [content.supportTickets, viewFilters.tickets]
  );
  const filteredCommunityThreads = useMemo(
    () =>
      (content.communityThreads ?? []).filter((item) =>
        includesQuery(
          [
            item.title,
            item.body,
            item.category,
            item.status,
            item.visibility,
            item.authorName,
            item.authorEmail,
            item.courseTitle,
            item.adminNote,
            ...(item.tags ?? []),
          ],
          viewFilters.communityThreads
        )
      ),
    [content.communityThreads, viewFilters.communityThreads]
  );
  const filteredCourseInterestRequests = useMemo(
    () =>
      (content.courseInterestRequests ?? []).filter((item) =>
        includesQuery(
          [
            item.courseTitle,
            item.status,
            item.student?.fullName,
            item.student?.email,
            item.contact?.channel,
            item.contact?.value,
            item.note,
            item.adminNote,
          ],
          viewFilters.courseRequests
        )
      ),
    [content.courseInterestRequests, viewFilters.courseRequests]
  );
  const globalSearchResults = useMemo(() => {
    const query = globalSearchQuery.trim();
    if (!query) {
      return [];
    }

    const results = [];

    for (const item of content.liveSessions ?? []) {
      if (includesQuery([item.title, item.format, item.date], query)) {
        results.push({ id: item.id, type: "Sesion", title: item.title, subtitle: `${item.format} · ${item.date}`, view: "identity" });
      }
    }
    for (const item of content.learningPath ?? []) {
      if (includesQuery([item.title, item.type, item.status], query)) {
        results.push({ id: item.id, type: "Modulo", title: item.title, subtitle: `${item.type} · ${item.status}`, view: "identity" });
      }
    }
    for (const item of institutions) {
      if (includesQuery([item.name, item.link, item.embed], query)) {
        results.push({ id: item.id, type: "Institucion", title: item.name, subtitle: item.link || "Sin enlace", view: "identity" });
      }
    }
    for (const item of content.courses ?? []) {
      if (includesQuery([item.title, item.audience, item.description, item.outcomes], query)) {
        results.push({ id: item.id, type: "Curso", title: item.title, subtitle: item.audience || item.format || "Catalogo", view: "catalog" });
      }
    }
    for (const item of content.news ?? []) {
      if (includesQuery([item.title, item.category, item.summary, item.link, item.embed], query)) {
        results.push({ id: item.id, type: "Noticia", title: item.title, subtitle: item.category || item.link || "Contenido", view: "community" });
      }
    }
    for (const item of content.communityThreads ?? []) {
      if (includesQuery([item.title, item.body, item.authorName, item.courseTitle, item.status, ...(item.tags ?? [])], query)) {
        results.push({ id: item.id, type: "Hilo", title: item.title, subtitle: `${item.authorName || "Estudiante"} · ${item.status || "open"}`, view: "community" });
      }
    }
    for (const item of users) {
      if (includesQuery([item.fullName, item.email, item.role, item.status], query)) {
        results.push({ id: item.id, type: "Usuario", title: item.fullName, subtitle: `${item.role} · ${item.email}`, view: "people" });
      }
    }
    for (const item of enrollments) {
      if (includesQuery([item.student?.fullName, item.student?.email, item.course?.title, item.status], query)) {
        results.push({ id: item.id, type: "Matricula", title: item.course?.title ?? item.courseId, subtitle: `${item.student?.fullName ?? "Sin estudiante"} · ${item.status}`, view: "people" });
      }
    }
    for (const item of content.news ?? []) {
      if (includesQuery([item.title, item.category, item.summary, item.link], query)) {
        results.push({ id: item.id, type: "Noticia", title: item.title, subtitle: item.category || "Noticias", view: "community" });
      }
    }
    for (const item of content.testimonials ?? []) {
      if (includesQuery([item.author, item.organization, item.quote], query)) {
        results.push({ id: item.id, type: "Testimonio", title: item.author, subtitle: item.organization || "Testimonio", view: "community" });
      }
    }
    for (const item of content.supportTickets ?? []) {
      if (includesQuery([item.subject, item.category, item.status, item.student?.fullName, item.student?.email], query)) {
        results.push({ id: item.id, type: "Ticket", title: item.subject, subtitle: `${item.status} · ${item.student?.fullName ?? "Sin estudiante"}`, view: "community" });
      }
    }
    for (const item of content.courseInterestRequests ?? []) {
      if (includesQuery([item.courseTitle, item.status, item.student?.fullName, item.student?.email, item.contact?.value], query)) {
        results.push({ id: item.id, type: "Solicitud", title: item.courseTitle, subtitle: `${item.status} · ${item.student?.fullName ?? "Sin estudiante"}`, view: "people" });
      }
    }

    return results;
  }, [content.communityThreads, content.courseInterestRequests, content.courses, content.learningPath, content.liveSessions, content.news, content.supportTickets, content.testimonials, enrollments, globalSearchQuery, institutions, users]);

  function closeModal() {
    setModal(null);
  }

  function updateViewFilter(key, value) {
    setViewFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openModal(nextModal) {
    setWorkspaceError("");
    setWorkspaceMessage("");
    setTemplateSelections({
      session: "",
      learning: "",
      course: "",
    });
    setModal(nextModal);
  }

  async function runAction(action, successMessage, { closeAfter = false } = {}) {
    setWorkspaceMessage("");
    setWorkspaceError("");

    try {
      await action();
      setWorkspaceMessage(successMessage);
      if (closeAfter) {
        closeModal();
      }
    } catch (error) {
      setWorkspaceError(error.message);
    }
  }

  function normalizeLandingForm() {
    return {
      ...landingForm,
      trustItems: String(landingForm.trustItems ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      socialLinks: {
        facebook: String(landingForm.socialLinks?.facebook ?? "").trim(),
        linkedin: String(landingForm.socialLinks?.linkedin ?? "").trim(),
      },
    };
  }

  function normalizeSecuritySettingsPayload() {
    const days = Number.parseInt(String(securitySettingsForm.passwordExpirationDays ?? "90"), 10);

    return {
      allowAdminPasswordChange: Boolean(securitySettingsForm.allowAdminPasswordChange),
      allowAdminResetNotification: Boolean(securitySettingsForm.allowAdminResetNotification),
      allowAdminVerificationNotification: Boolean(securitySettingsForm.allowAdminVerificationNotification),
      requireEmailVerification: Boolean(securitySettingsForm.requireEmailVerification),
      passwordExpirationEnabled: Boolean(securitySettingsForm.passwordExpirationEnabled),
      passwordExpirationDays: Number.isInteger(days) && days >= 1 ? days : 90,
      supportEmail: String(securitySettingsForm.supportEmail ?? "").trim() || "it@gobeyondcr.org",
    };
  }

  function updateTemplateSelection(kind, value) {
    setTemplateSelections((current) => ({
      ...current,
      [kind]: value,
    }));
  }

  async function saveMaterialTemplate(kind, sourceForm) {
    const templateName = sourceForm.title?.trim();
    if (!templateName) {
      throw new Error("Agrega primero un titulo para guardar la plantilla.");
    }

    const payload =
      kind === "session"
        ? {
            title: sourceForm.title,
            format: sourceForm.format,
            dateInput: sourceForm.dateInput,
            timeInput: sourceForm.timeInput,
          }
        : kind === "learning"
          ? {
              title: sourceForm.title,
              type: sourceForm.type,
              status: sourceForm.status,
            }
          : {
              title: sourceForm.title,
              audience: sourceForm.audience,
              format: sourceForm.format,
              duration: sourceForm.duration,
              description: sourceForm.description,
              outcomes: sourceForm.outcomes,
            };

    await createCollectionItem("materialTemplates", {
      id: createItemId(`template-${kind}`),
      kind,
      name: templateName,
      payload,
    });
  }

  function applyMaterialTemplate(kind) {
    const selectedId = templateSelections[kind];
    const template = materialTemplates.find((item) => item.id === selectedId && item.kind === kind);

    if (!template) {
      throw new Error("Selecciona una plantilla valida.");
    }

    if (kind === "session") {
      setSessionForm((current) => ({
        ...current,
        ...template.payload,
        date: formatSessionLabel(template.payload.dateInput, template.payload.timeInput),
      }));
      return;
    }

    if (kind === "learning") {
      setLearningForm((current) => ({
        ...current,
        ...template.payload,
      }));
      return;
    }

    setCourseForm((current) => ({
      ...current,
      ...template.payload,
    }));
  }

  function startCreateSession() {
    setSessionForm(initialSessionForm);
    openModal("session");
  }

  function startEditSession(item) {
    const parts = parseSessionDateParts(item.date);
    setSessionForm({
      id: item.id,
      title: item.title,
      date: item.date,
      dateInput: parts.dateInput,
      timeInput: parts.timeInput,
      format: item.format,
    });
    openModal("session");
  }

  function startCreateLearning() {
    setLearningForm(initialLearningForm);
    openModal("learning");
  }

  function startEditLearning(item) {
    setLearningForm({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
    });
    openModal("learning");
  }

  function startCreateCourse() {
    setCourseForm(initialCourseForm);
    setAssignmentDraft(initialAssignmentDraft);
    setRuleDraft(initialRuleDraft);
    openModal("course");
  }

  function startEditCourse(item) {
    setCourseForm({
      id: item.id,
      title: item.title,
      audience: item.audience,
      format: item.format,
      duration: item.duration,
      description: item.description,
      outcomes: item.outcomes,
      coverImage: item.coverImage ?? "",
      detailSummary: item.detailSummary ?? "",
      assignments: item.assignments ?? [],
      gamificationRules: item.gamificationRules ?? [],
    });
    setAssignmentDraft(initialAssignmentDraft);
    setRuleDraft(initialRuleDraft);
    openModal("course");
  }

  function startEditSupportTicket(item) {
    setSupportTicketForm({
      id: item.id,
      status: item.status || "open",
      priority: item.priority || "normal",
      adminNote: item.adminNote || "",
    });
    openModal("supportTicket");
  }

  function startEditCommunityThread(item) {
    setCommunityThreadForm({
      id: item.id,
      status: item.status || "open",
      visibility: item.visibility || "visible",
      bestReplyId: item.bestReplyId || "",
      adminNote: item.adminNote || "",
    });
    openModal("communityThread");
  }

  function startEditCourseInterest(item) {
    setCourseInterestForm({
      id: item.id,
      status: item.status || "open",
      adminNote: item.adminNote || "",
    });
    openModal("courseInterest");
  }

  function startCreateUser() {
    setUserForm(initialUserForm);
    openModal("user");
  }

  function startEditUser(user) {
    setUserForm({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    openModal("user");
  }

  function startCreateEnrollment() {
    setEnrollmentForm(initialEnrollmentForm);
    openModal("enrollment");
  }

  function startCreateEnrollmentForStudent(studentId) {
    setEnrollmentForm({
      ...initialEnrollmentForm,
      userId: studentId,
    });
    openModal("enrollment");
  }

  function saveAssignmentDraft() {
    if (!assignmentDraft.title.trim()) {
      throw new Error("Agrega un titulo a la asignacion.");
    }

    const nextAssignment = {
      ...assignmentDraft,
      id: assignmentDraft.id || createItemId("assignment"),
    };

    setCourseForm((current) => {
      const assignments = [...(current.assignments ?? [])];
      const currentIndex = assignments.findIndex((item) => item.id === nextAssignment.id);

      if (currentIndex >= 0) {
        assignments[currentIndex] = nextAssignment;
      } else {
        assignments.push(nextAssignment);
      }

      return {
        ...current,
        assignments,
      };
    });

    setAssignmentDraft(initialAssignmentDraft);
  }

  function editAssignmentDraft(item) {
    setAssignmentDraft(item);
  }

  function removeAssignment(itemId) {
    setCourseForm((current) => ({
      ...current,
      assignments: (current.assignments ?? []).filter((item) => item.id !== itemId),
    }));

    if (assignmentDraft.id === itemId) {
      setAssignmentDraft(initialAssignmentDraft);
    }
  }

  async function uploadMedia(file, purpose) {
    if (!file) {
      throw new Error("Archivo requerido.");
    }

    return uploadAsset(file, purpose);
  }

  function saveRuleDraft() {
    if (!ruleDraft.title.trim()) {
      throw new Error("Agrega un titulo a la regla.");
    }

    const nextRule = {
      ...ruleDraft,
      id: ruleDraft.id || createItemId("rule"),
      points: String(ruleDraft.points || "0"),
    };

    setCourseForm((current) => {
      const rules = [...(current.gamificationRules ?? [])];
      const currentIndex = rules.findIndex((item) => item.id === nextRule.id);

      if (currentIndex >= 0) {
        rules[currentIndex] = nextRule;
      } else {
        rules.push(nextRule);
      }

      return {
        ...current,
        gamificationRules: rules,
      };
    });

    setRuleDraft(initialRuleDraft);
  }

  function editRuleDraft(item) {
    setRuleDraft(item);
  }

  function removeRule(itemId) {
    setCourseForm((current) => ({
      ...current,
      gamificationRules: (current.gamificationRules ?? []).filter((item) => item.id !== itemId),
    }));

    if (ruleDraft.id === itemId) {
      setRuleDraft(initialRuleDraft);
    }
  }

  function startEditEnrollment(item) {
    setEnrollmentForm({
      id: item.id,
      userId: item.userId,
      courseId: item.courseId,
      accessDays: "45",
      accessExpiresAt: item.accessExpiresAt?.slice(0, 10) ?? "",
      status: item.status,
      gamificationEnabled: Boolean(item.enhancement?.gamificationEnabled),
      progressPercent: String(item.enhancement?.progressPercent ?? 0),
      points: String(item.enhancement?.points ?? 0),
      streakDays: String(item.enhancement?.streakDays ?? 0),
    });
    openModal("enrollment");
  }

  function startCreateTestimonial() {
    setTestimonialForm(initialTestimonialForm);
    openModal("testimonial");
  }

  function startCreateNews() {
    setNewsForm(initialNewsForm);
    openModal("news");
  }

  function startEditNews(item) {
    setNewsForm({
      id: item.id,
      title: item.title ?? "",
      category: item.category ?? "",
      summary: item.summary ?? "",
      link: item.link ?? "",
      embed: item.embed ?? "",
      status: item.status ?? "published",
      featured: Boolean(item.featured),
      publishedAt: String(item.publishedAt ?? "").slice(0, 10),
    });
    openModal("news");
  }

  function startCreateInstitution() {
    setInstitutionForm(initialInstitutionForm);
    openModal("institution");
  }

  function startEditInstitution(item) {
    setInstitutionForm({
      id: item.id,
      name: item.name ?? "",
      link: item.link ?? "",
      embed: item.embed ?? "",
      featured: item.featured !== false,
    });
    openModal("institution");
  }

  async function saveBrand(event) {
    event.preventDefault();
    await runAction(() => updateSection("brand", brandForm), "Marca actualizada.", { closeAfter: true });
  }

  async function saveHero(event) {
    event.preventDefault();
    await runAction(() => updateSection("hero", heroForm), "Hero actualizado.", { closeAfter: true });
  }

  async function saveLanding(event) {
    event.preventDefault();
    await runAction(
      () => updateSection("landing", normalizeLandingForm()),
      "Narrativa institucional actualizada.",
      { closeAfter: true }
    );
  }

  async function saveSecuritySettings() {
    await runAction(
      () => updateSection("securitySettings", normalizeSecuritySettingsPayload()),
      "Politica de contrasenas actualizada."
    );
  }

  async function saveSession(event) {
    event.preventDefault();
    if (!sessionForm.title.trim()) {
      throw new Error("La sesion necesita un titulo.");
    }

    const payload = {
      id: sessionForm.id || createItemId("session"),
      title: sessionForm.title,
      format: sessionForm.format,
      dateInput: sessionForm.dateInput,
      timeInput: sessionForm.timeInput,
      date: formatSessionLabel(sessionForm.dateInput, sessionForm.timeInput),
    };

    await runAction(
      () =>
        sessionForm.id
          ? updateCollectionItem("liveSessions", sessionForm.id, payload)
          : createCollectionItem("liveSessions", payload),
      sessionForm.id ? "Sesion actualizada." : "Sesion creada.",
      { closeAfter: true }
    );
  }

  async function saveLearning(event) {
    event.preventDefault();
    if (!learningForm.title.trim()) {
      throw new Error("El modulo necesita un titulo.");
    }

    const payload = {
      ...learningForm,
      id: learningForm.id || createItemId("learning"),
    };
    await runAction(
      () =>
        learningForm.id
          ? updateCollectionItem("learningPath", learningForm.id, payload)
          : createCollectionItem("learningPath", payload),
      learningForm.id ? "Modulo actualizado." : "Modulo creado.",
      { closeAfter: true }
    );
  }

  async function saveCourse(event) {
    event.preventDefault();
    if (!courseForm.title.trim()) {
      throw new Error("Curso es requerido.");
    }

    const payload = {
      id: courseForm.id || createItemId("course"),
      title: courseForm.title,
      audience: courseForm.audience,
      format: courseForm.format,
      duration: courseForm.duration,
      description: courseForm.description,
      outcomes: courseForm.outcomes,
      coverImage: courseForm.coverImage,
      detailSummary: courseForm.detailSummary,
      assignments: courseForm.assignments ?? [],
      gamificationRules: courseForm.gamificationRules ?? [],
    };

    await runAction(
      () =>
        courseForm.id
          ? updateCollectionItem("courses", courseForm.id, payload)
          : createCollectionItem("courses", payload),
      courseForm.id ? "Curso actualizado." : "Curso creado.",
      { closeAfter: true }
    );
  }

  async function saveUser(event) {
    event.preventDefault();
    const payload = {
      fullName: userForm.fullName,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
    };
    const successMessage = userForm.id
      ? "Usuario actualizado."
      : securitySettingsForm.requireEmailVerification && payload.role === "student"
        ? "Usuario creado. La cuenta queda pendiente hasta verificar el correo."
        : "Usuario creado.";

    await runAction(
      () => (userForm.id ? updateUser(userForm.id, payload) : createUser({ ...payload, password: userForm.password })),
      successMessage,
      { closeAfter: true }
    );
  }

  async function saveManagedUserPassword() {
    if (!userForm.id) {
      throw new Error("Debes abrir un usuario existente para actualizar su contrasena.");
    }

    if (!userForm.password.trim()) {
      throw new Error("Ingresa una nueva contrasena segura.");
    }

    await runAction(
      async () => {
        await changeUserPassword(userForm.id, { password: userForm.password });
        setUserForm((current) => ({
          ...current,
          password: "",
        }));
      },
      "Contrasena actualizada. Las sesiones activas del usuario fueron cerradas."
    );
  }

  async function sendManagedUserPasswordReset() {
    if (!userForm.id) {
      throw new Error("Debes abrir un usuario existente para enviar el enlace.");
    }

    await runAction(
      () => notifyUserPasswordReset(userForm.id),
      "Notificacion de recuperacion enviada al usuario."
    );
  }

  async function sendManagedUserVerification() {
    if (!userForm.id) {
      throw new Error("Debes abrir un usuario existente para enviar el enlace.");
    }

    await runAction(
      () => notifyUserVerification(userForm.id),
      "Notificacion de verificacion enviada al usuario."
    );
  }

  async function deleteManagedUserAccount() {
    if (!userForm.id) {
      throw new Error("Debes abrir un usuario existente para eliminar la cuenta.");
    }

    await runAction(
      async () => {
        await removeUser(userForm.id);
      },
      "Cuenta eliminada.",
      { closeAfter: true }
    );
  }

  async function saveEnrollment(event) {
    event.preventDefault();
    const payload = enrollmentForm.id
      ? {
          status: enrollmentForm.status,
          accessExpiresAt: enrollmentForm.accessExpiresAt,
          gamificationEnabled: enrollmentForm.gamificationEnabled,
          progressPercent: enrollmentForm.progressPercent,
          points: enrollmentForm.points,
          streakDays: enrollmentForm.streakDays,
        }
      : {
          userId: enrollmentForm.userId,
          courseId: enrollmentForm.courseId,
          accessDays: enrollmentForm.accessDays,
          status: enrollmentForm.status,
          gamificationEnabled: enrollmentForm.gamificationEnabled,
          progressPercent: enrollmentForm.progressPercent,
          points: enrollmentForm.points,
          streakDays: enrollmentForm.streakDays,
        };

    await runAction(
      () => (enrollmentForm.id ? updateEnrollment(enrollmentForm.id, payload) : createEnrollment(payload)),
      enrollmentForm.id ? "Matricula actualizada." : "Matricula creada.",
      { closeAfter: true }
    );
  }

  async function saveTestimonial(event) {
    event.preventDefault();
    await runAction(
      () =>
        createCollectionItem("testimonials", {
          id: createItemId("testimonial"),
          ...testimonialForm,
          status: "approved",
        }),
      "Testimonio publicado.",
      { closeAfter: true }
    );
  }

  async function saveNews(event) {
    event.preventDefault();
    if (!newsForm.title.trim()) {
      throw new Error("La noticia necesita un titulo.");
    }

    const normalizedPublishedAt = String(newsForm.publishedAt ?? "").trim();
    const effectivePublishedAt =
      normalizedPublishedAt || newsForm.status === "published"
        ? normalizedPublishedAt || new Date().toISOString().slice(0, 10)
        : "";

    const payload = {
      id: newsForm.id || createItemId("news"),
      title: newsForm.title,
      category: newsForm.category,
      summary: newsForm.summary,
      link: newsForm.link,
      embed: newsForm.embed,
      image: itemOrFallbackImage(newsForm),
      status: newsForm.status,
      featured: Boolean(newsForm.featured),
      publishedAt: effectivePublishedAt,
    };

    await runAction(
      () => (newsForm.id ? updateCollectionItem("news", newsForm.id, payload) : createCollectionItem("news", payload)),
      newsForm.id ? "Noticia actualizada." : "Noticia creada.",
      { closeAfter: true }
    );
  }

  function itemOrFallbackImage(item) {
    return item.image ?? "";
  }

  async function saveInstitution(event) {
    event.preventDefault();
    if (!institutionForm.name.trim()) {
      throw new Error("La institucion necesita un nombre.");
    }

    const payload = {
      id: institutionForm.id || createItemId("institution"),
      name: institutionForm.name,
      link: institutionForm.link,
      embed: institutionForm.embed,
      featured: institutionForm.featured,
    };

    await runAction(
      () =>
        institutionForm.id
          ? updateCollectionItem("institutions", institutionForm.id, payload)
          : createCollectionItem("institutions", payload),
      institutionForm.id ? "Institucion actualizada." : "Institucion creada.",
      { closeAfter: true }
    );
  }

  async function approveTestimonialSubmission(item) {
    await runAction(
      async () => {
        await createCollectionItem("testimonials", {
          id: createItemId("testimonial"),
          quote: item.quote,
          author: item.author,
          organization: item.organization,
          status: "approved",
        });
        await deleteCollectionItem("testimonialSubmissions", item.id);
      },
      "Testimonio aprobado."
    );
  }

  function renderIdentityView() {
    return (
      <IdentitySection
        content={content}
        deleteCollectionItem={deleteCollectionItem}
        filteredInstitutions={filteredInstitutions}
        filteredLearning={filteredLearning}
        filteredMediaLibrary={filteredMediaLibrary}
        filteredSessions={filteredSessions}
        institutions={institutions}
        mediaLibrary={mediaLibrary}
        openModal={openModal}
        startCreateInstitution={startCreateInstitution}
        startCreateLearning={startCreateLearning}
        startCreateSession={startCreateSession}
        startEditInstitution={startEditInstitution}
        startEditLearning={startEditLearning}
        startEditSession={startEditSession}
        updateViewFilter={updateViewFilter}
        viewFilters={viewFilters}
      />
    );
  }

  function renderCatalogView() {
    return (
      <CatalogSection
        courseTemplates={courseTemplates}
        deleteCollectionItem={deleteCollectionItem}
        filteredCourses={filteredCourses}
        startCreateCourse={startCreateCourse}
        startEditCourse={startEditCourse}
        updateViewFilter={updateViewFilter}
        viewFilters={viewFilters}
      />
    );
  }

  async function saveSupportTicket(event) {
    event.preventDefault();

    const currentTicket = (content.supportTickets ?? []).find((item) => item.id === supportTicketForm.id);
    if (!currentTicket) {
      throw new Error("Ticket no encontrado.");
    }

    const nextStatus = supportTicketForm.status;
    const isClosingNow = nextStatus === "closed" && currentTicket.status !== "closed";
    const isReopening = nextStatus !== "closed" && currentTicket.status === "closed";

    await runAction(
      () =>
        updateCollectionItem("supportTickets", currentTicket.id, {
          ...currentTicket,
          status: nextStatus,
          priority: supportTicketForm.priority,
          adminNote: supportTicketForm.adminNote.trim(),
          closedAt: isClosingNow ? new Date().toISOString() : isReopening ? "" : currentTicket.closedAt || "",
          updatedAt: new Date().toISOString(),
        }),
      "Ticket actualizado.",
      { closeAfter: true }
    );
  }

  async function saveCommunityThread(event) {
    event.preventDefault();

    const currentThread = (content.communityThreads ?? []).find((item) => item.id === communityThreadForm.id);
    if (!currentThread) {
      throw new Error("Hilo no encontrado.");
    }

    const bestReplyId = String(communityThreadForm.bestReplyId ?? "").trim();
    if (bestReplyId && !(currentThread.replies ?? []).some((reply) => reply.id === bestReplyId)) {
      throw new Error("La respuesta seleccionada ya no existe.");
    }

    await runAction(
      () =>
        updateCollectionItem("communityThreads", currentThread.id, {
          ...currentThread,
          status: communityThreadForm.status,
          visibility: communityThreadForm.visibility,
          bestReplyId,
          adminNote: communityThreadForm.adminNote.trim(),
          lastAdminActionAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      "Hilo actualizado.",
      { closeAfter: true }
    );
  }

  async function saveCourseInterest(event) {
    event.preventDefault();

    const currentRequest = (content.courseInterestRequests ?? []).find((item) => item.id === courseInterestForm.id);
    if (!currentRequest) {
      throw new Error("Solicitud no encontrada.");
    }

    const nextStatus = courseInterestForm.status;
    const isClosingNow = nextStatus === "closed" && currentRequest.status !== "closed";
    const isReopening = nextStatus !== "closed" && currentRequest.status === "closed";

    await runAction(
      () =>
        updateCollectionItem("courseInterestRequests", currentRequest.id, {
          ...currentRequest,
          status: nextStatus,
          adminNote: courseInterestForm.adminNote.trim(),
          closedAt: isClosingNow ? new Date().toISOString() : isReopening ? "" : currentRequest.closedAt || "",
          updatedAt: new Date().toISOString(),
        }),
      "Solicitud actualizada.",
      { closeAfter: true }
    );
  }

  function renderPeopleView() {
    return (
      <PeopleSection
        expiredUsersCount={expiredUsersCount}
        enrollmentsLoading={enrollmentsLoading}
        filteredCourseInterestRequests={filteredCourseInterestRequests}
        filteredEnrollmentsByStudent={filteredEnrollmentsByStudent}
        filteredUsers={filteredUsers}
        formatDate={formatDate}
        removeEnrollment={removeEnrollment}
        saveSecuritySettings={saveSecuritySettings}
        securitySettingsForm={securitySettingsForm}
        setSecuritySettingsForm={setSecuritySettingsForm}
        startCreateEnrollment={startCreateEnrollment}
        startCreateEnrollmentForStudent={startCreateEnrollmentForStudent}
        startCreateUser={startCreateUser}
        startEditCourseInterest={startEditCourseInterest}
        startEditEnrollment={startEditEnrollment}
        startEditUser={startEditUser}
        updateViewFilter={updateViewFilter}
        usersWithPasswordScheduleCount={usersWithPasswordScheduleCount}
        usersLoading={usersLoading}
        viewFilters={viewFilters}
      />
    );
  }

  function renderCommunityView() {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="Foro estudiantil"
          description="Modera los hilos reales de /comunidad, define visibilidad, marca la mejor respuesta y revisa la expiracion automatica a 6 meses."
        >
          <SectionToolbar
            helper={`${filteredCommunityThreads.filter((item) => item.status === "open").length} abiertos · ${filteredCommunityThreads.filter((item) => item.visibility === "hidden").length} ocultos · ${filteredCommunityThreads.length} visibles con el filtro actual.`}
          >
            <FilterInput
              onChange={(event) => updateViewFilter("communityThreads", event.target.value)}
              placeholder="Filtrar hilos por titulo, estudiante, curso, estado, visibilidad o etiqueta"
              value={viewFilters.communityThreads}
            />
          </SectionToolbar>
          <ScrollArea>
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredCommunityThreads.length ? (
                filteredCommunityThreads.map((item) => (
                  <RowCard
                    key={item.id}
                    eyebrow={`${item.category || "general"} · ${item.visibility === "hidden" ? "oculto" : item.status || "open"}`}
                    title={item.title}
                    meta={`${item.authorName || "Sin autor"}${item.courseTitle ? ` · ${item.courseTitle}` : ""} · ${(item.replies ?? []).length} respuestas · expira ${formatDate(item.expiresAt)}`}
                    body={item.body}
                  >
                    <SecondaryButton onClick={() => startEditCommunityThread(item)} type="button">
                      Gestionar hilo
                    </SecondaryButton>
                    <SecondaryButton onClick={() => deleteCollectionItem("communityThreads", item.id)} type="button">
                      Eliminar
                    </SecondaryButton>
                  </RowCard>
                ))
              ) : (
                <EmptyState title="No hay hilos que coincidan" body="Los hilos publicados por estudiantes desde /comunidad apareceran aqui para moderacion y seguimiento." />
              )}
            </div>
          </ScrollArea>
        </SectionCard>

        <SectionCard
          title="Noticias y novedades"
          description="Esta area funciona como un bloque editorial completamente editable desde admin: imagen, resumen, enlace y orden por aparicion."
        >
          <SectionToolbar
            action={
              <ActionButton onClick={startCreateNews} type="button">
                Crear noticia
              </ActionButton>
            }
          >
            <FilterInput
              onChange={(event) => updateViewFilter("news", event.target.value)}
              placeholder="Filtrar noticias por titulo, categoria, resumen o enlace"
              value={viewFilters.news}
            />
          </SectionToolbar>
          <ScrollArea>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredNews.length ? (
              filteredNews.map((item) => (
                <RowCard
                  key={item.id}
                  eyebrow={`${item.category || "Noticia"} · ${
                    item.status === "draft" ? "Borrador" : item.featured ? "Destacada" : "Publicada"
                  }`}
                  title={item.title}
                  meta={
                    [item.publishedAt ? `Publicacion ${formatDate(item.publishedAt)}` : "", item.link || "Sin enlace externo"]
                      .filter(Boolean)
                      .join(" · ")
                  }
                  body={item.summary}
                >
                  <SecondaryButton onClick={() => startEditNews(item)} type="button">
                    Editar
                  </SecondaryButton>
                  <SecondaryButton onClick={() => deleteCollectionItem("news", item.id)} type="button">
                    Eliminar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="No hay noticias que coincidan" body="Crea una nueva o ajusta el filtro para encontrar otra." />
            )}
          </div>
          </ScrollArea>
        </SectionCard>

        <SectionCard
          title="Tickets de soporte"
          description="Aqui ves los mini-tickets creados desde el portal estudiantil cuando alguien necesita ayuda o seguimiento administrativo."
        >
          <SectionToolbar
            helper={`${filteredSupportTickets.filter((item) => item.status === "open").length} abiertos · ${filteredSupportTickets.length} visibles con el filtro actual.`}
          >
            <FilterInput
              onChange={(event) => updateViewFilter("tickets", event.target.value)}
              placeholder="Filtrar tickets por asunto, estudiante, curso, estado o categoria"
              value={viewFilters.tickets}
            />
          </SectionToolbar>
          <ScrollArea>
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredSupportTickets.length ? (
                filteredSupportTickets.map((item) => (
                  <RowCard
                    key={item.id}
                    eyebrow={`${item.category || "soporte"} · ${item.status || "open"}`}
                    title={item.subject}
                    meta={`${item.student?.fullName ?? "Sin estudiante"} · ${item.student?.email ?? "Sin correo"}${item.courseTitle ? ` · ${item.courseTitle}` : ""}`}
                    body={item.description}
                  >
                    <SecondaryButton onClick={() => startEditSupportTicket(item)} type="button">
                      Gestionar ticket
                    </SecondaryButton>
                  </RowCard>
                ))
              ) : (
                <EmptyState title="No hay tickets que coincidan" body="Cuando un estudiante solicite ayuda desde el portal, el ticket aparecera aqui." />
              )}
            </div>
          </ScrollArea>
        </SectionCard>

        <SectionCard
          title="Testimonios y comunidad"
          description="Publica testimonios desde un editor limpio y modera lo que llega del formulario publico sin saturar la pantalla."
        >
          <SectionToolbar
            action={
              <ActionButton onClick={startCreateTestimonial} type="button">
                Crear testimonio
              </ActionButton>
            }
          >
            <FilterInput
              onChange={(event) => updateViewFilter("testimonials", event.target.value)}
              placeholder="Filtrar testimonios por autor, institucion o contenido"
              value={viewFilters.testimonials}
            />
          </SectionToolbar>
          <ScrollArea>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTestimonials.length ? (
              filteredTestimonials.map((item) => (
                <RowCard key={item.id} title={item.author} meta={item.organization} body={`“${item.quote}”`}>
                  <SecondaryButton onClick={() => deleteCollectionItem("testimonials", item.id)} type="button">
                    Eliminar
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState title="No hay testimonios que coincidan" body="Crea uno nuevo o ajusta el filtro actual." />
            )}
          </div>
          </ScrollArea>

          <div className="mt-8 border-t border-[#eadfce] pt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Moderacion</p>
                <h4 className="mt-2 font-['Georgia'] text-2xl text-[#20181f]">Pendientes de aprobacion</h4>
              </div>
              <p className="text-sm text-[#6d5a51]">{content.testimonialSubmissions?.length ?? 0} esperando revision</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {content.testimonialSubmissions?.length ? (
                content.testimonialSubmissions.map((item) => (
                  <RowCard key={item.id} title={item.author} meta={item.organization} body={`“${item.quote}”`}>
                    <ActionButton onClick={() => approveTestimonialSubmission(item)} type="button">
                      Aprobar
                    </ActionButton>
                    <SecondaryButton onClick={() => deleteCollectionItem("testimonialSubmissions", item.id)} type="button">
                      Rechazar
                    </SecondaryButton>
                  </RowCard>
                ))
              ) : (
                <EmptyState title="Todo al dia" body="No hay testimonios esperando moderacion en este momento." />
              )}
            </div>
          </div>
        </SectionCard>
      </div>
      );
    }

  function renderSearchView() {
    return (
      <SectionCard
        title="Resultados de busqueda"
        description="Usa esta vista para encontrar objetos en toda la cabina sin recorrer cada apartado manualmente."
      >
        <div className="mb-4">
          <FilterInput
            onChange={(event) => setGlobalSearchQuery(event.target.value)}
            placeholder="Busca cursos, sesiones, usuarios, matriculas, noticias, testimonios o instituciones"
            value={globalSearchQuery}
          />
        </div>
        <ScrollArea>
          <div className="grid gap-4">
            {globalSearchResults.length ? (
              globalSearchResults.map((item) => (
                <RowCard key={`${item.type}-${item.id}`} eyebrow={item.type} title={item.title} meta={item.subtitle}>
                  <SecondaryButton onClick={() => setActiveView(item.view)} type="button">
                    Abrir seccion
                  </SecondaryButton>
                </RowCard>
              ))
            ) : (
              <EmptyState
                title="Sin resultados por ahora"
                body="Escribe una palabra relacionada con el contenido que buscas para ver coincidencias en toda la plataforma."
              />
            )}
          </div>
        </ScrollArea>
      </SectionCard>
    );
  }

  function renderModal() {
    if (!modal) {
      return null;
    }

    if (modal === "brand") {
      return (
        <ModalShell
          title="Editar marca"
          subtitle="Aqui ajustas nombre, tagline y descripcion institucional."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveBrand}>
            <Input value={brandForm.name} onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })} placeholder="Nombre del proyecto" />
            <Input value={brandForm.tagline} onChange={(event) => setBrandForm({ ...brandForm, tagline: event.target.value })} placeholder="Tagline" />
            <Textarea value={brandForm.description} onChange={(event) => setBrandForm({ ...brandForm, description: event.target.value })} placeholder="Descripcion" />
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar marca</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

    if (modal === "hero") {
      return (
        <ModalShell
          title="Editar hero"
          subtitle="Ajusta la promesa principal del landing sin mezclarla con otras acciones del panel."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveHero}>
            <Input value={heroForm.eyebrow} onChange={(event) => setHeroForm({ ...heroForm, eyebrow: event.target.value })} placeholder="Eyebrow" />
            <Input value={heroForm.title} onChange={(event) => setHeroForm({ ...heroForm, title: event.target.value })} placeholder="Titulo" />
            <Textarea value={heroForm.description} onChange={(event) => setHeroForm({ ...heroForm, description: event.target.value })} placeholder="Descripcion" />
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar hero</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

      if (modal === "landing") {
        return (
          <ModalShell
            title="Editar narrativa institucional"
            subtitle="Usa este editor para la historia principal, relevancia laboral y bloque de contacto. Las instituciones aliadas ahora se gestionan en su propia cabina."
            onClose={closeModal}
          >
            <form className="grid gap-4" onSubmit={saveLanding}>
            <Input value={landingForm.aboutTitle} onChange={(event) => setLandingForm({ ...landingForm, aboutTitle: event.target.value })} placeholder="Titulo sobre nosotros" />
            <Textarea value={landingForm.aboutBody} onChange={(event) => setLandingForm({ ...landingForm, aboutBody: event.target.value })} placeholder="Texto principal" />
            <Textarea value={landingForm.aboutBodyTwo} onChange={(event) => setLandingForm({ ...landingForm, aboutBodyTwo: event.target.value })} placeholder="Texto secundario" />
              <Textarea value={landingForm.relevanceBody} onChange={(event) => setLandingForm({ ...landingForm, relevanceBody: event.target.value })} placeholder="Texto de relevancia laboral" />
              <Textarea value={landingForm.contactBody} onChange={(event) => setLandingForm({ ...landingForm, contactBody: event.target.value })} placeholder="Texto de contacto" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={landingForm.socialLinks?.facebook ?? ""}
                  onChange={(event) =>
                    setLandingForm((current) => ({
                      ...current,
                      socialLinks: {
                        ...current.socialLinks,
                        facebook: event.target.value,
                      },
                    }))
                  }
                  placeholder="Link de Facebook"
                />
                <Input
                  value={landingForm.socialLinks?.linkedin ?? ""}
                  onChange={(event) =>
                    setLandingForm((current) => ({
                      ...current,
                      socialLinks: {
                        ...current.socialLinks,
                        linkedin: event.target.value,
                      },
                    }))
                  }
                  placeholder="Link de LinkedIn"
                />
              </div>
              <div className="flex gap-3">
                <ActionButton type="submit">Guardar narrativa</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
          </form>
        </ModalShell>
      );
    }

    if (modal === "session") {
      return (
        <ModalShell
          title={sessionForm.id ? "Editar sesion" : "Crear sesion"}
          subtitle="Cada sesion aparece luego como fila en la vista principal, sin saturar el panel con formularios permanentes."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveSession}>
              <div className="grid gap-3 border border-[#eadfce] bg-[#fbf8f2] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Plantillas de sesiones</p>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Select
                    value={templateSelections.session}
                    onChange={(event) => updateTemplateSelection("session", event.target.value)}
                  >
                    <option value="">Selecciona una plantilla guardada</option>
                    {sessionTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                  <SecondaryButton
                    onClick={() =>
                      runAction(() => Promise.resolve(applyMaterialTemplate("session")), "Plantilla aplicada.")
                    }
                    type="button"
                  >
                    Autorrellenar
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() =>
                      runAction(() => saveMaterialTemplate("session", sessionForm), "Plantilla guardada.")
                    }
                    type="button"
                  >
                    Guardar plantilla
                  </SecondaryButton>
                </div>
              </div>
              <Input value={sessionForm.title} onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })} placeholder="Titulo de la sesion" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="date"
                  value={sessionForm.dateInput}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      dateInput: event.target.value,
                      date: formatSessionLabel(event.target.value, current.timeInput),
                    }))
                  }
                />
                <Input
                  type="time"
                  value={sessionForm.timeInput}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      timeInput: event.target.value,
                      date: formatSessionLabel(current.dateInput, event.target.value),
                    }))
                  }
                />
              </div>
              <Select value={sessionForm.format} onChange={(event) => setSessionForm({ ...sessionForm, format: event.target.value })}>
                <option value="Sincronica">Sincronica</option>
                <option value="Asincronica">Asincronica</option>
              </Select>
              <div className="flex gap-3">
                <ActionButton type="submit">{sessionForm.id ? "Guardar cambios" : "Crear sesion"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={sessionForm.format || "Sesion"}
              title={sessionForm.title || "Titulo de la sesion"}
              meta={sessionForm.date || "Fecha y hora de la sesion"}
              body="Vista previa de como se ordenara esta sesion dentro del listado principal."
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "learning") {
      return (
        <ModalShell
          title={learningForm.id ? "Editar modulo" : "Crear modulo"}
          subtitle="Piensa cada item como una pieza breve y clara dentro de la ruta de aprendizaje."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveLearning}>
              <div className="grid gap-3 border border-[#eadfce] bg-[#fbf8f2] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Plantillas de modulos</p>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Select
                    value={templateSelections.learning}
                    onChange={(event) => updateTemplateSelection("learning", event.target.value)}
                  >
                    <option value="">Selecciona una plantilla guardada</option>
                    {learningTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                  <SecondaryButton
                    onClick={() =>
                      runAction(() => Promise.resolve(applyMaterialTemplate("learning")), "Plantilla aplicada.")
                    }
                    type="button"
                  >
                    Autorrellenar
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() =>
                      runAction(() => saveMaterialTemplate("learning", learningForm), "Plantilla guardada.")
                    }
                    type="button"
                  >
                    Guardar plantilla
                  </SecondaryButton>
                </div>
              </div>
              <Input value={learningForm.title} onChange={(event) => setLearningForm({ ...learningForm, title: event.target.value })} placeholder="Titulo del modulo" />
              <Select value={learningForm.type} onChange={(event) => setLearningForm({ ...learningForm, type: event.target.value })}>
                <option value="Asincronico">Asincronico</option>
                <option value="Sincronico">Sincronico</option>
                <option value="Mentoria">Mentoria</option>
              </Select>
              <Textarea value={learningForm.status} onChange={(event) => setLearningForm({ ...learningForm, status: event.target.value })} placeholder="Estado o enfoque del modulo" />
              <div className="flex gap-3">
                <ActionButton type="submit">{learningForm.id ? "Guardar cambios" : "Crear modulo"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={learningForm.type || "Ruta"}
              title={learningForm.title || "Titulo del modulo"}
              body={learningForm.status || "La descripcion breve del modulo aparecera aqui como vista previa."}
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "course") {
      return (
        <ModalShell
          title={courseForm.id ? "Editar curso" : "Crear curso"}
          subtitle="Aqui trabajas el curso completo y a la derecha ves un preview cercano a la tarjeta final que vera el estudiante."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveCourse}>
              <div className="grid gap-3 border border-[#eadfce] bg-[#fbf8f2] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Plantillas de cursos</p>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Select
                    value={templateSelections.course}
                    onChange={(event) => updateTemplateSelection("course", event.target.value)}
                  >
                    <option value="">Selecciona una plantilla guardada</option>
                    {courseTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                  <SecondaryButton
                    onClick={() =>
                      runAction(() => Promise.resolve(applyMaterialTemplate("course")), "Plantilla aplicada.")
                    }
                    type="button"
                  >
                    Autorrellenar
                  </SecondaryButton>
                  <SecondaryButton
                    onClick={() =>
                      runAction(() => saveMaterialTemplate("course", courseForm), "Plantilla guardada.")
                    }
                    type="button"
                  >
                    Guardar plantilla
                  </SecondaryButton>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} placeholder="Nombre del curso" />
                <Input value={courseForm.audience} onChange={(event) => setCourseForm({ ...courseForm, audience: event.target.value })} placeholder="Publico objetivo" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={courseForm.format} onChange={(event) => setCourseForm({ ...courseForm, format: event.target.value })} placeholder="Formato" />
                <Input value={courseForm.duration} onChange={(event) => setCourseForm({ ...courseForm, duration: event.target.value })} placeholder="Duracion" />
              </div>
              <Textarea value={courseForm.detailSummary} onChange={(event) => setCourseForm({ ...courseForm, detailSummary: event.target.value })} placeholder="Detalle adicional del curso" />
              <Textarea value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} placeholder="Descripcion del curso" />
                <Textarea value={courseForm.outcomes} onChange={(event) => setCourseForm({ ...courseForm, outcomes: event.target.value })} placeholder="Resultados esperados" />
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Portada o panel del curso</label>
                  <p className="text-sm text-[#6d5a51]">
                    Puedes usar una URL externa, subir a la nube de GoBeyond o reutilizar una portada ya existente desde la biblioteca.
                  </p>
                  <Input
                    value={courseForm.coverImage}
                    onChange={(event) => setCourseForm((current) => ({ ...current, coverImage: event.target.value }))}
                    placeholder="https://imagen-del-curso.com/portada.png"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                    const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      try {
                        const asset = await uploadMedia(file, "course-cover");
                        setCourseForm((current) => ({ ...current, coverImage: asset.url }));
                        setWorkspaceMessage(asset.deduplicated ? "Portada reutilizada desde la biblioteca existente." : "Portada subida a la biblioteca.");
                      } catch (error) {
                        setWorkspaceError(error.message);
                      }
                    }}
                  />
                  <MediaLibraryStrip
                    emptyLabel="Cuando subas portadas apareceran aqui para reutilizarlas."
                    items={imageLibraryItems.filter((item) => item.purpose === "course-cover")}
                    onSelect={(item) => setCourseForm((current) => ({ ...current, coverImage: item.url }))}
                  />
                </div>

              <div className="grid gap-4 border border-[#eadfce] bg-[#fbf8f2] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Asignaciones del curso</p>
                <div className="grid gap-3">
                  <Input value={assignmentDraft.title} onChange={(event) => setAssignmentDraft({ ...assignmentDraft, title: event.target.value })} placeholder="Titulo de la asignacion" />
                  <Textarea value={assignmentDraft.instruction} onChange={(event) => setAssignmentDraft({ ...assignmentDraft, instruction: event.target.value })} placeholder="Instrucciones de la tarea" />
                  <Input value={assignmentDraft.dueLabel} onChange={(event) => setAssignmentDraft({ ...assignmentDraft, dueLabel: event.target.value })} placeholder="Fecha limite visible o referencia" />
                  <Input
                    type="file"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                        if (!file) {
                          return;
                        }

                        try {
                          const asset = await uploadMedia(file, "assignment-file");
                          const uploadedAt = new Date();
                          const fileExpiresAt = addBusinessDays(uploadedAt, 5).toISOString();
                          setAssignmentDraft((current) => ({
                            ...current,
                            fileName: asset.fileName,
                            fileUrl: asset.url,
                            fileKey: asset.key,
                            fileContentType: asset.contentType,
                            fileData: "",
                            fileUploadedAt: uploadedAt.toISOString(),
                            fileExpiresAt,
                          }));
                      } catch (error) {
                        setWorkspaceError(error.message);
                      }
                    }}
                  />
                  <div className="flex gap-3">
                    <SecondaryButton onClick={() => runAction(() => Promise.resolve(saveAssignmentDraft()), "Asignacion preparada para el curso.")} type="button">
                      {assignmentDraft.id ? "Actualizar asignacion" : "Agregar asignacion"}
                    </SecondaryButton>
                    {assignmentDraft.id ? (
                      <SecondaryButton onClick={() => setAssignmentDraft(initialAssignmentDraft)} type="button">
                        Limpiar
                      </SecondaryButton>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3">
                  {(courseForm.assignments ?? []).map((assignment) => (
                    <RowCard
                      key={assignment.id}
                      eyebrow={assignment.dueLabel || "Asignacion"}
                      title={assignment.title}
                      meta={assignment.fileName ? `Archivo vence ${formatDate(assignment.fileExpiresAt)}` : "Sin archivo adjunto"}
                      body={assignment.instruction}
                    >
                      <SecondaryButton onClick={() => editAssignmentDraft(assignment)} type="button">
                        Editar
                      </SecondaryButton>
                      <SecondaryButton onClick={() => removeAssignment(assignment.id)} type="button">
                        Eliminar
                      </SecondaryButton>
                    </RowCard>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 border border-[#eadfce] bg-[#fbf8f2] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Gamificacion del curso</p>
                <div className="grid gap-3">
                  <Input value={ruleDraft.title} onChange={(event) => setRuleDraft({ ...ruleDraft, title: event.target.value })} placeholder="Nombre de la regla" />
                  <Textarea value={ruleDraft.condition} onChange={(event) => setRuleDraft({ ...ruleDraft, condition: event.target.value })} placeholder="Condicion para ganar puntos" />
                  <Input value={ruleDraft.points} onChange={(event) => setRuleDraft({ ...ruleDraft, points: event.target.value })} placeholder="Puntos otorgados" />
                  <div className="flex gap-3">
                    <SecondaryButton onClick={() => runAction(() => Promise.resolve(saveRuleDraft()), "Regla de gamificacion guardada.")} type="button">
                      {ruleDraft.id ? "Actualizar regla" : "Agregar regla"}
                    </SecondaryButton>
                    {ruleDraft.id ? (
                      <SecondaryButton onClick={() => setRuleDraft(initialRuleDraft)} type="button">
                        Limpiar
                      </SecondaryButton>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3">
                  {(courseForm.gamificationRules ?? []).map((rule) => (
                    <RowCard key={rule.id} eyebrow={`${rule.points} pts`} title={rule.title} body={rule.condition}>
                      <SecondaryButton onClick={() => editRuleDraft(rule)} type="button">
                        Editar
                      </SecondaryButton>
                      <SecondaryButton onClick={() => removeRule(rule.id)} type="button">
                        Eliminar
                      </SecondaryButton>
                    </RowCard>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <ActionButton type="submit">{courseForm.id ? "Guardar cambios" : "Crear curso"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <article className="border border-[#d8cdbf] bg-white p-7">
              {courseForm.coverImage ? (
                <div className="mb-5 aspect-[16/9] overflow-hidden bg-[#efe4d6]">
                  <img alt={courseForm.title || "Portada del curso"} className="h-full w-full object-cover" src={courseForm.coverImage} />
                </div>
              ) : null}
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">
                {(courseForm.format || "Formato") + " · " + (courseForm.duration || "Duracion")}
              </p>
              <h3 className="mt-3 font-['Georgia'] text-3xl text-[#20181f]">{courseForm.title || "Nombre del curso"}</h3>
              <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#8b6d55]">
                {courseForm.audience || "Publico objetivo"}
              </p>
              <p className="mt-4 text-sm text-[#8b6d55]">
                {courseForm.detailSummary || "Los detalles adicionales del curso apareceran aqui para una experiencia mas completa."}
              </p>
              <p className="mt-4 text-[#5c4d46]">
                {courseForm.description || "La descripcion aparecera aqui para que puedas revisar tono y claridad antes de guardar."}
              </p>
              <p className="mt-4 border-t border-[#eadfce] pt-4 text-sm text-[#5c4d46]">
                <strong className="text-[#20181f]">Resultados esperados:</strong>{" "}
                {courseForm.outcomes || "Los resultados del curso se mostraran aqui como vista previa."}
              </p>
              <div className="mt-4 border-t border-[#eadfce] pt-4 text-sm text-[#5c4d46]">
                <strong className="text-[#20181f]">Asignaciones:</strong> {(courseForm.assignments ?? []).length}
              </div>
              <div className="mt-2 text-sm text-[#5c4d46]">
                <strong className="text-[#20181f]">Reglas de gamificacion:</strong> {(courseForm.gamificationRules ?? []).length}
              </div>
            </article>
          </div>
        </ModalShell>
      );
    }

    if (modal === "user") {
      return (
        <ModalShell
          title={userForm.id ? "Editar usuario" : "Crear usuario"}
          subtitle="Este editor concentra el alta y la gestion de roles para que no tengas una tabla llena de inputs abiertos."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveUser}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} placeholder="Nombre completo" />
                <Input
                  value={userForm.email}
                  disabled={Boolean(userForm.id)}
                  onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                  placeholder="Correo electronico"
                />
              </div>
              {!userForm.id ? (
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  placeholder="Contrasena temporal"
                />
              ) : securitySettingsForm.allowAdminPasswordChange ? (
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  placeholder="Nueva contrasena manual"
                />
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <Select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </Select>
                <Select value={userForm.status} onChange={(event) => setUserForm({ ...userForm, status: event.target.value })}>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </Select>
              </div>
              <div className="flex gap-3">
                <ActionButton type="submit">{userForm.id ? "Guardar cambios" : "Crear usuario"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
              {userForm.id ? (
                <div className="grid gap-3 border border-[#eadfce] bg-[#fbf8f2] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Acciones de credenciales</p>
                  {securitySettingsForm.allowAdminPasswordChange ? (
                    <SecondaryButton onClick={saveManagedUserPassword} type="button">
                      Cambiar contrasena ahora
                    </SecondaryButton>
                  ) : (
                    <p className="text-sm text-[#6d5a51]">La politica actual no permite cambios manuales de contrasena desde administracion.</p>
                  )}
                  {securitySettingsForm.allowAdminResetNotification ? (
                    <SecondaryButton onClick={sendManagedUserPasswordReset} type="button">
                      Enviar enlace de recuperacion
                    </SecondaryButton>
                  ) : (
                    <p className="text-sm text-[#6d5a51]">La politica actual no permite enviar enlaces de recuperacion desde administracion.</p>
                  )}
                  {currentEditingUser?.emailVerified ? (
                    <p className="text-sm text-[#6d5a51]">La cuenta ya esta verificada y no necesita un nuevo enlace.</p>
                  ) : securitySettingsForm.allowAdminVerificationNotification ? (
                    <SecondaryButton onClick={sendManagedUserVerification} type="button">
                      Enviar enlace de verificacion
                    </SecondaryButton>
                  ) : (
                    <p className="text-sm text-[#6d5a51]">La politica actual no permite enviar enlaces de verificacion desde administracion.</p>
                  )}
                  <SecondaryButton onClick={deleteManagedUserAccount} type="button">
                    Eliminar cuenta
                  </SecondaryButton>
                  <p className="text-sm text-[#6d5a51]">
                    Esta accion elimina la cuenta y cierra sus sesiones. No podras borrar tu propia cuenta ni dejar al sistema sin un admin activo.
                  </p>
                </div>
              ) : null}
            </form>

            <RowCard
              eyebrow={`${userForm.role || "student"} · ${userForm.status || "active"} · ${currentEditingUser?.emailVerified ? "correo verificado" : "correo pendiente"}`}
              title={userForm.fullName || "Nombre del usuario"}
              meta={userForm.email || "correo@dominio.com"}
              body="Vista previa de como quedara esta cuenta dentro del listado administrativo."
            >
              {currentEditingUser ? (
                <>
                  <p className="w-full text-sm text-[#5c4d46]">
                    Verificacion de correo:{" "}
                    {currentEditingUser.emailVerified
                      ? `Completada el ${formatDate(currentEditingUser.emailVerifiedAt)}`
                      : "Pendiente de activacion"}
                  </p>
                  <p className="w-full text-sm text-[#5c4d46]">
                    Ultimo cambio de contrasena: {formatDate(currentEditingUser.passwordChangedAt)}
                  </p>
                  <p className="w-full text-sm text-[#5c4d46]">
                    {currentEditingUser.passwordExpiresAt
                      ? `Expira el ${formatDate(currentEditingUser.passwordExpiresAt)}`
                      : "Sin expiracion automatica activa"}
                  </p>
                  <p className="w-full text-sm text-[#5c4d46]">
                    Estado: {currentEditingUser.passwordExpired ? "Contrasena expirada" : "Contrasena vigente"}
                  </p>
                </>
              ) : null}
            </RowCard>
          </div>
        </ModalShell>
      );
    }

    if (modal === "enrollment") {
      return (
        <ModalShell
          title={enrollmentForm.id ? "Editar matricula" : "Crear matricula"}
          subtitle="Asigna un curso y acceso temporal sin llenar la pantalla principal de campos y selectores."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveEnrollment}>
              {!enrollmentForm.id ? (
                <>
                  <Select
                    value={enrollmentForm.userId}
                    onChange={(event) => setEnrollmentForm({ ...enrollmentForm, userId: event.target.value })}
                  >
                    <option value="">Selecciona estudiante</option>
                    {studentOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} · {user.email}
                      </option>
                    ))}
                  </Select>
                  <Select value={enrollmentForm.courseId} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, courseId: event.target.value })}>
                    <option value="">Selecciona curso</option>
                    {(content.courses ?? []).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={enrollmentForm.accessDays}
                    onChange={(event) => setEnrollmentForm({ ...enrollmentForm, accessDays: event.target.value })}
                    placeholder="Dias de acceso"
                  />
                </>
              ) : (
                <Input
                  type="date"
                  value={enrollmentForm.accessExpiresAt}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, accessExpiresAt: event.target.value })}
                  placeholder="Fecha de vencimiento"
                />
              )}

              <Select value={enrollmentForm.status} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, status: event.target.value })}>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
                <option value="expired">expired</option>
              </Select>

              <label className="flex items-center gap-3 text-sm text-[#20181f]">
                <input
                  checked={enrollmentForm.gamificationEnabled}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, gamificationEnabled: event.target.checked })}
                  type="checkbox"
                />
                Activar gamificacion para este estudiante en este curso
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  value={enrollmentForm.progressPercent}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, progressPercent: event.target.value })}
                  placeholder="Progreso %"
                />
                <Input
                  value={enrollmentForm.points}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, points: event.target.value })}
                  placeholder="Puntos"
                />
                <Input
                  value={enrollmentForm.streakDays}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, streakDays: event.target.value })}
                  placeholder="Racha"
                />
              </div>

              <div className="flex gap-3">
                <ActionButton type="submit">{enrollmentForm.id ? "Guardar cambios" : "Crear matricula"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={enrollmentForm.status || "active"}
              title={
                enrollmentForm.courseId
                  ? content.courses?.find((course) => course.id === enrollmentForm.courseId)?.title ?? "Curso seleccionado"
                  : "Curso seleccionado"
              }
              meta={
                enrollmentForm.userId
                  ? studentOptions.find((user) => user.id === enrollmentForm.userId)?.fullName ?? "Estudiante seleccionado"
                  : "Estudiante seleccionado"
              }
              body={
                enrollmentForm.id
                  ? `Vence el ${enrollmentForm.accessExpiresAt || "sin fecha definida"}. Progreso ${enrollmentForm.progressPercent || "0"}%.`
                  : `Acceso estimado por ${enrollmentForm.accessDays || "45"} dias. Gamificacion ${enrollmentForm.gamificationEnabled ? "activa" : "desactivada"}.`
              }
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "testimonial") {
      return (
        <ModalShell
          title="Crear testimonio"
          subtitle="Publica un testimonio nuevo y revisa arriba el tono antes de enviarlo al listado."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveTestimonial}>
              <Textarea value={testimonialForm.quote} onChange={(event) => setTestimonialForm({ ...testimonialForm, quote: event.target.value })} placeholder="Testimonio" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={testimonialForm.author} onChange={(event) => setTestimonialForm({ ...testimonialForm, author: event.target.value })} placeholder="Nombre" />
                <Input value={testimonialForm.organization} onChange={(event) => setTestimonialForm({ ...testimonialForm, organization: event.target.value })} placeholder="Institucion o referencia" />
              </div>
              <div className="flex gap-3">
                <ActionButton type="submit">Publicar testimonio</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              title={testimonialForm.author || "Nombre del estudiante o aliado"}
              meta={testimonialForm.organization || "Organizacion"}
              body={`“${testimonialForm.quote || "El testimonio aparecera aqui como vista previa antes de publicarlo."}”`}
            />
          </div>
        </ModalShell>
      );
    }

    if (modal === "communityThread") {
      const currentThread = (content.communityThreads ?? []).find((item) => item.id === communityThreadForm.id);

      return (
        <ModalShell
          title="Gestionar hilo"
          subtitle="Modera estado, visibilidad y mejor respuesta. Los hilos expiran automaticamente a los 6 meses de creados."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <form className="grid gap-4" onSubmit={saveCommunityThread}>
              <Select
                value={communityThreadForm.status}
                onChange={(event) => setCommunityThreadForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="open">open</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </Select>
              <Select
                value={communityThreadForm.visibility}
                onChange={(event) => setCommunityThreadForm((current) => ({ ...current, visibility: event.target.value }))}
              >
                <option value="visible">visible</option>
                <option value="hidden">hidden</option>
              </Select>
              <Select
                value={communityThreadForm.bestReplyId}
                onChange={(event) => setCommunityThreadForm((current) => ({ ...current, bestReplyId: event.target.value }))}
              >
                <option value="">Sin mejor respuesta</option>
                {(currentThread?.replies ?? []).map((reply, index) => (
                  <option key={reply.id} value={reply.id}>
                    {`#${index + 1} · ${reply.authorName}`}
                  </option>
                ))}
              </Select>
              <Textarea
                value={communityThreadForm.adminNote}
                onChange={(event) => setCommunityThreadForm((current) => ({ ...current, adminNote: event.target.value }))}
                placeholder="Nota interna de moderacion o contexto administrativo"
              />
              <div className="flex gap-3">
                <ActionButton type="submit">Guardar hilo</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <div className="grid gap-4">
              <RowCard
                eyebrow={`${currentThread?.category || "general"} · ${currentThread?.visibility || "visible"} · ${currentThread?.status || "open"}`}
                title={currentThread?.title || "Hilo"}
                meta={`${currentThread?.authorName || "Sin autor"} · ${currentThread?.authorEmail || "Sin correo"}${currentThread?.courseTitle ? ` · ${currentThread.courseTitle}` : ""}`}
                body={currentThread?.body || "Sin contenido."}
              >
                <p className="text-sm text-[#5c4d46]">
                  Expira el {formatDate(currentThread?.expiresAt)}{currentThread?.lastAdminActionAt ? ` · ultima gestion ${formatDate(currentThread.lastAdminActionAt)}` : ""}
                </p>
                {currentThread?.adminNote ? <p className="text-sm text-[#5c4d46]">{currentThread.adminNote}</p> : null}
              </RowCard>

              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Respuestas</p>
                <ScrollArea className="mt-3 max-h-[24rem]">
                  <div className="grid gap-3">
                    {currentThread?.replies?.length ? (
                      currentThread.replies.map((reply) => (
                        <RowCard
                          key={reply.id}
                          eyebrow={currentThread.bestReplyId === reply.id ? "Mejor respuesta" : "Respuesta"}
                          title={reply.authorName}
                          meta={formatDate(reply.createdAt)}
                          body={reply.body}
                        />
                      ))
                    ) : (
                      <EmptyState title="Sin respuestas todavia" body="Este hilo aun no tiene respuestas de la comunidad." />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </ModalShell>
      );
    }

    if (modal === "supportTicket") {
      const currentTicket = (content.supportTickets ?? []).find((item) => item.id === supportTicketForm.id);

      return (
        <ModalShell
          title="Gestionar ticket"
          subtitle="Actualiza el estado, prioridad y nota administrativa sin perder el contexto original del estudiante."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveSupportTicket}>
              <Select value={supportTicketForm.status} onChange={(event) => setSupportTicketForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
              </Select>
              <Select value={supportTicketForm.priority} onChange={(event) => setSupportTicketForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="low">low</option>
                <option value="normal">normal</option>
                <option value="high">high</option>
              </Select>
              <Textarea
                value={supportTicketForm.adminNote}
                onChange={(event) => setSupportTicketForm((current) => ({ ...current, adminNote: event.target.value }))}
                placeholder="Nota interna para seguimiento administrativo"
              />
              <div className="flex gap-3">
                <ActionButton type="submit">Guardar ticket</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={`${currentTicket?.category || "soporte"} · ${currentTicket?.status || "open"}`}
              title={currentTicket?.subject || "Ticket"}
              meta={`${currentTicket?.student?.fullName || "Sin estudiante"} · ${currentTicket?.student?.email || "Sin correo"}${currentTicket?.courseTitle ? ` · ${currentTicket.courseTitle}` : ""}`}
              body={currentTicket?.description || "Sin descripcion."}
            >
              {currentTicket?.adminNote ? <p className="text-sm text-[#5c4d46]">{currentTicket.adminNote}</p> : null}
            </RowCard>
          </div>
        </ModalShell>
      );
    }

    if (modal === "courseInterest") {
      const currentRequest = (content.courseInterestRequests ?? []).find((item) => item.id === courseInterestForm.id);

      return (
        <ModalShell
          title="Gestionar solicitud de apertura"
          subtitle="Revisa el contacto del estudiante y deja seguimiento interno sin prometer apertura inmediata del curso."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveCourseInterest}>
              <Select value={courseInterestForm.status} onChange={(event) => setCourseInterestForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="open">open</option>
                <option value="reviewing">reviewing</option>
                <option value="contacted">contacted</option>
                <option value="waitlist">waitlist</option>
                <option value="closed">closed</option>
              </Select>
              <Textarea
                value={courseInterestForm.adminNote}
                onChange={(event) => setCourseInterestForm((current) => ({ ...current, adminNote: event.target.value }))}
                placeholder="Nota interna para seguimiento, llamada, correo o decision sobre apertura"
              />
              <div className="flex gap-3">
                <ActionButton type="submit">Guardar solicitud</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <RowCard
              eyebrow={`${currentRequest?.status || "open"} · ${currentRequest?.contact?.channel || "contacto"}`}
              title={currentRequest?.courseTitle || "Curso solicitado"}
              meta={`${currentRequest?.student?.fullName || "Sin estudiante"} · ${currentRequest?.student?.email || "Sin correo"} · ${currentRequest?.contact?.value || "Sin dato de contacto"}`}
              body={currentRequest?.note || "Sin comentario del estudiante."}
            >
              {currentRequest?.adminNote ? <p className="text-sm text-[#5c4d46]">{currentRequest.adminNote}</p> : null}
            </RowCard>
          </div>
        </ModalShell>
      );
    }

      if (modal === "news") {
        return (
          <ModalShell
          title={newsForm.id ? "Editar noticia" : "Crear noticia"}
          subtitle="Cada noticia puede resolverse con resumen, enlace y un embed pegado desde la fuente original, sin depender de subir imagen."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveNews}>
              <Input
                value={newsForm.title}
                onChange={(event) => setNewsForm({ ...newsForm, title: event.target.value })}
                placeholder="Titulo de la noticia"
              />
              <Input
                value={newsForm.category}
                onChange={(event) => setNewsForm({ ...newsForm, category: event.target.value })}
                placeholder="Categoria o etiqueta"
              />
              <Textarea
                value={newsForm.summary}
                onChange={(event) => setNewsForm({ ...newsForm, summary: event.target.value })}
                placeholder="Resumen o bajada de la noticia"
              />
              <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                <Select
                  value={newsForm.status}
                  onChange={(event) => setNewsForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="published">Publicada</option>
                  <option value="draft">Borrador</option>
                </Select>
                <Input
                  type="date"
                  value={newsForm.publishedAt}
                  onChange={(event) => setNewsForm((current) => ({ ...current, publishedAt: event.target.value }))}
                />
              </div>
              <label className="flex items-center gap-3 rounded-[1rem] border border-[#d8cdbf] bg-[#fbf8f2] px-4 py-3 text-sm text-[#20181f]">
                <input
                  checked={Boolean(newsForm.featured)}
                  onChange={(event) => setNewsForm((current) => ({ ...current, featured: event.target.checked }))}
                  type="checkbox"
                />
                Marcar como noticia destacada en el landing
              </label>
              <Input
                value={newsForm.link}
                onChange={(event) => setNewsForm({ ...newsForm, link: event.target.value })}
                placeholder="https://enlace-de-referencia.com"
              />
              <Textarea
                value={newsForm.embed}
                onChange={(event) => setNewsForm((current) => ({ ...current, embed: event.target.value }))}
                placeholder={'Pega aqui el embed o iframe. Ejemplo: <iframe src="https://..."></iframe> o solo https://...'}
              />
              <p className="text-sm text-[#6d5a51]">
                Puedes pegar el codigo embed completo o solo una URL embebida de video, publicacion o recurso externo.
              </p>
              <div className="flex gap-3">
                <ActionButton type="submit">{newsForm.id ? "Guardar cambios" : "Crear noticia"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <article className="overflow-hidden border border-[#d8cdbf] bg-white">
              {extractEmbedUrl(newsForm.embed) ? (
                <div className="aspect-[16/9] bg-[#f3ede3]">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={extractEmbedUrl(newsForm.embed)}
                    title={newsForm.title || "Vista previa de la noticia"}
                  />
                </div>
              ) : newsForm.image ? (
                <div className="aspect-[16/9] bg-[#f3ede3]">
                  <img alt={newsForm.title || "Vista previa de la noticia"} className="h-full w-full object-cover" src={newsForm.image} />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[linear-gradient(135deg,#f3e6d7_0%,#efe5db_100%)]" />
              )}
              <div className="p-7">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">
                  {newsForm.category || "Noticia"} · {newsForm.status === "draft" ? "Borrador" : newsForm.featured ? "Destacada" : "Publicada"}
                </p>
                <h3 className="mt-3 font-['Georgia'] text-3xl text-[#20181f]">{newsForm.title || "Titulo de la noticia"}</h3>
                <p className="mt-4 text-[#5c4d46]">
                  {newsForm.summary || "El resumen de la noticia aparecera aqui para revisar claridad y tono antes de publicarla."}
                </p>
                <p className="mt-4 text-sm text-[#5c4d46]">
                  <strong className="text-[#20181f]">Publicacion:</strong>{" "}
                  {newsForm.publishedAt ? formatDate(newsForm.publishedAt) : "Se asignara automaticamente al publicar."}
                </p>
                <p className="mt-4 border-t border-[#eadfce] pt-4 text-sm text-[#5c4d46]">
                  <strong className="text-[#20181f]">Enlace:</strong> {newsForm.link || "Sin enlace de referencia por ahora."}
                </p>
              </div>
            </article>
          </div>
          </ModalShell>
        );
      }

      if (modal === "institution") {
        return (
          <ModalShell
            title={institutionForm.id ? "Editar institucion" : "Agregar institucion"}
            subtitle="Cada institucion puede resolverse con nombre, enlace y un embed pegado desde la fuente original. Sin subir imagenes manualmente."
            onClose={closeModal}
          >
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <form className="grid gap-4" onSubmit={saveInstitution}>
                <Input
                  value={institutionForm.name}
                  onChange={(event) => setInstitutionForm({ ...institutionForm, name: event.target.value })}
                  placeholder="Nombre de la institucion"
                />
                  <Input
                    value={institutionForm.link}
                    onChange={(event) => setInstitutionForm({ ...institutionForm, link: event.target.value })}
                    placeholder="https://sitio-o-referencia.com"
                  />
                  <Textarea
                    value={institutionForm.embed}
                    onChange={(event) => setInstitutionForm({ ...institutionForm, embed: event.target.value })}
                    placeholder={'Pega aqui el embed o iframe. Ejemplo: <iframe src="https://..."></iframe> o solo https://...'}
                  />
                  <p className="text-sm text-[#6d5a51]">
                    Puedes pegar el codigo embed completo o solo la URL del contenido insertado. El landing usara eso como vista principal.
                  </p>
                <label className="flex items-center gap-3 text-sm text-[#5c4d46]">
                  <input
                    checked={institutionForm.featured}
                    onChange={(event) => setInstitutionForm({ ...institutionForm, featured: event.target.checked })}
                    type="checkbox"
                  />
                  Mostrar esta institucion dentro de la seleccion destacada del landing
                </label>
                <div className="flex gap-3">
                  <ActionButton type="submit">
                    {institutionForm.id ? "Guardar cambios" : "Agregar institucion"}
                  </ActionButton>
                  <SecondaryButton onClick={closeModal} type="button">
                    Cancelar
                  </SecondaryButton>
                </div>
              </form>

              <article className="overflow-hidden border border-[#d8cdbf] bg-white">
                <div className="aspect-[16/10] bg-[#edf1f4]">
                  {extractEmbedUrl(institutionForm.embed) ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full border-0"
                      referrerPolicy="strict-origin-when-cross-origin"
                      src={extractEmbedUrl(institutionForm.embed)}
                      title={institutionForm.name || "Vista previa institucional"}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#8b6d55]">
                      La vista previa del embed aparecera aqui
                    </div>
                  )}
                </div>
                <div className="p-7">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">
                    {institutionForm.featured ? "Destacada en landing" : "Guardada solo en admin"}
                  </p>
                  <h3 className="mt-3 font-['Georgia'] text-3xl text-[#20181f]">
                    {institutionForm.name || "Nombre de la institucion"}
                  </h3>
                  <p className="mt-4 text-[#5c4d46]">
                    {institutionForm.link || "Agrega un enlace si quieres abrir sitio, red social o referencia externa."}
                  </p>
                </div>
              </article>
            </div>
          </ModalShell>
        );
      }

      return null;
    }

  return (
    <div className="grid gap-6">
        <SectionCard
          title="Cabina administrativa"
        description="Todo cambio queda registrado en backend. Ahora las acciones viven en vistas mas limpias y modales enfocados, no en una sola pagina saturada."
        accent="dark"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-[#d8cdc5]">
              <strong>{currentUser.fullName}</strong> · {currentUser.email}
            </p>
            <p className="mt-1 text-sm text-[#d8cdc5]">
              Rol: {currentUser.role} · Estado: {currentUser.status}
            </p>
          </div>
          <button className="w-fit border border-white/25 px-4 py-2 text-sm text-white" onClick={onLogout} type="button">
            Cerrar sesion
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SmallStat label="Cursos" value={content.courses?.length ?? 0} help="Programas visibles para captacion y aprendizaje." />
          <SmallStat label="Usuarios" value={users.length} help="Cuentas administrables desde la UI." />
          <SmallStat label="Matriculas" value={enrollments.length} help="Accesos activos o historicos por estudiante." />
          <SmallStat label="Pendientes" value={content.testimonialSubmissions?.length ?? 0} help="Testimonios esperando moderacion." />
        </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <PillButton active={activeView === "identity"} onClick={() => setActiveView("identity")} type="button">
              Identidad
            </PillButton>
          <PillButton active={activeView === "catalog"} onClick={() => setActiveView("catalog")} type="button">
            Cursos
          </PillButton>
          <PillButton active={activeView === "people"} onClick={() => setActiveView("people")} type="button">
            Personas
          </PillButton>
            <PillButton active={activeView === "community"} onClick={() => setActiveView("community")} type="button">
              Comunidad
            </PillButton>
            {globalSearchQuery.trim() ? (
              <PillButton
                active={activeView === "search"}
                className="px-3 py-1.5 text-xs"
                onClick={() => setActiveView("search")}
                type="button"
              >
                Busqueda
              </PillButton>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <FilterInput
              onChange={(event) => {
                const nextQuery = event.target.value;
                setGlobalSearchQuery(nextQuery);
                if (nextQuery.trim()) {
                  setActiveView("search");
                }
              }}
              placeholder="Busqueda general: cursos, usuarios, matriculas, sesiones, noticias, instituciones..."
              value={globalSearchQuery}
            />
            <SecondaryButton
              className="border-white/30 bg-transparent px-3 py-2 text-xs text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                setGlobalSearchQuery("");
                if (activeView === "search") {
                  setActiveView("identity");
                }
              }}
              type="button"
            >
              Limpiar busqueda
            </SecondaryButton>
          </div>

          {authError ? <p className="mt-4 text-sm text-[#ffb8a6]">{authError}</p> : null}
        {workspaceError ? <p className="mt-4 text-sm text-[#ffb8a6]">{workspaceError}</p> : null}
        {workspaceMessage ? <p className="mt-4 text-sm text-[#f4d9b2]">{workspaceMessage}</p> : null}
      </SectionCard>

        {activeView === "identity" ? renderIdentityView() : null}
        {activeView === "catalog" ? renderCatalogView() : null}
        {activeView === "people" ? renderPeopleView() : null}
        {activeView === "community" ? renderCommunityView() : null}
        {activeView === "search" ? renderSearchView() : null}

        {renderModal()}
      </div>
  );
}
