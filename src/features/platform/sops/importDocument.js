const IMPORTABLE_EXTENSIONS = new Set(["md", "markdown", "txt"]);

const STATUS_BY_LABEL = new Map([
  ["borrador", "draft"],
  ["draft", "draft"],
  ["en revision", "in_review"],
  ["revision", "in_review"],
  ["vigente", "active"],
  ["activo", "active"],
  ["active", "active"],
  ["obsoleto", "obsolete"],
  ["obsolete", "obsolete"],
]);

function getExtension(fileName) {
  const normalized = String(fileName ?? "").trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  return lastDot >= 0 ? normalized.slice(lastDot + 1) : "";
}

function normalizeText(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").trim();
}

function stripMarkdownInline(value) {
  return String(value ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function normalizeLabel(value) {
  return stripMarkdownInline(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function humanizeSlugPart(value) {
  return String(value ?? "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferType(code, fallbackType) {
  const normalized = String(code ?? "").toUpperCase();
  if (normalized.startsWith("POL-")) {
    return "Politica";
  }
  if (normalized.startsWith("WI-")) {
    return "Instructivo";
  }
  if (normalized.startsWith("CHK-")) {
    return "Checklist";
  }
  if (normalized.startsWith("FRM-")) {
    return "Formato / Registro";
  }
  if (normalized.startsWith("SOP-")) {
    return "SOP";
  }
  return fallbackType || "SOP";
}

function inferCodeAndTitleFromFileName(fileName) {
  const baseName = String(fileName ?? "").replace(/\.[^.]+$/, "");
  const withoutIndex = baseName.replace(/^\d+\-/, "");
  const match = withoutIndex.match(/^((?:POL|SOP|WI|CHK|FRM)-[A-Z0-9-]+?-\d{3})(?:-(.+))?$/i);
  if (!match) {
    return { code: "", title: "" };
  }

  return {
    code: match[1].toUpperCase(),
    title: humanizeSlugPart(match[2] ?? ""),
  };
}

function extractSectionBody(source, titlePattern) {
  const escapedPattern = titlePattern.source;
  const matcher = new RegExp(`^##\\s+(${escapedPattern})\\s*\\n([\\s\\S]*?)(?=^##\\s+|$)`, "im");
  const match = source.match(matcher);
  return match ? match[2].trim() : "";
}

function extractObjectiveSummary(source) {
  const objectiveBody = extractSectionBody(source, /objetivo/i);
  if (!objectiveBody) {
    return "";
  }

  const paragraph = objectiveBody
    .split(/\n\s*\n/)
    .map((item) => stripMarkdownInline(item))
    .find(Boolean);

  return paragraph || "";
}

function parseIdentificationSection(source) {
  const body = extractSectionBody(source, /identificacion del documento/i);
  if (!body) {
    return {};
  }

  const fields = {};
  const lines = body.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith("-")) {
      continue;
    }

    const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
    if (!match) {
      continue;
    }

    fields[normalizeLabel(match[1])] = stripMarkdownInline(match[2]);
  }

  return fields;
}

export function canAutofillFromFile(file) {
  return IMPORTABLE_EXTENSIONS.has(getExtension(file?.name));
}

export function getAutofillSupportMessage(file) {
  return `El archivo "${file?.name || "seleccionado"}" quedo adjunto. El autopoblado automatico hoy funciona con .md y .txt.`;
}

export async function extractDraftFromFile(file, fallbackForm = {}) {
  const extension = getExtension(file?.name);
  if (!IMPORTABLE_EXTENSIONS.has(extension)) {
    const error = new Error("El autopoblado automatico hoy funciona con archivos Markdown (.md) o texto (.txt).");
    error.code = "unsupported_import_type";
    throw error;
  }

  const rawText = await file.text();
  const source = normalizeText(rawText);
  if (!source) {
    throw new Error("No se detecto contenido legible en el archivo importado.");
  }

  const headingMatch = source.match(/^#\s+(.+)$/m);
  const heading = stripMarkdownInline(headingMatch?.[1] ?? "");
  const identification = parseIdentificationSection(source);
  const fromFileName = inferCodeAndTitleFromFileName(file.name);

  let code = identification.codigo || fromFileName.code || fallbackForm.code || "";
  let title = fallbackForm.title || "";

  if (heading.includes(" - ")) {
    const [left, ...rest] = heading.split(" - ");
    const maybeCode = left.trim();
    const maybeTitle = rest.join(" - ").trim();
    if (maybeCode && maybeTitle) {
      code = code || maybeCode;
      title = maybeTitle;
    }
  } else if (heading) {
    title = heading;
  }

  if (!title) {
    title = identification.titulo || fromFileName.title || "";
  }

  const statusLabel = identification.estado || fallbackForm.status || "";
  const normalizedStatus = STATUS_BY_LABEL.get(normalizeLabel(statusLabel)) || fallbackForm.status || "draft";
  const summary = extractObjectiveSummary(source);

  const nextFields = {
    code,
    title,
    type: inferType(code, fallbackForm.type),
    version: identification.version || fallbackForm.version || "1.0",
    status: normalizedStatus,
    effectiveDate: identification["fecha de emision"] || fallbackForm.effectiveDate || "",
    areaOwner: identification["area responsable"] || fallbackForm.areaOwner || "",
    preparedBy: identification["elaborado por"] || fallbackForm.preparedBy || "",
    reviewedBy: identification["revisado por"] || fallbackForm.reviewedBy || "",
    approvedBy: identification["aprobado por"] || fallbackForm.approvedBy || "",
    summary: fallbackForm.summary || summary,
    description: fallbackForm.description || summary,
    body: source,
  };

  const importedFieldCount = Object.values(nextFields).filter((value) => String(value ?? "").trim()).length;

  return {
    fields: nextFields,
    message: `Se leyó "${file.name}" y se autopoblaron ${importedFieldCount} campos del documento.`,
  };
}
