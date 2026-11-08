import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseMathAST, evalAST } from "../src/core/ast.js";
import { isolateVariable } from "../src/core/algebra.js";
import { TOPICS } from "../app.js";
import { validateTopic } from "../src/core/validator.js";

describe("Compiler Pipeline Integrity", () => {
  test("AST Parser & Evaluator", () => {
    const ast = parseMathAST("2 * pi * 5");
    const val = evalAST(ast, {});
    assert.ok(Math.abs(val - 10 * Math.PI) < 1e-6);
  });

  test("AST Inversion - Multi-variable Product", () => {
    const res = isolateVariable("P_b = (2 * pi * n * T) / 60000", "T");
    assert.equal(res.success, true);
    assert.equal(res.isolatedRhs, "((P_b * 60000) / (2 * pi)) / n");
  });

  test("Spur Gears Topic Ground Truth Verification", () => {
    const report = validateTopic(TOPICS.spur_gears);
    assert.equal(report.errors.length, 0);
  });

  test("Helical Gears Topic Ground Truth Verification", () => {
    const report = validateTopic(TOPICS.helical_gears);
    assert.equal(report.errors.length, 0);
  });
});
