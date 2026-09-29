import { isValidElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { cn, createHeadingIdFactory } from "@/lib/utils";

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

/**
 * Gives h2/h3 stable ids for the table of contents. Runs after sanitize so the ids are
 * not prefixed, and uses the same generator as extractHeadings() so links always match.
 */
function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const nextId = createHeadingIdFactory();
    const visit = (node: HastNode) => {
      if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
        node.properties = { ...node.properties, id: nextId(textOf(node).trim()) };
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

const components: Components = {
  pre({ children }) {
    const child = Array.isArray(children) ? children[0] : children;
    const className = isValidElement<{ className?: string }>(child) ? child.props.className ?? "" : "";
    const language = /language-([\w-]+)/.exec(className)?.[1];
    return <CodeBlock language={language}>{children}</CodeBlock>;
  },
  a({ href, children, ...props }) {
    const external = href?.startsWith("http");
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />;
  },
};

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose prose-blog", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHeadingIds, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
