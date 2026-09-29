import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 12 */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push("…");
    result.push(page);
  });
  return result;
}

export function Pagination({
  page,
  pageCount,
  params,
  labels,
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | undefined>;
  labels: { previous: string; next: string };
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    if (target > 1) query.set("page", String(target));
    const text = query.toString();
    return text ? `?${text}` : "?";
  };

  const edge = "inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium transition";

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(edge, "text-muted hover:bg-surface-2 hover:text-fg")} rel="prev">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{labels.previous}</span>
        </Link>
      ) : null}
      {pageWindow(page, pageCount).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-subtle">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "grid h-10 min-w-10 place-items-center rounded-xl px-2 text-sm font-semibold transition",
              item === page ? "bg-primary text-primary-fg shadow-sm" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(edge, "text-muted hover:bg-surface-2 hover:text-fg")} rel="next">
          <span className="hidden sm:inline">{labels.next}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
