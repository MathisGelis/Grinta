/** @type {import('tailwindcss').Config} */
const palette = require("./constants/palette");
const colors = Object.fromEntries(
  Object.entries(palette).map(([k, v]) => [
    k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
    v,
  ]),
);

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      borderRadius: { hero: "32px", card: "28px", tile: "22px" },
    },
  },
  plugins: [],
};
