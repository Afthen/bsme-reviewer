/**
 * test/patch_format_test.js
 * Unified patch format (path in the fence info string, many hunks per block, per-hunk expect=N,
 * directory paths), legacy forms, dry-run staging for diff and subst, and failure atomicity.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyPatch } from "../scripts/lib/patch_apply.js";

const F = "`".repeat(3);
const block = (info, body) => `${F}${info}\n${body}\n${F}`;
const hunk = (s, r, attrs = "") => `<<<<${attrs}\n${s}\n====\n${r}\n>>>>`;
const read = (root, rel) => fs.readFileSync(path.join(root, rel), "utf8");

function withRepo(files, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "patch-format-"));
  try {
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), text);
    }
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("One block applies several hunks, including a per-hunk expect=N, and re-applying is a no-op", () => {
  withRepo({ "src/a.js": "foo\nx\nx\n" }, root => {
    const patch = block("diff src/a.js", [hunk("foo", "bar"), hunk("x", "y", " expect=2")].join("\n"));
    const first = applyPatch(patch, { root, dryRun: false });
    assert.deepEqual(first.modifiedFiles, ["src/a.js"]);
    assert.equal(read(root, "src/a.js"), "bar\ny\ny\n");

    const second = applyPatch(patch, { root, dryRun: false });
    assert.deepEqual(second.modifiedFiles, []);
    assert.equal(second.skippedCount, 2);
  });
});

test("A directory path applies an exact-count substitution across the scope", () => {
  withRepo({ "src/one.js": "k\nk\n", "src/sub/two.js": "k\n", "docs/n.md": "k\n" }, root => {
    const res = applyPatch(block("diff src", hunk("k", "z", " expect=3")), { root, dryRun: false });
    assert.deepEqual(res.modifiedFiles, ["src/one.js", "src/sub/two.js"]);
    assert.equal(read(root, "docs/n.md"), "k\n");
  });
});

test("A count mismatch throws and writes nothing", () => {
  withRepo({ "a.js": "one\n" }, root => {
    assert.throws(() => applyPatch(block("diff a.js", hunk("one", "1", " expect=2")), { root, dryRun: false }), /expected 2 match/);
    assert.equal(read(root, "a.js"), "one\n");
  });
});

test("A full-file block takes its path from the fence info string", () => {
  withRepo({}, root => {
    applyPatch(block("javascript src/new/mod.js", "export const A = 1;"), { root, dryRun: false });
    assert.equal(read(root, "src/new/mod.js"), "export const A = 1;\n");
  });
});

test("Dry-run stages both new-format diffs and legacy subst without writing", () => {
  withRepo({ "src/a.js": "hello\n" }, root => {
    for (const patch of [
      block("subst scope=src expect=1", hunk("hello", "world")),
      block("diff src/a.js", hunk("hello", "world"))
    ]) {
      const res = applyPatch(patch, { root, dryRun: true });
      assert.deepEqual(res.modifiedFiles, ["src/a.js"]);
      assert.equal(read(root, "src/a.js"), "hello\n");
    }
  });
});

test("A later failing block leaves earlier blocks unwritten", () => {
  withRepo({ "a.js": "one\n", "b.js": "two\n" }, root => {
    const patch = [block("diff a.js", hunk("one", "1")), block("diff b.js", hunk("missing", "x"))].join("\n");
    assert.throws(() => applyPatch(patch, { root, dryRun: false }), /Search block not found/);
    assert.equal(read(root, "a.js"), "one\n");
    assert.equal(read(root, "b.js"), "two\n");
  });
});

test("Legacy FILE: + diff and subst forms are still accepted", () => {
  withRepo({ "a.js": "hello\n", "b.js": "left\n" }, root => {
    const patch = [
      "FILE: a.js",
      block("diff", hunk("hello", "world")),
      block("subst scope=b.js expect=1", hunk("left", "right"))
    ].join("\n");
    applyPatch(patch, { root, dryRun: false });
    assert.equal(read(root, "a.js"), "world\n");
    assert.equal(read(root, "b.js"), "right\n");
  });
});
