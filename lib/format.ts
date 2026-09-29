// Formatting helpers with no dictionary imports, so client components can use them
// without bundling every locale's messages.

const intlLocale: Record<string, string> = { vi: "vi-VN", en: "en-US", ja: "ja-JP" };
const resolve = (locale: string) => intlLocale[locale] ?? "vi-VN";

/** Replace `{name}` placeholders in a dictionary string. */
export function fmt(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export function formatDate(date: Date | string | null | undefined, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(resolve(locale), { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export function formatRelative(date: Date | string, locale: string, now = Date.now()) {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(resolve(locale), { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(resolve(locale), { notation: "compact" }).format(value);
}
