"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Keyboard, X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { play } from "@/lib/sfx";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)));
}

/** Global keyboard shortcuts with a "?" help panel. */
export function Shortcuts() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let pendingG = 0;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (isTyping(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        setOpen((value) => !value);
        play("open");
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        const search = document.getElementById("blog-search") as HTMLInputElement | null;
        if (search) search.focus();
        else router.push(`/${locale}/blog?focus=search`);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "g") {
        pendingG = performance.now();
        return;
      }
      if (performance.now() - pendingG < 900) {
        const target = { h: "", b: "/blog", d: "/dashboard" }[key];
        if (target !== undefined) {
          pendingG = 0;
          play("click");
          router.push(`/${locale}${target}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locale, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 hidden h-10 w-10 place-items-center border border-line/80 bg-surface/80 text-muted backdrop-blur transition hover:border-primary hover:text-primary lg:grid"
        aria-label={t.fx.shortcuts}
        title={`${t.fx.shortcuts} (?)`}
      >
        <Keyboard className="h-4 w-4" />
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[95] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={t.fx.shortcuts}>
              <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
              <div className="card relative w-full max-w-md animate-fade-up p-6">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">{t.fx.shortcuts}</p>
                  <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-primary" aria-label={t.common.close}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ul className="mt-5 divide-y divide-line/60">
                  {t.fx.shortcutList.map(([keys, label]) => (
                    <li key={keys} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-muted">{label}</span>
                      <span className="flex gap-1">
                        {keys.split(/\s+/).map((k) => (
                          <kbd key={k} className="min-w-7 border border-line bg-surface-2 px-2 py-0.5 text-center font-mono text-xs text-primary">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
