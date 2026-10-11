import { resolve } from "node:path";
import { access } from "node:fs/promises";
import { scenarios } from "./scenarios.mjs";
import { cliArgs } from "./scaffold.mjs";
import { root, cli, run } from "./process.mjs";
for (const s of scenarios) {
  const directory = resolve(root, "apps", s.id);
  let initialized = false;
  try { await access(resolve(directory, "a2z.json")); initialized = true; } catch {}
  if (initialized) { console.log(`Keeping initialized ${s.id}; use repair explicitly for updates.`); continue; }
  console.log(`Installing CLI source in ${s.id}`);
  run(process.execPath, [cli, "add", "select", "--cwd", directory, "--skip-install", ...cliArgs(s)]);
}
