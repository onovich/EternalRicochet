import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const hostedBase = "/EternalRicochet/";
const distDir = join(rootDir, "dist");
const distAssetsDir = join(distDir, "assets");
const distIconsDir = join(distDir, "icons");
const serviceWorkerPath = join(distDir, "service-worker.js");
const packagePath = join(rootDir, "package.json");
const mainPath = join(rootDir, "src", "main.js");
const clientPath = join(rootDir, "src", "logic", "offline", "serviceWorkerClient.js");

assert.ok(existsSync(serviceWorkerPath), "dist/service-worker.js must exist. Run npm run build first.");
assert.ok(existsSync(clientPath), "Phase 12 service-worker client module must exist.");

const serviceWorker = readFile(serviceWorkerPath);
const clientSource = readFile(clientPath);
const mainSource = readFile(mainPath);
const packageJson = readJson(packagePath);
const jsAssets = readdirSync(distAssetsDir).filter((file) => file.endsWith(".js")).sort();
const cssAssets = readdirSync(distAssetsDir).filter((file) => file.endsWith(".css")).sort();

assertGeneratedCache();
assertPrecacheUrls();
assertServiceWorkerRuntime();
assertClientRegistration();
assertDependencyBoundary();

console.log("Service-worker smoke passed: generated app-shell cache, registration, update, and boundary guards are intact.");

function assertGeneratedCache() {
  assert.match(
    serviceWorker,
    /const CACHE_NAME = "eternal-ricochet-app-shell-v[a-f0-9]{12}";/,
    "service worker must use a versioned app-shell cache name.",
  );
  assert.equal(serviceWorker.includes('const APP_CACHE_PREFIX = "eternal-ricochet-";'), true);
  assert.equal(serviceWorker.includes(`const HOSTED_BASE = "${hostedBase}";`), true);
}

function assertPrecacheUrls() {
  const precacheUrls = extractPrecacheUrls();
  const requiredUrls = [
    hostedBase,
    `${hostedBase}index.html`,
    `${hostedBase}manifest.webmanifest`,
    `${hostedBase}icons/icon.svg`,
    `${hostedBase}icons/maskable-icon.svg`,
    ...jsAssets.map((file) => `${hostedBase}assets/${file}`),
    ...cssAssets.map((file) => `${hostedBase}assets/${file}`),
  ].sort();

  assert.deepEqual(precacheUrls.sort(), requiredUrls, "service worker precache URLs must match current dist app shell.");

  for (const url of precacheUrls) {
    assert.equal(url.startsWith(hostedBase), true, `${url} must stay under ${hostedBase}`);
    assert.equal(url.startsWith("http://"), false, `${url} must not be absolute HTTP.`);
    assert.equal(url.startsWith("https://"), false, `${url} must not be absolute HTTPS.`);
    assertNoForbiddenPath(url);
    assert.ok(resolveDistUrl(url), `${url} must resolve to a built dist asset.`);
  }
}

function assertServiceWorkerRuntime() {
  const requiredTokens = [
    "self.addEventListener(\"install\"",
    "caches.open(CACHE_NAME)",
    "cache.addAll(PRECACHE_URLS)",
    "cache.put(request, response.clone())",
    "cache.put(APP_SHELL_FALLBACK, response.clone())",
    "self.addEventListener(\"activate\"",
    "caches.keys()",
    "caches.delete(name)",
    "self.clients.claim()",
    "self.addEventListener(\"message\"",
    "SKIP_WAITING",
    "self.skipWaiting()",
    "self.addEventListener(\"fetch\"",
    "request.method !== \"GET\"",
    "url.origin !== self.location.origin",
    "!url.pathname.startsWith(HOSTED_BASE)",
    "isForbiddenRuntimePath(url.pathname)",
    "cacheFirst(request)",
    "networkFirstNavigation(request)",
  ];

  for (const token of requiredTokens) {
    assert.equal(serviceWorker.includes(token), true, `service worker must include ${token}`);
  }

  const forbiddenTokens = [
    "importScripts(",
    "workbox",
    "BackgroundSync",
    "PushManager",
    "Notification.requestPermission",
  ];

  for (const token of forbiddenTokens) {
    assert.equal(
      serviceWorker.toLowerCase().includes(token.toLowerCase()),
      false,
      `service worker must not include ${token}`,
    );
  }

  const forbiddenImportPatterns = [
    /from\s+["']firebase/,
    /from\s+["']@firebase/,
    /from\s+["']@supabase/,
    /from\s+["']@capacitor/,
    /from\s+["']cordova/,
    /from\s+["']electron/,
  ];

  for (const pattern of forbiddenImportPatterns) {
    assert.equal(pattern.test(serviceWorker), false, `service worker must not include ${pattern}`);
  }
}

function assertClientRegistration() {
  assert.equal(mainSource.includes("registerServiceWorker"), true, "src/main.js must call registerServiceWorker.");
  assert.equal(
    mainSource.includes("enabled: import.meta.env.PROD"),
    true,
    "service-worker registration must be production-only.",
  );
  assert.equal(
    clientSource.includes('serviceWorkerUrl = `${HOSTED_BASE}service-worker.js`'),
    true,
    "client must register the hosted service-worker URL.",
  );
  assert.equal(
    clientSource.includes("scope = HOSTED_BASE"),
    true,
    "client must register the hosted service-worker scope.",
  );
  assert.equal(clientSource.includes("windowRef.isSecureContext"), true, "client must check secure context.");
  assert.match(clientSource, /serviceWorker\s*\.\s*register\s*\(\s*serviceWorkerUrl,\s*\{\s*scope\s*\}\s*\)/);
  assert.equal(clientSource.includes("A new version is ready. Refresh when you are ready."), true);
  assert.equal(clientSource.includes("A new version is ready after this run."), true);
  assert.equal(clientSource.includes('gameState === "PLAYING"'), true);
  assert.equal(clientSource.includes("SKIP_WAITING"), true);
}

function assertDependencyBoundary() {
  assert.equal(packageJson.dependencies, undefined, "Phase 12 must not add runtime dependencies.");
  assert.deepEqual(
    Object.keys(packageJson.devDependencies ?? {}),
    ["vite"],
    "Phase 12 must keep dev dependencies limited to Vite.",
  );
  assert.equal(packageJson.scripts?.build, "vite build && node scripts/generate-service-worker.mjs");
  assert.equal(packageJson.scripts?.["smoke:service-worker"], "node scripts/smoke-service-worker.mjs");
  assert.match(packageJson.scripts?.validate ?? "", /npm run smoke:service-worker/);
}

function extractPrecacheUrls() {
  const match = serviceWorker.match(/const PRECACHE_URLS = (\[[\s\S]*?\]);/);
  assert.ok(match, "service worker must define PRECACHE_URLS.");
  return JSON.parse(match[1]);
}

function assertNoForbiddenPath(url) {
  const forbiddenPathPattern = /\/(?:api|auth|login|logout|leaderboard|provider|firebase|supabase|analytics|telemetry|credential|credentials|secret|admin|moderation)(?:\/|$)/i;
  assert.equal(forbiddenPathPattern.test(url), false, `${url} must not be a forbidden runtime path.`);
}

function resolveDistUrl(url) {
  if (url === hostedBase || url === `${hostedBase}index.html`) return existsSync(join(distDir, "index.html"));
  if (url === `${hostedBase}manifest.webmanifest`) return existsSync(join(distDir, "manifest.webmanifest"));
  if (url === `${hostedBase}icons/icon.svg`) return existsSync(join(distIconsDir, "icon.svg"));
  if (url === `${hostedBase}icons/maskable-icon.svg`) return existsSync(join(distIconsDir, "maskable-icon.svg"));
  if (url.startsWith(`${hostedBase}assets/`)) {
    return existsSync(join(distAssetsDir, url.slice(`${hostedBase}assets/`.length)));
  }
  return false;
}

function readFile(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readFile(path));
}
