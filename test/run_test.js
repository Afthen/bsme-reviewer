/**
 * test/run_tests.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Comprehensive Headless CI Test Runner
 * ============================================================================
 * 1. Topic Verification Suite:
 *    Audits AST inversion, self-reference, and physical ground-truth accuracy.
 * 2. Zero-Dependency UI Module Integrity Suite:
 *    Simulates minimal browser globals so Node.js imports and statically verifies
 *    every single frontend UI module (problem_view, sidebar_view, carousel_view, app.js).
 *    Guarantees no missing exports, broken paths, or syntax errors reach production.
 * ============================================================================
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ALL_TOPICS } from "../src/topics/index.js";
import { validateTopic } from "./validator.js";

// ========================================================
// 1. MINIMAL HEADLESS BROWSER MOCKS (ZERO NPM DEPENDENCIES)
// ========================================================

if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}

if (typeof globalThis.document === "undefined") {
  const createMockElement = (id = "", tag = "div") => ({
    id,
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
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

// ========================================================
// 2. TOPIC SCHEMAS & PHYSICAL GROUND-TRUTH SUITE
// ========================================================

describe("Engineering Topics Ground Truth & AST Inversion Suite", () => {
  for (const topic of ALL_TOPICS) {
    test(`Topic: ${topic.title} (${topic.id})`, () => {
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

// ========================================================
// 3. UI MODULE & STATIC EXPORT INTEGRITY SUITE
// ========================================================

describe("Frontend UI Module & Import Integrity Smoke Tests", () => {
  test("Verify src/ui/sidebar_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/sidebar_view.js");
    assert.equal(typeof mod.initSidebarView, "function", "Missing initSidebarView export");
    assert.equal(typeof mod.renderSidebar, "function", "Missing renderSidebar export");
    assert.equal(typeof mod.renderMasteryBars, "function", "Missing renderMasteryBars export");
  });

  test("Verify src/ui/carousel_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/carousel_view.js");
    assert.equal(typeof mod.attachTooltips, "function", "Missing attachTooltips export");
    assert.equal(typeof mod.openCarouselForVariable, "function", "Missing openCarouselForVariable export");
  });

  test("Verify src/ui/problem_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/problem_view.js");
    assert.equal(typeof mod.renderProblemView, "function", "Missing renderProblemView export");
  });

  test("Verify app.js entry point integrity and topic export", async () => {
    const mod = await import("../app.js");
    assert.ok(mod.TOPICS, "app.js failed to export TOPICS dictionary");
    assert.ok(mod.TOPICS.spur_gears, "app.js missing spur_gears topic registration");
    assert.ok(mod.TOPICS.helical_gears, "app.js missing helical_gears topic registration");
  });
});
