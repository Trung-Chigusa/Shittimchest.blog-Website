"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ language, children }: { language?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (e.g. insecure context) */
    }
  }

  return (
    <div className="not-prose group/code my-6 overflow-hidden rounded-xl border border-white/10 bg-[#0b101e] shadow-card">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">{language || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={ref} className="overflow-x-auto p-4 font-mono text-[0.85rem] leading-relaxed text-slate-200">
        {children}
      </pre>
    </div>
  );
}
