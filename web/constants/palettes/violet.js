// Palette de test : 7C5CB4 · 5A3F8A · 17151C · 292531 · F9F4F5.
// Les autres tokens sont dérivés de ces cinq couleurs (mélange), sauf les états
// (succès, alerte, danger, info) qui gardent leurs teintes.
const BASE = {
  accent: "#7C5CB4",
  accentDark: "#5A3F8A",
  background: "#17151C",
  surface: "#292531",
  ink: "#F8F0FB",
};

const channels = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mélange `a` vers `b` : t = 0 donne `a`, t = 1 donne `b`. */
const mix = (a, b, t) => {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  const part = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${part(ar, br)}${part(ag, bg)}${part(ab, bb)}`;
};

const rgba = (hex, alpha) => {
  const [r, g, b] = channels(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};

const { accent, accentDark, background, surface, ink } = BASE;

/** Désature légèrement une couleur (vers son gris de même luminosité). */
const desaturate = (hex, amount) => {
  const [r, g, b] = channels(hex);
  const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return mix(hex, `#${y.toString(16).padStart(2, "0").repeat(3)}`, amount);
};

// États un peu moins saturés pour rester à côté d'un violet doux ; l'info passe
// au bleu ciel pour ne plus ressembler à l'accent.
const success = desaturate("#34D399", 0.1);
const warning = desaturate("#F59E0B", 0.1);
const danger = desaturate("#FF6B6B", 0.1);
const info = "#38BDF8";

module.exports = {
  background,
  surface,
  raised: mix(surface, ink, 0.09),
  line: mix(surface, ink, 0.18),
  ink,
  inkSoft: mix(ink, background, 0.22),
  inkMuted: mix(ink, background, 0.38),
  inkFaint: mix(ink, background, 0.52),
  accent,
  accentLight: mix(accent, ink, 0.3),
  accentDark,
  accentTint: mix(background, accent, 0.3),
  success,
  warning,
  danger,
  info,
  warningTint: mix(background, warning, 0.18),
  onAccent: ink,
  successTint: mix(background, success, 0.18),
  dangerTint: mix(background, danger, 0.2),
  dangerBorder: mix(background, danger, 0.32),
  infoTint: mix(background, info, 0.2),
  inkLight: mix(ink, background, 0.1),
  accentText: mix(accent, ink, 0.6),
  dangerLight: "#FCA5A5",
  overlay: "rgba(0,0,0,0.5)",
  scrim: "rgba(0,0,0,0.7)",
  glassFill: rgba(ink, 0.1),
  glassBorder: rgba(ink, 0.2),
  glassText: rgba(ink, 0.5),
  glassStrong: rgba(ink, 0.9),
};
