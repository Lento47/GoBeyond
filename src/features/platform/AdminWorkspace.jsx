import { useEffect, useMemo, useRef, useState } from "react";
import { EMBED_IFRAME_ALLOW, EMBED_IFRAME_SANDBOX, extractEmbedUrl } from "../../shared/embedPolicy";
import { MarkdownContent } from "../../shared/MarkdownContent";
import {
  ActionButton,
  CompactBand,
  EmptyState,
  FilterInput,
  Input,
  MediaLibraryStrip,
  ModalShell,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  SectionToolbar,
  Select,
  SmallStat,
  StatusPill,
  Textarea,
} from "./components/admin/AdminUI";
import { getEmbedDescriptor } from "./embedUtils";
import { CatalogSection } from "./sections/CatalogSection";
import { getLearningPathThemeClasses, normalizeLearningPathItem } from "./learningPath";
import { IdentitySection } from "./sections/IdentitySection";
import { PeopleSection } from "./sections/PeopleSection";
import { AdminSopsSection } from "./SopsWorkspaceV2";
import { adminNavigationGroups, adminViewIcons, adminViewLabels } from "./adminNavigation";

function getPreviewEmbedUrl(value) {
  return getEmbedDescriptor(value).embedUrl || extractEmbedUrl(value);
}

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
  stageLabel: "Trayectoria",
  track: "Empleabilidad",
  type: "Empleabilidad",
  description: "",
  status: "",
  duration: "",
  outcome: "",
  progressState: "Disponible",
  theme: "blue",
  order: "1",
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

const initialCohortForm = {
  id: "",
  title: "",
  courseId: "",
  teacherUserId: "",
  status: "planned",
  startDate: "",
  endDate: "",
  capacity: "",
  leaderboardVisibility: "private",
  description: "",
};

const initialUserForm = {
  id: "",
  fullName: "",
  email: "",
  password: "",
  role: "student",
  roles: ["student"],
  status: "active",
  assignedCourseIds: [],
};

const roleOptions = ["student", "teacher", "admin"];

function listToLines(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).join("\n") : String(value ?? "");
}

function linesToList(value = "") {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function metricsToLines(value = []) {
  return Array.isArray(value)
    ? value
        .map((item) => [item?.label, item?.value, item?.description].map((part) => String(part ?? "").trim()).join(" | "))
        .join("\n")
    : "";
}

function linesToMetrics(value = "") {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", metricValue = "", description = ""] = line.split("|").map((part) => part.trim());
      return { label, value: metricValue, description };
    });
}

function formatRolesLabel(roles = [], fallbackRole = "") {
  const values = Array.isArray(roles) && roles.length ? roles : fallbackRole ? [fallbackRole] : [];
  return values.join(" / ");
}

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
  passingThreshold: "80",
  completionStatus: "in_progress",
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
  image: "",
  status: "published",
  featured: false,
  publishedAt: "",
};

const initialSocialSourceForm = {
  id: "",
  nombre: "",
  plataforma: "facebook",
  page_url: "",
  page_identifier: "",
  activo: true,
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
    // Navegación
    nav: Array.isArray(landing?.nav)
      ? landing.nav.join(", ")
      : "Inicio, Sobre nosotros, Servicios, Impacto, Testimonios, Contacto",
    // Sobre nosotros
    benefits: Array.isArray(landing?.benefits) ? landing.benefits.join("\n") : "",
    // Servicios
    servicesTitle: landing?.servicesTitle ?? "Nuestros servicios",
    subscriptionLabel: landing?.subscriptionLabel ?? "",
    // Testimonios / Confianza
    trustTitle: landing?.trustTitle ?? "Red de confianza",
    // Contacto
    contactTitle: landing?.contactTitle ?? "Contacto",
    // Convenios
    institutionsCarouselTitle: landing?.institutionsCarouselTitle ?? "Instituciones con convenio",
    institutionsCarouselLabel: landing?.institutionsCarouselLabel ?? "Convenios activos",
    institutionsCarouselBody:
      landing?.institutionsCarouselBody ??
      "Centros educativos y organizaciones aliadas que trabajan con Go Beyond para ampliar oportunidades de formacion y certificacion.",
    // Hero CTAs
    heroPrimaryCtaLabel: landing?.heroPrimaryCtaLabel ?? "Empezar ahora",
    heroSecondaryCtaLabel: landing?.heroSecondaryCtaLabel ?? "Explorar catalogo",
    // Cursos
    coursesHeading: landing?.coursesHeading ?? "Creados para el Impacto Real.",
    courseResultsLabel: landing?.courseResultsLabel ?? "Resultados:",
    // Modalidades
    participationCostLabel: landing?.participationCostLabel ?? "Costo",
    participationCloseLabel: landing?.participationCloseLabel ?? "Cierre",
    participationDetailsEyebrow: landing?.participationDetailsEyebrow ?? "Mas detalles",
    // Noticias
    newsTitle: landing?.newsTitle ?? "Noticias",
    newsArchiveLabel: landing?.newsArchiveLabel ?? "Ver mas noticias",
    // Testimonios
    testimonialsCarouselLabel: landing?.testimonialsCarouselLabel ?? "Rotando testimonios",
    // Tarjetas de programas
    programCards: Array.isArray(landing?.programCards) ? landing.programCards : [],
    // Contacto
    contactInfo: {
      emailLabel: landing?.contactInfo?.emailLabel ?? "Email",
      emailValue: landing?.contactInfo?.emailValue ?? "info@gobeyondcr.org",
      phoneLabel: landing?.contactInfo?.phoneLabel ?? "Telefono",
      phonePrompt: landing?.contactInfo?.phonePrompt ?? "Llamanos",
      phoneValue: landing?.contactInfo?.phoneValue ?? "(+506) 8530 5317",
    },
    socialLinks: {
      facebook: landing?.socialLinks?.facebook ?? "",
      linkedin: landing?.socialLinks?.linkedin ?? "",
      instagram: landing?.socialLinks?.instagram ?? "",
    },
  };
}

function normalizeParticipationSectionState(section = {}) {
  return {
    eyebrow: section?.eyebrow ?? "Modalidades",
    title: section?.title ?? "Formacion de alto valor, con acceso real.",
    description: section?.description ?? "",
    footnote: section?.footnote ?? "",
    detailsHref: section?.detailsHref ?? "",
    detailsLabel: section?.detailsLabel ?? "Ver mas detalles y condiciones",
  };
}

function normalizeParticipationOptionsState(options = []) {
  return Array.isArray(options) ? options : [];
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

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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

function getQueueFocusConfig(item) {
  if (item.kind === "Ticket") {
    return {
      view: "support",
      sectionKey: null,
      filterKey: "tickets",
      filterValue: item.source?.subject || item.source?.student?.email || "",
    };
  }

  if (item.kind === "Solicitud") {
    return {
      view: "people",
      filterKey: "courseRequests",
      filterValue: item.source?.courseTitle || item.source?.student?.email || "",
    };
  }

  if (item.kind === "Hilo") {
    return {
      view: "community",
      sectionKey: "threads",
      filterKey: "communityThreads",
      filterValue: item.source?.title || item.source?.authorEmail || "",
    };
  }

  if (item.kind === "Cuenta") {
    return {
      view: "people",
      filterKey: "users",
      filterValue: item.source?.email || item.source?.fullName || "",
    };
  }

  if (item.kind === "Moderacion") {
    return {
      view: "community",
      sectionKey: "moderation",
      filterKey: null,
      filterValue: "",
    };
  }

  if (item.kind === "Cambio SOP") {
    return {
      view: "sops",
      sectionKey: null,
      filterKey: null,
      filterValue: "",
    };
  }

  return {
    view: item.view || "queue",
    sectionKey: null,
    filterKey: null,
    filterValue: "",
  };
}

export function AdminWorkspace({
  activeView: controlledActiveView,
  authError,
  changeUserPassword,
  content,
  createCollectionItem,
  createEnrollment,
  createSocialSource,
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
  removeSocialSource,
  createSop,
  updateSop,
  deleteSop,
  updateSopChangeRequest,
  updateCollectionItem,
  updateEnrollment,
  updateSocialSource,
  updateSection,
  updateUser,
  uploadAsset,
  users,
  usersLoading,
  onActiveViewChange,
  socialSources,
  socialSourcesLoading,
}) {
  const [internalActiveView, setInternalActiveView] = useState("queue");
  const activeView = controlledActiveView ?? internalActiveView;
  const setActiveView = (nextView) => {
    if (controlledActiveView === undefined) {
      setInternalActiveView(nextView);
    }

    onActiveViewChange?.(nextView);
  };
  const [modal, setModal] = useState(null);
  const [brandForm, setBrandForm] = useState(content.brand);
  const [heroForm, setHeroForm] = useState(content.hero);
  const [landingForm, setLandingForm] = useState(() => normalizeLandingState(content.landing));
  const [participationSectionForm, setParticipationSectionForm] = useState(() => normalizeParticipationSectionState(content.participationSection));
  const [participationOptionsForm, setParticipationOptionsForm] = useState(() => normalizeParticipationOptionsState(content.participationOptions));
  const [securitySettingsForm, setSecuritySettingsForm] = useState(() => normalizeSecuritySettingsState(content.securitySettings));
  const [sessionForm, setSessionForm] = useState(initialSessionForm);
  const [learningForm, setLearningForm] = useState(initialLearningForm);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [assignmentDraft, setAssignmentDraft] = useState(initialAssignmentDraft);
  const [ruleDraft, setRuleDraft] = useState(initialRuleDraft);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [cohortForm, setCohortForm] = useState(initialCohortForm);
  const [testimonialForm, setTestimonialForm] = useState(initialTestimonialForm);
  const [newsForm, setNewsForm] = useState(initialNewsForm);
  const [socialSourceForm, setSocialSourceForm] = useState(initialSocialSourceForm);
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
  const [queueFilters, setQueueFilters] = useState({
    query: "",
    kind: "all",
    state: "all",
    attention: "all",
  });
  const [viewFilters, setViewFilters] = useState({
    sessions: "",
    learning: "",
    institutions: "",
    media: "",
    courses: "",
    cohorts: "",
    users: "",
    enrollments: "",
    news: "",
    socialSources: "",
    testimonials: "",
    tickets: "",
    courseRequests: "",
    communityThreads: "",
  });
  const [communitySectionFocus, setCommunitySectionFocus] = useState(null);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [focusedSopRequestId, setFocusedSopRequestId] = useState("");
  const communitySectionRefs = useRef({});

  useEffect(() => {
    setBrandForm(content.brand);
    setHeroForm(content.hero);
    setLandingForm(normalizeLandingState(content.landing));
    setParticipationSectionForm(normalizeParticipationSectionState(content.participationSection));
    setParticipationOptionsForm(normalizeParticipationOptionsState(content.participationOptions));
    setSecuritySettingsForm(normalizeSecuritySettingsState(content.securitySettings));
  }, [content]);

  const studentOptions = useMemo(
    () => users.filter((user) => (user.roles ?? [user.role]).includes("student")),
    [users]
  );
  const teacherOptions = useMemo(
    () => users.filter((user) => (user.roles ?? [user.role]).includes("teacher")),
    [users]
  );
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
        includesQuery(
          [item.title, item.type, item.track, item.stageLabel, item.status, item.description, item.duration, item.outcome, item.progressState],
          viewFilters.learning
        )
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
  const cohorts = useMemo(() => content.cohorts ?? [], [content.cohorts]);
  const filteredCohorts = useMemo(
    () =>
      cohorts
        .map((item) => {
          const course = (content.courses ?? []).find((courseItem) => courseItem.id === item.courseId);
          const teacher = teacherOptions.find((user) => user.id === item.teacherUserId);
          const capacity = Number.parseInt(String(item.capacity ?? "").trim(), 10);

          return {
            ...item,
            courseTitle: course?.title ?? "Curso sin referencia",
            teacherLabel: teacher?.fullName ?? item.teacherName ?? "Sin docente asignado",
            statusLabel: item.status || "planned",
            startDateLabel: formatShortDate(item.startDate),
            endDateLabel: formatShortDate(item.endDate),
            capacityLabel: Number.isFinite(capacity) && capacity > 0 ? `${capacity} cupos` : "Cupo abierto",
          };
        })
        .filter((item) =>
          includesQuery(
            [item.title, item.courseTitle, item.teacherLabel, item.status, item.description, item.startDate, item.endDate, item.leaderboardVisibility],
            viewFilters.cohorts
          )
        ),
    [cohorts, content.courses, teacherOptions, viewFilters.cohorts]
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((item) =>
        includesQuery(
          [
            item.fullName,
            item.email,
            item.role,
            ...(item.roles ?? []),
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
  const filteredSocialSources = useMemo(
    () =>
      (socialSources ?? []).filter((item) =>
        includesQuery(
          [
            item.nombre,
            item.plataforma,
            item.page_url,
            item.page_identifier,
            item.activo ? "activa" : "inactiva",
            item.automationStatus === "active" ? "automatica" : "planificada",
          ],
          viewFilters.socialSources
        )
      ),
    [socialSources, viewFilters.socialSources]
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
  const queueItems = useMemo(() => {
    const items = [];

    for (const user of users) {
      const needsVerification = !user.emailVerified;
      const passwordExpired = Boolean(user.passwordExpired);
      const restricted = (user.status ?? "active") !== "active";

      if (!needsVerification && !passwordExpired && !restricted) {
        continue;
      }

      const reasons = [];
      if (needsVerification) reasons.push("correo pendiente");
      if (passwordExpired) reasons.push("contrasena expirada");
      if (restricted) reasons.push(`estado ${user.status ?? "inactive"}`);

      items.push({
        id: `user-${user.id}`,
        entityId: user.id,
        kind: "Cuenta",
        state: restricted ? user.status ?? "inactive" : needsVerification ? "pending_verification" : "password_expired",
        attention: passwordExpired ? "critica" : needsVerification ? "seguimiento" : "operativa",
        title: user.fullName,
        subtitle: `${user.email} · ${formatRolesLabel(user.roles, user.role)}`,
        body: `Requiere atencion por ${reasons.join(", ")}.`,
        view: "people",
        manageLabel: "Gestionar cuenta",
        source: user,
      });
    }

    for (const ticket of content.supportTickets ?? []) {
      items.push({
        id: `ticket-${ticket.id}`,
        entityId: ticket.id,
        kind: "Ticket",
        state: ticket.status || "open",
        attention: ticket.priority === "high" ? "critica" : ticket.status === "open" ? "nueva" : "seguimiento",
        title: ticket.subject,
        subtitle: `${ticket.student?.fullName ?? "Sin estudiante"} · ${ticket.category || "soporte"}`,
        body: ticket.description || "Sin descripcion.",
        view: "support",
        manageLabel: "Gestionar ticket",
        source: ticket,
      });
    }

    for (const request of content.courseInterestRequests ?? []) {
      items.push({
        id: `request-${request.id}`,
        entityId: request.id,
        kind: "Solicitud",
        state: request.status || "open",
        attention: request.status === "open" ? "nueva" : request.status === "waitlist" ? "seguimiento" : "operativa",
        title: request.courseTitle || "Solicitud de apertura",
        subtitle: `${request.student?.fullName ?? "Sin estudiante"} · ${request.contact?.value ?? request.student?.email ?? "Sin contacto"}`,
        body: request.note || "Sin nota adicional.",
        view: "people",
        manageLabel: "Gestionar solicitud",
        source: request,
      });
    }

    for (const thread of content.communityThreads ?? []) {
      items.push({
        id: `thread-${thread.id}`,
        entityId: thread.id,
        kind: "Hilo",
        state: thread.visibility === "hidden" ? "hidden" : thread.status || "open",
        attention: thread.visibility === "hidden" ? "critica" : thread.status === "open" ? "nueva" : "seguimiento",
        title: thread.title,
        subtitle: `${thread.authorName ?? "Sin autor"}${thread.courseTitle ? ` · ${thread.courseTitle}` : ""}`,
        body: thread.body || "Sin contenido.",
        view: "community",
        manageLabel: "Gestionar hilo",
        source: thread,
      });
    }

    for (const submission of content.testimonialSubmissions ?? []) {
      items.push({
        id: `testimonial-${submission.id}`,
        entityId: submission.id,
        kind: "Moderacion",
        state: "pending_review",
        attention: "nueva",
        title: submission.author || "Testimonio pendiente",
        subtitle: submission.organization || "Formulario publico",
        body: submission.quote || "Sin cita disponible.",
        view: "community",
        manageLabel: "Abrir moderacion",
        source: submission,
      });
    }

    for (const request of content.sopChangeRequests ?? []) {
      if (request.status === "completed") {
        continue;
      }

      const lastComment = Array.isArray(request.comments) && request.comments.length ? request.comments[request.comments.length - 1] : null;
      items.push({
        id: `sop-request-${request.id}`,
        entityId: request.id,
        kind: "Cambio SOP",
        state: request.status || "open",
        attention: request.status === "open" ? "nueva" : "seguimiento",
        title: request.sopTitle || "Solicitud de cambio de SOP",
        subtitle: `${request.requesterName ?? "Sin remitente"} · ${request.requesterEmail ?? "Sin correo"}`,
        body: lastComment?.body || "Sin comentario adicional.",
        view: "sops",
        manageLabel: "Gestionar solicitud",
        source: request,
      });
    }

    return items.sort((left, right) => {
      const attentionWeight = { critica: 0, nueva: 1, seguimiento: 2, operativa: 3 };
      const leftWeight = attentionWeight[left.attention] ?? 99;
      const rightWeight = attentionWeight[right.attention] ?? 99;
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }

      return left.title.localeCompare(right.title);
    });
  }, [content.communityThreads, content.courseInterestRequests, content.sopChangeRequests, content.supportTickets, content.testimonialSubmissions, users]);
  const filteredQueueItems = useMemo(
    () =>
      queueItems.filter((item) => {
        const queryMatch = includesQuery(
          [item.kind, item.state, item.attention, item.title, item.subtitle, item.body],
          queueFilters.query
        );
        const kindMatch = queueFilters.kind === "all" || item.kind === queueFilters.kind;
        const stateMatch = queueFilters.state === "all" || item.state === queueFilters.state;
        const attentionMatch = queueFilters.attention === "all" || item.attention === queueFilters.attention;
        return queryMatch && kindMatch && stateMatch && attentionMatch;
      }),
    [queueFilters.attention, queueFilters.kind, queueFilters.query, queueFilters.state, queueItems]
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
      const roadmapItem = normalizeLearningPathItem(item);
      if (
        includesQuery(
          [
            roadmapItem.title,
            roadmapItem.track,
            roadmapItem.stageLabel,
            roadmapItem.description,
            roadmapItem.duration,
            roadmapItem.outcome,
            roadmapItem.progressState,
          ],
          query
        )
      ) {
        results.push({
          id: roadmapItem.id,
          type: "Roadmap",
          title: roadmapItem.title,
          subtitle: [roadmapItem.stageLabel, roadmapItem.track, roadmapItem.progressState].filter(Boolean).join(" · "),
          view: "identity",
        });
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
      if (includesQuery([item.fullName, item.email, item.role, ...(item.roles ?? []), item.status], query)) {
        results.push({
          id: item.id,
          type: "Usuario",
          title: item.fullName,
          subtitle: `${formatRolesLabel(item.roles, item.role)} · ${item.email}`,
          view: "people",
        });
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
        results.push({ id: item.id, type: "Ticket", title: item.subject, subtitle: `${item.status} · ${item.student?.fullName ?? "Sin estudiante"}`, view: "support" });
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

  function updateQueueFilter(key, value) {
    setQueueFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openAdminView(view, { filterKey = null, filterValue = "", sectionKey = null } = {}) {
    setActiveView(view);
    if (view === "community") {
      setCommunitySectionFocus(sectionKey || null);
    } else {
      setCommunitySectionFocus(null);
    }
    if (filterKey) {
      setViewFilters((current) => ({
        ...current,
        [filterKey]: filterValue,
      }));
    }
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

  function handleQueueItemManage(item) {
    const focus = getQueueFocusConfig(item);
    openAdminView(focus.view, focus);

    if (item.kind === "Ticket") {
      startEditSupportTicket(item.source);
      return;
    }

    if (item.kind === "Solicitud") {
      startEditCourseInterest(item.source);
      return;
    }

    if (item.kind === "Hilo") {
      startEditCommunityThread(item.source);
      return;
    }

    if (item.kind === "Cuenta") {
      startEditUser(item.source);
      return;
    }

    if (item.kind === "Cambio SOP") {
      setFocusedSopRequestId(item.source?.id ?? item.entityId ?? "");
    }
  }

  function handleQueueItemOpenSection(item) {
    const focus = getQueueFocusConfig(item);
    openAdminView(focus.view, focus);
  }

  useEffect(() => {
    if (activeView !== "community" || !communitySectionFocus) {
      return undefined;
    }

    const targetSection = communitySectionRefs.current[communitySectionFocus];
    if (!targetSection) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 40);

    return () => window.clearTimeout(timeoutId);
  }, [activeView, communitySectionFocus]);

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
      nav: String(landingForm.nav ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      benefits: String(landingForm.benefits ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      servicesTitle: String(landingForm.servicesTitle ?? "").trim(),
      subscriptionLabel: String(landingForm.subscriptionLabel ?? "").trim(),
      trustTitle: String(landingForm.trustTitle ?? "").trim(),
      contactTitle: String(landingForm.contactTitle ?? "").trim(),
      trustItems: String(landingForm.trustItems ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      contactInfo: {
        emailLabel: String(landingForm.contactInfo?.emailLabel ?? "").trim(),
        emailValue: String(landingForm.contactInfo?.emailValue ?? "").trim(),
        phoneLabel: String(landingForm.contactInfo?.phoneLabel ?? "").trim(),
        phonePrompt: String(landingForm.contactInfo?.phonePrompt ?? "").trim(),
        phoneValue: String(landingForm.contactInfo?.phoneValue ?? "").trim(),
      },
      socialLinks: {
        facebook: String(landingForm.socialLinks?.facebook ?? "").trim(),
        linkedin: String(landingForm.socialLinks?.linkedin ?? "").trim(),
        instagram: String(landingForm.socialLinks?.instagram ?? "").trim(),
      },
      programCards: (landingForm.programCards ?? []).map((card) => ({
        ...card,
        eyebrow: String(card.eyebrow ?? "").trim(),
        title: String(card.title ?? "").trim(),
        subtitle: String(card.subtitle ?? "").trim(),
        description: String(card.description ?? "").trim(),
        idealFor: String(card.idealFor ?? "").trim(),
        ctaLabel: String(card.ctaLabel ?? "").trim(),
        href: String(card.href ?? "").trim(),
        availablePrograms: Array.isArray(card.availablePrograms) ? card.availablePrograms.filter(Boolean) : [],
        includes: Array.isArray(card.includes) ? card.includes.filter(Boolean) : [],
        benefits: Array.isArray(card.benefits) ? card.benefits.filter(Boolean) : [],
        requirements: Array.isArray(card.requirements) ? card.requirements.filter(Boolean) : [],
        tags: Array.isArray(card.tags) ? card.tags.filter(Boolean) : [],
      })),
    };
  }

  function normalizeParticipationOptionsPayload() {
    return (participationOptionsForm ?? []).map((option) => ({
      ...option,
      eyebrow: String(option.eyebrow ?? "").trim(),
      title: String(option.title ?? "").trim(),
      price: String(option.price ?? "").trim(),
      priceNote: String(option.priceNote ?? "").trim(),
      description: String(option.description ?? "").trim(),
      ctaLabel: String(option.ctaLabel ?? "").trim(),
      href: String(option.href ?? "").trim(),
      highlights: Array.isArray(option.highlights) ? option.highlights.filter(Boolean) : [],
    }));
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
    const roadmapItem = normalizeLearningPathItem(item);
    setLearningForm({
      id: roadmapItem.id,
      title: roadmapItem.title,
      stageLabel: roadmapItem.stageLabel,
      track: roadmapItem.track,
      type: roadmapItem.track,
      description: roadmapItem.description,
      status: roadmapItem.description,
      duration: roadmapItem.duration,
      outcome: roadmapItem.outcome,
      progressState: roadmapItem.progressState,
      theme: roadmapItem.theme,
      order: String(roadmapItem.order ?? ""),
    });
    openModal("learning");
  }

  function startCreateCourse() {
    setCourseForm(initialCourseForm);
    setAssignmentDraft(initialAssignmentDraft);
    setRuleDraft(initialRuleDraft);
    openModal("course");
  }

  function startCreateCohort() {
    setCohortForm(initialCohortForm);
    openModal("cohort");
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

  function startEditCohort(item) {
    setCohortForm({
      id: item.id,
      title: item.title ?? "",
      courseId: item.courseId ?? "",
      teacherUserId: item.teacherUserId ?? "",
      status: item.status ?? "planned",
      startDate: String(item.startDate ?? "").slice(0, 10),
      endDate: String(item.endDate ?? "").slice(0, 10),
      capacity: String(item.capacity ?? ""),
      leaderboardVisibility: item.leaderboardVisibility ?? "private",
      description: item.description ?? "",
    });
    openModal("cohort");
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
      roles: user.roles ?? [user.role],
      status: user.status,
      assignedCourseIds: user.assignedCourseIds ?? [],
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
      passingThreshold: String(item.enhancement?.passingThreshold ?? 80),
      completionStatus: item.completionStatus ?? "in_progress",
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

  function startCreateSocialSource() {
    setSocialSourceForm(initialSocialSourceForm);
    openModal("social-source");
  }

  function startEditSocialSource(item) {
    setSocialSourceForm({
      id: item.id,
      nombre: item.nombre ?? "",
      plataforma: item.plataforma ?? "facebook",
      page_url: item.page_url ?? "",
      page_identifier: item.page_identifier ?? "",
      activo: item.activo !== false,
    });
    openModal("social-source");
  }

  function startEditNews(item) {
    setNewsForm({
      id: item.id,
      title: item.title ?? "",
      category: item.category ?? "",
      summary: item.summary ?? "",
      link: item.link ?? "",
      embed: item.embed ?? "",
      image: item.image ?? "",
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

  async function saveParticipation(event) {
    event.preventDefault();
    await runAction(
      async () => {
        await updateSection("participationSection", {
          eyebrow: String(participationSectionForm.eyebrow ?? "").trim(),
          title: String(participationSectionForm.title ?? "").trim(),
          description: String(participationSectionForm.description ?? "").trim(),
          footnote: String(participationSectionForm.footnote ?? "").trim(),
          detailsHref: String(participationSectionForm.detailsHref ?? "").trim(),
          detailsLabel: String(participationSectionForm.detailsLabel ?? "").trim(),
        });
        await updateSection("participationOptions", normalizeParticipationOptionsPayload());
      },
      "Modalidades actualizadas.",
      { closeAfter: true }
    );
  }

  function updateProgramCard(index, key, value) {
    setLandingForm((current) => ({
      ...current,
      programCards: (current.programCards ?? []).map((card, cardIndex) =>
        cardIndex === index ? { ...card, [key]: value } : card
      ),
    }));
  }

  function updateParticipationOption(index, key, value) {
    setParticipationOptionsForm((current) =>
      (current ?? []).map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option
      )
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

    const normalizedOrder = Number.parseInt(String(learningForm.order ?? "").trim(), 10);
    const payload = {
      id: learningForm.id || createItemId("learning"),
      title: learningForm.title.trim(),
      stageLabel: learningForm.stageLabel.trim() || "Trayectoria",
      track: learningForm.track.trim() || "Ruta academica",
      type: learningForm.track.trim() || "Ruta academica",
      description: learningForm.description.trim(),
      status: learningForm.description.trim(),
      duration: learningForm.duration.trim(),
      outcome: learningForm.outcome.trim(),
      progressState: learningForm.progressState.trim() || "Disponible",
      theme: learningForm.theme,
      order: Number.isFinite(normalizedOrder) ? normalizedOrder : 1,
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

  async function saveCohort(event) {
    event.preventDefault();
    if (!cohortForm.title.trim()) {
      throw new Error("La cohorte necesita un nombre.");
    }

    if (!cohortForm.courseId) {
      throw new Error("Selecciona un curso para la cohorte.");
    }

    const normalizedCapacity = Number.parseInt(String(cohortForm.capacity ?? "").trim(), 10);
    const selectedTeacher = teacherOptions.find((user) => user.id === cohortForm.teacherUserId);
    const selectedCourse = (content.courses ?? []).find((course) => course.id === cohortForm.courseId);

    const payload = {
      id: cohortForm.id || createItemId("cohort"),
      title: cohortForm.title.trim(),
      courseId: cohortForm.courseId,
      courseTitle: selectedCourse?.title ?? "",
      teacherUserId: cohortForm.teacherUserId || "",
      teacherName: selectedTeacher?.fullName ?? "",
      status: cohortForm.status,
      startDate: cohortForm.startDate || "",
      endDate: cohortForm.endDate || "",
      capacity: Number.isFinite(normalizedCapacity) && normalizedCapacity > 0 ? normalizedCapacity : "",
      leaderboardVisibility: cohortForm.leaderboardVisibility,
      description: cohortForm.description.trim(),
    };

    await runAction(
      () =>
        cohortForm.id
          ? updateCollectionItem("cohorts", cohortForm.id, payload)
          : createCollectionItem("cohorts", payload),
      cohortForm.id ? "Cohorte actualizada." : "Cohorte creada.",
      { closeAfter: true }
    );
  }

  async function saveUser(event) {
    event.preventDefault();
    const normalizedRoles = Array.from(new Set([userForm.role, ...(userForm.roles ?? [])]));
    const payload = {
      fullName: userForm.fullName,
      email: userForm.email,
      role: userForm.role,
      primaryRole: userForm.role,
      roles: normalizedRoles,
      status: userForm.status,
      assignedCourseIds: normalizedRoles.includes("teacher") ? userForm.assignedCourseIds ?? [] : [],
    };
    const successMessage = userForm.id
      ? "Usuario actualizado."
      : securitySettingsForm.requireEmailVerification && payload.roles.includes("student")
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
      setWorkspaceMessage("");
      setWorkspaceError("Debes abrir un usuario existente para actualizar su contrasena.");
      return;
    }

    if (!userForm.password.trim()) {
      setWorkspaceMessage("");
      setWorkspaceError("Ingresa una nueva contrasena segura.");
      return;
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
      setWorkspaceMessage("");
      setWorkspaceError("Debes abrir un usuario existente para enviar el enlace.");
      return;
    }

    await runAction(
      () => notifyUserPasswordReset(userForm.id),
      "Notificacion de recuperacion enviada al usuario."
    );
  }

  async function sendManagedUserVerification() {
    if (!userForm.id) {
      setWorkspaceMessage("");
      setWorkspaceError("Debes abrir un usuario existente para enviar el enlace.");
      return;
    }

    await runAction(
      () => notifyUserVerification(userForm.id),
      "Notificacion de verificacion enviada al usuario."
    );
  }

  async function deleteManagedUserAccount() {
    if (!userForm.id) {
      setWorkspaceMessage("");
      setWorkspaceError("Debes abrir un usuario existente para eliminar la cuenta.");
      return;
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
          passingThreshold: enrollmentForm.passingThreshold,
          completionStatus: enrollmentForm.completionStatus,
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
          passingThreshold: enrollmentForm.passingThreshold,
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

  async function saveSocialSource(event) {
    event.preventDefault();
    const payload = {
      nombre: socialSourceForm.nombre,
      plataforma: socialSourceForm.plataforma,
      page_url: socialSourceForm.page_url,
      page_identifier: socialSourceForm.page_identifier,
      activo: Boolean(socialSourceForm.activo),
    };

    await runAction(
      () =>
        socialSourceForm.id
          ? updateSocialSource(socialSourceForm.id, payload)
          : createSocialSource(payload),
      socialSourceForm.id ? "Fuente social actualizada." : "Fuente social creada.",
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
        filteredCohorts={filteredCohorts}
        deleteCollectionItem={deleteCollectionItem}
        filteredCourses={filteredCourses}
        startCreateCohort={startCreateCohort}
        startCreateCourse={startCreateCourse}
        startEditCohort={startEditCohort}
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

  function renderSopsView() {
    return (
      <AdminSopsSection
        changeRequests={content.sopChangeRequests ?? []}
        managedRequestId={focusedSopRequestId}
        onCreateSop={createSop}
        onDeleteSop={deleteSop}
        onManagedRequestHandled={() => setFocusedSopRequestId("")}
        onUpdateChangeRequest={updateSopChangeRequest}
        onUpdateSop={updateSop}
        onUploadAsset={uploadAsset}
        sops={content.sops ?? []}
      />
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

  function renderQueueView() {
    const criticalCount = filteredQueueItems.filter((item) => item.attention === "critica").length;
    const newCount = filteredQueueItems.filter((item) => item.attention === "nueva").length;
    const followUpCount = filteredQueueItems.filter((item) => item.attention === "seguimiento").length;

    return (
      <div className="grid gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Operación administrativa</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033] sm:text-3xl">Centro de administración</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6b7a90]">
            Monitorea solicitudes, comunidad, soporte y estado del sistema desde una sola vista.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <FilterInput
              onChange={(event) => updateQueueFilter("query", event.target.value)}
              placeholder="Buscar estudiantes, cursos o tickets…"
              value={queueFilters.query}
            />
          </div>
          <Select className="w-auto" value={queueFilters.kind} onChange={(event) => updateQueueFilter("kind", event.target.value)}>
            <option value="all">Todo</option>
            <option value="Cuenta">Cuentas</option>
            <option value="Ticket">Tickets</option>
            <option value="Solicitud">Solicitudes</option>
            <option value="Hilo">Hilos</option>
            <option value="Cambio SOP">SOPs</option>
            <option value="Moderacion">Moderacion</option>
          </Select>
          <SecondaryButton
            onClick={() => setQueueFilters({ query: "", kind: "all", state: "all", attention: "all" })}
            type="button"
          >
            Limpiar
          </SecondaryButton>
        </div>

        <CompactBand>
          <SmallStat variant="band" label="Solicitudes" value={filteredQueueItems.length} help="En bandeja" />
          <SmallStat variant="band" label="Críticos" value={criticalCount} help="Requieren acción" />
          <SmallStat variant="band" label="Nuevos" value={newCount} help="Sin gestión aún" />
          <SmallStat variant="band" label="Seguimiento" value={followUpCount} help="En observación" />
        </CompactBand>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.4fr)]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[18px] border border-b-0 border-[#d8e2f0] bg-[#f8fafc] px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Queue operativa</p>
              <div className="flex gap-2">
                <Select value={queueFilters.state} onChange={(event) => updateQueueFilter("state", event.target.value)}>
                  <option value="all">Todos los estados</option>
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                  <option value="reviewing">reviewing</option>
                  <option value="waitlist">waitlist</option>
                  <option value="pending_verification">pending_verification</option>
                  <option value="password_expired">password_expired</option>
                  <option value="hidden">hidden</option>
                  <option value="pending_review">pending_review</option>
                  <option value="inactive">inactive</option>
                </Select>
                <Select value={queueFilters.attention} onChange={(event) => updateQueueFilter("attention", event.target.value)}>
                  <option value="all">Toda atención</option>
                  <option value="critica">Crítica</option>
                  <option value="nueva">Nueva</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="operativa">Operativa</option>
                </Select>
              </div>
            </div>
            <div className="overflow-hidden rounded-b-[18px] border border-[#d8e2f0] bg-white">
              <ScrollArea>
                {filteredQueueItems.length ? (
                  filteredQueueItems.map((item) => (
                    <RowCard
                      density="compact"
                      key={item.id}
                      eyebrow={`${item.kind} · ${item.subtitle || ""}`}
                      title={item.title}
                      meta={item.body}
                    >
                      <StatusPill
                        status={
                          item.attention === "critica" ? "urgent"
                          : item.attention === "nueva" ? "pending"
                          : item.state === "resolved" ? "ready"
                          : "progress"
                        }
                        label={item.attention === "critica" ? "Urgente" : item.attention === "nueva" ? "Pendiente" : String(item.state ?? "").replace(/_/g, " ")}
                      />
                      <ActionButton className="!py-1.5 !text-xs" onClick={() => handleQueueItemManage(item)} type="button">
                        {item.manageLabel}
                      </ActionButton>
                      <SecondaryButton className="!py-1.5 !text-xs" onClick={() => handleQueueItemOpenSection(item)} type="button">
                        Ver
                      </SecondaryButton>
                      {item.kind === "Moderacion" ? (
                        <SecondaryButton className="!py-1.5 !text-xs" onClick={() => approveTestimonialSubmission(item.source)} type="button">
                          Aprobar
                        </SecondaryButton>
                      ) : null}
                    </RowCard>
                  ))
                ) : (
                  <div className="px-4 py-6">
                    <EmptyState
                      title="No hay coincidencias en la queue"
                      body="Ajusta los filtros o limpia la consulta para ver toda la bandeja."
                    />
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <div className="grid gap-4 content-start">
            <div className="rounded-[18px] border border-[#d8e2f0] bg-white overflow-hidden">
              <div className="border-b border-[#e8eef6] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Resumen rápido</p>
              </div>
              <div className="divide-y divide-[#edf1f7] px-4">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#536277]">Pendientes hoy</span>
                  <span className="text-sm font-black text-[#172033]">{filteredQueueItems.filter(i => i.attention === "nueva").length}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#536277]">Casos críticos</span>
                  <span className="text-sm font-black text-red-600">{criticalCount}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#536277]">En seguimiento</span>
                  <span className="text-sm font-black text-[#172033]">{followUpCount}</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#536277]">Total bandeja</span>
                  <span className="text-sm font-black text-[#172033]">{queueItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderCommunityView() {
    return (
      <div className="grid gap-6">
        <div ref={(node) => { communitySectionRefs.current.threads = node; }}>
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
          <ScrollArea className="max-h-none pr-0 lg:max-h-[32rem]">
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredCommunityThreads.length ? (
                filteredCommunityThreads.map((item) => (
                  <RowCard
                    key={item.id}
                    eyebrow={`${item.category || "general"} · ${item.visibility === "hidden" ? "oculto" : item.status || "open"}`}
                    title={item.title}
                    meta={[
                      item.authorName || "Sin autor",
                      item.courseTitle || null,
                      `${(item.replies ?? []).length} respuestas`,
                      `expira ${formatDate(item.expiresAt)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    body={item.body}
                  >
                    <SecondaryButton className="w-full sm:w-auto" onClick={() => startEditCommunityThread(item)} type="button">
                      Gestionar hilo
                    </SecondaryButton>
                    <SecondaryButton className="w-full sm:w-auto" onClick={() => deleteCollectionItem("communityThreads", item.id)} type="button">
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
        </div>

        <div ref={(node) => { communitySectionRefs.current.socialSources = node; }}>
        <SectionCard
          title="Fuentes sociales"
          description="Aqui defines que cuentas oficiales monitorea la automatizacion de noticias. Facebook, LinkedIn e Instagram se administran aqui; los links visibles del landing se editan aparte."
        >
          <SectionToolbar
            action={
              <ActionButton className="w-full sm:w-auto" onClick={startCreateSocialSource} type="button">
                Agregar fuente
              </ActionButton>
            }
            helper={`${filteredSocialSources.filter((item) => item.activo).length} activas · ${filteredSocialSources.filter((item) => item.automationStatus === "planned").length} planificadas · ${filteredSocialSources.length} visibles con el filtro actual.`}
          >
            <FilterInput
              onChange={(event) => updateViewFilter("socialSources", event.target.value)}
              placeholder="Filtrar por nombre, plataforma, URL, handle o estado"
              value={viewFilters.socialSources}
            />
          </SectionToolbar>
          <ScrollArea className="max-h-none pr-0 lg:max-h-[32rem]">
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredSocialSources.length ? (
                filteredSocialSources.map((item) => (
                  <RowCard
                    key={item.id}
                    eyebrow={`${item.plataforma} · ${item.activo ? "Activa" : "Inactiva"} · ${item.automationStatus === "active" ? "Automatizada" : "Planeada"}`}
                    title={item.nombre}
                    meta={item.page_identifier ? `${item.page_identifier}${item.page_url ? ` · ${item.page_url}` : ""}` : item.page_url || "Sin enlace registrado"}
                    body={
                      item.automationStatus === "active"
                        ? "Esta fuente ya puede recibir publicaciones automaticas por webhook."
                      : "La fuente queda registrada por UI, pero su automatizacion se activara cuando Make y el backend soporten esa red."
                  }
                >
                    <SecondaryButton className="w-full sm:w-auto" onClick={() => startEditSocialSource(item)} type="button">
                      Editar
                    </SecondaryButton>
                    <SecondaryButton className="w-full sm:w-auto" onClick={() => removeSocialSource(item.id)} type="button">
                      Eliminar
                    </SecondaryButton>
                  </RowCard>
                ))
              ) : socialSourcesLoading ? (
                <EmptyState title="Cargando fuentes sociales" body="Estamos consultando las cuentas configuradas en la base de datos." />
              ) : (
                <EmptyState title="No hay fuentes sociales que coincidan" body="Agrega una cuenta oficial para que el flujo de automatizacion pueda asociar publicaciones con una fuente conocida." />
              )}
            </div>
          </ScrollArea>
        </SectionCard>
        </div>

        <div ref={(node) => { communitySectionRefs.current.news = node; }}>
        <SectionCard
          title="Noticias y novedades"
          description="Esta area funciona como un bloque editorial completamente editable desde admin: imagen, resumen, enlace y orden por aparicion."
        >
          <SectionToolbar
            action={
              <ActionButton className="w-full sm:w-auto" onClick={startCreateNews} type="button">
                Crear noticia
              </ActionButton>
            }
            helper={`${filteredNews.filter((item) => item.status === "draft").length} borradores · ${filteredNews.filter((item) => item.featured).length} destacadas · ${filteredNews.length} visibles con el filtro actual.`}
          >
            <FilterInput
              onChange={(event) => updateViewFilter("news", event.target.value)}
              placeholder="Filtrar noticias por titulo, categoria, resumen o enlace"
              value={viewFilters.news}
            />
          </SectionToolbar>
          <ScrollArea className="max-h-none pr-0 lg:max-h-[32rem]">
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
                  <SecondaryButton className="w-full sm:w-auto" onClick={() => startEditNews(item)} type="button">
                    Editar
                  </SecondaryButton>
                  <SecondaryButton className="w-full sm:w-auto" onClick={() => deleteCollectionItem("news", item.id)} type="button">
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
        </div>

        <div ref={(node) => { communitySectionRefs.current.moderation = node; }}>
        <SectionCard
          title="Testimonios y comunidad"
          description="Publica testimonios desde un editor limpio y modera lo que llega del formulario publico sin saturar la pantalla."
        >
          <SectionToolbar
            action={
              <ActionButton className="w-full sm:w-auto" onClick={startCreateTestimonial} type="button">
                Crear testimonio
              </ActionButton>
            }
            helper={`${filteredTestimonials.length} testimonios publicados · ${content.testimonialSubmissions?.length ?? 0} pendientes de aprobacion.`}
          >
            <FilterInput
              onChange={(event) => updateViewFilter("testimonials", event.target.value)}
              placeholder="Filtrar testimonios por autor, institucion o contenido"
              value={viewFilters.testimonials}
            />
          </SectionToolbar>
          <ScrollArea className="max-h-none pr-0 lg:max-h-[32rem]">
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTestimonials.length ? (
              filteredTestimonials.map((item) => (
                <RowCard density="compact" key={item.id} title={item.author} meta={item.organization} body={`“${item.quote}”`}>
                  <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:gap-3">
                    <SecondaryButton className="w-full sm:w-auto" onClick={() => deleteCollectionItem("testimonials", item.id)} type="button">
                      Eliminar
                    </SecondaryButton>
                  </div>
                </RowCard>
              ))
            ) : (
              <EmptyState title="No hay testimonios que coincidan" body="Crea uno nuevo o ajusta el filtro actual." />
            )}
          </div>
          </ScrollArea>

          <div className="mt-8 rounded-[1.15rem] border border-[#dfe6ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Moderacion</p>
                <h4 className="mt-2 font-['Georgia'] text-[1.35rem] leading-tight text-[#172033] sm:text-2xl">Pendientes de aprobacion</h4>
              </div>
              <p className="text-sm text-[#617085]">{content.testimonialSubmissions?.length ?? 0} esperando revision</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {content.testimonialSubmissions?.length ? (
                content.testimonialSubmissions.map((item) => (
                  <RowCard density="compact" key={item.id} title={item.author} meta={item.organization} body={`“${item.quote}”`}>
                    <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:gap-3">
                      <ActionButton className="w-full sm:w-auto" onClick={() => approveTestimonialSubmission(item)} type="button">
                        Aprobar
                      </ActionButton>
                      <SecondaryButton className="w-full sm:w-auto" onClick={() => deleteCollectionItem("testimonialSubmissions", item.id)} type="button">
                        Rechazar
                      </SecondaryButton>
                    </div>
                  </RowCard>
                ))
              ) : (
                <EmptyState title="Todo al dia" body="No hay testimonios esperando moderacion en este momento." />
              )}
            </div>
          </div>
        </SectionCard>
        </div>
      </div>
    );
  }

  function renderSupportView() {
    return (
      <div className="grid gap-6">
        <SectionCard
          title="Tickets de soporte"
          description="Centraliza aqui los tickets reales generados por estudiantes. Esta vista existe solo para seguimiento operativo, prioridad, estado y resolucion administrativa."
        >
          <SectionToolbar
            helper={`${filteredSupportTickets.filter((item) => item.status === "open").length} abiertos · ${filteredSupportTickets.filter((item) => item.status === "in_progress").length} en seguimiento · ${filteredSupportTickets.length} visibles con el filtro actual.`}
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
                <EmptyState
                  title="No hay tickets que coincidan"
                  body="Cuando un estudiante solicite ayuda desde el portal, el ticket aparecera aqui para atencion administrativa."
                />
              )}
            </div>
          </ScrollArea>
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-[1.1rem] border border-[#dfe6ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <FilterInput
              onChange={(event) => setGlobalSearchQuery(event.target.value)}
              placeholder="Busca cursos, sesiones, usuarios, matriculas, noticias, testimonios o instituciones"
              value={globalSearchQuery}
            />
          </div>
          <div className="rounded-[1.1rem] border border-[#dfe6ee] bg-[#f8fafc] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Indice</p>
            <p className="mt-3 text-sm leading-relaxed text-[#617085]">
              {globalSearchResults.length
                ? `${globalSearchResults.length} coincidencias activas. Usa "Abrir seccion" para saltar directo al bloque relacionado.`
                : "Escribe una palabra clave para recorrer identidad, cursos, personas y comunidad desde una sola vista."}
            </p>
          </div>
        </div>

        <ScrollArea className="mt-4">
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
            <Textarea
              value={metricsToLines(heroForm.metrics)}
              onChange={(event) => setHeroForm({ ...heroForm, metrics: linesToMetrics(event.target.value) })}
              placeholder="Metricas del hero: Etiqueta | Valor | Descripcion"
            />
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar hero</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

      if (modal === "landing") {
        const setLanding = (key, value) => setLandingForm((f) => ({ ...f, [key]: value }));
        const setContactInfo = (key, value) => setLandingForm((f) => ({ ...f, contactInfo: { ...f.contactInfo, [key]: value } }));
        const setSocialLinks = (key, value) => setLandingForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }));

        return (
          <ModalShell
            title="Editar landing page"
            subtitle="Todos los textos y etiquetas del sitio publico, organizados por seccion."
            onClose={closeModal}
            size="wide"
          >
            <form className="grid gap-6" onSubmit={saveLanding}>

              {/* ── NAVEGACIÓN ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Navegación</p>
                <Input value={landingForm.nav ?? ""} onChange={(e) => setLanding("nav", e.target.value)} placeholder="Etiquetas de navegación, separadas por comas: Inicio, Sobre nosotros, ..." />
                <p className="text-[11px] text-[#8899b0]">Escribe las etiquetas del menú separadas por coma. El orden importa.</p>
              </div>

              {/* ── HERO ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Hero — Botones</p>
                <p className="text-[11px] text-[#8899b0]">El texto del hero (título, descripción) se edita en el modal "Hero". Aquí van los botones CTA.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={landingForm.heroPrimaryCtaLabel ?? ""} onChange={(e) => setLanding("heroPrimaryCtaLabel", e.target.value)} placeholder="Botón principal (Empezar ahora)" />
                  <Input value={landingForm.heroSecondaryCtaLabel ?? ""} onChange={(e) => setLanding("heroSecondaryCtaLabel", e.target.value)} placeholder="Botón secundario (Explorar catálogo)" />
                </div>
              </div>

              {/* ── SOBRE NOSOTROS ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Sobre nosotros</p>
                <Input value={landingForm.aboutTitle ?? ""} onChange={(e) => setLanding("aboutTitle", e.target.value)} placeholder="Etiqueta de sección (Sobre nosotros)" />
                <Textarea value={landingForm.aboutBody ?? ""} onChange={(e) => setLanding("aboutBody", e.target.value)} placeholder="Párrafo principal" />
                <Textarea value={landingForm.aboutBodyTwo ?? ""} onChange={(e) => setLanding("aboutBodyTwo", e.target.value)} placeholder="Párrafo secundario (panel derecho / Sobre nosotros)" />
                <Textarea value={landingForm.benefits ?? ""} onChange={(e) => setLanding("benefits", e.target.value)} placeholder="Beneficios / bullets, uno por línea" />
                <p className="text-[11px] text-[#8899b0]">Los beneficios aparecen como lista en la sección Sobre nosotros. Un punto por línea.</p>
              </div>

              {/* ── SERVICIOS ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Servicios</p>
                <Input value={landingForm.servicesTitle ?? ""} onChange={(e) => setLanding("servicesTitle", e.target.value)} placeholder="Etiqueta de sección (Nuestros servicios)" />
                <Input value={landingForm.subscriptionLabel ?? ""} onChange={(e) => setLanding("subscriptionLabel", e.target.value)} placeholder="Encabezado grande de servicios (Ruta de desarrollo continuo.)" />
                <Textarea value={landingForm.relevanceBody ?? ""} onChange={(e) => setLanding("relevanceBody", e.target.value)} placeholder="Descripción de relevancia laboral" />
              </div>

              {/* ── PROGRAMAS Y CURSOS ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Programas y cursos</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={landingForm.coursesTitle ?? ""} onChange={(e) => setLanding("coursesTitle", e.target.value)} placeholder="Etiqueta de sección (Programas y cursos)" />
                  <Input value={landingForm.coursesHeading ?? ""} onChange={(e) => setLanding("coursesHeading", e.target.value)} placeholder="Encabezado (Creados para el Impacto Real.)" />
                  <Input value={landingForm.courseResultsLabel ?? ""} onChange={(e) => setLanding("courseResultsLabel", e.target.value)} placeholder="Etiqueta de resultados (Resultados:)" />
                </div>
                {/* Program cards */}
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#748197]">Tarjetas de programas</p>
                {(landingForm.programCards ?? []).map((card, index) => (
                  <div key={card.id || index} className="grid gap-3 rounded-xl border border-[#dfe6ee] bg-white p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8899b0]">Tarjeta {index + 1}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input value={card.eyebrow ?? ""} onChange={(e) => updateProgramCard(index, "eyebrow", e.target.value)} placeholder="Etiqueta superior" />
                      <Input value={card.title ?? ""} onChange={(e) => updateProgramCard(index, "title", e.target.value)} placeholder="Título" />
                    </div>
                    <Input value={card.subtitle ?? ""} onChange={(e) => updateProgramCard(index, "subtitle", e.target.value)} placeholder="Subtítulo" />
                    <Textarea value={card.description ?? ""} onChange={(e) => updateProgramCard(index, "description", e.target.value)} placeholder="Descripción" />
                    <Textarea value={listToLines(card.availablePrograms)} onChange={(e) => updateProgramCard(index, "availablePrograms", linesToList(e.target.value))} placeholder="Programas disponibles, uno por línea" />
                    <Textarea value={listToLines(card.includes)} onChange={(e) => updateProgramCard(index, "includes", linesToList(e.target.value))} placeholder="Incluye, uno por línea" />
                    <Textarea value={listToLines(card.benefits)} onChange={(e) => updateProgramCard(index, "benefits", linesToList(e.target.value))} placeholder="Beneficios adicionales, uno por línea" />
                    <Textarea value={listToLines(card.requirements)} onChange={(e) => updateProgramCard(index, "requirements", linesToList(e.target.value))} placeholder="Requisitos, uno por línea" />
                    <Textarea value={card.idealFor ?? ""} onChange={(e) => updateProgramCard(index, "idealFor", e.target.value)} placeholder="Ideal para" />
                    <Textarea value={listToLines(card.tags)} onChange={(e) => updateProgramCard(index, "tags", linesToList(e.target.value))} placeholder="Etiquetas, una por línea" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input value={card.ctaLabel ?? ""} onChange={(e) => updateProgramCard(index, "ctaLabel", e.target.value)} placeholder="Texto del botón" />
                      <Input value={card.href ?? ""} onChange={(e) => updateProgramCard(index, "href", e.target.value)} placeholder="Enlace del botón" />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── MODALIDADES (IMPACTO) ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Modalidades — Etiquetas</p>
                <p className="text-[11px] text-[#8899b0]">El contenido de las modalidades (títulos, precios, descripción) se edita en el modal "Modalidades".</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={landingForm.participationCostLabel ?? ""} onChange={(e) => setLanding("participationCostLabel", e.target.value)} placeholder="Etiqueta costo (Costo)" />
                  <Input value={landingForm.participationCloseLabel ?? ""} onChange={(e) => setLanding("participationCloseLabel", e.target.value)} placeholder="Etiqueta cierre (Cierre)" />
                  <Input value={landingForm.participationDetailsEyebrow ?? ""} onChange={(e) => setLanding("participationDetailsEyebrow", e.target.value)} placeholder="Etiqueta detalles (Más detalles)" />
                </div>
              </div>

              {/* ── TESTIMONIOS Y CONFIANZA ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Testimonios y confianza</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={landingForm.trustTitle ?? ""} onChange={(e) => setLanding("trustTitle", e.target.value)} placeholder="Etiqueta de sección (Red de confianza)" />
                  <Input value={landingForm.testimonialTitle ?? ""} onChange={(e) => setLanding("testimonialTitle", e.target.value)} placeholder="Título principal (Testimonios)" />
                  <Input value={landingForm.testimonialsCarouselLabel ?? ""} onChange={(e) => setLanding("testimonialsCarouselLabel", e.target.value)} placeholder="Etiqueta del carrusel" />
                </div>
              </div>

              {/* ── CONVENIOS / INSTITUCIONES ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Carrusel de instituciones</p>
                <Input value={landingForm.institutionsCarouselTitle ?? ""} onChange={(e) => setLanding("institutionsCarouselTitle", e.target.value)} placeholder="Título del carrusel" />
                <Input value={landingForm.institutionsCarouselLabel ?? ""} onChange={(e) => setLanding("institutionsCarouselLabel", e.target.value)} placeholder="Etiqueta de estado (Convenios activos)" />
                <Textarea value={landingForm.institutionsCarouselBody ?? ""} onChange={(e) => setLanding("institutionsCarouselBody", e.target.value)} placeholder="Descripción del carrusel" />
              </div>

              {/* ── NOTICIAS ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Noticias</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={landingForm.newsTitle ?? ""} onChange={(e) => setLanding("newsTitle", e.target.value)} placeholder="Título de sección (Noticias)" />
                  <Input value={landingForm.newsArchiveLabel ?? ""} onChange={(e) => setLanding("newsArchiveLabel", e.target.value)} placeholder="Botón ver más (Ver más noticias)" />
                </div>
              </div>

              {/* ── CONTACTO ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Contacto</p>
                <Input value={landingForm.contactTitle ?? ""} onChange={(e) => setLanding("contactTitle", e.target.value)} placeholder="Etiqueta de sección (Contacto)" />
                <Input value={landingForm.contactBody ?? ""} onChange={(e) => setLanding("contactBody", e.target.value)} placeholder="Texto introductorio de contacto" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={landingForm.contactInfo?.emailLabel ?? ""} onChange={(e) => setContactInfo("emailLabel", e.target.value)} placeholder="Etiqueta email (Email)" />
                  <Input value={landingForm.contactInfo?.emailValue ?? ""} onChange={(e) => setContactInfo("emailValue", e.target.value)} placeholder="Dirección email" />
                  <Input value={landingForm.contactInfo?.phoneLabel ?? ""} onChange={(e) => setContactInfo("phoneLabel", e.target.value)} placeholder="Etiqueta teléfono (Teléfono)" />
                  <Input value={landingForm.contactInfo?.phonePrompt ?? ""} onChange={(e) => setContactInfo("phonePrompt", e.target.value)} placeholder="Texto auxiliar teléfono (Llámanos)" />
                  <Input value={landingForm.contactInfo?.phoneValue ?? ""} onChange={(e) => setContactInfo("phoneValue", e.target.value)} placeholder="Número de teléfono" className="md:col-span-2" />
                </div>
              </div>

              {/* ── REDES SOCIALES ── */}
              <div className="grid gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fbff] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1d4ed8]">Redes sociales</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input value={landingForm.socialLinks?.facebook ?? ""} onChange={(e) => setSocialLinks("facebook", e.target.value)} placeholder="URL Facebook" />
                  <Input value={landingForm.socialLinks?.linkedin ?? ""} onChange={(e) => setSocialLinks("linkedin", e.target.value)} placeholder="URL LinkedIn" />
                  <Input value={landingForm.socialLinks?.instagram ?? ""} onChange={(e) => setSocialLinks("instagram", e.target.value)} placeholder="URL Instagram" />
                </div>
              </div>

              <div className="flex gap-3">
                <ActionButton type="submit">Guardar landing page</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>
          </ModalShell>
        );
      }

    if (modal === "participation") {
      return (
        <ModalShell
          title="Editar modalidades"
          subtitle="Todo este contenido aparece en la seccion Modalidades del landing."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveParticipation}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={participationSectionForm.eyebrow} onChange={(event) => setParticipationSectionForm({ ...participationSectionForm, eyebrow: event.target.value })} placeholder="Etiqueta superior" />
              <Input value={participationSectionForm.title} onChange={(event) => setParticipationSectionForm({ ...participationSectionForm, title: event.target.value })} placeholder="Titulo" />
            </div>
            <Textarea value={participationSectionForm.description} onChange={(event) => setParticipationSectionForm({ ...participationSectionForm, description: event.target.value })} placeholder="Descripcion" />
            <Textarea value={participationSectionForm.footnote} onChange={(event) => setParticipationSectionForm({ ...participationSectionForm, footnote: event.target.value })} placeholder="Cierre" />
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={participationSectionForm.detailsLabel} onChange={(event) => setParticipationSectionForm({ ...participationSectionForm, detailsLabel: event.target.value })} placeholder="Texto del enlace de detalles" />
              <Input value={participationSectionForm.detailsHref} onChange={(event) => setParticipationSectionForm({ ...participationSectionForm, detailsHref: event.target.value })} placeholder="URL de detalles" />
            </div>
            <div className="grid gap-4 rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Opciones visibles</p>
              {(participationOptionsForm ?? []).map((option, index) => (
                <div key={option.id || index} className="grid gap-3 rounded-xl border border-[#dfe6ee] bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={option.eyebrow ?? ""} onChange={(event) => updateParticipationOption(index, "eyebrow", event.target.value)} placeholder="Etiqueta" />
                    <Input value={option.title ?? ""} onChange={(event) => updateParticipationOption(index, "title", event.target.value)} placeholder="Titulo" />
                    <Input value={option.price ?? ""} onChange={(event) => updateParticipationOption(index, "price", event.target.value)} placeholder="Costo" />
                    <Input value={option.priceNote ?? ""} onChange={(event) => updateParticipationOption(index, "priceNote", event.target.value)} placeholder="Nota del costo" />
                  </div>
                  <Textarea value={option.description ?? ""} onChange={(event) => updateParticipationOption(index, "description", event.target.value)} placeholder="Descripcion" />
                  <Textarea value={listToLines(option.highlights)} onChange={(event) => updateParticipationOption(index, "highlights", linesToList(event.target.value))} placeholder="Puntos destacados, uno por linea" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={option.ctaLabel ?? ""} onChange={(event) => updateParticipationOption(index, "ctaLabel", event.target.value)} placeholder="Texto del boton" />
                    <Input value={option.href ?? ""} onChange={(event) => updateParticipationOption(index, "href", event.target.value)} placeholder="URL del boton" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <ActionButton type="submit">Guardar modalidades</ActionButton>
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
              <div className="grid gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Plantillas de sesiones</p>
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
          title={learningForm.id ? "Editar hito" : "Crear hito"}
          subtitle="Piensa cada item como una etapa clara dentro del roadmap de aprendizaje."
          onClose={closeModal}
        >
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={saveLearning}>
              <div className="grid gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Plantillas de roadmap</p>
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
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={learningForm.stageLabel}
                  onChange={(event) => setLearningForm({ ...learningForm, stageLabel: event.target.value })}
                  placeholder="Etapa o encabezado"
                />
                <Input
                  value={learningForm.track}
                  onChange={(event) => setLearningForm({ ...learningForm, track: event.target.value, type: event.target.value })}
                  placeholder="Enfoque o categoria"
                />
              </div>
              <Input value={learningForm.title} onChange={(event) => setLearningForm({ ...learningForm, title: event.target.value })} placeholder="Titulo del hito" />
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  value={learningForm.duration}
                  onChange={(event) => setLearningForm({ ...learningForm, duration: event.target.value })}
                  placeholder="Duracion"
                />
                <Input
                  value={learningForm.order}
                  onChange={(event) => setLearningForm({ ...learningForm, order: event.target.value })}
                  placeholder="Orden"
                />
                <Select
                  value={learningForm.progressState}
                  onChange={(event) => setLearningForm({ ...learningForm, progressState: event.target.value })}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="En curso">En curso</option>
                  <option value="Proximamente">Proximamente</option>
                </Select>
              </div>
              <Select value={learningForm.theme} onChange={(event) => setLearningForm({ ...learningForm, theme: event.target.value })}>
                <option value="blue">Azul institucional</option>
                <option value="gold">Dorado calido</option>
                <option value="green">Verde progreso</option>
              </Select>
              <Textarea
                value={learningForm.description}
                onChange={(event) => setLearningForm({ ...learningForm, description: event.target.value, status: event.target.value })}
                placeholder="Descripcion principal del hito"
              />
              <Textarea
                value={learningForm.outcome}
                onChange={(event) => setLearningForm({ ...learningForm, outcome: event.target.value })}
                placeholder="Resultado esperado o capacidad que se desarrolla"
              />
              <div className="flex gap-3">
                <ActionButton type="submit">{learningForm.id ? "Guardar cambios" : "Crear hito"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            {(() => {
              const preview = normalizeLearningPathItem(learningForm, Math.max((Number.parseInt(String(learningForm.order ?? "1"), 10) || 1) - 1, 0));
              const theme = getLearningPathThemeClasses(preview.theme);

              return (
                <div className={`rounded-[22px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)] ${theme.card}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${theme.badge}`}>
                      {preview.stageLabel || "Trayectoria"}
                    </span>
                    {preview.duration ? (
                      <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">
                        {preview.duration}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{preview.track || "Ruta academica"}</p>
                  <h3 className="mt-2 text-[1.45rem] font-semibold leading-tight text-[#172033]">{preview.title || "Titulo del hito"}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#536277]">
                    {preview.description || "La descripcion breve del hito aparecera aqui como vista previa del roadmap."}
                  </p>
                  {preview.outcome ? (
                    <div className="mt-4 rounded-[18px] border border-[#d7e0ea] bg-white/90 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Resultado esperado</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#435066]">{preview.outcome}</p>
                    </div>
                  ) : null}
                </div>
              );
            })()}
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
              <div className="grid gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Plantillas de cursos</p>
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
                  <label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Portada o panel del curso</label>
                  <p className="text-sm leading-6 text-[#617085]">
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

              <div className="grid gap-4 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Asignaciones del curso</p>
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

              <div className="grid gap-4 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Gamificacion del curso</p>
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

            <article className="rounded-[1.25rem] border border-[#dbe3ec] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-7 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
              {courseForm.coverImage ? (
                <div className="mb-5 aspect-[16/9] overflow-hidden rounded-[1rem] bg-[#eef3f8]">
                  <img alt={courseForm.title || "Portada del curso"} className="h-full w-full object-cover" src={courseForm.coverImage} />
                </div>
              ) : null}
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">
                {(courseForm.format || "Formato") + " · " + (courseForm.duration || "Duracion")}
              </p>
              <h3 className="mt-3 font-['Georgia'] text-3xl text-[#172033]">{courseForm.title || "Nombre del curso"}</h3>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#748197]">
                {courseForm.audience || "Publico objetivo"}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#617085]">
                {courseForm.detailSummary || "Los detalles adicionales del curso apareceran aqui para una experiencia mas completa."}
              </p>
              <p className="mt-4 leading-7 text-[#324154]">
                {courseForm.description || "La descripcion aparecera aqui para que puedas revisar tono y claridad antes de guardar."}
              </p>
              <p className="mt-4 border-t border-[#e2e8f0] pt-4 text-sm leading-6 text-[#617085]">
                <strong className="text-[#172033]">Resultados esperados:</strong>{" "}
                {courseForm.outcomes || "Los resultados del curso se mostraran aqui como vista previa."}
              </p>
              <div className="mt-4 border-t border-[#e2e8f0] pt-4 text-sm text-[#617085]">
                <strong className="text-[#172033]">Asignaciones:</strong> {(courseForm.assignments ?? []).length}
              </div>
              <div className="mt-2 text-sm text-[#617085]">
                <strong className="text-[#172033]">Reglas de gamificacion:</strong> {(courseForm.gamificationRules ?? []).length}
              </div>
            </article>
          </div>
        </ModalShell>
      );
    }

    if (modal === "cohort") {
      return (
        <ModalShell
          title={cohortForm.id ? "Editar cohorte" : "Crear cohorte"}
          subtitle="Define el grupo operativo de entrada para un curso, sus fechas y la visibilidad futura del leaderboard."
          onClose={closeModal}
        >
          <form className="grid gap-4" onSubmit={saveCohort}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input value={cohortForm.title} onChange={(event) => setCohortForm({ ...cohortForm, title: event.target.value })} placeholder="Nombre visible de la cohorte" />
              <Select value={cohortForm.status} onChange={(event) => setCohortForm({ ...cohortForm, status: event.target.value })}>
                <option value="planned">Planificada</option>
                <option value="active">Activa</option>
                <option value="completed">Completada</option>
                <option value="archived">Archivada</option>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={cohortForm.courseId} onChange={(event) => setCohortForm({ ...cohortForm, courseId: event.target.value })}>
                <option value="">Selecciona un curso</option>
                {(content.courses ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </Select>
              <Select value={cohortForm.teacherUserId} onChange={(event) => setCohortForm({ ...cohortForm, teacherUserId: event.target.value })}>
                <option value="">Sin docente asignado</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input type="date" value={cohortForm.startDate} onChange={(event) => setCohortForm({ ...cohortForm, startDate: event.target.value })} />
              <Input type="date" value={cohortForm.endDate} onChange={(event) => setCohortForm({ ...cohortForm, endDate: event.target.value })} />
              <Input value={cohortForm.capacity} onChange={(event) => setCohortForm({ ...cohortForm, capacity: event.target.value })} placeholder="Cupo maximo" />
            </div>
            <Select value={cohortForm.leaderboardVisibility} onChange={(event) => setCohortForm({ ...cohortForm, leaderboardVisibility: event.target.value })}>
              <option value="private">Leaderboard privado</option>
              <option value="group-visible">Visible para la cohorte</option>
              <option value="public-names">Visible con nombres completos</option>
            </Select>
            <Textarea value={cohortForm.description} onChange={(event) => setCohortForm({ ...cohortForm, description: event.target.value })} placeholder="Notas operativas, objetivo de la entrada o contexto del grupo" />
            <div className="rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 text-sm leading-6 text-[#617085]">
              La cohorte se configura primero a nivel operativo. En el siguiente paso enlazaremos las matriculas individuales a una cohorte especifica sin perder progreso ni tareas por estudiante.
            </div>
            <div className="flex gap-3">
              <ActionButton type="submit">{cohortForm.id ? "Guardar cohorte" : "Crear cohorte"}</ActionButton>
              <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
            </div>
          </form>
        </ModalShell>
      );
    }

    if (modal === "user") {
    const assignedRoles = Array.from(
      new Set(((userForm.roles?.length ? userForm.roles : [userForm.role]) ?? []).filter(Boolean))
    );
    const canRemoveAssignedRole = assignedRoles.length > 1;

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
                <div className="grid gap-2">
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                    placeholder="Nueva contrasena manual"
                  />
                  <p className="text-sm leading-6 text-[#617085]">
                    Usa este campo solo si vas a cambiar la contrasena manualmente. Para que el usuario la cambie por su cuenta, usa el enlace de recuperacion.
                  </p>
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Rol principal</p>
                  <Select
                    value={userForm.role}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                  >
                    {roleOptions
                      .filter((roleOption) => assignedRoles.includes(roleOption))
                      .map((roleOption) => (
                        <option key={roleOption} value={roleOption}>
                          {roleOption}
                        </option>
                      ))}
                  </Select>
                </div>
                <Select value={userForm.status} onChange={(event) => setUserForm({ ...userForm, status: event.target.value })}>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </Select>
              </div>
              <div className="grid gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Roles asignados</p>
                <p className="text-sm leading-6 text-[#617085]">
                  El rol principal define el contexto inicial al ingresar. Los roles adicionales habilitan otros workspaces y el switcher de contexto.
                </p>
                <p className="text-xs leading-6 text-[#748197]">Debes dejar al menos un rol asignado. Si quieres cambiar el contexto inicial, usa el selector de rol principal.</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {roleOptions.map((roleOption) => {
                    const checked = (userForm.roles ?? []).includes(roleOption);
                    return (
                      <label
                        key={roleOption}
                        className="flex items-center gap-3 rounded-[0.9rem] border border-[#dbe3ec] bg-white px-3 py-3 text-sm text-[#172033]"
                      >
                        <input
                          checked={checked}
                          disabled={checked && !canRemoveAssignedRole}
                          onChange={(event) => {
                            const nextRoles = event.target.checked
                              ? Array.from(new Set([...(assignedRoles ?? []), roleOption]))
                              : assignedRoles.filter((item) => item !== roleOption);
                            setUserForm((current) => ({
                              ...current,
                              role: nextRoles.includes(current.role) ? current.role : nextRoles[0] ?? current.role,
                              roles: nextRoles.length ? nextRoles : [current.role],
                              assignedCourseIds:
                                roleOption === "teacher" && !event.target.checked ? [] : current.assignedCourseIds ?? [],
                            }));
                          }}
                          type="checkbox"
                        />
                        <span>{roleOption}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {assignedRoles.includes("teacher") ? (
                <div className="grid gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Cursos a cargo</p>
                  <p className="text-sm leading-6 text-[#617085]">
                    El docente solo podra operar cursos, matriculas, tareas e incidencias de los programas que queden asignados aqui.
                  </p>
                  <div className="grid gap-2">
                    {(content.courses ?? []).length ? (
                      (content.courses ?? []).map((course) => {
                        const checked = (userForm.assignedCourseIds ?? []).includes(course.id);
                        return (
                          <label
                            key={course.id}
                            className="flex items-start gap-3 rounded-[0.9rem] border border-[#dbe3ec] bg-white px-3 py-3 text-sm text-[#172033]"
                          >
                            <input
                              checked={checked}
                              onChange={(event) => {
                                setUserForm((current) => {
                                  const currentIds = Array.isArray(current.assignedCourseIds) ? current.assignedCourseIds : [];
                                  const nextIds = event.target.checked
                                    ? Array.from(new Set([...currentIds, course.id]))
                                    : currentIds.filter((item) => item !== course.id);

                                  return {
                                    ...current,
                                    assignedCourseIds: nextIds,
                                  };
                                });
                              }}
                              type="checkbox"
                            />
                            <span className="grid gap-1">
                              <span className="font-semibold text-[#172033]">{course.title}</span>
                              <span className="text-xs leading-5 text-[#748197]">
                                {course.audience || "Curso"} · {course.format || "Formato libre"}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="rounded-[0.9rem] border border-dashed border-[#dbe3ec] bg-white px-3 py-4 text-sm text-[#617085]">
                        Aun no hay cursos disponibles para asignar.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="flex gap-3">
                <ActionButton type="submit">{userForm.id ? "Guardar cambios" : "Crear usuario"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
              {userForm.id ? (
                <div className="grid gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Acciones de credenciales</p>
                  {securitySettingsForm.allowAdminPasswordChange ? (
                    <SecondaryButton onClick={saveManagedUserPassword} type="button">
                      Cambiar contrasena ahora
                    </SecondaryButton>
                  ) : (
                    <p className="text-sm leading-6 text-[#617085]">La politica actual no permite cambios manuales de contrasena desde administracion.</p>
                  )}
                  {securitySettingsForm.allowAdminResetNotification ? (
                    <SecondaryButton onClick={sendManagedUserPasswordReset} type="button">
                      Enviar enlace de recuperacion
                    </SecondaryButton>
                  ) : (
                    <p className="text-sm leading-6 text-[#617085]">La politica actual no permite enviar enlaces de recuperacion desde administracion.</p>
                  )}
                  {currentEditingUser?.emailVerified ? (
                    <p className="text-sm leading-6 text-[#617085]">La cuenta ya esta verificada y no necesita un nuevo enlace.</p>
                  ) : securitySettingsForm.allowAdminVerificationNotification ? (
                    <SecondaryButton onClick={sendManagedUserVerification} type="button">
                      Enviar enlace de verificacion
                    </SecondaryButton>
                  ) : (
                    <p className="text-sm leading-6 text-[#617085]">La politica actual no permite enviar enlaces de verificacion desde administracion.</p>
                  )}
                  <SecondaryButton onClick={deleteManagedUserAccount} type="button">
                    Eliminar cuenta
                  </SecondaryButton>
                  <p className="text-sm leading-6 text-[#617085]">
                    Esta accion elimina la cuenta y cierra sus sesiones. No podras borrar tu propia cuenta ni dejar al sistema sin un admin activo.
                  </p>
                </div>
              ) : null}
            </form>

            <RowCard
              eyebrow={`${formatRolesLabel(userForm.roles, userForm.role) || "student"} · ${userForm.status || "active"} · ${currentEditingUser?.emailVerified ? "correo verificado" : "correo pendiente"}`}
              title={userForm.fullName || "Nombre del usuario"}
              meta={userForm.email || "correo@dominio.com"}
              body="Vista previa de como quedara esta cuenta dentro del listado administrativo."
            >
              {currentEditingUser ? (
                <>
                  <p className="w-full text-sm leading-6 text-[#617085]">
                    Verificacion de correo:{" "}
                    {currentEditingUser.emailVerified
                      ? `Completada el ${formatDate(currentEditingUser.emailVerifiedAt)}`
                      : "Pendiente de activacion"}
                  </p>
                  <p className="w-full text-sm leading-6 text-[#617085]">
                    Ultimo cambio de contrasena: {formatDate(currentEditingUser.passwordChangedAt)}
                  </p>
                  <p className="w-full text-sm leading-6 text-[#617085]">
                    {currentEditingUser.passwordExpiresAt
                      ? `Expira el ${formatDate(currentEditingUser.passwordExpiresAt)}`
                      : "Sin expiracion automatica activa"}
                  </p>
                  <p className="w-full text-sm leading-6 text-[#617085]">
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

              <label className="flex items-center gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3 text-sm text-[#172033] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
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

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={enrollmentForm.passingThreshold}
                  onChange={(event) => setEnrollmentForm({ ...enrollmentForm, passingThreshold: event.target.value })}
                  placeholder="Umbral de aprobacion % (ej. 80)"
                />
                {enrollmentForm.id ? (
                  <select
                    className="rounded-[var(--radius-input)] border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dbeafe]"
                    value={enrollmentForm.completionStatus}
                    onChange={(event) => setEnrollmentForm({ ...enrollmentForm, completionStatus: event.target.value })}
                  >
                    <option value="in_progress">En progreso</option>
                    <option value="passed">Aprobado</option>
                    <option value="failed">No aprobado</option>
                  </select>
                ) : null}
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
                <p className="text-sm leading-6 text-[#617085]">
                  Expira el {formatDate(currentThread?.expiresAt)}{currentThread?.lastAdminActionAt ? ` · ultima gestion ${formatDate(currentThread.lastAdminActionAt)}` : ""}
                </p>
                {currentThread?.adminNote ? <p className="text-sm leading-6 text-[#617085]">{currentThread.adminNote}</p> : null}
              </RowCard>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Respuestas</p>
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
              {currentTicket?.adminNote ? (
                <MarkdownContent className="text-sm leading-6 text-[#617085]">{currentTicket.adminNote}</MarkdownContent>
              ) : null}
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
              {currentRequest?.adminNote ? (
                <MarkdownContent className="text-sm leading-6 text-[#617085]">{currentRequest.adminNote}</MarkdownContent>
              ) : null}
            </RowCard>
          </div>
        </ModalShell>
      );
    }

      if (modal === "social-source") {
        return (
          <ModalShell
            title={socialSourceForm.id ? "Editar fuente social" : "Agregar fuente social"}
            subtitle="Esta configuracion controla que cuentas oficiales se reconocen por webhook. Los secretos siguen viviendo en variables de entorno, no en este formulario."
            onClose={closeModal}
          >
            <form className="grid gap-4" onSubmit={saveSocialSource}>
              <Input
                value={socialSourceForm.nombre}
                onChange={(event) => setSocialSourceForm((current) => ({ ...current, nombre: event.target.value }))}
                placeholder="Nombre visible de la fuente"
              />
              <Select
                value={socialSourceForm.plataforma}
                onChange={(event) => setSocialSourceForm((current) => ({ ...current, plataforma: event.target.value }))}
              >
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
              </Select>
              <Input
                value={socialSourceForm.page_url}
                onChange={(event) => setSocialSourceForm((current) => ({ ...current, page_url: event.target.value }))}
                placeholder="https://www.facebook.com/..."
              />
              <Input
                value={socialSourceForm.page_identifier}
                onChange={(event) => setSocialSourceForm((current) => ({ ...current, page_identifier: event.target.value }))}
                placeholder="ID de pagina, slug o handle"
              />
              <label className="flex items-center gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3 text-sm text-[#172033] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <input
                  checked={Boolean(socialSourceForm.activo)}
                  onChange={(event) => setSocialSourceForm((current) => ({ ...current, activo: event.target.checked }))}
                  type="checkbox"
                />
                Mantener la fuente activa para automatizacion
              </label>
              <p className="text-sm leading-6 text-[#617085]">
                Facebook, LinkedIn e Instagram quedan listos para ingestion automatica por webhook una vez conectes su escenario en Make.
              </p>
              <div className="flex gap-3">
                <ActionButton type="submit">{socialSourceForm.id ? "Guardar cambios" : "Crear fuente"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>
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
              <label className="flex items-center gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3 text-sm text-[#172033] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
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
              <div className="grid gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">Portada de la noticia</label>
                <p className="text-sm leading-6 text-[#617085]">
                  Usa una imagen propia para asegurar una miniatura estable en el landing. Los enlaces embebidos no siempre generan vista previa visual.
                </p>
                <Input
                  value={newsForm.image}
                  onChange={(event) => setNewsForm((current) => ({ ...current, image: event.target.value }))}
                  placeholder="https://imagen-de-portada.com/noticia.jpg"
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
                      const asset = await uploadMedia(file, "news-image");
                      setNewsForm((current) => ({ ...current, image: asset.url }));
                      setWorkspaceMessage(asset.deduplicated ? "Portada reutilizada desde la biblioteca existente." : "Portada subida a la biblioteca.");
                    } catch (error) {
                      setWorkspaceError(error.message);
                    }
                  }}
                />
                <MediaLibraryStrip
                  emptyLabel="Cuando subas portadas de noticias apareceran aqui para reutilizarlas."
                  items={imageLibraryItems.filter((item) => item.purpose === "news-image")}
                  onSelect={(item) => setNewsForm((current) => ({ ...current, image: item.url }))}
                />
              </div>
              <Textarea
                value={newsForm.embed}
                onChange={(event) => setNewsForm((current) => ({ ...current, embed: event.target.value }))}
                placeholder={'Pega aqui el embed o iframe. Ejemplo: <iframe src="https://..."></iframe> o solo https://...'}
              />
              <p className="text-sm leading-6 text-[#617085]">
                Puedes pegar el codigo embed completo o solo una URL embebida de video, publicacion o recurso externo.
              </p>
              <div className="flex gap-3">
                <ActionButton type="submit">{newsForm.id ? "Guardar cambios" : "Crear noticia"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>

            <article className="overflow-hidden rounded-[1.25rem] border border-[#dbe3ec] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
              {getPreviewEmbedUrl(newsForm.embed) ? (
                <div className="aspect-[16/9] bg-[#eef3f8]">
                  <iframe
                    allow={EMBED_IFRAME_ALLOW}
                    allowFullScreen
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox={EMBED_IFRAME_SANDBOX}
                    src={getPreviewEmbedUrl(newsForm.embed)}
                    title={newsForm.title || "Vista previa de la noticia"}
                  />
                </div>
              ) : newsForm.image ? (
                <div className="aspect-[16/9] bg-[#eef3f8]">
                  <img alt={newsForm.title || "Vista previa de la noticia"} className="h-full w-full object-cover" src={newsForm.image} />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[linear-gradient(135deg,#edf2f7_0%,#f8fafc_100%)]" />
              )}
              <div className="p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">
                  {newsForm.category || "Noticia"} · {newsForm.status === "draft" ? "Borrador" : newsForm.featured ? "Destacada" : "Publicada"}
                </p>
                <h3 className="mt-3 font-['Georgia'] text-3xl text-[#172033]">{newsForm.title || "Titulo de la noticia"}</h3>
                <MarkdownContent className="mt-4 leading-7 text-[#324154]">
                  {newsForm.summary || "El resumen de la noticia aparecera aqui para revisar claridad y tono antes de publicarla."}
                </MarkdownContent>
                <p className="mt-4 text-sm leading-6 text-[#617085]">
                  <strong className="text-[#172033]">Publicacion:</strong>{" "}
                  {newsForm.publishedAt ? formatDate(newsForm.publishedAt) : "Se asignara automaticamente al publicar."}
                </p>
                <p className="mt-4 border-t border-[#e2e8f0] pt-4 text-sm leading-6 text-[#617085]">
                  <strong className="text-[#172033]">Enlace:</strong> {newsForm.link || "Sin enlace de referencia por ahora."}
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
                  <p className="text-sm leading-6 text-[#617085]">
                    Puedes pegar el codigo embed completo o solo la URL del contenido insertado. El landing usara eso como vista principal.
                  </p>
                <label className="flex items-center gap-3 rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3 text-sm text-[#172033] shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
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

              <article className="overflow-hidden rounded-[1.25rem] border border-[#dbe3ec] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <div className="aspect-[16/10] bg-[#eef3f8]">
                  {getPreviewEmbedUrl(institutionForm.embed) ? (
                    <iframe
                      allow={EMBED_IFRAME_ALLOW}
                      allowFullScreen
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox={EMBED_IFRAME_SANDBOX}
                      src={getPreviewEmbedUrl(institutionForm.embed)}
                      title={institutionForm.name || "Vista previa institucional"}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-[#617085]">
                      La vista previa del embed aparecera aqui
                    </div>
                  )}
                </div>
                <div className="p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#748197]">
                    {institutionForm.featured ? "Destacada en landing" : "Guardada solo en admin"}
                  </p>
                  <h3 className="mt-3 font-['Georgia'] text-3xl text-[#172033]">
                    {institutionForm.name || "Nombre de la institucion"}
                  </h3>
                  <p className="mt-4 leading-7 text-[#324154]">
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

  const systemMessage = authError || workspaceError || workspaceMessage || "";
  const systemMessageTone = authError || workspaceError ? "warning" : workspaceMessage ? "accent" : "default";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Operación administrativa</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033] sm:text-3xl">Portal administrador</h1>
          <p className="mt-0.5 text-sm text-[#6b7a90]">Monitorea solicitudes, comunidad, soporte y estado del sistema.</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-[#d8e2f0] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#536277]">
          {adminViewLabels[activeView]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <FilterInput
            onChange={(event) => {
              const nextQuery = event.target.value;
              setGlobalSearchQuery(nextQuery);
              if (nextQuery.trim()) {
                setActiveView("search");
              }
            }}
            placeholder="Buscar estudiantes, cursos o tickets…"
            value={globalSearchQuery}
          />
        </div>
        <SecondaryButton
          className="shrink-0"
          onClick={() => {
            setGlobalSearchQuery("");
            if (activeView === "search") {
              setActiveView("queue");
            }
          }}
          type="button"
        >
          Limpiar
        </SecondaryButton>
      </div>

      <CompactBand>
        <SmallStat variant="band" label="Cursos" value={content.courses?.length ?? 0} help="Catálogo" />
        <SmallStat variant="band" label="Usuarios" value={users.length} help="Cuentas" />
        <SmallStat variant="band" label="Matrículas" value={enrollments.length} help="Accesos" />
        <SmallStat variant="band" label="Queue" value={queueItems.length} help="Pendientes" />
      </CompactBand>

      {systemMessage ? (
        <div className={`rounded-[14px] border px-4 py-3 text-sm leading-relaxed ${
          systemMessageTone === "warning"
            ? "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]"
            : "border-[#c6d4ec] bg-[#eef4ff] text-[#1d4ed8]"
        }`}>
          {systemMessage}
        </div>
      ) : null}

      {activeView === "queue" ? renderQueueView() : null}
      {activeView === "identity" ? renderIdentityView() : null}
      {activeView === "catalog" ? renderCatalogView() : null}
      {activeView === "people" ? renderPeopleView() : null}
      {activeView === "support" ? renderSupportView() : null}
      {activeView === "community" ? renderCommunityView() : null}
      {activeView === "sops" ? renderSopsView() : null}
      {activeView === "search" ? renderSearchView() : null}

      {renderModal()}
    </div>
  );
}
