import reactA2zPreset from "./src/lib/react-a2z/tailwind.preset.cjs";
import type { Config } from "tailwindcss";
export default {
  presets: [reactA2zPreset],
 content: ["./src/components/ui/**/*.{js,ts,jsx,tsx}", "./src/lib/react-a2z/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}", "./index.html"], theme: { extend: { colors: { starterBrand: "#6750a4" } } }, plugins: [] } satisfies Config;
