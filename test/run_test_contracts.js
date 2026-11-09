/**
 * test/run_test_contracts.js
 * Exhaustive relation-level contracts. Complements run_test.js (which validates
 * whatever the generator happens to emit) by auditing EVERY declared relation
 * and EVERY schema var, whether or not the generator can reach them.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { ALL_TOPICS } from "../src/topics/index.js";
import { DIMENSIONS } from "../src/core/dimensions.js";
import { isolateVariable } from "../src/cas/algebra.js";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Tolerant probe: works whether isolateVariable returns a string, an AST, or throws. */
function canIsolate(baseFormula, target) {
  try {
    const out = isolateVariable(baseFormula, target);
    if (out == null) return false;
    if (typeof out === "string" && out.trim().length === 0) return false;
    return true;
  } catch {
    return false;
  }
}

/** Documented scale contract for dimensionless quantities. */
const SCALE_RANGES = Object.freeze({
  fraction: [0, 1],
  percent:  [0, 100],
  ratio:    [0, Infinity],
  count:    [0, Infinity]
});

/** Matches a bare literal 100, but not the "100" inside 3600. */
const HAS_LITERAL_100 = /(^|[^\w.])100([^\w.]|$)/;

function splitAssignment(baseFormula) {
  const i = baseFormula.indexOf("=");
  return { lhs: baseFormula.slice(0, i).trim(), rhs: baseFormula.slice(i + 1) };
}

/* ------------------------------------------------------------------ *
 * 1. Invertibility Contract Audit
 * ------------------------------------------------------------------ */

describe("Relation Invertibility Contract Audit", () => {
  for (const topic of ALL_TOPICS) {
    test(`${topic.id}: declared "solvable" set matches actual CAS capability`, () => {
      const violations = [];

      for (const rel of topic.relations) {
        const declared = Array.isArray(rel.solvable) ? new Set(rel.solvable) : null;
        const empiric = new Set(rel.nodes.filter((n) => canIsolate(rel.baseFormula, n)));

        if (declared) {
          // Over-promising: solver will fail at runtime on a target we advertised.
          for (const n of declared) {
            if (!empiric.has(n)) {
              violations.push(
                `[${rel.id}] "solvable" lists "${n}" but the CAS cannot isolate it from:\n` +
                `        ${rel.baseFormula}`
              );
            }
          }
          // Under-declaring: dead capability / stale allowlist.
          for (const n of empiric) {
            if (!declared.has(n)) {
              violations.push(
                `[${rel.id}] the CAS CAN isolate "${n}" but it is absent from "solvable".\n` +
                `        Suggested: solvable: [${[...empiric].map((x) => `"${x}"`).join(", ")}]`
              );
            }
          }
        } else {
          // No allowlist == "every node is a legal target". Verify that promise.
          for (const n of rel.nodes) {
            if (!empiric.has(n)) {
              violations.push(
                `[${rel.id}] cannot isolate "${n}" and no "solvable" allowlist is declared.\n` +
                `        ${rel.baseFormula}\n` +
                `        Fix: add  solvable: [${[...empiric].map((x) => `"${x}"`).join(", ")}]`
              );
            }
          }
        }
      }

      assert.deepEqual(
        violations, [],
        `${topic.id} — ${violations.length} invertibility violation(s):\n\n- ${violations.join("\n\n- ")}\n`
      );
    });
  }
});

/* ------------------------------------------------------------------ *
 * 2. Dimensionless Scale Convention Audit
 * ------------------------------------------------------------------ */

describe("Dimensionless Scale Convention Audit", () => {
  for (const topic of ALL_TOPICS) {
    test(`${topic.id}: every dimensionless var declares a scale`, () => {
      const missing = Object.entries(topic.varsDb)
        .filter(([, m]) => m.dimension === DIMENSIONS.DIMENSIONLESS && !m.scale)
        .map(([k]) => `${k} (declared unit "${munit(topic, k)}")`);

      assert.deepEqual(
        missing, [],
        `${topic.id}: dimensionless vars missing  scale: "fraction"|"percent"|"ratio"|"count"\n- ${missing.join("\n- ")}`
      );
    });

    test(`${topic.id}: "× 100" in a formula implies a percent-scaled LHS`, () => {
      const violations = [];

      for (const rel of topic.relations) {
        const { lhs, rhs } = splitAssignment(rel.baseFormula);
        const meta = topic.varsDb[lhs];
        if (!meta || meta.dimension !== DIMENSIONS.DIMENSIONLESS) continue;

        const scalesBy100 = HAS_LITERAL_100.test(rhs);

        if (scalesBy100 && meta.scale !== "percent") {
          violations.push(
            `[${rel.id}] RHS multiplies by 100 but LHS "${lhs}" is scale:"${meta.scale}".\n` +
            `        system.js will emit a fraction while the relation emits a whole number.`
          );
        }
        if (!scalesBy100 && meta.scale === "percent") {
          violations.push(
            `[${rel.id}] LHS "${lhs}" is scale:"percent" but RHS never multiplies by 100.`
          );
        }
      }

      assert.deepEqual(violations, [], `${topic.id}:\n- ${violations.join("\n- ")}`);
    });
  }
});

function munit(topic, k) { return topic.varsDb[k]?.unit ?? "?"; }

/* ------------------------------------------------------------------ *
 * 3. Multi-Sample Fuzz — physical invariants over many draws
 * ------------------------------------------------------------------ */

describe("Multi-Sample Physical Invariant Fuzz", () => {
  const SAMPLES = 200;

  for (const topic of ALL_TOPICS) {
    test(`${topic.id}: ${SAMPLES} random systems stay finite and in-scale`, () => {
      const violations = [];

      for (let i = 0; i < SAMPLES; i++) {
        const sys = topic.createSystem();

        for (const [k, meta] of Object.entries(topic.varsDb)) {
          const v = sys[k];

          if (typeof v !== "number" || !Number.isFinite(v)) {
            violations.push(`sample #${i}: ${k} = ${v} (non-finite — likely div-by-zero or NaN propagation)`);
            continue;
          }

          const range = SCALE_RANGES[meta.scale];
          if (range && (v < range[0] || v > range[1])) {
            violations.push(`sample #${i}: ${k} = ${v} violates scale:"${meta.scale}" range [${range[0]}, ${range[1]}]`);
          }
        }

        if (violations.length >= 25) break; // fail fast, keep TAP readable
      }

      assert.deepEqual(
        violations.slice(0, 25), [],
        `${topic.id}: ${violations.length} invariant violation(s) across ${SAMPLES} samples:\n- ${violations.slice(0, 25).join("\n- ")}`
      );
    });
  }
});

/* ------------------------------------------------------------------ *
 * 4. System Ground-Truth Completeness
 * ------------------------------------------------------------------ */

describe("System Ground-Truth Completeness Contract", () => {
  for (const topic of ALL_TOPICS) {
    test(`${topic.id}: createSystem() fully covers varsDb, _u and _names`, () => {
      const sys = topic.createSystem();
      const keys = Object.keys(topic.varsDb);

      const missingValue = keys.filter((k) => !(k in sys));
      const missingUnit  = keys.filter((k) => !sys._u?.[k]);
      const missingName  = keys.filter((k) => !sys._names?.[k]);
      const orphanUnit   = Object.keys(sys._u ?? {}).filter((k) => !topic.varsDb[k]);
      const orphanName   = Object.keys(sys._names ?? {}).filter((k) => !topic.varsDb[k]);

      assert.deepEqual(missingValue, [], `${topic.id}: vars absent from system output: ${missingValue}`);
      assert.deepEqual(missingUnit,  [], `${topic.id}: vars absent from _u: ${missingUnit}`);
      assert.deepEqual(missingName,  [], `${topic.id}: vars absent from _names: ${missingName}`);
      assert.deepEqual(orphanUnit,   [], `${topic.id}: _u keys not in varsDb: ${orphanUnit}`);
      assert.deepEqual(orphanName,   [], `${topic.id}: _names keys not in varsDb: ${orphanName}`);
    });

    test(`${topic.id}: every relation node exists in varsDb (and no orphans)`, () => {
      const undefinedNodes = [];
      const referenced = new Set();

      for (const rel of topic.relations) {
        for (const n of rel.nodes) {
          referenced.add(n);
          if (!topic.varsDb[n]) undefinedNodes.push(`${rel.id} → "${n}"`);
        }
      }

      const orphanVars = Object.keys(topic.varsDb).filter((k) => !referenced.has(k));

      assert.deepEqual(undefinedNodes, [], `${topic.id}: relation nodes missing from varsDb:\n- ${undefinedNodes.join("\n- ")}`);
      assert.deepEqual(orphanVars, [], `${topic.id}: varsDb entries never referenced by any relation (dead schema):\n- ${orphanVars.join("\n- ")}`);
    });
  }
});

/* ------------------------------------------------------------------ *
 * 5. Deep-Freeze / Shared Descriptor Integrity
 *    (...COMMON_VARS shallow-copies, so nested descriptors are SHARED
 *     by reference across every topic that spreads them.)
 * ------------------------------------------------------------------ */

describe("Immutable Schema Integrity", () => {
  test("all topic objects, relations and var descriptors are deep-frozen", () => {
    const leaks = [];

    for (const topic of ALL_TOPICS) {
      if (!Object.isFrozen(topic))          leaks.push(`${topic.id} (topic object)`);
      if (!Object.isFrozen(topic.varsDb))   leaks.push(`${topic.id}.varsDb`);
      if (!Object.isFrozen(topic.relations))leaks.push(`${topic.id}.relations`);

      for (const [k, meta] of Object.entries(topic.varsDb)) {
        if (!Object.isFrozen(meta)) leaks.push(`${topic.id}.varsDb.${k}`);
      }
      for (const rel of topic.relations) {
        if (!Object.isFrozen(rel)) leaks.push(`${topic.id}.relations[${rel.id}]`);
      }
    }

    assert.deepEqual(
      leaks, [],
      `Mutable schema objects — a write to any of these corrupts EVERY topic sharing the descriptor:\n- ${leaks.join("\n- ")}\n\n` +
      `Fix: export a deepFreeze() util and wrap each descriptor in the common schemas.`
    );
  });
});

/* ------------------------------------------------------------------ *
 * 6. Cross-Topic Namespace Consistency
 * ------------------------------------------------------------------ */

describe("Cross-Topic Namespace Consistency", () => {
  test("no variable name carries conflicting dimension/unit across topics", () => {
    const registry = new Map();
    const conflicts = [];

    for (const topic of ALL_TOPICS) {
      for (const [k, meta] of Object.entries(topic.varsDb)) {
        const sig = `${meta.dimension}|${meta.unit}`;
        const hit = registry.get(k);

        if (!hit) {
          registry.set(k, { sig, owner: topic.id });
        } else if (hit.sig !== sig) {
          conflicts.push(`"${k}": ${hit.sig} in [${hit.owner}]  vs  ${sig} in [${topic.id}]`);
        }
      }
    }

    assert.deepEqual(
      conflicts, [],
      `Name collisions with divergent units break cross-topic chaining and the unit sampler:\n- ${conflicts.join("\n- ")}`
    );
  });
});
