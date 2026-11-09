import { Lang, Strings } from "./translations";

export const LOCALES: Record<Lang, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ru: "ru-RU",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};

export function difficultyLabel(t: Strings, key: string): string {
  switch (key) {
    case "BEGINNER":
      return t.difficultyBeginner;
    case "INTERMEDIATE":
      return t.difficultyIntermediate;
    case "ADVANCED":
      return t.difficultyAdvanced;
    default:
      return key;
  }
}

export function locationLabel(t: Strings, key: string): string {
  switch (key) {
    case "GYM":
      return t.locGym;
    case "HOME":
      return t.locHome;
    case "OUTDOORS":
      return t.locOutdoors;
    case "ANY":
      return t.locAny;
    default:
      return key;
  }
}

export const DIFFICULTY_KEYS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const LOCATION_KEYS = ["GYM", "HOME", "OUTDOORS", "ANY"] as const;
