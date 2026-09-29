"use client";

import { useEffect, useState } from "react";
import { cn, type Heading } from "@/lib/utils";

export function TableOfContents({ headings, title }: { headings: Heading[]; title: string }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav aria-label={title}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">{title}</p>
      <ul className="mt-4 space-y-1 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l-2 border-transparent py-1 pr-2 text-sm leading-snug text-muted transition hover:text-fg",
                heading.level === 3 ? "pl-7" : "pl-4",
                active === heading.id && "border-primary font-medium text-primary hover:text-primary",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
