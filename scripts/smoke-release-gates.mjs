import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const indexPath = join(distDir, "index.html");
const assetsDir = join(distDir, "assets");
const manifestPath = join(distDir, "manifest.webmanifest");
const iconsDir = join(distDir, "icons");

assert.ok(existsSync(indexPath), "dist/index.html must exist. Run npm run build first.");
assert.ok(existsSync(assetsDir), "dist/assets must exist. Run npm run build first.");
assert.ok(existsSync(manifestPath), "dist/manifest.webmanifest must exist. Run npm run build first.");
assert.ok(existsSync(join(iconsDir, "icon.svg")), "dist/icons/icon.svg must exist. Run npm run build first.");
assert.ok(
  existsSync(join(iconsDir, "maskable-icon.svg")),
  "dist/icons/maskable-icon.svg must exist. Run npm run build first.",
);

const indexHtml = readFileSync(indexPath, "utf8");

assert.match(
  indexHtml,
  /\/EternalRicochet\/assets\/[^"]+\.js/,
  "production index must reference JavaScript assets under /EternalRicochet/",
);
assert.equal(
  indexHtml.includes("/src/main.js"),
  false,
  "production index must not reference the dev source entry",
);
assert.equal(
  indexHtml.includes("/EternalRicochet/manifest.webmanifest"),
  true,
  "production index must reference the web app manifest under /EternalRicochet/",
);
assert.equal(
  indexHtml.includes("/EternalRicochet/icons/icon.svg"),
  true,
  "production index must reference the local icon under /EternalRicochet/",
);

const jsFiles = readdirSync(assetsDir).filter((file) => file.endsWith(".js"));
assert.ok(jsFiles.length > 0, "production build must emit at least one JavaScript asset");

const jsBundle = jsFiles.map((file) => readFileSync(join(assetsDir, file), "utf8")).join("\n");
const forbiddenProductionTokens = [
  "eternal-ricochet-debug-state",
  "__ETERNAL_RICOCHET_DEV__",
];

for (const token of forbiddenProductionTokens) {
  assert.equal(
    jsBundle.includes(token),
    false,
    `production bundle must not expose ${token}`,
  );
}

console.log("Release gate smoke passed: production dist pathing, manifest assets, and dev debug gates are intact.");
