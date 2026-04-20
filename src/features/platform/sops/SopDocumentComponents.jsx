import { useEffect, useMemo, useState } from "react";
import { MarkdownContent } from "../../../shared/MarkdownContent";
import {
  ActionButton,
  EmptyState,
  FilterInput,
  RowCard,
  ScrollArea,
  SecondaryButton,
  SectionCard,
  SectionToolbar,
  Select,
  SmallStat,
  Textarea,
} from "../components/admin/AdminUI";
import {
  SOP_CATEGORIES,
  SOP_TYPES,
  buildDocumentHeading,
  downloadLinkClass,
  extractDocumentSections,
  formatFileSize,
  getStatusLabel,
  getVisibilityLabel,
} from "./documentUtils";

export function NoticeBox({ message, tone = "info" }) {
  if (!message) {
    return null;
  }

  const toneClass =
    tone === "error"
      ? "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]"
      : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";

  return <div className={`rounded-[18px] border px-4 py-3 text-sm leading-relaxed ${toneClass}`}>{message}</div>;
}

export function DocumentMetaList({ sop }) {
  const items = [
    ["Codigo", sop.code],
    ["Tipo", sop.type],
    ["Version", sop.version],
    ["Estado", getStatusLabel(sop.status)],
    ["Visibilidad", getVisibilityLabel(sop.visibility)],
    ["Fecha de emision", sop.effectiveDate],
    ["Area responsable", sop.areaOwner],
    ["Elaborado por", sop.preparedBy],
    ["Revisado por", sop.reviewedBy],
    ["Aprobado por", sop.approvedBy],
    ["Adjunto", sop.fileName ? `${sop.fileName} · ${formatFileSize(sop.size)}` : ""],
  ].filter(([, value]) => String(value ?? "").trim());

  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-[1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{label}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#172033]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function DocumentSection({ section, collapsed, onToggle }) {
  return (
    <article className="overflow-hidden rounded-[1.2rem] border border-[#dbe3ec] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]" id={section.id}>
      <button
        className="flex w-full items-center justify-between gap-4 border-b border-[#e7edf5] px-5 py-4 text-left"
        onClick={() => onToggle(section.id)}
        type="button"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Seccion</p>
          <h3 className="mt-1 text-lg font-semibold text-[#172033]">{section.title}</h3>
        </div>
        <span className="rounded-full border border-[#d7e0ea] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#536277]">
          {collapsed ? "Expandir" : "Contraer"}
        </span>
      </button>
      {!collapsed ? (
        <div className="px-5 py-5">
          <MarkdownContent className="text-sm leading-7 text-[#324154]">{section.content}</MarkdownContent>
        </div>
      ) : null}
    </article>
  );
}

export function DocumentViewer({ sop, actionSlot, secondarySlot, emptyBody }) {
  const sections = useMemo(() => extractDocumentSections(sop?.body), [sop?.body]);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    setCollapsedSections({});
  }, [sop?.id]);

  if (!sop) {
    return <EmptyState title="Selecciona un documento" body={emptyBody} />;
  }

  function toggleSection(sectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function setAllSections(collapsed) {
    const nextState = {};
    sections.forEach((section) => {
      nextState[section.id] = collapsed;
    });
    setCollapsedSections(nextState);
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title={buildDocumentHeading(sop)}
        description="Vista documental web con lectura tipo wiki interna, tabla de contenido y secciones expandibles."
      >
        <div className="grid gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#536277]">
                {sop.type}
              </span>
              <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#536277]">
                {getStatusLabel(sop.status)}
              </span>
              <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#536277]">
                v{sop.version}
              </span>
              <span className="rounded-full border border-[#d7e0ea] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#536277]">
                {getVisibilityLabel(sop.visibility)}
              </span>
            </div>
            {actionSlot ? <div className="flex flex-wrap gap-3">{actionSlot}</div> : null}
          </div>

          {sop.description ? (
            <MarkdownContent className="text-sm leading-7 text-[#435066]">{sop.description}</MarkdownContent>
          ) : null}

          {sop.summary ? (
            <div className="rounded-[1.1rem] border border-[#dbe3ec] bg-[#f8fafc] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Resumen ejecutivo</p>
              <MarkdownContent className="mt-3 text-sm leading-7 text-[#324154]">{sop.summary}</MarkdownContent>
            </div>
          ) : null}

          <DocumentMetaList sop={sop} />
          {secondarySlot ? secondarySlot : null}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <SectionCard title="Mapa del documento" description="Navega entre secciones como en una wiki y controla su expansion.">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <SecondaryButton className="px-3 py-2 text-xs" onClick={() => setAllSections(false)} type="button">
                Expandir todo
              </SecondaryButton>
              <SecondaryButton className="px-3 py-2 text-xs" onClick={() => setAllSections(true)} type="button">
                Contraer todo
              </SecondaryButton>
            </div>

            {sections.length ? (
              <nav className="grid gap-2">
                {sections.map((section) => (
                  <a
                    className="rounded-[0.9rem] border border-[#dbe3ec] bg-white px-3 py-3 text-sm text-[#435066] transition hover:border-[#bbc8d9] hover:bg-[#fbfcfe]"
                    href={`#${section.id}`}
                    key={section.id}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            ) : (
              <EmptyState title="Sin secciones detectadas" body="Agrega encabezados `##` para que la vista pueda navegar y plegar el contenido." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Documento" description="El contenido principal se renderiza dentro de la web con formato Markdown y bloques expandibles.">
          {sections.length ? (
            <div className="grid gap-4">
              {sections.map((section) => (
                <DocumentSection
                  collapsed={Boolean(collapsedSections[section.id])}
                  key={section.id}
                  onToggle={toggleSection}
                  section={section}
                />
              ))}
            </div>
          ) : (
            <MarkdownContent className="text-sm leading-7 text-[#324154]">{sop.body}</MarkdownContent>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function SopLibraryPanel({
  items,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  category,
  onCategoryChange,
  type,
  onTypeChange,
  visibility = "all",
  onVisibilityChange,
  helper,
  action,
}) {
  return (
    <SectionCard title="Biblioteca documental" description="Busca, filtra y abre los documentos operativos desde un mismo lugar.">
      <SectionToolbar action={action} helper={helper}>
        <div className="grid gap-3">
          <FilterInput onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar por codigo, titulo, resumen, version o contenido" value={query} />
          <div className="grid gap-3 md:grid-cols-2">
            <Select onChange={(event) => onCategoryChange(event.target.value)} value={category}>
              <option value="all">Todas las categorias</option>
              {SOP_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select onChange={(event) => onTypeChange(event.target.value)} value={type}>
              <option value="all">Todos los tipos</option>
              {SOP_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          {onVisibilityChange ? (
            <Select onChange={(event) => onVisibilityChange(event.target.value)} value={visibility}>
              <option value="all">Visible y oculto</option>
              <option value="visible">Solo visibles</option>
              <option value="hidden">Solo ocultos</option>
            </Select>
          ) : null}
        </div>
      </SectionToolbar>

      {items.length ? (
        <ScrollArea className="max-h-[42rem]">
          <div className="grid gap-3">
            {items.map((item) => (
              <button
                className={`rounded-[1rem] border p-4 text-left transition ${
                  selectedId === item.id
                    ? "border-[#1d4ed8] bg-[#eff6ff]"
                    : "border-[#dbe3ec] bg-white hover:border-[#bbc8d9] hover:bg-[#fbfcfe]"
                }`}
                key={item.id}
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6b7a90]">{item.type}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6b7a90]">{getStatusLabel(item.status)}</span>
                  {item.visibility === "hidden" ? (
                    <span className="rounded-full border border-[#d7e0ea] px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#6b7a90]">
                      Oculto
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-base font-semibold leading-tight text-[#172033]">{item.title}</h3>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#536277]">
                  {item.code || "Sin codigo"} · v{item.version}
                </p>
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-[#617085]">
                    {String(item.description).slice(0, 180)}
                    {String(item.description).length > 180 ? "..." : ""}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <EmptyState title="Sin documentos" body="Ajusta los filtros o crea el primer documento desde este mismo modulo." />
      )}
    </SectionCard>
  );
}

export function RelatedRequestsPanel({ requests, onManage, emptyBody }) {
  return (
    <SectionCard title="Solicitudes relacionadas" description="El flujo de comentarios y cambios convive junto al documento seleccionado.">
      {requests.length ? (
        <div className="grid gap-4">
          {requests.map((request) => (
            <RowCard
              body={request.lastComment?.body || "Sin comentarios registrados."}
              eyebrow={`${request.sopType || "SOP"} · ${request.status}`}
              key={request.id}
              meta={`${request.requesterName || "Sin remitente"} · ${request.commentCount} comentarios`}
              title={request.sopTitle}
            >
              {request.downloadUrl ? (
                <a className={downloadLinkClass} href={request.downloadUrl}>
                  Descargar adjunto
                </a>
              ) : null}
              {onManage ? (
                <SecondaryButton onClick={() => onManage(request)} type="button">
                  Gestionar solicitud
                </SecondaryButton>
              ) : null}
            </RowCard>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin solicitudes activas" body={emptyBody} />
      )}
    </SectionCard>
  );
}

export function buildFormPreview(form, normalizeSopItem) {
  return normalizeSopItem({
    id: form.id || "preview",
    code: form.code,
    title: form.title,
    type: form.type,
    category: form.category,
    description: form.description,
    summary: form.summary,
    version: form.version,
    status: form.status,
    visibility: form.visibility,
    effectiveDate: form.effectiveDate,
    areaOwner: form.areaOwner,
    preparedBy: form.preparedBy,
    reviewedBy: form.reviewedBy,
    approvedBy: form.approvedBy,
    body: form.body,
    fileName: form.fileName,
    size: form.size,
    uploadedAt: form.uploadedAt,
    fileKey: form.fileKey,
  });
}

export function DocumentSummaryStats({ items, activeRequests, showHidden = false }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <SmallStat label="Documentos" value={items.length} help="Activos dentro de la biblioteca documental." tone="accent" />
      <SmallStat label="Vigentes" value={items.filter((item) => item.status === "active").length} help="Marcados como version oficial." />
      <SmallStat label={showHidden ? "Ocultos" : "Tipos"} value={showHidden ? items.filter((item) => item.visibility === "hidden").length : SOP_TYPES.length} help={showHidden ? "Archivados sin eliminarse." : "Politicas, SOPs e instructivos soportados."} />
      <SmallStat label="Solicitudes" value={activeRequests.length} help="Hilos de cambio ligados a los documentos." />
    </div>
  );
}

export function RequestComposer({ hasActiveRequest, comment, onCommentChange, onCancel, onSubmit, submitting }) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {hasActiveRequest ? (
        <div className="rounded-[18px] border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm leading-relaxed text-[#1d4ed8]">
          Ya existe una solicitud activa para este documento. Tu comentario se agregara a ese mismo hilo.
        </div>
      ) : null}
      <Textarea onChange={(event) => onCommentChange(event.target.value)} placeholder="Describe con claridad el ajuste necesario en este documento" value={comment} />
      <div className="flex flex-wrap gap-3">
        <ActionButton disabled={submitting} type="submit">
          {submitting ? "Enviando..." : "Enviar comentario"}
        </ActionButton>
        <SecondaryButton onClick={onCancel} type="button">
          Cancelar
        </SecondaryButton>
      </div>
    </form>
  );
}
