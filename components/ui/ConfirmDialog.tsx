"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Options = {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "danger" | "primary";
  /** When set, the dialog shows a text box and resolves with its value. */
  inputLabel?: string;
};

type Pending = Options & { resolve: (value: string | null) => void };

/**
 * Promise-based confirm/prompt dialog.
 *   const [dialog, ask] = useConfirm();
 *   if ((await ask({...})) !== null) { ... }
 */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const ask = useCallback((options: Options) => new Promise<string | null>((resolve) => setPending({ ...options, resolve })), []);
  const close = (value: string | null) => {
    pending?.resolve(value);
    setPending(null);
  };
  return [pending ? <Dialog key="dialog" {...pending} onClose={close} /> : null, ask] as const;
}

function Dialog({ title, body, confirmLabel, cancelLabel, tone = "danger", inputLabel, onClose }: Options & { onClose: (value: string | null) => void }) {
  const [value, setValue] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    (inputLabel ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCloseRef.current(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [inputLabel]);

  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={() => onClose(null)} />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-line bg-surface p-6 shadow-lift">
        <div className="flex gap-4">
          <span
            className={
              tone === "danger"
                ? "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger"
                : "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
            }
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="dialog-title" className="text-lg font-bold">
              {title}
            </h2>
            {body ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p> : null}
            {inputLabel ? (
              <label className="mt-4 block">
                <span className="field-label">{inputLabel}</span>
                <Textarea ref={inputRef} value={value} maxLength={300} onChange={(event) => setValue(event.target.value)} className="min-h-20" />
              </label>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onClose(null)}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={tone === "danger" ? "danger" : "primary"}
            className={tone === "danger" ? "bg-danger text-white hover:bg-danger/90" : undefined}
            onClick={() => onClose(value)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
