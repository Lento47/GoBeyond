import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "../../shared/MarkdownEditor";
import { MarkdownContent } from "../../shared/MarkdownContent";
import { WorkspaceView } from "../../shared/WorkspaceView";
import {
  ActionButton,
  CompactBand,
  EmptyState,
  Input,
  ModalShell,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  Select,
  SmallStat,
  StatusPill,
  Textarea,
} from "./components/admin/AdminUI";
import { uploadAdminAsset } from "../../services/contentApi";
import { TeacherSopsSection } from "./SopsWorkspaceV2";

const initialAssignmentForm = {
  courseId: "",
  assignmentId: "",
  title: "",
  instruction: "",
  dueLabel: "",
  dueAt: "",
  dueDate: "",
  dueTime: "",
  fileKey: "",
  fileName: "",
  fileType: "",
  fileUploadedAt: "",
  fileUrl: "",
  attachments: [],
};

const initialEnrollmentForm = {
  id: "",
  userId: "",
  courseId: "",
  status: "active",
  accessDays: "45",
  accessExpiresAt: "",
  gamificationEnabled: false,
  progressPercent: "0",
  points: "0",
  streakDays: "0",
  passingThreshold: "80",
  completionStatus: "in_progress",
};

const initialSupportForm = {
  kind: "ticket",
  id: "",
  status: "open",
  priority: "normal",
  visibility: "visible",
  bestReplyId: "",
  adminNote: "",
  replies: [],
};

function formatDate(value) {
  if (!value) {
    return "Sin fecha definida";
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

function formatDateTime(value) {
  if (!value) {
    return "Sin actualizacion";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocalParts(value) {
  if (!value) {
    return { dueDate: "", dueTime: "" };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { dueDate: "", dueTime: "" };
  }

  const pad = (segment) => String(segment).padStart(2, "0");

  return {
    dueDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    dueTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function buildAssignmentDueState(dueDate, dueTime) {
  const normalizedDate = String(dueDate ?? "").trim();
  const normalizedTime = String(dueTime ?? "").trim();

  if (!normalizedDate) {
    return { dueAt: "", dueLabel: "" };
  }

  const isoCandidate = `${normalizedDate}T${normalizedTime || "23:59"}`;
  const parsed = new Date(isoCandidate);

  if (Number.isNaN(parsed.getTime())) {
    return { dueAt: "", dueLabel: "" };
  }

  return {
    dueAt: parsed.toISOString(),
    dueLabel: parsed.toLocaleString("es-CR", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function createAttachmentId() {
  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleCase(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function WorkspaceNotice({ message, tone = "info" }) {
  if (!message) {
    return null;
  }

  const toneClass =
    tone === "error"
      ? "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]"
      : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";

  return <div className={`rounded-[18px] border px-4 py-3 text-sm leading-relaxed ${toneClass}`}>{message}</div>;
}

function CourseStudentsPreview({ students }) {
  if (!students.length) {
    return <p className="text-sm text-[#617085]">Aun no hay estudiantes matriculados en este curso.</p>;
  }

  return (
    <div className="grid gap-2">
      {students.slice(0, 4).map((student) => (
        <div
          className="flex items-center justify-between gap-3 rounded-[16px] border border-[#dbe3ec] bg-white px-3 py-3"
          key={student.enrollmentId}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#172033]">{student.fullName}</p>
            <p className="truncate text-xs text-[#617085]">
              {student.email || "Sin correo"} · {titleCase(student.status)}
            </p>
          </div>
          <div className="text-right text-xs text-[#617085]">
            <p>{student.progressPercent}% progreso</p>
            <p>{student.points} pts</p>
          </div>
        </div>
      ))}
      {students.length > 4 ? (
        <p className="text-xs uppercase tracking-[0.18em] text-[#6b7a90]">+ {students.length - 4} estudiantes adicionales</p>
      ) : null}
    </div>
  );
}

function SupportList({ items, emptyTitle, emptyBody, renderMeta, actionLabel, onAction }) {
  if (!items.length) {
    return <EmptyState body={emptyBody} title={emptyTitle} />;
  }

  return (
    <ScrollArea className="max-h-[26rem]">
      <div className="grid gap-3">
        {items.map((item) => (
          <RowCard
            body={item.adminNote ? `Nota interna: ${item.adminNote}` : ""}
            density="compact"
            eyebrow={titleCase(item.status || item.priority || "Activo")}
            key={item.id}
            meta={renderMeta(item)}
            title={item.subject || item.courseTitle || item.title || "Elemento"}
          >
            <SecondaryButton onClick={() => onAction(item)} type="button">
              {actionLabel}
            </SecondaryButton>
          </RowCard>
        ))}
      </div>
    </ScrollArea>
  );
}

export function TeacherExperience(props) {
  const {
    currentUser,
    activeSection = "teacher-overview",
    dashboard,
    dashboardLoading,
    dashboardError,
    courses,
    coursesLoading,
    coursesError,
    enrollmentsView,
    enrollmentsLoading,
    enrollmentsError,
    support,
    supportLoading,
    supportError,
    sops,
    sopActiveRequests,
    sopsLoading,
    sopsError,
    sopNotification,
    onCreateAssignment,
    onUpdateAssignment,
    onDeleteAssignment,
    onCreateEnrollment,
    onUpdateEnrollment,
    onDeleteEnrollment,
    onUpdateSupportItem,
    onAcknowledgeSopNotification,
    onRequestSopChange,
  } = props;
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [supportForm, setSupportForm] = useState(initialSupportForm);
  const [modal, setModal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const teacherName = currentUser?.fullName || "Docente";
  const teacherCourseOptions =
    (enrollmentsView?.courseOptions ?? []).length > 0
      ? enrollmentsView.courseOptions
      : (courses ?? []).map((course) => ({
          id: course.id,
          title: course.title,
        }));
  const liveOpenCases =
    (support?.tickets ?? []).filter((item) => item.status !== "closed").length +
    (support?.courseRequests ?? []).filter((item) => item.status !== "closed").length +
    (support?.threads ?? []).filter((item) => item.status !== "closed").length;
  const liveActiveStudents = new Set(
    (enrollmentsView?.enrollments ?? [])
      .filter((item) => item.status === "active")
      .map((item) => item.student?.id || item.userId)
      .filter(Boolean)
  ).size;
  const metrics = {
    assignedCourses: coursesLoading ? dashboard?.metrics?.assignedCourses ?? 0 : courses?.length ?? 0,
    activeCohorts: coursesLoading
      ? dashboard?.metrics?.activeCohorts ?? 0
      : courses?.reduce((total, course) => total + (course.cohorts ?? []).filter((item) => item.status === "active").length, 0) ?? 0,
    activeStudents: enrollmentsLoading ? dashboard?.metrics?.activeStudents ?? 0 : liveActiveStudents,
    pendingAssignments: coursesLoading
      ? dashboard?.metrics?.pendingAssignments ?? 0
      : courses?.reduce((total, course) => total + ((course.assignments ?? []).length || 0), 0) ?? 0,
    openCases: supportLoading ? dashboard?.metrics?.openCases ?? 0 : liveOpenCases,
  };
  const teacherSection = activeSection || "teacher-overview";
  const selectedCourse = (courses ?? []).find((c) => c.id === selectedCourseId) ?? (courses ?? [])[0] ?? null;

  function closeModal() {
    setModal("");
    setSubmitting(false);
  }

  function startCreateAssignment(courseId = "") {
    setAssignmentForm({
      ...initialAssignmentForm,
      courseId,
    });
    setModal("assignment");
  }

  function startEditAssignment(courseId, assignment) {
    const dueParts = toDateTimeLocalParts(assignment.dueAt);
    const attachments =
      Array.isArray(assignment.attachments) && assignment.attachments.length
        ? assignment.attachments
        : assignment.fileKey
          ? [{
              id: "legacy",
              fileKey: assignment.fileKey ?? "",
              fileName: assignment.fileName ?? "",
              fileType: assignment.fileType ?? "",
              fileUploadedAt: assignment.fileUploadedAt ?? "",
              fileExpiresAt: assignment.fileExpiresAt ?? "",
              fileUrl: assignment.fileUrl ?? "",
            }]
          : [];
    setAssignmentForm({
      courseId,
      assignmentId: assignment.id,
      title: assignment.title ?? "",
      instruction: assignment.instruction ?? "",
      dueLabel: assignment.dueLabel ?? "",
      dueAt: assignment.dueAt ?? "",
      dueDate: dueParts.dueDate,
      dueTime: dueParts.dueTime,
      fileKey: assignment.fileKey ?? "",
      fileName: assignment.fileName ?? "",
      fileType: assignment.fileType ?? "",
      fileUploadedAt: assignment.fileUploadedAt ?? "",
      fileUrl: assignment.fileUrl ?? "",
      attachments,
    });
    setModal("assignment");
  }

  function startCreateEnrollment(courseId = "") {
    setEnrollmentForm({
      ...initialEnrollmentForm,
      courseId,
    });
    setModal("enrollment");
  }

  function startEditEnrollment(enrollment) {
    setEnrollmentForm({
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      status: enrollment.status ?? "active",
      accessDays: "45",
      accessExpiresAt: enrollment.accessExpiresAt ?? "",
      gamificationEnabled: Boolean(enrollment.enhancement?.gamificationEnabled),
      progressPercent: String(enrollment.enhancement?.progressPercent ?? 0),
      points: String(enrollment.enhancement?.points ?? 0),
      streakDays: String(enrollment.enhancement?.streakDays ?? 0),
      passingThreshold: String(enrollment.enhancement?.passingThreshold ?? 80),
      completionStatus: enrollment.completionStatus ?? "in_progress",
    });
    setModal("enrollment");
  }

  function startManageSupport(kind, item) {
    setSupportForm({
      kind,
      id: item.id,
      status: item.status ?? "open",
      priority: item.priority ?? "normal",
      visibility: item.visibility ?? "visible",
      bestReplyId: item.bestReplyId ?? "",
      adminNote: item.adminNote ?? "",
      replies: item.replies ?? [],
    });
    setModal("support");
  }

  async function handleAssignmentSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      const dueState = buildAssignmentDueState(assignmentForm.dueDate, assignmentForm.dueTime);
      const attachments = Array.isArray(assignmentForm.attachments) ? assignmentForm.attachments : [];
      const payload = {
        courseId: assignmentForm.courseId,
        title: assignmentForm.title,
        instruction: assignmentForm.instruction,
        dueAt: dueState.dueAt,
        dueLabel: dueState.dueLabel,
        fileKey: attachments[0]?.fileKey ?? assignmentForm.fileKey,
        fileName: attachments[0]?.fileName ?? assignmentForm.fileName,
        fileType: attachments[0]?.fileType ?? assignmentForm.fileType,
        fileUploadedAt: attachments[0]?.fileUploadedAt ?? assignmentForm.fileUploadedAt,
        fileExpiresAt: attachments[0]?.fileExpiresAt ?? "",
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          fileKey: attachment.fileKey,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileUploadedAt: attachment.fileUploadedAt,
          fileExpiresAt: attachment.fileExpiresAt ?? "",
        })),
      };

      if (assignmentForm.assignmentId) {
        await onUpdateAssignment({
          assignmentId: assignmentForm.assignmentId,
          ...payload,
        });
        setActionMessage("Material actualizado en el curso docente.");
      } else {
        await onCreateAssignment(payload);
        setActionMessage("Material publicado para el curso seleccionado.");
      }
      closeModal();
    } catch (requestError) {
      setActionError(requestError.message);
      setSubmitting(false);
    }
  }

  async function handleAssignmentDelete() {
    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      await onDeleteAssignment({
        courseId: assignmentForm.courseId,
        assignmentId: assignmentForm.assignmentId,
      });
      setActionMessage("Material eliminado del curso docente.");
      closeModal();
    } catch (requestError) {
      setActionError(requestError.message);
      setSubmitting(false);
    }
  }

  async function handleEnrollmentSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    const payload = {
      userId: enrollmentForm.userId,
      courseId: enrollmentForm.courseId,
      status: enrollmentForm.status,
      accessDays: Number(enrollmentForm.accessDays || 45),
      accessExpiresAt: enrollmentForm.accessExpiresAt,
      gamificationEnabled: enrollmentForm.gamificationEnabled,
      progressPercent: Number(enrollmentForm.progressPercent || 0),
      points: Number(enrollmentForm.points || 0),
      streakDays: Number(enrollmentForm.streakDays || 0),
      passingThreshold: Number(enrollmentForm.passingThreshold || 80),
      completionStatus: enrollmentForm.completionStatus,
    };

    try {
      if (enrollmentForm.id) {
        await onUpdateEnrollment(enrollmentForm.id, payload);
        setActionMessage("Matricula actualizada dentro del alcance docente.");
      } else {
        await onCreateEnrollment(payload);
        setActionMessage("Matricula creada para uno de tus cursos asignados.");
      }
      closeModal();
    } catch (requestError) {
      setActionError(requestError.message);
      setSubmitting(false);
    }
  }

  async function handleEnrollmentDelete() {
    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      await onDeleteEnrollment(enrollmentForm.id);
      setActionMessage("Matricula eliminada del curso docente.");
      closeModal();
    } catch (requestError) {
      setActionError(requestError.message);
      setSubmitting(false);
    }
  }

  async function handleSupportSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");
    setActionMessage("");

    try {
      await onUpdateSupportItem({
        kind: supportForm.kind,
        id: supportForm.id,
        status: supportForm.status,
        priority: supportForm.priority,
        visibility: supportForm.visibility,
        bestReplyId: supportForm.bestReplyId,
        adminNote: supportForm.adminNote,
      });
      setActionMessage("Elemento operativo actualizado dentro del contexto docente.");
      closeModal();
    } catch (requestError) {
      setActionError(requestError.message);
      setSubmitting(false);
    }
  }

  function renderOverviewSection() {
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]" id="teacher-overview">
        <div className="grid gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Operación docente</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033] sm:text-3xl">
              {dashboard?.welcomeTitle || `Workspace docente`}
            </h1>
            <MarkdownContent className="mt-1 text-sm leading-relaxed text-[#6b7a90]">
              {dashboard?.summary || "Tu espacio operativo para gestionar clases, contenidos, estudiantes y actividades académicas."}
            </MarkdownContent>
          </div>

          <CompactBand>
            <SmallStat variant="band" label="Clases activas" value={dashboardLoading ? "…" : metrics.assignedCourses} help="Programas bajo tu alcance" />
            <SmallStat variant="band" label="Cohortes activas" value={dashboardLoading ? "…" : metrics.activeCohorts} help="Grupos configurados" />
            <SmallStat variant="band" label="Estudiantes" value={dashboardLoading ? "…" : metrics.activeStudents} help="Activos en tus cohortes" />
            <SmallStat variant="band" label="Materiales" value={dashboardLoading ? "…" : metrics.pendingAssignments} help="Publicados" />
            <SmallStat variant="band" label="Casos abiertos" value={dashboardLoading ? "…" : metrics.openCases} help="Requieren atención" />
          </CompactBand>
        </div>

        <div className="rounded-[18px] border border-[#d8e2f0] bg-white overflow-hidden">
          <div className="border-b border-[#e8eef6] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Actividad reciente</p>
          </div>
          {dashboardLoading ? (
            <p className="px-4 py-3 text-sm text-[#617085]">Cargando actividad…</p>
          ) : dashboard?.recentCases?.length ? (
            <ScrollArea className="max-h-[22rem]">
              {dashboard.recentCases.map((item) => (
                <RowCard
                  density="compact"
                  eyebrow={titleCase(item.kind)}
                  key={`${item.kind}-${item.id}`}
                  meta={`${item.subtitle || "Sin referencia"} · ${formatDateTime(item.updatedAt)}`}
                  title={item.title}
                >
                  <StatusPill status={item.status === "open" ? "pending" : item.status === "closed" ? "draft" : "progress"} label={titleCase(item.status)} />
                </RowCard>
              ))}
            </ScrollArea>
          ) : (
            <div className="px-4 py-6">
              <EmptyState body="Todavia no hay actividad reciente dentro de tu alcance docente." title="Sin actividad" />
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderCoursesSection() {
    const COURSE_COLORS = ["#2563eb", "#059669", "#7c3aed", "#d97706", "#e11d48", "#0891b2"];
    const selectedIndex = (courses ?? []).findIndex((c) => c.id === selectedCourse?.id);
    const selectedColor = COURSE_COLORS[Math.max(selectedIndex, 0) % COURSE_COLORS.length];

    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]" id="teacher-courses">
        {/* Left — course list */}
        <div className="grid gap-4 content-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Operación docente</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033]">Clases y grupos</h1>
            <p className="mt-0.5 text-sm text-[#6b7a90]">Selecciona un curso para ver sus materiales y grupos.</p>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-[#d8e2f0] bg-white">
            {coursesLoading ? (
              <p className="px-4 py-3 text-sm text-[#617085]">Cargando cursos asignados…</p>
            ) : (courses ?? []).length ? (
              (courses ?? []).map((course, index) => {
                const isSelected = course.id === selectedCourse?.id;
                const accent = COURSE_COLORS[index % COURSE_COLORS.length];
                const initials = String(course.title ?? "")
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("");
                return (
                  <div
                    key={course.id}
                    className={`flex items-center gap-3 border-b border-[#edf1f7] last:border-b-0 cursor-pointer transition-colors px-3 py-3 ${
                      isSelected ? "bg-[#eef4ff] border-l-2 border-l-[#1d4ed8]" : "hover:bg-[#f7f9fc]"
                    }`}
                    onClick={() => setSelectedCourseId(course.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedCourseId(course.id); }}
                  >
                    {/* Color avatar */}
                    <div
                      className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-[11px] font-black text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {initials || "GB"}
                    </div>

                    {/* Course info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#172033]">{course.title}</p>
                      <p className="text-[10px] text-[#8899b0]">
                        {course.format || "Formato libre"}{course.audience ? ` · ${course.audience}` : ""}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-[10px] text-[#66758c]">
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {course.activeStudentCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                          </svg>
                          {(course.assignments ?? []).length} mat.
                        </span>
                      </div>
                    </div>

                    {/* Single action */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <SecondaryButton
                        className="!py-1.5 !text-xs shrink-0"
                        onClick={() => setSelectedCourseId(course.id)}
                        type="button"
                      >
                        Entrar →
                      </SecondaryButton>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6">
                <EmptyState
                  body="Asigna cursos a esta cuenta desde el panel administrativo para habilitar la operacion docente real."
                  title="Sin cursos asignados"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right — aula panel */}
        <div className="grid gap-4 content-start">
          <div className="overflow-hidden rounded-[18px] border border-[#d7e0ea] bg-white">

            {/* A) Header con color del curso */}
            <div
              className="relative px-4 py-4"
              style={{ background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)` }}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70">Ahora en clase</p>
              <p className="mt-0.5 text-base font-black leading-tight text-white">
                {selectedCourse?.title || "Ninguna clase seleccionada"}
              </p>
              {selectedCourse ? (
                <p className="mt-0.5 text-[10px] text-white/70">
                  {selectedCourse.activeStudentCount ?? 0} activos · {(selectedCourse.assignments ?? []).length} materiales
                </p>
              ) : null}
              {selectedCourse ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white/30"
                    onClick={() => startCreateAssignment(selectedCourse.id)}
                    type="button"
                  >
                    + Material
                  </button>
                  <button
                    className="rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white/30"
                    onClick={() => startCreateEnrollment(selectedCourse.id)}
                    type="button"
                  >
                    Matricular
                  </button>
                </div>
              ) : null}
            </div>

            {/* B) Grupos activos */}
            {selectedCourse ? (
              <div className="border-t border-[#e7edf5] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Grupos activos</p>
                {(selectedCourse.cohorts ?? []).length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedCourse.cohorts ?? []).map((cohort) => {
                      const isActive = cohort.status === "active";
                      return (
                        <span
                          key={cohort.id}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                            isActive
                              ? "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8]"
                              : "border-[#d8e2f0] bg-[#f7f9fc] text-[#536277]"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#1d4ed8]" : "bg-[#d0d8e4]"}`} />
                          {cohort.title}
                          {cohort.startDate ? (
                            <span className="opacity-60">· {formatDate(cohort.startDate)}</span>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-[#8899b0]">Sin grupos configurados para este curso.</p>
                )}
              </div>
            ) : null}

            {/* C) Materiales */}
            <div className="border-t border-[#e7edf5] divide-y divide-[#e7edf5]">
              {(selectedCourse?.assignments ?? []).slice(0, 6).map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fbff] transition-colors">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                    <svg className="h-3.5 w-3.5 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#172033]">{assignment.title}</p>
                    {assignment.dueLabel ? (
                      <p className="text-[10px] text-[#6b7a90]">{assignment.dueLabel}</p>
                    ) : null}
                  </div>
                  <SecondaryButton
                    className="!py-1 !px-2.5 !text-[10px] shrink-0"
                    onClick={() => startEditAssignment(selectedCourse?.id, assignment)}
                    type="button"
                  >
                    Editar
                  </SecondaryButton>
                </div>
              ))}
              <p className="px-4 py-3 text-xs text-[#8899b0]">
                {selectedCourse
                  ? (selectedCourse.assignments ?? []).length === 0
                    ? "Sin materiales publicados aún en este curso."
                    : null
                  : "Selecciona un curso de la lista para ver sus materiales."}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderAssignmentsSection() {
    return (
      <SectionCard
        description="Organiza los materiales publicados en tus cursos desde una ruta clara y escaneable."
        title="Aula"
      >
        <div className="grid gap-4" id="teacher-assignments">
          {coursesLoading ? (
            <p className="text-sm text-[#617085]">Cargando materiales docentes...</p>
          ) : courses.some((course) => (course.assignments ?? []).length) ? (
            courses.map((course) => (
              <div className="grid gap-3" key={`assignments-${course.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Ruta de clase</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#172033]">{course.title}</h3>
                  </div>
                  <ActionButton onClick={() => startCreateAssignment(course.id)} type="button">
                    Agregar material
                  </ActionButton>
                </div>
                {(course.assignments ?? []).length ? (
                  <div className="grid gap-3">
                    {(course.assignments ?? []).map((assignment) => (
                      <RowCard
                        body={assignment.instruction}
                        density="compact"
                        eyebrow={assignment.dueLabel ? `Programado ${assignment.dueLabel}` : "Sin fecha definida"}
                        key={assignment.id}
                        meta={[
                          course.title,
                          `${(assignment.attachments ?? []).length || (assignment.fileName ? 1 : 0)} adjunto${((assignment.attachments ?? []).length || (assignment.fileName ? 1 : 0)) === 1 ? "" : "s"}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        title={assignment.title}
                      >
                        <SecondaryButton onClick={() => startEditAssignment(course.id, assignment)} type="button">
                          Editar
                        </SecondaryButton>
                      </RowCard>
                    ))}
                  </div>
                ) : (
                  <EmptyState body="Todavia no has publicado materiales en este curso." title="Sin materiales" />
                )}
              </div>
            ))
          ) : (
            <EmptyState body="Crea el primer material en cualquiera de tus cursos." title="Sin materiales publicados" />
          )}
        </div>
      </SectionCard>
    );
  }

  function renderOperationsSection() {
    return (
      <section className="grid gap-4" id="teacher-operations">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Operación docente</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033]">Operaciones</h1>
          <p className="mt-0.5 text-sm text-[#6b7a90]">Matriculas, soporte y comunidad ligados a tus cursos.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="grid gap-4 content-start">
            <div className="rounded-[18px] border border-[#d8e2f0] bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#e8eef6] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Matriculas</p>
                <ActionButton className="!py-1.5 !text-xs" onClick={() => startCreateEnrollment()} type="button">
                  + Nueva matricula
                </ActionButton>
              </div>
              {enrollmentsLoading ? (
                <p className="px-4 py-3 text-sm text-[#617085]">Cargando matriculas…</p>
              ) : enrollmentsView?.enrollments?.length ? (
                <ScrollArea className="max-h-[28rem]">
                  {enrollmentsView.enrollments.map((enrollment) => (
                    <RowCard
                      density="compact"
                      eyebrow={enrollment.course?.title || enrollment.courseId}
                      key={enrollment.id}
                      meta={`${enrollment.student?.email || "Sin correo"} · Acceso hasta ${formatDate(enrollment.accessExpiresAt)}`}
                      title={enrollment.student?.fullName || "Estudiante"}
                    >
                      <StatusPill
                        status={enrollment.status === "active" ? "active" : enrollment.status === "completed" ? "ready" : "draft"}
                        label={titleCase(enrollment.status)}
                      />
                      <SecondaryButton className="!py-1.5 !text-xs" onClick={() => startEditEnrollment(enrollment)} type="button">
                        Gestionar
                      </SecondaryButton>
                    </RowCard>
                  ))}
                </ScrollArea>
              ) : (
                <div className="px-4 py-6">
                  <EmptyState body="Aun no hay estudiantes matriculados dentro de tu alcance." title="Sin matriculas" />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 content-start">
            <div className="rounded-[18px] border border-[#d8e2f0] bg-white overflow-hidden">
              <div className="border-b border-[#e8eef6] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Soporte y comunidad</p>
              </div>
              {supportLoading ? (
                <p className="px-4 py-3 text-sm text-[#617085]">Cargando incidencias…</p>
              ) : (
                <div>
                  {(support?.tickets ?? []).length ? (
                    <div>
                      <p className="border-b border-[#edf1f7] bg-[#f8fafc] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8899b0]">Tickets</p>
                      {(support.tickets).map((item) => (
                        <RowCard
                          density="compact"
                          eyebrow={`${item.courseTitle || "Curso"} · Prioridad ${titleCase(item.priority)}`}
                          key={item.id}
                          meta={item.student?.fullName || item.student?.email || "Estudiante"}
                          title={item.subject || "Ticket"}
                        >
                          <StatusPill status={item.status === "open" ? "pending" : item.status === "resolved" ? "ready" : "draft"} label={titleCase(item.status)} />
                          <SecondaryButton className="!py-1.5 !text-xs" onClick={() => startManageSupport("ticket", item)} type="button">Gestionar</SecondaryButton>
                        </RowCard>
                      ))}
                    </div>
                  ) : null}

                  {(support?.courseRequests ?? []).length ? (
                    <div>
                      <p className="border-b border-[#edf1f7] bg-[#f8fafc] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8899b0]">Solicitudes</p>
                      {(support.courseRequests).map((item) => (
                        <RowCard
                          density="compact"
                          eyebrow={item.contactChannel || "Canal libre"}
                          key={item.id}
                          meta={item.student?.fullName || item.student?.email || "Estudiante"}
                          title={item.courseTitle || "Solicitud de apertura"}
                        >
                          <StatusPill status="pending" label={titleCase(item.status)} />
                          <SecondaryButton className="!py-1.5 !text-xs" onClick={() => startManageSupport("course-request", item)} type="button">Gestionar</SecondaryButton>
                        </RowCard>
                      ))}
                    </div>
                  ) : null}

                  {(support?.threads ?? []).length ? (
                    <div>
                      <p className="border-b border-[#edf1f7] bg-[#f8fafc] px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#8899b0]">Comunidad</p>
                      {(support.threads).map((item) => (
                        <RowCard
                          density="compact"
                          eyebrow={`${item.courseTitle || "Curso"} · ${item.replies?.length ?? 0} respuestas`}
                          key={item.id}
                          meta={item.authorName || item.authorEmail || "Autor"}
                          title={item.subject || item.title || "Hilo"}
                        >
                          <SecondaryButton className="!py-1.5 !text-xs" onClick={() => startManageSupport("thread", item)} type="button">Gestionar</SecondaryButton>
                        </RowCard>
                      ))}
                    </div>
                  ) : null}

                  {!(support?.tickets ?? []).length && !(support?.courseRequests ?? []).length && !(support?.threads ?? []).length ? (
                    <div className="px-4 py-6">
                      <EmptyState body="No hay incidencias activas dentro de tu alcance docente." title="Sin incidencias" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderSopsSection() {
    return (
      <TeacherSopsSection
        activeRequests={sopActiveRequests ?? []}
        error={sopsError}
        loading={sopsLoading}
        notificationBanner={sopNotification}
        onAcknowledgeNotification={onAcknowledgeSopNotification}
        onRequestChange={onRequestSopChange}
        sops={sops ?? []}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <WorkspaceNotice message={actionMessage} />
      <WorkspaceNotice message={actionError || dashboardError || coursesError || enrollmentsError || supportError} tone="error" />
      <WorkspaceView key={teacherSection}>
        {teacherSection === "teacher-overview" ? renderOverviewSection() : null}
        {teacherSection === "teacher-courses" ? renderCoursesSection() : null}
        {teacherSection === "teacher-assignments" ? renderAssignmentsSection() : null}
        {teacherSection === "teacher-operations" ? renderOperationsSection() : null}
        {teacherSection === "teacher-sops" ? renderSopsSection() : null}
      </WorkspaceView>

      {modal === "assignment" ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0f172a]/28 px-2 py-2  sm:px-4 sm:py-4"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[22px] border border-[#d8e2f0] bg-[#f8fbff] shadow-[0_24px_70px_rgba(15,23,42,0.18)] max-h-[92vh]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header banner */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                    {assignmentForm.assignmentId ? "Editando material" : "Nuevo material"}
                  </p>
                  <h3 className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">
                    {assignmentForm.title || (assignmentForm.assignmentId ? "Sin título" : "Material sin título")}
                  </h3>
                  {assignmentForm.courseId ? (
                    <p className="mt-1 text-[11px] text-white/70">
                      {(courses ?? []).find((c) => c.id === assignmentForm.courseId)?.title ?? "Curso seleccionado"}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-white/50">Selecciona un curso abajo</p>
                  )}
                </div>
                <button
                  className="shrink-0 rounded-xl border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/25"
                  onClick={closeModal}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
              {assignmentForm.assignmentId ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                  Publicado · editable
                </span>
              ) : null}
            </div>

            {/* Timeline form body */}
            <form className="min-h-0 flex-1 overflow-y-auto" onSubmit={handleAssignmentSubmit}>
              <div className="px-5 py-5 sm:px-6 sm:py-6">

                {/* Step 1 — Curso */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-[11px] font-black text-white">1</div>
                    <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#c6d4ec] to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1 pb-6">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1d4ed8]">Curso</p>
                    <Select onChange={(event) => setAssignmentForm((current) => ({ ...current, courseId: event.target.value }))} value={assignmentForm.courseId}>
                      <option value="">Selecciona un curso</option>
                      {(courses ?? []).map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Step 2 — Contenido */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-[11px] font-black text-white">2</div>
                    <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#c6d4ec] to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1 pb-6">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1d4ed8]">Contenido</p>
                    <input
                      className="block w-full rounded-[14px] border border-[#d8e2f0] bg-white px-4 py-3 text-lg font-semibold text-[#172033] placeholder-[#b0bfcf] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/15 mb-3"
                      onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Título del material"
                      value={assignmentForm.title}
                    />
                    <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Instrucciones</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-500 hover:text-blue-700"
                        onClick={async () => {
                          if (!assignmentForm.title?.trim()) return;
                          try {
                            const res = await fetch("/api/teacher/ai/generate-instruction", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                title: assignmentForm.title,
                                courseTitle: (courses ?? []).find(c => c.id === assignmentForm.courseId)?.title || "",
                                format: (courses ?? []).find(c => c.id === assignmentForm.courseId)?.format || "",
                                duration: (courses ?? []).find(c => c.id === assignmentForm.courseId)?.duration || "",
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setAssignmentForm(c => ({ ...c, instruction: data.instruction }));
                            }
                          } catch {}
                        }}
                        type="button"
                        disabled={!assignmentForm.title?.trim()}
                      >
                        <svg className="size-3.5 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
                        AI Generar
                      </Button>
                    </div>
                    <MarkdownEditor onChange={(event) => setAssignmentForm((current) => ({ ...current, instruction: event.target.value }))} placeholder="Guia, instruccion o contexto para el estudiante. Usa **negrita**, listas y encabezados." value={assignmentForm.instruction} />
                  </div>
                  </div>
                </div>

                {/* Step 3 — Fecha límite */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c6d4ec] bg-white text-[11px] font-black text-[#6b7a90]">3</div>
                    <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#c6d4ec] to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1 pb-6">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Fecha límite <span className="font-normal normal-case tracking-normal opacity-60">— opcional</span></p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" value={assignmentForm.dueDate} />
                      <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, dueTime: event.target.value }))} type="time" value={assignmentForm.dueTime} />
                    </div>
                  </div>
                </div>

                {/* Step 4 — Archivos */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c6d4ec] bg-white text-[11px] font-black text-[#6b7a90]">4</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Archivos <span className="font-normal normal-case tracking-normal opacity-60">— opcional</span></p>
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[16px] border-2 border-dashed border-[#c6d4ec] bg-[#f7f9fc] px-4 py-5 text-center transition hover:border-[#93b4e8] hover:bg-[#eef4ff]">
                      <svg className="h-7 w-7 text-[#8899b0]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                      </svg>
                      <span className="text-sm font-semibold text-[#536277]">Subir archivos</span>
                      <span className="text-[11px] text-[#8899b0]">PDF, DOCX, XLSX, PPTX, TXT, CSV</span>
                      <input
                        accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv"
                        className="sr-only"
                        disabled={submitting}
                        onChange={async (event) => {
                          const files = Array.from(event.target.files ?? []);
                          if (!files.length) return;
                          try {
                            setSubmitting(true);
                            setActionError("");
                            const uploads = await Promise.all(files.map((file) => uploadAdminAsset(undefined, file, "assignment-file")));
                            setAssignmentForm((current) => {
                              const nextAttachments = [...(current.attachments ?? [])];
                              uploads.forEach((asset, index) => {
                                nextAttachments.push({
                                  id: createAttachmentId(),
                                  fileKey: asset.key ?? "",
                                  fileName: asset.fileName ?? files[index].name,
                                  fileType: asset.contentType ?? files[index].type,
                                  fileUploadedAt: new Date().toISOString(),
                                  fileExpiresAt: "",
                                  fileUrl: asset.url ?? "",
                                });
                              });
                              return {
                                ...current,
                                attachments: nextAttachments,
                                fileKey: nextAttachments[0]?.fileKey ?? "",
                                fileName: nextAttachments[0]?.fileName ?? "",
                                fileType: nextAttachments[0]?.fileType ?? "",
                                fileUploadedAt: nextAttachments[0]?.fileUploadedAt ?? "",
                                fileUrl: nextAttachments[0]?.fileUrl ?? "",
                              };
                            });
                          } catch (uploadError) {
                            setActionError(uploadError.message);
                          } finally {
                            setSubmitting(false);
                            event.target.value = "";
                          }
                        }}
                        multiple
                        type="file"
                      />
                    </label>

                    {assignmentForm.attachments.length ? (
                      <div className="mt-3 grid gap-2">
                        {assignmentForm.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-3 rounded-[14px] border border-[#d7e0ea] bg-white px-3 py-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
                              <svg className="h-4 w-4 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-[#172033]">{attachment.fileName}</p>
                              <p className="text-[10px] text-[#6b7a90]">
                                {attachment.fileUploadedAt ? `Cargado ${formatDateTime(attachment.fileUploadedAt)}` : "Listo para publicar"}
                              </p>
                            </div>
                            <button
                              className="shrink-0 rounded-lg border border-[#d7e0ea] bg-[#f7f9fc] px-2.5 py-1 text-[10px] font-semibold text-[#536277] transition hover:bg-[#fee2e2] hover:text-[#dc2626] hover:border-[#fecaca]"
                              onClick={() =>
                                setAssignmentForm((current) => {
                                  const nextAttachments = (current.attachments ?? []).filter((item) => item.id !== attachment.id);
                                  return {
                                    ...current,
                                    attachments: nextAttachments,
                                    fileKey: nextAttachments[0]?.fileKey ?? "",
                                    fileName: nextAttachments[0]?.fileName ?? "",
                                    fileType: nextAttachments[0]?.fileType ?? "",
                                    fileUploadedAt: nextAttachments[0]?.fileUploadedAt ?? "",
                                    fileUrl: nextAttachments[0]?.fileUrl ?? "",
                                  };
                                })
                              }
                              type="button"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="sticky bottom-0 border-t border-[#d8e2f0] bg-[#f8fbff]/96 px-5 py-4 backdrop-blur sm:px-6">
                {actionError ? <p className="mb-3 text-sm text-[#dc2626]">{actionError}</p> : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={submitting} type="submit">
                      {submitting ? "Guardando..." : assignmentForm.assignmentId ? "Guardar cambios" : "Publicar material"}
                    </ActionButton>
                    <SecondaryButton onClick={closeModal} type="button">
                      Cancelar
                    </SecondaryButton>
                  </div>
                  {assignmentForm.assignmentId ? (
                    <SecondaryButton disabled={submitting} onClick={handleAssignmentDelete} type="button">
                      Eliminar material
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "enrollment" ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0f172a]/28 px-2 py-2  sm:px-4 sm:py-4"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-[#d8e2f0] bg-[#f8fbff] shadow-[0_24px_70px_rgba(15,23,42,0.18)] max-h-[92vh]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#059669] to-[#10b981] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                    {enrollmentForm.id ? "Editando matrícula" : "Nueva matrícula"}
                  </p>
                  <h3 className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">
                    {enrollmentForm.id
                      ? ((enrollmentsView?.studentOptions ?? []).find((s) => s.id === enrollmentForm.userId)?.fullName ?? "Estudiante")
                      : "Registrar acceso a curso"}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-white/60">
                    {enrollmentForm.courseId
                      ? (teacherCourseOptions.find((c) => c.id === enrollmentForm.courseId)?.title ?? "Curso seleccionado")
                      : "Elige estudiante y curso abajo"}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-xl border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/25"
                  onClick={closeModal}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
              {enrollmentForm.id ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                  <span className={`h-1.5 w-1.5 rounded-full ${enrollmentForm.status === "active" ? "bg-[#4ade80]" : "bg-white/40"}`} />
                  {enrollmentForm.status === "active" ? "Activa" : enrollmentForm.status === "paused" ? "Pausada" : enrollmentForm.status === "completed" ? "Completada" : "Cancelada"}
                </span>
              ) : null}
            </div>

            {/* Timeline form */}
            <form className="min-h-0 flex-1 overflow-y-auto" onSubmit={handleEnrollmentSubmit}>
              <div className="px-5 py-5 sm:px-6 sm:py-6">

                {/* Step 1 — Participante (only new) */}
                {!enrollmentForm.id ? (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#059669] text-[11px] font-black text-white">1</div>
                      <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#a7f3d0] to-transparent" />
                    </div>
                    <div className="min-w-0 flex-1 pb-6">
                      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#059669]">Participante</p>
                      <p className="mb-3 text-xs text-[#6b7a90]">¿Quién accede y a qué curso?</p>
                      {!teacherCourseOptions.length ? (
                        <div className="rounded-[14px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3 text-sm text-[#617085]">
                          No tienes cursos asignados. Solicita al administrador que te asigne un curso para habilitar matrículas.
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          <Select onChange={(event) => setEnrollmentForm((current) => ({ ...current, userId: event.target.value }))} value={enrollmentForm.userId}>
                            <option value="">— Estudiante —</option>
                            {(enrollmentsView?.studentOptions ?? []).map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.fullName} · {student.email}
                              </option>
                            ))}
                          </Select>
                          <Select onChange={(event) => setEnrollmentForm((current) => ({ ...current, courseId: event.target.value }))} value={enrollmentForm.courseId}>
                            <option value="">— Curso —</option>
                            {teacherCourseOptions.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Step 2 — Acceso */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#059669] text-[11px] font-black text-white">
                      {enrollmentForm.id ? "1" : "2"}
                    </div>
                    <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#a7f3d0] to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1 pb-6">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#059669]">Acceso</p>
                    <p className="mb-3 text-xs text-[#6b7a90]">Estado de la matrícula y duración del acceso al curso.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Estado</label>
                        <Select onChange={(event) => setEnrollmentForm((current) => ({ ...current, status: event.target.value }))} value={enrollmentForm.status}>
                          <option value="active">Activa — estudiante tiene acceso</option>
                          <option value="paused">Pausada — acceso suspendido</option>
                          <option value="completed">Completada — ciclo finalizado</option>
                          <option value="cancelled">Cancelada — sin acceso</option>
                        </Select>
                      </div>
                      <div>
                        {enrollmentForm.id ? (
                          <>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Vence el</label>
                            <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, accessExpiresAt: event.target.value }))} placeholder="ej. 2026-12-31T23:59:59Z" value={enrollmentForm.accessExpiresAt} />
                          </>
                        ) : (
                          <>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Días de acceso</label>
                            <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, accessDays: event.target.value }))} placeholder="ej. 45" value={enrollmentForm.accessDays} />
                            <p className="mt-1 text-[10px] text-[#8899b0]">Desde hoy, ¿cuántos días dura el acceso?</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 — Progreso */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#a7f3d0] bg-white text-[11px] font-black text-[#059669]">
                      {enrollmentForm.id ? "2" : "3"}
                    </div>
                    <div className="mt-1 w-px flex-1 bg-gradient-to-b from-[#a7f3d0] to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1 pb-6">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Progreso académico <span className="font-normal normal-case tracking-normal opacity-60">— opcional</span></p>
                    <p className="mb-3 text-xs text-[#6b7a90]">Registro manual del avance. Puede actualizarse desde el sistema de seguimiento.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Avance actual (%)</label>
                        <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, progressPercent: event.target.value }))} placeholder="0 – 100" value={enrollmentForm.progressPercent} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Nota mínima para aprobar (%)</label>
                        <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, passingThreshold: event.target.value }))} placeholder="ej. 80" value={enrollmentForm.passingThreshold} />
                      </div>
                    </div>
                    {enrollmentForm.id ? (
                      <div className="mt-3">
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Resultado final</label>
                        <select
                          className="w-full rounded-[14px] border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#059669] focus:ring-2 focus:ring-[#a7f3d0]"
                          onChange={(event) => setEnrollmentForm((current) => ({ ...current, completionStatus: event.target.value }))}
                          value={enrollmentForm.completionStatus}
                        >
                          <option value="in_progress">En curso — aún no finaliza</option>
                          <option value="passed">Aprobado — superó el umbral</option>
                          <option value="failed">No aprobado — no alcanzó el umbral</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Step 4 — Gamificación */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#a7f3d0] bg-white text-[11px] font-black text-[#059669]">
                      {enrollmentForm.id ? "3" : "4"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Gamificación <span className="font-normal normal-case tracking-normal opacity-60">— opcional</span></p>
                    <p className="mb-3 text-xs text-[#6b7a90]">Sistema de puntos y racha de días consecutivos de actividad.</p>
                    <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-[#d7e0ea] bg-white px-4 py-3 transition hover:bg-[#f0fdf4]">
                      <input
                        checked={enrollmentForm.gamificationEnabled}
                        className="h-4 w-4 accent-[#059669]"
                        onChange={(event) => setEnrollmentForm((current) => ({ ...current, gamificationEnabled: event.target.checked }))}
                        type="checkbox"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#172033]">Activar gamificación</p>
                        <p className="text-[11px] text-[#6b7a90]">El estudiante acumula puntos y puede ver su racha de actividad</p>
                      </div>
                    </label>
                    {enrollmentForm.gamificationEnabled ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Puntos acumulados</label>
                          <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, points: event.target.value }))} placeholder="0" value={enrollmentForm.points} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Racha (días seguidos)</label>
                          <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, streakDays: event.target.value }))} placeholder="0" value={enrollmentForm.streakDays} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="sticky bottom-0 border-t border-[#d8e2f0] bg-[#f8fbff]/96 px-5 py-4 backdrop-blur sm:px-6">
                {actionError ? <p className="mb-3 text-sm text-[#dc2626]">{actionError}</p> : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={submitting} type="submit">
                      {submitting ? "Guardando..." : enrollmentForm.id ? "Guardar cambios" : "Crear matrícula"}
                    </ActionButton>
                    <SecondaryButton onClick={closeModal} type="button">
                      Cancelar
                    </SecondaryButton>
                  </div>
                  {enrollmentForm.id ? (
                    <SecondaryButton disabled={submitting} onClick={handleEnrollmentDelete} type="button">
                      Eliminar matrícula
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "support" ? (
        <ModalShell
          onClose={closeModal}
          subtitle="Cada accion de soporte queda limitada a los cursos asignados al docente."
          title="Gestionar soporte docente"
        >
          <form className="grid gap-4" onSubmit={handleSupportSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Select onChange={(event) => setSupportForm((current) => ({ ...current, status: event.target.value }))} value={supportForm.status}>
                {supportForm.kind === "ticket" ? (
                  <>
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </>
                ) : supportForm.kind === "course-request" ? (
                  <>
                    <option value="open">open</option>
                    <option value="reviewing">reviewing</option>
                    <option value="contacted">contacted</option>
                    <option value="waitlist">waitlist</option>
                    <option value="closed">closed</option>
                  </>
                ) : (
                  <>
                    <option value="open">open</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </>
                )}
              </Select>

              {supportForm.kind === "ticket" ? (
                <Select onChange={(event) => setSupportForm((current) => ({ ...current, priority: event.target.value }))} value={supportForm.priority}>
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                </Select>
              ) : supportForm.kind === "thread" ? (
                <Select onChange={(event) => setSupportForm((current) => ({ ...current, visibility: event.target.value }))} value={supportForm.visibility}>
                  <option value="visible">visible</option>
                  <option value="hidden">hidden</option>
                </Select>
              ) : null}
            </div>

            {supportForm.kind === "thread" ? (
              <Select onChange={(event) => setSupportForm((current) => ({ ...current, bestReplyId: event.target.value }))} value={supportForm.bestReplyId}>
                <option value="">Sin respuesta destacada</option>
                {(supportForm.replies ?? []).map((reply) => (
                  <option key={reply.id} value={reply.id}>
                    {reply.authorName || reply.authorEmail || "Respuesta"} · {reply.body?.slice(0, 60) || "Sin contenido"}
                  </option>
                ))}
              </Select>
            ) : null}

            <MarkdownEditor onChange={(event) => setSupportForm((current) => ({ ...current, adminNote: event.target.value }))} placeholder="Nota operativa interna" value={supportForm.adminNote} />

            <div className="flex flex-wrap gap-3">
              <ActionButton disabled={submitting} type="submit">
                {submitting ? "Guardando..." : "Aplicar cambios"}
              </ActionButton>
              <SecondaryButton onClick={closeModal} type="button">
                Cancelar
              </SecondaryButton>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
