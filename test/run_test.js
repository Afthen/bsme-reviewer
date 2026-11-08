/**
 * test/run_tests.js
 * Comprehensive Headless CI Test Runner.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ALL_TOPICS } from "../src/topics/index.js";
import { validateTopic } from "./validator.js";
import { generateProblem } from "../src/core/problem_gen.js";
import { buildAlignedDerivation } from "../src/core/derivation.js";

// Minimal Headless Browser Mocks
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}

if (typeof globalThis.document === "undefined") {
  const createMockElement = (id = "", tag = "div") => ({
    id,
    tagName: tag.toUpperCase(),
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    appendChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    innerHTML: "",
    textContent: "",
    value: ""
  });

  globalThis.document = {
    getElementById: id => createMockElement(id),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: tag => createMockElement("", tag),
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

if (typeof globalThis.localStorage === "undefined") {
  const store = {};
  globalThis.localStorage = {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// 1. Dual-System Deterministic Validation Suite
describe("Engineering Topics Ground Truth & AST Inversion Suite", () => {
  for (const topic of ALL_TOPICS) {
    test(`Topic: ${topic.title} (${topic.id}) - Deterministic SI & US`, () => {
      const report = validateTopic(topic);

      if (report.errors.length > 0) {
        console.error(`\n[FAIL] ${topic.title} encountered ${report.errors.length} errors:`);
        report.errors.forEach(err => console.error(`  - ${err}`));
      }

      assert.equal(
        report.errors.length,
        0,
        `${topic.title} has ${report.errors.length} validation errors (tested ${report.testedPairs} pairs).`
      );
    });
  }
});

// 2. Derivation Fidelity Test Suite
describe("Derivation Fidelity & Factor-Label Typesetting", () => {
  for (const topic of ALL_TOPICS) {
    test(`Derivation output for ${topic.title}`, () => {
      const problem = generateProblem(topic, () => 0.5);
      assert.ok(problem.solution.length > 0, "Problem generated zero solution steps");

      for (const step of problem.solution) {
        const derivLatex = buildAlignedDerivation(
          step,
          problem.system,
          problem.allSteps,
          problem.varsDb,
          topic.relations
        );

        assert.ok(derivLatex.includes("\\boxed{"), "Derivation step missing boxed answer");
        assert.ok(derivLatex.includes("="), "Derivation step missing equality");
        // Verify no nested fraction towers
        assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{"), "Derivation produced illegal nested fraction tower");
      }
    });
  }
});

// 3. UI Module & Static Export Integrity Suite
describe("Frontend UI Module & Import Integrity Smoke Tests", () => {
  test("Verify src/ui/sidebar_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/sidebar_view.js");
    assert.equal(typeof mod.initSidebarView, "function");
    assert.equal(typeof mod.renderSidebar, "function");
    assert.equal(typeof mod.renderMasteryBars, "function");
  });

  test("Verify src/ui/carousel_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/carousel_view.js");
    assert.equal(typeof mod.attachTooltips, "function");
    assert.equal(typeof mod.openCarouselForVariable, "function");
  });

  test("Verify src/ui/problem_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/problem_view.js");
    assert.equal(typeof mod.renderProblemView, "function");
  });

  test("Verify app.js entry point integrity and topic export", async () => {
    const mod = await import("../app.js");
    assert.ok(mod.TOPICS);
    assert.ok(mod.TOPICS.spur_gears);
    assert.ok(mod.TOPICS.helical_gears);
  });
});
