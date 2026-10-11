import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, mkdir, stat, writeFile, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { extname, resolve, sep } from "node:path";
import { scenarios } from "./scenarios.mjs";
import { root } from "./process.mjs";
const children = [], servers = [];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
async function stop() { for (const server of servers) server.close(); for (const child of children) child.kill(); }
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });
process.on("exit", () => { for (const child of children) child.kill(); });
try {
  let previous;
  try { previous = JSON.parse(await readFile(resolve(root, "reports/preview-process.json"), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (previous) {
    if (!Number.isSafeInteger(previous.pid) || previous.pid <= 0) throw new Error("Invalid recorded preview PID.");
    let alive = false;
    try { process.kill(previous.pid, 0); alive = true; } catch (error) { if (error.code !== "ESRCH") throw error; }
    if (alive) throw new Error("A managed preview is already running. Use npm run preview:stop first.");
  }
  // Preflight every build before opening any port.
  for (const s of scenarios) await access(resolve(root, "apps", s.id, s.framework.startsWith("next") ? ".next/BUILD_ID" : s.framework === "cra" ? "build/index.html" : "dist/index.html"));
  for (const s of scenarios) {
    const app = resolve(root, "apps", s.id);
    if (s.framework.startsWith("next")) {
      const require = createRequire(resolve(app, "package.json"));
      const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(s.port)], { cwd: app, stdio: "inherit", windowsHide: true, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
      children.push(child);
      child.on("error", error => { console.error(error); stop(); process.exitCode = 1; });
      child.on("exit", code => { if (code) { console.error(`${s.id} exited ${code}`); stop(); process.exitCode = 1; } });
    } else {
      const directory = resolve(app, s.framework === "cra" ? "build" : "dist");
      const server = createServer(async (request, response) => {
        try {
          const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
          let file = resolve(directory, `.${path}`);
          if (file !== directory && !file.startsWith(directory + sep)) { response.writeHead(403); response.end(); return; }
          if (path === "/") file = resolve(directory, "index.html");
          const info = await stat(file);
          if (!info.isFile()) { response.writeHead(404); response.end(); return; }
          response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
          createReadStream(file).pipe(response);
        } catch { response.writeHead(404); response.end(); }
      });
      server.on("error", error => { console.error(error); stop(); process.exitCode = 1; });
      server.listen(s.port, "127.0.0.1");
      servers.push(server);
    }
    console.log(`${s.id}: http://localhost:${s.port}`);
  }
  await mkdir(resolve(root, "reports"), { recursive: true });
  await writeFile(resolve(root, "reports/preview-process.json"), JSON.stringify({ pid: process.pid, children: children.map(child => child.pid), started: new Date().toISOString() }, null, 2));
} catch (error) { console.error(error.message); await stop(); process.exitCode = 1; }
