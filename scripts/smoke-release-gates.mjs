import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const indexPath = join(distDir, "index.html");
const assetsDir = join(distDir, "assets");

assert.ok(existsSync(indexPath), "dist/index.html must exist. Run npm run build first.");
assert.ok(existsSync(assetsDir), "dist/assets must exist. Run npm run build first.");

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

console.log("Release gate smoke passed: production dist pathing and dev debug gates are intact.");
