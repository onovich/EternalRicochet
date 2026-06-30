import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { existsSync } from "node:fs";
import process from "node:process";

const preferredPorts = [5173, 4173, 3000, 8080];

async function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function choosePort() {
  for (const port of preferredPorts) {
    if (await isPortFree(port)) return port;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.once("listening", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.listen(0, "127.0.0.1");
  });
}

function ensureDependencies() {
  if (existsSync("node_modules")) return;

  console.log("Installing local dependencies...");
  const result = spawnSync("npm", ["install"], { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [url], { detached: true, stdio: "ignore" }).unref();
}

const port = await choosePort();
const url = `http://127.0.0.1:${port}/EternalRicochet/`;

ensureDependencies();
console.log(`Starting Eternal Ricochet at ${url}`);
openBrowser(url);

const child = spawn(
  "npm",
  ["run", "dev", "--", "--port", String(port), "--strictPort"],
  { stdio: "inherit", shell: true },
);

child.on("exit", (code) => process.exit(code ?? 0));
