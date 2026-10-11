import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { npm, root } from "./process.mjs";
const repository = resolve(root, "../..");
const artifacts = resolve(root, ".artifacts");
await mkdir(artifacts, { recursive: true });
// npm pack runs the real prepack registry build and CLI regression checks.
const result = npm(["pack", "./packages/react-a2z-cli", "--pack-destination", artifacts, "--json"], repository, true);
const filename = JSON.parse(result.stdout.slice(result.stdout.indexOf("[")))[0].filename;
const packed = resolve(artifacts, filename);
const hash = createHash("sha256").update(await readFile(packed)).digest("hex").slice(0, 16);
const candidate = `react-a2z-cli-${hash}.tgz`;
await copyFile(packed, resolve(artifacts, candidate));
const packagePath = resolve(root, "package.json");
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.devDependencies["react-a2z-cli"] = `file:.artifacts/${candidate}`;
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Packed local CLI candidate: ${filename}. Nothing was published.`);
