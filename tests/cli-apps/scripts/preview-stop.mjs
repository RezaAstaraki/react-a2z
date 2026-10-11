import { execFileSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { root } from "./process.mjs";
const record = resolve(root, "reports/preview-process.json");
let managed;
try { managed = JSON.parse(await readFile(record, "utf8")); }
catch (error) { if (error.code === "ENOENT") { console.log("No managed preview is recorded."); process.exit(0); } throw error; }
if (!Number.isSafeInteger(managed.pid) || managed.pid <= 0) throw new Error("Invalid managed preview PID.");
const script = resolve(root, "scripts/preview-all.mjs");
if (process.platform === "win32") {
  const source = await readFile(resolve(root, "scripts/preview-stop.ps1"), "utf8");
  // Pass values on stdin, not as interpolated shell code. An inline command
  // works with Windows' default file execution policy without changing it.
  const command = `$values = [Console]::In.ReadToEnd() | ConvertFrom-Json; & {\n${source}\n} -ManagedPid $values.pid -PreviewScript $values.script`;
  execFileSync("powershell.exe", ["-NoProfile", "-Command", command], { input: JSON.stringify({ pid: managed.pid, script }), stdio: ["pipe", "inherit", "inherit"], windowsHide: true });
} else {
  let command;
  try { command = execFileSync("ps", ["-p", String(managed.pid), "-o", "command="], { encoding: "utf8" }); } catch {}
  if (command) { if (!command.includes(script)) throw new Error("The recorded PID belongs to a different process; refusing to stop it."); process.kill(managed.pid, "SIGTERM"); }
}
await rm(record, { force: true });
console.log("Stopped only this suite's managed preview processes.");
