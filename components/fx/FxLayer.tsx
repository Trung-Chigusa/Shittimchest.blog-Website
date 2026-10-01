"use client";

import { useEffect, useRef } from "react";
import { play } from "@/lib/sfx";

const INTERACTIVE = "a, button, [role=button], [role=tab], input, select, textarea, summary, label[for], [data-cursor]";

/**
 * Global interaction layer:
 *  - starfield canvas with mouse parallax
 *  - custom cursor ring (fine pointers only)
 *  - click burst
 *  - 3D tilt for [data-tilt] (reveal-on-scroll is pure CSS, see globals.css)
 *  - optional hover/click sounds
 * Everything degrades to nothing under prefers-reduced-motion or on touch devices.
 */
export function FxLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Starfield + cursor + click bursts + tilt + sounds (mounted once)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const cleanups: (() => void)[] = [];

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eased = { x: mouse.x, y: mouse.y };

    // ---- starfield
    if (canvas && context) {
      let width = 0;
      let height = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      type Star = { x: number; y: number; z: number; r: number; tw: number; gold: boolean };
      let stars: Star[] = [];

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round(Math.min(170, (width * height) / 9000));
        stars = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 0.9 + 0.1,
          r: Math.random() * 1.2 + 0.25,
          tw: Math.random() * Math.PI * 2,
          gold: Math.random() < 0.12,
        }));
      };

      let frame = 0;
      let last = performance.now();
      const draw = (now: number) => {
        const dt = Math.min(50, now - last);
        last = now;
        context.clearRect(0, 0, width, height);
        const px = (eased.x / width - 0.5) * 2;
        const py = (eased.y / height - 0.5) * 2;
        for (const star of stars) {
          if (!reduced) {
            star.y -= star.z * dt * 0.006;
            star.tw += dt * 0.002 * star.z;
            if (star.y < -4) {
              star.y = height + 4;
              star.x = Math.random() * width;
            }
          }
          const x = star.x - px * 18 * star.z;
          const y = star.y - py * 12 * star.z;
          const alpha = 0.25 + 0.55 * star.z * (0.6 + 0.4 * Math.sin(star.tw));
          context.beginPath();
          context.fillStyle = star.gold ? `rgba(242,205,120,${alpha})` : `rgba(236,230,214,${alpha * 0.8})`;
          context.arc(x, y, star.r * (star.gold ? 1.4 : 1), 0, Math.PI * 2);
          context.fill();
          if (star.gold && star.z > 0.7) {
            context.fillStyle = `rgba(242,205,120,${alpha * 0.12})`;
            context.beginPath();
            context.arc(x, y, star.r * 6, 0, Math.PI * 2);
            context.fill();
          }
        }
        if (!reduced) frame = requestAnimationFrame(draw);
      };

      resize();
      frame = requestAnimationFrame(draw);
      window.addEventListener("resize", resize);
      const onVisibility = () => {
        cancelAnimationFrame(frame);
        if (!document.hidden) {
          last = performance.now();
          frame = requestAnimationFrame(draw);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVisibility);
      });
    }

    // ---- cursor ring + eased mouse
    let cursorFrame = 0;
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const useCursor = finePointer && !reduced && cursor && dot;
    if (useCursor) document.documentElement.classList.add("fx-cursor");

    const loop = () => {
      eased.x += (mouse.x - eased.x) * 0.18;
      eased.y += (mouse.y - eased.y) * 0.18;
      if (useCursor) {
        cursor.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;
        dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      }
      cursorFrame = requestAnimationFrame(loop);
    };
    if (!reduced) cursorFrame = requestAnimationFrame(loop);

    let hovered: Element | null = null;
    const onMove = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      const target = (event.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
      if (target !== hovered) {
        hovered = target;
        cursor?.classList.toggle("is-hover", Boolean(target));
        if (target && event.pointerType === "mouse") play("hover");
      }
      // tilt
      const tilt = (event.target as Element | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (tilt && !reduced && finePointer) {
        const rect = tilt.getBoundingClientRect();
        const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -7;
        const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 9;
        tilt.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        tilt.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        tilt.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        tilt.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }
    };
    const onLeaveTilt = (event: PointerEvent) => {
      const el = event.target as HTMLElement;
      if (el?.hasAttribute?.("data-tilt")) {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      }
    };
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as Element | null)?.closest?.(INTERACTIVE)) play("click");
      if (reduced) return;
      const burst = document.createElement("span");
      burst.className = "fx-burst";
      burst.style.left = `${event.clientX}px`;
      burst.style.top = `${event.clientY}px`;
      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 650);
      cursor?.classList.add("is-down");
    };
    const onUp = () => cursor?.classList.remove("is-down");
    const onLeaveWindow = () => cursor?.classList.add("is-hidden");
    const onEnterWindow = () => cursor?.classList.remove("is-hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerout", onLeaveTilt, true);
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    document.documentElement.addEventListener("mouseenter", onEnterWindow);
    cleanups.push(() => {
      cancelAnimationFrame(cursorFrame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onLeaveTilt, true);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      document.documentElement.removeEventListener("mouseenter", onEnterWindow);
      document.documentElement.classList.remove("fx-cursor");
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 -z-10 scanlines opacity-60" aria-hidden="true" />
      <div ref={cursorRef} className="fx-cursor-ring" aria-hidden="true">
        <span />
      </div>
      <div ref={dotRef} className="fx-cursor-dot" aria-hidden="true" />
    </>
  );
}
