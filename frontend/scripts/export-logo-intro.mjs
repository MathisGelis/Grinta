#!/usr/bin/env node
/**
 * Exporte l'animation d'ouverture (components/ui/LogoIntro.tsx) en fichiers autonomes,
 * utilisables partout sans React Native : un SVG animé en CSS et une page HTML d'aperçu.
 *
 *   node scripts/export-logo-intro.mjs
 *
 * Les tracés, couleurs et dimensions sont lus dans le code de l'app : relancer le script
 * après toute modification de LogoIntro.tsx, logoWordmark.ts ou de la palette.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const palette = require(join(root, "constants/palette.js"));

const component = readFileSync(join(root, "components/ui/LogoIntro.tsx"), "utf8");
const wordmark = readFileSync(join(root, "components/ui/logoWordmark.ts"), "utf8");

const num = (name) => Number(component.match(new RegExp(`const ${name} = (\\d+)`))[1]);
const ARC = num("ARC_LENGTH");
const CHEVRON = num("CHEVRON_LENGTH");
const W = num("VIEWBOX_W");
const H = num("VIEWBOX_H");
const paths = [...component.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
const [arcPath, chevronA, chevronB] = paths;
const glyphs = [...wordmark.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]);
const strokeW = component.match(/strokeWidth=\{(\d+)\}/)[1];
const symbolTransform = component.match(/transform="(translate\(9\.27[^"]+)"/)[1];

const INK = palette.ink;
const ACCENT = palette.accent;
const BG = palette.background;

// Chronologie (ms), identique à LogoIntro.tsx.
const T = {
  arc: [0, 800],
  chevA: [700, 1100],
  chevB: [950, 1350],
  title: [1100, 1550],
  fade: [2000, 2350],
};
const CYCLE = 3200; // boucle : on laisse le fond vide avant de recommencer
const EASE = {
  cubicOut: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  quadOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  quadIn: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
};

const pct = (ms, total) => `${((ms / total) * 100).toFixed(3)}%`;

function glyphsSvg() {
  return glyphs
    .map((d, i) => `<path d="${d}" fill="${i === glyphs.length - 1 ? ACCENT : INK}"/>`)
    .join("\n        ");
}

function artwork(classes, { title = true } = {}) {
  return `
      <g transform="translate(56 0)">
        <g fill="none" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" transform="${symbolTransform}">
          <path class="${classes.arc}" d="${arcPath}" stroke="${INK}"/>
          <path class="${classes.a}" d="${chevronA}" stroke="${ACCENT}"/>
          <path class="${classes.b}" d="${chevronB}" stroke="${ACCENT}"/>
        </g>
      </g>
${title ? `
      <g class="${classes.title}" transform="translate(20 312)">
        ${glyphsSvg()}
      </g>` : ""}`;
}

// Cadre du symbole seul (sans « GRINTA. »), centré avec une marge égale à la largeur d'un chevron.
const SYMBOL_BOX = { x: 52, y: -4, w: 240, h: 240 };

const wrap = (css, body, box = { x: 0, y: 0, w: W, h: H }) => `<?xml version="1.0" encoding="UTF-8"?>
<!-- Généré par scripts/export-logo-intro.mjs depuis components/ui/LogoIntro.tsx — ne pas éditer à la main. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${box.w}" height="${box.h}" role="img" aria-label="Grinta">
  <style>
${css}
  </style>
  <g class="logo">${body}
  </g>
</svg>
`;

// Variante « une fois » : le logo se dessine puis reste affiché.
function once({ title = true } = {}) {
  const draw = (cls, len, [start, end], ease) =>
    `    .${cls}{stroke-dasharray:${len} ${len};stroke-dashoffset:${len};animation:${cls} ${end - start}ms ${ease} ${start}ms forwards}\n` +
    `    @keyframes ${cls}{to{stroke-dashoffset:0}}`;
  const css = [
    draw("arc", ARC, T.arc, EASE.cubicOut),
    draw("a", CHEVRON, T.chevA, EASE.quadOut),
    draw("b", CHEVRON, T.chevB, EASE.quadOut),
    ...(title
      ? [
          `    .title{opacity:0;animation:title ${T.title[1] - T.title[0]}ms ${EASE.quadOut} ${T.title[0]}ms forwards}`,
          `    @keyframes title{to{opacity:1}}`,
        ]
      : []),
  ].join("\n");
  return wrap(
    css,
    artwork({ arc: "arc", a: "a", b: "b", title: "title" }, { title }),
    title ? undefined : SYMBOL_BOX,
  );
}

// Variante « boucle » : dessin, fondu final, puis reprise (idéale pour un README).
function loop({ title = true } = {}) {
  // Sans titre, le symbole est complet plus tôt : on raccourcit la pause avant le fondu.
  const fade = title ? T.fade : [1700, 2050];
  const c = title ? CYCLE : 2800;
  const draw = (cls, len, [start, end], ease) =>
    `    .${cls}{stroke-dasharray:${len} ${len};animation:${cls} ${c}ms linear infinite}\n` +
    `    @keyframes ${cls}{0%{stroke-dashoffset:${len};animation-timing-function:${ease}}` +
    `${pct(start, c)}{stroke-dashoffset:${len};animation-timing-function:${ease}}` +
    `${pct(end, c)}{stroke-dashoffset:0}100%{stroke-dashoffset:0}}`;
  const css = [
    draw("arc", ARC, T.arc, EASE.cubicOut),
    draw("a", CHEVRON, T.chevA, EASE.quadOut),
    draw("b", CHEVRON, T.chevB, EASE.quadOut),
    ...(title
      ? [
          `    .title{animation:title ${c}ms linear infinite}`,
          `    @keyframes title{0%,${pct(T.title[0], c)}{opacity:0;animation-timing-function:${EASE.quadOut}}${pct(T.title[1], c)},100%{opacity:1}}`,
        ]
      : []),
    `    .logo{animation:fade ${c}ms linear infinite}`,
    `    @keyframes fade{0%,${pct(fade[0], c)}{opacity:1;animation-timing-function:${EASE.quadIn}}${pct(fade[1], c)},99.9%{opacity:0}100%{opacity:1}}`,
  ].join("\n");
  return wrap(
    css,
    artwork({ arc: "arc", a: "a", b: "b", title: "title" }, { title }),
    title ? undefined : SYMBOL_BOX,
  );
}

function html(onceSvg) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grinta — animation du logo</title>
<style>
  html,body{margin:0;height:100%;background:${BG};color:${INK};font:16px system-ui,sans-serif}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px}
  .row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:32px}
  img{width:min(60vw,260px);height:auto}
  button{background:${ACCENT};color:#fff;border:0;border-radius:999px;padding:12px 28px;font:600 15px system-ui;cursor:pointer}
</style>
</head>
<body>
  <div class="row">
    <img class="logo" alt="Grinta" src="grinta-logo-intro.svg">
    <img class="logo" alt="Grinta (symbole)" src="grinta-symbol-intro.svg">
  </div>
  <button onclick="document.querySelectorAll('.logo').forEach(l=>{const s=l.src;l.src='';requestAnimationFrame(()=>l.src=s)})">Rejouer</button>
</body>
</html>
`;
}

const out = join(root, "assets/logo/animated");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "grinta-logo-intro.svg"), once());
writeFileSync(join(out, "grinta-logo-intro-loop.svg"), loop());
writeFileSync(join(out, "grinta-symbol-intro.svg"), once({ title: false }));
writeFileSync(join(out, "grinta-symbol-intro-loop.svg"), loop({ title: false }));
writeFileSync(join(out, "preview.html"), html());
console.log(`Écrit dans ${out} : 4 SVG animés et preview.html`);
