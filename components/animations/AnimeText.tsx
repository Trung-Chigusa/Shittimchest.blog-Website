"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate, stagger } from "animejs";
import { cn } from "@/lib/utils";

export function AnimeText({
  text = "Wanna Denia Team",
  className,
  as: Tag = "span",
}: {
  text?: string;
  className?: string;
  as?: "h1" | "h2" | "span" | "p";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const letters = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = ref.current.querySelectorAll("[data-char]");
    const animation = animate(chars, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.94, 1],
      textShadow: ["0 0 0 rgba(56,244,255,0)", "0 0 22px rgba(56,244,255,.55)"],
      delay: stagger(36),
      duration: 700,
      easing: "out(3)",
    });
    return () => {
      animation.cancel();
    };
  }, [text]);

  return (
    <Tag
      ref={ref as never}
      className={cn("inline-flex flex-wrap justify-center whitespace-pre-wrap text-balance", className)}
      aria-label={text}
    >
      {letters.map((letter, index) => (
        <span key={`${letter}-${index}`} data-char className="inline-block opacity-0">
          {letter === " " ? "\u00a0" : letter}
        </span>
      ))}
    </Tag>
  );
}
