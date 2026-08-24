import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const browserPath = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/private/tmp/bubblereyes-playwright";
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserPath };
const playwrightBin = join(process.cwd(), "node_modules", ".bin", "playwright");
const chromiumMarker = existsSync(browserPath) && readdirSync(browserPath, { withFileTypes: true })
  .some((entry) => entry.isDirectory() && entry.name.startsWith("chromium-"));

if (!chromiumMarker) {
  console.log(`Playwright Chromium is not present at ${browserPath}; installing the dev browser.`);
  const install = spawnSync(playwrightBin, ["install", "chromium"], { env, stdio: "inherit" });
  if (install.status !== 0) process.exit(install.status ?? 1);
}

const result = spawnSync(process.execPath, ["--test", "dist/tests/e2e.test.js"], { env, stdio: "inherit" });
process.exit(result.status ?? 1);
