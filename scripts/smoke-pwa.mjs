import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const hostedBase = "/EternalRicochet/";
const publicDir = join(rootDir, "public");
const distDir = join(rootDir, "dist");
const publicManifestPath = join(publicDir, "manifest.webmanifest");
const distManifestPath = join(distDir, "manifest.webmanifest");
const sourceIndexPath = join(rootDir, "index.html");
const distIndexPath = join(distDir, "index.html");

const manifest = readJson(publicManifestPath);
const sourceIndex = readFileSync(sourceIndexPath, "utf8");

assert.equal(manifest.name, "Eternal Ricochet");
assert.equal(manifest.short_name, "Ricochet");
assert.equal(manifest.id, hostedBase);
assert.equal(manifest.start_url, hostedBase);
assert.equal(manifest.scope, hostedBase);
assert.equal(manifest.display, "fullscreen");
assert.equal(manifest.orientation, "any");
assert.equal(manifest.theme_color, "#00ffff");
assert.equal(manifest.background_color, "#050505");
assert.equal(manifest.lang, "en");
assert.equal(manifest.dir, "ltr");
assert.equal(Array.isArray(manifest.icons), true);
assert.equal(manifest.icons.length >= 2, true);

const expectedIcons = new Map([
  ["/EternalRicochet/icons/icon.svg", "any"],
  ["/EternalRicochet/icons/maskable-icon.svg", "maskable"],
]);

for (const [src, purpose] of expectedIcons) {
  const icon = manifest.icons.find((candidate) => candidate.src === src);
  assert.ok(icon, `manifest must include ${src}`);
  assert.equal(icon.type, "image/svg+xml");
  assert.equal(icon.sizes, "any");
  assert.equal(icon.purpose, purpose);
  assert.equal(src.startsWith(hostedBase), true);
  assert.equal(src.startsWith("http://"), false);
  assert.equal(src.startsWith("https://"), false);
  assert.ok(existsSync(publicPathFromHostedSrc(src)), `${src} must resolve to a public asset`);
}

assert.match(
  sourceIndex,
  /<link\s+rel="manifest"\s+href="\/EternalRicochet\/manifest\.webmanifest">/,
  "index.html must link the manifest under the hosted base path",
);
assert.match(
  sourceIndex,
  /<meta\s+name="theme-color"\s+content="#00ffff">/,
  "index.html must expose the manifest theme color",
);
assert.match(
  sourceIndex,
  /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\/EternalRicochet\/icons\/icon\.svg">/,
  "index.html must use the local app icon as favicon",
);

assert.ok(existsSync(distManifestPath), "dist/manifest.webmanifest must exist after npm run build");
assert.deepEqual(readJson(distManifestPath), manifest);
assert.ok(existsSync(join(distDir, "icons", "icon.svg")), "dist/icons/icon.svg must exist");
assert.ok(
  existsSync(join(distDir, "icons", "maskable-icon.svg")),
  "dist/icons/maskable-icon.svg must exist",
);

const distIndex = readFileSync(distIndexPath, "utf8");
assert.equal(distIndex.includes("/EternalRicochet/manifest.webmanifest"), true);
assert.equal(distIndex.includes("/EternalRicochet/icons/icon.svg"), true);

for (const text of [sourceIndex, JSON.stringify(manifest)]) {
  assertNoDeferredPwaScope(text);
}
assertManifestHasNoDeferredCapabilities(manifest);
assertPackageHasNoPlatformDeps();
assertRuntimeHasNoPlatformScope();

console.log("PWA smoke passed: manifest metadata, icon assets, hosted paths, and no-service-worker boundary are intact.");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function publicPathFromHostedSrc(src) {
  return join(publicDir, src.slice(hostedBase.length));
}

function assertNoDeferredPwaScope(text) {
  const forbiddenTokens = [
    "serviceWorker",
    "navigator.serviceWorker",
    "caches.",
    "CacheStorage",
    "BackgroundSync",
    "PushManager",
    "offline fallback",
    "works offline",
  ];

  for (const token of forbiddenTokens) {
    assert.equal(text.includes(token), false, `manifest surface must not include ${token}`);
  }
}

function assertManifestHasNoDeferredCapabilities(candidate) {
  const forbiddenManifestFields = [
    "prefer_related_applications",
    "related_applications",
    "shortcuts",
    "share_target",
    "protocol_handlers",
    "file_handlers",
    "launch_handler",
  ];

  for (const field of forbiddenManifestFields) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(candidate, field),
      false,
      `manifest must not declare deferred capability ${field}`,
    );
  }
}

function assertPackageHasNoPlatformDeps() {
  const packageJson = readJson(join(rootDir, "package.json"));
  assert.equal(packageJson.dependencies, undefined, "Phase 8 must not add runtime dependencies");
  assert.deepEqual(
    Object.keys(packageJson.devDependencies ?? {}),
    ["vite"],
    "Phase 8 must not add platform/native/backend dev dependencies",
  );
}

function assertRuntimeHasNoPlatformScope() {
  const runtimeFiles = [
    sourceIndexPath,
    ...collectFiles(join(rootDir, "src")).filter((file) => file.endsWith(".js")),
  ];
  const forbiddenPatterns = [
    /\bnavigator\.serviceWorker\b/,
    /\bserviceWorker\.register\b/,
    /\bcaches\./,
    /\bCacheStorage\b/,
    /\bBackgroundSync\b/,
    /\bPushManager\b/,
    /\bNotification\.requestPermission\b/,
    /from\s+["']firebase/,
    /from\s+["']@firebase/,
    /from\s+["']@supabase/,
    /from\s+["']@capacitor/,
    /from\s+["']cordova/,
    /from\s+["']electron/,
    /\bFirebaseApp\b/,
    /\bcreateClient\s*\(/,
  ];

  for (const file of runtimeFiles) {
    const source = readFileSync(file, "utf8");
    for (const pattern of forbiddenPatterns) {
      assert.equal(pattern.test(source), false, `${file} must not include ${pattern}`);
    }
  }
}

function collectFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}
