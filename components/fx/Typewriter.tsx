"use client";

import { useEffect, useState } from "react";

/** Types, holds, deletes and cycles through words — a terminal-style ticker. */
export function Typewriter({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words.length) return;
    const word = words[index % words.length];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => {
        setText(word);
        setIndex((value) => value + 1);
      }, 2200);
      return () => window.clearTimeout(id);
    }
    const done = !deleting && text === word;
    const empty = deleting && text === "";
    const delay = done ? 1600 : empty ? 250 : deleting ? 35 : 70;
    const id = window.setTimeout(() => {
      if (done) setDeleting(true);
      else if (empty) {
        setDeleting(false);
        setIndex((value) => value + 1);
      } else setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
    }, delay);
    return () => window.clearTimeout(id);
  }, [words, index, text, deleting]);

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.15em] animate-pulse bg-primary" aria-hidden="true" />
    </span>
  );
}
