/**
 * test/run_test.js
 * Comprehensive Headless CI Test Runner & Invariant Verification Suite.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ALL_TOPICS, TOPICS } from "../src/topics/index.js";
import { validateTopic } from "./validator.js";
import { generateProblem } from "../src/core/problem_gen.js";
import { buildAlignedDerivation } from "../src/core/derivation.js";

// Enhanced Headless Browser Mock with Tree & Event Tracking
if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}

if (typeof globalThis.document === "undefined") {
  const createMockElement = (id = "", tag = "div") => {
    const listeners = {};
    const children = [];
    const classes = new Set();

    return {
      id,
      tagName: tag.toUpperCase(),
      style: {},
      children,
      classList: {
        add: (...cls) => cls.forEach(c => classes.add(c)),
        remove: (...cls) => cls.forEach(c => classes.delete(c)),
        toggle: (c, force) => {
          if (force !== undefined) {
            if (force) classes.add(c); else classes.delete(c);
            return force;
          }
          if (classes.has(c)) { classes.delete(c); return false; }
          classes.add(c); return true;
        },
        contains: c => classes.has(c)
      },
      appendChild: child => { children.push(child); return child; },
      querySelectorAll: selector => {
        const results = [];
        function walk(node) {
          for (const ch of (node.children || [])) {
            if (selector.startsWith(".") && ch.classList.contains(selector.slice(1))) {
              results.push(ch);
            }
            walk(ch);
          }
        }
        walk({ children });
        return results;
      },
      querySelector: () => null,
      addEventListener: (evt, fn) => {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(fn);
      },
      removeEventListener: (evt, fn) => {
        if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn);
      },
      setAttribute: () => {},
      getAttribute: () => null,
      innerHTML: "",
      textContent: "",
      value: ""
    };
  };

  const elementRegistry = {};

  globalThis.document = {
    getElementById: id => {
      if (!elementRegistry[id]) {
        elementRegistry[id] = createMockElement(id);
      }
      return elementRegistry[id];
    },
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

// ============================================================================
// 1. TOPIC REGISTRY & INVARIANT CONTRACT SUITE (Catches UI & Key Discrepancies)
// ============================================================================
describe("Topic Registry & Architecture Contract Suite", () => {
  test("All topics must have unique IDs and match TOPICS dictionary keys", () => {
    const seenIds = new Set();

    for (const topic of ALL_TOPICS) {
      assert.ok(topic.id, `Encountered topic missing 'id' property: ${JSON.stringify(topic)}`);
      assert.ok(!seenIds.has(topic.id), `Duplicate topic ID detected: '${topic.id}'`);
      seenIds.add(topic.id);

      // Enforces the contract: Key in TOPICS object MUST equal topic.id
      assert.equal(
        TOPICS[topic.id],
        topic,
        `Topic ID mismatch! TOPICS['${topic.id}'] does not resolve to topic '${topic.title}'. Ensure export key matches topic.id.`
      );
    }
  });

  test("All topics must implement required schema contracts", () => {
    for (const topic of ALL_TOPICS) {
      assert.ok(typeof topic.title === "string" && topic.title.length > 0, `Topic '${topic.id}' missing valid title`);
      assert.ok(typeof topic.subject === "string" && topic.subject.length > 0, `Topic '${topic.id}' missing valid subject`);
      assert.ok(topic.varsDb && typeof topic.varsDb === "object", `Topic '${topic.id}' missing varsDb`);
      assert.ok(Array.isArray(topic.relations) && topic.relations.length > 0, `Topic '${topic.id}' relations must be non-empty`);
      assert.ok(typeof topic.createSystem === "function", `Topic '${topic.id}' must implement createSystem() generator`);
    }
  });
});

// ============================================================================
// 2. DUAL-SYSTEM DETERMINISTIC VALIDATION SUITE (Math & Inversion)
// ============================================================================
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

// ============================================================================
// 3. LIFECYCLE & PROBLEM GENERATION SUITE (Tests Switching & Solvability)
// ============================================================================
describe("Topic Switching & Autonomous Problem Generation Lifecycle", () => {
  for (const topic of ALL_TOPICS) {
    test(`Problem Generation & Graph Solvability for: ${topic.title}`, () => {
      const problem = generateProblem(topic, () => 0.5);

      assert.ok(problem, `generateProblem returned null for ${topic.id}`);
      assert.equal(problem.topicId, topic.id, `Generated problem topicId mismatch for ${topic.id}`);
      assert.ok(problem.statement && problem.statement.length > 0, `Problem statement empty for ${topic.id}`);
      assert.ok(Array.isArray(problem.solution) && problem.solution.length > 0, `Solution steps empty for ${topic.id}`);
      assert.ok(Array.isArray(problem.givens) && problem.givens.length > 0, `Givens array empty for ${topic.id}`);

      // Verify each generated step has a valid expected value
      problem.solution.forEach((step, i) => {
        assert.ok(!isNaN(step.expectedVal), `Step ${i + 1} (${step.targetVar}) calculated NaN in topic ${topic.id}`);
      });
    });
  }
});

// ============================================================================
// 4. DERIVATION FIDELITY TEST SUITE
// ============================================================================
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
        assert.ok(!/\\text{[^}]*_/.test(derivLatex), `Unescaped underscore inside \\text{} in step: ${derivLatex}`);
        assert.ok(!/\\cdot\^/.test(derivLatex), `\\cdot cannot take a direct superscript in step: ${derivLatex}`);
        assert.ok(!/\\cancel{\s*}/.test(derivLatex), `Empty cancel bracket in step: ${derivLatex}`);
        assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{"), "Derivation produced illegal nested fraction tower");
      }
    });
  }
});

// ============================================================================
// 5. FRONTEND UI MODULE INTEGRITY SMOKE TESTS
// ============================================================================
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

  test("Verify app.js entry point integrity and dynamic topic exports", async () => {
    const mod = await import("../app.js");
    assert.ok(mod.TOPICS);

    // Verify all registered topics are accessible through the app export
    for (const topic of ALL_TOPICS) {
      assert.ok(mod.TOPICS[topic.id], `app.js TOPICS export is missing topic '${topic.id}'`);
    }
  });
});
