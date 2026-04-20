import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  EmptyState,
  FilterInput,
  Input,
  ModalShell,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  SectionToolbar,
  Select,
  SmallStat,
  Textarea,
} from "./components/admin/AdminUI";

export const SOP_CATEGORIES = ["Academico", "Operaciones", "Calidad", "Soporte", "Institucional"];

const downloadLinkClass =
  "inline-flex items-center justify-center rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm font-medium text-[#172033] transition hover:border-[#bbc8d9] hover:bg-[#f7f9fc]";

const initialSopForm = {
  id: "",
  title: "",
  category: SOP_CATEGORIES[0],
  description: "",
  version: "",
  fileName: "",
  fileKey: "",
  contentType: "",
  size: 0,
  uploadedAt: "",
  uploadedBy: "",
  file: null,
};

const initialRequestForm = {
  id: "",
  status: "open",
  adminResolutionNote: "",
};

function NoticeBox({ message, tone = "info" }) {
  if (!message) {
    return null;
  }

  const toneClass =
    tone === "error"
      ? "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]"
      : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";

  return <div className={`rounded-[18px] border px-4 py-3 text-sm leading-relaxed ${toneClass}`}>{message}</div>;
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
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

function formatFileSize(value) {
  const size = Number(value ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return "Sin tamano";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function matchesCategory(itemCategory, selectedCategory) {
  return selectedCategory === "all" || itemCategory === selectedCategory;
}

function buildSopDownloadUrl(sopId) {
  return `/api/secure/sop-file?id=${encodeURIComponent(sopId)}`;
}

function normalizeSopItem(sop) {
  if (!sop || typeof sop !== "object") {
    return null;
  }

  return {
    ...sop,
    downloadUrl: sop.downloadUrl || buildSopDownloadUrl(sop.id),
  };
}

function normalizeChangeRequestItem(changeRequest, sopLookup) {
  if (!changeRequest || typeof changeRequest !== "object") {
    return null;
  }

  const sop = sopLookup.get(changeRequest.sopId) ?? null;
  const comments = Array.isArray(changeRequest.comments) ? changeRequest.comments : [];
  const lastComment = comments.length ? comments[comments.length - 1] : null;

  return {
    ...changeRequest,
    comments,
    commentCount: comments.length,
    lastComment,
    sopTitle: changeRequest.sopTitle || sop?.title || "SOP sin titulo",
    downloadUrl: changeRequest.downloadUrl || (sop?.id ? buildSopDownloadUrl(sop.id) : ""),
  };
}

function getNotificationTargetId(notification) {
  const ctaPath = String(notification?.ctaPath ?? "");
  const hashIndex = ctaPath.indexOf("#");
  return hashIndex === -1 ? "" : ctaPath.slice(hashIndex + 1).trim();
}

export function AdminSopsSection({
  sops,
  changeRequests,
  onCreateSop,
  onUpdateSop,
  onDeleteSop,
  onUploadAsset,
  onUpdateChangeRequest,
  managedRequestId = "",
  onManagedRequestHandled,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [modal, setModal] = useState("");
  const [sopForm, setSopForm] = useState(initialSopForm);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const normalizedSops = useMemo(() => (sops ?? []).map(normalizeSopItem).filter(Boolean), [sops]);
  const normalizedChangeRequests = useMemo(() => {
    const sopLookup = new Map(normalizedSops.map((sop) => [sop.id, sop]));
    return (changeRequests ?? []).map((item) => normalizeChangeRequestItem(item, sopLookup)).filter(Boolean);
  }, [changeRequests, normalizedSops]);

  const filteredSops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedSops.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.description, item.version, item.category, item.fileName]
          .some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));

      return matchesQuery && matchesCategory(item.category, category);
    });
  }, [category, normalizedSops, query]);

  const activeRequests = useMemo(
    () => normalizedChangeRequests.filter((item) => item.status !== "completed"),
    [normalizedChangeRequests]
  );

  useEffect(() => {
    if (!managedRequestId) {
      return;
    }

    const targetRequest = activeRequests.find((item) => item.id === managedRequestId);
    if (!targetRequest) {
      onManagedRequestHandled?.();
      return;
    }

    setRequestForm({
      id: targetRequest.id,
      status: targetRequest.status ?? "open",
      adminResolutionNote: targetRequest.adminResolutionNote ?? "",
    });
    setModal("request");
    setMessage("");
    setError("");
    onManagedRequestHandled?.();
  }, [activeRequests, managedRequestId, onManagedRequestHandled]);

  function closeModal() {
    setModal("");
    setSubmitting(false);
  }

  function startCreateSop() {
    setSopForm(initialSopForm);
    setMessage("");
    setError("");
    setModal("sop");
  }

  function startEditSop(sop) {
    setSopForm({
      id: sop.id,
      title: sop.title ?? "",
      category: sop.category ?? SOP_CATEGORIES[0],
      description: sop.description ?? "",
      version: sop.version ?? "",
      fileName: sop.fileName ?? "",
      fileKey: sop.fileKey ?? "",
      contentType: sop.contentType ?? "",
      size: Number(sop.size ?? 0),
      uploadedAt: sop.uploadedAt ?? "",
      uploadedBy: sop.uploadedBy ?? "",
      file: null,
    });
    setMessage("");
    setError("");
    setModal("sop");
  }

  function startManageRequest(changeRequest) {
    setRequestForm({
      id: changeRequest.id,
      status: changeRequest.status ?? "open",
      adminResolutionNote: changeRequest.adminResolutionNote ?? "",
    });
    setMessage("");
    setError("");
    setModal("request");
  }

  async function handleSopSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      let nextFile = {
        fileName: sopForm.fileName,
        fileKey: sopForm.fileKey,
        contentType: sopForm.contentType,
        size: sopForm.size,
        uploadedAt: sopForm.uploadedAt,
      };

      if (sopForm.file) {
        const uploaded = await onUploadAsset(sopForm.file, "sop-file");
        nextFile = {
          fileName: uploaded.fileName,
          fileKey: uploaded.key,
          contentType: uploaded.contentType,
          size: Number(sopForm.file.size ?? 0),
          uploadedAt: new Date().toISOString(),
        };
      }

      if (!nextFile.fileKey) {
        throw new Error("Debes adjuntar un archivo para el SOP.");
      }

      const payload = {
        title: sopForm.title,
        category: sopForm.category,
        description: sopForm.description,
        version: sopForm.version,
        ...nextFile,
      };

      if (sopForm.id) {
        await onUpdateSop(sopForm.id, payload);
        setMessage("SOP actualizado.");
      } else {
        await onCreateSop(payload);
        setMessage("SOP creado.");
      }

      closeModal();
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  async function handleDeleteSop(sop) {
    if (!globalThis.confirm(`Eliminar "${sop.title}" tambien limpiara sus solicitudes relacionadas. ¿Deseas continuar?`)) {
      return;
    }

    try {
      setError("");
      setMessage("");
      await onDeleteSop(sop.id);
      setMessage("SOP eliminado.");
      closeModal();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleRequestSubmit(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      await onUpdateChangeRequest(requestForm.id, {
        status: requestForm.status,
        adminResolutionNote: requestForm.adminResolutionNote,
      });
      setMessage(requestForm.status === "completed" ? "Solicitud completada y notificada." : "Solicitud actualizada.");
      closeModal();
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  const currentRequest = activeRequests.find((item) => item.id === requestForm.id) ?? null;

  return (
    <div className="grid gap-6">
      <NoticeBox message={message} />
      <NoticeBox message={error} tone="error" />

      <SectionCard
        title="Biblioteca de SOPs"
        description="Mantén centralizados los procedimientos operativos, sus versiones y las solicitudes de cambio que llegan desde el equipo docente."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SmallStat label="SOPs" value={normalizedSops.length} help="Documentos disponibles en la biblioteca institucional." tone="accent" />
          <SmallStat label="Solicitudes activas" value={activeRequests.length} help="Hilos abiertos o en progreso pendientes de atención." />
          <SmallStat label="Categorias" value={SOP_CATEGORIES.length} help="Clasificación inicial para ordenar los procedimientos." />
        </div>
      </SectionCard>

      <SectionCard title="Documentos" description="Busca, filtra y administra la documentación operativa que el equipo usa para trabajar.">
        <SectionToolbar
          helper={`${filteredSops.length} SOPs visibles con los filtros actuales.`}
          action={
            <ActionButton onClick={startCreateSop} type="button">
              Nuevo SOP
            </ActionButton>
          }
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
            <FilterInput onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por titulo, descripcion, version o archivo" value={query} />
            <Select onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="all">Todas las categorias</option>
              {SOP_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </SectionToolbar>

        {filteredSops.length ? (
          <div className="grid gap-4">
            {filteredSops.map((sop) => (
              <RowCard
                key={sop.id}
                eyebrow={`${sop.category} · v${sop.version}`}
                title={sop.title}
                meta={`${sop.fileName} · ${formatFileSize(sop.size)} · Actualizado ${formatDate(sop.updatedAt)}`}
                body={sop.description}
              >
                <a className={downloadLinkClass} href={sop.downloadUrl}>
                  Descargar
                </a>
                <SecondaryButton onClick={() => startEditSop(sop)} type="button">
                  Editar
                </SecondaryButton>
              </RowCard>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin SOPs visibles" body="Cuando cargues procedimientos aparecerán aquí con su versión, categoría y descarga segura." />
        )}
      </SectionCard>

      <SectionCard title="Solicitudes de cambio" description="Gestiona aquí los comentarios enviados por educadores antes de que se conviertan en deuda operativa.">
        {activeRequests.length ? (
          <div className="grid gap-4">
            {activeRequests.map((changeRequest) => (
              <RowCard
                key={changeRequest.id}
                eyebrow={`SOP · ${changeRequest.status}`}
                title={changeRequest.sopTitle}
                meta={`${changeRequest.requesterName || "Sin remitente"} · ${changeRequest.requesterEmail || "Sin correo"} · ${changeRequest.commentCount} comentarios`}
                body={changeRequest.lastComment?.body || "Sin comentarios registrados."}
              >
                <a className={downloadLinkClass} href={changeRequest.downloadUrl}>
                  Descargar SOP
                </a>
                <SecondaryButton onClick={() => startManageRequest(changeRequest)} type="button">
                  Gestionar solicitud
                </SecondaryButton>
              </RowCard>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin solicitudes activas" body="Los comentarios nuevos del equipo docente aparecerán aquí y también en la queue administrativa." />
        )}
      </SectionCard>

      {modal === "sop" ? (
        <ModalShell
          onClose={closeModal}
          subtitle="Cada SOP requiere título, categoría, descripción, versión y un archivo seguro para descarga autenticada."
          title={sopForm.id ? "Editar SOP" : "Nuevo SOP"}
        >
          <form className="grid gap-4" onSubmit={handleSopSubmit}>
            <Input onChange={(event) => setSopForm((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo del SOP" value={sopForm.title} />
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
              <Select onChange={(event) => setSopForm((current) => ({ ...current, category: event.target.value }))} value={sopForm.category}>
                {SOP_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Input onChange={(event) => setSopForm((current) => ({ ...current, version: event.target.value }))} placeholder="v1.0" value={sopForm.version} />
            </div>
            <Textarea onChange={(event) => setSopForm((current) => ({ ...current, description: event.target.value }))} placeholder="Resumen operativo o alcance del procedimiento" value={sopForm.description} />
            <div className="grid gap-3 rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Archivo seguro</p>
              <p className="text-sm leading-6 text-[#536277]">
                {sopForm.fileName ? `Actual: ${sopForm.fileName} · ${formatFileSize(sopForm.size)}` : "Aún no hay archivo cargado para este SOP."}
              </p>
              <Input
                accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv"
                onChange={(event) => setSopForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))}
                type="file"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <ActionButton disabled={submitting} type="submit">
                {submitting ? "Guardando..." : sopForm.id ? "Guardar cambios" : "Crear SOP"}
              </ActionButton>
              {sopForm.id ? (
                <SecondaryButton disabled={submitting} onClick={() => handleDeleteSop(normalizedSops.find((item) => item.id === sopForm.id) ?? sopForm)} type="button">
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

      {modal === "request" && currentRequest ? (
        <ModalShell
          onClose={closeModal}
          subtitle="Mueve la solicitud a progreso o ciérrala con una nota clara de resolución para notificar al educador."
          title="Gestionar solicitud de cambio"
        >
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <form className="grid gap-4" onSubmit={handleRequestSubmit}>
              <Select onChange={(event) => setRequestForm((current) => ({ ...current, status: event.target.value }))} value={requestForm.status}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
              </Select>
              <Textarea
                onChange={(event) => setRequestForm((current) => ({ ...current, adminResolutionNote: event.target.value }))}
                placeholder="Nota de resolucion obligatoria al completar"
                value={requestForm.adminResolutionNote}
              />
              <div className="flex flex-wrap gap-3">
                <ActionButton disabled={submitting} type="submit">
                  {submitting ? "Guardando..." : "Guardar solicitud"}
                </ActionButton>
                <SecondaryButton onClick={closeModal} type="button">
                  Cancelar
                </SecondaryButton>
              </div>
            </form>

            <div className="grid gap-4">
              <RowCard
                eyebrow={`SOP · ${currentRequest.status}`}
                title={currentRequest.sopTitle}
                meta={`${currentRequest.requesterName || "Sin remitente"} · ${currentRequest.requesterEmail || "Sin correo"} · ${formatDate(currentRequest.updatedAt)}`}
                body={currentRequest.adminResolutionNote || "Todavia no hay nota de resolucion registrada."}
              >
                <a className={downloadLinkClass} href={currentRequest.downloadUrl}>
                  Descargar SOP
                </a>
              </RowCard>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Comentarios del hilo</p>
                <ScrollArea className="mt-3 max-h-[24rem]">
                  <div className="grid gap-3">
                    {currentRequest.comments.length ? (
                      currentRequest.comments.map((comment) => (
                        <RowCard
                          key={comment.id}
                          eyebrow={comment.authorName || "Comentario"}
                          title={formatDate(comment.createdAt)}
                          meta={comment.authorEmail || "Sin correo"}
                          body={comment.body}
                          density="compact"
                        />
                      ))
                    ) : (
                      <EmptyState title="Sin comentarios" body="Esta solicitud todavía no tiene comentarios visibles en el hilo." />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

export function TeacherSopsSection({
  sops,
  activeRequests,
  notificationBanner,
  onAcknowledgeNotification,
  onRequestChange,
  loading,
  error,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedSop, setSelectedSop] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const activeRequestBySopId = useMemo(
    () =>
      new Map(
        (activeRequests ?? [])
          .filter((item) => item?.sopId)
          .map((item) => [item.sopId, item])
      ),
    [activeRequests]
  );

  const filteredSops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (sops ?? []).filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.description, item.version, item.category, item.fileName]
          .some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));

      return matchesQuery && matchesCategory(item.category, category);
    });
  }, [category, query, sops]);

  async function handleNotificationDismiss() {
    if (!notificationBanner?.id) {
      return;
    }
    await onAcknowledgeNotification(notificationBanner.id);
  }

  async function handleNotificationAction() {
    await handleNotificationDismiss();
    const targetId = getNotificationTargetId(notificationBanner);
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  async function handleRequestSubmit(event) {
    event.preventDefault();
    if (!selectedSop) {
      return;
    }

    try {
      setSubmitting(true);
      setLocalError("");
      setMessage("");
      await onRequestChange({
        sopId: selectedSop.id,
        comment,
      });
      setComment("");
      setSelectedSop(null);
      setMessage("Tu comentario se agregó correctamente a la solicitud de cambio.");
    } catch (submitError) {
      setLocalError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <NoticeBox message={message} />
      <NoticeBox message={localError || error} tone="error" />

      {notificationBanner ? (
        <section
          aria-live="polite"
          className="rounded-[18px] border border-[#c6d4ec] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#ffffff_100%)] p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d4ec] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">
                <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                Actualizacion de SOP
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[#172033]">{notificationBanner.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#536277]">{notificationBanner.body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af]" onClick={handleNotificationAction} type="button">
                Ir a SOPs
              </button>
              <button className="rounded-xl border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#fbfcfe]" onClick={handleNotificationDismiss} type="button">
                Cerrar aviso
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6" id="teacher-sops">
        <SectionCard
          title="Biblioteca de SOPs"
          description="Consulta procedimientos vigentes, descarga documentos importantes y deja comentarios cuando detectes cambios necesarios."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SmallStat label="SOPs" value={sops.length} help="Documentos operativos disponibles para consulta." tone="accent" />
            <SmallStat label="Solicitudes activas" value={activeRequests.length} help="Hilos abiertos donde todavía se están aplicando ajustes." />
            <SmallStat label="Categorias" value={SOP_CATEGORIES.length} help="Clasificación inicial para encontrar el SOP correcto más rápido." />
          </div>
        </SectionCard>

        <SectionCard title="Documentos disponibles" description="Filtra por categoría o busca por nombre, versión y descripción para llegar al SOP correcto.">
          <SectionToolbar helper={`${filteredSops.length} SOPs visibles con los filtros actuales.`}>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
              <FilterInput onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por titulo, categoria, version o archivo" value={query} />
              <Select onChange={(event) => setCategory(event.target.value)} value={category}>
                <option value="all">Todas las categorias</option>
                {SOP_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          </SectionToolbar>

          {loading ? (
            <p className="text-sm text-[#617085]">Cargando biblioteca de SOPs...</p>
          ) : filteredSops.length ? (
            <div className="grid gap-4">
              {filteredSops.map((sop) => {
                const activeRequest = activeRequestBySopId.get(sop.id);
                return (
                  <RowCard
                    key={sop.id}
                    eyebrow={`${sop.category} · v${sop.version}${activeRequest ? ` · ${activeRequest.status}` : ""}`}
                    title={sop.title}
                    meta={`${sop.fileName} · ${formatFileSize(sop.size)} · Actualizado ${formatDate(sop.updatedAt)}`}
                    body={sop.description}
                  >
                    <a className={downloadLinkClass} href={sop.downloadUrl}>
                      Descargar
                    </a>
                    <SecondaryButton onClick={() => setSelectedSop(sop)} type="button">
                      {activeRequest ? "Comentar cambio" : "Solicitar cambio"}
                    </SecondaryButton>
                  </RowCard>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Sin SOPs visibles" body="Cuando haya procedimientos cargados aparecerán aquí para consulta y descarga segura." />
          )}
        </SectionCard>
      </section>

      {selectedSop ? (
        <ModalShell
          onClose={() => {
            setSelectedSop(null);
            setComment("");
            setSubmitting(false);
          }}
          subtitle="Tu comentario se agregará al hilo activo del SOP si ya existe una solicitud abierta; de lo contrario se abrirá una nueva."
          title={`Solicitar cambio en ${selectedSop.title}`}
        >
          <form className="grid gap-4" onSubmit={handleRequestSubmit}>
            {activeRequestBySopId.get(selectedSop.id) ? (
              <div className="rounded-[18px] border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm leading-relaxed text-[#1d4ed8]">
                Ya existe una solicitud activa para este SOP. Tu comentario se agregará a ese mismo hilo.
              </div>
            ) : null}
            <Textarea onChange={(event) => setComment(event.target.value)} placeholder="Describe con claridad el ajuste necesario en este SOP" value={comment} />
            <div className="flex flex-wrap gap-3">
              <ActionButton disabled={submitting} type="submit">
                {submitting ? "Enviando..." : "Enviar comentario"}
              </ActionButton>
              <SecondaryButton
                onClick={() => {
                  setSelectedSop(null);
                  setComment("");
                  setSubmitting(false);
                }}
                type="button"
              >
                Cancelar
              </SecondaryButton>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
