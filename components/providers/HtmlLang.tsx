"use client";

import { useEffect } from "react";

/** Keeps <html lang> in sync on client-side locale switches (the root layout doesn't re-render). */
export function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
