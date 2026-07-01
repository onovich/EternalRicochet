import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

const rootDir = process.cwd();
const gateDocPath = join(rootDir, "docs", "phase-11-offline-ux-approval-gate.md");
const sourceIndexPath = join(rootDir, "index.html");
const sourceDir = join(rootDir, "src");
const publicDir = join(rootDir, "public");
const distDir = join(rootDir, "dist");
const packagePath = join(rootDir, "package.json");

assert.ok(existsSync(gateDocPath), "Phase 11 offline approval gate document must exist.");

const gateDoc = readFile(gateDocPath);
const packageJson = readJson(packagePath);

assertGateDocument();
assertValidateWiring();
assertNoServiceWorkerFiles();
assertNoOfflineRuntimeScope();
assertNoDeferredDependencies();

console.log("Offline approval gate smoke passed: Phase 11 UX gate is documented and runtime offline scope remains unshipped.");

function assertGateDocument() {
  const requiredSections = [
    "# Phase 11 Offline UX And Service Worker Approval Gate",
    "## Boundary",
    "## Official Source Ledger",
    "## Future UX State Copy",
    "## Stale-Client Rules",
    "## Future Rollback And Unregister Runbook",
    "## Browser Support And Validation Matrix",
    "## Future Service-Worker Go/No-Go Checklist",
    "## Phase 11 Go/No-Go Recommendation",
    "## Non-Scope Confirmation",
  ];
  const requiredFutureStates = [
    "First visit before cache exists",
    "Cached reload after a future service worker installs",
    "Offline reload with a valid cache",
    "Offline reload without a valid cache",
    "Update available while idle",
    "Update available during an active run",
    "Stale client after deploy",
    "Rollback or unregister recovery",
  ];
  const requiredCopy = [
    "Online setup required. Eternal Ricochet will finish loading from the network.",
    "Ready for faster reloads on this device.",
    "Network unavailable. Loaded the saved game shell for this device.",
    "Network unavailable and this device does not have a saved game shell yet.",
    "A new version is ready. Refresh when you are ready.",
    "A new version is ready after this run.",
    "This tab is running an older version. Refresh from the menu when you are ready.",
    "A compatibility fix is available. Refresh online to repair this installation.",
  ];
  const requiredRules = [
    "Never interrupt an active run with an automatic reload.",
    "Surface update prompts only in menu, pause, settings, or game-over states.",
    "Prefer explicit user refresh over silent reload.",
    "Keep local score, meta progression, and settings storage independent from cache versions.",
  ];
  const requiredBrowsers = [
    "Chromium desktop",
    "Firefox desktop",
    "Safari desktop if available",
    "Android Chrome if available",
    "iOS Safari",
    "GitHub Pages project path",
    "Custom-domain hosted path",
  ];
  const requiredOfficialSources = [
    "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API",
    "https://developer.mozilla.org/en-US/docs/Web/API/Cache",
    "https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage",
    "https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages",
  ];

  assertIncludesAll(gateDoc, requiredSections, "Phase 11 gate document is missing required section");
  assertIncludesAll(gateDoc, requiredFutureStates, "Phase 11 gate document is missing required future UX state");
  assertIncludesAll(gateDoc, requiredCopy, "Phase 11 gate document is missing required future copy");
  assertIncludesAll(gateDoc, requiredRules, "Phase 11 gate document is missing required stale-client rule");
  assertIncludesAll(gateDoc, requiredBrowsers, "Phase 11 gate document is missing browser validation target");
  assertIncludesAll(gateDoc, requiredOfficialSources, "Phase 11 gate document is missing official source");
  assert.ok(
    gateDoc.includes("Eternal Ricochet remains online-only in Phase 11."),
    "Gate document must state the current app remains online-only.",
  );
  assert.ok(
    gateDoc.includes("No-go for a service-worker implementation in Phase 11."),
    "Gate document must explicitly block service-worker implementation in Phase 11.",
  );
}

function assertValidateWiring() {
  assert.equal(
    packageJson.scripts?.["smoke:offline-gate"],
    "node scripts/smoke-offline-approval-gate.mjs",
    "package.json must expose npm run smoke:offline-gate.",
  );
  assert.match(
    packageJson.scripts?.validate ?? "",
    /npm run smoke:offline-gate/,
    "npm run validate must include the offline approval gate smoke.",
  );
}

function assertNoServiceWorkerFiles() {
  const serviceWorkerFilePattern = /^(sw|service-worker|serviceWorker|workbox)([-_.].*)?\.(js|mjs|cjs|ts|map|html)$/i;
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
    "Phase 11 must not add service-worker, offline fallback, or Workbox runtime files.",
  );
}

function assertNoOfflineRuntimeScope() {
  const guardedFiles = [
    sourceIndexPath,
    ...collectFiles(sourceDir).filter(isRuntimeFile),
    join(publicDir, "manifest.webmanifest"),
    ...collectFiles(join(publicDir, "icons")).filter((file) => file.endsWith(".svg")),
    join(distDir, "index.html"),
    join(distDir, "manifest.webmanifest"),
    ...collectFiles(join(distDir, "assets")).filter(isRuntimeFile),
    ...collectFiles(join(distDir, "icons")).filter((file) => file.endsWith(".svg")),
  ].filter(existsSync);

  const forbiddenPatterns = [
    /\bnavigator\.serviceWorker\b/,
    /\bserviceWorker\.register\b/,
    /\bregistration\.unregister\b/,
    /\bcaches\./,
    /\bcaches\.open\b/,
    /\bCacheStorage\b/,
    /\bclients\.claim\b/,
    /\bskipWaiting\b/,
    /\bimportScripts\s*\(/,
    /\bworkbox\b/i,
    /service-worker\.(js|mjs|cjs|ts|map)\b/i,
    /["'(/]sw\.(js|mjs|cjs|ts|map)\b/i,
    /offline fallback/i,
    /works offline/i,
    /available offline/i,
    /offline ready/i,
    /offline-capable/i,
    /offline mode/i,
    /offline support/i,
  ];
  const failures = [];

  for (const file of guardedFiles) {
    const text = readFile(file);
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        failures.push(`${formatPath(file)} includes forbidden offline runtime token ${pattern}`);
      }
    }
  }

  assert.equal(failures.length, 0, `Offline approval gate boundary failed:\n${failures.join("\n")}`);
}

function assertNoDeferredDependencies() {
  assert.equal(packageJson.dependencies, undefined, "Phase 11 must not add runtime dependencies.");

  const devDependencyNames = Object.keys(packageJson.devDependencies ?? {});
  assert.deepEqual(
    devDependencyNames,
    ["vite"],
    "Phase 11 must keep dev dependencies limited to the existing Vite build tool.",
  );

  const dependencyNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...devDependencyNames,
  ];
  const forbiddenDependencies = dependencyNames.filter((name) => {
    return /workbox|service-worker|sw-toolbox|firebase|supabase|capacitor|cordova|electron|analytics/i.test(name);
  });
  assert.deepEqual(
    forbiddenDependencies,
    [],
    "Phase 11 must not add service-worker, backend, analytics, or native packaging dependencies.",
  );
}

function assertIncludesAll(text, values, message) {
  const missing = values.filter((value) => !text.includes(value));
  assert.deepEqual(missing, [], `${message}: ${missing.join(", ")}`);
}

function readFile(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readFile(path));
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

function formatPath(path) {
  return relative(rootDir, path);
}
