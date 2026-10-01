"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { play } from "@/lib/sfx";

export function CodeBlock({ language, children }: { language?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      play("success");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (e.g. insecure context) */
    }
  }

  return (
    <div className="card not-prose my-7 overflow-hidden bg-[#0b0c12]">
      <div className="flex items-center justify-between border-b border-line/70 bg-fg/[0.03] px-4 py-2">
        <span className="flex items-center gap-2 font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
          <span className="h-1.5 w-1.5 rotate-45 bg-primary" />
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-primary"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={ref} className="overflow-x-auto p-4 font-mono text-[0.85rem] leading-relaxed text-[#e2e0d8]">
        {children}
      </pre>
    </div>
  );
}
