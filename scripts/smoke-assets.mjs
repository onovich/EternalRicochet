import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rootDir = process.cwd();
const sourceIndexPath = join(rootDir, "index.html");
const sourceDir = join(rootDir, "src");
const publicDir = join(rootDir, "public");
const distDir = join(rootDir, "dist");
const distAssetsDir = join(distDir, "assets");
const distIconsDir = join(distDir, "icons");

assert.ok(existsSync(sourceIndexPath), "index.html must exist");
assert.ok(existsSync(distDir), "dist must exist. Run npm run build before npm run smoke:assets.");
assert.ok(existsSync(distAssetsDir), "dist/assets must exist. Run npm run build before npm run smoke:assets.");

const guardedFiles = [
  sourceIndexPath,
  ...collectFiles(sourceDir).filter(isRuntimeSourceFile),
  join(publicDir, "manifest.webmanifest"),
  ...collectFiles(join(publicDir, "icons")).filter((file) => file.endsWith(".svg")),
  join(distDir, "index.html"),
  join(distDir, "manifest.webmanifest"),
  ...collectFiles(distAssetsDir).filter(isBuiltRuntimeFile),
  ...collectFiles(distIconsDir).filter((file) => file.endsWith(".svg")),
].filter(existsSync);

const forbiddenTokens = [
  "cdn.tailwindcss.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

const externalUrlPattern = /https?:\/\/[^\s"'<>]+/g;
const allowedNamespaceUrls = new Set([
  "http://www.w3.org/2000/svg",
]);

const failures = [];

for (const file of guardedFiles) {
  const text = readFileSync(file, "utf8");
  for (const token of forbiddenTokens) {
    if (text.includes(token)) {
      failures.push(`${relative(rootDir, file)} contains forbidden runtime asset token ${token}`);
    }
  }

  for (const match of text.matchAll(externalUrlPattern)) {
    const url = trimUrl(match[0]);
    if (allowedNamespaceUrls.has(url)) continue;
    failures.push(`${relative(rootDir, file)} contains unapproved external runtime URL ${url}`);
  }
}

assert.equal(
  failures.length,
  0,
  `External asset locality smoke failed:\n${failures.join("\n")}`,
);

console.log("Asset locality smoke passed: guarded app-shell source and dist output contain no unapproved external runtime URLs.");

function isRuntimeSourceFile(file) {
  return file.endsWith(".js") || file.endsWith(".css");
}

function isBuiltRuntimeFile(file) {
  return file.endsWith(".js") || file.endsWith(".css");
}

function collectFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}

function trimUrl(url) {
  return url.replace(/[),.;]+$/u, "");
}
