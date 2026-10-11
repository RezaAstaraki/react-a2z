import { resolve } from "node:path";
import { scenarios } from "./scenarios.mjs";
import { npm, root } from "./process.mjs";
const s = scenarios.find(s => s.id === process.argv[2]);
if (!s) { console.log(`Run npm run dev -- <scenario>:\n${scenarios.map(s => `  ${s.id}  http://localhost:${s.port}`).join("\n")}`); process.exit(process.argv[2] ? 1 : 0); }
npm(["run", "dev"], resolve(root, "apps", s.id));
