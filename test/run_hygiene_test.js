/**
 * test/run_test_hygiene.js
 * In-Tree Domain Hygiene, Dead Code, Duplication, and Architecture Contract Suite.
 * Runs natively in Node.js without third-party dependencies.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ALL_TOPICS } from "../src/topics/index.js";
import { phi, fib } from "../src/mastery/constants.js";

// ============================================================================
// 1. LEGACY SIBLING SHADOW & DEAD FILE DETECTOR
// ============================================================================
describe("Hygiene: Legacy Sibling Shadows & Deprecated Paths", () => {
  test("Old 'src/cas/units.js' shadow must be deleted in favor of 'src/cas/units/index.js'", () => {
    const legacyUnitsFile = path.resolve("src/cas/units.js");
    assert.ok(
      !fs.existsSync(legacyUnitsFile),
      `Found lingering legacy file: '${legacyUnitsFile}'. Delete this file to prevent import collisions with 'src/cas/units/index.js'.`
    );
  });

  test("Old 'src/repetition/' directory must be deleted in favor of 'src/mastery/'", () => {
    const legacyRepetitionDir = path.resolve("src/repetition");
    assert.ok(
      !fs.existsSync(legacyRepetitionDir),
      `Found lingering legacy folder: '${legacyRepetitionDir}'. Delete this folder to prevent stale references now that 'src/mastery/' is active.`
    );
  });
});

// ============================================================================
// 2. DYNAMIC PHI(N) & FIB(N) MATHEMATICAL FOUNDATION TESTS
// ============================================================================
describe("Hygiene: Dynamic Mathematical Invariants", () => {
  test("Dynamic phi(n) must satisfy Golden Ratio exponential invariants", () => {
    assert.equal(phi(0), 1, "phi(0) must equal 1");
    assert.ok(Math.abs(phi(1) * phi(-1) - 1) < 1e-9, "phi(1) * phi(-1) must equal 1");
    assert.ok(Math.abs(phi(2) - Math.pow(phi(1), 2)) < 1e-9, "phi(2) must equal phi(1)^2");
    assert.ok(phi(1) > 1.618 && phi(1) < 1.6181, "phi(1) must equal ~1.618033");
  });

  test("Dynamic fib(n) must satisfy standard Fibonacci progression", () => {
    assert.equal(fib(0), 0);
    assert.equal(fib(1), 1);
    assert.equal(fib(2), 1);
    assert.equal(fib(3), 2);
    assert.equal(fib(4), 3);
    assert.equal(fib(5), 5);
    assert.equal(fib(6), 8);
    assert.equal(fib(7), 13);
    assert.equal(fib(8), 21);
  });
});

// ============================================================================
// 3. SCHEMA ORPHAN VARIABLE & DEAD DEFINITION DETECTOR
// ============================================================================
describe("Hygiene: Topic Schema & Dead Variable Audit", () => {
  for (const topic of ALL_TOPICS) {
    test(`Topic [${topic.id}] must not contain orphan/dead variables in varsDb`, () => {
      let S = {};
      try {
        S = topic.createSystem();
      } catch {
        S = {};
      }

      const activeVarsInRelations = new Set();
      topic.relations.forEach(r => {
        (r.nodes || []).forEach(n => activeVarsInRelations.add(n));
        if (r.variants) {
          Object.values(r.variants).forEach(v => {
            (v.nodes || []).forEach(n => activeVarsInRelations.add(n));
          });
        }
      });

      const orphanVars = [];

      for (const [varKey, meta] of Object.entries(topic.varsDb)) {
        if (meta.isAbstract) continue;

        const usedInEquations = activeVarsInRelations.has(varKey);
        const generatedInSystem = S[varKey] !== undefined;

        if (!usedInEquations && !generatedInSystem) {
          orphanVars.push(varKey);
        }
      }

      assert.equal(
        orphanVars.length,
        0,
        `Topic '${topic.title}' has ${orphanVars.length} orphan/unused variables in varsDb: [${orphanVars.join(", ")}]. Connect them to relations or remove them.`
      );
    });
  }
});

// ============================================================================
// 4. DUPLICATE EQUATION & RELATION COLLISION DETECTOR
// ============================================================================
describe("Hygiene: Duplicate Equation & Redundancy Detection", () => {
  for (const topic of ALL_TOPICS) {
    test(`Topic [${topic.id}] must not have duplicate relation formulas`, () => {
      const formulaMap = new Map();

      topic.relations.forEach(rel => {
        const rawFormula = rel.baseFormula || "";
        const normalized = rawFormula.replace(/\s+/g, "").toLowerCase();
        if (!normalized) return;

        if (formulaMap.has(normalized)) {
          const conflictingRel = formulaMap.get(normalized);
          assert.fail(
            `Duplicate equation detected in topic '${topic.title}'! Both relation [${conflictingRel.id}] and [${rel.id}] use identical baseFormula: "${rawFormula}"`
          );
        }
        formulaMap.set(normalized, rel);
      });
    });
  }
});

// ============================================================================
// 5. SCHEMA ALIAS COLLISION DETECTOR
// ============================================================================
describe("Hygiene: Schema Human Alias Collision Detection", () => {
  for (const topic of ALL_TOPICS) {
    test(`Topic [${topic.id}] must not contain colliding aliases across different variables`, () => {
      const aliasRegistry = new Map();

      for (const [varKey, meta] of Object.entries(topic.varsDb)) {
        const allAliases = [meta.name, ...(meta.aliases || [])].filter(Boolean);

        for (const alias of allAliases) {
          const normalized = alias.trim().toLowerCase();
          if (normalized.length <= 2 || normalized.startsWith("\\")) continue;

          if (aliasRegistry.has(normalized)) {
            const previousVarKey = aliasRegistry.get(normalized);
            if (previousVarKey !== varKey) {
              assert.fail(
                `Alias collision in topic '${topic.title}'! The alias "${alias}" is claimed by both '${previousVarKey}' and '${varKey}'.`
              );
            }
          } else {
            aliasRegistry.set(normalized, varKey);
          }
        }
      }
    });
  }
});

// ============================================================================
// 6. CROSS-SUBJECT COMMONALITY & ARCHITECTURE GATE
// ============================================================================
describe("Hygiene: Cross-Subject Commonality & Core Architecture Gate", () => {
  test("Entities shared across multiple subjects must be managed in core/ or common/", () => {
    // Map formula signatures to the subjects that use them
    const formulaSubjectMap = new Map();

    ALL_TOPICS.forEach(topic => {
      const subj = topic.subject || "General";
      topic.relations.forEach(rel => {
        const formula = (rel.baseFormula || "").replace(/\s+/g, "").toLowerCase();
        if (!formula) return;

        // Base/common relations explicitly reside in common/ or core/ folders, which is permitted
        const isManagedCommon = rel.id.startsWith("eq_base_") || rel.id.includes("psychrometric");
        if (isManagedCommon) return;

        if (!formulaSubjectMap.has(formula)) {
          formulaSubjectMap.set(formula, new Set());
        }
        formulaSubjectMap.get(formula).add(subj);
      });
    });

    const unmanagedSharedFormulas = [];
    for (const [formula, subjects] of formulaSubjectMap.entries()) {
      if (subjects.size > 1) {
        unmanagedSharedFormulas.push({ formula, subjects: Array.from(subjects) });
      }
    }

    assert.equal(
      unmanagedSharedFormulas.length,
      0,
      `Architectural Violation: Found ${unmanagedSharedFormulas.length} formula(s) shared across multiple subjects without being housed in a managed common/ or core/ file: ${JSON.stringify(unmanagedSharedFormulas, null, 2)}`
    );
  });
});
