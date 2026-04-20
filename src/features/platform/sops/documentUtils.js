export const SOP_CATEGORIES = ["Academico", "Operaciones", "Calidad", "Soporte", "Institucional"];
export const SOP_TYPES = ["Politica", "SOP", "Instructivo", "Checklist", "Formato / Registro"];

export const SOP_STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "in_review", label: "En revision" },
  { value: "active", label: "Vigente" },
  { value: "obsolete", label: "Obsoleto" },
];

export const SOP_VISIBILITY_OPTIONS = [
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Oculto" },
];

export const downloadLinkClass =
  "inline-flex items-center justify-center rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm font-medium text-[#172033] transition hover:border-[#bbc8d9] hover:bg-[#f7f9fc]";

export const emptyDocumentBody = [
  "## Objetivo",
  "Describe el proposito principal del documento.",
  "",
  "## Alcance",
  "Define a quien aplica, en que contexto y bajo que condiciones.",
  "",
  "## Responsables",
  "- Responsable principal",
  "- Revisor",
  "- Aprobador",
  "",
  "## Desarrollo",
  "Documenta aqui el contenido operativo o normativo.",
  "",
  "## Control de cambios",
  "| Version | Fecha | Descripcion del cambio |",
  "|---|---|---|",
  "| 1.0 | [Fecha] | Emision inicial |",
].join("\n");

export const initialSopForm = {
  id: "",
  code: "",
  title: "",
  type: "SOP",
  category: SOP_CATEGORIES[0],
  description: "",
  summary: "",
  version: "1.0",
  status: "draft",
  visibility: "visible",
  effectiveDate: "",
  areaOwner: "",
  preparedBy: "",
  reviewedBy: "",
  approvedBy: "",
  body: emptyDocumentBody,
  fileName: "",
  fileKey: "",
  contentType: "",
  size: 0,
  uploadedAt: "",
  uploadedBy: "",
  file: null,
};

export const initialRequestForm = {
  id: "",
  status: "open",
  adminResolutionNote: "",
};

export function formatDate(value) {
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

export function formatFileSize(value) {
  const size = Number(value ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return "Sin adjunto";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function matchesCategory(itemCategory, selectedCategory) {
  return selectedCategory === "all" || itemCategory === selectedCategory;
}

export function matchesType(itemType, selectedType) {
  return selectedType === "all" || itemType === selectedType;
}

export function matchesVisibility(itemVisibility, selectedVisibility) {
  return selectedVisibility === "all" || itemVisibility === selectedVisibility;
}

export function buildSopDownloadUrl(sopId) {
  return `/api/secure/sop-file?id=${encodeURIComponent(sopId)}`;
}

export function getStatusLabel(status) {
  return SOP_STATUS_OPTIONS.find((item) => item.value === status)?.label || status || "Borrador";
}

export function getVisibilityLabel(visibility) {
  return SOP_VISIBILITY_OPTIONS.find((item) => item.value === visibility)?.label || visibility || "Visible";
}

export function buildDocumentHeading(sop) {
  if (sop.code && sop.title) {
    return `${sop.code} - ${sop.title}`;
  }
  return sop.title || sop.code || "Documento sin titulo";
}

export function normalizeSopItem(sop) {
  if (!sop || typeof sop !== "object") {
    return null;
  }

  return {
    ...sop,
    type: sop.type || "SOP",
    status: sop.status || "draft",
    visibility: sop.visibility || "visible",
    body: sop.body || emptyDocumentBody,
    summary: sop.summary || "",
    effectiveDate: sop.effectiveDate || "",
    areaOwner: sop.areaOwner || "",
    preparedBy: sop.preparedBy || "",
    reviewedBy: sop.reviewedBy || "",
    approvedBy: sop.approvedBy || "",
    downloadUrl: sop.downloadUrl || (sop.fileKey ? buildSopDownloadUrl(sop.id) : ""),
  };
}

export function normalizeChangeRequestItem(changeRequest, sopLookup) {
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
    sopCode: sop?.code || "",
    sopType: sop?.type || "SOP",
    downloadUrl: changeRequest.downloadUrl || (sop?.fileKey ? buildSopDownloadUrl(sop.id) : ""),
  };
}

export function createTemplateContent(form) {
  const code = form.code || `${form.type === "Politica" ? "POL" : form.type === "Checklist" ? "CHK" : form.type === "Formato / Registro" ? "FRM" : form.type === "Instructivo" ? "WI" : "SOP"}-GB-AREA-001`;
  const title = form.title || "Titulo del documento";
  const effectiveDate = form.effectiveDate || "[Fecha de emision]";
  const areaOwner = form.areaOwner || "[Area responsable]";
  const preparedBy = form.preparedBy || "[Nombre del responsable]";
  const reviewedBy = form.reviewedBy || "[Nombre del revisor]";
  const approvedBy = form.approvedBy || "[Nombre del aprobador]";
  const statusLabel = getStatusLabel(form.status);

  const sectionTitle =
    form.type === "Politica"
      ? "Politicas y lineamientos"
      : form.type === "Checklist"
        ? "Checklist operativo"
        : form.type === "Formato / Registro"
          ? "Campos del registro"
          : form.type === "Instructivo"
            ? "Instrucciones"
            : "Procedimiento";

  return [
    `# ${code} - ${title}`,
    "",
    "## Identificacion del documento",
    `- Codigo: \`${code}\``,
    `- Version: \`${form.version || "1.0"}\``,
    `- Estado: \`${statusLabel}\``,
    `- Fecha de emision: \`${effectiveDate}\``,
    `- Area responsable: \`${areaOwner}\``,
    `- Elaborado por: \`${preparedBy}\``,
    `- Revisado por: \`${reviewedBy}\``,
    `- Aprobado por: \`${approvedBy}\``,
    "",
    "## Objetivo",
    "Describe el objetivo del documento en lenguaje claro y accionable.",
    "",
    "## Alcance",
    "Indica a que procesos, equipos, sedes o roles aplica este documento.",
    "",
    "## Responsables",
    "- Responsable del proceso",
    "- Revisor documental",
    "- Autoridad aprobadora",
    "",
    `## ${sectionTitle}`,
    "1. Paso o lineamiento principal.",
    "2. Paso o lineamiento secundario.",
    "3. Control o criterio de validacion.",
    "",
    "## Registros / evidencias",
    "- Evidencia 1",
    "- Evidencia 2",
    "",
    "## Control de cambios",
    "| Version | Fecha | Descripcion del cambio |",
    "|---|---|---|",
    `| ${form.version || "1.0"} | ${effectiveDate} | Emision inicial |`,
  ].join("\n");
}

export function extractDocumentSections(body) {
  const source = String(body ?? "").trim();
  if (!source) {
    return [];
  }

  const lines = source.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (current) {
        sections.push(current);
      }
      current = { id: slugify(match[1]), title: match[1].trim(), content: line };
      continue;
    }

    if (!current) {
      current = { id: "documento", title: "Documento", content: line };
    } else {
      current.content = `${current.content}\n${line}`;
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections;
}

export function getNotificationTargetId(notification) {
  const ctaPath = String(notification?.ctaPath ?? "");
  const hashIndex = ctaPath.indexOf("#");
  return hashIndex === -1 ? "" : ctaPath.slice(hashIndex + 1).trim();
}
