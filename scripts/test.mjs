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

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function passedTest(text) {
  const clean = stripAnsi(text);
  return /Tests\s+\d+ passed/i.test(clean) || /All tests passed/i.test(clean);
}
function hasFailedTest(text) {
  return /\d+ failed/i.test(stripAnsi(text));
}

for (const file of testFiles) {
  process.stdout.write(`${file} ... `);
  try {
    const out = execSync(`npx vitest run --config vitest.config.ts "${file}"`, {
      stdio: "pipe",
      timeout: 180_000,
    });
    const text = out.toString();
    if (passedTest(text) && !hasFailedTest(text)) {
      console.log("pass");
      passed++;
    } else {
      console.log("FAIL (no test summary found)");
      failed++;
      failures.push(file);
      console.error(text.slice(-500));
    }
  } catch (e) {
    const stderr = (e.stderr || "").toString();
    const stdout = (e.stdout || "").toString();
    const text = stdout + stderr;
    if (passedTest(text) && !hasFailedTest(text)) {
      console.log("pass (cleanup error ignored)");
      passed++;
    } else {
      console.log("FAIL");
      failed++;
      failures.push(file);
      console.error(stripAnsi(text).split("\n").slice(-15).join("\n"));
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${testFiles.length} total`);

if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  ${f}`));
  process.exit(1);
}
