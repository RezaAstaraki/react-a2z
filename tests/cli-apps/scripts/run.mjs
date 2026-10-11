import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scenarios } from "./scenarios.mjs";
import { npm, root } from "./process.mjs";
const task = process.argv[2];
if (!["build", "typecheck"].includes(task)) throw new Error("Expected build or typecheck.");
const results = [];
for (const s of scenarios) {
  console.log(`\n${task}: ${s.id}`);
  const start = Date.now();
  try { npm(["run", task], resolve(root, "apps", s.id)); results.push({ id: s.id, passed: true, seconds: (Date.now() - start) / 1000 }); }
  catch (error) { console.error(error.message); results.push({ id: s.id, passed: false, error: error.message }); }
}
await mkdir(resolve(root, "reports"), { recursive: true });
await writeFile(resolve(root, "reports", `${task}.json`), JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
console.log(`${results.filter(r => r.passed).length}/${results.length} ${task} checks passed.`);
if (results.some(r => !r.passed)) process.exitCode = 1;
