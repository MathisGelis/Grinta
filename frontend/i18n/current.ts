import { Strings, translations } from "./translations";

let current: Strings = translations.en;

export function setCurrentStrings(strings: Strings) {
  current = strings;
}

export function getStrings(): Strings {
  return current;
}
