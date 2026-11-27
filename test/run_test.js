/**
 * test/run_test.js
 * Comprehensive Headless CI Test Runner & Invariant Verification Suite.
 * Covers topic contracts, dual-system AST inversion, unit round-trips,
 * graph synthesis, cognitive fading, UI smoke tests, and derivation regressions.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { TOPIC_MANIFEST, loadAllTopics } from "../src/topics/index.js";
import { validateTopic } from "./validator.js";
import { validateDerivationLatex, assertDerivationMatchesAnswer, evalLatexMathToNumber } from "./latex_oracle.js";
import { withSeededRandom, unitLevels, mulberry32 } from "./matrix_helpers.js";
import { generateProblem, determineGraphDistance } from "../src/core/problem_gen.js";
import { buildAlignedDerivation } from "../src/core/derivation.js";
import { evaluatePhysicalAST, solveUnitAlgebra, isCanonicalScaleFactor, formatPairConversion } from "../src/cas/units/index.js";
import { parseMathAST } from "../src/cas/ast.js";
import { isolateVariable } from "../src/cas/algebra.js";
import { casToTex } from "../src/cas/latex.js";
import { runTopicMixTests } from "./topic_mix_test.js";
import { recordAttempt, getDecayedMastery, FADING_THRESHOLD } from "../src/mastery/index.js";
import { pruneSolutionPath, solveDAG, canSolveTarget } from "../src/core/graph_solver.js";
import { formatGivenValue, targetLabel, fmtSigFig, displayFloorOk, MIN_DISPLAY_FLOOR } from "../src/core/dimensions.js";
import {
  sampleSystemMode, sampleByInverseTokens, retainsSufficientSigFigs,
  applyProblemUnitSampling, snapClean, planProblemUnits
} from "../src/core/unit_sampler.js";
import {
  getUnitAtomBag,
  unitToTex,
  toDeltaUnit,
  convertUnitValue,
  valueToCoherentBase,
  formatValueInUnit
} from "../src/cas/units/definitions.js";
import { getOklabMasteryColor } from "../src/ui/sidebar_view.js";
import { runMcqTests } from "./mcq_test.js";

const ALL_TOPICS = await loadAllTopics();
const TOPICS = Object.fromEntries(ALL_TOPICS.map(t => [t.id, t]));

// Enhanced Headless Browser Mock
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
// 1. TOPIC REGISTRY & ARCHITECTURE CONTRACT SUITE
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
        `${topic.title} has ${report.errors.length} validation errors (tested ${report.testedPairs} pairs):\n` + report.errors.slice(0, 5).join("\n")
      );
    });
  }
});

// ============================================================================
// 3. UNIVERSAL PROPERTY-BASED INVARIANT SUITE (REPLACES AD-HOC CASE TESTS)
// ============================================================================
describe("Universal Physical Invariant & Round-Trip Property Suite", () => {
  test("Property 1: Universal Round-Trip Invariant across all registered units", () => {
    const testUnits = [
      "m", "mm", "cm", "in", "ft", "yd", "s", "min", "h",
      "N", "kN", "lb", "lb_m", "lb_f", "klb_m", "klb_f", "kips",
      "g", "kg", "g_m", "kg_m", "g_f", "kg_f",
      "K", "°C", "°F", "°R", "ΔK", "Δ°C", "Δ°F", "Δ°R",
      "Btu", "J", "kJ", "W", "kW", "MPa", "kPa", "Pa", "psi", "psf", "ksi",
      "rpm", "cfm", "gpm", "%", "°"
    ];

    for (const invalid of ["m_f", "m_m", "N_f", "N_m", "s_m", "J_f", "Δm", "kΔK"]) {
      assert.equal(getUnitAtomBag(invalid).isUnknown, true, `Invalid unit '${invalid}' must be rejected as unknown`);
    }

    assert.throws(() => getUnitAtomBag("kW$"), /Invalid character/);
    assert.throws(() => convertUnitValue(20, "°C", "Δ°C"), /Cannot convert affine temperature/);
    assert.throws(() => convertUnitValue(20, "Δ°F", "°F"), /Cannot convert affine temperature/);

    for (const [pU, dU] of [["°C", "Δ°C"], ["°F", "Δ°F"], ["K", "ΔK"], ["°R", "Δ°R"]]) {
      assert.equal(toDeltaUnit(pU), dU);
      const diffBase = valueToCoherentBase(75, pU) - valueToCoherentBase(25, pU);
      const deltaBase = valueToCoherentBase(75 - 25, dU);
      assert.ok(Math.abs(diffBase - deltaBase) < 1e-9, `Affine homomorphism failed for ${pU}/${dU}`);
    }

    for (const u of testUnits) {
      let testVal = 42.5;
      if (u.endsWith("C") || u.endsWith("F") || u.endsWith("R") || u.endsWith("K")) testVal = 20.0;
      if (u === "%") testVal = 75.0;

      const inBase = valueToCoherentBase(testVal, u);
      assert.ok(!isNaN(inBase), `valueToCoherentBase returned NaN for unit ${u}`);

      const roundTrip = formatValueInUnit(inBase, u);
      const tol = Math.max(1e-5, Math.abs(testVal) * 1e-4);
      assert.ok(
        Math.abs(roundTrip - testVal) < tol,
        `Round-trip failure for unit '${u}': input ${testVal}, got ${roundTrip}`
      );
    }
  });

  test("Regression: coupled-group deliverable unification keeps problem.system and problem.system._u synchronized", () => {
    for (const [topicId, mode] of [["springs_series", "MIXED"], ["hvac_bypass_air", "MIXED"]]) {
      const topic = TOPICS[topicId];
      for (let seed = 1; seed <= 20; seed++) {
        const problem = withSeededRandom(seed, () => generateProblem(topic, () => 0.9, { mode }));
        for (const step of problem.solution) {
          const tUnit = problem.system._u?.[step.targetVar] || problem.varsDb[step.targetVar]?.unit;
          const rhsAst = parseMathAST(step.rhsExpr);
          const { value } = evaluatePhysicalAST(rhsAst, problem.system, step.targetVar, problem.varsDb, step.requiredUnits);
          const relErr = Math.abs(value - step.expectedVal) / (Math.abs(step.expectedVal) || 1);
          assert.ok(relErr < 1e-3, `${topicId} seed=${seed} ${step.targetVar} (${tUnit}): expected ${step.expectedVal}, eval ${value}`);
          assert.equal(problem.system[step.targetVar], step.expectedVal, `${topicId} seed=${seed} ${step.targetVar}: system value drifted from expectedVal`);
          if (topicId === "springs_series") {
            const deriv = buildAlignedDerivation(step, problem.system, problem.allSteps, problem.varsDb, topic.relations);
            assertDerivationMatchesAnswer(deriv, step.expectedVal, `${topicId}/${step.targetVar} seed=${seed}`, problem.varsDb, tUnit);
          }
        }
      }
    }
  });

  test("Property 3: Universal Multi-Unit Algebraic Invariant", () => {
    const powerNode = parseMathAST("BP + FP");
    const S_power = {
      BP: 4023.07,
      FP: 409091,
      _u: { BP: "hp", FP: "W", IP: "ft-lb/s" }
    };
    const db_power = {
      BP: { dimension: "Power", unit: "hp" },
      FP: { dimension: "Power", unit: "W" },
      IP: { dimension: "Power", unit: "ft-lb/s" }
    };
    const resPower = evaluatePhysicalAST(powerNode, S_power, "IP", db_power);
    assert.ok(Math.abs(resPower.value - 2514416.5) / 2514416.5 < 0.002);

    const carrierNode = parseMathAST("P_wb - (P_t * (t_db - t_wb)) / 1500");
    const db_psychro = {
      P_v: { dimension: "Pressure / Stress", unit: "kPa" },
      P_wb: { dimension: "Pressure / Stress", unit: "kPa" },
      P_t: { dimension: "Pressure / Stress", unit: "kPa" },
      t_db: { dimension: "Temperature", unit: "°C" },
      t_wb: { dimension: "Temperature", unit: "°C" },
      t_dp: { dimension: "Temperature", unit: "°C" }
    };
    const S_carrier = {
      P_wb: 2.6389, P_t: 101.325, t_db: 311.15, t_wb: 71.6,
      _u: { P_wb: "kPa", P_t: "kPa", t_db: "K", t_wb: "°F", P_v: "kPa" }
    };
    const carrierReq = { P_v: "kPa", P_wb: "kPa", P_t: "kPa", t_db: "°C", t_wb: "°C" };
    const resPv = evaluatePhysicalAST(carrierNode, S_carrier, "P_v", db_psychro, carrierReq);
    assert.ok(Math.abs(resPv.value - 1.5581) < 0.01, `Expected P_v ~1.558 kPa, got ${resPv.value}`);

    const dpNode = parseMathAST("(5333.33 / (14.43509 - ln(P_v / 100))) - 273.15");
    const S_dp = { P_v: resPv.value, _u: { P_v: "kPa", t_dp: "°F" } };
    const resDp = evaluatePhysicalAST(dpNode, S_dp, "t_dp", db_psychro, { t_dp: "°C", P_v: "kPa" });
    assert.ok(Math.abs(resDp.value - 56.55) < 0.2, `Expected t_dp ~56.55 °F, got ${resDp.value}`);

    const heatNode = parseMathAST("m_cw * cp_w * dT_cw");
    const S_heat = {
      m_cw: 600,
      cp_w: 4.187,
      dT_cw: 10,
      _u: { m_cw: "kg/min", cp_w: "kJ/kg-ΔK", dT_cw: "ΔK", Q_cw: "kW" }
    };
    const db_heat = {
      m_cw: { dimension: "Mass Flow Rate", unit: "kg/min" },
      cp_w: { dimension: "Specific Energy / Enthalpy", unit: "kJ/kg-ΔK" },
      dT_cw: { dimension: "Temperature", unit: "ΔK" },
      Q_cw: { dimension: "Power", unit: "kW" }
    };
    const resHeat = evaluatePhysicalAST(heatNode, S_heat, "Q_cw", db_heat);
    assert.ok(Math.abs(resHeat.value - 418.7) < 0.1);
  });


});

// ============================================================================
// 4. WHOLE-CYCLE SYNTHESIS & COGNITIVE FADING VERIFICATION
// ============================================================================
describe("Whole-Cycle Problem Synthesis & Natural Step Fading", () => {
  test("determineGraphDistance increases monotonically with mastery and reaches maximum graph depth as mastery approaches 100%", () => {
    const d0 = determineGraphDistance(0, 10);
    const d40 = determineGraphDistance(0.4, 10);
    const d70 = determineGraphDistance(0.7, 10);
    const d80 = determineGraphDistance(0.8, 10);
    const d88 = determineGraphDistance(0.88, 10);
    const d93 = determineGraphDistance(0.93, 10);
    const d100 = determineGraphDistance(1.0, 10);

    assert.equal(d0, 0, "0% mastery -> 0 hops");
    assert.equal(d40, 1, "40% mastery -> 1 hop");
    assert.equal(d70, 2, "70% mastery -> 2 hops");
    assert.equal(d80, 3, "80% mastery -> 3 hops (fib(4))");
    assert.equal(d88, 5, "88% mastery -> 5 hops (fib(5))");
    assert.equal(d93, 8, "93% mastery -> 8 hops (fib(6))");
    assert.equal(d100, 10, "100% mastery -> maxDepth hops");
    assert.ok(d0 <= d40 && d40 <= d70 && d70 <= d80 && d80 <= d88 && d88 <= d93 && d93 <= d100);
  });

  test("Beginner learner (0% mastery) receives targeted single-relation / short problem for weak equations", () => {
    const topic = TOPICS.powerplant_design_diesel_cycle;
    const problem = generateProblem(topic, () => 0);

    assert.ok(problem.solution.length <= 2, "Beginner (0% mastery) must receive a short targeted problem (0-1 hops)");
    problem.solution.forEach(s => {
      assert.equal(s.isFaded, false, `Step ${s.targetVar} should not be faded at 0% mastery`);
    });
  });

  test("Master learner (100% mastery) naturally receives the longest chain problem on the graph in Diesel Cycle", () => {
    const topic = TOPICS.powerplant_design_diesel_cycle;
    const problem = generateProblem(topic, () => 1.0);

    assert.ok(problem.solution.length >= 5, "Master learner (100% mastery) on Diesel cycle must receive multi-hop chain");

    const activeSteps = problem.solution.filter(s => !s.isFaded);
    assert.ok(activeSteps.length >= 1, "Terminal deliverable must remain active");
    assert.equal(activeSteps[activeSteps.length - 1].targetVar, problem.solution[problem.solution.length - 1].targetVar);

    const intermediateSteps = problem.solution.slice(0, -1);
    intermediateSteps.forEach(step => {
      assert.equal(step.isFaded, true, `Intermediate step ${step.targetVar} must be faded at 100% mastery`);
    });
  });

  test("Variable pruning heuristic ensures minimal givens without redundant intermediate parameters", () => {
    const topic = TOPICS.powerplant_design_diesel_cycle;
    const problem = generateProblem(topic, () => 1.0);

    const producedVars = new Set(problem.solution.map(s => s.targetVar));
    problem.givens.forEach(g => {
      assert.ok(!producedVars.has(g), `Variable ${g} is produced in solution and must be pruned from givens`);
    });
  });

  test("Master learner (100% mastery) naturally receives multi-hop air handling chain in Bypass Air", () => {
    const topic = TOPICS.hvac_bypass_air;
    const problem = generateProblem(topic, () => 1.0);

    assert.ok(problem.solution.length >= 4, "Bypass air must present multi-hop air handling cycle");
    const targetVars = problem.solution.map(s => s.targetVar);
    assert.ok(targetVars.includes("q_c") || targetVars.includes("V_s") || targetVars.includes("q_rh"), "Terminal deliverables present");
  });

  test("Natural cognitive fading: mastered intermediate state points are literally hidden from solution steps", () => {
    const topic = TOPICS.powerplant_design_diesel_cycle;

    const getMastery = eq => {
      if (eq.id === "eq_diesel_t2" || eq.id === "eq_diesel_rk") return 0.95;
      return 0.20;
    };

    const problem = generateProblem(topic, getMastery);
    assert.ok(problem);
  });
});

// ============================================================================
// 5. LIFECYCLE & PROBLEM GENERATION SUITE
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
// 6. DERIVATION FIDELITY & LATEX RENDERING TEST SUITE
// ============================================================================
describe("Derivation Fidelity & LaTeX Rendering", () => {
  for (const topic of ALL_TOPICS) {
    test(`Derivation output for ${topic.title}: strict rendering & syntax validation`, () => {
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

        validateDerivationLatex(derivLatex);
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

    const rhsAst = parseMathAST("Q_A - Q_R");
    assert.equal(rhsAst.type, "binary");
    assert.equal(rhsAst.op, "-");
    assert.equal(rhsAst.left.name, "Q_A");
    assert.equal(rhsAst.right.name, "Q_R");

    const physicalEval = evaluatePhysicalAST(rhsAst, S, "W_net", varsDb);
    assert.equal(physicalEval.value, 450);

    const deriv = buildAlignedDerivation(step, S, [step], varsDb, []);
    validateDerivationLatex(deriv);

    assert.ok(
      deriv.includes("(1{,}200 - 750)") || deriv.includes("(1200 - 750)"),
      `Expected factored additive group (1{,}200 - 750), got: ${deriv}`
    );
    assert.ok(
      deriv.includes("\\cfrac{\\text{kJ}}{\\text{kg}}"),
      `Expected common unit factored outside parentheses, got: ${deriv}`
    );
    assert.ok(
      !deriv.includes("1{,}200\\,\\cfrac") && !deriv.includes("1200\\,\\cfrac"),
      `Terms must not retain individual units inside parentheses: ${deriv}`
    );
  });

  test("Gravitational force-to-mass bridge (gc) renders clean 2-row lb_f/lb_m cancellations", () => {
    const varsDb = {
      T_period: { symbol: "T", dimension: "Time / Period", unit: "s" },
      k: { symbol: "k", dimension: "Spring Rate / Stiffness", unit: "lb_f/ft" },
      m: { symbol: "m", dimension: "Mass", unit: "lb_m" }
    };
    const S = {
      T_period: 0.495388,
      k: 50,
      m: 10,
      _u: { T_period: "s", k: "lb_f/ft", m: "lb_m" }
    };

    const solveMassStep = {
      targetVar: "m",
      baseFormula: "T_period = 2 * pi * sqrt(m / k)",
      rhsExpr: "(T_period / (2 * pi))^2 * k",
      nodes: ["T_period", "m", "k"],
      expectedVal: 10
    };
    const evalMass = evaluatePhysicalAST(parseMathAST(solveMassStep.rhsExpr), S, "m", varsDb);
    assert.ok(Math.abs(evalMass.value - 10) < 0.01, `Expected m ~10 lb_m, got ${evalMass.value}`);

    const derivMass = buildAlignedDerivation(solveMassStep, S, [solveMassStep], varsDb, []);
    validateDerivationLatex(derivMass);
    assert.ok(derivMass.includes("\\text{lb}_{f}"), `Expected lb_f in derivation: ${derivMass}`);
    assert.ok(derivMass.includes("\\text{lb}_{m}"), `Expected lb_m in derivation: ${derivMass}`);
    assert.ok(derivMass.includes("32.174"), `Expected gc = 32.174 in derivation: ${derivMass}`);
    assert.ok(!derivMass.includes("\\cfrac{\\cfrac{"), `Must not emit broken nested 4-row gc tower: ${derivMass}`);

    const solvePeriodStep = {
      targetVar: "T_period",
      baseFormula: "T_period = 2 * pi * sqrt(m / k)",
      rhsExpr: "2 * pi * sqrt(m / k)",
      nodes: ["T_period", "m", "k"],
      expectedVal: 0.495388
    };
    const evalPeriod = evaluatePhysicalAST(parseMathAST(solvePeriodStep.rhsExpr), S, "T_period", varsDb);
    assert.ok(Math.abs(evalPeriod.value - 0.495388) < 0.001, `Expected T ~0.495 s, got ${evalPeriod.value}`);

    const derivPeriod = buildAlignedDerivation(solvePeriodStep, S, [solvePeriodStep], varsDb, []);
    validateDerivationLatex(derivPeriod);
    assert.ok(derivPeriod.includes("32.174"), `Expected gc = 32.174 in period derivation: ${derivPeriod}`);
  });

  test("Compound squared pressure conversion (lb_f/in^2 -> N/mm^2) decomposes 645.16 into 25.4^2", () => {
    const conv = formatPairConversion("lb_f/in^2", "N/mm^2", "Pressure / Stress", "Pressure / Stress");
    assert.ok(conv.tex.includes("(25.4)^2"), `Expected (25.4)^2 in conversion tex: ${conv.tex}`);
    for (const s of conv.scalars) {
      assert.ok(isCanonicalScaleFactor(s), `Expected canonical scalar, got ${s}`);
    }
  });
});

// ============================================================================
// 7. UNIT SAMPLER: 40-40-20 & INVERSE TOKEN PROBABILITY SUITE
// ============================================================================
describe("Unit Sampler: 40-40-20, Inverse-Token Compound Weights & Sig-Fig Retention", () => {
  test("sampleSystemMode satisfies 40% SI / 40% US / 20% MIXED bounds over large sample", () => {
    const trials = 10000;
    const counts = { SI: 0, US: 0, MIXED: 0 };
    for (let i = 0; i < trials; i++) counts[sampleSystemMode()]++;
    assert.ok(counts.SI / trials > 0.37 && counts.SI / trials < 0.43);
    assert.ok(counts.US / trials > 0.37 && counts.US / trials < 0.43);
    assert.ok(counts.MIXED / trials > 0.17 && counts.MIXED / trials < 0.23);
  });

  test("sampleByInverseTokens matches w_i = 1/t_i relative probability math", () => {
    const candidates = [
      { unit: "W", tokens: 1 },
      { unit: "J/s", tokens: 2 },
      { unit: "N-m/s", tokens: 3 },
      { unit: "kg*m^2/s^3", tokens: 6 }
    ];

    const counts = { "W": 0, "J/s": 0, "N-m/s": 0, "kg*m^2/s^3": 0 };
    const trials = 30000;
    for (let i = 0; i < trials; i++) counts[sampleByInverseTokens(candidates)]++;

    assert.ok(Math.abs(counts["W"] / counts["J/s"] - 2.0) < 0.25);
    assert.ok(Math.abs(counts["W"] / counts["N-m/s"] - 3.0) < 0.35);
    assert.ok(Math.abs(counts["W"] / counts["kg*m^2/s^3"] - 6.0) < 0.70);
  });

  test("Significant figure filter prevents wildly inappropriate units (km for pitch diameter)", () => {
    assert.equal(retainsSufficientSigFigs(0.00006), false);
    assert.equal(retainsSufficientSigFigs(0.06), false);
    assert.equal(retainsSufficientSigFigs(6.0), true);
    assert.equal(retainsSufficientSigFigs(2.362), true);
    assert.equal(retainsSufficientSigFigs(0.0004), false);
  });

  test("Display cap: 6 s.f. with a 6-decimal cap, rounded once from the raw value", () => {
    assert.equal(fmtSigFig(0.00123456789, 6), "0.001235");
    assert.equal(fmtSigFig(0.0000123456, 6), "0.000012");
    assert.equal(fmtSigFig(123456.789, 6), "123,457");
    assert.equal(MIN_DISPLAY_FLOOR, 0.001);
    assert.equal(displayFloorOk(0), true);
    assert.equal(displayFloorOk(0.02), true);
    assert.equal(displayFloorOk(0.0004), false);
  });
});

// ============================================================================
// 8. SPECIFIC ENERGY & OKLAB GRADIENT CONTRACTS
// ============================================================================
describe("Thermodynamic Specific Energy & Oklab Gradient Contracts", () => {
  test("Specific Energy parameters in diesel cycle use lowercase notation (q_A, q_R, w_{net})", () => {
    const db = TOPICS.powerplant_design_diesel_cycle.varsDb;
    assert.equal(db.Q_A.symbol, "q_A");
    assert.equal(db.Q_R.symbol, "q_R");
    assert.equal(db.W_net.symbol, "w_{net}");
  });

  test("getOklabMasteryColor generates valid oklab(L a b) values across spectrum", () => {
    const c0 = getOklabMasteryColor(0.0);
    const c10 = getOklabMasteryColor(1.0);
    assert.ok(c0.startsWith("oklab("));
    assert.ok(c10.startsWith("oklab("));
  });
});

// ============================================================================
// 9. TOPIC MIX TOURNAMENT INVARIANT SUITE
// ============================================================================
describe("Topic Mix Tournament Suite", () => {
  test("D' pool tournament invariants and weakness weighting", () => {
    assert.ok(runTopicMixTests());
  });
});

// ============================================================================
// 10. REGRESSION: REAL MASTERY FADING & RECALL MODE CONTRACTS
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

// ============================================================================
// 11. FRONTEND UI MODULE INTEGRITY SMOKE TESTS
// ============================================================================
describe("Frontend UI Module & Import Integrity Smoke Tests", () => {
  test("Verify src/ui/sidebar_view.js integrity and exports", async () => {
    const mod = await import("../src/ui/sidebar_view.js");
    assert.equal(typeof mod.initSidebarView, "function");
    assert.equal(typeof mod.updateSidebarRelations, "function");
    assert.equal(typeof mod.renderSidebar, "function");
    assert.equal(typeof mod.renderMasteryBars, "function");
  });

  test("Sidebar scope filtering preserves current vs all scope for relations and sets", async () => {
    const { updateSidebarRelations } = await import("../src/ui/sidebar_view.js");

    const setA = { id: "set_a", name: "Set A", mastery: 0.2 };
    const setB = { id: "set_b", name: "Set B", mastery: 0.8 };

    // Set-level scope simulation
    updateSidebarRelations([setA], [setA, setB], e => e.mastery, {
      currentLabel: "Current Set",
      allLabel: "All Selected"
    });

    // Relation-level scope simulation (Problem Mode)
    const rel1 = { id: "eq_1", name: "Formula 1" };
    const rel2 = { id: "eq_2", name: "Formula 2" };
    updateSidebarRelations([rel1], [rel1, rel2], () => 0.5, {
      currentLabel: "Current Problem",
      allLabel: "All Selected"
    });
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
    assert.ok(Array.isArray(mod.TOPIC_MANIFEST));
    const manifestIds = new Set(mod.TOPIC_MANIFEST.map(m => m.id));
    for (const topic of ALL_TOPICS) {
      assert.ok(manifestIds.has(topic.id), `app.js TOPIC_MANIFEST is missing topic '${topic.id}'`);
      assert.equal(await mod.loadTopic(topic.id), topic, `app.js loadTopic('${topic.id}') failed`);
    }
    assert.equal(mod.TOPIC_MANIFEST.length, TOPIC_MANIFEST.length);
  });
});

describe("Regression Invariants (Distractors & Constant Unit Coupling)", () => {
  test("True-Distractor Invariant: equivalent/alternative givens are never flagged as distractors", () => {
    const seriesTopic = ALL_TOPICS.find(t => t.id.includes("series"));
    assert.ok(seriesTopic, "Series springs topic must exist");

    for (let i = 0; i < 40; i++) {
      const prob = generateProblem(seriesTopic, () => 0);
      if (!prob.distractors || prob.distractors.length === 0) continue;

      const distractorSet = new Set(prob.distractors);
      const minimalGivens = prob.givens.filter(g => !distractorSet.has(g));
      const goalVar = prob.solution[prob.solution.length - 1]?.targetVar;
      assert.ok(goalVar, "Problem must have a goalVar");

      for (const d of prob.distractors) {
        const canSubstitute = minimalGivens.length === 0
          ? canSolveTarget([d], goalVar, prob.relations, prob.system)
          : minimalGivens.some(g => canSolveTarget(
              minimalGivens.filter(v => v !== g).concat(d),
              goalVar,
              prob.relations,
              prob.system
            ));
        assert.strictEqual(
          canSubstitute,
          false,
          `Variable ${d} can substitute for a minimal given (${minimalGivens.join(",")}) to solve ${goalVar} and must not be a distractor`
        );
      }
    }
  });

  test("Value-Unit Coupling Invariant: constants never display SI numbers with US units", () => {
    const gMeta = { isConstant: true, unit: "m/s^2", display: 9.81 };
    assert.strictEqual(formatGivenValue(9.81, gMeta, true, "m/s^2"), "9.81");
    assert.strictEqual(formatGivenValue(32.2, gMeta, true, "ft/s^2"), "32.2");

    const pfTopic = ALL_TOPICS.find(t => t.id.includes("period_frequency"));
    assert.ok(pfTopic, "Period & frequency topic must exist");

    for (const mode of ["SI", "US", "MIXED"]) {
      for (let i = 0; i < 10; i++) {
        const S = applyProblemUnitSampling(
          pfTopic.createSystem({ sys: mode === "MIXED" ? "SI" : mode }),
          pfTopic.varsDb,
          mode
        );
        if (S._u.g === "ft/s^2") {
          assert.strictEqual(S.g, 32.2, "g in ft/s^2 must be 32.2");
        } else if (S._u.g === "m/s^2") {
          assert.strictEqual(S.g, 9.81, "g in m/s^2 must be 9.81");
        }
      }
    }

    for (let i = 0; i < 30; i++) {
      const prob = generateProblem(pfTopic, () => 0);
      if (prob.givens.includes("g") && prob.system._u.g === "ft/s^2") {
        assert.ok(!prob.statement.includes("9.81"), `Statement must not display 9.81 when g is in ft/s^2: ${prob.statement}`);
        assert.ok(prob.statement.includes("32.2"), `Statement must display 32.2 when g is in ft/s^2: ${prob.statement}`);
        for (const step of prob.solution) {
          if ((step.nodes || []).includes("g")) {
            const deriv = buildAlignedDerivation(step, prob.system, prob.allSteps, prob.varsDb, prob.relations, new Set(), prob.givens);
            assert.ok(!deriv.includes("9.81"), `Derivation must not display 9.81 when g is in ft/s^2: ${deriv}`);
          }
        }
      }
    }
  });

  test("Regression: Mass-Spring Oscillation Period derivation formatting and unit conversions", () => {
    const symTex = casToTex("((T / (2 * pi))^2) * k");
    assert.ok(!symTex.includes("(("), `Symbolic form must not contain double parens: ${symTex}`);

    const step = {
      targetVar: "m",
      baseFormula: "T_period = 2 * pi * sqrt(m / k)",
      rhsExpr: "((T_period / (2 * pi))^2) * k",
      expectedVal: 5.512
    };
    const S = {
      T_period: 314.159,
      k: 5.71,
      m: 5.512,
      _u: { T_period: "ms", k: "lb/in", m: "lb" }
    };
    const db = {
      T_period: { dimension: "Time / Period", unit: "s", symbol: "T" },
      k: { dimension: "Spring Rate / Stiffness", unit: "lb/in", symbol: "K" },
      m: { dimension: "Mass", unit: "lb", symbol: "M" }
    };
    const deriv = buildAlignedDerivation(step, S, [step], db, []);
    validateDerivationLatex(deriv);

    assert.ok(!deriv.includes("\\left(\\left("), `Derivation must not contain double parens: ${deriv}`);
    assert.ok(deriv.includes("386.089"), `Derivation must contain gravitational acceleration factor gc (386.089): ${deriv}`);
    assert.ok(deriv.includes("1{,}000"), `Derivation must contain millisecond to second conversion factor: ${deriv}`);
  });

  test("Regression: targetLabel renders KaTeX-delimited units for step headers", () => {
    const lblLbf = targetLabel("Spring 2 Load", "$F_2$", "lb_f", unitToTex("lb_f", true, "Force"));
    assert.equal(lblLbf, "Spring 2 Load ($F_2$) in $\\text{lb}_{f}$");

    const lblRate = targetLabel("Specific Heat Rejected", "$q_R$", "Btu/lb_m", unitToTex("Btu/lb_m", true, "Specific Energy / Enthalpy"));
    assert.equal(lblRate, "Specific Heat Rejected ($q_R$) in $\\tfrac{\\text{Btu}}{\\text{lb}_{m}}$");

    const lblPct = targetLabel("Efficiency", "$\\eta$", "%", unitToTex("%", true, "Percentage"));
    assert.equal(lblPct, "Efficiency ($\\eta$) in $\\text{\\%}$");
  });

  test("Regression: selective unit cancellation keeps surviving atoms uncancelled", () => {
    const dbSpring = {
      F_2: { dimension: "Force", unit: "lb_f", symbol: "F_2" },
      k_2: { dimension: "Spring Rate / Stiffness", unit: "lb_f/in", symbol: "k_2" },
      delta_T: { dimension: "Length", unit: "in", symbol: "\\delta_T" }
    };
    const sSpring = { F_2: 45, k_2: 30, delta_T: 1.5, _u: { F_2: "lb_f", k_2: "lb_f/in", delta_T: "in" } };

    // 1. F_2 = k_2 * delta_T (lb_f/in * in -> lb_f): in cancels, lb_f survives
    const algForce = solveUnitAlgebra("k_2 * delta_T", sSpring, "F_2", "lb_f", dbSpring);
    assert.equal(algForce.tokenMarkup.k_2, "\\cfrac{\\text{lb}_{f}}{\\cancel{\\text{in}}}");
    assert.equal(algForce.tokenMarkup.delta_T, "\\cancel{\\text{in}}");

    // 2. delta_T = F_2 / k_2 (lb_f / (lb_f/in) -> in): lb_f cancels, in survives
    const algDefl = solveUnitAlgebra("F_2 / k_2", sSpring, "delta_T", "in", dbSpring);
    assert.equal(algDefl.tokenMarkup.F_2, "\\cancel{\\text{lb}_{f}}");
    assert.equal(algDefl.tokenMarkup.k_2, "\\cfrac{\\cancel{\\text{lb}_{f}}}{\\text{in}}");

    // 3. k_2 = F_2 / delta_T (lb_f / in -> lb_f/in): neither cancels
    const algStiff = solveUnitAlgebra("F_2 / delta_T", sSpring, "k_2", "lb_f/in", dbSpring);
    assert.equal(algStiff.tokenMarkup.F_2, "\\text{lb}_{f}");
    assert.equal(algStiff.tokenMarkup.delta_T, "\\text{in}");

    // 4. Partial rate decomposition (kg/s -> kg/h): s cancels, kg survives
    const dbFlow = { m: { dimension: "Mass Flow Rate", unit: "kg/s" }, m_out: { dimension: "Mass Flow Rate", unit: "kg/h" } };
    const algFlow = solveUnitAlgebra("m", { m: 2, _u: { m: "kg/s", m_out: "kg/h" } }, "m_out", "kg/h", dbFlow);
    assert.equal(algFlow.tokenMarkup.m, "\\cfrac{\\text{kg}}{\\cancel{\\text{s}}}");
  });

  test("Regression: mixed Diesel Cycle q_R aligns affine temperatures, emits c_v equivalence insight, and flows vertically", () => {
    const varsDb = TOPICS.powerplant_design_diesel_cycle.varsDb;
    const S = {
      T_1: 80.33,
      T_4: 1425.07,
      c_v: 0.7186,
      Q_R: 151.908,
      _u: { T_1: "°F", T_4: "°R", c_v: "kJ/kg-ΔK", Q_R: "Btu/lb_m" }
    };
    const step = {
      targetVar: "Q_R",
      baseFormula: "Q_R = c_v * (T_4 - T_1)",
      rhsExpr: "c_v * (T_4 - T_1)",
      canonicalTex: "q_R = c_v (T_4 - T_1)",
      expectedVal: 151.908
    };

    const deriv = buildAlignedDerivation(step, S, [step], varsDb, []);
    validateDerivationLatex(deriv);

    // Must align T_1 (°F -> °R) instead of emitting bogus (1,425.07 - 80.33) °R
    assert.ok(!deriv.includes("1{,}425.07 - 80.33"), `Must not subtract °F from °R without offset conversion: ${deriv}`);
    assert.ok(deriv.includes("80.33 + 459.67"), `Expected affine °F -> °R conversion for T_1: ${deriv}`);
    assert.ok(deriv.includes("1{,}425.07 - 540"), `Expected aligned °R subtraction (1,425.07 - 540): ${deriv}`);

    // Must emit constant equivalence insight for c_v and keep Btu/lb_m uncancelled
    assert.ok(deriv.includes("0.171635"), `Expected c_v English constant equivalence (0.171635): ${deriv}`);
    assert.ok(!deriv.includes("\\cancel{\\text{Btu}}"), `Surviving Btu must not be cancelled: ${deriv}`);
    assert.ok(!deriv.includes("\\cancel{\\text{lb}_{m}}"), `Surviving lb_m must not be cancelled: ${deriv}`);
    assert.ok(deriv.includes("\\cancel{\\Delta°R}"), `Cancelling Δ°R must be marked cancelled: ${deriv}`);

    // Must break vertically across multiple aligned rows
    assert.ok((deriv.match(/\\\\\[6pt\]/g) || []).length >= 4, `Expected vertical multi-row aligned layout: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 151.908, "mixed_diesel_qr");
  });

  test("Regression: empirical target scale groups the whole additive RHS (h kJ/kg -> Btu/lb_m)", () => {
    const varsDb = TOPICS.hvac_air_properties.varsDb;
    // W = 0.025 prints exactly, so formatter rounding cannot mask the precedence bug.
    // Hand value: (1.0062*30 + 0.025*(2501 + 1.88*30)) / 2.326 = 40.465
    const S = { t_db: 30, W: 0.025, h: 40.465, _u: { t_db: "°C", W: "dimless", h: "Btu/lb_m" } };
    const step = {
      targetVar: "h",
      baseFormula: "h = 1.0062 * t_db + W * (2501 + 1.88 * t_db)",
      rhsExpr: "1.0062 * t_db + W * (2501 + 1.88 * t_db)",
      canonicalTex: "h = 1.0062 t_{db} + W (2501 + 1.88 t_{db})",
      expectedVal: 40.465,
      requiredUnits: { h: "kJ/kg", t_db: "°C", W: "dimless" }
    };
    const deriv = buildAlignedDerivation(step, S, [step], varsDb, []);
    validateDerivationLatex(deriv);
    assert.ok(deriv.includes("(1.0062"), `Additive root must be grouped before the scale factor: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 40.465, "air_enthalpy_us");
  });

  test("Regression: spring rate k from period converts lb_m -> lb_f via g_c on the target side", () => {
    const topic = ALL_TOPICS.find(t => t.id.includes("period_frequency"));
    assert.ok(topic, "period_frequency topic must exist");
    const S = { m: 10, T_period: 0.495384, k: 50, _u: { m: "lb_m", T_period: "s", k: "lb_f/ft" } };
    const step = {
      targetVar: "k",
      baseFormula: "k = m / (T_period / (2 * pi))^2",
      rhsExpr: "m / (T_period / (2 * pi))^2",
      canonicalTex: "k = m \\left(\\frac{2\\pi}{T}\\right)^2",
      expectedVal: 50
    };
    const deriv = buildAlignedDerivation(step, S, [step], topic.varsDb, []);
    validateDerivationLatex(deriv);
    assert.ok(deriv.includes("32.174"), `Expected g_c in derivation: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 50, "spring_k_from_period");
  });

  test("Regression: mismatched rate units in a dimensionless ratio convert in the true direction (lb_m/min vs lb_m/h)", () => {
    const topic = ALL_TOPICS.find(t => t.id === "hvac_cooling_tower");
    assert.ok(topic, "cooling tower topic must exist");
    const S = {
      m_evap: 78.7879, m_bd: 2363.64, COC: 3,
      _u: { m_evap: "lb_m/min", m_bd: "lb_m/h", COC: "dimless" }
    };
    const step = {
      targetVar: "COC",
      baseFormula: "COC = 1 + m_evap / m_bd",
      rhsExpr: "1 + m_evap / m_bd",
      canonicalTex: "\\text{COC} = 1 + \\frac{\\dot{m}_{evap}}{\\dot{m}_{bd}}",
      expectedVal: 3
    };
    const deriv = buildAlignedDerivation(step, S, [step], topic.varsDb, []);
    validateDerivationLatex(deriv);
    assert.ok(!deriv.includes("\\cfrac{\\cancel{\\text{min}}}{60"), `min/h factor must multiply by 60, not divide: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 3, "coc_rate_mismatch");
  });

  test("Regression: empirical °C-contract target boxed in °R shows the offset/scale conversion row", () => {
    const topic = TOPICS.hvac_air_properties;
    const S = { P_wb: 2.99321, t_wb: 535, _u: { P_wb: "kPa", t_wb: "°R" } };
    const step = {
      targetVar: "t_wb",
      baseFormula: "t_wb = 5333.33 / (14.43509 - ln(P_wb / 100)) - 273.15",
      rhsExpr: "5333.33 / (14.43509 - ln(P_wb / 100)) - 273.15",
      canonicalTex: "t_{wb} = \\frac{5333.33}{14.43509 - \\ln\\frac{P_{wb}}{100}} - 273.15",
      expectedVal: 535,
      requiredUnits: { t_wb: "°C", P_wb: "kPa" }
    };
    const deriv = buildAlignedDerivation(step, S, [step], topic.varsDb, []);
    validateDerivationLatex(deriv);
    assert.ok(deriv.includes("273.15)"), `Expected explicit (°C + 273.15) K step: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 535, "liley_twb_rankine");
  });

  test("Clean-number sampler: snapClean is idempotent; drawn roots display clean in their planned unit", () => {
    for (const x of [0.0213, 23.7, 86.0001, 1234.5, 0.0995, 7, 9.98]) {
      const c = snapClean(x);
      assert.equal(snapClean(c), c, `snapClean must be idempotent for ${x}`);
    }
    const topic = TOPICS.hvac_air_properties;
    for (let i = 0; i < 200; i++) {
      const mode = sampleSystemMode();
      const plan = planProblemUnits(topic.varsDb, mode);
      const S = topic.createSystem({ sys: "SI", unitPlan: plan });
      assert.ok(S.t_wb < S.t_db, `t_wb (${S.t_wb}) must stay below t_db (${S.t_db})`);
      applyProblemUnitSampling(S, topic.varsDb, mode, plan);
      for (const k of ["t_db", "t_wb", "Q_s", "Q_l"]) {
        assert.equal(S._u[k], plan[k], `${k} must keep its planned unit`);
        const shown = Number(fmtSigFig(S[k], 6).replaceAll(",", ""));
        assert.equal(snapClean(shown), shown, `${k} displays unclean value ${shown} ${S._u[k]}`);
      }
    }
  });

  test("Regression: cooling tower rho_w = m_w / V_w converts gpm -> ft^3 and evaluates to boxed answer", () => {
    const varsDb = TOPICS.hvac_cooling_tower.varsDb;
    const S = {
      m_w: 6000,
      V_w: 1585.03,
      rho_w: 62.428,
      _u: { m_w: "kg/min", V_w: "gpm", rho_w: "lb_m/ft^3" }
    };
    const step = {
      targetVar: "rho_w",
      baseFormula: "V_w = m_w / rho_w",
      rhsExpr: "m_w / V_w",
      canonicalTex: "V_w = \\frac{\\dot{m}_w}{\\rho_w}",
      expectedVal: 62.428
    };
    const deriv = buildAlignedDerivation(step, S, [step], varsDb, []);
    validateDerivationLatex(deriv);
    assert.ok(deriv.includes("7.48052"), `Expected gal -> ft^3 conversion factor 7.48052 in derivation: ${deriv}`);
    assert.ok(deriv.includes("\\cancel{\\text{gal}}"), `Expected gal cancelled in derivation: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 62.428, "cooling_tower_gpm_to_ft3");
  });

  test("Regression: dimensionless physical ratio is projected into percentage target units", () => {
    const dieselTopic = ALL_TOPICS.find(t => t.id.includes("diesel_heat_balance"));
    assert.ok(dieselTopic, "Diesel heat-balance topic must exist");

    const S = {
      Q_cw: 1676.28,
      Q_f: 6705.11,
      pct_cw: 25,
      _u: { Q_cw: "hp", Q_f: "hp", pct_cw: "%" }
    };
    const step = {
      targetVar: "pct_cw",
      baseFormula: "pct_cw = Q_cw / Q_f",
      rhsExpr: "Q_cw / Q_f",
      canonicalTex: "\\%_{cw} = \\frac{Q_{cw}}{Q_f}",
      expectedVal: 25
    };

    const deriv = buildAlignedDerivation(step, S, [step], dieselTopic.varsDb, []);
    validateDerivationLatex(deriv);
    assert.ok(deriv.includes("\\cdot 100"), `Expected ratio-to-percent scale factor in derivation: ${deriv}`);
    assertDerivationMatchesAnswer(deriv, 25, "dimensionless_ratio_to_percentage");
  });

  test("Regression: helical coil k = G*d_w^4/(8*D_m^3*N_a) with GPa and m^3/kg -> cfm evaluate accurately", () => {
    const coilTopic = ALL_TOPICS.find(t => t.id.includes("helical_coil"));
    assert.ok(coilTopic, "Helical coil topic must exist");
    const coilDb = coilTopic.varsDb;
    assert.strictEqual(formatGivenValue(79.3, coilDb.G, true, "GPa"), "79.3");
    assert.strictEqual(formatGivenValue(80, coilDb.G, true, "GPa"), "80");

    const S_coil = {
      G: 79.3,
      d_w: 10,
      D_m: 100,
      N_a: 8,
      k: 12.3906,
      _u: { G: "GPa", d_w: "mm", D_m: "mm", N_a: "dimless", k: "N/mm" }
    };
    const stepCoil = {
      targetVar: "k",
      baseFormula: "k = (G * (d_w^4)) / (8 * (D_m^3) * N_a)",
      rhsExpr: "(G * (d_w^4)) / (8 * (D_m^3) * N_a)",
      canonicalTex: "k = \\frac{G d_w^4}{8 D_m^3 N_a}",
      expectedVal: 12.3906
    };
    const derivCoil = buildAlignedDerivation(stepCoil, S_coil, [stepCoil], coilDb, []);
    validateDerivationLatex(derivCoil);
    assertDerivationMatchesAnswer(derivCoil, 12.3906, "helical_coil_gpa");

    const towerDb = TOPICS.hvac_cooling_tower.varsDb;
    const S_air = {
      m_a: 100,
      v_1: 0.875,
      V_a: 1401.62,
      _u: { m_a: "lb_m/min", v_1: "m^3/kg", V_a: "cfm" }
    };
    const stepAir = {
      targetVar: "V_a",
      baseFormula: "V_a = m_a * v_1",
      rhsExpr: "m_a * v_1",
      canonicalTex: "V_a = \\dot{m}_a v_1",
      expectedVal: 1401.62
    };
    const derivAir = buildAlignedDerivation(stepAir, S_air, [stepAir], towerDb, []);
    validateDerivationLatex(derivAir);
    assertDerivationMatchesAnswer(derivAir, 1401.62, "cooling_tower_m3_to_cfm");
  });

  test("Regression: angle units render once in trig calls/powers and convert via standard unit pipeline", () => {
    const assertOracleMatches = assertDerivationMatchesAnswer;
    const helicalTopic = ALL_TOPICS.find(t => t.id.includes("helical_gears"));
    assert.ok(helicalTopic, "helical_gears topic must exist");
    const hDb = helicalTopic.varsDb;

    // 1. Pure-physics cos(psi): must render \cos(20 \, °), never duplicated °°
    const S_center = { m_n: 4, T_1: 20, T_2: 40, psi: 20, C: 127.701, _u: { m_n: "mm", T_1: "teeth", T_2: "teeth", psi: "°", C: "mm" } };
    const stepCenter = {
      targetVar: "C",
      baseFormula: "C = (m_n * (T_1 + T_2)) / (2 * cos(psi))",
      rhsExpr: "(m_n * (T_1 + T_2)) / (2 * cos(psi))",
      canonicalTex: "C = \\frac{m_n (T_1 + T_2)}{2 \\cos\\psi}",
      expectedVal: 127.701
    };
    const derivCenter = buildAlignedDerivation(stepCenter, S_center, [stepCenter], hDb, []);
    validateDerivationLatex(derivCenter);
    assert.ok(!derivCenter.includes("°°"), `Duplicated degree symbol in trig call: ${derivCenter}`);
    assert.ok(derivCenter.includes("\\cos(20 \\, °)"), `Expected single degree symbol in \\cos(20 \\, °): ${derivCenter}`);
    assertDerivationMatchesAnswer(derivCenter, 127.701, "helical_cos_single_deg");
    assertOracleMatches(derivCenter, 127.701, "helical_cos_single_deg_oracle", hDb, "mm");

    // 2. Empirical requiredUnits with cos(psi)^2 and rad -> ° preConversion
    const reqUnits = { V_m: "m/s", b: "mm", W_t: "N", C_d: "N", psi: "°", F_D: "N" };
    const fdRhs = "W_t + (21 * V_m * (W_t + b * C_d * cos(psi)^2) * cos(psi)) / (21 * V_m + sqrt(W_t + b * C_d * cos(psi)^2))";
    const psiRad = (20 * Math.PI) / 180;
    const S_fd = { W_t: 1000, V_m: 5, b: 40, C_d: 400, psi: psiRad, F_D: 7546.92, _u: { W_t: "N", V_m: "m/s", b: "mm", C_d: "N", psi: "rad", F_D: "N" } };
    const evalFd = evaluatePhysicalAST(parseMathAST(fdRhs), S_fd, "F_D", hDb, reqUnits);
    assert.ok(Math.abs(evalFd.value - 7546.924) < 0.05, `Expected F_D ~7546.92 N from rad input, got ${evalFd.value}`);

    const stepFd = {
      targetVar: "F_D",
      baseFormula: `F_D = ${fdRhs}`,
      rhsExpr: fdRhs,
      canonicalTex: "F_D = F_t + \\frac{21 v (F_t + b C_d \\cos^2\\psi) \\cos\\psi}{21 v + \\sqrt{F_t + b C_d \\cos^2\\psi}}",
      expectedVal: 7546.92,
      requiredUnits: reqUnits
    };
    const derivFd = buildAlignedDerivation(stepFd, S_fd, [stepFd], hDb, []);
    validateDerivationLatex(derivFd);
    assert.ok(!derivFd.includes("°°"), `Duplicated degree symbol in F_D: ${derivFd}`);
    assert.ok(derivFd.includes("\\cos^{2}(20 \\, °)"), `Expected degree unit inside \\cos^{2}(20 \\, °): ${derivFd}`);
    assertDerivationMatchesAnswer(derivFd, 7546.92, "helical_fd_rad_to_deg");
    assertOracleMatches(derivFd, 7546.92, "helical_fd_rad_to_deg_oracle", hDb, "N");

    // 3. Inverse trig (\tan^{-1}) and scaled length/rpm/torque oracle checks
    const stepPhi = {
      targetVar: "phi_n",
      baseFormula: "tan(phi_n) = tan(phi) * cos(psi)",
      rhsExpr: "atan(tan(phi) * cos(psi))",
      canonicalTex: "\\tan\\phi_n = \\tan\\phi \\cos\\psi",
      expectedVal: 18.2562
    };
    const S_phi = { phi: 20, psi: 25, phi_n: 18.2562, _u: { phi: "°", psi: "°", phi_n: "°" } };
    const derivPhi = buildAlignedDerivation(stepPhi, S_phi, [stepPhi], hDb, []);
    validateDerivationLatex(derivPhi);
    assertOracleMatches(derivPhi, 18.2562, "helical_atan_oracle", hDb, "°");

    const miscDb = {
      a: { symbol: "a", dimension: "Length", unit: "mm" },
      b: { symbol: "b", dimension: "Length", unit: "mm" },
      n_1: { symbol: "n_1", dimension: "Rotational Speed", unit: "rev/min" },
      n_2: { symbol: "n_2", dimension: "Rotational Speed", unit: "rpm" },
      F_t: { symbol: "F_t", dimension: "Force", unit: "N" },
      D_1: { symbol: "D_1", dimension: "Length", unit: "mm" },
      T: { symbol: "T", dimension: "Torque", unit: "N-m" }
    };
    const cases = [
      [{ targetVar: "b", baseFormula: "b = a / 4", rhsExpr: "a / 4", expectedVal: 104.821 }, { a: 419.284, b: 104.821, _u: { a: "mm", b: "mm" } }, "mm"],
      [{ targetVar: "n_2", baseFormula: "n_2 = 4 * n_1", rhsExpr: "4 * n_1", expectedVal: 1150 }, { n_1: 287.5, n_2: 1150, _u: { n_1: "rev/min", n_2: "rpm" } }, "rpm"],
      [{ targetVar: "T", baseFormula: "T = (F_t * D_1) / 2", rhsExpr: "(F_t * D_1) / 2", expectedVal: 207.594 }, { F_t: 3960.92, D_1: 104.821, T: 207.594, _u: { F_t: "N", D_1: "mm", T: "N-m" } }, "N-m"]
    ];
    for (const [st, stS, tU] of cases) {
      const d = buildAlignedDerivation(st, stS, [st], miscDb, []);
      validateDerivationLatex(d);
      assertOracleMatches(d, st.expectedVal, `oracle_${st.targetVar}`, miscDb, tU);
    }
  });

  test("Regression: compound rank unpacking, dimless targets, ^p branches, nested series sums, and acos/atan arg conversions", () => {
    const assertOracleMatches = assertDerivationMatchesAnswer;

    // 1. Canonical kW / (kg/s) -> kJ/kg must not emit spurious 1/1000
    const bypassDb = TOPICS.hvac_bypass_air.varsDb;
    const S_bypass = { q_c: 216, m_m: 10, h_s: 35.4, h_m: 57, _u: { q_c: "kW", m_m: "kg/s", h_s: "kJ/kg", h_m: "kJ/kg" } };
    const stepBypass = { targetVar: "h_m", baseFormula: "h_m = q_c / m_m + h_s", rhsExpr: "q_c / m_m + h_s", expectedVal: 57 };
    const dBypass = buildAlignedDerivation(stepBypass, S_bypass, [stepBypass], bypassDb, []);
    validateDerivationLatex(dBypass);
    assertOracleMatches(dBypass, 57, "bypass_kw_kgs_kjkg", bypassDb, "kJ/kg");

    // 2. hp / rpm -> J and hp / rpm -> N-m and kg*m^2/s^3 / lb-in -> rpm
    const helicalDb = TOPICS.helical_gears.varsDb;
    const dJ = buildAlignedDerivation(
      { targetVar: "M_t", baseFormula: "M_t = P / (2 * pi * n_1)", rhsExpr: "P / (2 * pi * n_1)", expectedVal: 185.763 },
      { P: 30, n_1: 1150, M_t: 185.763, _u: { P: "hp", n_1: "rpm", M_t: "J" } },
      [], helicalDb, []
    );
    validateDerivationLatex(dJ);
    assertOracleMatches(dJ, 185.763, "hp_rpm_to_J", helicalDb, "J");

    const dNm = buildAlignedDerivation(
      { targetVar: "M_t", baseFormula: "M_t = P / (2 * pi * n_1)", rhsExpr: "P / (2 * pi * n_1)", expectedVal: 207.593 },
      { P: 33.5256, n_1: 1150, M_t: 207.593, _u: { P: "hp", n_1: "rpm", M_t: "N-m" } },
      [], helicalDb, []
    );
    validateDerivationLatex(dNm);
    assertOracleMatches(dNm, 207.593, "hp_rpm_to_Nm", helicalDb, "N-m");

    const dRpm = buildAlignedDerivation(
      { targetVar: "n_1", baseFormula: "n_1 = P / (2 * pi * M_t)", rhsExpr: "P / (2 * pi * M_t)", expectedVal: 1150 },
      { P: 22371, M_t: 1644.14, n_1: 1150, _u: { P: "kg*m^2/s^3", M_t: "lb-in", n_1: "rpm" } },
      [], helicalDb, []
    );
    validateDerivationLatex(dRpm);
    assertOracleMatches(dRpm, 1150, "watt_lbin_to_rpm", helicalDb, "rpm");

    // 3. Dimensionless target with compound source units (helical coil n_e)
    const coilDb = TOPICS.springs_helical_coil.varsDb;
    const dCoilNe = buildAlignedDerivation(
      { targetVar: "n_e", baseFormula: "n_e = (delta * G * (d_w^4)) / (8 * F * (D_m^3))", rhsExpr: "(delta * G * (d_w^4)) / (8 * F * (D_m^3))", expectedVal: 10 },
      { delta: 25.6, G: 80, d_w: 10, F: 500, D_m: 80, n_e: 10, _u: { delta: "mm", G: "GPa", d_w: "mm", F: "N", D_m: "mm", n_e: "dimless" } },
      [], coilDb, []
    );
    validateDerivationLatex(dCoilNe);
    assertOracleMatches(dCoilNe, 10, "coil_dimless_ne", coilDb, "dimless");

    // 4. Power-wrapped additive group (F_R^2 - (W_t^2 + W_r^2))^(1/2) -> F_a
    const dFa = buildAlignedDerivation(
      { targetVar: "F_a", baseFormula: "F_a = (F_R^2 - (W_t^2 + W_r^2))^(1/2)", rhsExpr: "(F_R^2 - (W_t^2 + W_r^2))^(1/2)", expectedVal: 884.566 },
      { F_R: 1.88267, W_t: 1532.11, W_r: 0.643912, F_a: 884.566, _u: { F_R: "klb_f", W_t: "lb_f", W_r: "klb_f", F_a: "lb_f" } },
      [], helicalDb, []
    );
    validateDerivationLatex(dFa);
    assertDerivationMatchesAnswer(dFa, 884.566, "helical_fa_pow_half");
    assertOracleMatches(dFa, 884.566, "helical_fa_pow_half_oracle", helicalDb, "lb_f");

    // 5. Unfactored nested sum 1 / (1/k_1 + 1/k_2) -> k_T
    const seriesDb = TOPICS.springs_series.varsDb;
    const dSeries = buildAlignedDerivation(
      { targetVar: "k_T", baseFormula: "k_T = 1 / (1 / k_1 + 1 / k_2)", rhsExpr: "1 / (1 / k_1 + 1 / k_2)", expectedVal: 4.38343 },
      { k_1: 10, k_2: 44.5392, k_T: 4.38343, _u: { k_1: "N/mm", k_2: "lb_f/in", k_T: "N/mm" } },
      [], seriesDb, []
    );
    validateDerivationLatex(dSeries);
    assertOracleMatches(dSeries, 4.38343, "series_nested_sum", seriesDb, "N/mm");

    // 6. Inverse trig acos(P_cn / P_c) with mismatched length units (in vs mm)
    const dAcos = buildAlignedDerivation(
      { targetVar: "psi", baseFormula: "psi = acos(P_cn / P_c)", rhsExpr: "acos(P_cn / P_c)", expectedVal: 25 },
      { P_cn: 0.618424, P_c: 17.3318, psi: 25, _u: { P_cn: "in", P_c: "mm", psi: "°" } },
      [], helicalDb, []
    );
    validateDerivationLatex(dAcos);
    assertOracleMatches(dAcos, 25, "helical_acos_in_mm", helicalDb, "°");
  });
});

describe("Linear-Rational CAS, Oracle Guards & Affine Frame Derivations", () => {
  test("isolateVariable solves linear-rational denominators (t_adp, h_adp, Q_s, R_ct, M_w1, P_v) and rejects non-linear ones", () => {
    const cases = [
      ["BF = (t_s - t_adp) / (t_m - t_adp)", "t_adp", { BF: 0.2, t_s: 13.24, t_m: 26.2 }, 10],
      ["BF = (h_s - h_adp) / (h_m - h_adp)", "h_adp", { BF: 0.2, h_s: 36, h_m: 60 }, 30],
      ["SHR = Q_s / (Q_s + Q_l)", "Q_s", { SHR: 0.7, Q_l: 30 }, 70],
      ["eta_ct = R_ct / (R_ct + A_ct)", "R_ct", { eta_ct: 0.6, A_ct: 8 }, 12],
      ["X_1 = M_w1 / (1 - M_w1)", "M_w1", { X_1: 1.5 }, 0.6],
      ["W = 0.622 * P_v / (P_t - P_v)", "P_v", { W: 0.01555, P_t: 101.325 }, 2.4713]
    ];
    for (const [formula, target, env, expected] of cases) {
      const iso = isolateVariable(formula, target);
      assert.equal(iso.success, true, `Expected isolateVariable to solve ${target} from ${formula}`);
      const res = evaluatePhysicalAST(parseMathAST(iso.isolatedRhs), env, target, {});
      assert.ok(Math.abs(res.value - expected) < 1e-2, `${formula} -> ${target}: got ${res.value}, expected ${expected}`);
    }
    assert.equal(isolateVariable("e_th = 1 - (1 / (r_k^(k - 1))) * ((r_c^k - 1) / (k * (r_c - 1)))", "r_c").success, false);
  });

  test("latex_oracle rejects standalone pureUnit operands while keeping Omit-1 unit fractions valid", () => {
    assert.ok(Number.isNaN(evalLatexMathToNumber("6 + °C")));
    assert.ok(Number.isNaN(evalLatexMathToNumber("\\cfrac{\\text{kg}}{\\text{s}}")));
    assert.ok(Number.isNaN(evalLatexMathToNumber("°C")));
    assert.equal(evalLatexMathToNumber("10 \\, \\cfrac{\\text{kg}}{\\text{s}}"), 10);
    const conv = evalLatexMathToNumber("60 \\, \\cfrac{\\text{kg}}{2.20462 \\, \\cancel{\\text{lb}}}");
    assert.ok(Math.abs(conv - 60 / 2.20462) < 1e-4);
  });

  test("Bypass air derivations: t_r offset row + consistent m_o cancellation, t_s delta frame, t_adp, and t_rh value preservation", () => {
    const topic = TOPICS.hvac_bypass_air;
    const db = topic.varsDb;
    const S_base = withSeededRandom(1, () => topic.createSystem({ sys: "SI" }));
    const S = { ...S_base, BF: 0.2, t_s: 13.24, t_rh: 19.24, q_rh: 60.372, _u: { ...S_base._u } };

    // 1. t_r in canonical kg/s and restated kg/min vs kg/h: explicit K -> °C offset row + m_o cancelled
    for (const _u of [
      { ...S._u },
      { ...S._u, m_m: "kg/min", m_o: "kg/min", m_r: "kg/h" }
    ]) {
      const S_r = _u.m_m === "kg/min"
        ? { ...S, m_m: 600, m_o: 120, m_r: 28800, _u }
        : { ...S, _u };
      const stepR = {
        targetVar: "t_r",
        baseFormula: "m_m * t_m = m_o * t_o + m_r * t_r",
        rhsExpr: "(m_m * t_m - m_o * t_o) / m_r",
        expectedVal: 24
      };
      const dR = buildAlignedDerivation(stepR, S_r, [stepR], db, topic.relations);
      validateDerivationLatex(dR);
      assertDerivationMatchesAnswer(dR, 24, "bypass_tr", db, "°C");
      assert.ok(dR.includes("297.15 \\, \\text{K} - 273.15"), `Expected K -> °C offset row in t_r:\n${dR}`);
      const rhsRow = dR.split(/\\\\(?:\[\d+pt\])?/)[3] || "";
      assert.ok(!rhsRow.includes("2 \\, \\cfrac{\\text{kg}}{\\text{s}}") && !rhsRow.includes("120 \\, \\cfrac{\\text{kg}}{\\text{min}}"), `Expected m_o units cancelled in numerator:\n${rhsRow}`);
    }

    // 2. t_s = BF * (t_m - t_adp) + t_adp stays in °C without a K detour
    const stepS = {
      targetVar: "t_s",
      baseFormula: "BF = (t_s - t_adp) / (t_m - t_adp)",
      rhsExpr: "BF * (t_m - t_adp) + t_adp",
      expectedVal: 13.24
    };
    const dS = buildAlignedDerivation(stepS, S, [stepS], db, topic.relations);
    validateDerivationLatex(dS);
    assertDerivationMatchesAnswer(dS, 13.24, "bypass_ts", db, "°C");
    assert.ok(!dS.includes("273.15"), `t_s should not take a K detour when staying in °C:\n${dS}`);
    assert.ok(dS.includes("\\Delta°C"), `Expected Δ°C on (t_m - t_adp):\n${dS}`);

    // 3. t_adp = (t_s - BF * t_m) / (1 - BF) evaluates in K and ends with K -> °C conversion row
    const stepAdp = {
      targetVar: "t_adp",
      baseFormula: "BF = (t_s - t_adp) / (t_m - t_adp)",
      rhsExpr: "(t_s - BF * t_m) / (1 - BF)",
      expectedVal: 10
    };
    const dAdp = buildAlignedDerivation(stepAdp, S, [stepAdp], db, topic.relations);
    validateDerivationLatex(dAdp);
    assertDerivationMatchesAnswer(dAdp, 10, "bypass_tadp", db, "°C");
    assert.ok(dAdp.includes("283.15 \\, \\text{K} - 273.15"), `Expected K -> °C offset row in t_adp:\n${dAdp}`);

    // 4. t_rh = q_rh / (m_m * c_pa) + t_s preserves 13.24 °C and uses ΔK
    const stepRh = {
      targetVar: "t_rh",
      baseFormula: "q_rh = m_m * c_pa * (t_rh - t_s)",
      rhsExpr: "q_rh / (m_m * c_pa) + t_s",
      expectedVal: 19.24
    };
    const dRh = buildAlignedDerivation(stepRh, S, [stepRh], db, topic.relations);
    validateDerivationLatex(dRh);
    assertDerivationMatchesAnswer(dRh, 19.24, "bypass_trh", db, "°C");
    assert.ok(dRh.includes("+ 13.24 \\, °C"), `Expected numeric t_s value preserved:\n${dRh}`);
    assert.ok(dRh.includes("\\Delta\\text{K}"), `Expected ΔK in c_pa:\n${dRh}`);
  });

  test("Cooling tower Range converts Δ°C -> Δ°F linearly without an absolute K detour", () => {
    const db = TOPICS.hvac_cooling_tower.varsDb;
    const S = { t_w1: 36, t_w2: 29, R_ct: 12.6, _u: { t_w1: "°C", t_w2: "°C", R_ct: "Δ°F" } };
    const step = { targetVar: "R_ct", baseFormula: "R_ct = t_w1 - t_w2", rhsExpr: "t_w1 - t_w2", expectedVal: 12.6 };
    const deriv = buildAlignedDerivation(step, S, [step], db, []);
    validateDerivationLatex(deriv);
    assertDerivationMatchesAnswer(deriv, 12.6, "ct_range_delta_f", db, "Δ°F");
    assert.ok(!deriv.includes("273.15"), `Delta conversion must not add 273.15:\n${deriv}`);
    assert.ok(deriv.includes("1.8"), `Expected 1.8 Δ°F/Δ°C scale:\n${deriv}`);
  });

  test("Idea B unit filtering keeps yd for large lengths while switching small deformations away from yd", () => {
    const topic = TOPICS.pv_thin_walled_cylinders;
    const S = topic.createSystem({ sys: "SI" });
    const metaDelta = topic.varsDb.delta_D;
    const metaDiam = topic.varsDb.D_i;

    const deltaLevels = unitLevels("mm", metaDelta, mulberry32(1), S.delta_D);
    assert.ok(!deltaLevels.includes("yd"), `delta_D (${S.delta_D} mm) should not restate to yd: ${deltaLevels}`);
    assert.ok(deltaLevels.includes("mm") && deltaLevels.includes("cm"), `Expected smaller SI units for delta_D: ${deltaLevels}`);

    const diamLevels = unitLevels("mm", metaDiam, mulberry32(1), S.D_i);
    assert.ok(diamLevels.includes("yd"), `Large D_i (${S.D_i} mm) should still retain yd in matrix levels: ${diamLevels}`);

    for (const mode of ["SI", "US", "MIXED"]) {
      withSeededRandom(7, () => {
        const sampled = applyProblemUnitSampling(topic.createSystem({ sys: mode === "US" ? "US" : "SI" }), topic.varsDb, mode);
        assert.notEqual(sampled._u.delta_D, "yd", `applyProblemUnitSampling(${mode}) must not select yd for delta_D`);
      });
    }
  });
});

describe("MCQ Mode, Registry, Adaptive Grid & ZIP Unpacker", () => {
  test("Verify MCQ set registry, option sampling, adaptive grid, and ZIP unpacking", async () => {
    await runMcqTests();
  });
});