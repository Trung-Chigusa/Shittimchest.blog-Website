"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>("system");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    // Sync with the value the inline head script already applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readTheme() === "system" && applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    setOpen(false);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked: theme still applies for this page view */
    }
    applyTheme(next);
  }

  const options: [Theme, string, typeof Sun][] = [
    ["light", t.nav.themeLight, Sun],
    ["dark", t.nav.themeDark, Moon],
    ["system", t.nav.themeSystem, Monitor],
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
        aria-label={t.nav.theme}
        aria-expanded={open}
      >
        <Sun className="h-[18px] w-[18px] dark:hidden" />
        <Moon className="hidden h-[18px] w-[18px] dark:block" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-44 animate-fade-in rounded-xl border border-line bg-surface p-1.5 shadow-lift">
          {options.map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg",
                theme === value && "text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{label}</span>
              {theme === value ? <Check className="h-4 w-4 text-primary" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
