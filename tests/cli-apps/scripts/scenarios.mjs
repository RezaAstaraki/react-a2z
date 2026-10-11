export const scenarios = [
  { id: "next-app-src-tw3", framework: "next-app", src: true, tw: 3 },
  { id: "next-app-root-tw4", framework: "next-app", src: false, tw: 4 },
  { id: "next-app-src-tw4", framework: "next-app", src: true, tw: 4 },
  { id: "next-app-root-tw3", framework: "next-app", src: false, tw: 3 },
  { id: "next-pages-src-tw3", framework: "next-pages", src: true, tw: 3 },
  { id: "next-pages-root-tw4", framework: "next-pages", src: false, tw: 4 },
  { id: "vite-ts-src-tw3", framework: "vite", src: true, tw: 3, customPath: true },
  { id: "vite-ts-src-tw4", framework: "vite", src: true, tw: 4 },
  { id: "vite-js-root-tw4", framework: "vite", src: false, tw: 4, js: true },
  { id: "react-webpack-root-tw4", framework: "webpack", src: false, tw: 4 },
  { id: "react-webpack-src-tw3", framework: "webpack", src: true, tw: 3 },
  { id: "cra-src-tw3", framework: "cra", src: true, tw: 3, legacy: true },
].map((scenario, index) => ({ ...scenario, port: 3101 + index }));
