import { useEffect, useRef } from "react";
import { workspaceChrome } from "../../workspaceTheme";
import { MarkdownContent } from "../../../../shared/MarkdownContent";
import { revealModal } from "../../../../shared/workspaceAnimations";
import { Badge } from "@/components/ui/badge";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const focusRing =
  "outline-none transition-all duration-200 focus-visible:border-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0";

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
      ? "rounded-2xl border border-[#c6d4ec] bg-[#eef4ff] text-[#172033] shadow-sm hover:shadow-md transition-shadow duration-300"
      : accent === "strong"
        ? "rounded-2xl border border-[#c6d4ec] bg-[#f3f7ff] text-[#172033] shadow-sm hover:shadow-md transition-shadow duration-300"
        : "rounded-2xl border border-[#d8e2f0] bg-white text-[#172033] shadow-sm hover:shadow-md hover:border-[#c6d4ec] transition-all duration-300";
  const divider = "border-[#e8eef6]";

  return (
    <section className={`${frame} overflow-hidden ${variant === "flat" ? "shadow-none" : ""} ${padding}`}>
      <div className={`mb-5 border-b ${divider} pb-4`}>
        <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]">{eyebrow}</Badge>
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
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 ${focusRing}`}
      {...props}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      className={`min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 ${focusRing}`}
      {...props}
    />
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      {children}
      {hint ? <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export function Select({ value, onChange, children, placeholder, ...props }) {
  // Parse React <option> children into {value, label} pairs for shadcn Select
  const options = [];
  function collectOptions(nodes) {
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    for (const child of arr) {
      if (!child || typeof child !== "object") continue;
      // Handle .map() results — arrays of elements
      if (Array.isArray(child)) { collectOptions(child); continue; }
      // Handle <option value="x">label</option>
      if (child?.props?.value != null && child?.props?.children != null) {
        options.push({ value: child.props.value, label: child.props.children, disabled: child.props.disabled });
      }
    }
  }
  collectOptions(children);

  const currentOption = options.find((o) => String(o.value) === String(value));
  const displayText = currentOption?.label || placeholder || "Seleccionar...";

  // Always use shadcn Select — no native fallback
  return (
    <ShadSelect value={value} onValueChange={(v) => onChange?.({ target: { value: v, name: props.name } })}>
      <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-slate-900 hover:border-slate-300 transition-all duration-200">
        <SelectValue placeholder={placeholder}>{displayText}</SelectValue>
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled} className="rounded-lg text-sm text-slate-900">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadSelect>
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
    <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] ${s.bg} ${s.text} border-0`}>
      {label}
    </Badge>
  );
}

export function PillButton({ active, children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 active:scale-95 ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-[0_2px_8px_rgba(29,78,216,0.25)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
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
      className={`rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-[0_4px_14px_rgba(29,78,216,0.3)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function FilterInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-300 ${focusRing}`}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </div>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {helper ? <p className="text-[13px] leading-relaxed text-slate-500">{helper}</p> : null}
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
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    revealModal(panelRef.current);
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollbarGutter = "auto";
    const handleEscape = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.scrollbarGutter = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const panelSizeClass =
    size === "full"
      ? "max-h-[calc(100vh-1rem)] max-w-[min(98rem,calc(100vw-1rem))] sm:max-h-[calc(100vh-1.5rem)] sm:max-w-[min(110rem,calc(100vw-2rem))]"
      : size === "wide"
        ? "max-h-[94vh] max-w-7xl"
        : "max-h-[92vh] max-w-5xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/40 px-4 py-6 sm:px-6 sm:py-8 animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={`flex w-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl ${panelSizeClass} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em]">Editor</Badge>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
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
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
        <svg className="size-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}

export function RowCard({ eyebrow, title, meta, body, children, density = "comfortable" }) {
  if (density === "compact") {
    return (
      <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 last:border-b-0 transition-all duration-200 hover:bg-slate-50 active:bg-slate-100">
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
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm active:bg-slate-50">
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
