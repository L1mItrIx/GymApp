/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0b0d10",
        foreground: "#ededed",
        surface: "#15181d",
        "surface-2": "#1d2128",
        border: "#2a2f37",
      },
    },
  },
  plugins: [],
};
