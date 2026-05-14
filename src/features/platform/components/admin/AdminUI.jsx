import { workspaceChrome } from "../../workspaceTheme";
import { MarkdownContent } from "../../../../shared/MarkdownContent";

const focusRing =
  "outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#bfdbfe]";

export function SectionCard({
  title,
  description,
  eyebrow = "Workspace",
  children,
  accent = "soft",
  variant = "default",
  density = "comfortable",
}) {
  const padding = density === "compact" ? "p-4 sm:p-5" : "p-5 sm:p-6";
  const frame =
    accent === "dark"
      ? "rounded-2xl border border-[#c6d4ec] bg-[#eef4ff] text-[#172033] shadow-sm"
      : accent === "strong"
        ? "rounded-2xl border border-[#c6d4ec] bg-[#f3f7ff] text-[#172033] shadow-sm"
        : "rounded-2xl border border-[#d8e2f0] bg-white text-[#172033] shadow-sm";
  const divider = "border-[#e8eef6]";

  return (
    <section className={`${frame} overflow-hidden ${variant === "flat" ? "shadow-none" : ""} ${padding}`}>
      <div className={`mb-5 border-b ${divider} pb-4`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">{eyebrow}</p>
        <h3 className="mt-2 text-[1.05rem] font-semibold leading-tight text-[#172033] sm:text-[1.3rem]">{title}</h3>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#536277]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Input(props) {
  return (
    <input
      className={`w-full rounded-xl border border-[#d8e2f0] bg-white px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#94a3b8] ${focusRing}`}
      {...props}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      className={`min-h-[120px] w-full rounded-xl border border-[#d8e2f0] bg-white px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#94a3b8] ${focusRing}`}
      {...props}
    />
  );
}

export function Select(props) {
  return (
    <select
      className={`w-full rounded-xl border border-[#d8e2f0] bg-white px-3.5 py-2.5 text-sm text-[#172033] ${focusRing}`}
      {...props}
    />
  );
}

export function SmallStat({ label, value, help, tone = "default", variant = "default" }) {
  if (variant === "band") {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">{label}</p>
        <p className="text-[1.35rem] font-black leading-none text-[#172033]">{value ?? "—"}</p>
        {help ? <p className="mt-0.5 text-[10px] leading-snug text-[#8899b0]">{help}</p> : null}
      </div>
    );
  }
  const toneClass =
    tone === "accent"
      ? "rounded-xl border border-[#c6d4ec] bg-[#f3f7ff]"
      : "rounded-xl border border-[#d8e2f0] bg-white";
  return (
    <div className={`${toneClass} px-3.5 py-3 shadow-none`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">{label}</p>
        <span className="h-1.5 w-1.5 rounded-full bg-[#1d4ed8]" />
      </div>
      <p className="mt-2 text-[1.45rem] font-semibold leading-none text-[#172033]">{value}</p>
      {help ? <p className="mt-1.5 text-xs leading-relaxed text-[#66758c]">{help}</p> : null}
    </div>
  );
}

export function CompactBand({ children }) {
  return (
    <div className="flex divide-x divide-[#d8e2f0] overflow-hidden rounded-[18px] border border-[#d8e2f0] bg-white">
      {children}
    </div>
  );
}

const statusPillMap = {
  pending:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700" },
  active:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
  draft:    { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600" },
  urgent:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700" },
  ready:    { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-700" },
  review:   { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
  progress: { bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700" },
};

export function StatusPill({ status = "draft", label }) {
  const s = statusPillMap[status] ?? statusPillMap.draft;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${s.bg} ${s.border} ${s.text}`}>
      {label}
    </span>
  );
}

export function PillButton({ active, children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
        active
          ? "border-[#1d4ed8] bg-[#1d4ed8] text-white"
          : "border-[#d7e0ea] bg-white text-[#536277] hover:border-[#bbc8d9] hover:bg-[#f7f9fc]"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ActionButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border border-[#d8e2f0] bg-white px-4 py-2.5 text-sm font-medium text-[#172033] transition hover:border-[#bbc8d9] hover:bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function FilterInput({ value, onChange, placeholder }) {
  return (
    <input
      className={`w-full rounded-xl border border-[#d8e2f0] bg-white px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#94a3b8] ${focusRing}`}
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  );
}

export function ScrollArea({ children, className = "" }) {
  return <div className={`max-h-[32rem] overflow-y-auto pr-1 sm:pr-2 ${className}`}>{children}</div>;
}

export function MediaLibraryStrip({ items, onSelect, emptyLabel = "Aun no hay archivos disponibles." }) {
  if (!items.length) {
    return <p className="text-sm text-[#66758c]">{emptyLabel}</p>;
  }

  return (
    <div className="grid max-h-44 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className={`${workspaceChrome.surface} overflow-hidden`}>
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-0">
            {item.contentType?.startsWith("image/") ? (
              <div className="h-[4.5rem] w-[4.5rem] bg-[#f7f9fc]">
                <img alt={item.fileName} className="h-full w-full object-cover" src={item.url} />
              </div>
            ) : (
              <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center bg-[#f7f9fc] text-[10px] uppercase tracking-[0.2em] text-[#6b7a90]">
                File
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7a90]">{item.purpose}</p>
              <p className="mt-1 truncate text-sm font-medium text-[#172033]">{item.fileName}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#5d6b80]">{Math.round(Number(item.size ?? 0) / 1024)} KB</p>
                <SecondaryButton className="px-3 py-1.5 text-xs" onClick={() => onSelect(item)} type="button">
                  Usar
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionToolbar({ action, children, helper }) {
  return (
    <div className="mb-5 grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {helper ? <p className="text-sm leading-relaxed text-[#536277]">{helper}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div>{children}</div> : null}
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  size = "default",
  bodyClassName = "",
  panelClassName = "",
}) {
  const panelSizeClass =
    size === "full"
      ? "max-h-[calc(100vh-1rem)] max-w-[min(98rem,calc(100vw-1rem))] sm:max-h-[calc(100vh-1.5rem)] sm:max-w-[min(110rem,calc(100vw-2rem))]"
      : size === "wide"
        ? "max-h-[94vh] max-w-7xl"
        : "max-h-[92vh] max-w-5xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#0f172a]/28 px-2 py-2 backdrop-blur-[8px] sm:px-4 sm:py-4"
      onClick={onClose}
      role="presentation"
    >
      <div
      className={`flex w-full flex-col overflow-hidden rounded-[22px] border border-[#d8e2f0] bg-[#f8fbff] shadow-[0_24px_70px_rgba(15,23,42,0.16)] ${panelSizeClass} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 border-b border-[#d8e2f0] bg-[#f8fbff]/96 px-5 py-5 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a90]">Editor</p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#172033] sm:text-3xl">{title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#536277]">{subtitle}</p>
            </div>
            <SecondaryButton onClick={onClose} type="button">
              Cerrar
            </SecondaryButton>
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8e2f0] bg-[#f8fbff] p-6 text-[#536277]">
      <p className="font-medium text-[#172033]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export function RowCard({ eyebrow, title, meta, body, children, density = "comfortable" }) {
  if (density === "compact") {
    return (
      <div className="flex min-w-0 items-center gap-3 border-b border-[#edf1f7] bg-white px-3 py-3 last:border-b-0 transition hover:bg-[#f7f9fc]">
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8899b0]">{eyebrow}</p> : null}
          <p className={`${eyebrow ? "mt-0.5" : ""} truncate text-sm font-semibold leading-tight text-[#172033]`}>{title}</p>
          {meta ? <p className="mt-0.5 truncate text-xs leading-relaxed text-[#66758c]">{meta}</p> : null}
          {body ? <MarkdownContent className="mt-1 text-xs leading-relaxed text-[#435066]">{body}</MarkdownContent> : null}
        </div>
        {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
      </div>
    );
  }
  return (
    <div className="min-w-0 rounded-2xl border border-[#d8e2f0] bg-white p-4 transition hover:border-[#bbc8d9] hover:bg-[#fbfdff]">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="break-words text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7a90]">{eyebrow}</p> : null}
          <h4 className={`${eyebrow ? "mt-1.5" : ""} break-words text-base font-semibold leading-tight text-[#172033] sm:text-lg`}>{title}</h4>
          {meta ? <p className="mt-1.5 break-words text-sm leading-relaxed text-[#66758c]">{meta}</p> : null}
          {body ? <MarkdownContent className="mt-2 break-words text-sm leading-relaxed text-[#435066]">{body}</MarkdownContent> : null}
        </div>
        {children ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">{children}</div> : null}
      </div>
    </div>
  );
}
