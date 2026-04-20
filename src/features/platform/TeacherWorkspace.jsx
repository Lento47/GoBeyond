import { useState } from "react";
import {
  ActionButton,
  EmptyState,
  Input,
  ModalShell,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  Select,
  SmallStat,
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
    activeStudents: enrollmentsLoading ? dashboard?.metrics?.activeStudents ?? 0 : liveActiveStudents,
    pendingAssignments: coursesLoading
      ? dashboard?.metrics?.pendingAssignments ?? 0
      : courses?.reduce((total, course) => total + ((course.assignments ?? []).length || 0), 0) ?? 0,
    openCases: supportLoading ? dashboard?.metrics?.openCases ?? 0 : liveOpenCases,
  };
  const teacherSection = activeSection || "teacher-overview";

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
        setActionMessage("Asignacion actualizada en el curso docente.");
      } else {
        await onCreateAssignment(payload);
        setActionMessage("Asignacion publicada para el curso seleccionado.");
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
      setActionMessage("Asignacion eliminada del curso docente.");
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
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]" id="teacher-overview">
        <SectionCard
          description={dashboard?.summary || "Gestiona cursos, tareas, matriculas e incidencias desde un mismo frente docente."}
          title={dashboard?.welcomeTitle || `Panel docente de ${teacherName}`}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SmallStat help="Programas bajo tu alcance docente." label="Cursos asignados" value={dashboardLoading ? "..." : metrics.assignedCourses} />
            <SmallStat help="Estudiantes activos en tus cohortes." label="Estudiantes activos" value={dashboardLoading ? "..." : metrics.activeStudents} />
            <SmallStat help="Asignaciones publicadas para seguimiento." label="Tareas publicadas" value={dashboardLoading ? "..." : metrics.pendingAssignments} />
            <SmallStat help="Tickets, solicitudes e hilos que requieren atencion." label="Casos abiertos" value={dashboardLoading ? "..." : metrics.openCases} />
          </div>
        </SectionCard>

        <SectionCard description="Ultimos movimientos operativos ligados a tus cursos y grupos." title="Casos recientes" density="compact">
          {dashboardLoading ? (
            <p className="text-sm text-[#617085]">Cargando actividad docente...</p>
          ) : dashboard?.recentCases?.length ? (
            <ScrollArea className="max-h-[22rem]">
              <div className="grid gap-3">
                {dashboard.recentCases.map((item) => (
                  <RowCard
                    density="compact"
                    eyebrow={titleCase(item.kind)}
                    key={`${item.kind}-${item.id}`}
                    meta={`${item.subtitle || "Sin referencia"} · ${titleCase(item.status)}`}
                    title={item.title}
                    body={`Ultima actualizacion: ${formatDateTime(item.updatedAt)}`}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState body="Todavia no hay actividad reciente dentro de tu alcance docente." title="Sin casos recientes" />
          )}
        </SectionCard>
      </section>
    );
  }

  function renderCoursesSection() {
    return (
      <SectionCard
        description="Cursos asignados, cohortes activas y acceso rapido para abrir nuevas tareas o matriculas."
        title="Cursos y grupos"
      >
        <div className="grid gap-4" id="teacher-courses">
          {coursesLoading ? (
            <p className="text-sm text-[#617085]">Cargando cursos asignados...</p>
          ) : courses.length ? (
            courses.map((course) => (
              <RowCard
                body={course.description || course.detailSummary || "Curso listo para operacion docente."}
                key={course.id}
                meta={`${course.format || "Formato libre"} · ${course.duration || "Duracion abierta"} · ${course.audience || "Audiencia general"}`}
                title={course.title}
              >
                <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <SmallStat help="Matriculas registradas." label="Matriculas" value={course.enrollmentCount ?? 0} />
                      <SmallStat help="Estudiantes con acceso activo." label="Activos" value={course.activeStudentCount ?? 0} />
                      <SmallStat help="Entregables creados." label="Tareas" value={course.assignmentCount ?? 0} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ActionButton onClick={() => startCreateAssignment(course.id)} type="button">
                        Nueva tarea
                      </ActionButton>
                      <SecondaryButton onClick={() => startCreateEnrollment(course.id)} type="button">
                        Matricular estudiante
                      </SecondaryButton>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Cohorte visible</p>
                    <CourseStudentsPreview students={course.students ?? []} />
                  </div>
                </div>
              </RowCard>
            ))
          ) : (
            <EmptyState
              body="Asigna cursos a esta cuenta desde el panel administrativo para habilitar la operacion docente real."
              title="Sin cursos asignados"
            />
          )}
        </div>
      </SectionCard>
    );
  }

  function renderAssignmentsSection() {
    return (
      <SectionCard
        description="Gestiona las asignaciones publicadas en tus cursos sin salir del workspace."
        title="Tareas y evaluaciones"
      >
        <div className="grid gap-4" id="teacher-assignments">
          {coursesLoading ? (
            <p className="text-sm text-[#617085]">Cargando asignaciones docentes...</p>
          ) : courses.some((course) => (course.assignments ?? []).length) ? (
            courses.map((course) => (
              <div className="grid gap-3" key={`assignments-${course.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Curso docente</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#172033]">{course.title}</h3>
                  </div>
                  <ActionButton onClick={() => startCreateAssignment(course.id)} type="button">
                    Agregar tarea
                  </ActionButton>
                </div>
                {(course.assignments ?? []).length ? (
                  <div className="grid gap-3">
                    {(course.assignments ?? []).map((assignment) => (
                      <RowCard
                        body={assignment.instruction}
                        density="compact"
                        eyebrow={assignment.dueLabel ? `Entrega ${assignment.dueLabel}` : "Sin fecha de entrega"}
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
                  <EmptyState body="Todavia no has publicado tareas en este curso." title="Sin asignaciones" />
                )}
              </div>
            ))
          ) : (
            <EmptyState body="Crea la primera asignacion en cualquiera de tus cursos." title="Sin tareas publicadas" />
          )}
        </div>
      </SectionCard>
    );
  }

  function renderOperationsSection() {
    return (
      <section className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]" id="teacher-operations">
        <SectionCard
          description="Matricula estudiantes en tus cursos asignados y ajusta progreso o vigencia de acceso."
          title="Matriculas"
        >
          <div className="mb-4 flex justify-end">
            <ActionButton onClick={() => startCreateEnrollment()} type="button">
              Nueva matricula
            </ActionButton>
          </div>
          {enrollmentsLoading ? (
            <p className="text-sm text-[#617085]">Cargando matriculas...</p>
          ) : enrollmentsView?.enrollments?.length ? (
            <ScrollArea className="max-h-[34rem]">
              <div className="grid gap-3">
                {enrollmentsView.enrollments.map((enrollment) => (
                  <RowCard
                    body={`Acceso hasta ${formatDate(enrollment.accessExpiresAt)} · ${enrollment.enhancement?.progressPercent ?? 0}% progreso · ${enrollment.enhancement?.points ?? 0} puntos`}
                    density="compact"
                    eyebrow={titleCase(enrollment.status)}
                    key={enrollment.id}
                    meta={`${enrollment.course?.title || enrollment.courseId} · ${enrollment.student?.email || "Sin correo"}`}
                    title={enrollment.student?.fullName || "Estudiante"}
                  >
                    <SecondaryButton onClick={() => startEditEnrollment(enrollment)} type="button">
                      Gestionar
                    </SecondaryButton>
                  </RowCard>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState body="Aun no hay estudiantes matriculados dentro de tu alcance." title="Sin matriculas" />
          )}
        </SectionCard>

        <SectionCard
          description="Supervisa tickets, solicitudes de apertura y hilos de comunidad relacionados con tus grupos."
          title="Soporte y comunidad"
        >
          {supportLoading ? (
            <p className="text-sm text-[#617085]">Cargando incidencias docentes...</p>
          ) : (
            <div className="grid gap-5">
              <div className="grid gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Tickets de soporte</p>
                <SupportList
                  actionLabel="Gestionar ticket"
                  emptyBody="No hay tickets ligados a tus cursos asignados."
                  emptyTitle="Sin tickets"
                  items={support?.tickets ?? []}
                  onAction={(item) => startManageSupport("ticket", item)}
                  renderMeta={(item) =>
                    `${item.student?.fullName || item.student?.email || "Estudiante"} · ${item.courseTitle || "Curso"} · Prioridad ${titleCase(item.priority)}`
                  }
                />
              </div>

              <div className="grid gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Solicitudes de apertura</p>
                <SupportList
                  actionLabel="Gestionar solicitud"
                  emptyBody="No hay solicitudes de ingreso o apertura en tus programas."
                  emptyTitle="Sin solicitudes"
                  items={support?.courseRequests ?? []}
                  onAction={(item) => startManageSupport("course-request", item)}
                  renderMeta={(item) =>
                    `${item.student?.fullName || item.student?.email || "Estudiante"} · ${item.contactChannel || "Canal libre"}`
                  }
                />
              </div>

              <div className="grid gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Hilos de comunidad</p>
                <SupportList
                  actionLabel="Gestionar hilo"
                  emptyBody="No hay hilos de comunidad dentro de tu alcance docente."
                  emptyTitle="Sin hilos"
                  items={support?.threads ?? []}
                  onAction={(item) => startManageSupport("thread", item)}
                  renderMeta={(item) =>
                    `${item.authorName || item.authorEmail || "Autor"} · ${item.courseTitle || "Curso"} · ${item.replies?.length ?? 0} respuestas`
                  }
                />
              </div>
            </div>
          )}
        </SectionCard>
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
          subtitle="Las tareas creadas aqui solo impactan cursos asignados a este docente."
          title={assignmentForm.assignmentId ? "Editar asignacion docente" : "Nueva asignacion docente"}
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
            <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo de la tarea" value={assignmentForm.title} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))} type="date" value={assignmentForm.dueDate} />
              <Input onChange={(event) => setAssignmentForm((current) => ({ ...current, dueTime: event.target.value }))} type="time" value={assignmentForm.dueTime} />
            </div>
            <Textarea onChange={(event) => setAssignmentForm((current) => ({ ...current, instruction: event.target.value }))} placeholder="Instruccion o criterio de evaluacion" value={assignmentForm.instruction} />
            <div className="grid gap-3 rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Archivo adjunto</p>
                  <p className="mt-1 text-sm text-[#536277]">
                    Sube una o varias guias, plantillas o recursos para esta tarea.
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
                {submitting ? "Guardando..." : assignmentForm.assignmentId ? "Guardar cambios" : "Crear asignacion"}
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
