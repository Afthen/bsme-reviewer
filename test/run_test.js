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
import { runTopicMixTests } from "./topic_mix_test.js";
import { recordAttempt, getDecayedMastery, FADING_THRESHOLD } from "../src/mastery/index.js";
import { pruneSolutionPath, solveDAG } from "../src/core/graph_solver.js";
import {
  sampleSystemMode, sampleByInverseTokens, retainsSufficientSigFigs,
  applyProblemUnitSampling
} from "../src/core/unit_sampler.js";
import { getOklabMasteryColor } from "../src/ui/sidebar_view.js";

// Headless Browser Mock
if (typeof globalThis.window === "undefined") globalThis.window = globalThis;
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
      if (!elementRegistry[id]) elementRegistry[id] = createMockElement(id);
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
// 1. TOPIC REGISTRY & INVARIANT CONTRACT SUITE
// ============================================================================
describe("Topic Registry & Architecture Contract Suite", () => {
  test("All topics must have unique IDs and match TOPICS dictionary keys", () => {
    const seenIds = new Set();
    for (const topic of ALL_TOPICS) {
      assert.ok(topic.id, `Encountered topic missing 'id' property: ${JSON.stringify(topic)}`);
      assert.ok(!seenIds.has(topic.id), `Duplicate topic ID detected: '${topic.id}'`);
      seenIds.add(topic.id);
      assert.equal(
        TOPICS[topic.id],
        topic,
        `Topic ID mismatch! TOPICS['${topic.id}'] does not resolve to topic '${topic.title}'.`
      );
    }
  });

  test("All topics must implement required schema contracts", () => {
    for (const topic of ALL_TOPICS) {
      assert.ok(typeof topic.title === "string" && topic.title.length > 0);
      assert.ok(typeof topic.subject === "string" && topic.subject.length > 0);
      assert.ok(topic.varsDb && typeof topic.varsDb === "object");
      assert.ok(Array.isArray(topic.relations) && topic.relations.length > 0);
      assert.ok(typeof topic.createSystem === "function");
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
      assert.equal(
        report.errors.length,
        0,
        `${topic.title} has ${report.errors.length} validation errors (tested ${report.testedPairs} pairs).`
      );
    });
  }
});

// ============================================================================
// 3. LIFECYCLE & PROBLEM GENERATION SUITE
// ============================================================================
describe("Topic Switching & Autonomous Problem Generation Lifecycle", () => {
  for (const topic of ALL_TOPICS) {
    test(`Problem Generation & Graph Solvability for: ${topic.title}`, () => {
      const problem = generateProblem(topic, () => 0.5);
      assert.ok(problem);
      assert.equal(problem.topicId, topic.id);
      assert.ok(problem.statement.length > 0);
      assert.ok(problem.solution.length > 0);
      assert.ok(problem.givens.length > 0);

      problem.solution.forEach((step, i) => {
        assert.ok(!isNaN(step.expectedVal), `Step ${i + 1} (${step.targetVar}) calculated NaN in topic ${topic.id}`);
      });
    });
  }
});

// ============================================================================
// 4. DERIVATION FIDELITY & NO-COMMA UNIT TYPESETTING TEST SUITE
// ============================================================================
describe("Derivation Fidelity & No-Comma Unit Typesetting", () => {
  for (const topic of ALL_TOPICS) {
    test(`Derivation output for ${topic.title}: strict no-comma before units`, () => {
      const problem = generateProblem(topic, () => 0.5);
      assert.ok(problem.solution.length > 0);

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
        assert.ok(!/\\text{[^}]*_/.test(derivLatex), `Unescaped underscore inside \\text{}`);
        assert.ok(!/\\cdot\^/.test(derivLatex), `\\cdot cannot take a direct superscript`);
        assert.ok(!/\\cancel{\s*}/.test(derivLatex), `Empty cancel bracket`);
        assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{"), "Produces illegal nested fraction tower");

        // Request 3: Verified automated test - zero commas before units
        assert.ok(
          !/,\s*\\text{/.test(derivLatex),
          `Illegal comma before \\text{unit} found in: ${derivLatex}`
        );
        assert.ok(
          !/,\s*\\cancel{/.test(derivLatex),
          `Illegal comma before \\cancel{unit} found in: ${derivLatex}`
        );
        assert.ok(
          !/,\s*°/.test(derivLatex),
          `Illegal comma before degree symbol found in: ${derivLatex}`
        );
        assert.ok(
          !/,\s*\\cfrac{/.test(derivLatex),
          `Illegal comma before \\cfrac unit compound found in: ${derivLatex}`
        );
      }
    });
  }

  test("Additive like-unit terms factor into (a ± b)\\,unit outside parentheses", () => {
    const step = {
      targetVar: "W_net",
      baseFormula: "W_net = Q_A - Q_R",
      nodes: ["W_net", "Q_A", "Q_R"],
      expectedVal: 450
    };
    const S = {
      Q_A: 1200,
      Q_R: 750,
      W_net: 450,
      _u: { Q_A: "kJ/kg", Q_R: "kJ/kg", W_net: "kJ/kg" }
    };
    const varsDb = {
      Q_A: { symbol: "q_A", unit: "kJ/kg" },
      Q_R: { symbol: "q_R", unit: "kJ/kg" },
      W_net: { symbol: "w_{net}", unit: "kJ/kg" }
    };

    const deriv = buildAlignedDerivation(step, S, [step], varsDb, []);
    assert.ok(
      deriv.includes("(1200 - 750)") || deriv.includes("(1200 - 750)\\,\\cfrac{\\text{kJ}}{\\text{kg}}"),
      `Expected factored additive expression without per-variable units, got: ${deriv}`
    );
    assert.ok(!deriv.includes("1200\\,\\cfrac{\\text{kJ}}{\\text{kg}} - 750\\,\\cfrac{\\text{kJ}}{\\text{kg}}"));
  });
});

// ============================================================================
// 5. UNIT SAMPLER: 40-40-20 & INVERSE TOKEN PROBABILITY SUITE
// ============================================================================
describe("Unit Sampler: 40-40-20, Inverse-Token Compound Weights & Sig-Fig Retention", () => {
  test("sampleSystemMode satisfies 40% SI / 40% US / 20% MIXED bounds over large sample", () => {
    const trials = 10000;
    const counts = { SI: 0, US: 0, MIXED: 0 };
    for (let i = 0; i < trials; i++) {
      counts[sampleSystemMode()]++;
    }
    const pSI = counts.SI / trials;
    const pUS = counts.US / trials;
    const pMIX = counts.MIXED / trials;

    assert.ok(pSI > 0.37 && pSI < 0.43, `SI ratio out of bounds: ${pSI}`);
    assert.ok(pUS > 0.37 && pUS < 0.43, `US ratio out of bounds: ${pUS}`);
    assert.ok(pMIX > 0.17 && pMIX < 0.23, `MIXED ratio out of bounds: ${pMIX}`);
  });

  test("sampleByInverseTokens matches w_i = 1/t_i relative probability math", () => {
    // W (1 token) is twice as likely as J/s (2 tokens), thrice as likely as N-m/s (3 tokens), sixce as kg*m^2/s^3 (6 tokens)
    const candidates = [
      { unit: "W", tokens: 1 },
      { unit: "J/s", tokens: 2 },
      { unit: "N-m/s", tokens: 3 },
      { unit: "kg*m^2/s^3", tokens: 6 }
    ];

    const counts = { "W": 0, "J/s": 0, "N-m/s": 0, "kg*m^2/s^3": 0 };
    const trials = 30000;
    for (let i = 0; i < trials; i++) {
      counts[sampleByInverseTokens(candidates)]++;
    }

    // Expected shares: 50% W (6/12), 25% J/s (3/12), 16.67% N-m/s (2/12), 8.33% kg*m^2/s^3 (1/12)
    const ratioW_to_Js = counts["W"] / counts["J/s"];
    const ratioW_to_Nms = counts["W"] / counts["N-m/s"];
    const ratioW_to_Base = counts["W"] / counts["kg*m^2/s^3"];

    assert.ok(Math.abs(ratioW_to_Js - 2.0) < 0.25, `Expected W:J/s ~ 2, got ${ratioW_to_Js}`);
    assert.ok(Math.abs(ratioW_to_Nms - 3.0) < 0.35, `Expected W:N-m/s ~ 3, got ${ratioW_to_Nms}`);
    assert.ok(Math.abs(ratioW_to_Base - 6.0) < 0.70, `Expected W:kg*m^2/s^3 ~ 6, got ${ratioW_to_Base}`);
  });

  test("Significant figure filter prevents wildly inappropriate units (km for pitch diameter)", () => {
    // 60 mm converted to km = 0.00006 km -> rounds to 0.000 (0 sig figs) -> fails
    assert.equal(retainsSufficientSigFigs(0.00006), false);
    // 60 mm converted to m = 0.06 m -> rounds to 0.060 (at most 2 sig figs) -> fails
    assert.equal(retainsSufficientSigFigs(0.06), false);
    // 60 mm converted to cm = 6.0 cm -> retains sufficient resolution -> passes
    assert.equal(retainsSufficientSigFigs(6.0), true);
    // 60 mm converted to in = 2.362 in -> passes
    assert.equal(retainsSufficientSigFigs(2.362), true);
  });

  test("applyProblemUnitSampling partitions variables 50-50 in MIXED mode", () => {
    const topic = TOPICS.spur_gears;
    const S = topic.createSystem({ sys: "SI" });
    const res = applyProblemUnitSampling({ ...S, _u: { ...S._u } }, topic.varsDb, "MIXED");

    assert.equal(res.sys, "MIXED");
    let siCount = 0;
    let usCount = 0;
    const usUnitStrings = new Set(["in", "teeth/in", "hp", "lb-in", "lb", "psi"]);

    Object.entries(res._u).forEach(([k, u]) => {
      if (usUnitStrings.has(u)) usCount++;
      else if (["mm", "m", "m/s", "kW", "N-m", "N", "MPa"].includes(u)) siCount++;
    });

    assert.ok(siCount > 0 && usCount > 0, "MIXED mode must contain both SI and US units");
  });
});

// ============================================================================
// 6. SPECIFIC ENERGY LOWERCASE NOTATION VERIFICATION
// ============================================================================
describe("Thermodynamic Specific Energy Notation Contract", () => {
  test("Specific Energy parameters in diesel cycle use lowercase notation (q_A, q_R, w_{net})", () => {
    const db = TOPICS.powerplant_design_diesel_cycle.varsDb;
    assert.equal(db.Q_A.symbol, "q_A", "Specific heat addition must use lowercase q_A");
    assert.equal(db.Q_R.symbol, "q_R", "Specific heat rejection must use lowercase q_R");
    assert.equal(db.W_net.symbol, "w_{net}", "Specific net work must use lowercase w_{net}");
  });
});

// ============================================================================
// 7. OKLAB CONTINUOUS COLOR GRADIENT VERIFICATION
// ============================================================================
describe("Oklab Continuous Mastery Color Gradient", () => {
  test("getOklabMasteryColor generates valid oklab(L a b) values across spectrum", () => {
    const c0 = getOklabMasteryColor(0.0);
    const c5 = getOklabMasteryColor(0.5);
    const c10 = getOklabMasteryColor(1.0);

    assert.ok(c0.startsWith("oklab("));
    assert.ok(c5.startsWith("oklab("));
    assert.ok(c10.startsWith("oklab("));

    // Low mastery should have positive a (red hue), high mastery negative a (green hue)
    const extractA = str => parseFloat(str.replace("oklab(", "").split(" ")[1]);
    assert.ok(extractA(c0) > 0.15, "0% mastery must be in red hue (positive a)");
    assert.ok(extractA(c10) < -0.10, "100% mastery must be in green hue (negative a)");
  });
});

// ============================================================================
// 8. TOPIC MIX TOURNAMENT INVARIANT SUITE
// ============================================================================
describe("Topic Mix Tournament Suite", () => {
  test("D' pool tournament invariants and weakness weighting", () => {
    assert.ok(runTopicMixTests());
  });
});

// ============================================================================
// 9. REGRESSION: REAL MASTERY FADING & RECALL MODE CONTRACTS
// ============================================================================
describe("Regression: Cognitive Fading & Recall Mode Real Mastery Contract", () => {
  test("pruneSolutionPath activates isFaded when intermediate relation mastery >= FADING_THRESHOLD", () => {
    const topic = TOPICS.spur_gears;
    const S = topic.createSystem({ sys: "SI" });
    const intermediateEqId = "eq_addendum";

    for (let i = 0; i < 15; i++) {
      recordAttempt(intermediateEqId, true, topic.id);
    }

    const mastery = getDecayedMastery({ id: intermediateEqId, baseFormula: "a = 1 / P_d" }, topic);
    assert.ok(mastery >= FADING_THRESHOLD);

    const givens = ["D_P1", "P_d"];
    const allSteps = solveDAG(givens, S, topic.relations, topic.varsDb, () => 0);
    const getMastery = eq => getDecayedMastery(eq, topic);
    const solution = pruneSolutionPath(allSteps, "D_o", getMastery);

    assert.ok(solution.length >= 2);
    const intermediateStep = solution.find(s => s.targetVar === "a");
    assert.ok(intermediateStep);
    assert.equal(intermediateStep.isFaded, true);
    assert.ok(intermediateStep.fadedAncestorEqIds.includes(intermediateEqId));

    const goalStep = solution.find(s => s.targetVar === "D_o");
    assert.ok(goalStep);
    assert.equal(goalStep.isFaded, false);
  });

  test("Recall mode: isConstant givens are recorded and omitted from statement at high mastery", () => {
    const topic = TOPICS.hvac_bypass_air;
    for (let i = 0; i < 10; i++) {
      recordAttempt("const_c_pa", true, topic.id);
    }

    const constMastery = getDecayedMastery({ id: "const_c_pa" }, topic);
    assert.ok(constMastery >= FADING_THRESHOLD);

    const getMastery = eq => getDecayedMastery(eq, topic);
    const problem = generateProblem(topic, getMastery);
    assert.ok(problem);

    if (problem.givens.includes("c_pa")) {
      assert.ok(
        !problem.statement.includes("Specific Heat of Air") && !problem.statement.includes("c_{pa}"),
        "Mastered constant c_pa should be omitted from statement in recall mode"
      );
    }
  });
});