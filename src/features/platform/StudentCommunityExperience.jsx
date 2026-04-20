import { useEffect, useMemo, useState } from "react";

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
    <div className="border border-[#eadfce] bg-white p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">{label}</p>
      <p className="mt-4 font-['Georgia'] text-3xl text-[#20181f]">{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#5c4d46]">{help}</p>
    </div>
  );
}

function FilterPill({ active, children, ...props }) {
  return (
    <button
      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] transition ${
        active ? "bg-[#20181f] text-white" : "border border-[#d8cdbf] bg-white text-[#5c4d46]"
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
      <div className="flex min-h-screen items-center justify-center bg-[#f3ede3] font-['Georgia'] text-lg italic text-[#20181f]">
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
    <div className="min-h-screen overflow-x-hidden bg-[#f3ede3] text-[#20181f]">
      <div className="border-b border-[#d8cdbf] bg-[#fbf8f2] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#8b6d55]">Comunidad GoBeyond</p>
            <h1 className="font-['Georgia'] text-xl text-[#20181f] sm:text-2xl">Pregunta, responde y avanza con apoyo entre estudiantes</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="border border-[#d8cdbf] px-4 py-2 text-sm" onClick={onBack} type="button">
              Volver al portal
            </button>
            <button className="border border-[#d8cdbf] bg-[#20181f] px-4 py-2 text-sm text-white" onClick={onLogout} type="button">
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border border-[#d8cdbf] bg-white p-5 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Cabina colaborativa</p>
              <h2 className="mt-5 max-w-3xl font-['Georgia'] text-3xl leading-tight text-[#20181f] sm:text-4xl lg:text-5xl">
                Un Stack Overflow ligero con tono academico y contexto real de tus cursos.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#5c4d46] sm:text-base">
                Cada hilo nace mejor estructurado para que la ayuda llegue mas rapido. Autocompletamos curso, autor,
                categoria y una plantilla de contexto para evitar preguntas vacias.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="bg-[#20181f] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white" onClick={openComposer} type="button">
                  Hacer una pregunta
                </button>
                <div className="border border-[#d8cdbf] bg-[#fbf8f2] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">
                  Autor autopoblado: {user.fullName || "Estudiante"}
                </div>
              </div>
              {dashboardError || communityError || workspaceError ? (
                <p className="mt-5 text-sm italic text-red-800">{dashboardError || communityError || workspaceError}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <StatTile label="Hilos" value={stats.totalThreads} help="Preguntas activas y resueltas dentro de la comunidad." />
              <StatTile label="Resueltas" value={stats.resolvedCount} help="Conversaciones con una respuesta clara o mejor respuesta marcada." />
              <StatTile label="Sin respuesta" value={stats.unansweredCount} help="Hilos que todavia necesitan apoyo de otros estudiantes." />
              <StatTile label="Aportes" value={stats.totalReplies} help="Respuestas acumuladas para que el conocimiento no se pierda." />
            </div>
          </div>
        </section>
        <section className="mt-10 grid gap-8 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="grid gap-6">
            <div className="border border-[#d8cdbf] bg-white p-6">
              <div className="flex flex-col gap-4">
                <input
                  className="w-full border border-[#d8cdbf] bg-[#fbf8f2] px-4 py-3 text-sm text-[#20181f]"
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
                  className={`border p-6 text-left transition-all ${
                    selectedThread?.id === thread.id
                      ? "border-[#20181f] bg-white shadow-[0_18px_45px_rgba(32,24,31,0.08)]"
                      : "border-[#d8cdbf] bg-white hover:border-[#8b6d55]"
                  }`}
                  onClick={() => setSelectedThreadId(thread.id)}
                  type="button"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-[#fbf8f2] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">{categoryLabel(thread.category)}</span>
                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[0.24em] ${
                          thread.status === "resolved" ? "bg-[#e6f1df] text-[#44632b]" : !thread.replies.length ? "bg-[#fff3dd] text-[#8a5b17]" : "bg-[#edf1f4] text-[#475569]"
                        }`}>
                          {thread.status === "resolved" ? "Resuelta" : !thread.replies.length ? "Sin respuesta" : "Activa"}
                        </span>
                      </div>
                      <h3 className="mt-4 break-words font-['Georgia'] text-2xl leading-tight text-[#20181f]">{thread.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#5c4d46]">{thread.body}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(thread.tags ?? []).slice(0, 4).map((tag) => (
                          <span key={tag} className="border border-[#eadfce] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8b6d55]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3 border-t border-[#eadfce] pt-4 sm:grid-cols-2 lg:min-w-[7rem] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 lg:grid-cols-1">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">Respuestas</p>
                        <p className="mt-2 font-['Georgia'] text-3xl text-[#20181f]">{thread.replies.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">Curso</p>
                        <p className="mt-2 text-xs font-medium text-[#5c4d46]">{thread.courseTitle || "Comunidad general"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-[#eadfce] pt-4 text-[11px] uppercase tracking-[0.18em] text-[#8b6d55]">
                    {thread.authorName} · actualizado {formatDate(thread.updatedAt)}
                  </div>
                </button>
              ))}

              {!filteredThreads.length ? (
                <div className="border border-dashed border-[#cbb8a4] bg-[#fbf8f2] p-10 text-center text-[#8b6d55]">
                  No encontramos hilos con ese criterio. Prueba otra busqueda o abre una nueva pregunta.
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6">
            {selectedThread ? (
              <div className="border border-[#d8cdbf] bg-white p-5 sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-[#fbf8f2] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">{selectedThread.courseTitle || "Comunidad general"}</span>
                      {selectedThread.status === "resolved" ? <span className="bg-[#e6f1df] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#44632b]">Resuelta</span> : null}
                    </div>
                    <h2 className="mt-5 break-words font-['Georgia'] text-3xl leading-tight text-[#20181f] sm:text-4xl">{selectedThread.title}</h2>
                    <p className="mt-5 text-base leading-relaxed text-[#5c4d46]">{selectedThread.body}</p>
                  </div>
                  {selectedThread.authorId === user.id ? (
                    <button className="border border-[#d8cdbf] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#20181f] disabled:opacity-50" disabled={threadUpdating} onClick={() => toggleResolved(selectedThread.id)} type="button">
                      {selectedThread.status === "resolved" ? "Reabrir hilo" : "Marcar resuelta"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#eadfce] pt-5 text-[11px] uppercase tracking-[0.18em] text-[#8b6d55]">
                  <span>{selectedThread.authorName}</span><span>·</span><span>{formatDate(selectedThread.createdAt)}</span><span>·</span><span>{categoryLabel(selectedThread.category)}</span>
                </div>

                <div className="mt-8 grid gap-4 border-t border-[#eadfce] pt-8">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-['Georgia'] text-xl text-[#20181f] sm:text-2xl">Respuestas</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">{selectedThread.replies.length} aportes</p>
                  </div>
                  {selectedThread.replies.length ? selectedThread.replies.map((reply) => (
                    <article key={reply.id} className={`border p-5 ${selectedThread.bestReplyId === reply.id ? "border-[#7da05a] bg-[#f4f8ef]" : "border-[#eadfce] bg-[#fbf8f2]"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">{reply.authorName}</p>
                          <p className="mt-2 text-sm leading-relaxed text-[#5c4d46]">{reply.body}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {selectedThread.bestReplyId === reply.id ? <span className="bg-[#dfeccd] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#44632b]">Mejor respuesta</span> : null}
                          {selectedThread.authorId === user.id ? (
                            <button className="border border-[#d8cdbf] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-[#20181f] disabled:opacity-50" disabled={threadUpdating} onClick={() => markBestReply(selectedThread.id, reply.id)} type="button">
                              Marcar mejor
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8b6d55]">{formatDate(reply.createdAt)}</p>
                    </article>
                  )) : (
                    <div className="border border-dashed border-[#cbb8a4] bg-[#fbf8f2] p-8 text-sm text-[#8b6d55]">Este hilo todavia no tiene respuestas. Puedes ser la primera persona en aportar.</div>
                  )}
                </div>
              </div>
            ) : null}

            <form className="border border-[#d8cdbf] bg-white p-5 sm:p-8" onSubmit={handleReplySubmit}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Responder con contexto</p>
                  <h3 className="mt-3 font-['Georgia'] text-2xl text-[#20181f]">Tu respuesta se firma automaticamente con tu perfil</h3>
                </div>
                <div className="border border-[#eadfce] bg-[#fbf8f2] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">{user.fullName || "Estudiante GoBeyond"}</div>
              </div>
              <textarea className="mt-6 min-h-[180px] w-full border border-[#d8cdbf] bg-[#fbf8f2] px-5 py-4 text-sm leading-7 text-[#20181f]" onChange={(event) => setReplyDraft(event.target.value)} placeholder="Comparte una respuesta clara, aplicable y respetuosa." value={replyDraft} />
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="bg-[#20181f] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white disabled:opacity-50" disabled={replySubmitting || !replyDraft.trim()} type="submit">{replySubmitting ? "Publicando..." : "Publicar respuesta"}</button>
                <button className="border border-[#d8cdbf] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#20181f]" onClick={openComposer} type="button">Abrir nueva pregunta</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {showComposer ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#20181f]/65 px-4 py-6 backdrop-blur-sm sm:py-8">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-[#d8cdbf] bg-[#f7f1e7] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="sticky top-0 z-10 border-b border-[#d8cdbf] bg-[#f7f1e7] px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Nueva pregunta</p>
                  <h2 className="mt-3 font-['Georgia'] text-2xl text-[#20181f] sm:text-3xl">Abre un hilo mejor contextualizado desde el inicio</h2>
                </div>
                <button className="border border-[#d8cdbf] px-4 py-2 text-sm text-[#20181f]" onClick={() => setShowComposer(false)} type="button">Cerrar</button>
              </div>
            </div>
            <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[0.96fr_1.04fr]">
              <form className="grid gap-4" onSubmit={handleCreateThread}>
                <input className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" onChange={(event) => setThreadDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo claro de tu pregunta" value={threadDraft.title} />
                <div className="grid gap-4 md:grid-cols-2">
                  <select className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" onChange={(event) => setThreadDraft((current) => ({ ...current, category: event.target.value }))} value={threadDraft.category}>
                    <option value="curso">Curso</option><option value="asignacion">Asignacion</option><option value="certificacion">Certificacion</option><option value="acceso">Acceso</option><option value="carrera">Carrera</option><option value="general">General</option>
                  </select>
                  <select className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" onChange={(event) => setThreadDraft((current) => ({ ...current, courseId: event.target.value }))} value={threadDraft.courseId}>
                    <option value="">Comunidad general</option>
                    {activeCourses.map((course) => <option key={course.id || course.enrollmentId} value={course.id}>{course.title}</option>)}
                  </select>
                </div>
                <input className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" onChange={(event) => setThreadDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="Etiquetas separadas por coma" value={threadDraft.tags} />
                <textarea className="min-h-[220px] w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm leading-7 text-[#20181f]" onChange={(event) => setThreadDraft((current) => ({ ...current, body: event.target.value }))} value={threadDraft.body} />
                <div className="flex flex-wrap gap-3">
                  <button className="bg-[#20181f] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white disabled:opacity-50" disabled={composerSubmitting} type="submit">{composerSubmitting ? "Guardando..." : "Publicar hilo"}</button>
                  <button className="border border-[#d8cdbf] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#20181f]" onClick={() => setShowComposer(false)} type="button">Cancelar</button>
                </div>
              </form>
              <div className="border border-[#d8cdbf] bg-white p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8b6d55]">Campos autopoblados</p>
                <div className="mt-5 grid gap-4">
                  <div className="border border-[#eadfce] bg-[#fbf8f2] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">Autor</p><p className="mt-2 text-sm text-[#20181f]">{user.fullName || "Estudiante"}</p><p className="mt-1 text-xs text-[#5c4d46]">{user.email || "correo@estudiante"}</p></div>
                  <div className="border border-[#eadfce] bg-[#fbf8f2] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">Curso sugerido</p><p className="mt-2 text-sm text-[#20181f]">{activeCourses.find((course) => course.id === threadDraft.courseId)?.title || "Comunidad general"}</p></div>
                  <div className="border border-[#eadfce] bg-[#fbf8f2] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8b6d55]">Categoria</p><p className="mt-2 text-sm text-[#20181f]">{categoryLabel(threadDraft.category)}</p></div>
                  <div className="border border-[#eadfce] bg-[#fbf8f2] p-4 text-sm leading-7 text-[#5c4d46]">La plantilla inicial ayuda a que la comunidad entienda rapido tu contexto y evite respuestas ambiguas.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
