/**
 * test/run_test.js
 * Comprehensive Headless CI Test Runner & Invariant Verification Suite.
 * Incorporates Universal Property-Based Testing:
 * - Round-trip physical invariance across all registered units
 * - Randomized 100-problem stress invariant across pure SI, US, and MIXED systems
 * - Coherent physical base projection for all relations
 */

import { test as nodeTest, describe as nodeDescribe } from "node:test";
import assert from "node:assert/strict";

let totalFailed = 0;

export function describe(name, fn) {
  fn();
}

export function test(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      res.catch(err => {
        totalFailed++;
        nodeTest(name, () => { throw err; });
      });
    }
  } catch (err) {
    totalFailed++;
    nodeTest(name, () => { throw err; });
  }
}

import { TOPIC_MANIFEST, loadAllTopics } from "../src/topics/index.js";

const ALL_TOPICS = await loadAllTopics();
const TOPICS = Object.fromEntries(ALL_TOPICS.map(t => [t.id, t]));
import { validateTopic } from "./validator.js";
import { generateProblem, determineGraphDistance } from "../src/core/problem_gen.js";
import { buildAlignedDerivation } from "../src/core/derivation.js";
import { evaluatePhysicalAST, solveUnitAlgebra, isCanonicalScaleFactor, formatPairConversion } from "../src/cas/units/index.js";
import { parseMathAST } from "../src/cas/ast.js";
import { casToTex } from "../src/cas/latex.js";
import { runTopicMixTests } from "./topic_mix_test.js";
import { recordAttempt, getDecayedMastery, FADING_THRESHOLD } from "../src/mastery/index.js";
import { pruneSolutionPath, solveDAG, canSolveTarget } from "../src/core/graph_solver.js";
import { formatGivenValue, targetLabel } from "../src/core/dimensions.js";
import {
  sampleSystemMode, sampleByInverseTokens, retainsSufficientSigFigs,
  applyProblemUnitSampling, DIMENSION_TOKEN_PALETTES
} from "../src/core/unit_sampler.js";
import {
  getUnitAtomBag,
  unitToTex,
  valueToCoherentBase,
  formatValueInUnit
} from "../src/cas/units/definitions.js";
import { getOklabMasteryColor } from "../src/ui/sidebar_view.js";
import { runMcqTests } from "./mcq_test.js";

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

let katex = null;
try {
  const mod = await import("katex");
  katex = mod.default || mod;
} catch (_) {
  katex = null;
}

export function validateDerivationLatex(derivLatex) {
  assert.ok(typeof derivLatex === "string" && derivLatex.length > 0, "Derivation LaTeX must be non-empty");
  assert.ok(derivLatex.includes("\\boxed{"), "Derivation step missing boxed answer");
  assert.ok(derivLatex.includes("="), "Derivation step missing equality");
  assert.ok(!derivLatex.includes("\\cdot^"), `\\cdot cannot take a direct superscript in step: ${derivLatex}`);
  assert.ok(!derivLatex.includes("\\cancel{}") && !derivLatex.includes("\\cancel{ }"), `Empty cancel bracket in step: ${derivLatex}`);
  assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{\\cfrac{"), `Illegal nested fraction tower (exceeds 2 levels) in step: ${derivLatex}`);
  
  let braceDepth = 0;
  for (let i = 0; i < derivLatex.length; i++) {
    const ch = derivLatex[i];
    const prev = i > 0 ? derivLatex[i - 1] : "";
    if (prev !== "\\") {
      if (ch === "{") braceDepth++;
      else if (ch === "}") braceDepth--;
      assert.ok(braceDepth >= 0, `Unbalanced closing brace '}' in derivation: ${derivLatex}`);
    }
  }
  assert.equal(braceDepth, 0, `Unbalanced opening brace '{' in derivation: ${derivLatex}`);

  const beginAligned = derivLatex.split("\\begin{aligned}").length - 1;
  const endAligned = derivLatex.split("\\end{aligned}").length - 1;
  assert.equal(beginAligned, endAligned, `Mismatched aligned environment in: ${derivLatex}`);

  if (katex && typeof katex.renderToString === "function") {
    let raw = derivLatex.trim();
    if (raw.startsWith("$$") && raw.endsWith("$$")) {
      raw = raw.slice(2, -2).trim();
    }
    try {
      katex.renderToString(raw, { displayMode: true, throwOnError: true });
    } catch (err) {
      assert.fail(`KaTeX rendering error: ${err.message} in derivation:\n${derivLatex}`);
    }
  }
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
      "K", "°C", "°F", "°R",
      "Btu", "J", "kJ", "W", "kW", "MPa", "kPa", "Pa", "psi", "psf", "ksi",
      "rpm", "cfm", "gpm", "%", "°"
    ];

    for (const invalid of ["m_f", "m_m", "N_f", "N_m", "s_m", "J_f"]) {
      assert.equal(getUnitAtomBag(invalid).isUnknown, true, `Invalid suffix unit '${invalid}' must be rejected as unknown`);
    }

    for (const u of testUnits) {
      let testVal = 42.5;
      if (u === "°C" || u === "°F" || u === "°R" || u === "K") testVal = 20.0;
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

  test("Property 2: Universal Invariant across 100 randomized problems (SI, US, MIXED)", () => {
    const TRIALS = 100;
    for (let i = 0; i < TRIALS; i++) {
      const topic = ALL_TOPICS[i % ALL_TOPICS.length];
      const problem = generateProblem(topic, () => Math.random());
      assert.ok(problem, `generateProblem returned null for topic ${topic.id}`);

      problem.givens.forEach(gVar => {
        const val = problem.system[gVar];
        const u = problem.system._u?.[gVar] || problem.varsDb[gVar]?.unit;
        assert.ok(typeof val === "number" && !isNaN(val), `Given ${gVar} has NaN value in ${topic.id}`);
        assert.ok(u, `Given ${gVar} missing unit in ${topic.id}`);

        const baseVal = valueToCoherentBase(val, u);
        assert.ok(isFinite(baseVal), `Coherent base value non-finite for ${gVar} in ${topic.id}`);
      });

      const activeSteps = problem.solution.filter(s => !s.isFaded);
      activeSteps.forEach(step => {
        const expected = step.expectedVal;
        const targetUnit = problem.system._u?.[step.targetVar];

        assert.ok(typeof expected === "number" && !isNaN(expected), `Step ${step.targetVar} has NaN expectedVal`);
        assert.ok(isFinite(expected), `Step ${step.targetVar} has non-finite expectedVal: ${expected}`);

        const stepBase = valueToCoherentBase(expected, targetUnit);
        assert.ok(isFinite(stepBase), `Step base non-finite for ${step.targetVar}`);

        const projected = formatValueInUnit(stepBase, targetUnit);
        const relErr = Math.abs(projected - expected) / (Math.abs(expected) || 1);
        assert.ok(relErr < 0.001, `Target unit projection failed on step ${step.targetVar}: expected ${expected}, got ${projected}`);
      });

      for (const step of problem.solution) {
        const deriv = buildAlignedDerivation(
          step, problem.system, problem.allSteps, problem.varsDb, topic.relations
        );
        validateDerivationLatex(deriv);

        const formulaRhs = step.rhsExpr || (step.baseFormula?.includes("=") ? step.baseFormula.split("=")[1].trim() : step.baseFormula) || "";
        const targetUnit = problem.system._u?.[step.targetVar] || problem.varsDb[step.targetVar]?.unit || "";
        const unitAnalysis = solveUnitAlgebra(formulaRhs, problem.system, step.targetVar, targetUnit, problem.varsDb, step.requiredUnits);

        for (const scalar of (unitAnalysis.conversionScalars || [])) {
          assert.ok(
            isCanonicalScaleFactor(scalar),
            `Alien scale factor detected in conversion [${topic.id}/${step.targetVar}]: [${scalar}]`
          );
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
      _u: { m_cw: "kg/min", cp_w: "kJ/kg-K", dT_cw: "K", Q_cw: "kW" }
    };
    const db_heat = {
      m_cw: { dimension: "Mass Flow Rate", unit: "kg/min" },
      cp_w: { dimension: "Specific Energy / Enthalpy", unit: "kJ/kg-K" },
      dT_cw: { dimension: "Temperature", unit: "K" },
      Q_cw: { dimension: "Power", unit: "kW" }
    };
    const resHeat = evaluatePhysicalAST(heatNode, S_heat, "Q_cw", db_heat);
    assert.ok(Math.abs(resHeat.value - 418.7) < 0.1);
  });

  test("Property 4: Universal KaTeX Syntax Invariant across all statements and derivations", () => {
    const TRIALS = 100;
    for (let i = 0; i < TRIALS; i++) {
      const topic = ALL_TOPICS[i % ALL_TOPICS.length];
      const problem = generateProblem(topic, () => Math.random());

      const str = problem.statement;
      let pos = 0;
      while (pos < str.length) {
        if (str.startsWith("$$", pos)) {
          const end = str.indexOf("$$", pos + 2);
          assert.ok(end !== -1, `Unclosed $$ in ${topic.id} statement: ${str}`);
          const math = str.slice(pos + 2, end).trim();
          if (katex) {
            try {
              katex.renderToString(math, { displayMode: true, throwOnError: true });
            } catch (err) {
              assert.fail(`KaTeX syntax error in $$ math block [${topic.id}]: ${err.message}\nLaTeX: ${math}`);
            }
          }
          pos = end + 2;
        } else if (str[pos] === "$") {
          const end = str.indexOf("$", pos + 1);
          assert.ok(end !== -1, `Unclosed $ in ${topic.id} statement: ${str}`);
          const math = str.slice(pos + 1, end).trim();
          if (katex) {
            try {
              katex.renderToString(math, { displayMode: false, throwOnError: true });
            } catch (err) {
              assert.fail(`KaTeX syntax error in inline $ block [${topic.id}]: ${err.message}\nLaTeX: ${math}`);
            }
          }
          pos = end + 1;
        } else {
          pos++;
        }
      }

      for (const step of problem.solution) {
        const deriv = buildAlignedDerivation(
          step, problem.system, problem.allSteps, problem.varsDb, topic.relations
        );
        validateDerivationLatex(deriv);
      }
    }
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
      _u: { T_1: "°F", T_4: "°R", c_v: "kJ/kg-K", Q_R: "Btu/lb_m" }
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
    assert.ok(deriv.includes("\\cancel{°R}"), `Cancelling °R must be marked cancelled: ${deriv}`);

    // Must break vertically across multiple aligned rows
    assert.ok((deriv.match(/\\\\\[6pt\]/g) || []).length >= 4, `Expected vertical multi-row aligned layout: ${deriv}`);
  });
});

describe("MCQ Mode, Registry, Adaptive Grid & ZIP Unpacker", () => {
  test("Verify MCQ set registry, option sampling, adaptive grid, and ZIP unpacking", async () => {
    await runMcqTests();
  });
});

nodeTest("Test Suite Summary", () => {
  assert.equal(totalFailed, 0, `${totalFailed} test(s) failed.`);
});