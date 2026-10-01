"use client";

/**
 * Tiny synthesized UI sounds (no audio files). Off by default; the choice is kept in
 * localStorage. Browsers only allow audio after a user gesture, which the toggle provides.
 */

type Sound = "hover" | "click" | "open" | "success" | "error";

const KEY = "sfx";
let enabled = false;
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    enabled = localStorage.getItem(KEY) === "on";
  } catch {
    enabled = false;
  }
}

export function sfxEnabled() {
  return enabled;
}

export function subscribeSfx(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSfx(next: boolean) {
  enabled = next;
  try {
    localStorage.setItem(KEY, next ? "on" : "off");
  } catch {
    /* storage blocked: setting lasts for this page view */
  }
  listeners.forEach((listener) => listener());
  if (next) play("open");
}

function tone(freq: number, start: number, duration: number, gain: number, type: OscillatorType = "sine", endFreq?: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + duration);
  amp.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

let lastHover = 0;

export function play(sound: Sound) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    return;
  }
  switch (sound) {
    case "hover": {
      const now = performance.now();
      if (now - lastHover < 60) return; // avoid a buzz when sweeping across many items
      lastHover = now;
      tone(1900, 0, 0.05, 0.025, "sine");
      break;
    }
    case "click":
      tone(880, 0, 0.07, 0.05, "triangle", 1320);
      break;
    case "open":
      tone(523, 0, 0.12, 0.04, "sine");
      tone(784, 0.06, 0.14, 0.04, "sine");
      tone(1046, 0.12, 0.22, 0.035, "sine");
      break;
    case "success":
      tone(784, 0, 0.1, 0.05, "triangle");
      tone(1175, 0.08, 0.22, 0.05, "triangle");
      break;
    case "error":
      tone(220, 0, 0.18, 0.05, "sawtooth", 160);
      break;
  }
}
