import { createElement } from "react";
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

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon ? icons[icon] : undefined) ?? BookOpen;
  return createElement(Icon, { className, "aria-hidden": true });
}

/** Deterministic gradient per category so cover-less cards still look distinct. */
const palettes = [
  ["#1270e8", "#38d6ff"],
  ["#7c3aed", "#ec4899"],
  ["#0ea5e9", "#22c55e"],
  ["#f97316", "#ec4899"],
  ["#0891b2", "#6366f1"],
  ["#db2777", "#f59e0b"],
];

export function categoryGradient(slug?: string | null) {
  let hash = 0;
  for (const char of slug ?? "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const [from, to] = palettes[hash % palettes.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
