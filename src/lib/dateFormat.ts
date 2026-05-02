import type { Lang } from "@/lib/i18n";
import { parseLocalDate } from "@/lib/dateOnly";

const localeFor = (lang: Lang) => (lang === "es" ? "es-ES" : "en-US");

const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** "Abril 2026" / "April 2026" */
export const formatMonthYear = (date: Date, lang: Lang) => {
  const s = new Intl.DateTimeFormat(localeFor(lang), {
    month: "long",
    year: "numeric",
  }).format(date);
  // Capitalize first letter (Spanish locale lowercases month names)
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** "30 de abril de 2026" / "April 30, 2026" */
export const formatLongDate = (date: Date, lang: Lang) =>
  new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

export const isSameMonth = (iso: string | Date, ref: Date) => {
  const d = parseLocalDate(iso);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
};

export const formatShortMonthDay = (iso: string | Date, lang: Lang) =>
  parseLocalDate(iso).toLocaleDateString(localeFor(lang), { month: "short", day: "numeric" });

export const formatDayShortMonth = (iso: string | Date, lang: Lang) =>
  parseLocalDate(iso).toLocaleDateString(localeFor(lang), { day: "2-digit", month: "short" });

export const getCalendarDayDistance = (iso: string | Date, ref: Date = new Date()) => {
  const d = startOfLocalDay(parseLocalDate(iso));
  const r = startOfLocalDay(ref);
  return Math.round((r.getTime() - d.getTime()) / 86_400_000);
};

