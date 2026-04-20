import { useEffect, useState } from "react";
import { askStudentAssistant, createStudentCourseRequest, createStudentTicket } from "../../services/contentApi";

// --- COMPONENTES DE INTERFAZ EDITORIAL ---

function DashboardCard({ eyebrow, title, body }) {
  return (
    <div className="border border-[#d8cdbf] bg-white p-6 transition-colors hover:bg-[#fdfbf7] sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">{eyebrow}</p>
      <h3 className="mt-4 break-words font-['Georgia'] text-2xl leading-tight text-[#20181f] sm:text-3xl">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-[#5c4d46]">{body}</p>
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-6`}>
      <div
        className={`max-w-[85%] border p-5 text-sm leading-7 ${
          isAssistant
            ? "border-[#d8cdbf] bg-white text-[#5c4d46]"
            : "border-[#20181f] bg-[#20181f] text-[#f3ede3]"
        }`}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] opacity-60">
          {isAssistant ? "Documentación GoBeyond" : "Consulta Estudiante"}
        </p>
        <div className="mt-3 whitespace-pre-wrap font-medium">{content}</div>
      </div>
    </div>
  );
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

function StudentAssistant({ token, courseCount, availableCount, activeCourses }) {
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
      const response = await askStudentAssistant(token, {
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
      const response = await createStudentTicket(token, ticketForm);
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
    <section className="mt-16 border-t-2 border-[#20181f] pt-12 sm:mt-20 sm:pt-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Módulo de Asistencia</p>
          <h2 className="mt-4 font-['Georgia'] text-4xl text-[#20181f] sm:text-5xl">Centro de Consultas</h2>
          <p className="mt-6 text-base leading-relaxed text-[#5c4d46]">
            Este sistema interactivo analiza sus {courseCount} cursos activos y las {availableCount} rutas disponibles 
            para ofrecerle respuestas institucionales sobre su estado académico.
          </p>
        </div>
        <div className="border border-[#d8cdbf] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6d55] sm:px-6">
          Respuestas de Carácter Informativo
        </div>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:gap-12">
        <div className="border border-[#d8cdbf] bg-[#fdfbf7] p-5 sm:p-8">
          <div className="max-h-[450px] overflow-y-auto pr-2 sm:pr-4 scrollbar-thin">
            {messages.map((m, i) => (
              <ChatBubble key={i} content={m.content} role={m.role} />
            ))}
          </div>

          <form className="mt-8 border-t border-[#d8cdbf] pt-8" onSubmit={handleSubmit}>
            <textarea
              className="w-full min-h-[120px] border border-[#d8cdbf] bg-white p-4 text-sm text-[#20181f] outline-none focus:border-[#20181f] transition-colors resize-none"
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escriba su consulta académica aquí..."
              value={draft}
            />
            <div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-[10px] uppercase tracking-widest text-[#8b6d55]">Máximo 1,000 caracteres por consulta.</p>
              <button
                className="border border-[#20181f] bg-[#20181f] px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#3d313b] transition-colors disabled:opacity-50"
                disabled={submitting || !draft.trim()}
                type="submit"
              >
                {submitting ? "Procesando..." : "Enviar Consulta"}
              </button>
            </div>
            {error && <p className="mt-4 text-sm text-red-800 italic">{error}</p>}
          </form>

          {showTicketForm && (
            <form className="mt-10 border-t-2 border-[#d8cdbf] pt-10" onSubmit={handleTicketSubmit}>
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Formulario de Incidencia</h4>
                <button className="text-[10px] uppercase tracking-widest underline" onClick={() => setShowTicketForm(false)} type="button">Cancelar</button>
              </div>
              <div className="mt-6 grid gap-4">
                <input
                  className="border border-[#d8cdbf] p-4 text-sm outline-none focus:border-[#20181f]"
                  onChange={(e) => setTicketForm(c => ({ ...c, subject: e.target.value }))}
                  placeholder="Asunto de la incidencia"
                  value={ticketForm.subject}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    className="border border-[#d8cdbf] bg-white p-4 text-sm outline-none focus:border-[#20181f]"
                    onChange={(e) => setTicketForm(c => ({ ...c, category: e.target.value }))}
                    value={ticketForm.category}
                  >
                    <option value="soporte">Soporte Técnico</option>
                    <option value="acceso">Problemas de Acceso</option>
                    <option value="curso">Contenido del Curso</option>
                  </select>
                  <select
                    className="border border-[#d8cdbf] bg-white p-4 text-sm outline-none focus:border-[#20181f]"
                    onChange={(e) => setTicketForm(c => ({ ...c, courseId: e.target.value }))}
                    value={ticketForm.courseId}
                  >
                    <option value="">Referencia General</option>
                    {activeCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <textarea
                  className="min-h-[150px] border border-[#d8cdbf] p-4 text-sm outline-none focus:border-[#20181f]"
                  onChange={(e) => setTicketForm(c => ({ ...c, description: e.target.value }))}
                  placeholder="Detalle los motivos de su solicitud administrativa..."
                  value={ticketForm.description}
                />
                <button
                  className="w-fit border border-[#20181f] bg-[#20181f] px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-white"
                  disabled={ticketSubmitting}
                  type="submit"
                >
                  {ticketSubmitting ? "Enviando..." : "Registrar Ticket"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div className="border border-[#d8cdbf] bg-[#fbf8f2] p-5 sm:p-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b6d55]">Consultas Frecuentes</h4>
            <div className="mt-8 grid gap-3">
              {[
                "Mis cursos activos y fechas de vencimiento.",
                "Asignaciones pendientes y material de estudio.",
                "Progreso detallado de mis módulos.",
                "Explorar nuevos programas de GoBeyond.",
              ].map((s) => (
                <button
                  key={s}
                  className="border border-[#d8cdbf] bg-white p-4 text-left text-sm text-[#5c4d46] hover:border-[#20181f] transition-colors"
                  onClick={() => setDraft(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="border border-[#d8cdbf] bg-white p-5 sm:p-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8b6d55]">Alcance Institucional</h4>
            <p className="mt-6 text-sm leading-relaxed text-[#5c4d46]">
              Este asistente opera bajo un marco estrictamente académico. Para trámites legales o financieros, 
              le sugerimos elevar un ticket formal mediante el botón inferior.
            </p>
            <button
              className="mt-8 w-full border border-[#d8cdbf] bg-[#fbf8f2] py-4 text-[10px] font-bold uppercase tracking-widest text-[#20181f] hover:bg-white transition-colors"
              onClick={() => setShowTicketForm(true)}
              type="button"
            >
              Contactar Administración
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- COMPONENTE: MODAL DE DETALLE DE CURSO ---

function CourseDetailModal({ course, onClose }) {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#20181f]/70 px-4 py-8 backdrop-blur-sm overflow-y-auto">
      <div className="mb-10 w-full max-w-6xl border border-[#d8cdbf] bg-[#f7f1e7] shadow-2xl">
        <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-[#d8cdbf] bg-[#f7f1e7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Ficha de Programa</p>
            <h3 className="mt-2 break-words font-['Georgia'] text-3xl text-[#20181f] sm:text-4xl">{course.title}</h3>
          </div>
          <button className="border border-[#20181f] px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#20181f] hover:text-white transition-colors" onClick={onClose}>
            Cerrar Ficha
          </button>
        </div>

        <div className="grid gap-8 p-5 sm:gap-12 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-10">
            {course.coverImage && (
              <div className="border border-[#d8cdbf] grayscale hover:grayscale-0 transition-all duration-700">
                <img alt={course.title} className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[400px]" src={course.coverImage} />
              </div>
            )}
            <div className="border border-[#d8cdbf] bg-white p-5 sm:p-8">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55] border-b border-[#eadfce] pb-4 mb-6">Descripción del Módulo</h4>
              <p className="text-sm leading-relaxed text-[#5c4d46]">{course.description}</p>
              <div className="mt-8 grid gap-4 border-t border-[#eadfce] pt-8 italic text-sm text-[#5c4d46]">
                <p><strong>Resultados Académicos:</strong> {course.outcomes}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-['Georgia'] text-2xl italic text-[#20181f] sm:text-3xl">Asignaciones Pendientes</h4>
              {(course.assignments ?? []).length ? (
                course.assignments.map((a) => (
                  <div key={a.id} className="border border-[#d8cdbf] bg-white p-6">
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">{a.dueLabel || "Tarea"}</p>
                    <h5 className="mt-3 font-['Georgia'] text-xl text-[#20181f]">{a.title}</h5>
                    <p className="mt-3 text-sm text-[#5c4d46] leading-relaxed">{a.instruction}</p>
                    {(a.fileUrl || a.fileData) && (
                      <a className="mt-5 inline-block text-[10px] font-bold uppercase tracking-widest text-[#b06d38] border-b border-[#b06d38]" download={a.fileName} href={a.fileUrl || a.fileData}>
                        Descargar Material Adjunto
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm italic text-[#8b6d55]">No se registran asignaciones para este periodo.</p>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-[#d8cdbf] bg-white p-5 sm:p-8">
              <h4 className="font-['Georgia'] text-2xl text-[#20181f]">Métricas de Avance</h4>
              <div className="mt-8 h-[2px] w-full bg-[#eadfce]">
                <div className="h-full bg-[#20181f]" style={{ width: `${course.enhancement?.progressPercent ?? 0}%` }} />
              </div>
              <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>Completado</span>
                <span>{course.enhancement?.progressPercent ?? 0}%</span>
              </div>
              <p className="mt-8 text-xs text-[#5c4d46]">
                <strong className="text-[#20181f]">Expiración de Acceso:</strong> {new Date(course.accessExpiresAt).toLocaleDateString()}
              </p>
            </div>

            {course.enhancement?.gamificationEnabled && (
              <div className="border border-[#d8cdbf] bg-[#fbf8f2] p-5 sm:p-8">
                <h4 className="font-['Georgia'] text-2xl text-[#20181f]">Reconocimientos</h4>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="border border-[#d8cdbf] p-4 bg-white text-center">
                    <p className="text-[9px] uppercase tracking-widest text-[#8b6d55]">Puntos</p>
                    <p className="text-2xl font-['Georgia'] mt-1">{course.enhancement?.points ?? 0}</p>
                  </div>
                  <div className="border border-[#d8cdbf] p-4 bg-white text-center">
                    <p className="text-[9px] uppercase tracking-widest text-[#8b6d55]">Racha</p>
                    <p className="text-2xl font-['Georgia'] mt-1">{course.enhancement?.streakDays ?? 0}d</p>
                  </div>
                </div>
              </div>
            )}
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

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#20181f]/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl border border-[#d8cdbf] bg-[#f7f1e7] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#d8cdbf] p-5 sm:p-8">
          <div className="max-w-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Solicitud de Apertura</p>
            <h3 className="mt-2 font-['Georgia'] text-3xl text-[#20181f] leading-tight">{course.title}</h3>
          </div>
          <button className="border border-[#20181f] px-4 py-2 text-[10px] font-bold uppercase tracking-widest" onClick={onClose}>Cerrar</button>
        </div>

        <div className="grid gap-8 p-5 sm:gap-10 sm:p-8 md:grid-cols-[1fr_0.8fr]">
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const val = String(form.contactValue).trim();
            if (form.contactChannel === "correo" && !isValidEmail(val)) return setLocalError("Email inválido.");
            if (["whatsapp", "texto"].includes(form.contactChannel) && !isValidNumericContact(val)) return setLocalError("Número inválido.");
            setLocalError("");
            onSubmit({ ...form, contactValue: val });
          }}>
            <select
              className="w-full border border-[#d8cdbf] bg-white p-4 text-sm outline-none focus:border-[#20181f]"
              onChange={(e) => setForm(c => ({ ...c, contactChannel: e.target.value }))}
              value={form.contactChannel}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="correo">Correo Electrónico</option>
              <option value="texto">SMS</option>
            </select>
            <input
              className="w-full border border-[#d8cdbf] bg-white p-4 text-sm outline-none focus:border-[#20181f]"
              onChange={(e) => setForm(c => ({ ...c, contactValue: e.target.value }))}
              placeholder="Dato de contacto"
              value={form.contactValue}
            />
            <textarea
              className="w-full min-h-[120px] border border-[#d8cdbf] bg-white p-4 text-sm outline-none focus:border-[#20181f] resize-none"
              onChange={(e) => setForm(c => ({ ...c, note: e.target.value }))}
              placeholder="¿Por qué le interesa este programa?"
              value={form.note}
            />
            <button className="w-full bg-[#20181f] text-white py-4 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50" disabled={submitting}>
              {submitting ? "Procesando..." : "Enviar Solicitud Académica"}
            </button>
            {message && <p className="text-xs text-green-800 italic">{message}</p>}
            {localError && <p className="text-xs text-red-800 italic">{localError}</p>}
          </form>
          <div className="text-sm leading-relaxed text-[#5c4d46]">
            <h4 className="font-bold text-[#20181f] uppercase tracking-widest text-[10px] mb-4">Proceso de Evaluación</h4>
            <ul className="space-y-4 italic">
              <li>• Su solicitud se indexará en el panel administrativo.</li>
              <li>• Se evaluará la viabilidad del grupo docente.</li>
              <li>• Un coordinador le contactará por el medio seleccionado.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL: STUDENT EXPERIENCE ---

export function StudentExperience({ dashboard, dashboardLoading, dashboardError, onLogout, onOpenCommunity, token }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [requestedCourse, setRequestedCourse] = useState(null);
  const [courseRequestMessage, setCourseRequestMessage] = useState("");
  const [courseRequestError, setCourseRequestError] = useState("");
  const [courseRequestSubmitting, setCourseRequestSubmitting] = useState(false);

  if (dashboardLoading || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3ede3] font-['Georgia'] text-[#20181f] italic text-lg">
        Iniciando sesión en el portal académico...
      </div>
    );
  }

  async function handleCourseRequest(payload) {
    try {
      setCourseRequestMessage("");
      setCourseRequestError("");
      setCourseRequestSubmitting(true);
      const response = await createStudentCourseRequest(token, payload);
      setCourseRequestMessage(response.message);
      setTimeout(() => setRequestedCourse(null), 2000);
    } catch (err) {
      setCourseRequestError(err.message);
    } finally {
      setCourseRequestSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3ede3] pb-24 font-sans text-[#20181f]">
      {/* Header Editorial */}
      <header className="sticky top-0 z-40 border-b border-[#d8cdbf] bg-[#fbf8f2] px-4 py-6 backdrop-blur-md bg-opacity-90 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="border-l-4 border-[#20181f] pl-4 sm:pl-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8b6d55]">Sistema de Gestión Estudiantil</p>
            <h1 className="mt-1 font-['Georgia'] text-3xl tracking-tight leading-none">{dashboard.dashboard.welcomeTitle}</h1>
          </div>
          <button 
            className="self-start border border-[#20181f] px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#20181f] hover:text-white sm:self-auto sm:px-8" 
            onClick={onLogout}
          >
            Finalizar Sesión
          </button>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl border-b border-[#d8cdbf] pb-12 mb-16">
          <p className="font-['Georgia'] text-3xl leading-[1.3] text-[#20181f] sm:text-4xl">
            {dashboard.dashboard.summary}
          </p>
          {dashboardError && <p className="mt-6 text-sm italic text-red-800">{dashboardError}</p>}
        </div>

        <section className="mb-20 grid gap-[1px] border border-[#d8cdbf] bg-[#d8cdbf] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-white px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6d55]">Comunidad entre estudiantes</p>
            <h2 className="mt-5 max-w-3xl font-['Georgia'] text-3xl leading-tight text-[#20181f] sm:text-4xl">
              Abre preguntas con mejor contexto y encuentra respuestas utiles sin salir del ecosistema GoBeyond.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#5c4d46]">
              La cabina colaborativa autopuebla tu perfil, sugiere el curso relacionado y te entrega una plantilla guiada
              para que cada hilo nazca mejor planteado desde el inicio.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                className="border border-[#20181f] bg-[#20181f] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#3d313b]"
                onClick={onOpenCommunity}
                type="button"
              >
                Entrar a comunidad
              </button>
              <div className="border border-[#d8cdbf] bg-[#fbf8f2] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b6d55]">
                Contexto sugerido desde {dashboard.dashboard.courses.length} curso{dashboard.dashboard.courses.length === 1 ? "" : "s"} activo{dashboard.dashboard.courses.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="bg-[#fbf8f2] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b6d55]">Como funciona</p>
            <div className="mt-6 space-y-6">
              {[
                "Tu nombre y correo se firman automaticamente desde la sesion.",
                "El sistema sugiere categoria y curso para evitar preguntas ambiguas.",
                "Puedes marcar la mejor respuesta y convertir el hilo en referencia para otros.",
              ].map((item) => (
                <div key={item} className="border-l-2 border-[#d8cdbf] pl-4 sm:pl-5">
                  <p className="text-sm leading-relaxed text-[#5c4d46]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Indicadores Clave */}
        <div className="grid gap-[1px] bg-[#d8cdbf] md:grid-cols-3 border border-[#d8cdbf] mb-24 shadow-sm">
          <DashboardCard eyebrow="Inscripciones" title={`${dashboard.dashboard.enrollments.length} Matrículas`} body="Programas con acceso vigente a la plataforma y tutorías." />
          <DashboardCard eyebrow="Currículo" title={`${dashboard.dashboard.courses.length} Materias`} body="Módulos habilitados actualmente en su ruta de aprendizaje." />
          <DashboardCard eyebrow="Exploración" title={`${dashboard.dashboard.availableCourses.length} Programas`} body="Nuevas especialidades disponibles para su solicitud inmediata." />
        </div>

        {/* Sección: Cursos Activos */}
        <section className="mt-24">
          <div className="flex flex-col gap-4 border-b-2 border-[#20181f] pb-8 mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-['Georgia'] text-4xl tracking-tighter italic sm:text-5xl">Cursos en Curso</h2>
              <p className="mt-4 text-[#8b6d55] font-medium tracking-wide">PANEL DE CONTROL ACADÉMICO</p>
            </div>
          </div>

          <div className="grid gap-10 sm:gap-16 lg:grid-cols-2">
            {dashboard.dashboard.courses.length ? (
              dashboard.dashboard.courses.map((course) => (
                <article key={course.enrollmentId} className="group relative flex flex-col border-b border-[#d8cdbf] pb-12">
                  {course.coverImage && (
                    <div className="mb-8 aspect-[16/9] overflow-hidden border border-[#d8cdbf] grayscale group-hover:grayscale-0 transition-all duration-700">
                      <img alt={course.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" src={course.coverImage} />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">
                    <span>{course.format}</span>
                    <span className="h-1.5 w-1.5 bg-[#d8cdbf] rounded-full"></span>
                    <span>{course.duration}</span>
                  </div>
                  <h3 className="mt-4 break-words font-['Georgia'] text-3xl leading-none text-[#20181f] transition-all group-hover:italic sm:text-4xl">{course.title}</h3>
                  <p className="mt-6 text-sm leading-relaxed text-[#5c4d46]">{course.description}</p>
                  
                  <div className="mt-10 grid gap-6 border-t border-[#eadfce] pt-8 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6d55]">Vencimiento</p>
                      <p className="mt-2 text-sm font-medium">{new Date(course.accessExpiresAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6d55]">Avance</p>
                      <p className="mt-2 text-sm font-medium">{course.enhancement?.progressPercent ?? 0}% completado</p>
                    </div>
                  </div>

                  <button 
                    className="mt-10 w-full border border-[#20181f] py-4 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-[#20181f] hover:text-white transition-all" 
                    onClick={() => setSelectedCourse(course)}
                  >
                    Entrar al Aula Virtual
                  </button>
                </article>
              ))
            ) : (
              <div className="col-span-full border border-dashed border-[#cbb8a4] p-16 text-center italic text-[#8b6d55]">
                No se encuentran matrículas activas registradas a su nombre en este ciclo.
              </div>
            )}
          </div>
        </section>

        {/* Sección: Rutas y Disponibles */}
        <section className="mt-24 grid gap-10 sm:mt-32 sm:gap-16 lg:grid-cols-2">
          <div className="border border-[#d8cdbf] bg-white p-6 sm:p-10">
            <h2 className="font-['Georgia'] text-3xl italic border-b border-[#20181f] pb-6 mb-10">Trayectoria</h2>
            <div className="space-y-6">
              {dashboard.dashboard.learningPath.map((item) => (
                <div key={item.id} className="border-l-2 border-[#d8cdbf] py-2 pl-4 transition-colors hover:border-[#20181f] sm:pl-6">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6d55]">{item.type}</p>
                  <h3 className="mt-2 font-['Georgia'] text-xl text-[#20181f]">{item.title}</h3>
                  <p className="mt-2 text-xs italic text-[#5c4d46]">{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#d8cdbf] bg-white p-6 sm:p-10">
            <h2 className="font-['Georgia'] text-3xl italic border-b border-[#20181f] pb-6 mb-10">Nuevas Aperturas</h2>
            <div className="space-y-8">
              {dashboard.dashboard.availableCourses.map((c) => (
                <div key={c.id} className="group">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6d55]">{c.format} · {c.duration}</p>
                  <h3 className="mt-2 font-['Georgia'] text-xl text-[#20181f] group-hover:underline transition-all cursor-pointer">{c.title}</h3>
                  <button
                    className="mt-4 text-[10px] font-bold uppercase tracking-widest border-b-2 border-[#20181f] pb-1 hover:text-[#8b6d55] hover:border-[#8b6d55] transition-all"
                    onClick={() => {
                      setCourseRequestMessage("");
                      setCourseRequestError("");
                      setRequestedCourse(c);
                    }}
                  >
                    Solicitar Información
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Asistente Integrado */}
        <StudentAssistant
          activeCourses={dashboard.dashboard.courses}
          availableCount={dashboard.dashboard.availableCourses.length}
          courseCount={dashboard.dashboard.courses.length}
          token={token}
        />
      </main>

      {/* Capa de Modales */}
      <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
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
