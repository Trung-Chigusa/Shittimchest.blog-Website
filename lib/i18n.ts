import vi from "@/messages/vi.json";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";

export const locales = ["vi", "en", "ja"] as const;
export type Locale = (typeof locales)[number];

const dictionaries = { vi, en, ja };

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: string) {
  return dictionaries[isLocale(locale) ? locale : "vi"];
}

export function withLocalePath(locale: string, path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${isLocale(locale) ? locale : "vi"}${cleanPath === "/" ? "" : cleanPath}`;
}
