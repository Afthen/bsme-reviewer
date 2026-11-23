/**
 * test/reporter_test.js
 * Regression tests for scripts/quiet_reporter.js: hides passing tests,
 * emits only leaf failures without duplicating suite wrappers, and prints summary.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const REPORTER = pathToFileURL(path.resolve("scripts/quiet_reporter.js")).href;

function runWithQuietReporter(testCode) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qrep-"));
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  try {
    const testFile = path.join(dir, "sample_test.js");
    fs.writeFileSync(testFile, testCode, "utf8");
    return spawnSync(process.execPath, ["--test", `--test-reporter=${REPORTER}`, testFile], {
      encoding: "utf8",
      env
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("quiet_reporter", () => {
  test("suppresses passing test names and emits only the summary line", () => {
    const res = runWithQuietReporter([
      'import { describe, test } from "node:test";',
      'import assert from "node:assert/strict";',
      'describe("Passing Suite", () => {',
      '  test("alpha passes silently", () => { assert.equal(1 + 1, 2); });',
      '  test("beta passes silently", () => { assert.equal(2 + 2, 4); });',
      '});'
    ].join("\n"));

    assert.equal(res.status, 0, res.stderr);
    assert.doesNotMatch(res.stdout, /alpha passes silently|beta passes silently|✔/);
    assert.match(res.stdout, /^\[test\] 2 passed, 0 failed \(\d+\.\d+s\)\n$/);
  });

  test("prints only failing leaf test once without enclosing suite noise", () => {
    const res = runWithQuietReporter([
      'import { describe, test } from "node:test";',
      'import assert from "node:assert/strict";',
      'describe("Mixed Suite", () => {',
      '  test("good test hidden", () => { assert.ok(true); });',
      '  test("broken leaf test", () => { assert.equal(1, 2); });',
      '});'
    ].join("\n"));

    assert.notEqual(res.status, 0);
    assert.doesNotMatch(res.stdout, /good test hidden/);
    assert.doesNotMatch(res.stdout, /✖ .*Mixed Suite/);
    assert.match(res.stdout, /✖ .*broken leaf test/);
    assert.match(res.stdout, /\[test\] 1 passed, 1 failed \(\d+\.\d+s\)/);
  });
});
