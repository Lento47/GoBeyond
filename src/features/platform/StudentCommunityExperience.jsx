import { useEffect, useMemo, useState } from "react";
import { workspaceChrome } from "./workspaceTheme";

const THREAD_TEMPLATE = `Que necesito:
Que intente:
Curso o tema relacionado:
Que error o duda me aparece:`;

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Ahora mismo";
  }

  return date.toLocaleString("es-CR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slugifyTag(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryLabel(value) {
  const labels = {
    curso: "Curso",
    asignacion: "Asignacion",
    certificacion: "Certificacion",
    acceso: "Acceso",
    carrera: "Carrera",
    general: "General",
  };

  return labels[value] || "General";
}

function StatTile({ label, value, help }) {
  return (
    <div className={`${workspaceChrome.surface} p-6`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280]">{label}</p>
      <p className="mt-4 font-['Georgia'] text-3xl font-light italic text-[#1d1d1b]">{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">{help}</p>
    </div>
  );
}

function FilterPill({ active, children, ...props }) {
  return (
    <button
      className={`rounded-sm px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition ${
        active ? "bg-[#1d1d1b] text-white" : "border border-[#e2e0db] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StudentCommunityExperience({
  dashboard,
  dashboardLoading,
  dashboardError,
  communityThreads,
  communityLoading,
  communityError,
  onBack,
  onCreateThread,
  onLogout,
  onReply,
  onUpdateThread,
}) {
  const user = dashboard?.user ?? {};
  const activeCourses = dashboard?.dashboard?.courses ?? [];
  const [activeFilter, setActiveFilter] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [threadUpdating, setThreadUpdating] = useState(false);
  const [threadDraft, setThreadDraft] = useState(() => ({
    title: "",
    body: THREAD_TEMPLATE,
    category: activeCourses.length ? "curso" : "general",
    courseId: activeCourses[0]?.id ?? "",
    tags: activeCourses[0]?.title ? slugifyTag(activeCourses[0].title) : "comunidad",
  }));
  const threads = communityThreads ?? [];

  const filteredThreads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let nextThreads = [...threads];

    if (activeFilter === "unanswered") {
      nextThreads = nextThreads.filter((thread) => !thread.replies.length);
    } else if (activeFilter === "resolved") {
      nextThreads = nextThreads.filter((thread) => thread.status === "resolved");
    } else if (activeFilter === "popular") {
      nextThreads.sort((left, right) => right.replies.length - left.replies.length);
    } else {
      nextThreads.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
    }

    if (!normalizedQuery) {
      return nextThreads;
    }

    return nextThreads.filter((thread) =>
      [thread.title, thread.body, thread.courseTitle, thread.category, ...(thread.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [activeFilter, searchQuery, threads]);

  const selectedThread = useMemo(
    () => filteredThreads.find((thread) => thread.id === selectedThreadId) ?? filteredThreads[0] ?? threads[0] ?? null,
    [filteredThreads, selectedThreadId, threads]
  );

  useEffect(() => {
    const firstVisibleThreadId = filteredThreads[0]?.id ?? "";
    if (!firstVisibleThreadId) {
      if (selectedThreadId) {
        setSelectedThreadId("");
      }
      return;
    }

    const stillVisible = filteredThreads.some((thread) => thread.id === selectedThreadId);
    if (!stillVisible) {
      setSelectedThreadId(firstVisibleThreadId);
    }
  }, [filteredThreads, selectedThreadId]);

  const stats = useMemo(() => {
    const resolvedCount = threads.filter((thread) => thread.status === "resolved").length;
    const unansweredCount = threads.filter((thread) => !thread.replies.length).length;
    const totalReplies = threads.reduce((sum, thread) => sum + thread.replies.length, 0);

    return {
      totalThreads: threads.length,
      resolvedCount,
      unansweredCount,
      totalReplies,
    };
  }, [threads]);

  if (dashboardLoading || communityLoading || !dashboard) {
    return (
      <div className={`${workspaceChrome.surface} flex min-h-[60vh] items-center justify-center p-10 text-lg font-semibold text-[#172033]`}>
        Preparando la comunidad estudiantil...
      </div>
    );
  }

  function openComposer() {
    setWorkspaceError("");
    setThreadDraft({
      title: "",
      body: THREAD_TEMPLATE,
      category: activeCourses.length ? "curso" : "general",
      courseId: activeCourses[0]?.id ?? "",
      tags: activeCourses[0]?.title ? slugifyTag(activeCourses[0].title) : "comunidad",
    });
    setShowComposer(true);
  }

  async function handleCreateThread(event) {
    event.preventDefault();
    setWorkspaceError("");
    const title = threadDraft.title.trim();
    const body = threadDraft.body.trim();
    if (!title || !body) {
      return;
    }

    try {
      setComposerSubmitting(true);
      const createdThread = await onCreateThread({
        title,
        body,
        category: threadDraft.category,
        courseId: threadDraft.courseId,
        tags: String(threadDraft.tags ?? "")
          .split(",")
          .map((item) => slugifyTag(item))
          .filter(Boolean),
      });
      setSelectedThreadId(createdThread?.id ?? "");
      setShowComposer(false);
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setComposerSubmitting(false);
    }
  }

  async function handleReplySubmit(event) {
    event.preventDefault();
    setWorkspaceError("");
    const body = replyDraft.trim();
    if (!selectedThread || !body) {
      return;
    }

    try {
      setReplySubmitting(true);
      await onReply(selectedThread.id, { body });
      setReplyDraft("");
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setReplySubmitting(false);
    }
  }

  async function toggleResolved(threadId) {
    const nextStatus = selectedThread?.status === "resolved" ? "open" : "resolved";

    try {
      setThreadUpdating(true);
      setWorkspaceError("");
      await onUpdateThread(threadId, { status: nextStatus });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setThreadUpdating(false);
    }
  }

  async function markBestReply(threadId, replyId) {
    try {
      setThreadUpdating(true);
      setWorkspaceError("");
      await onUpdateThread(threadId, { bestReplyId: replyId });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setThreadUpdating(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className={`${workspaceChrome.elevatedSurface} scroll-mt-28 p-5 sm:p-6`} id="community-overview">
        <div className="grid gap-6 border-b border-[#e7edf5] pb-5 xl:grid-cols-[minmax(0,1.15fr)_20rem]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-[#eef4ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
              Comunidad operativa
            </div>
            <h2 className="mt-4 max-w-3xl text-[1.9rem] font-semibold leading-tight text-[#172033] sm:text-[2.3rem]">
              Preguntas con contexto real, respuestas reutilizables y trazabilidad entre estudiantes.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#536277] sm:text-base">
              Cada hilo nace mejor estructurado para que la ayuda llegue mas rapido. Autocompletamos curso, autor,
              categoria y una plantilla de contexto para evitar preguntas vacias.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#1e40af]" onClick={openComposer} type="button">
                Hacer una pregunta
              </button>
              <button className="rounded-xl border border-[#d7e0ea] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#435066] transition hover:bg-[#f7f9fc]" onClick={onBack} type="button">
                Volver al portal
              </button>
              <div className="rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">
                Autor autopoblado: {user.fullName || "Estudiante"}
              </div>
            </div>
            {dashboardError || communityError || workspaceError ? (
              <p className="mt-5 text-sm text-[#b45309]">{dashboardError || communityError || workspaceError}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <StatTile label="Hilos" value={stats.totalThreads} help="Preguntas activas y resueltas dentro de la comunidad." />
            <StatTile label="Resueltas" value={stats.resolvedCount} help="Conversaciones con una respuesta clara o mejor respuesta marcada." />
            <StatTile label="Sin respuesta" value={stats.unansweredCount} help="Hilos que todavia necesitan apoyo de otros estudiantes." />
            <StatTile label="Aportes" value={stats.totalReplies} help="Respuestas acumuladas para que el conocimiento no se pierda." />
          </div>
        </div>
      </section>

      <section className="grid gap-6 scroll-mt-28 xl:grid-cols-[0.95fr_1.05fr]" id="community-threads">
        <div className="grid gap-6">
          <div className={`${workspaceChrome.surface} p-5`}>
            <div className="flex flex-col gap-4">
              <input
                className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por tema, curso, categoria o etiqueta"
                value={searchQuery}
              />
              <div className="flex flex-wrap gap-3">
                <FilterPill active={activeFilter === "recent"} onClick={() => setActiveFilter("recent")} type="button">Recientes</FilterPill>
                <FilterPill active={activeFilter === "unanswered"} onClick={() => setActiveFilter("unanswered")} type="button">Sin responder</FilterPill>
                <FilterPill active={activeFilter === "popular"} onClick={() => setActiveFilter("popular")} type="button">Populares</FilterPill>
                <FilterPill active={activeFilter === "resolved"} onClick={() => setActiveFilter("resolved")} type="button">Resueltas</FilterPill>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                className={`rounded-[18px] border p-5 text-left transition-all ${
                  selectedThread?.id === thread.id
                    ? "border-[#c6d4ec] bg-[#eef4ff] shadow-[0_1px_2px_rgba(29,78,216,0.08)]"
                    : "border-[#d7e0ea] bg-white hover:border-[#1d4ed8] hover:bg-[#fbfcfe]"
                }`}
                onClick={() => setSelectedThreadId(thread.id)}
                type="button"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{categoryLabel(thread.category)}</span>
                      <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${
                        thread.status === "resolved" ? "bg-[#dcfce7] text-[#166534]" : !thread.replies.length ? "bg-[#ffedd5] text-[#9a3412]" : "bg-[#f3f4f6] text-[#4b5563]"
                      }`}>
                        {thread.status === "resolved" ? "Resuelta" : !thread.replies.length ? "Sin respuesta" : "Activa"}
                      </span>
                    </div>
                    <h3 className="mt-4 break-words text-xl font-semibold leading-tight text-[#172033]">{thread.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#536277]">{thread.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(thread.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full border border-[#d7e0ea] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#6b7a90]">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-[#d7e0ea] pt-4 sm:grid-cols-2 lg:min-w-[7rem] lg:border-l lg:border-t-0 lg:border-[#d7e0ea] lg:pl-5 lg:pt-0 lg:grid-cols-1">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Respuestas</p>
                      <p className="mt-2 text-3xl font-semibold text-[#172033]">{thread.replies.length}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Curso</p>
                      <p className="mt-2 text-xs font-medium text-[#536277]">{thread.courseTitle || "Comunidad general"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 border-t border-[#d7e0ea] pt-4 text-[11px] uppercase tracking-[0.18em] text-[#6b7a90]">
                  {thread.authorName} · actualizado {formatDate(thread.updatedAt)}
                </div>
              </button>
            ))}

            {!filteredThreads.length ? (
              <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f7f9fc] p-10 text-center text-[#6b7a90]">
                No encontramos hilos con ese criterio. Prueba otra busqueda o abre una nueva pregunta.
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6">
            {selectedThread ? (
              <div className={`${workspaceChrome.surface} p-5 sm:p-6`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#d7e0ea] bg-[#f7f9fc] px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{selectedThread.courseTitle || "Comunidad general"}</span>
                      {selectedThread.status === "resolved" ? <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#166534]">Resuelta</span> : null}
                    </div>
                    <h2 className="mt-5 break-words text-[1.8rem] font-semibold leading-tight text-[#172033] sm:text-[2.2rem]">{selectedThread.title}</h2>
                    <p className="mt-5 text-base leading-relaxed text-[#536277]">{selectedThread.body}</p>
                  </div>
                  {selectedThread.authorId === user.id ? (
                    <button className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#172033] disabled:opacity-50" disabled={threadUpdating} onClick={() => toggleResolved(selectedThread.id)} type="button">
                      {selectedThread.status === "resolved" ? "Reabrir hilo" : "Marcar resuelta"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#d7e0ea] pt-5 text-[11px] uppercase tracking-[0.18em] text-[#6b7a90]">
                  <span>{selectedThread.authorName}</span><span>·</span><span>{formatDate(selectedThread.createdAt)}</span><span>·</span><span>{categoryLabel(selectedThread.category)}</span>
                </div>

                <div className="mt-8 grid gap-4 border-t border-[#d7e0ea] pt-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold text-[#172033] sm:text-2xl">Respuestas</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{selectedThread.replies.length} aportes</p>
                  </div>
                  {selectedThread.replies.length ? selectedThread.replies.map((reply) => (
                    <article key={reply.id} className={`rounded-[18px] border p-5 ${selectedThread.bestReplyId === reply.id ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#d7e0ea] bg-[#f7f9fc]"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{reply.authorName}</p>
                          <p className="mt-2 text-sm leading-relaxed text-[#536277]">{reply.body}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {selectedThread.bestReplyId === reply.id ? <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#166534]">Mejor respuesta</span> : null}
                          {selectedThread.authorId === user.id ? (
                            <button className="rounded-xl border border-[#d7e0ea] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#172033] disabled:opacity-50" disabled={threadUpdating} onClick={() => markBestReply(selectedThread.id, reply.id)} type="button">
                              Marcar mejor
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#6b7a90]">{formatDate(reply.createdAt)}</p>
                    </article>
                  )) : (
                    <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f7f9fc] p-8 text-sm text-[#6b7a90]">Este hilo todavia no tiene respuestas. Puedes ser la primera persona en aportar.</div>
                  )}
                </div>
              </div>
            ) : null}

            <form className={`${workspaceChrome.surface} scroll-mt-28 p-5 sm:p-6`} id="community-reply" onSubmit={handleReplySubmit}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Responder con contexto</p>
                  <h3 className="mt-3 text-2xl font-semibold text-[#172033]">Tu respuesta se firma automaticamente con tu perfil</h3>
                </div>
                <div className="rounded-xl border border-[#d7e0ea] bg-[#f7f9fc] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{user.fullName || "Estudiante GoBeyond"}</div>
              </div>
              <textarea className="mt-6 min-h-[180px] w-full rounded-[18px] border border-[#d7e0ea] bg-white px-5 py-4 text-sm leading-7 text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]" onChange={(event) => setReplyDraft(event.target.value)} placeholder="Comparte una respuesta clara, aplicable y respetuosa." value={replyDraft} />
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#1e40af] disabled:opacity-50" disabled={replySubmitting || !replyDraft.trim()} type="submit">{replySubmitting ? "Publicando..." : "Publicar respuesta"}</button>
                <button className="rounded-xl border border-[#d7e0ea] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#172033]" onClick={openComposer} type="button">Abrir nueva pregunta</button>
              </div>
            </form>
          </div>
      </section>

      {showComposer ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0f172a]/28 px-4 py-6 backdrop-blur-[8px] sm:py-8">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-[#d7e0ea] bg-[#f5f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <div className="sticky top-0 z-10 border-b border-[#d7e0ea] bg-[#f5f7fb]/96 px-4 py-5 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Nueva pregunta</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[#172033] sm:text-3xl">Abre un hilo mejor contextualizado desde el inicio</h2>
                </div>
                <button className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-2 text-sm text-[#172033]" onClick={() => setShowComposer(false)} type="button">Cerrar</button>
              </div>
            </div>
            <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[0.96fr_1.04fr]">
              <form className="grid gap-4" onSubmit={handleCreateThread}>
                <input className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]" onChange={(event) => setThreadDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo claro de tu pregunta" value={threadDraft.title} />
                <div className="grid gap-4 md:grid-cols-2">
                  <select className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]" onChange={(event) => setThreadDraft((current) => ({ ...current, category: event.target.value }))} value={threadDraft.category}>
                    <option value="curso">Curso</option><option value="asignacion">Asignacion</option><option value="certificacion">Certificacion</option><option value="acceso">Acceso</option><option value="carrera">Carrera</option><option value="general">General</option>
                  </select>
                  <select className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]" onChange={(event) => setThreadDraft((current) => ({ ...current, courseId: event.target.value }))} value={threadDraft.courseId}>
                    <option value="">Comunidad general</option>
                    {activeCourses.map((course) => <option key={course.id || course.enrollmentId} value={course.id}>{course.title}</option>)}
                  </select>
                </div>
                <input className="w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]" onChange={(event) => setThreadDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="Etiquetas separadas por coma" value={threadDraft.tags} />
                <textarea className="min-h-[220px] w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm leading-7 text-[#172033] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]" onChange={(event) => setThreadDraft((current) => ({ ...current, body: event.target.value }))} value={threadDraft.body} />
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#1e40af] disabled:opacity-50" disabled={composerSubmitting} type="submit">{composerSubmitting ? "Guardando..." : "Publicar hilo"}</button>
                  <button className="rounded-xl border border-[#d7e0ea] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#172033]" onClick={() => setShowComposer(false)} type="button">Cancelar</button>
                </div>
              </form>
              <div className={`${workspaceChrome.surface} p-6`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Campos autopoblados</p>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Autor</p><p className="mt-2 text-sm font-semibold text-[#172033]">{user.fullName || "Estudiante"}</p><p className="mt-1 text-xs text-[#536277]">{user.email || "correo@estudiante"}</p></div>
                  <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Curso sugerido</p><p className="mt-2 text-sm font-semibold text-[#172033]">{activeCourses.find((course) => course.id === threadDraft.courseId)?.title || "Comunidad general"}</p></div>
                  <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">Categoria</p><p className="mt-2 text-sm font-semibold text-[#172033]">{categoryLabel(threadDraft.category)}</p></div>
                  <div className="rounded-[18px] border border-[#d7e0ea] bg-[#f7f9fc] p-4 text-sm leading-7 text-[#536277]">La plantilla inicial ayuda a que la comunidad entienda rapido tu contexto y evite respuestas ambiguas.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
