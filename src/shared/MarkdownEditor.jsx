import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarkdownContent } from "./MarkdownContent";

const TOOLS = [
  { label: "Negrita", syntax: "**", icon: "B", title: "Negrita (Ctrl+B)" },
  { label: "Cursiva", syntax: "_", icon: "I", title: "Cursiva (Ctrl+I)" },
  { label: "Encabezado", syntax: "## ", icon: "H", title: "Encabezado" },
  { label: "Lista", syntax: "- ", icon: "≡", title: "Lista" },
  { label: "Enlace", syntax: "[texto](url)", icon: "🔗", title: "Enlace" },
  { label: "Codigo", syntax: "`", icon: "<>", title: "Codigo" },
  { label: "Cita", syntax: "> ", icon: "❝", title: "Cita" },
];

function insertAtCursor(textarea, wrapper) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  let newText, newCursor;
  if (wrapper === "**" || wrapper === "_" || wrapper === "`") {
    newText = `${wrapper}${selected || "texto"}${wrapper}`;
    newCursor = start + newText.length;
  } else if (wrapper === "[texto](url)") {
    newText = selected ? `[${selected}](url)` : "[texto](url)";
    newCursor = start + newText.length;
  } else {
    newText = `${wrapper}${selected || ""}`;
    newCursor = start + newText.length;
  }

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype, "value"
  ).set;
  nativeInputValueSetter.call(textarea, before + newText + after);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  requestAnimationFrame(() => {
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(newCursor, newCursor);
  });
}

export function MarkdownEditor({ value, onChange, placeholder, className = "", toolbarClassName = "", ...props }) {
  const textareaRef = useRef(null);
  const [preview, setPreview] = useState(false);

  const handleTool = useCallback((tool, e) => {
    e.preventDefault();
    const ta = textareaRef.current;
    if (!ta) return;
    insertAtCursor(ta, tool.syntax);
  }, []);

  return (
    <div className={`grid gap-0 ${className}`}>
      <div className={`flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50 px-2 py-1.5 ${toolbarClassName}`}>
        {TOOLS.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-8 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-white hover:text-slate-900"
                onMouseDown={(e) => handleTool(tool, e)}
                type="button"
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">{tool.title}</TooltipContent>
          </Tooltip>
        ))}

        <span className="mx-1.5 w-px h-5 bg-slate-200" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={preview ? "default" : "ghost"}
              size="icon"
              className={`h-7 w-8 rounded-lg text-[13px] font-bold transition-all ${preview ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}
              onMouseDown={(e) => { e.preventDefault(); setPreview((p) => !p); }}
              type="button"
            >
              {preview ? "✎" : "◉"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px]">{preview ? "Editar" : "Vista previa"}</TooltipContent>
        </Tooltip>
      </div>

      {preview ? (
        <div className="min-h-[120px] rounded-b-xl border border-slate-200 bg-white px-4 py-3">
          {value?.trim() ? (
            <MarkdownContent className="text-sm leading-relaxed text-slate-700">{value}</MarkdownContent>
          ) : (
            <p className="text-sm text-slate-400 italic">Escribe algo para ver la vista previa...</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full min-h-[120px] rounded-b-xl rounded-t-none border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0"
          {...props}
        />
      )}
    </div>
  );
}

export default MarkdownEditor;
