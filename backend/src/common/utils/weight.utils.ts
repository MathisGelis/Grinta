export function kgToLbs(kg: number): number {
  return +(kg * 2.20462).toFixed(2);
}

export function lbsToKg(lbs: number): number {
  return +(lbs / 2.20462).toFixed(2);
}
