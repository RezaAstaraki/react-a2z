import reactA2zPreset from "./lib/react-a2z/tailwind.preset.cjs";
import type { Config } from "tailwindcss";
export default {
  presets: [reactA2zPreset],
 content: ["./components/ui/**/*.{js,ts,jsx,tsx}", "./lib/react-a2z/**/*.{js,ts,jsx,tsx}", "./**/*.{js,ts,jsx,tsx}", "./index.html"], theme: { extend: { colors: { starterBrand: "#6750a4" } } }, plugins: [] } satisfies Config;
