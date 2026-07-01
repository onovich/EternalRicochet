import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

const rootDir = process.cwd();
const hostedBase = "/EternalRicochet/";
const distDir = join(rootDir, "dist");
const distAssetsDir = join(distDir, "assets");
const distIconsDir = join(distDir, "icons");
const publicDir = join(rootDir, "public");
const sourceDir = join(rootDir, "src");
const sourceIndexPath = join(rootDir, "index.html");
const packagePath = join(rootDir, "package.json");
const distIndexPath = join(distDir, "index.html");
const distManifestPath = join(distDir, "manifest.webmanifest");

assert.ok(existsSync(distDir), "dist must exist. Run npm run build before npm run smoke:offline-readiness.");
assert.ok(existsSync(distIndexPath), "dist/index.html must exist after build.");
assert.ok(existsSync(distAssetsDir), "dist/assets must exist after build.");
assert.ok(existsSync(distManifestPath), "dist/manifest.webmanifest must exist after build.");
assert.ok(existsSync(join(distIconsDir, "icon.svg")), "dist/icons/icon.svg must exist after build.");
assert.ok(existsSync(join(distIconsDir, "maskable-icon.svg")), "dist/icons/maskable-icon.svg must exist after build.");

const distIndex = readFile(distIndexPath);
const distManifest = readJson(distManifestPath);
const jsAssets = readdirSync(distAssetsDir).filter((file) => file.endsWith(".js")).sort();
const cssAssets = readdirSync(distAssetsDir).filter((file) => file.endsWith(".css")).sort();

assert.ok(jsAssets.length >= 1, "dist/assets must include at least one JavaScript cache candidate.");
assert.ok(cssAssets.length >= 1, "dist/assets must include at least one CSS cache candidate.");
assert.ok(jsAssets.every(isHashedBundle), `JavaScript assets must be hashed bundles: ${jsAssets.join(", ")}`);
assert.ok(cssAssets.every(isHashedBundle), `CSS assets must be hashed bundles: ${cssAssets.join(", ")}`);

for (const file of jsAssets) {
  assert.equal(
    distIndex.includes(`${hostedBase}assets/${file}`),
    true,
    `dist/index.html must reference ${file} under ${hostedBase}`,
  );
}

for (const file of cssAssets) {
  assert.equal(
    distIndex.includes(`${hostedBase}assets/${file}`),
    true,
    `dist/index.html must reference ${file} under ${hostedBase}`,
  );
}

assert.equal(distIndex.includes(`${hostedBase}manifest.webmanifest`), true);
assert.equal(distIndex.includes(`${hostedBase}icons/icon.svg`), true);
assert.equal(distManifest.id, hostedBase);
assert.equal(distManifest.start_url, hostedBase);
assert.equal(distManifest.scope, hostedBase);
assert.ok(Array.isArray(distManifest.icons), "manifest icons must be an array.");
assertManifestIcon("/EternalRicochet/icons/icon.svg");
assertManifestIcon("/EternalRicochet/icons/maskable-icon.svg");

const guardedSourceFiles = [
  sourceIndexPath,
  ...collectFiles(sourceDir).filter(isRuntimeFile),
  join(publicDir, "manifest.webmanifest"),
  ...collectFiles(join(publicDir, "icons")).filter((file) => file.endsWith(".svg")),
];
const guardedDistFiles = [
  distIndexPath,
  distManifestPath,
  ...collectFiles(distAssetsDir).filter(isRuntimeFile),
  ...collectFiles(distIconsDir).filter((file) => file.endsWith(".svg")),
];
const guardedFiles = [...guardedSourceFiles, ...guardedDistFiles].filter(existsSync);

assertNoUnapprovedExternalUrls(guardedFiles);
assertNoServiceWorkerFiles();
assertNoRuntimeOfflineScope(guardedFiles);
assertNoServiceWorkerDependencies();

console.log(
  `Offline readiness dry-run passed: ${jsAssets.length} JS, ${cssAssets.length} CSS, manifest, and 2 icon cache candidates inspected without shipping service-worker runtime.`,
);

function readFile(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readFile(path));
}

function isHashedBundle(file) {
  return /^index-[A-Za-z0-9_-]{8,}\.(css|js)$/.test(file);
}

function assertManifestIcon(src) {
  const icon = distManifest.icons.find((candidate) => candidate.src === src);
  assert.ok(icon, `dist manifest must include ${src}`);
  assert.equal(icon.src.startsWith(hostedBase), true, `${src} must stay under ${hostedBase}`);
  assert.equal(icon.src.startsWith("http://"), false);
  assert.equal(icon.src.startsWith("https://"), false);
}

function assertNoUnapprovedExternalUrls(files) {
  const allowedNamespaceUrls = new Set(["http://www.w3.org/2000/svg"]);
  const externalUrlPattern = /https?:\/\/[^\s"'<>]+/g;
  const failures = [];

  for (const file of files) {
    const text = readFile(file);
    for (const match of text.matchAll(externalUrlPattern)) {
      const url = trimUrl(match[0]);
      if (allowedNamespaceUrls.has(url)) continue;
      failures.push(`${formatPath(file)} contains unapproved external runtime URL ${url}`);
    }
  }

  assert.equal(failures.length, 0, `External runtime URL boundary failed:\n${failures.join("\n")}`);
}

function assertNoServiceWorkerFiles() {
  const serviceWorkerFilePattern = /^(sw|service-worker|serviceWorker|workbox)([-_.].*)?\.(js|mjs)$/i;
  const rootLevelFiles = readdirSync(rootDir)
    .map((entry) => join(rootDir, entry))
    .filter((path) => existsSync(path) && !statSync(path).isDirectory());
  const files = [
    ...rootLevelFiles,
    ...collectFiles(publicDir),
    ...collectFiles(sourceDir),
    ...collectFiles(distDir),
  ];
  const matches = files.filter((file) => serviceWorkerFilePattern.test(basename(file)));

  assert.deepEqual(
    matches.map(formatPath),
    [],
    "Phase 10 must not add service-worker or Workbox runtime files.",
  );
}

function assertNoRuntimeOfflineScope(files) {
  const forbiddenPatterns = [
    /\bnavigator\.serviceWorker\b/,
    /\bserviceWorker\.register\b/,
    /\bcaches\./,
    /\bcaches\.open\b/,
    /\bCacheStorage\b/,
    /\bclients\.claim\b/,
    /\bskipWaiting\b/,
    /\bimportScripts\s*\(/,
    /\bworkbox\b/i,
    /offline fallback/i,
    /works offline/i,
    /offline-capable/i,
    /offline support/i,
  ];
  const failures = [];

  for (const file of files) {
    const text = readFile(file);
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        failures.push(`${formatPath(file)} includes forbidden offline runtime token ${pattern}`);
      }
    }
  }

  assert.equal(failures.length, 0, `Offline runtime boundary failed:\n${failures.join("\n")}`);
}

function assertNoServiceWorkerDependencies() {
  const packageJson = readJson(packagePath);
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  const forbiddenDependencies = dependencyNames.filter((name) => /workbox|service-worker|sw-toolbox/i.test(name));
  assert.deepEqual(forbiddenDependencies, [], "Phase 10 must not add service-worker tooling dependencies.");
}

function collectFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}

function isRuntimeFile(file) {
  return file.endsWith(".js") || file.endsWith(".css");
}

function trimUrl(url) {
  return url.replace(/[),.;]+$/u, "");
}

function formatPath(path) {
  return relative(rootDir, path);
}
