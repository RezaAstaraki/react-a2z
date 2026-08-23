/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {},
  },
  plugins: [],
};

/** Add these to your Tailwind `content` array so library classes are included. */
export const contentPaths = ['./node_modules/react-a2z/dist/**/*.{js,mjs,cjs}'];

export default preset;
