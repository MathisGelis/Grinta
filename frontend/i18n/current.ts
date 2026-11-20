import { Lang, Strings, translations } from "./translations";

let current: Strings = translations.en;
let currentLang: Lang = "en";

/** Langue courante hors React (services) : envoyée au serveur dans `Accept-Language`. */
export function setCurrentLang(lang: Lang) {
  currentLang = lang;
}

export function getCurrentLang(): Lang {
  return currentLang;
}

export function setCurrentStrings(strings: Strings) {
  current = strings;
}

export function getStrings(): Strings {
  return current;
}
