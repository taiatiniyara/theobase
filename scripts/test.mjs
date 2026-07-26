import { execSync } from "child_process";
import { readdirSync, existsSync } from "fs";
import { join } from "path";

const testDir = "test";
const repoTestDir = join(testDir, "repos");

function findTestFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const testFiles = [...findTestFiles(testDir), ...findTestFiles(repoTestDir)];

if (testFiles.length === 0) {
  console.log("No test files found");
  process.exit(0);
}

console.log(`Running ${testFiles.length} test files in isolation...\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const file of testFiles) {
  process.stdout.write(`${file} ... `);
  try {
    execSync(`npx vitest run --config vitest.config.ts "${file}"`, {
      stdio: "pipe",
      timeout: 180_000,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    console.log("pass");
    passed++;
  } catch (e) {
    console.log("FAIL");
    failed++;
    failures.push(file);
    const stderr = e.stderr?.toString() ?? "";
    const stdout = e.stdout?.toString() ?? "";
    const output = stderr || stdout;
    if (output) {
      const lines = output.trim().split("\n");
      const tail = lines.slice(-10).join("\n");
      console.error(tail);
    } else {
      console.error(`Exit code: ${e.status}`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${testFiles.length} total`);

if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  ${f}`));
  process.exit(1);
}
