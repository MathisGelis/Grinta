import { Lang } from "@/i18n/translations";
import { LOCALES } from "@/i18n/labels";

const STYLES = {
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  weekday: { weekday: "short", day: "numeric", month: "short" },
  month: { month: "long", year: "numeric" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof STYLES;

/** Format de date unique de l'app, localisé selon la langue choisie. */
export function formatDate(value: string | number | Date, lang: Lang, style: DateStyle = "short"): string {
  return new Intl.DateTimeFormat(LOCALES[lang], STYLES[style]).format(new Date(value));
}
