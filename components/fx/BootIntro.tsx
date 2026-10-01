"use client";

import { useEffect, useState } from "react";
import { Emblem } from "@/components/fx/Emblem";
import { useI18n } from "@/components/providers/I18nProvider";
import { play } from "@/lib/sfx";
import { cn } from "@/lib/utils";

const DURATION = 2000;

/**
 * First-visit "resonance sync" screen. The overlay is server-rendered but hidden by CSS;
 * the head script adds `.boot` to <html> only on the first page view of a session
 * (and never under reduced motion), so returning visitors and crawlers never see it.
 */
export function BootIntro() {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("boot")) return;
    let frame = 0;
    let done = false;
    const start = performance.now();

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      setProgress(100);
      setLeaving(true);
      play("open");
      try {
        sessionStorage.setItem("booted", "1");
      } catch {
        /* ignore */
      }
      window.setTimeout(() => root.classList.remove("boot"), 650);
    };

    const tick = (now: number) => {
      const ratio = Math.min(1, (now - start) / DURATION);
      // ease-out so the bar slows near the end like a real sync
      setProgress(Math.round((1 - Math.pow(1 - ratio, 3)) * 100));
      if (ratio < 1) frame = requestAnimationFrame(tick);
      else window.setTimeout(finish, 250);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, []);

  const lines = t.fx.bootLines;
  const visibleLines = Math.min(lines.length, Math.floor((progress / 100) * lines.length) + 1);

  return (
    <div
      id="boot-overlay"
      role="presentation"
      className={cn(
        "fixed inset-0 z-[300] flex-col items-center justify-center overflow-hidden bg-bg transition-opacity duration-500",
        leaving && "pointer-events-none opacity-0",
      )}
    >
      <div className="aurora absolute inset-0" />
      <div className="grid-fade absolute inset-0 opacity-50" />
      <div className="scanlines absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-primary/[0.06] to-transparent" />

      <Emblem className="relative w-56 sm:w-72" />

      <div className="relative mt-10 w-[min(28rem,82vw)]">
        <div className="flex items-end justify-between font-display uppercase">
          <span className="text-xs font-semibold tracking-[0.35em] text-primary animate-flicker">{t.fx.booting}</span>
          <span className="text-2xl font-bold tabular-nums text-fg">{progress}%</span>
        </div>
        <div className="relative mt-3 h-[3px] bg-line/60">
          <div className="absolute inset-y-0 left-0 bg-primary shadow-glow" style={{ width: `${progress}%` }} />
          <div className="absolute -top-1 h-[11px] w-px bg-fg" style={{ left: `${progress}%` }} />
        </div>
        <ul className="mt-5 space-y-1 font-mono text-[11px] text-muted">
          {lines.slice(0, visibleLines).map((line, index) => (
            <li key={line} className="animate-fade-in">
              <span className="mr-2 text-primary">[{String(index + 1).padStart(2, "0")}]</span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <p className="absolute bottom-8 font-display text-[11px] uppercase tracking-[0.4em] text-subtle animate-pulse">{t.fx.skip}</p>
    </div>
  );
}
