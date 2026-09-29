import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { slugify } from "@/lib/slug";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  // CJK text has no spaces; count characters instead so Japanese posts get a sane estimate.
  const cjk = (content.match(/[぀-ヿ一-鿿]/g) ?? []).length;
  return Math.max(1, Math.ceil(words / 210 + cjk / 500));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Creates a slug-based id generator that de-duplicates repeats and handles non-Latin text. */
export function createHeadingIdFactory() {
  const seen = new Map<string, number>();
  let index = 0;
  return (text: string) => {
    index += 1;
    const base = slugify(text) || `section-${index}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };
}

/** Extracts h2/h3 headings from Markdown, using the same ids the renderer assigns. */
export function extractHeadings(markdown: string): Heading[] {
  const nextId = createHeadingIdFactory();
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2]
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .trim();
    headings.push({ id: nextId(text), text, level: match[1].length as 2 | 3 });
  }
  return headings;
}

/** Deterministic hue for avatar backgrounds. */
export function hueFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 360;
  return hash;
}
