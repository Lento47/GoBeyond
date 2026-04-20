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
      ? `${workspaceChrome.darkSurface} text-white`
      : accent === "strong"
        ? `${workspaceChrome.strongSurface} text-[#172033]`
        : `${workspaceChrome.surface} text-[#172033]`;
  const divider = accent === "dark" ? "border-white/10" : "border-[#e7edf5]";

  return (
    <section className={`${frame} overflow-hidden ${variant === "flat" ? "shadow-none" : ""} ${padding}`}>
      <div className={`mb-5 border-b ${divider} pb-4`}>
        <p
          className={`text-[10px] font-black uppercase tracking-[0.22em] ${
            accent === "dark" ? "text-[#9fb0c9]" : "text-[#6b7a90]"
          }`}
        >
          {eyebrow}
        </p>
        <h3 className={`mt-2 text-[1.2rem] font-semibold leading-tight sm:text-[1.45rem] ${accent === "dark" ? "text-white" : "text-[#172033]"}`}>
          {title}
        </h3>
        <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${accent === "dark" ? "text-[#c2cfdf]" : "text-[#536277]"}`}>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function Input(props) {
  return (
    <input
      className={`w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] placeholder:text-[#94a3b8] ${focusRing}`}
      {...props}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      className={`min-h-[120px] w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] placeholder:text-[#94a3b8] ${focusRing}`}
      {...props}
    />
  );
}

export function Select(props) {
  return (
    <select
      className={`w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] ${focusRing}`}
      {...props}
    />
  );
}

export function SmallStat({ label, value, help, tone = "default" }) {
  const toneClass = tone === "accent" ? workspaceChrome.strongSurface : workspaceChrome.surface;
  return (
    <div className={`${toneClass} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{label}</p>
        <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
      </div>
      <p className="mt-4 text-[1.85rem] font-semibold leading-none text-[#172033]">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#5d6b80]">{help}</p>
    </div>
  );
}

export function PillButton({ active, children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
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
      className={`rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm font-medium text-[#172033] transition hover:border-[#bbc8d9] hover:bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#bfdbfe] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function FilterInput({ value, onChange, placeholder }) {
  return (
    <input
      className={`w-full rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#172033] placeholder:text-[#94a3b8] ${focusRing}`}
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
        className={`flex w-full flex-col overflow-hidden rounded-[24px] border border-[#d7e0ea] bg-[#f5f7fb] shadow-[0_28px_90px_rgba(15,23,42,0.18)] ${panelSizeClass} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 border-b border-[#d7e0ea] bg-[#f5f7fb]/96 px-5 py-5 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">Editor</p>
              <h3 className="mt-2 text-3xl font-semibold leading-tight text-[#172033]">{title}</h3>
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
    <div className="rounded-[18px] border border-dashed border-[#d7e0ea] bg-[#f7f9fc] p-6 text-[#536277]">
      <p className="font-medium text-[#172033]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export function RowCard({ eyebrow, title, meta, body, children, density = "comfortable" }) {
  return (
    <div className={`min-w-0 rounded-[18px] border border-[#d7e0ea] bg-white ${density === "compact" ? "p-4" : "p-5"} transition hover:border-[#bbc8d9] hover:bg-[#fbfcfe]`}>
      {eyebrow ? <p className="break-words text-[10px] font-black uppercase tracking-[0.22em] text-[#6b7a90]">{eyebrow}</p> : null}
      <h4 className="mt-2 break-words text-lg font-semibold leading-tight text-[#172033] sm:text-xl">{title}</h4>
      {meta ? <p className="mt-2 break-words text-sm leading-relaxed text-[#5d6b80]">{meta}</p> : null}
      {body ? <MarkdownContent className="mt-3 break-words text-sm leading-relaxed text-[#435066]">{body}</MarkdownContent> : null}
      {children ? <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div> : null}
    </div>
  );
}
