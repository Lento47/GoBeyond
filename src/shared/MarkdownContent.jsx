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
  // Preserve existing double newlines, convert lone \n to \n\n so single
  // line breaks in admin textarea input become paragraph breaks in markdown.
  return text.replace(/(?<!\n)\n(?!\n)/g, "\n\n");
}

export function MarkdownContent({ children, className = "" }) {
  const content = normalizeNewlines(String(children ?? "").trim());

  if (!content) {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
