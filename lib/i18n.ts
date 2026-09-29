import vi from "@/messages/vi.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";
import { isLocale, type Locale } from "@/lib/locales";

export { isLocale, locales, type Locale } from "@/lib/locales";

export type Dictionary = typeof vi;

// `satisfies` keeps all three dictionaries in lockstep: a missing key is a type error.
const dictionaries: Record<Locale, Dictionary> = {
  vi,
  en: en satisfies Dictionary,
  ja: ja satisfies Dictionary,
};

export function getDictionary(locale: string): Dictionary {
  return dictionaries[isLocale(locale) ? locale : "vi"];
}

export function withLocalePath(locale: string, path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${isLocale(locale) ? locale : "vi"}${cleanPath === "/" ? "" : cleanPath}`;
}

export { fmt, formatDate, formatNumber, formatRelative } from "@/lib/format";
