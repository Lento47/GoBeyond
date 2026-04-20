export function SectionCard({ title, description, children, accent = "soft" }) {
  return (
    <section
      className={`overflow-hidden border p-6 shadow-[0_22px_48px_rgba(32,24,31,0.05)] ${
        accent === "dark"
          ? "border-[#2f2630] bg-[#20181f] text-white"
          : "border-[#d8cdbf] bg-white/90"
      }`}
    >
      <div className="mb-5">
        <h3 className="font-['Georgia'] text-2xl">{title}</h3>
        <p className={`mt-2 text-sm ${accent === "dark" ? "text-[#d8cdc5]" : "text-[#6d5a51]"}`}>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function Input(props) {
  return <input className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" {...props} />;
}

export function Textarea(props) {
  return (
    <textarea
      className="min-h-[120px] w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]"
      {...props}
    />
  );
}

export function Select(props) {
  return <select className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]" {...props} />;
}

export function SmallStat({ label, value, help }) {
  return (
    <div className="border border-[#eadfce] bg-[#fbf8f2] p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{label}</p>
      <p className="mt-3 font-['Georgia'] text-3xl text-[#20181f]">{value}</p>
      <p className="mt-2 text-sm text-[#6d5a51]">{help}</p>
    </div>
  );
}

export function PillButton({ active, children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 text-sm transition ${
        active ? "bg-[#20181f] text-white" : "border border-[#d8cdbf] bg-white text-[#5c4d46]"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ActionButton({ children, ...props }) {
  return (
    <button className="bg-[#20181f] px-4 py-3 text-sm text-white transition hover:bg-[#342935]" {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`border border-[#d8cdbf] px-4 py-3 text-sm text-[#20181f] transition hover:bg-[#fbf8f2] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function FilterInput({ value, onChange, placeholder }) {
  return (
    <input
      className="w-full border border-[#d8cdbf] bg-white px-4 py-3 text-sm text-[#20181f]"
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  );
}

export function ScrollArea({ children, className = "" }) {
  return <div className={`max-h-[32rem] overflow-y-auto pr-2 ${className}`}>{children}</div>;
}

export function MediaLibraryStrip({ items, onSelect, emptyLabel = "Aun no hay archivos disponibles." }) {
  if (!items.length) {
    return <p className="text-sm text-[#6d5a51]">{emptyLabel}</p>;
  }

  return (
    <div className="grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden border border-[#eadfce] bg-[#fbf8f2]">
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-0">
            {item.contentType?.startsWith("image/") ? (
              <div className="h-[4.5rem] w-[4.5rem] bg-[#edf1f4]">
                <img alt={item.fileName} className="h-full w-full object-cover" src={item.url} />
              </div>
            ) : (
              <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center bg-[#efe4d6] text-[10px] uppercase tracking-[0.2em] text-[#8b6d55]">
                File
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-[10px] uppercase tracking-[0.2em] text-[#8b6d55]">{item.purpose}</p>
              <p className="mt-1 truncate text-sm font-medium text-[#20181f]">{item.fileName}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#6d5a51]">{Math.round(Number(item.size ?? 0) / 1024)} KB</p>
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
          {helper ? <p className="text-sm text-[#6d5a51]">{helper}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div>{children}</div> : null}
    </div>
  );
}

export function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#20181f]/60 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto border border-[#d8cdbf] bg-[#f7f1e7] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="sticky top-0 z-10 border-b border-[#d8cdbf] bg-[#f7f1e7] px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">Editor</p>
              <h3 className="mt-2 font-['Georgia'] text-3xl text-[#20181f]">{title}</h3>
              <p className="mt-2 max-w-2xl text-sm text-[#6d5a51]">{subtitle}</p>
            </div>
            <SecondaryButton onClick={onClose} type="button">
              Cerrar
            </SecondaryButton>
          </div>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="border border-dashed border-[#cbb8a4] bg-[#fbf8f2] p-6 text-[#5c4d46]">
      <p className="font-medium text-[#20181f]">{title}</p>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  );
}

export function RowCard({ eyebrow, title, meta, body, children }) {
  return (
    <div className="border border-[#eadfce] bg-[#fbf8f2] p-5">
      {eyebrow ? <p className="text-xs uppercase tracking-[0.25em] text-[#8b6d55]">{eyebrow}</p> : null}
      <h4 className="mt-2 text-xl font-medium text-[#20181f]">{title}</h4>
      {meta ? <p className="mt-2 text-sm text-[#6d5a51]">{meta}</p> : null}
      {body ? <p className="mt-3 text-sm text-[#5c4d46]">{body}</p> : null}
      {children ? <div className="mt-4 flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}
