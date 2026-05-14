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

function courseColorIndex(id) {
  return String(id ?? "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5;
}

function CourseDetailModal({ course, onClose }) {
  const gcBannerColors = [
    "from-blue-600 to-blue-800",
    "from-emerald-600 to-green-800",
    "from-violet-600 to-purple-800",
    "from-amber-500 to-orange-700",
    "from-rose-600 to-pink-800",
  ];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!course) return null;

  const progress = course.enhancement?.progressPercent ?? 0;
  const isPassed = course.completionStatus === "passed";
  const isFailed = course.completionStatus === "failed";
  const assignments = course.assignments ?? [];
  const bannerColor = gcBannerColors[courseColorIndex(course.id)];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-[#0f172a]/32 backdrop-blur-[8px]">
      <div className="flex max-h-screen w-full max-w-6xl flex-col overflow-hidden sm:max-h-[calc(100vh-2rem)] sm:mt-4 sm:rounded-[24px] border-0 sm:border sm:border-[#d7e0ea] bg-[#f5f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.22)]">

        {/* Google Classroom-style header banner */}
        <div className={`relative shrink-0 h-36 sm:h-44 bg-gradient-to-br ${bannerColor} sm:rounded-t-[24px] overflow-hidden`}>
          {course.coverImage ? (
            <img alt={course.title} className="absolute inset-0 h-full w-full object-cover" src={course.coverImage} />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Close button top-right */}
          <button
            className="absolute right-4 top-4 rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur transition hover:bg-white/30"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>

          {/* Format pill */}
          {course.format ? (
            <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur">
              {course.format}
            </span>
          ) : null}

          {/* Course title bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <h3 className="break-words text-2xl font-black leading-tight text-white drop-shadow sm:text-3xl">{course.title}</h3>
            {course.duration ? (
              <p className="mt-1 text-sm text-white/80">{course.duration}</p>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[minmax(0,1.25fr)_22rem]">

            {/* Left — Stream */}
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Materiales del curso</p>
                <h4 className="mt-1 text-lg font-semibold text-[#172033]">Stream</h4>
              </div>

              {assignments.length ? (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="overflow-hidden rounded-[18px] border border-[#d7e0ea] bg-white">
                    <div className="flex items-start gap-3 p-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                        <svg aria-hidden="true" className="h-4 w-4 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h5 className="font-semibold text-[#172033]">{assignment.title}</h5>
                          {assignment.dueLabel ? (
                            <span className="shrink-0 rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-2.5 py-0.5 text-[10px] font-semibold text-[#6b7a90]">{assignment.dueLabel}</span>
                          ) : null}
                        </div>
                        {assignment.instruction ? (
                          <p className="mt-2 text-sm leading-relaxed text-[#536277]">{assignment.instruction}</p>
                        ) : null}
                      </div>
                    </div>

                    {/* Attachments */}
                    {(assignment.attachments ?? []).length ? (
                      <div className="border-t border-[#e7edf5] px-4 py-3 flex flex-wrap gap-2">
                        {assignment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-3 py-2 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#eef4ff]"
                            download={attachment.fileName}
                            href={attachment.fileUrl || attachment.fileData}
                          >
                            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
                            <span className="min-w-0 truncate max-w-[14rem]">{attachment.fileName || "Adjunto"}</span>
                          </a>
                        ))}
                      </div>
                    ) : assignment.fileUrl || assignment.fileData ? (
                      <div className="border-t border-[#e7edf5] px-4 py-3">
                        <a
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-3 py-2 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#eef4ff]"
                          download={assignment.fileName}
                          href={assignment.fileUrl || assignment.fileData}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
                          {assignment.fileName || "Descargar adjunto"}
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f8fbff] p-8 text-center">
                  <p className="font-medium text-[#172033]">Sin materiales publicados</p>
                  <p className="mt-2 text-sm text-[#536277]">El docente no ha publicado materiales en este curso aún.</p>
                </div>
              )}

              {/* Description & outcomes */}
              {(course.description || course.outcomes) ? (
                <div className="rounded-[18px] border border-[#d7e0ea] bg-white p-5">
                  {course.description ? (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Descripción</p>
                      <MarkdownContent className="mt-3 text-sm leading-relaxed text-[#536277]">{course.description}</MarkdownContent>
                    </>
                  ) : null}
                  {course.outcomes ? (
                    <div className="mt-5 rounded-[14px] border border-[#d7e0ea] bg-[#f7f9fc] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Resultados académicos</p>
                      <MarkdownContent className="mt-2 text-sm leading-relaxed text-[#435066]">{course.outcomes}</MarkdownContent>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Right — Progress panel */}
            <div className="space-y-4">
              {/* Progress card */}
              <div className="rounded-[18px] border border-[#c6d4ec] bg-[#eef4ff] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Tu progreso</p>
                <p className="mt-3 text-[2.2rem] font-black leading-none text-[#172033]">{progress}%</p>
                <div className="mt-3 h-2.5 w-full rounded-full bg-white/70">
                  <div
                    className={`h-2.5 rounded-full transition-all ${isPassed ? "bg-[#15803d]" : isFailed ? "bg-[#dc2626]" : "bg-[#1d4ed8]"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {course.enhancement?.passingThreshold ? (
                  <p className="mt-2 text-xs text-[#6b7a90]">Umbral de aprobación: {course.enhancement.passingThreshold}%</p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] border border-[#c6d4ec] bg-white/60 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Formato</p>
                    <p className="mt-1 text-xs font-semibold text-[#172033]">{course.format || "—"}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#c6d4ec] bg-white/60 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Duración</p>
                    <p className="mt-1 text-xs font-semibold text-[#172033]">{course.duration || "—"}</p>
                  </div>
                </div>
                {course.accessExpiresAt ? (
                  <p className="mt-3 text-xs text-[#6b7a90]">Acceso hasta {formatDisplayDate(course.accessExpiresAt)}</p>
                ) : null}
              </div>

              {/* Completion status */}
              {isPassed ? (
                <div className="rounded-[18px] border border-[#bbf7d0] bg-[#dcfce7] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#15803d]">Resultado</p>
                  <p className="mt-2 text-lg font-black text-[#15803d]">Aprobado ✓</p>
                  {course.completedAt ? <p className="mt-1 text-xs text-[#166534]">{formatDisplayDate(course.completedAt)}</p> : null}
                </div>
              ) : isFailed ? (
                <div className="rounded-[18px] border border-[#fecaca] bg-[#fff7ed] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9a3412]">Resultado</p>
                  <p className="mt-2 text-lg font-black text-[#9a3412]">No aprobado</p>
                  {course.completedAt ? <p className="mt-1 text-xs text-[#9a3412]">{formatDisplayDate(course.completedAt)}</p> : null}
                </div>
              ) : null}

              {/* Gamification */}
              {course.enhancement?.gamificationEnabled ? (
                <div className="rounded-[18px] border border-[#d7e0ea] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Reconocimiento</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[14px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Puntos</p>
                      <p className="mt-1.5 text-xl font-black text-[#172033]">{course.enhancement?.points ?? 0}</p>
                    </div>
                    <div className="rounded-[14px] border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Racha</p>
                      <p className="mt-1.5 text-xl font-black text-[#172033]">{course.enhancement?.streakDays ?? 0}d</p>
                    </div>
                  </div>
                </div>
              ) : null}
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
    const gcColors = [
      "from-blue-600 to-blue-700",
      "from-emerald-600 to-green-700",
      "from-violet-600 to-purple-700",
      "from-amber-500 to-orange-600",
      "from-rose-600 to-pink-700",
      "from-cyan-600 to-sky-700",
    ];
    const activeCourses = dashboard.dashboard.courses ?? [];

    return (
      <section id="portal-overview">
        {/* Welcome banner */}
        <div className="rounded-[22px] border border-[#c6d4ec] bg-[#eef4ff] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Tu espacio académico</p>
              <h1 className="mt-2 text-[1.6rem] font-semibold leading-tight text-[#172033] sm:text-[2rem]">
                {dashboard.dashboard.welcomeTitle || `Bienvenido, ${dashboard.user?.fullName?.split(" ")[0] || "Estudiante"}`}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#536277]">{dashboard.dashboard.summary}</p>
              {dashboardError ? <p className="mt-3 text-sm text-[#b45309]">{dashboardError}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Cuenta activa</p>
              <p className="mt-1 text-sm font-semibold text-[#172033]">{dashboard.user?.fullName || "Estudiante GoBeyond"}</p>
              <p className="text-xs text-[#536277]">{dashboard.user?.email || ""}</p>
            </div>
          </div>
          {/* Metrics strip */}
          <div className="mt-5 flex flex-wrap divide-x divide-[#c6d4ec] overflow-hidden rounded-[16px] border border-[#c6d4ec] bg-white/70">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Matrículas</p>
              <p className="text-[1.6rem] font-black leading-none text-[#1d4ed8]">{dashboard.dashboard.enrollments.length}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Cursos activos</p>
              <p className="text-[1.6rem] font-black leading-none text-[#15803d]">{activeCourses.length}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Disponibles</p>
              <p className="text-[1.6rem] font-black leading-none text-[#7c3aed]">{dashboard.dashboard.availableCourses.length}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Ruta</p>
              <p className="text-[1.6rem] font-black leading-none text-[#b45309]">{learningPath.length} <span className="text-[1rem]">hitos</span></p>
            </div>
          </div>
        </div>

        {/* Class cards grid — Google Classroom style */}
        {activeCourses.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeCourses.map((course, index) => {
              const progress = course.enhancement?.progressPercent ?? 0;
              const isPassed = course.completionStatus === "passed";
              const isFailed = course.completionStatus === "failed";
              const colorClass = gcColors[index % gcColors.length];
              return (
                <article key={course.enrollmentId ?? course.id} className="overflow-hidden rounded-[22px] border border-[#d7e0ea] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)]">
                  {/* Cover banner */}
                  <div className={`relative h-32 bg-gradient-to-br ${colorClass}`}>
                    {course.coverImage ? (
                      <img alt={course.title} className="absolute inset-0 h-full w-full object-cover" src={course.coverImage} />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Status badge */}
                    {isPassed ? (
                      <span className="absolute right-3 top-3 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#15803d]">Aprobado ✓</span>
                    ) : isFailed ? (
                      <span className="absolute right-3 top-3 rounded-full border border-[#fecaca] bg-[#fff7ed] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#9a3412]">No aprobado</span>
                    ) : null}
                    {/* Course title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="truncate text-sm font-black leading-tight text-white drop-shadow">{course.title}</p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8899b0]">
                      {course.format || "Programa"}{course.duration ? ` · ${course.duration}` : ""}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold text-[#536277]">Avance</p>
                        <p className="text-[10px] font-black text-[#172033]">{progress}%</p>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e7edf5]">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isPassed ? "bg-[#15803d]" : isFailed ? "bg-[#dc2626]" : "bg-[#1d4ed8]"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Expiry */}
                    {course.accessExpiresAt ? (
                      <p className="mt-2 text-[10px] text-[#8899b0]">Acceso hasta {formatDisplayDate(course.accessExpiresAt)}</p>
                    ) : null}

                    <button
                      className="mt-4 w-full rounded-xl bg-[#1d4ed8] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
                      onClick={() => handleOpenCourse(course)}
                      type="button"
                    >
                      Entrar al aula →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f8fbff] p-10 text-center text-[#5d6b80]">
            No se encuentran matrículas activas registradas a tu nombre en este ciclo.
          </div>
        )}

        {/* Community CTA */}
        <div className="mt-5 flex items-center justify-between gap-4 rounded-[18px] border border-[#d7e0ea] bg-white p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Comunidad GoBeyond</p>
            <p className="mt-1 text-sm font-semibold text-[#172033]">Conecta con otros estudiantes y comparte tu progreso.</p>
          </div>
          <button className="shrink-0 rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-2.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#eef4ff]" onClick={onOpenCommunity} type="button">
            Entrar a comunidad
          </button>
        </div>
      </section>
    );
  }

  function renderCoursesSection() {
    const activeCourses = dashboard.dashboard.courses ?? [];
    const gcColors = [
      "from-blue-600 to-blue-700",
      "from-emerald-600 to-green-700",
      "from-violet-600 to-purple-700",
      "from-amber-500 to-orange-600",
      "from-rose-600 to-pink-700",
      "from-cyan-600 to-sky-700",
    ];

    // Gather all assignments across courses sorted by dueAt
    const allDueSoon = activeCourses
      .flatMap((course) =>
        (course.assignments ?? [])
          .filter((a) => a.dueAt)
          .map((a) => ({ ...a, courseTitle: course.title }))
      )
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      .slice(0, 5);

    // Performance stats
    const avgProgress = activeCourses.length
      ? Math.round(activeCourses.reduce((sum, c) => sum + (c.enhancement?.progressPercent ?? 0), 0) / activeCourses.length)
      : 0;
    const totalMaterials = activeCourses.reduce((sum, c) => sum + (c.assignments ?? []).length, 0);
    const passedCount = activeCourses.filter((c) => c.completionStatus === "passed").length;
    const maxStreak = activeCourses.reduce((max, c) => Math.max(max, c.enhancement?.streakDays ?? 0), 0);
    const totalPoints = activeCourses.reduce((sum, c) => sum + (c.enhancement?.points ?? 0), 0);
    const hasGamification = activeCourses.some((c) => c.enhancement?.gamificationEnabled);

    return (
      <section id="portal-courses" className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
        {/* Left — stream grouped by course */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Trabajo del curso</p>
              <h2 className="mt-1 text-[1.4rem] font-semibold text-[#172033]">Mi classwork</h2>
            </div>
            <span className="rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-3 py-1.5 text-[11px] font-semibold text-[#435066]">
              {activeCourses.length} curso{activeCourses.length !== 1 ? "s" : ""} activo{activeCourses.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Notification banner as announcement card */}
          {activeNotification ? (
            <div className="mb-4 rounded-[18px] border border-[#c6d4ec] bg-[#eef4ff] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-white text-xs font-black">!</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1d4ed8]">Anuncio</p>
                  <p className="mt-1 font-semibold text-[#172033]">{activeNotification.title}</p>
                  {activeNotification.body ? <p className="mt-1 text-sm text-[#536277]">{activeNotification.body}</p> : null}
                  {activeNotification.ctaPath ? (
                    <button className="mt-2 text-sm font-semibold text-[#1d4ed8] underline-offset-2 hover:underline" onClick={handleNotificationAction} type="button">
                      Ver más →
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeCourses.length ? (
            <div className="space-y-6">
              {activeCourses.map((course, index) => {
                const colorClass = gcColors[index % gcColors.length];
                const assignments = course.assignments ?? [];
                return (
                  <div key={course.enrollmentId ?? course.id} className="overflow-hidden rounded-[20px] border border-[#d7e0ea] bg-white">
                    {/* Course header bar */}
                    <div className={`relative h-24 bg-gradient-to-r ${colorClass}`}>
                      {course.coverImage ? (
                        <img alt={course.title} className="absolute inset-0 h-full w-full object-cover" src={course.coverImage} />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      <div className="absolute inset-0 flex items-end justify-between px-4 pb-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-black leading-tight text-white drop-shadow">{course.title}</p>
                          <p className="text-[11px] text-white/80 mt-0.5">{course.format}{course.duration ? ` · ${course.duration}` : ""}</p>
                        </div>
                        <button
                          className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-[11px] font-black text-[#1d4ed8] shadow-sm transition hover:bg-[#eef4ff]"
                          onClick={() => handleOpenCourse(course)}
                          type="button"
                        >
                          Abrir aula →
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="border-b border-[#e7edf5] px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-[#e7edf5]">
                          <div
                            className={`h-1.5 rounded-full transition-all ${course.completionStatus === "passed" ? "bg-[#15803d]" : course.completionStatus === "failed" ? "bg-[#dc2626]" : "bg-[#1d4ed8]"}`}
                            style={{ width: `${course.enhancement?.progressPercent ?? 0}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[10px] font-black text-[#536277]">{course.enhancement?.progressPercent ?? 0}%</span>
                      </div>
                    </div>

                    {/* Stream: assignments */}
                    {assignments.length ? (
                      <div className="divide-y divide-[#e7edf5]">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-start gap-3 p-4 hover:bg-[#f8fbff] hover:shadow-sm transition-all">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                              <svg aria-hidden="true" className="h-3.5 w-3.5 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="font-semibold text-sm text-[#172033]">{assignment.title}</p>
                                {assignment.dueLabel ? (
                                  <span className="shrink-0 rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-2 py-0.5 text-[10px] font-semibold text-[#6b7a90]">{assignment.dueLabel}</span>
                                ) : null}
                              </div>
                              {assignment.instruction ? (
                                <p className="mt-1 text-xs leading-relaxed text-[#536277] line-clamp-2">{assignment.instruction}</p>
                              ) : null}
                              {/* Attachments */}
                              {(assignment.attachments ?? []).length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {assignment.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7e0ea] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1d4ed8] transition hover:bg-[#eef4ff]"
                                      download={att.fileName}
                                      href={att.fileUrl || att.fileData}
                                    >
                                      <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
                                      {att.fileName || "Adjunto"}
                                    </a>
                                  ))}
                                </div>
                              ) : assignment.fileUrl ? (
                                <a
                                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#d7e0ea] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#1d4ed8] transition hover:bg-[#eef4ff]"
                                  download={assignment.fileName}
                                  href={assignment.fileUrl}
                                >
                                  <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
                                  {assignment.fileName || "Descargar adjunto"}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-4 text-sm text-[#8899b0]">El docente no ha publicado materiales aún.</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f8fbff] p-10 text-center text-[#5d6b80]">
              No se encuentran matrículas activas registradas a tu nombre en este ciclo.
            </div>
          )}
        </div>

        {/* Right — performance stats + upcoming */}
        <div className="grid gap-4 content-start">
          {/* Performance panel */}
          <div className="overflow-hidden rounded-[20px] border border-[#d7e0ea] bg-white">
            <div className="border-b border-[#e7edf5] px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Tu desempeño</p>
            </div>

            {activeCourses.length ? (
              <div className="px-4 py-4 space-y-4">
                {/* Average progress bar */}
                <div>
                  <div className="flex items-end justify-between gap-2 mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">Promedio de avance</p>
                    <p className="text-[1.4rem] font-black leading-none text-[#172033]">{avgProgress}<span className="text-sm font-semibold text-[#6b7a90]">%</span></p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#e7edf5]">
                    <div
                      className="h-2.5 rounded-full bg-[#1d4ed8] transition-all"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[#8899b0]">sobre {activeCourses.length} curso{activeCourses.length !== 1 ? "s" : ""} activo{activeCourses.length !== 1 ? "s" : ""}</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[14px] border border-[#e7edf5] bg-[#f7f9fc] px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#6b7a90]">Materiales</p>
                    <p className="mt-1 text-xl font-black text-[#172033]">{totalMaterials}</p>
                    <p className="text-[10px] text-[#8899b0]">en todos los cursos</p>
                  </div>
                  <div className="rounded-[14px] border border-[#e7edf5] bg-[#f7f9fc] px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#6b7a90]">Aprobados</p>
                    <p className="mt-1 text-xl font-black text-[#15803d]">{passedCount}</p>
                    <p className="text-[10px] text-[#8899b0]">curso{passedCount !== 1 ? "s" : ""} completado{passedCount !== 1 ? "s" : ""}</p>
                  </div>
                  {hasGamification ? (
                    <>
                      <div className="rounded-[14px] border border-[#e7edf5] bg-[#f7f9fc] px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#6b7a90]">Racha</p>
                        <p className="mt-1 text-xl font-black text-[#d97706]">{maxStreak}<span className="text-sm font-semibold"> d</span></p>
                        <p className="text-[10px] text-[#8899b0]">días consecutivos</p>
                      </div>
                      <div className="rounded-[14px] border border-[#e7edf5] bg-[#f7f9fc] px-3 py-2.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#6b7a90]">Puntos</p>
                        <p className="mt-1 text-xl font-black text-[#7c3aed]">{totalPoints}</p>
                        <p className="text-[10px] text-[#8899b0]">acumulados</p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="px-4 py-4 text-sm text-[#8899b0]">Sin cursos activos para calcular estadísticas.</p>
            )}
          </div>

          {/* Upcoming due dates */}
          <div className="overflow-hidden rounded-[20px] border border-[#d7e0ea] bg-white">
            <div className="border-b border-[#e7edf5] px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Próximas entregas</p>
            </div>
            {allDueSoon.length ? (
              <div className="divide-y divide-[#f0f4f8]">
                {allDueSoon.map((item) => {
                  const daysLeft = item.dueAt ? Math.ceil((new Date(item.dueAt) - Date.now()) / 86400000) : null;
                  const urgent = daysLeft !== null && daysLeft <= 2;
                  const overdue = daysLeft !== null && daysLeft < 0;
                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${overdue ? "bg-[#dc2626]" : urgent ? "bg-[#d97706]" : "bg-[#6b7a90]"}`} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#172033]">{item.title}</p>
                        <p className="mt-0.5 text-[10px] text-[#8899b0]">{item.courseTitle}</p>
                        <p className={`mt-0.5 text-[10px] font-semibold ${overdue ? "text-[#dc2626]" : urgent ? "text-[#d97706]" : "text-[#536277]"}`}>
                          {item.dueLabel || formatDisplayDate(item.dueAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-xs font-semibold text-[#172033]">Sin entregas próximas</p>
                <p className="mt-1 text-[11px] text-[#8899b0]">Al día con el trabajo del curso</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderPathSection() {
    return (
      <section className={workspaceChrome.elevatedSurface} id="portal-path">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#e7edf5] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-[#eef4ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
              Ruta académica
            </div>
            <h2 className="mt-3 text-[1.6rem] font-semibold leading-tight text-[#172033] sm:text-[2rem]">Roadmap de trayectoria</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#536277]">
              Cada hito resume la progresión formativa disponible en GoBeyond. Avanza de arriba hacia abajo: cada etapa es independiente y complementaria.
            </p>
          </div>
          <div className="shrink-0 rounded-[18px] border border-[#c6d4ec] bg-[#eef4ff] px-5 py-4 text-right sm:min-w-[10rem]">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Progreso</p>
            <p className="mt-1.5 text-[2rem] font-black leading-none text-[#172033]">{learningPath.length}</p>
            <p className="mt-0.5 text-[11px] text-[#536277]">etapa{learningPath.length !== 1 ? "s" : ""} en ruta</p>
          </div>
        </div>

        {/* Scrollable cards area */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-5 sm:p-6">
          {learningPath.length ? (
            <div className="grid gap-5">
              {learningPath.map((item, index) => (
                <LearningRoadmapCard key={item.id} index={index} isLast={index === learningPath.length - 1} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f7f9fc] p-10 text-center">
              <p className="font-semibold text-[#172033]">Ruta no configurada</p>
              <p className="mt-2 text-sm text-[#5d6b80]">Los hitos publicados desde admin aparecerán aquí como roadmap académico.</p>
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
