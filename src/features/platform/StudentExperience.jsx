import { useEffect, useState } from "react";
import { WorkspaceView } from "../../shared/WorkspaceView";
import {
  ackStudentNotification,
  aiStudyBuddy,
  askStudentAssistant,
  createStudentCourseRequest,
  createStudentTicket,
} from "../../services/contentApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
            <MarkdownContent className="mt-2 text-sm leading-relaxed text-[#435066]">{item.outcome}</MarkdownContent>
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
        <MarkdownContent className="mt-2 text-sm leading-relaxed">{content}</MarkdownContent>
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

const CHAT_SESSIONS_KEY = "gobeyond_chat_sessions";
const ACTIVE_SESSION_KEY = "gobeyond_active_session";

function createSession(title = "Nueva conversacion") {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, createdAt: Date.now(), messages: [{ role: "assistant", content: "¡Bienvenido al Tutor Virtual de GoBeyond! Soy tu asistente academico personal." }] };
}

function StudentAssistant({ courseCount, availableCount, activeCourses }) {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (saved) { const p = JSON.parse(saved); if (Array.isArray(p) && p.length) return p; }
    } catch {}
    return [createSession()];
  });
  const [activeId, setActiveId] = useState(() => {
    try { return localStorage.getItem(ACTIVE_SESSION_KEY) || sessions[0]?.id || ""; } catch { return ""; }
  });

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Persist
  useEffect(() => { try { localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions)); } catch {} }, [sessions]);
  useEffect(() => { if (activeId) try { localStorage.setItem(ACTIVE_SESSION_KEY, activeId); } catch {} }, [activeId]);

  function renameSession(title) {
    setSessions(current => current.map(s => s.id === activeId ? { ...s, title: title.slice(0, 60) } : s));
  }
  function deleteSession(id) {
    setSessions(current => {
      const next = current.filter(s => s.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next.length ? next : [createSession()];
    });
  }
  function newChat() {
    const s = createSession();
    setSessions(current => [s, ...current]);
    setActiveId(s.id);
  }
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
    // Target active session; fallback to sessions[0]
    const sid = sessions.find(s => s.id === activeId)?.id || sessions[0]?.id;
    if (!sid) return; // no session available

    // Rename session on first user message
    if (activeSession?.messages.length <= 1) renameSession(message);

    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, { role: "user", content: message }] } : s));
    setDraft("");
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/student/ai/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Error del servidor");

      setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, { role: "assistant", content: "" }] } : s));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.token || parsed.response || "";
            if (text) {
              setSessions(prev => prev.map(s => {
                if (s.id !== sid) return s;
                const msgs = [...s.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: last.content + text };
                return { ...s, messages: msgs };
              }));
            }
          } catch {}
        }
      }
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
      const sid2 = activeId;
      setSessions(prev => prev.map(s => s.id === sid2 ? { ...s, messages: [...s.messages, { role: "assistant", content: "Tu solicitud ha sido registrada. Un administrador la revisara pronto." }] } : s));
    } catch (err) {
      setError(err.message);
    } finally {
      setTicketSubmitting(false);
    }
  }

  return (
    <section className="grid gap-0 scroll-mt-28 xl:grid-cols-[18rem_1fr] xl:h-[calc(100vh-10rem)]" id="portal-support">
      {/* ── Session Sidebar ── */}
      <div className="hidden xl:flex flex-col border-r border-slate-200 bg-slate-50/50">
        <div className="p-4 border-b border-slate-200">
          <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs font-semibold" onClick={newChat}>
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nuevo chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-150 group ${
                s.id === activeId
                  ? "bg-white border border-slate-200 shadow-sm"
                  : "hover:bg-white/60 border border-transparent"
              }`}
            >
              <p className="font-semibold text-slate-700 truncate">{s.title}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleDateString("es-CR")}</p>
                {s.id === activeId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                  >
                    <svg className="size-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Chat ── */}
      <div className="flex flex-col bg-white min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 shrink-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-[0_4px_10px_rgba(29,78,216,0.25)]">AI</div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800">Tutor Virtual</h2>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[11px] text-slate-500">En linea · GoBeyond AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="text-[9px]">{courseCount} cursos</Badge>
            <button onClick={newChat} className="xl:hidden size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              <svg className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {messages.length <= 1 && (
            <div className="text-center py-12">
              <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-blue-50 mb-4">
                <svg className="size-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/></svg>
              </div>
              <h3 className="text-base font-bold text-slate-700">Tutor Virtual GoBeyond</h3>
              <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">Preguntame sobre tus cursos, certificaciones o metodologias de estudio.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white text-[10px] font-bold shadow-sm mt-0.5">AI</div>
              )}
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <MarkdownContent className="text-sm">{msg.content}</MarkdownContent>
                  ) : submitting ? (
                    <span className="inline-flex gap-1">
                      <span className="size-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="size-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="size-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : null
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 text-[10px] font-bold mt-0.5">U</div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <form className="border-t border-slate-100 p-4 shrink-0" onSubmit={handleSubmit}>
          <div className="flex items-end gap-3">
            <textarea
              className="flex-1 min-h-[48px] max-h-[120px] resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Pregunta lo que quieras..."
              rows={1}
              value={draft}
            />
            <Button
              size="icon"
              className="shrink-0 size-11 rounded-2xl"
              disabled={submitting || !draft.trim()}
              type="submit"
            >
              <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </form>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-[#0f172a]/32 ">
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
            <div className="min-w-0 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Materiales del curso</p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">Stream de clase</h3>
              </div>

              {assignments.length ? (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-4 p-5">
                      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <svg aria-hidden="true" className="size-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h4 className="text-base font-bold text-slate-800">{assignment.title}</h4>
                          {assignment.dueLabel ? (
                            <Badge variant="outline" className="shrink-0 text-[10px] font-semibold">{assignment.dueLabel}</Badge>
                          ) : null}
                        </div>
                        {assignment.instruction ? (
                          <MarkdownContent className="mt-3 text-sm leading-relaxed text-slate-600">{assignment.instruction}</MarkdownContent>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0f172a]/28 px-4 py-4  sm:px-6 sm:py-6">
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
              <MarkdownContent className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{dashboard.dashboard.summary}</MarkdownContent>
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
                  {activeNotification.body ? <MarkdownContent className="mt-1 text-sm text-slate-600">{activeNotification.body}</MarkdownContent> : null}
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
                                <div className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2"><MarkdownContent>{assignment.instruction}</MarkdownContent></div>
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
              <MarkdownContent className="mt-2 text-sm leading-relaxed text-slate-600">{activeNotification.body}</MarkdownContent>
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

      <WorkspaceView key={studentSection}>
        {studentSection === "portal-overview" ? renderOverviewSection() : null}
        {studentSection === "portal-courses" ? renderCoursesSection() : null}
        {studentSection === "portal-path" ? renderPathSection() : null}
        {studentSection === "portal-openings" ? renderOpeningsSection() : null}
        {studentSection === "portal-support" ? renderSupportSection() : null}
      </WorkspaceView>

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
