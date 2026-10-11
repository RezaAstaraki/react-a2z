import { copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Identical API, different module identity for TypeScript's Node16/NodeNext resolver.
await copyFile(
  resolve(root, "dist/index.d.ts"),
  resolve(root, "dist/index.d.cts"),
);
await copyFile(
  resolve(root, "tailwind.preset.d.ts"),
  resolve(root, "dist/cjs/tailwind.preset.d.cts"),
);
const preset = await rollup({ input: resolve(root, "tailwind.preset.js") });
try {
  await preset.write({
    file: resolve(root, "dist/cjs/tailwind.preset.cjs"),
    format: "cjs",
    exports: "named",
  });
} finally {
  await preset.close();
}
