"use client";

import { useEffect, useState } from "react";

/** Thin bar under the header showing how far through the article the reader is. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const value = total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total));
      setProgress(value);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div className="fixed inset-x-0 top-16 z-30 h-0.5 bg-transparent" aria-hidden="true">
      <div
        className="h-full origin-left bg-gradient-to-r from-primary via-accent to-halo transition-transform duration-150"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
