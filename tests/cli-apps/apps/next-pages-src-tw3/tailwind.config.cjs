const reactA2zPreset = require("./src/lib/react-a2z/tailwind.preset.cjs");
module.exports = {
  presets: [reactA2zPreset],
 content: ["./src/components/ui/**/*.{js,ts,jsx,tsx}", "./src/lib/react-a2z/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}", "./index.html"], theme: { extend: { colors: { starterBrand: "#6750a4" } } }, plugins: [] };
