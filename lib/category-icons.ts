import { createElement, type CSSProperties } from "react";
import {
  Bug,
  FlaskConical,
  Flag,
  Laptop,
  Network,
  Radar,
  Search,
  Server,
  Shield,
  Terminal,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

// Keys match Category.icon values written by prisma/seed.ts.
const icons: Record<string, LucideIcon> = {
  flag: Flag,
  shield: Shield,
  network: Network,
  server: Server,
  radar: Radar,
  terminal: Terminal,
  search: Search,
  bug: Bug,
  laptop: Laptop,
  flask: FlaskConical,
};

export function CategoryIcon({ icon, className, style }: { icon?: string | null; className?: string; style?: CSSProperties }) {
  const Icon = (icon ? icons[icon] : undefined) ?? BookOpen;
  return createElement(Icon, { className, style, "aria-hidden": true });
}

export type Element = "spectro" | "havoc" | "aero" | "electro" | "fusion" | "glacio";

export const elementColor: Record<Element, string> = {
  spectro: "#f2d27a",
  havoc: "#c264ff",
  aero: "#5ee3b1",
  electro: "#9c8cff",
  fusion: "#ff6a55",
  glacio: "#62c8ff",
};

// Each topic "resonates" with an element; unknown categories get a stable hashed one.
const categoryElements: Record<string, Element> = {
  "ctf-writeups": "spectro",
  "web-security": "fusion",
  "network-security": "electro",
  "system-administration": "aero",
  "blue-team-soc": "glacio",
  "red-team-basics": "fusion",
  forensics: "glacio",
  "malware-analysis-notes": "havoc",
  "linux-windows": "aero",
  "tools-labs": "spectro",
};

const order: Element[] = ["spectro", "havoc", "aero", "electro", "fusion", "glacio"];

export function categoryElement(slug?: string | null): Element {
  if (slug && categoryElements[slug]) return categoryElements[slug];
  let hash = 0;
  for (const char of slug ?? "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return order[hash % order.length];
}

/** Dark backdrop tinted by the category's element, for cover-less posts. */
export function categoryGradient(slug?: string | null) {
  const color = elementColor[categoryElement(slug)];
  return `radial-gradient(80% 90% at 70% 40%, ${color}40, transparent 60%), linear-gradient(135deg, #0c0e15 0%, #121522 55%, ${color}26 100%)`;
}

/** Difficulty → rarity stars (3★ beginner … 5★ advanced). */
export function rarity(difficulty?: string | null) {
  return difficulty === "ADVANCED" ? 5 : difficulty === "INTERMEDIATE" ? 4 : 3;
}
