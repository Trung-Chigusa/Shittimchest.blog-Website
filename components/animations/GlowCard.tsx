"use client";

import { useRef, type HTMLAttributes } from "react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";

export function GlowCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null);

  function pulse() {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(ref.current, {
      translateY: [0, -4, 0],
      boxShadow: [
        "0 0 0 rgba(56,244,255,0)",
        "0 0 34px rgba(56,244,255,.20)",
        "0 0 12px rgba(166,108,255,.12)",
      ],
      duration: 500,
      easing: "out(3)",
    });
  }

  return (
    <div
      ref={ref}
      onMouseEnter={pulse}
      className={cn(
        "rounded-md border border-white/10 bg-white/[0.055] p-5 shadow-violet backdrop-blur transition-colors hover:border-cyan-200/40",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
