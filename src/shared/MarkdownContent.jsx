import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href ?? ""));
}

function MarkdownLink({ href, children, ...props }) {
  const external = isExternalHref(href);

  return (
    <a
      {...props}
      href={href}
      rel={external ? "noreferrer" : props.rel}
      target={external ? "_blank" : props.target}
    >
      {children}
    </a>
  );
}

const markdownComponents = {
  a: MarkdownLink,
};

function normalizeNewlines(text) {
  // Convert lone \n to \n\n for paragraph breaks, but preserve:
  // - Table rows (lines containing |)
  // - Already-double newlines
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = out[out.length - 1];
    const isTableLine = line.includes("|");
    const prevWasTableLine = prev != null && prev !== "" && prev.includes("|");

    if (i === 0) {
      out.push(line);
    } else if (line === "") {
      out.push(line);
    } else if (prev === "") {
      out.push(line);
    } else if (isTableLine && prevWasTableLine) {
      // Table rows stay consecutive — no blank line between them
      out.push(line);
    } else {
      // Regular text: add blank line before this line
      out.push("", line);
    }
  }
  return out.join("\n");
}

export function MarkdownContent({ children, className = "" }) {
  const content = normalizeNewlines(String(children ?? "").trim());

  if (!content) {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
