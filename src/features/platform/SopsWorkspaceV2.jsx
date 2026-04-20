import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ActionButton, Input, ModalShell, SecondaryButton, SectionCard, Select, Textarea } from "./components/admin/AdminUI";
import {
  DocumentSummaryStats,
  DocumentViewer,
  NoticeBox,
  RelatedRequestsPanel,
  RequestComposer,
  SopLibraryPanel,
  buildFormPreview,
} from "./sops/SopDocumentComponents";
import {
  SOP_CATEGORIES,
  SOP_STATUS_OPTIONS,
  SOP_TYPES,
  SOP_VISIBILITY_OPTIONS,
  createTemplateContent,
  downloadLinkClass,
  emptyDocumentBody,
  formatDate,
  getNotificationTargetId,
  initialRequestForm,
  initialSopForm,
  matchesCategory,
  matchesType,
  matchesVisibility,
  normalizeChangeRequestItem,
  normalizeSopItem,
} from "./sops/documentUtils";
import { canAutofillFromFile, extractDraftFromFile, getAutofillSupportMessage } from "./sops/importDocument";

function buildFilteredSops(items, query, category, type, visibility = "all") {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesQuery =
      !normalizedQuery ||
      [item.title, item.code, item.description, item.summary, item.version, item.category, item.type, item.body]
        .some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));

    return matchesQuery && matchesCategory(item.category, category) && matchesType(item.type, type) && matchesVisibility(item.visibility, visibility);
  });
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
  const [type, setType] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [modal, setModal] = useState("");
  const [selectedSopId, setSelectedSopId] = useState("");
  const [sopForm, setSopForm] = useState(initialSopForm);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [importingFile, setImportingFile] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const normalizedSops = useMemo(() => (sops ?? []).map(normalizeSopItem).filter(Boolean), [sops]);
  const normalizedChangeRequests = useMemo(() => {
    const sopLookup = new Map(normalizedSops.map((sop) => [sop.id, sop]));
    return (changeRequests ?? []).map((item) => normalizeChangeRequestItem(item, sopLookup)).filter(Boolean);
  }, [changeRequests, normalizedSops]);
  const activeRequests = useMemo(() => normalizedChangeRequests.filter((item) => item.status !== "completed"), [normalizedChangeRequests]);
  const filteredSops = useMemo(
    () => buildFilteredSops(normalizedSops, deferredQuery, category, type, visibility),
    [category, deferredQuery, normalizedSops, type, visibility]
  );
  const selectedSop = useMemo(
    () => filteredSops.find((item) => item.id === selectedSopId) ?? filteredSops[0] ?? null,
    [filteredSops, selectedSopId]
  );
  const selectedRequests = useMemo(
    () => activeRequests.filter((item) => item.sopId === selectedSop?.id),
    [activeRequests, selectedSop?.id]
  );
  const currentRequest = activeRequests.find((item) => item.id === requestForm.id) ?? null;
  const previewSop = buildFormPreview(sopForm, normalizeSopItem);

  useEffect(() => {
    if (!selectedSop && selectedSopId) {
      setSelectedSopId("");
    } else if (!selectedSopId && filteredSops[0]?.id) {
      setSelectedSopId(filteredSops[0].id);
    }
  }, [filteredSops, selectedSop, selectedSopId]);

  useEffect(() => {
    if (!managedRequestId) {
      return;
    }

    const targetRequest = activeRequests.find((item) => item.id === managedRequestId);
    if (!targetRequest) {
      onManagedRequestHandled?.();
      return;
    }

    setSelectedSopId(targetRequest.sopId || "");
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

  function resetImportFeedback() {
    setImportMessage("");
    setImportError("");
    setImportingFile(false);
  }

  function startCreateSop() {
    setSopForm({ ...initialSopForm, body: emptyDocumentBody });
    setMessage("");
    setError("");
    resetImportFeedback();
    setModal("sop");
  }

  function startEditSop(sop) {
    setSopForm({
      ...initialSopForm,
      ...sop,
      file: null,
      size: Number(sop.size ?? 0),
      body: sop.body ?? emptyDocumentBody,
    });
    setMessage("");
    setError("");
    resetImportFeedback();
    setModal("sop");
  }

  function startManageRequest(changeRequest) {
    setSelectedSopId(changeRequest.sopId || "");
    setRequestForm({
      id: changeRequest.id,
      status: changeRequest.status ?? "open",
      adminResolutionNote: changeRequest.adminResolutionNote ?? "",
    });
    setMessage("");
    setError("");
    setModal("request");
  }

  function shouldConfirmImportedOverwrite(currentForm) {
    const hasIdentity = Boolean(String(currentForm.title ?? "").trim() || String(currentForm.code ?? "").trim());
    const hasStructuredNotes = Boolean(String(currentForm.description ?? "").trim() || String(currentForm.summary ?? "").trim());
    const body = String(currentForm.body ?? "").trim();
    const hasBody = body && body !== emptyDocumentBody.trim();
    return hasIdentity || hasStructuredNotes || hasBody;
  }

  async function handleSopFileSelection(file) {
    setSopForm((current) => ({
      ...current,
      file: file ?? null,
    }));
    setImportMessage("");
    setImportError("");

    if (!file) {
      return;
    }

    if (!canAutofillFromFile(file)) {
      setImportMessage(getAutofillSupportMessage(file));
      return;
    }

    if (
      shouldConfirmImportedOverwrite(sopForm) &&
      !globalThis.confirm("Se detecto contenido importable y eso puede reemplazar campos del formulario actual. ¿Deseas autopoblar el documento desde este archivo?")
    ) {
      setImportMessage(`"${file.name}" se adjunto sin modificar el contenido actual.`);
      return;
    }

    try {
      setImportingFile(true);
      const imported = await extractDraftFromFile(file, sopForm);
      setSopForm((current) => ({
        ...current,
        ...imported.fields,
        file,
      }));
      setImportMessage(imported.message);
    } catch (importFailure) {
      setImportError(importFailure.message);
    } finally {
      setImportingFile(false);
    }
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

      const payload = {
        code: sopForm.code,
        title: sopForm.title,
        type: sopForm.type,
        category: sopForm.category,
        description: sopForm.description,
        summary: sopForm.summary,
        version: sopForm.version,
        status: sopForm.status,
        visibility: sopForm.visibility,
        effectiveDate: sopForm.effectiveDate,
        areaOwner: sopForm.areaOwner,
        preparedBy: sopForm.preparedBy,
        reviewedBy: sopForm.reviewedBy,
        approvedBy: sopForm.approvedBy,
        body: sopForm.body,
        ...nextFile,
      };

      if (sopForm.id) {
        await onUpdateSop(sopForm.id, payload);
        setMessage("Documento actualizado dentro de la biblioteca web.");
        setSelectedSopId(sopForm.id);
      } else {
        const created = await onCreateSop(payload);
        setMessage("Documento creado dentro de la biblioteca web.");
        setSelectedSopId(created?.sop?.id || "");
      }

      closeModal();
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  async function handleDeleteSop(sop) {
    if (!globalThis.confirm(`Eliminar "${sop.title}" limpiara tambien sus solicitudes relacionadas. ¿Deseas continuar?`)) {
      return;
    }

    try {
      setError("");
      setMessage("");
      await onDeleteSop(sop.id);
      setMessage("Documento eliminado.");
      setSelectedSopId("");
      closeModal();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function handleVisibilityToggle(sop) {
    try {
      setError("");
      setMessage("");
      await onUpdateSop(sop.id, {
        ...sop,
        visibility: sop.visibility === "hidden" ? "visible" : "hidden",
      });
      setMessage(sop.visibility === "hidden" ? "Documento publicado de nuevo en la biblioteca." : "Documento oculto de la vista operativa.");
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

  return (
    <div className="grid gap-6">
      <NoticeBox message={message} />
      <NoticeBox message={error} tone="error" />

      <SectionCard title="Hub documental SOP" description="La seccion de SOP funciona como biblioteca web interna: escribir, editar, ocultar y eliminar documentos desde la misma plataforma.">
        <DocumentSummaryStats activeRequests={activeRequests} items={normalizedSops} showHidden />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <SopLibraryPanel
          action={<ActionButton onClick={startCreateSop} type="button">Nuevo documento</ActionButton>}
          category={category}
          helper={`${filteredSops.length} documentos visibles con los filtros actuales.`}
          items={filteredSops}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
          onSelect={setSelectedSopId}
          onTypeChange={setType}
          onVisibilityChange={setVisibility}
          query={query}
          selectedId={selectedSop?.id ?? ""}
          type={type}
          visibility={visibility}
        />

        <div className="grid gap-6">
          <DocumentViewer
            actionSlot={selectedSop ? <>
              <ActionButton onClick={() => startEditSop(selectedSop)} type="button">Editar</ActionButton>
              <SecondaryButton onClick={() => handleVisibilityToggle(selectedSop)} type="button">{selectedSop.visibility === "hidden" ? "Mostrar" : "Ocultar"}</SecondaryButton>
              {selectedSop.downloadUrl ? <a className={downloadLinkClass} href={selectedSop.downloadUrl}>Descargar adjunto</a> : null}
              <SecondaryButton onClick={() => handleDeleteSop(selectedSop)} type="button">Eliminar</SecondaryButton>
            </> : null}
            emptyBody="Selecciona un documento de la izquierda para leerlo o crea uno nuevo desde la biblioteca."
            sop={selectedSop}
          />

          <RelatedRequestsPanel
            emptyBody="Cuando docentes o revisores pidan cambios sobre este documento, apareceran aqui sin salir del mismo modulo."
            onManage={startManageRequest}
            requests={selectedRequests}
          />
        </div>
      </div>

      {modal === "sop" ? (
        <ModalShell
          bodyClassName="p-0 sm:p-0"
          onClose={closeModal}
          size="full"
          subtitle="Escribe y administra el documento completo desde la web. El adjunto es opcional; el contenido principal vive dentro de la plataforma."
          title={sopForm.id ? "Editar documento" : "Nuevo documento"}
        >
          <form className="grid min-h-[calc(100vh-10.5rem)] gap-0 xl:grid-cols-[minmax(24rem,38rem)_minmax(0,1fr)]" onSubmit={handleSopSubmit}>
            <div className="grid content-start gap-4 border-b border-[#dbe3ec] bg-white p-5 sm:p-6 xl:max-h-[calc(100vh-10.5rem)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
              <NoticeBox message={importMessage} />
              <NoticeBox message={importError} tone="error" />
              <div className="grid gap-4 md:grid-cols-2">
                <Input onChange={(event) => setSopForm((current) => ({ ...current, code: event.target.value }))} placeholder="POL-GB-AREA-001" value={sopForm.code} />
                <Select onChange={(event) => setSopForm((current) => ({ ...current, type: event.target.value }))} value={sopForm.type}>
                  {SOP_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <Input onChange={(event) => setSopForm((current) => ({ ...current, title: event.target.value }))} placeholder="Titulo del documento" value={sopForm.title} />
              <div className="grid gap-4 md:grid-cols-2">
                <Select onChange={(event) => setSopForm((current) => ({ ...current, category: event.target.value }))} value={sopForm.category}>
                  {SOP_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Input onChange={(event) => setSopForm((current) => ({ ...current, version: event.target.value }))} placeholder="1.0" value={sopForm.version} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Select onChange={(event) => setSopForm((current) => ({ ...current, status: event.target.value }))} value={sopForm.status}>
                  {SOP_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
                <Select onChange={(event) => setSopForm((current) => ({ ...current, visibility: event.target.value }))} value={sopForm.visibility}>
                  {SOP_VISIBILITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
              </div>
              <Input onChange={(event) => setSopForm((current) => ({ ...current, effectiveDate: event.target.value }))} placeholder="05 de abril de 2026" value={sopForm.effectiveDate} />
              <Input onChange={(event) => setSopForm((current) => ({ ...current, areaOwner: event.target.value }))} placeholder="Area responsable" value={sopForm.areaOwner} />
              <div className="grid gap-4 md:grid-cols-3">
                <Input onChange={(event) => setSopForm((current) => ({ ...current, preparedBy: event.target.value }))} placeholder="Elaborado por" value={sopForm.preparedBy} />
                <Input onChange={(event) => setSopForm((current) => ({ ...current, reviewedBy: event.target.value }))} placeholder="Revisado por" value={sopForm.reviewedBy} />
                <Input onChange={(event) => setSopForm((current) => ({ ...current, approvedBy: event.target.value }))} placeholder="Aprobado por" value={sopForm.approvedBy} />
              </div>
              <Textarea className="min-h-[9rem]" onChange={(event) => setSopForm((current) => ({ ...current, description: event.target.value }))} placeholder="Resumen corto para la biblioteca y tarjetas del documento" value={sopForm.description} />
              <Textarea className="min-h-[10rem]" onChange={(event) => setSopForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Resumen ejecutivo opcional para la cabecera del documento" value={sopForm.summary} />
              <div className="grid gap-3 rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Cuerpo del documento</p>
                    <p className="mt-2 text-sm leading-6 text-[#536277]">Usa Markdown con tablas y encabezados `##` para activar la navegacion y el plegado por secciones.</p>
                  </div>
                  <SecondaryButton onClick={() => {
                    if (sopForm.body.trim() && !globalThis.confirm("Esto reemplazara el contenido actual por la plantilla oficial. ¿Deseas continuar?")) return;
                    setSopForm((current) => ({ ...current, body: createTemplateContent(current) }));
                  }} type="button">
                    Usar plantilla
                  </SecondaryButton>
                </div>
                <Textarea className="min-h-[34rem] font-mono leading-6" onChange={(event) => setSopForm((current) => ({ ...current, body: event.target.value }))} placeholder="Escribe aqui el documento completo en Markdown" value={sopForm.body} />
              </div>
              <div className="grid gap-3 rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Adjunto opcional</p>
                <p className="text-sm leading-6 text-[#536277]">Si subes un archivo `.md` o `.txt`, el editor intentara autopoblar los placeholders y el cuerpo del documento antes de guardar.</p>
                <Input accept=".md,.markdown,.txt,.pdf,.docx,.xlsx,.pptx,.csv" onChange={(event) => handleSopFileSelection(event.target.files?.[0] ?? null)} type="file" />
                {importingFile ? <p className="text-sm leading-6 text-[#1d4ed8]">Leyendo archivo e interpretando secciones del documento...</p> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionButton disabled={submitting} type="submit">{submitting ? "Guardando..." : sopForm.id ? "Guardar cambios" : "Crear documento"}</ActionButton>
                {sopForm.id ? <SecondaryButton disabled={submitting} onClick={() => handleDeleteSop(selectedSop ?? previewSop)} type="button">Eliminar</SecondaryButton> : null}
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </div>
            <div className="grid content-start gap-4 bg-[#eef3f9] p-5 sm:p-6 xl:max-h-[calc(100vh-10.5rem)] xl:overflow-y-auto">
              <div className="rounded-[18px] border border-[#dbe3ec] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Vista previa</p>
                <p className="mt-2 text-sm leading-6 text-[#536277]">La derecha funciona como una lectura web del documento para que puedas validar estructura, jerarquia y tablas antes de guardar.</p>
              </div>
              <DocumentViewer emptyBody="La vista previa del documento aparecera aqui a medida que completes los campos." sop={previewSop} />
            </div>
          </form>
        </ModalShell>
      ) : null}

      {modal === "request" && currentRequest ? (
        <ModalShell onClose={closeModal} subtitle="Gestiona el ciclo de revision del documento sin salir de la biblioteca documental." title="Gestionar solicitud de cambio">
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <form className="grid gap-4" onSubmit={handleRequestSubmit}>
              <Select onChange={(event) => setRequestForm((current) => ({ ...current, status: event.target.value }))} value={requestForm.status}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
              </Select>
              <Textarea onChange={(event) => setRequestForm((current) => ({ ...current, adminResolutionNote: event.target.value }))} placeholder="Nota de resolucion obligatoria al completar" value={requestForm.adminResolutionNote} />
              <div className="flex flex-wrap gap-3">
                <ActionButton disabled={submitting} type="submit">{submitting ? "Guardando..." : "Guardar solicitud"}</ActionButton>
                <SecondaryButton onClick={closeModal} type="button">Cancelar</SecondaryButton>
              </div>
            </form>
            <RelatedRequestsPanel emptyBody="Sin comentarios adicionales." requests={[currentRequest]} />
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
  const [type, setType] = useState("all");
  const [selectedSopId, setSelectedSopId] = useState("");
  const [requestTarget, setRequestTarget] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedSops = useMemo(() => (sops ?? []).map(normalizeSopItem).filter(Boolean), [sops]);
  const activeRequestBySopId = useMemo(() => new Map((activeRequests ?? []).filter((item) => item?.sopId).map((item) => [item.sopId, item])), [activeRequests]);
  const filteredSops = useMemo(() => buildFilteredSops(normalizedSops, deferredQuery, category, type), [category, deferredQuery, normalizedSops, type]);
  const selectedSop = useMemo(() => filteredSops.find((item) => item.id === selectedSopId) ?? filteredSops[0] ?? null, [filteredSops, selectedSopId]);

  useEffect(() => {
    if (!selectedSop && selectedSopId) {
      setSelectedSopId("");
    } else if (!selectedSopId && filteredSops[0]?.id) {
      setSelectedSopId(filteredSops[0].id);
    }
  }, [filteredSops, selectedSop, selectedSopId]);

  async function handleNotificationDismiss() {
    if (!notificationBanner?.id) return;
    await onAcknowledgeNotification(notificationBanner.id);
  }

  async function handleNotificationAction() {
    await handleNotificationDismiss();
    const targetId = getNotificationTargetId(notificationBanner);
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleRequestSubmit(event) {
    event.preventDefault();
    if (!requestTarget) return;

    try {
      setSubmitting(true);
      setLocalError("");
      setMessage("");
      await onRequestChange({ sopId: requestTarget.id, comment });
      setComment("");
      setRequestTarget(null);
      setMessage("Tu comentario se agrego correctamente a la solicitud de cambio.");
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
        <section aria-live="polite" className="rounded-[18px] border border-[#c6d4ec] bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_55%,#ffffff_100%)] p-5">
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
              <button className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af]" onClick={handleNotificationAction} type="button">Ir a SOPs</button>
              <button className="rounded-xl border border-[#d7e0ea] bg-white px-5 py-3 text-sm font-medium text-[#172033] transition hover:bg-[#fbfcfe]" onClick={handleNotificationDismiss} type="button">Cerrar aviso</button>
            </div>
          </div>
        </section>
      ) : null}

      <SectionCard title="Biblioteca de SOPs" description="Consulta los documentos desde una vista tipo wiki, con lectura clara, navegacion por secciones y comentarios de cambio.">
        <DocumentSummaryStats activeRequests={activeRequests} items={normalizedSops} />
      </SectionCard>

      <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]" id="teacher-sops">
        <SopLibraryPanel
          category={category}
          helper={loading ? "Cargando biblioteca de SOPs..." : `${filteredSops.length} documentos visibles con los filtros actuales.`}
          items={filteredSops}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
          onSelect={setSelectedSopId}
          onTypeChange={setType}
          query={query}
          selectedId={selectedSop?.id ?? ""}
          type={type}
        />

        <DocumentViewer
          actionSlot={selectedSop ? <>
            {selectedSop.downloadUrl ? <a className={downloadLinkClass} href={selectedSop.downloadUrl}>Descargar adjunto</a> : null}
            <ActionButton onClick={() => setRequestTarget(selectedSop)} type="button">{activeRequestBySopId.get(selectedSop.id) ? "Comentar cambio" : "Solicitar cambio"}</ActionButton>
          </> : null}
          emptyBody="Selecciona un documento para abrirlo en la vista wiki interna."
          secondarySlot={selectedSop && activeRequestBySopId.get(selectedSop.id) ? (
            <div className="rounded-[1.1rem] border border-[#dbeafe] bg-[#eff6ff] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1d4ed8]">Solicitud activa</p>
              <p className="mt-2 text-sm leading-6 text-[#1d4ed8]">Ya existe una solicitud de cambio en curso para este documento. Puedes agregar mas contexto desde el mismo flujo.</p>
            </div>
          ) : null}
          sop={selectedSop}
        />
      </section>

      {requestTarget ? (
        <ModalShell onClose={() => { setRequestTarget(null); setComment(""); setSubmitting(false); }} subtitle="Tu comentario se agregara al hilo activo del documento si ya existe una solicitud abierta; de lo contrario se abrira una nueva." title={`Solicitar cambio en ${requestTarget.title}`}>
          <RequestComposer
            comment={comment}
            hasActiveRequest={Boolean(activeRequestBySopId.get(requestTarget.id))}
            onCancel={() => { setRequestTarget(null); setComment(""); setSubmitting(false); }}
            onCommentChange={setComment}
            onSubmit={handleRequestSubmit}
            submitting={submitting}
          />
        </ModalShell>
      ) : null}
    </div>
  );
}
