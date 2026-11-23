/**
 * test/skeleton_test.js
 * Regression tests for scripts/repo_skeleton.js: slim one-line entries with
 * local function names, topic-leaf collapsing, README section trimming, and
 * the --authoring / --full / filter modes. Runs the script against a fixture repo.
 */

import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SCRIPT = path.resolve("scripts/repo_skeleton.js");
const README = Array.from({ length: 13 }, (_, n) => `## ${n}. Section ${n}\nbody ${n}\n`).join("\n");

describe("repo_skeleton modes", () => {
  let root;
  const write = (rel, text) => {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
  };
  const skeleton = (...args) => {
    execFileSync(process.execPath, [SCRIPT, ...args], { cwd: root, stdio: "pipe" });
    return fs.readFileSync(path.join(root, "tmp/skeleton.txt"), "utf8");
  };

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "skel-"));
    write("README.md", README);
    write("src/core/dimensions.js", "export const DIMENSIONS = {};");
    write(
      "src/core/work.js",
      "export function main() { return 1; }\nfunction helperOne() { return 1; }\nfunction helperTwo() { return 2; }"
    );
    write(
      "src/topics/sub/leaf/index.js",
      'import { V } from "./schema.js";\nexport const leafTopic = Object.freeze({ id: "leaf", varsDb: V });'
    );
    write(
      "src/topics/sub/leaf/schema.js",
      'import { DIMENSIONS } from "../../../core/dimensions.js";\nexport const V = { a: DIMENSIONS };'
    );
    write("src/topics/sub/leaf/relations.js", "export const R = [];");
    write("src/topics/sub/leaf/system.js", "export function createLeafSystem() { return {}; }");
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  test("slim mode: one line per file with export and local function names", () => {
    const out = skeleton();
    assert.match(out, /src\/core\/work\.js \(3 lines\) \| exports: main \| locals: helperOne, helperTwo/);
  });

  test("slim mode: topic leaf collapses to one line with only external imports", () => {
    const out = skeleton();
    assert.match(out, /topics\/sub\/leaf \| export: leafTopic \| external imports: core\/dimensions/);
    assert.doesNotMatch(out, /src\/topics\/sub\/leaf\/schema\.js/);
  });

  test("slim mode: README keeps sections 0-3 and 10-12, stubs 4-9", () => {
    const out = skeleton();
    assert.match(out, /## 3\. Section 3/);
    assert.match(out, /## 10\. Section 10/);
    assert.doesNotMatch(out, /## 6\. Section 6/);
    assert.match(out, /--authoring/);
  });

  test("--authoring: slim skeleton with the full README", () => {
    const out = skeleton("--authoring");
    assert.match(out, /## 6\. Section 6/);
    assert.match(out, /topics\/sub\/leaf \| export: leafTopic/);
  });

  test("--full: full skeleton and full README", () => {
    const out = skeleton("--full");
    assert.match(out, /FILE: src\/topics\/sub\/leaf\/schema\.js/);
    assert.match(out, /## 6\. Section 6/);
  });

  test("path filter gives full detail for matching files", () => {
    const out = skeleton("core/work");
    assert.match(out, /FILE: src\/core\/work\.js/);
    assert.match(out, /local fn helperOne/);
  });
});
