import { useEffect, useState } from "react";
import {
  ackStudentNotification,
  askStudentAssistant,
  createStudentCourseRequest,
  createStudentTicket,
} from "../../services/contentApi";
import { MarkdownContent } from "../../shared/MarkdownContent";
import { getLearningPathThemeClasses, normalizeLearningPath } from "./learningPath";
import { workspaceChrome } from "./workspaceTheme";

// --- COMPONENTES DE INTERFAZ EDITORIAL ---

function StatIcon({ kind }) {
  if (kind === "enrollments") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 19h16M7 16V6l5-2 5 2v10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (kind === "curriculum") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path d="M6 5.5h12M6 10.5h12M6 15.5h7M4 4.5h16v15H4z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M7 7l10 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DashboardCard({ eyebrow, value, label, body, icon }) {
  return (
    <div className={`${workspaceChrome.surface} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{eyebrow}</p>
          <p className="mt-3 text-[2rem] font-semibold leading-none text-[#172033]">{value}</p>
        </div>
        <span className="rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] p-2 text-[#1d4ed8]">
          <StatIcon kind={icon} />
        </span>
      </div>
      <p className="mt-4 text-base font-semibold text-[#172033]">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#536277]">{body}</p>
    </div>
  );
}

function LearningRoadmapCard({ item, index, isLast = false }) {
  const theme = getLearningPathThemeClasses(item.theme);

  return (
    <article className="grid gap-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-5">
      <div className="relative hidden sm:flex sm:justify-center">
        {!isLast ? (
          <span
            aria-hidden="true"
            className={`absolute top-14 h-[calc(100%+1.25rem)] w-px bg-gradient-to-b ${theme.line}`}
          />
        ) : null}
        <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-[#d7e0ea] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white ${theme.dot}`}>
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className={`rounded-[22px] border p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:p-6 ${theme.card}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${theme.badge}`}>
            {item.stageLabel}
          </span>
          {item.duration ? (
            <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">
              {item.duration}
            </span>
          ) : null}
          <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#435066]">
            {item.progressState}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{item.track}</p>
            <h3 className="mt-2 text-[1.4rem] font-semibold leading-tight text-[#172033]">{item.title}</h3>
          </div>
          <div className="flex items-center gap-3 rounded-[16px] border border-[#d7e0ea] bg-white px-4 py-3">
            <span className={`h-3 w-3 rounded-full ${theme.dot}`} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Orden</p>
              <p className="mt-1 text-sm font-semibold text-[#172033]">Hito {String(index + 1).padStart(2, "0")}</p>
            </div>
          </div>
        </div>

        <MarkdownContent className="mt-4 text-sm leading-relaxed text-[#536277]">{item.description}</MarkdownContent>

        {item.outcome ? (
          <div className="mt-4 rounded-[18px] border border-[#d7e0ea] bg-white/90 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Resultado esperado</p>
            <p className="mt-2 text-sm leading-relaxed text-[#435066]">{item.outcome}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ChatBubble({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`mb-4 flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-[18px] border px-4 py-3 text-sm leading-7 ${
          isAssistant
            ? "border-[#d7e0ea] bg-white text-[#435066]"
            : "border-[#1d4ed8] bg-[#1d4ed8] text-white shadow-[0_8px_20px_rgba(29,78,216,0.18)]"
        }`}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.22em] opacity-70">
          {isAssistant ? "Asistente GoBeyond" : "Consulta del estudiante"}
        </p>
        <div className="mt-2 whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

function formatDisplayDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const normalized = new Date(value);
  if (Number.isNaN(normalized.getTime())) {
    return value;
  }

  return normalized.toLocaleDateString();
}

function getNotificationTargetId(notification) {
  const ctaPath = String(notification?.ctaPath ?? "");
  const hashIndex = ctaPath.indexOf("#");

  if (hashIndex === -1) {
    return "";
  }

  return ctaPath.slice(hashIndex + 1).trim();
}

function getRequestedCourseIdFromLocation() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return String(new URLSearchParams(window.location.search).get("course") ?? "").trim();
  } catch {
    return "";
  }
}

function syncCourseLocation(courseId) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const normalizedCourseId = String(courseId ?? "").trim();

  if (normalizedCourseId) {
    url.searchParams.set("course", normalizedCourseId);
    url.hash = "portal-courses";
  } else {
    url.searchParams.delete("course");
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

// --- LÓGICA DE APOYO (HELPERS) ---

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function isValidNumericContact(value) {
  return /^\d{8,20}$/.test(String(value ?? "").trim());
}

const initialTicketForm = {
  subject: "",
  description: "",
  category: "soporte",
  courseId: "",
};

const initialCourseRequestForm = {
  courseId: "",
  courseTitle: "",
  contactChannel: "whatsapp",
  contactValue: "",
  note: "",
};

// --- SUB-COMPONENTE: ASISTENTE CONTEXTUAL ---

function StudentAssistant({ courseCount, availableCount, activeCourses }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Bienvenido al centro de consultas. Puedo proporcionarle información precisa sobre sus cursos activos, su progreso académico y las asignaciones pendientes.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || submitting) return;

    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSubmitting(true);

    try {
      const response = await askStudentAssistant(undefined, {
        message,
        history: nextMessages.slice(-6),
      });

      if (response.suggestedTicket) {
        setTicketForm((current) => ({
          ...current,
          subject: response.suggestedTicket.subject || current.subject,
          description: response.suggestedTicket.description || current.description,
          category: response.suggestedTicket.category || current.category,
          courseId: response.suggestedTicket.courseId || current.courseId,
        }));
      }

      if (response.suggestTicket) setShowTicketForm(true);

      setMessages((current) => [...current, { role: "assistant", content: response.answer }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTicketSubmit(event) {
    event.preventDefault();
    setTicketMessage("");
    setError("");
    setTicketSubmitting(true);

    try {
      const response = await createStudentTicket(undefined, ticketForm);
      setTicketMessage(response.message);
      setShowTicketForm(false);
      setTicketForm(initialTicketForm);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Su solicitud ha sido registrada formalmente en nuestro sistema administrativo." },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setTicketSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 scroll-mt-28 xl:grid-cols-[minmax(0,1.25fr)_22rem]" id="portal-support">
      <div className={`${workspaceChrome.elevatedSurface} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 border-b border-[#e7edf5] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-[#eef4ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
              Consola de soporte
            </div>
            <h2 className="mt-4 text-[1.7rem] font-semibold leading-tight text-[#172033] sm:text-[2rem]">Centro de consultas del alumno</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#536277]">
              Este canal usa el contexto de sus {courseCount} cursos activos y {availableCount} rutas disponibles para responder,
              orientar y escalar incidencias sin perder trazabilidad.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3 text-[11px] font-semibold text-[#536277]">
            Respuestas informativas y tickets formales bajo demanda.
          </div>
        </div>

        <div className="mt-5 rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
          <div className="flex items-center justify-between border-b border-[#e7edf5] pb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Canal de asistencia</p>
              <p className="mt-1 text-sm text-[#536277]">Respuestas institucionales y escalamiento administrativo.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#435066]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#86efac] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              </span>
              Activo
            </div>
          </div>

          <div className="mt-4 max-h-[420px] overflow-y-auto rounded-[16px] border border-[#d7e0ea] bg-white p-4">
            {messages.map((message, index) => (
              <ChatBubble key={index} content={message.content} role={message.role} />
            ))}
          </div>

          <form className="mt-5" onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                className="min-h-[148px] w-full resize-none rounded-[18px] border border-[#d7e0ea] bg-white p-4 pb-16 pr-36 text-sm text-[#172033] outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escriba su consulta academica aqui..."
                value={draft}
              />
              <button
                className="absolute bottom-4 right-4 rounded-xl bg-[#1d4ed8] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#1e40af] disabled:opacity-50"
                disabled={submitting || !draft.trim()}
                type="submit"
              >
                {submitting ? "Procesando..." : "Enviar"}
              </button>
            </div>
            <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Maximo 1,000 caracteres por consulta.</p>
              {ticketMessage ? <p className="text-sm text-[#15803d]">{ticketMessage}</p> : null}
            </div>
            {error ? <p className="mt-3 text-sm text-[#b45309]">{error}</p> : null}
          </form>

          {showTicketForm ? (
            <form className="mt-6 rounded-[18px] border border-[#d7e0ea] bg-white p-4" onSubmit={handleTicketSubmit}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Escalamiento formal</p>
                  <p className="mt-1 text-sm text-[#536277]">Convierta la consulta en ticket administrativo sin salir del portal.</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[#536277]" onClick={() => setShowTicketForm(false)} type="button">
                  Cancelar
                </button>
              </div>
              <div className="mt-4 grid gap-4">
                <input
                  className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
                  onChange={(event) => setTicketForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="Asunto de la incidencia"
                  value={ticketForm.subject}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
                    onChange={(event) => setTicketForm((current) => ({ ...current, category: event.target.value }))}
                    value={ticketForm.category}
                  >
                    <option value="soporte">Soporte tecnico</option>
                    <option value="acceso">Problemas de acceso</option>
                    <option value="curso">Contenido del curso</option>
                  </select>
                  <select
                    className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
                    onChange={(event) => setTicketForm((current) => ({ ...current, courseId: event.target.value }))}
                    value={ticketForm.courseId}
                  >
                    <option value="">Referencia general</option>
                    {activeCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  className="min-h-[150px] rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
                  onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Detalle los motivos de su solicitud administrativa..."
                  value={ticketForm.description}
                />
                <button
                  className="w-fit rounded-xl bg-[#1d4ed8] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#1e40af] disabled:opacity-50"
                  disabled={ticketSubmitting}
                  type="submit"
                >
                  {ticketSubmitting ? "Enviando..." : "Registrar ticket"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6">
        <div className={`${workspaceChrome.surface} p-5`}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Consultas frecuentes</p>
          <div className="mt-4 grid gap-3">
            {[
              "Mis cursos activos y fechas de vencimiento.",
              "Asignaciones pendientes y material de estudio.",
              "Progreso detallado de mis modulos.",
              "Explorar nuevos programas de GoBeyond.",
            ].map((suggestion) => (
              <button
                key={suggestion}
                className="rounded-[16px] border border-[#d7e0ea] bg-white px-4 py-3 text-left text-sm text-[#435066] transition hover:border-[#1d4ed8] hover:bg-[#eef4ff]"
                onClick={() => setDraft(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <div className={`${workspaceChrome.mutedSurface} p-5`}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Alcance institucional</p>
          <p className="mt-3 text-sm leading-relaxed text-[#536277]">
            Este asistente opera bajo un marco academico. Para gestiones sensibles o seguimiento formal,
            puede elevar un ticket desde esta misma consola.
          </p>
          <button
            className="mt-4 w-full rounded-xl border border-[#d7e0ea] bg-white py-3 text-sm font-medium text-[#172033] transition hover:border-[#bbc8d9] hover:bg-[#fbfcfe]"
            onClick={() => setShowTicketForm(true)}
            type="button"
          >
            Contactar administracion
          </button>
        </div>
      </div>
    </section>
  );
}

// --- COMPONENTE: MODAL DE DETALLE DE CURSO ---

function CourseDetailModal({ course, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0f172a]/28 px-4 py-4 backdrop-blur-[8px] sm:px-6 sm:py-6">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[#d7e0ea] bg-[#f5f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:max-h-[calc(100vh-3rem)]">
        <div className="sticky top-0 z-10 flex shrink-0 flex-col gap-4 border-b border-[#d7e0ea] bg-[#f5f7fb]/95 px-5 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Ficha del programa</p>
            <h3 className="mt-2 break-words text-3xl font-semibold leading-tight text-[#172033] sm:text-4xl">{course.title}</h3>
          </div>
          <button className="rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#1e40af]" onClick={onClose} type="button">
            Cerrar ficha
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
        <div className="grid gap-8 p-5 sm:gap-10 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
          <div className="space-y-6">
            {course.coverImage && (
              <div className="overflow-hidden rounded-[22px] border border-[#d7e0ea] bg-white">
                <img alt={course.title} className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[400px]" src={course.coverImage} />
              </div>
            )}
            <div className={`${workspaceChrome.surface} p-5 sm:p-6`}>
              <div className="grid gap-5 border-b border-[#e7edf5] pb-5 md:grid-cols-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Formato</p>
                  <p className="mt-2 text-sm font-semibold text-[#172033]">{course.format || "Academico"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Duracion</p>
                  <p className="mt-2 text-sm font-semibold text-[#172033]">{course.duration || "No definida"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Acceso</p>
                  <p className="mt-2 text-sm font-semibold text-[#172033]">Vence {formatDisplayDate(course.accessExpiresAt)}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Descripcion</p>
                <MarkdownContent className="mt-3 text-sm leading-relaxed text-[#536277]">{course.description}</MarkdownContent>
              </div>
              <div className="mt-5 rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Resultados academicos</p>
                <MarkdownContent className="mt-3 text-sm leading-relaxed text-[#435066]">
                  {course.outcomes || "Pendiente de definir desde administracion."}
                </MarkdownContent>
              </div>
            </div>

            <div className={`${workspaceChrome.surface} p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-4 border-b border-[#e7edf5] pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Trabajo pendiente</p>
                  <h4 className="mt-2 text-xl font-semibold text-[#172033]">Asignaciones activas</h4>
                </div>
              </div>
              <div className="mt-5 space-y-4">
              {(course.assignments ?? []).length ? (
                course.assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-[18px] border border-[#d7e0ea] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{assignment.dueLabel || "Tarea"}</p>
                    <h5 className="mt-2 text-lg font-semibold text-[#172033]">{assignment.title}</h5>
                    <p className="mt-2 text-sm leading-relaxed text-[#536277]">{assignment.instruction}</p>
                    {(assignment.attachments ?? []).length ? (
                      <div className="mt-4 grid gap-2">
                        {(assignment.attachments ?? []).map((attachment) => (
                          <a
                            key={attachment.id}
                            className="inline-flex items-center justify-between gap-3 rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-[#1d4ed8]"
                            download={attachment.fileName}
                            href={attachment.fileUrl || attachment.fileData}
                          >
                            <span className="min-w-0 truncate">{attachment.fileName || "Adjunto"}</span>
                            <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Descargar</span>
                          </a>
                        ))}
                      </div>
                    ) : assignment.fileUrl || assignment.fileData ? (
                      <a className="mt-4 inline-flex rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1d4ed8]" download={assignment.fileName} href={assignment.fileUrl || assignment.fileData}>
                        Descargar adjunto
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#5d6b80]">No se registran asignaciones para este periodo.</p>
              )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${workspaceChrome.strongSurface} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Progreso</p>
              <p className="mt-3 text-[2rem] font-semibold leading-none text-[#172033]">{course.enhancement?.progressPercent ?? 0}%</p>
              <div className="mt-4 h-2 w-full rounded-full bg-white/80">
                <div
                  className={`h-2 rounded-full transition-all ${course.completionStatus === "passed" ? "bg-[#15803d]" : course.completionStatus === "failed" ? "bg-[#9a3412]" : "bg-[#1d4ed8]"}`}
                  style={{ width: `${course.enhancement?.progressPercent ?? 0}%` }}
                />
              </div>
              {course.enhancement?.passingThreshold ? (
                <p className="mt-2 text-xs text-[#66758c]">Umbral de aprobacion: {course.enhancement.passingThreshold}%</p>
              ) : null}
              <p className="mt-3 text-sm text-[#435066]">Expiracion de acceso: {formatDisplayDate(course.accessExpiresAt)}</p>
            </div>

            {course.completionStatus === "passed" && (
              <div className="rounded-[var(--radius-md)] border border-[#bbf7d0] bg-[#dcfce7] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#15803d]">Resultado</p>
                <p className="mt-2 text-lg font-semibold text-[#15803d]">Aprobado ✓</p>
                {course.completedAt ? <p className="mt-1 text-xs text-[#166534]">{formatDisplayDate(course.completedAt)}</p> : null}
              </div>
            )}
            {course.completionStatus === "failed" && (
              <div className="rounded-[var(--radius-md)] border border-[#fecaca] bg-[#fff7ed] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9a3412]">Resultado</p>
                <p className="mt-2 text-lg font-semibold text-[#9a3412]">No aprobado</p>
                {course.completedAt ? <p className="mt-1 text-xs text-[#9a3412]">{formatDisplayDate(course.completedAt)}</p> : null}
              </div>
            )}

            {course.enhancement?.gamificationEnabled && (
              <div className={`${workspaceChrome.surface} p-5`}>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Reconocimiento</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Puntos</p>
                    <p className="mt-2 text-2xl font-semibold text-[#172033]">{course.enhancement?.points ?? 0}</p>
                  </div>
                  <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Racha</p>
                    <p className="mt-2 text-2xl font-semibold text-[#172033]">{course.enhancement?.streakDays ?? 0}d</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE: MODAL DE INTERÉS EN CURSO ---

function CourseInterestModal({ course, user, onClose, onSubmit, submitting, message, error }) {
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    ...initialCourseRequestForm,
    courseId: course?.id ?? "",
    courseTitle: course?.title ?? "",
    contactValue: user?.email ?? "",
  });

  useEffect(() => {
    if (course) {
      setForm({
        ...initialCourseRequestForm,
        courseId: course.id ?? "",
        courseTitle: course.title ?? "",
        contactValue: user?.email ?? "",
      });
      setLocalError("");
    }
  }, [course, user]);

  useEffect(() => {
    if (!course) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [course]);

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0f172a]/28 px-4 py-4 backdrop-blur-[8px] sm:px-6 sm:py-6">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-[#d7e0ea] bg-[#f5f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:max-h-[calc(100vh-3rem)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e2e0db] p-5 sm:p-8">
          <div className="max-w-md">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Solicitud de apertura</p>
            <h3 className="mt-2 text-3xl font-semibold leading-tight text-[#172033]">{course.title}</h3>
          </div>
          <button className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-2 text-sm font-medium text-[#172033] transition hover:bg-[#f7f9fc]" onClick={onClose} type="button">Cerrar</button>
        </div>

        <div className="min-h-0 overflow-y-auto">
        <div className="grid gap-8 p-5 sm:gap-10 sm:p-8 md:grid-cols-[minmax(0,1fr)_20rem]">
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const val = String(form.contactValue).trim();
            if (form.contactChannel === "correo" && !isValidEmail(val)) return setLocalError("Email invalido.");
            if (["whatsapp", "texto"].includes(form.contactChannel) && !isValidNumericContact(val)) return setLocalError("Numero invalido.");
            setLocalError("");
            onSubmit({ ...form, contactValue: val });
          }}>
            <select
              className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
              onChange={(e) => setForm(c => ({ ...c, contactChannel: e.target.value }))}
              value={form.contactChannel}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="correo">Correo electronico</option>
              <option value="texto">SMS</option>
            </select>
            <input
              className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
              onChange={(e) => setForm(c => ({ ...c, contactValue: e.target.value }))}
              placeholder="Dato de contacto"
              value={form.contactValue}
            />
            <textarea
              className="w-full min-h-[140px] resize-none rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
              onChange={(e) => setForm(c => ({ ...c, note: e.target.value }))}
              placeholder="Por que le interesa este programa?"
              value={form.note}
            />
            <button className="w-full rounded-xl bg-[#1d4ed8] py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] disabled:opacity-50" disabled={submitting}>
              {submitting ? "Procesando..." : "Enviar solicitud academica"}
            </button>
            {message && <p className="text-sm text-[#15803d]">{message}</p>}
            {localError && <p className="text-sm text-[#b45309]">{localError}</p>}
            {error && <p className="text-sm text-[#b45309]">{error}</p>}
          </form>
          <div className={`${workspaceChrome.surface} p-5`}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Proceso de evaluacion</p>
            <div className="mt-4 grid gap-3">
              {[
                "Su solicitud se indexara en el panel administrativo.",
                "El equipo revisara viabilidad, cupo y grupo docente.",
                "Un coordinador le contactara por el medio seleccionado.",
              ].map((item) => (
                <div className="rounded-[16px] border border-[#d7e0ea] bg-[#f7f9fc] p-4 text-sm leading-relaxed text-[#536277]" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL: STUDENT EXPERIENCE ---

export function StudentExperience({ activeSection = "portal-overview", dashboard, dashboardLoading, dashboardError, onOpenCommunity, onNavigateSection }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [requestedCourse, setRequestedCourse] = useState(null);
  const [courseRequestMessage, setCourseRequestMessage] = useState("");
  const [courseRequestError, setCourseRequestError] = useState("");
  const [courseRequestSubmitting, setCourseRequestSubmitting] = useState(false);
  const [activeNotification, setActiveNotification] = useState(dashboard?.notificationBanner ?? null);
  const [acknowledgedNotificationId, setAcknowledgedNotificationId] = useState("");
  const studentSection = activeSection || "portal-overview";
  const learningPath = normalizeLearningPath(dashboard?.dashboard?.learningPath ?? []);
  useEffect(() => {
    setActiveNotification(dashboard?.notificationBanner ?? null);
    setAcknowledgedNotificationId("");
  }, [dashboard?.notificationBanner?.id]);

  useEffect(() => {
    if (!activeNotification?.id || acknowledgedNotificationId === activeNotification.id) {
      return;
    }

    setAcknowledgedNotificationId(activeNotification.id);
    void ackStudentNotification(undefined, activeNotification.id).catch(() => {});
  }, [acknowledgedNotificationId, activeNotification?.id]);

  useEffect(() => {
    const requestedCourseId = getRequestedCourseIdFromLocation();
    const activeCourses = dashboard?.dashboard?.courses ?? [];

    if (!requestedCourseId || !activeCourses.length) {
      return;
    }

    const matchedCourse = activeCourses.find((course) => String(course?.id ?? "") === requestedCourseId);

    if (matchedCourse) {
      setSelectedCourse((current) => (current?.id === matchedCourse.id ? current : matchedCourse));
    }
  }, [dashboard?.dashboard?.courses]);

  if (dashboardLoading || !dashboard) {
    return (
      <div className={`${workspaceChrome.surface} flex min-h-[60vh] items-center justify-center p-10 text-lg font-semibold text-[#172033]`}>
        Iniciando sesion en el portal academico...
      </div>
    );
  }

  async function handleCourseRequest(payload) {
    try {
      setCourseRequestMessage("");
      setCourseRequestError("");
      setCourseRequestSubmitting(true);
      const response = await createStudentCourseRequest(undefined, payload);
      setCourseRequestMessage(response.message);
      setTimeout(() => setRequestedCourse(null), 2000);
    } catch (err) {
      setCourseRequestError(err.message);
    } finally {
      setCourseRequestSubmitting(false);
    }
  }

  function handleNotificationAction() {
    const targetId = getNotificationTargetId(activeNotification) || "portal-courses";
    if (onNavigateSection) {
      onNavigateSection(targetId);
    }

    setActiveNotification(null);
  }

  function handleOpenCourse(course) {
    setSelectedCourse(course);
    syncCourseLocation(course?.id ?? "");
  }

  function handleCloseCourseModal() {
    setSelectedCourse(null);
    syncCourseLocation("");
  }

  function renderOverviewSection() {
    return (
      <section className={`${workspaceChrome.elevatedSurface} overflow-hidden`} id="portal-overview">
        <div className="grid gap-6 border-b border-[#e7edf5] p-5 sm:p-6 xl:grid-cols-[minmax(0,1.3fr)_22rem]">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-[#eef4ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
              Workspace academico
            </div>
            <h1 className="mt-4 text-[2rem] font-semibold leading-tight text-[#172033] sm:text-[2.5rem]">{dashboard.dashboard.welcomeTitle}</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#536277]">{dashboard.dashboard.summary}</p>
            {dashboardError ? <p className="mt-4 text-sm text-[#b45309]">{dashboardError}</p> : null}
          </div>
          <div className="grid gap-4">
            <div className="rounded-[18px] border border-[#d7e0ea] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Cuenta activa</p>
              <p className="mt-2 text-lg font-semibold text-[#172033]">{dashboard.user?.fullName || "Estudiante GoBeyond"}</p>
              <p className="mt-1 text-sm text-[#536277]">{dashboard.user?.email || "Sin correo"}</p>
            </div>
            <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Accion principal</p>
              <button className="mt-3 w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af]" onClick={onOpenCommunity} type="button">
                Entrar a comunidad
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[repeat(3,minmax(0,1fr))_18rem]">
          <DashboardCard body="Programas con acceso vigente a la plataforma y tutorías." eyebrow="Inscripciones" icon="enrollments" label="Matrículas" value={dashboard.dashboard.enrollments.length} />
          <DashboardCard body="Módulos habilitados actualmente en su ruta de aprendizaje." eyebrow="Currículo" icon="curriculum" label="Materias" value={dashboard.dashboard.courses.length} />
          <DashboardCard body="Nuevas especialidades disponibles para su solicitud inmediata." eyebrow="Exploración" icon="explore" label="Programas" value={dashboard.dashboard.availableCourses.length} />
          <div className={`${workspaceChrome.surface} p-5`}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Estado del dia</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[16px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Cursos activos</p>
                <p className="mt-2 text-sm font-semibold text-[#172033]">{dashboard.dashboard.courses.length} en seguimiento</p>
              </div>
              <div className="rounded-[16px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Ruta</p>
                <p className="mt-2 text-sm font-semibold text-[#172033]">{learningPath.length} hitos registrados</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderCoursesSection() {
    return (
      <section className={`${workspaceChrome.surface} p-5 sm:p-6`} id="portal-courses">
        <div className="flex flex-col gap-4 border-b border-[#e7edf5] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Operacion academica</p>
            <h2 className="mt-2 text-[1.6rem] font-semibold text-[#172033] sm:text-[1.9rem]">Cursos en curso</h2>
          </div>
          <div className="rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-2 text-[11px] font-semibold text-[#435066]">
            {dashboard.dashboard.courses.length} acceso{dashboard.dashboard.courses.length === 1 ? "" : "s"} vigente{dashboard.dashboard.courses.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {dashboard.dashboard.courses.length ? (
            dashboard.dashboard.courses.map((course) => (
              <article key={course.enrollmentId} className="rounded-[20px] border border-[#d7e0ea] bg-white p-5">
                <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc]">
                    {course.coverImage ? (
                      <img alt={course.title} className="h-full min-h-[180px] w-full object-cover" src={course.coverImage} />
                    ) : (
                      <div className="flex min-h-[180px] items-center justify-center px-6 text-center text-sm font-semibold text-[#6b7a90]">
                        Programa sin imagen destacada
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{course.format}</span>
                      <span className="rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{course.duration}</span>
                      {course.completionStatus === "passed" && (
                        <span className="rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#15803d]">Aprobado ✓</span>
                      )}
                      {course.completionStatus === "failed" && (
                        <span className="rounded-full border border-[#fecaca] bg-[#fff7ed] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#9a3412]">No aprobado</span>
                      )}
                    </div>
                    <h3 className="mt-4 break-words text-[1.4rem] font-semibold leading-tight text-[#172033]">{course.title}</h3>
                    <MarkdownContent className="mt-3 text-sm leading-relaxed text-[#536277]">{course.description}</MarkdownContent>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Vencimiento</p>
                        <p className="mt-2 text-sm font-semibold text-[#172033]">{formatDisplayDate(course.accessExpiresAt)}</p>
                      </div>
                      <div className="rounded-[16px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Avance</p>
                        <p className="mt-2 text-sm font-semibold text-[#172033]">{course.enhancement?.progressPercent ?? 0}% completado</p>
                      </div>
                    </div>

                    <div className="mt-5 h-2 w-full rounded-full bg-[#e7edf5]">
                      <div
                        className={`h-2 rounded-full transition-all ${course.completionStatus === "passed" ? "bg-[#15803d]" : course.completionStatus === "failed" ? "bg-[#9a3412]" : "bg-[#1d4ed8]"}`}
                        style={{ width: `${course.enhancement?.progressPercent ?? 0}%` }}
                      />
                    </div>

                    {course.completionStatus === "passed" && (
                      <div className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#dcfce7] px-4 py-3 text-sm font-semibold text-[#15803d]">
                        Curso completado exitosamente{course.completedAt ? ` · ${formatDisplayDate(course.completedAt)}` : ""}
                      </div>
                    )}
                    {course.completionStatus === "failed" && (
                      <div className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#9a3412]">
                        Curso no aprobado{course.completedAt ? ` · ${formatDisplayDate(course.completedAt)}` : ""}
                      </div>
                    )}

                    <button className="mt-5 w-full rounded-xl bg-[#1d4ed8] py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af]" onClick={() => handleOpenCourse(course)} type="button">
                      Entrar al aula virtual
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f7f9fc] p-10 text-center text-[#5d6b80]">
              No se encuentran matriculas activas registradas a su nombre en este ciclo.
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderPathSection() {
    return (
      <section className={`${workspaceChrome.elevatedSurface} overflow-hidden`} id="portal-path">
        <div className="grid gap-6 border-b border-[#e7edf5] p-5 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_20rem]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-[#eef4ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
              Ruta academica
            </div>
            <h2 className="mt-4 text-[1.8rem] font-semibold leading-tight text-[#172033] sm:text-[2.2rem]">Roadmap de trayectoria</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#536277]">
              Cada hito resume la progresion formativa disponible en GoBeyond. La ruta se gestiona desde admin y puede evolucionar
              sin perder claridad para el estudiante.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[20px] border border-[#d7e0ea] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Estado de la ruta</p>
              <p className="mt-2 text-lg font-semibold text-[#172033]">{learningPath.length} etapas visibles</p>
              <p className="mt-2 text-sm leading-relaxed text-[#536277]">Un recorrido editorial claro para ubicar tu siguiente foco de aprendizaje.</p>
            </div>
            <div className="rounded-[20px] border border-[#c6d4ec] bg-[#eef4ff] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Lectura sugerida</p>
              <p className="mt-2 text-sm leading-relaxed text-[#435066]">
                Avanza de arriba hacia abajo: cada bloque funciona como una etapa independiente y complementaria.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {learningPath.length ? (
            <div className="grid gap-5">
              {learningPath.map((item, index) => (
                <LearningRoadmapCard key={item.id} index={index} isLast={index === learningPath.length - 1} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f7f9fc] p-10 text-center text-[#5d6b80]">
              Los hitos publicados desde admin apareceran aqui como roadmap academico.
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderOpeningsSection() {
    return (
      <div className={`${workspaceChrome.surface} p-5 sm:p-6`} id="portal-openings">
        <div className="flex items-center justify-between gap-4 border-b border-[#e7edf5] pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Exploracion</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold text-[#172033]">Nuevas aperturas</h2>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {dashboard.dashboard.availableCourses.map((c) => (
            <div key={c.id} className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{c.format} · {c.duration}</p>
              <h3 className="mt-2 text-lg font-semibold text-[#172033]">{c.title}</h3>
              <button
                className="mt-4 rounded-xl border border-[#d7e0ea] bg-white px-4 py-2 text-sm font-medium text-[#1d4ed8] transition hover:border-[#bbc8d9] hover:bg-[#fbfcfe]"
                onClick={() => {
                  setCourseRequestMessage("");
                  setCourseRequestError("");
                  setRequestedCourse(c);
                }}
                type="button"
              >
                Solicitar informacion
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSupportSection() {
    return (
      <StudentAssistant
        activeCourses={dashboard.dashboard.courses}
        availableCount={dashboard.dashboard.availableCourses.length}
        courseCount={dashboard.dashboard.courses.length}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {activeNotification ? (
        <section
          aria-live="polite"
          className={`${workspaceChrome.surface} border border-[#c6d4ec] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#ffffff_100%)] p-4 sm:p-5`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
                <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                Actualizacion academica
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[#172033]">{activeNotification.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#536277]">{activeNotification.body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
                onClick={handleNotificationAction}
                type="button"
              >
                Ir a cursos activos
              </button>
              <button
                className="rounded-xl border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#fbfcfe]"
                onClick={() => setActiveNotification(null)}
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {studentSection === "portal-overview" ? renderOverviewSection() : null}
      {studentSection === "portal-courses" ? renderCoursesSection() : null}
      {studentSection === "portal-path" ? renderPathSection() : null}
      {studentSection === "portal-openings" ? renderOpeningsSection() : null}
      {studentSection === "portal-support" ? renderSupportSection() : null}

      <CourseDetailModal course={selectedCourse} onClose={handleCloseCourseModal} />
      <CourseInterestModal
        course={requestedCourse}
        error={courseRequestError}
        message={courseRequestMessage}
        onClose={() => setRequestedCourse(null)}
        onSubmit={handleCourseRequest}
        submitting={courseRequestSubmitting}
        user={dashboard.user}
      />
    </div>
  );
}
