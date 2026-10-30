import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios.mjs";
import { root } from "./process.mjs";

export function cliArgs(s) {
  return s.customPath ? ["--path", "src/components/custom-ui", "--css", "src/main.css"] : [];
}
export async function createApp(s, directory) {
  const prefix = s.src ? "src/" : "";
  const next = s.framework.startsWith("next");
  const cra = s.framework === "cra";
  const extension = s.js ? "jsx" : "tsx";
  const components = s.customPath ? "components/custom-ui" : "components/ui";
  const files = {};
  const dependencies = {
    react: cra ? "18.3.1" : "19.3.0", "react-dom": cra ? "18.3.1" : "19.3.0",
    clsx: "^2.1.1", "tailwind-merge": s.tw === 3 ? "^2.6.0" : "^3.0.1",
  };
  const devDependencies = {
    tailwindcss: s.tw === 3 ? "3.4.19" : "4.3.3",
    typescript: cra ? "4.9.5" : "^5.9.3",
    "@types/react": cra ? "^18.3.12" : "^19.2.0",
    "@types/react-dom": cra ? "^18.3.1" : "^19.2.0",
    "@types/node": cra ? "^16.18.0" : "^22.0.0",
    postcss: "^8.5.6",
    ...(s.tw === 3 ? { autoprefixer: "^10.4.21", "postcss-import": "^16.1.1" } : { "@tailwindcss/postcss": "4.3.3" }),
  };
  let scripts = { typecheck: "tsc --noEmit" };
  if (next) {
    dependencies.next = "16.4.3";
    scripts = { ...scripts, dev: `next dev --webpack -p ${s.port}`, build: "next build --webpack", start: `next start -p ${s.port}` };
    files["next.config.mjs"] = "export default { experimental: { cpus: 1 } };\n";
    files["next-env.d.ts"] = '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n';
  } else if (s.framework === "vite") {
    devDependencies.vite = "8.3.4";
    devDependencies["@vitejs/plugin-react"] = "6.1.2";
    scripts = { ...scripts, dev: `vite --host 127.0.0.1 --port ${s.port} --strictPort`, build: "vite build", preview: `vite preview --host 127.0.0.1 --port ${s.port} --strictPort` };
    files["vite.config.mjs"] = 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n';
  } else if (s.framework === "webpack") {
    Object.assign(devDependencies, { webpack: "5.111.1", "webpack-cli": "6.0.1", "webpack-dev-server": "5.2.2", "html-webpack-plugin": "5.6.4", "ts-loader": "9.5.4", "style-loader": "4.0.0", "css-loader": "7.1.2", "postcss-loader": "8.2.0" });
    scripts = { ...scripts, dev: "webpack serve --mode development", build: "webpack --mode production" };
    files["webpack.config.cjs"] = `const path = require("node:path");\nconst HtmlWebpackPlugin = require("html-webpack-plugin");\nmodule.exports = { entry: "./${prefix}main.tsx", output: { path: path.resolve(__dirname, "dist"), filename: "app.js", clean: true }, resolve: { extensions: [".tsx", ".ts", ".js"] }, module: { rules: [{ test: /\\.tsx?$/, exclude: /node_modules/, use: { loader: "ts-loader", options: { transpileOnly: true } } }, { test: /\\.css$/, use: ["style-loader", "css-loader", "postcss-loader"] }] }, plugins: [new HtmlWebpackPlugin({ template: "index.html" })], devServer: { host: "127.0.0.1", port: ${s.port}, historyApiFallback: true } };\n`;
  } else {
    dependencies["react-scripts"] = "5.0.1";
    scripts = { ...scripts, dev: "react-scripts start", build: "react-scripts build" };
    files[".env"] = `PORT=${s.port}\nHOST=127.0.0.1\nBROWSER=none\n`;
  }
  files["package.json"] = JSON.stringify({ name: `@a2z-tests/${s.id}`, version: "0.0.0", private: true, ...(cra ? {} : { type: "module" }), scripts, dependencies, devDependencies, ...(cra ? { browserslist: { production: [">0.2%", "not dead", "not op_mini all"], development: ["last 1 chrome version"] } } : {}) }, null, 2) + "\n";
  files["tsconfig.json"] = JSON.stringify({ compilerOptions: { target: cra ? "es5" : "ES2020", lib: ["dom", "dom.iterable", "esnext"], module: "esnext", moduleResolution: cra ? "node" : "bundler", jsx: "react-jsx", strict: true, esModuleInterop: true, allowSyntheticDefaultImports: true, resolveJsonModule: true, skipLibCheck: true, allowJs: true, isolatedModules: true, noEmit: true, ...(next ? { plugins: [{ name: "next" }], incremental: true } : {}) }, include: next ? ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"] : [s.src ? "src" : "**/*.ts", ...(s.src ? [] : ["**/*.tsx"])], exclude: ["node_modules", "dist", "build"] }, null, 2) + "\n";
  const css = next ? `${prefix}${s.framework === "next-app" ? "app/globals.css" : "styles/globals.css"}` : `${prefix}${s.customPath ? "main.css" : "index.css"}`;
  files[css] = (s.tw === 3 ? "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n" : '@import "tailwindcss";\n') + '\nbody { margin: 0; font-family: Arial, sans-serif; }\n';
  if (s.tw === 3) {
    const name = cra ? "tailwind.config.js" : s.framework === "next-app" ? "tailwind.config.ts" : "tailwind.config.cjs";
    const object = `{ content: ["./${prefix}**/*.{js,ts,jsx,tsx}", "./index.html"], theme: { extend: { colors: { starterBrand: "#6750a4" } } }, plugins: [] }`;
    files[name] = name.endsWith(".ts") ? `import type { Config } from "tailwindcss";\nexport default ${object} satisfies Config;\n` : `module.exports = ${object};\n`;
  }
  // CRA supplies its own PostCSS pipeline and inlines CSS imports via css-loader.
  if (!cra) files["postcss.config.cjs"] = s.tw === 3
    ? 'module.exports = { plugins: { "postcss-import": {}, tailwindcss: {}, autoprefixer: {} } };\n'
    : 'module.exports = { plugins: { "@tailwindcss/postcss": {} } };\n';
  files[`${prefix}Demo.${extension}`] = `"use client";\nimport { useState } from "react";\nimport { Select } from "./${components}/select";\n\nconst options = [{ value: "starter", label: "Starter", description: "Personal projects" }, { value: "pro", label: "Pro", description: "Growing teams" }, { value: "enterprise", label: "Enterprise", description: "Coming soon", disabled: true }];\nexport default function Demo() {\n  const [plan, setPlan] = useState("starter");\n  return <main className="min-h-screen bg-bg text-fg p-8 sm:p-12">\n    <div className="mx-auto max-w-2xl">\n      <p className="text-xs uppercase tracking-widest text-fg-muted">React A2Z · CLI starter</p>\n      <h1 className="mt-3 text-3xl font-semibold">Choose your workspace plan</h1>\n      <p className="mt-3 text-fg-muted">Open the menu or use arrow keys. Enterprise is disabled.</p>\n      <section className="mt-8 space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">\n        <Select label="Workspace plan" description="Your selected plan appears below." options={options} value={plan} onValueChange={value => setPlan(String(value))} required />\n        <p role="status" className="rounded-xl bg-muted p-4 text-sm">Selected plan: <strong>{plan}</strong></p>\n        <Select label="Locked plan" options={options} value="starter" disabled />\n        <Select label="Billing plan" options={options} placeholder="Choose a plan" error="Choose a billing plan to continue." required />\n        <Select label="Custom plan" options={options} defaultValue="pro" classNames={{ control: "rounded-full border-violet-300 bg-violet-50 text-violet-950", popover: "rounded-2xl border-violet-200", option: "rounded-xl", label: "text-violet-800" }} />\n      </section>\n      <footer className="mt-6 text-xs text-fg-muted">${s.id} · Tailwind ${s.tw} · ${s.js ? "JavaScript entry, TypeScript components" : "TypeScript"} · ${s.src ? "src layout" : "root layout"}</footer>\n    </div>\n  </main>;\n}\n`;
  if (s.framework === "next-app") {
    files[`${prefix}app/layout.tsx`] = `import "./globals.css";\nimport type { ReactNode } from "react";\nexport const metadata = { title: "A2Z · ${s.id}" };\nexport default function Layout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }\n`;
    files[`${prefix}app/page.tsx`] = 'import Demo from "../Demo";\nexport default function Page() { return <Demo />; }\n';
  } else if (s.framework === "next-pages") {
    files[`${prefix}pages/_app.tsx`] = 'import "../styles/globals.css";\nimport type { AppProps } from "next/app";\nexport default function App({ Component, pageProps }: AppProps) { return <Component {...pageProps} />; }\n';
    files[`${prefix}pages/index.tsx`] = 'export { default } from "../Demo";\n';
  } else {
    const entry = cra ? "index.tsx" : `main.${extension}`;
    files[`${prefix}${entry}`] = `import { createRoot } from "react-dom/client";\nimport Demo from "./Demo";\nimport "./${s.customPath ? "main.css" : "index.css"}";\ncreateRoot(document.getElementById("root")${s.js ? "" : "!"}).render(<Demo />);\n`;
    files[cra ? "public/index.html" : "index.html"] = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A2Z · ${s.id}</title></head><body><div id="root"></div>${s.framework === "vite" ? `<script type="module" src="/${prefix}${entry}"></script>` : ""}</body></html>\n`;
  }
  for (const [path, content] of Object.entries(files)) {
    const absolute = resolve(directory, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, content, { flag: "wx" });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const s of scenarios) {
    const directory = resolve(root, "apps", s.id);
    try { await access(directory); console.log(`Keeping existing ${s.id}`); continue; } catch {}
    await createApp(s, directory);
    console.log(`Created ${s.id}`);
  }
}
