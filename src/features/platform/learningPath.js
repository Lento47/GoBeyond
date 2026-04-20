const roadmapThemeMap = {
  blue: {
    badge: "border-[#c6d4ec] bg-[#eef4ff] text-[#1d4ed8]",
    dot: "bg-[#1d4ed8]",
    card: "border-[#c6d4ec] bg-[linear-gradient(180deg,#ffffff_0%,#eef4ff_100%)]",
    line: "from-[#bfdbfe] to-[#dbeafe]",
  },
  gold: {
    badge: "border-[#f2d7ba] bg-[#fff8f1] text-[#b66e2a]",
    dot: "bg-[#d6a46e]",
    card: "border-[#f2d7ba] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)]",
    line: "from-[#f7d7b7] to-[#fde7cf]",
  },
  green: {
    badge: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
    dot: "bg-[#15803d]",
    card: "border-[#bbf7d0] bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)]",
    line: "from-[#86efac] to-[#dcfce7]",
  },
};

function normalizeRoadmapTheme(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return roadmapThemeMap[normalized] ? normalized : "blue";
}

export function normalizeLearningPathItem(item, index = 0) {
  const title = String(item?.title ?? "").trim();
  const track = String(item?.track ?? item?.type ?? "Ruta academica").trim();
  const stageLabel = String(item?.stageLabel ?? item?.phase ?? `Etapa ${index + 1}`).trim();
  const description = String(item?.description ?? item?.status ?? "").trim();
  const duration = String(item?.duration ?? "").trim();
  const outcome = String(item?.outcome ?? "").trim();
  const status = String(item?.progressState ?? item?.state ?? "Disponible").trim();
  const theme = normalizeRoadmapTheme(item?.theme);
  const order = Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1;

  return {
    ...item,
    id: item?.id || `learning-${index + 1}`,
    title,
    track,
    stageLabel,
    description,
    duration,
    outcome,
    progressState: status,
    theme,
    order,
    type: track,
    status: description,
  };
}

export function normalizeLearningPath(items = []) {
  return [...items]
    .map((item, index) => normalizeLearningPathItem(item, index))
    .sort((left, right) => left.order - right.order);
}

export function getLearningPathThemeClasses(value) {
  return roadmapThemeMap[normalizeRoadmapTheme(value)];
}
