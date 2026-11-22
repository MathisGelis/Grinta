/** Jour local de l'utilisateur au format AAAA-MM-JJ (le serveur sinon prend la date UTC). */
export function localDate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
