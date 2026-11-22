// Palette active. Pour revenir à l'ancienne : "classic".
//   classic : #19191B / #7B5CF0 (palette d'origine, gardée dans palettes/classic.js)
//   violet  : #08080B / #7C5CB4 (palette à tester, palettes/violet.js)
const ACTIVE = "violet";

const palettes = {
  classic: require("./palettes/classic"),
  violet: require("./palettes/violet"),
};

module.exports = palettes[ACTIVE];
