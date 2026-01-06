import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  children: string;
}

/**
 * Custom components for react-markdown
 * Using inline arrow functions to avoid complex generic typing issues
 */
const components: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm font-medium mt-2 mb-1">{children}</h6>
  ),

  // Text formatting
  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,

  // Links
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">
      {children}
    </blockquote>
  ),

  // Code
  code: ({ children, className }) => {
    // Check if this is a code block (has language class) or inline code
    const isCodeBlock = className?.includes('language-');

    if (isCodeBlock) {
      return (
        <code className="block overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
          {children}
        </code>
      );
    }

    // Inline code
    return (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    );
  },

  // Pre (wrapper for code blocks)
  pre: ({ children }) => <div className="my-4">{children}</div>,

  // Horizontal rule
  hr: () => <hr className="my-6 border-border" />,

  // Table
  table: ({ children }) => (
    <table className="w-full border-collapse my-4 text-sm">{children}</table>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-4 py-2 text-left">{children}</td>
  ),
};

/**
 * Markdown renderer component using react-markdown
 * Renders markdown content with GitHub Flavored Markdown support
 */
export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  if (!children) return null;

  return (
    <div className="markdown-content">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}

export default MarkdownRenderer;
