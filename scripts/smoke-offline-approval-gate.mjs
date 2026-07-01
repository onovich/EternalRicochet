import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const gateDocPath = join(rootDir, "docs", "phase-11-offline-ux-approval-gate.md");
const runtimeDocPath = join(rootDir, "docs", "phase-12-service-worker-offline-runtime.md");
const clientPath = join(rootDir, "src", "logic", "offline", "serviceWorkerClient.js");
const packagePath = join(rootDir, "package.json");

assert.ok(existsSync(gateDocPath), "Phase 11 offline approval gate document must exist.");
assert.ok(existsSync(runtimeDocPath), "Phase 12 service-worker runtime design document must exist.");
assert.ok(existsSync(clientPath), "Phase 12 service-worker client must exist.");

const gateDoc = readFile(gateDocPath);
const runtimeDoc = readFile(runtimeDocPath);
const clientSource = readFile(clientPath);
const packageJson = readJson(packagePath);

assertGateDocument();
assertPhase12Conformance();
assertValidateWiring();
assertNoDeferredDependencies();

console.log("Offline approval gate smoke passed: Phase 12 service-worker runtime remains inside the approved app-shell gate.");

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

  assertIncludesAll(gateDoc, requiredSections, "Phase 11 gate document is missing required section");
  assertIncludesAll(gateDoc, requiredFutureStates, "Phase 11 gate document is missing required future UX state");
  assertIncludesAll(gateDoc, requiredCopy, "Phase 11 gate document is missing required future copy");
  assertIncludesAll(gateDoc, requiredRules, "Phase 11 gate document is missing required stale-client rule");
  assertIncludesAll(gateDoc, requiredBrowsers, "Phase 11 gate document is missing browser validation target");
}

function assertPhase12Conformance() {
  const requiredRuntimeDocPhrases = [
    "Phase 12 is the first phase allowed to add service-worker runtime code.",
    "The Vite production build output is the source of truth for every precached URL.",
    "Never auto-reload while `gameState === \"PLAYING\"`.",
    "The service worker must not read, write, cache, migrate, export, or delete:",
    "Phase 12 validation must include a rollback/unregister smoke using the production preview server.",
  ];
  const requiredClientPhrases = [
    "A new version is ready. Refresh when you are ready.",
    "A new version is ready after this run.",
    'gameState === "PLAYING"',
    "SKIP_WAITING",
  ];

  assertIncludesAll(runtimeDoc, requiredRuntimeDocPhrases, "Phase 12 runtime doc is missing gate conformance phrase");
  assertIncludesAll(clientSource, requiredClientPhrases, "Phase 12 client is missing approved update UX behavior");
}

function assertValidateWiring() {
  assert.equal(
    packageJson.scripts?.["smoke:offline-gate"],
    "node scripts/smoke-offline-approval-gate.mjs",
    "package.json must expose npm run smoke:offline-gate.",
  );
  assert.equal(
    packageJson.scripts?.["smoke:service-worker"],
    "node scripts/smoke-service-worker.mjs",
    "package.json must expose npm run smoke:service-worker.",
  );
  assert.match(
    packageJson.scripts?.validate ?? "",
    /npm run smoke:offline-gate/,
    "npm run validate must include the offline approval gate smoke.",
  );
  assert.match(
    packageJson.scripts?.validate ?? "",
    /npm run smoke:service-worker/,
    "npm run validate must include the service-worker smoke.",
  );
}

function assertNoDeferredDependencies() {
  assert.equal(packageJson.dependencies, undefined, "Phase 12 must not add runtime dependencies.");

  const devDependencyNames = Object.keys(packageJson.devDependencies ?? {});
  assert.deepEqual(
    devDependencyNames,
    ["vite"],
    "Phase 12 must keep dev dependencies limited to the existing Vite build tool.",
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
    "Phase 12 must not add service-worker tooling, backend, analytics, or native packaging dependencies.",
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
