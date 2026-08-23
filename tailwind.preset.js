/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {},
  },
  plugins: [],
};

/** Tailwind v3 — add to `content` in tailwind.config.js */
export const contentPaths = ["./node_modules/react-a2z/dist/**/*.{js,mjs,cjs}"];

/** Tailwind v4 — use `@import "react-a2z/tailwind.css"` in globals.css (recommended) */
export const tailwindV4Stylesheet = "react-a2z/tailwind.css";

export default preset;
