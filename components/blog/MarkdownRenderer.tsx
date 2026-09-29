import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return (
    <article
      className={cn(
        "prose prose-invert max-w-none prose-headings:text-white prose-a:text-cyan-200 prose-strong:text-white prose-code:text-cyan-100 prose-pre:bg-slate-950/90",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
