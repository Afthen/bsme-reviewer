/**
 * test/patch_test.js
 * Regression tests for scripts/lib/patch_parse.js, scripts/lib/patch_apply.js,
 * and scripts/apply_patch.js (diff, subst exact-count & atomicity, N+1 fences, headers, LF).
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parsePatch } from "../scripts/lib/patch_parse.js";
import { applyPatch } from "../scripts/lib/patch_apply.js";

const F3 = "`".repeat(3);
const F4 = "`".repeat(4);
const F5 = "`".repeat(5);
const M4L = "<".repeat(4);
const M4E = "=".repeat(4);
const M4R = ">".repeat(4);
const M5L = "<".repeat(5);
const M5E = "=".repeat(5);
const M5R = ">".repeat(5);
const CLI_PATH = path.resolve("scripts/apply_patch.js");

function withTempRepo(files, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "patch-test-"));
  try {
    for (const [rel, text] of Object.entries(files)) {
      const full = path.join(root, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text, "utf8");
    }
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function mkHunk(search, replace, len = 4) {
  const l = len === 5 ? M5L : M4L;
  const e = len === 5 ? M5E : M4E;
  const r = len === 5 ? M5R : M4R;
  return `${l}\n${search}\n${e}\n${replace}\n${r}`;
}

describe("patch_parse", () => {
  test("N+1 fence wrapping preserves inner fences without early close", () => {
    const inner = `${F4}markdown\n${F3}bash\necho hi\n${F3}\n${F4}`;
    const patch = `FILE: docs/a.md\n${F5}markdown\n${inner}\n${F5}`;
    const ops = parsePatch(patch);
    assert.equal(ops.length, 1);
    assert.equal(ops[0].type, "file");
    assert.equal(ops[0].file, "docs/a.md");
    assert.equal(ops[0].content, inner);
  });

  test("rejects headerless diff, headerless code fence, and heading-only paths", () => {
    assert.throws(
      () => parsePatch(`${F3}diff\n${mkHunk("a", "b")}\n${F3}`),
      /missing a FILE: header/
    );
    assert.throws(
      () => parsePatch(`### src/foo.js\n${F3}js\nconst x = 1;\n${F3}`),
      /preceding FILE: header/
    );
    assert.throws(
      () => parsePatch(`FILE: a.js\n${F3}js\nconst x = 1;\n${F3}\n${F3}js\nconst y = 2;\n${F3}`),
      /preceding FILE: header/
    );
  });

  test("sticky FILE: applies to consecutive diffs, but subst clears sticky FILE:", () => {
    const twoDiffs = [
      "FILE: a.js",
      `${F3}diff 1`,
      mkHunk("a", "b"),
      F3,
      `${F3}diff 2`,
      mkHunk("c", "d"),
      F3
    ].join("\n");
    const ops = parsePatch(twoDiffs);
    assert.equal(ops.length, 2);
    assert.equal(ops[0].file, "a.js");
    assert.equal(ops[1].file, "a.js");

    const afterSubst = [
      "FILE: a.js",
      `${F3}diff`,
      mkHunk("a", "b"),
      F3,
      `${F3}subst scope=src expect=1`,
      mkHunk("x", "y"),
      F3,
      `${F3}diff`,
      mkHunk("c", "d"),
      F3
    ].join("\n");
    assert.throws(() => parsePatch(afterSubst), /missing a FILE: header/);
  });

  test("supports 5-char markers when replacement body contains literal 4-char markers", () => {
    const patch = `FILE: README.md\n${F3}diff\n${mkHunk("old", mkHunk("s", "r", 4), 5)}\n${F3}`;
    const ops = parsePatch(patch);
    assert.equal(ops.length, 1);
    assert.equal(ops[0].hunks[0].replace, mkHunk("s", "r", 4));
  });

  test("rejects unclosed fences and dangling FILE: headers", () => {
    assert.throws(() => parsePatch(`FILE: a.js\n${F3}js\nconst x = 1;`), /Unclosed code fence/);
    assert.throws(() => parsePatch("FILE: a.js\n"), /has no following/);
  });
});

describe("patch_apply", () => {
  test("dry-run writes nothing while apply writes full files and diffs atomically", () => {
    withTempRepo({ "src/a.js": "const x = 1;\n" }, (root) => {
      const patch = [
        "FILE: src/a.js",
        `${F3}diff`,
        mkHunk("const x = 1;", "const x = 2;"),
        F3,
        "FILE: src/new/b.js",
        `${F3}javascript`,
        `// contains ${M4L} ${M4E} ${M4R} as literal text`,
        "export const ok = true;",
        F3
      ].join("\n");

      const dry = applyPatch(patch, { root, dryRun: true });
      assert.deepEqual(dry.modifiedFiles, ["src/a.js", "src/new/b.js"]);
      assert.equal(fs.readFileSync(path.join(root, "src/a.js"), "utf8"), "const x = 1;\n");
      assert.equal(fs.existsSync(path.join(root, "src/new/b.js")), false);

      const applied = applyPatch(patch, { root, dryRun: false });
      assert.equal(applied.appliedCount, 2);
      assert.equal(fs.readFileSync(path.join(root, "src/a.js"), "utf8"), "const x = 2;\n");
      assert.match(fs.readFileSync(path.join(root, "src/new/b.js"), "utf8"), /export const ok = true;/);

      const second = applyPatch(patch, { root, dryRun: false });
      assert.deepEqual(second.modifiedFiles, []);
      assert.equal(second.skippedCount, 2);
    });
  });

  test("subst replaces exact count across directory scope and skips if already applied", () => {
    withTempRepo(
      {
        "src/one.js": 'const u1 = "kJ/kg-K";\nconst u2 = "kJ/kg-K";\n',
        "src/sub/two.js": 'const u3 = "kJ/kg-K";\n',
        "docs/note.md": "ignored kJ/kg-K\n"
      },
      (root) => {
        const patch = `${F3}subst scope=src expect=3\n${mkHunk("kJ/kg-K", "kJ/kg-ΔK")}\n${F3}`;
        const res = applyPatch(patch, { root, dryRun: false });
        assert.deepEqual(res.modifiedFiles, ["src/one.js", "src/sub/two.js"]);
        assert.equal(fs.readFileSync(path.join(root, "src/one.js"), "utf8"), 'const u1 = "kJ/kg-ΔK";\nconst u2 = "kJ/kg-ΔK";\n');
        assert.equal(fs.readFileSync(path.join(root, "src/sub/two.js"), "utf8"), 'const u3 = "kJ/kg-ΔK";\n');
        assert.equal(fs.readFileSync(path.join(root, "docs/note.md"), "utf8"), "ignored kJ/kg-K\n");

        const rerun = applyPatch(patch, { root, dryRun: false });
        assert.deepEqual(rerun.modifiedFiles, []);
        assert.equal(rerun.skippedCount, 1);
      }
    );
  });

  test("subst count mismatch writes nothing (atomic across earlier blocks) and lists matches", () => {
    withTempRepo(
      {
        "src/a.js": "const a = 1;\n",
        "src/b.js": "foo();\nfoo();\n"
      },
      (root) => {
        const patch = [
          "FILE: src/a.js",
          `${F3}diff`,
          mkHunk("const a = 1;", "const a = 99;"),
          F3,
          `${F3}subst scope=src expect=5`,
          mkHunk("foo()", "bar()"),
          F3
        ].join("\n");

        assert.throws(
          () => applyPatch(patch, { root, dryRun: false }),
          /expected 5 match\(es\), found 2:[\s\S]*src\/b\.js:1: foo\(\)/
        );
        assert.equal(fs.readFileSync(path.join(root, "src/a.js"), "utf8"), "const a = 1;\n");
        assert.equal(fs.readFileSync(path.join(root, "src/b.js"), "utf8"), "foo();\nfoo();\n");
      }
    );
  });

  test("subst rejects overlapping matches and path escapes", () => {
    withTempRepo({ "src/a.js": "aaa\n" }, (root) => {
      assert.throws(
        () => applyPatch(`${F3}subst scope=src expect=1\n${mkHunk("aa", "bb")}\n${F3}`, { root, dryRun: false }),
        /Overlapping match/
      );
      assert.throws(
        () => applyPatch(`${F3}subst scope=../outside expect=1\n${mkHunk("a", "b")}\n${F3}`, { root, dryRun: false }),
        /escapes repository root/
      );
    });
  });

  test("normalizes CRLF files to LF on write", () => {
    withTempRepo({ "src/win.js": "line1\r\nline2\r\n" }, (root) => {
      const patch = `FILE: src/win.js\n${F3}diff\n${mkHunk("line1", "first")}\n${F3}`;
      applyPatch(patch, { root, dryRun: false });
      assert.equal(fs.readFileSync(path.join(root, "src/win.js"), "utf8"), "first\nline2\n");
    });
  });

  test("CLI supports --dry-run and -y in a temp workspace", () => {
    withTempRepo({ "src/a.js": "hello\n" }, (root) => {
      const patchPath = path.join(root, "p.txt");
      fs.writeFileSync(patchPath, `${F3}subst scope=src/a.js expect=1\n${mkHunk("hello", "world")}\n${F3}`);

      const dryOut = execFileSync(process.execPath, [CLI_PATH, "--dry-run", patchPath], { cwd: root, encoding: "utf8" });
      assert.match(dryOut, /Would write: src\/a\.js/);
      assert.equal(fs.readFileSync(path.join(root, "src/a.js"), "utf8"), "hello\n");

      const applyOut = execFileSync(process.execPath, [CLI_PATH, "-y", patchPath], { cwd: root, encoding: "utf8" });
      assert.match(applyOut, /Updated: src\/a\.js/);
      assert.equal(fs.readFileSync(path.join(root, "src/a.js"), "utf8"), "world\n");
    });
  });
});
