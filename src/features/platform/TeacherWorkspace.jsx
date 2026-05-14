import { useState } from "react";
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
            <p className="mt-1 text-sm leading-relaxed text-[#6b7a90]">
              {dashboard?.summary || "Tu espacio operativo para gestionar clases, contenidos, estudiantes y actividades académicas."}
            </p>
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
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]" id="teacher-courses">
        {/* Left column — course list */}
        <div className="grid gap-4 content-start">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Operación docente</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033]">Clases y grupos</h1>
              <p className="mt-0.5 text-sm text-[#6b7a90]">Selecciona un curso para ver sus materiales y grupos en el panel derecho.</p>
            </div>
            <ActionButton onClick={() => startCreateAssignment(selectedCourse?.id)} type="button">
              + Agregar material
            </ActionButton>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-[#d8e2f0] bg-white">
            {coursesLoading ? (
              <p className="px-4 py-3 text-sm text-[#617085]">Cargando cursos asignados…</p>
            ) : (courses ?? []).length ? (
              (courses ?? []).map((course) => {
                const isSelected = course.id === (selectedCourse?.id);
                return (
                  <div
                    key={course.id}
                    className={`border-b border-[#edf1f7] last:border-b-0 cursor-pointer transition-colors ${isSelected ? "bg-[#eef4ff] border-l-2 border-l-[#1d4ed8]" : "hover:bg-[#f7f9fc]"}`}
                    onClick={() => setSelectedCourseId(course.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedCourseId(course.id); }}
                  >
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8899b0]">
                          {course.format || "Formato libre"} · {course.audience || "General"}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-[#172033]">{course.title}</p>
                        <p className="mt-0.5 text-xs text-[#66758c]">
                          {course.enrollmentCount ?? 0} matrículas · {course.cohortCount ?? 0} grupos · {course.activeStudentCount ?? 0} activos
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <StatusPill status={isSelected ? "active" : "draft"} label={isSelected ? "Seleccionado" : "Ver"} />
                        <ActionButton
                          className="!py-2 !text-xs"
                          onClick={() => { setSelectedCourseId(course.id); startCreateAssignment(course.id); }}
                          type="button"
                        >
                          + Material
                        </ActionButton>
                        <SecondaryButton className="!py-2 !text-xs" onClick={() => startCreateEnrollment(course.id)} type="button">
                          Matricular
                        </SecondaryButton>
                      </div>
                    </div>

                    {/* Cohort/group pills with status indication */}
                    {(course.cohorts ?? []).length ? (
                      <div className="bg-[#f8fafc] px-4 pb-3">
                        <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#8899b0]">Grupos / Cohortes</p>
                        <div className="flex flex-wrap gap-2">
                          {(course.cohorts ?? []).slice(0, 4).map((cohort) => {
                            const isActive = cohort.status === "active";
                            return (
                              <span
                                key={cohort.id}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                  isActive
                                    ? "border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8]"
                                    : "border-[#d8e2f0] bg-white text-[#536277]"
                                }`}
                              >
                                {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-[#1d4ed8]" /> : null}
                                {cohort.title}
                                {cohort.startDate ? <span className="opacity-70">· {formatDate(cohort.startDate)}</span> : null}
                              </span>
                            );
                          })}
                          {(course.cohorts ?? []).length > 4 ? (
                            <span className="text-[10px] text-[#8899b0]">+{(course.cohorts ?? []).length - 4} grupos</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
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

        {/* Right column — selected course aula panel */}
        <div className="grid gap-4 content-start">
          <div className="rounded-[18px] border border-[#c6d4ec] bg-[#eef4ff] overflow-hidden">
            <div className="border-b border-[#c6d4ec] px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Ahora en clase</p>
              <p className="mt-0.5 text-sm font-semibold text-[#172033]">
                {selectedCourse?.title || "Ninguna clase seleccionada"}
              </p>
              {selectedCourse ? (
                <p className="mt-0.5 text-[10px] text-[#6b7a90]">
                  {(selectedCourse.cohorts ?? []).filter((c) => c.status === "active").length} grupo{(selectedCourse.cohorts ?? []).filter((c) => c.status === "active").length !== 1 ? "s" : ""} activo{(selectedCourse.cohorts ?? []).filter((c) => c.status === "active").length !== 1 ? "s" : ""}
                  {" · "}
                  {(selectedCourse.assignments ?? []).length} material{(selectedCourse.assignments ?? []).length !== 1 ? "es" : ""}
                </p>
              ) : null}
            </div>

            <div className="divide-y divide-[#d8e8f8]">
              {(selectedCourse?.assignments ?? []).slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#e8f0fd] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#172033]">{assignment.title}</p>
                    {assignment.dueLabel ? <p className="text-[10px] text-[#6b7a90]">{assignment.dueLabel}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#1d4ed8]">Publicado</span>
                    <SecondaryButton
                      className="!py-1 !px-2.5 !text-[10px]"
                      onClick={() => startEditAssignment(selectedCourse?.id, assignment)}
                      type="button"
                    >
                      Editar
                    </SecondaryButton>
                  </div>
                </div>
              ))}
              {!(selectedCourse?.assignments ?? []).length ? (
                <p className="px-4 py-4 text-xs text-[#8899b0]">Sin materiales publicados aún en este curso.</p>
              ) : null}
            </div>

            <div className="border-t border-[#c6d4ec] p-3 grid gap-2">
              <ActionButton className="w-full justify-center" onClick={() => startCreateAssignment(selectedCourse?.id)} type="button">
                + Agregar material
              </ActionButton>
              <SecondaryButton className="w-full justify-center" onClick={() => startCreateEnrollment(selectedCourse?.id)} type="button">
                Matricular estudiante
              </SecondaryButton>
            </div>
          </div>

          {/* Quick access to other courses */}
          {(courses ?? []).length > 1 ? (
            <div className="rounded-[18px] border border-[#d8e2f0] bg-white overflow-hidden">
              <div className="border-b border-[#e8eef6] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Cambiar aula</p>
              </div>
              {(courses ?? []).filter((c) => c.id !== selectedCourse?.id).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 border-b border-[#edf1f7] px-4 py-2.5 last:border-b-0 hover:bg-[#f7f9fc] transition-colors cursor-pointer"
                  onClick={() => setSelectedCourseId(course.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedCourseId(course.id); }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#172033]">{course.title}</p>
                    <p className="text-[10px] text-[#8899b0]">{course.activeStudentCount ?? 0} activos · {(course.assignments ?? []).length} materiales</p>
                  </div>
                  <SecondaryButton
                    className="!py-1.5 !text-xs shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.id); }}
                    type="button"
                  >
                    Abrir
                  </SecondaryButton>
                </div>
              ))}
            </div>
          ) : null}
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
      {teacherSection === "teacher-overview" ? renderOverviewSection() : null}
      {teacherSection === "teacher-courses" ? renderCoursesSection() : null}
      {teacherSection === "teacher-assignments" ? renderAssignmentsSection() : null}
      {teacherSection === "teacher-operations" ? renderOperationsSection() : null}
      {teacherSection === "teacher-sops" ? renderSopsSection() : null}

      {modal === "assignment" ? (
        <ModalShell
          onClose={closeModal}
          subtitle="Los materiales creados aqui solo impactan cursos asignados a este docente."
          title={assignmentForm.assignmentId ? "Editar material docente" : "Nuevo material docente"}
        >
          <form className="grid gap-4" onSubmit={handleAssignmentSubmit}>
            <Select onChange={(event) => setAssignmentForm((current) => ({ ...current, courseId: event.target.value }))} value={assignmentForm.courseId}>
              <option value="">Selecciona un curso</option>
              {(courses ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo del material" value={assignmentForm.title} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" value={assignmentForm.dueDate} />
              <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, dueTime: event.target.value }))} type="time" value={assignmentForm.dueTime} />
            </div>
            <Textarea onChange={(event) => setAssignmentForm((current) => ({ ...current, instruction: event.target.value }))} placeholder="Guia, instruccion o contexto para el estudiante" value={assignmentForm.instruction} />
            <div className="grid gap-3 rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Archivo adjunto</p>
                  <p className="mt-1 text-sm text-[#536277]">
                    Sube una o varias guias, plantillas o recursos para este material.
                  </p>
                </div>
                {assignmentForm.attachments.length ? (
                  <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#435066]">
                    {assignmentForm.attachments.length} adjunto{assignmentForm.attachments.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
              <input
                accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv"
                className="block w-full text-sm text-[#435066] file:mr-4 file:rounded-xl file:border-0 file:bg-[#eef4ff] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#1d4ed8] hover:file:bg-[#dbeafe]"
                disabled={submitting}
                onChange={async (event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (!files.length) {
                    return;
                  }

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
              {assignmentForm.attachments.length ? (
                <div className="grid gap-2">
                  {assignmentForm.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex flex-col gap-2 rounded-[14px] border border-[#d7e0ea] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#172033]">{attachment.fileName}</p>
                        <p className="mt-1 text-[11px] text-[#6b7a90]">
                          {attachment.fileUploadedAt ? `cargado ${formatDateTime(attachment.fileUploadedAt)}` : "Adjunto listo"}
                        </p>
                      </div>
                      <SecondaryButton
                        className="w-full sm:w-auto"
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
                      </SecondaryButton>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton disabled={submitting} type="submit">
                {submitting ? "Guardando..." : assignmentForm.assignmentId ? "Guardar cambios" : "Crear material"}
              </ActionButton>
              {assignmentForm.assignmentId ? (
                <SecondaryButton disabled={submitting} onClick={handleAssignmentDelete} type="button">
                  Eliminar
                </SecondaryButton>
              ) : null}
              <SecondaryButton onClick={closeModal} type="button">
                Cancelar
              </SecondaryButton>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {modal === "enrollment" ? (
        <ModalShell
          onClose={closeModal}
          subtitle="Solo puedes crear o editar matriculas de estudiantes dentro de tus cursos asignados."
          title={enrollmentForm.id ? "Gestionar matricula" : "Nueva matricula"}
        >
          <form className="grid gap-4" onSubmit={handleEnrollmentSubmit}>
            {!enrollmentForm.id ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Select onChange={(event) => setEnrollmentForm((current) => ({ ...current, userId: event.target.value }))} value={enrollmentForm.userId}>
                  <option value="">Selecciona un estudiante</option>
                  {(enrollmentsView?.studentOptions ?? []).map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} · {student.email}
                    </option>
                  ))}
                </Select>
                <Select onChange={(event) => setEnrollmentForm((current) => ({ ...current, courseId: event.target.value }))} value={enrollmentForm.courseId}>
                  <option value="">Selecciona un curso</option>
                  {teacherCourseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            {!enrollmentForm.id && !teacherCourseOptions.length ? (
              <p className="text-sm leading-6 text-[#617085]">
                Este docente aun no tiene cursos asignados. Asigna al menos un curso desde administracion para habilitar nuevas matriculas.
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Select onChange={(event) => setEnrollmentForm((current) => ({ ...current, status: event.target.value }))} value={enrollmentForm.status}>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </Select>
              {enrollmentForm.id ? (
                <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, accessExpiresAt: event.target.value }))} placeholder="2026-12-31T23:59:59.000Z" value={enrollmentForm.accessExpiresAt} />
              ) : (
                <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, accessDays: event.target.value }))} placeholder="45" value={enrollmentForm.accessDays} />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, progressPercent: event.target.value }))} placeholder="Progreso %" value={enrollmentForm.progressPercent} />
              <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, points: event.target.value }))} placeholder="Puntos" value={enrollmentForm.points} />
              <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, streakDays: event.target.value }))} placeholder="Racha" value={enrollmentForm.streakDays} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input onChange={(event) => setEnrollmentForm((current) => ({ ...current, passingThreshold: event.target.value }))} placeholder="Umbral de aprobacion % (ej. 80)" value={enrollmentForm.passingThreshold} />
              {enrollmentForm.id ? (
                <select
                  className="rounded-[var(--radius-input)] border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#dbeafe]"
                  value={enrollmentForm.completionStatus}
                  onChange={(event) => setEnrollmentForm((current) => ({ ...current, completionStatus: event.target.value }))}
                >
                  <option value="in_progress">En progreso</option>
                  <option value="passed">Aprobado</option>
                  <option value="failed">No aprobado</option>
                </select>
              ) : null}
            </div>

            <label className="flex items-center gap-3 text-sm text-[#172033]">
              <input checked={enrollmentForm.gamificationEnabled} onChange={(event) => setEnrollmentForm((current) => ({ ...current, gamificationEnabled: event.target.checked }))} type="checkbox" />
              Activar gamificacion para esta matricula
            </label>

            <div className="flex flex-wrap gap-3">
              <ActionButton disabled={submitting} type="submit">
                {submitting ? "Guardando..." : enrollmentForm.id ? "Guardar cambios" : "Crear matricula"}
              </ActionButton>
              {enrollmentForm.id ? (
                <SecondaryButton disabled={submitting} onClick={handleEnrollmentDelete} type="button">
                  Eliminar
                </SecondaryButton>
              ) : null}
              <SecondaryButton onClick={closeModal} type="button">
                Cancelar
              </SecondaryButton>
            </div>
          </form>
        </ModalShell>
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

            <Textarea onChange={(event) => setSupportForm((current) => ({ ...current, adminNote: event.target.value }))} placeholder="Nota operativa interna" value={supportForm.adminNote} />

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
