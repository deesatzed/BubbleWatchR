import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["apps", "packages", "tests"];
const forbidden = [
  /brokerage\s+credential/i,
  /recommended\s+trade/i,
  /place\s+(?:a\s+)?trade/i,
  /trade\s+endpoint/i,
  /crash\s+probability/i,
];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (entry.name.endsWith(".ts")) files.push(path);
  }
  return files;
}

const files = (await Promise.all(roots.map(sourceFiles))).flat().sort();
const failures = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  if (/[ \t]+$/m.test(text)) failures.push(`${file}: trailing whitespace`);
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`${file}: forbidden product language ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`lint passed: ${files.length} TypeScript files checked`);
}
