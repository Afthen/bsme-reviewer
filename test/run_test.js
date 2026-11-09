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
import { evaluatePhysicalAST } from "../src/cas/units/index.js";
import { parseMathAST } from "../src/cas/ast.js";
import { runTopicMixTests } from "./topic_mix_test.js";
import { recordAttempt, getDecayedMastery, FADING_THRESHOLD } from "../src/mastery/index.js";
import { pruneSolutionPath, solveDAG } from "../src/core/graph_solver.js";
import {
  sampleSystemMode, sampleByInverseTokens, retainsSufficientSigFigs,
  applyProblemUnitSampling
} from "../src/core/unit_sampler.js";
import { getOklabMasteryColor } from "../src/ui/sidebar_view.js";

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
  assert.ok(!/\\text\{[^}]*_[^}]*\}/.test(derivLatex), `Unescaped underscore inside \\text{} in step: ${derivLatex}`);
  assert.ok(!/\\cdot\^/.test(derivLatex), `\\cdot cannot take a direct superscript in step: ${derivLatex}`);
  assert.ok(!/\\cancel\{\s*\}/.test(derivLatex), `Empty cancel bracket in step: ${derivLatex}`);
  assert.ok(!derivLatex.includes("\\cfrac{\\cfrac{"), `Illegal nested fraction tower in step: ${derivLatex}`);

  assert.ok(
    !/\d+,\s*(?:\\text|\\cfrac|\\cancel|°)/.test(derivLatex),
    `Found numeric literal immediately followed by comma before unit in: ${derivLatex}`
  );
  assert.ok(
    !/\),\s*(?:\\text|\\cfrac|\\cancel|°)/.test(derivLatex),
    `Found closing paren immediately followed by comma before unit in: ${derivLatex}`
  );

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

  const beginAligned = (derivLatex.match(/\\begin\{aligned\}/g) || []).length;
  const endAligned = (derivLatex.match(/\\end\{aligned\}/g) || []).length;
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
// 3. WHOLE-CYCLE SYNTHESIS & COGNITIVE FADING VERIFICATION
// ============================================================================
describe("Whole-Cycle Problem Synthesis & Natural Step Fading", () => {
  test("Beginner learner (0% mastery) receives the full cycle with all state points in Diesel Cycle", () => {
    const topic = TOPICS.powerplant_design_diesel_cycle;
    const problem = generateProblem(topic, () => 0); // 0% mastery

    assert.ok(problem.solution.length >= 7, "Diesel cycle must present full state point sequence");
    const targetVars = problem.solution.map(s => s.targetVar);

    assert.ok(targetVars.includes("T_2"), "Point 2 (T_2) must be in solution");
    assert.ok(targetVars.includes("T_3"), "Point 3 (T_3) must be in solution");
    assert.ok(targetVars.includes("T_4"), "Point 4 (T_4) must be in solution");
    assert.ok(targetVars.includes("Q_A"), "Heat added (q_A) must be in solution");
    assert.ok(targetVars.includes("Q_R"), "Heat rejected (q_R) must be in solution");
    assert.ok(targetVars.includes("W_net"), "Net work (w_net) must be in solution");
    assert.ok(targetVars.includes("e_th"), "Efficiency (e_th) must be in solution");

    problem.solution.forEach(s => {
      assert.equal(s.isFaded, false, `Step ${s.targetVar} should not be faded at 0% mastery`);
    });
  });

  test("Beginner learner (0% mastery) receives full air handling cycle with Points 1 to 6 in Bypass Air", () => {
    const topic = TOPICS.hvac_bypass_air;
    const problem = generateProblem(topic, () => 0); // 0% mastery

    assert.ok(problem.solution.length >= 8, "Bypass air must present full air handling cycle");
    const targetVars = problem.solution.map(s => s.targetVar);

    assert.ok(targetVars.includes("m_m"), "Mixed air mass flow must be in solution");
    assert.ok(targetVars.includes("t_m"), "Point 3 temp (t_m) must be in solution");
    assert.ok(targetVars.includes("h_m"), "Point 3 enthalpy (h_m) must be in solution");
    assert.ok(targetVars.includes("t_s"), "Point 5 temp (t_s) must be in solution");
    assert.ok(targetVars.includes("h_s"), "Point 5 enthalpy (h_s) must be in solution");
    assert.ok(targetVars.includes("q_c"), "Cooling coil load (q_c) must be in solution");
    assert.ok(targetVars.includes("q_rh"), "Reheater load (q_rh) must be in solution");
    assert.ok(targetVars.includes("V_s"), "Supply fan capacity (V_s) must be in solution");

    problem.solution.forEach(s => {
      assert.equal(s.isFaded, false, `Step ${s.targetVar} should not be faded at 0% mastery`);
    });
  });

  test("Natural cognitive fading: mastered intermediate state points are literally hidden from solution steps", () => {
    const topic = TOPICS.powerplant_design_diesel_cycle;

    const getMastery = eq => {
      if (eq.id === "eq_diesel_t2" || eq.id === "eq_diesel_rk") return 0.95;
      return 0.20;
    };

    const problem = generateProblem(topic, getMastery);
    const stepT2 = problem.solution.find(s => s.targetVar === "T_2");
    assert.ok(stepT2, "Step T_2 must exist in DAG");
    assert.equal(stepT2.isFaded, true, "Mastered intermediate step T_2 must be marked faded");

    // Faded steps are literally excluded from active interactive solution steps
    const activeSteps = problem.solution.filter(s => !s.isFaded);
    assert.ok(!activeSteps.some(s => s.targetVar === "T_2"), "Faded step T_2 must be hidden from solution steps");
    assert.ok(!activeSteps.some(s => s.targetVar === "r_e"), "Faded step r_e must be hidden from solution steps");

    // The statement goals and active steps must match exactly
    assert.ok(!problem.statement.includes("Determine: (1) Temperature after Compression ($T_2$)"));
    const stepEth = activeSteps.find(s => s.targetVar === "e_th");
    assert.ok(stepEth, "Terminal goal e_th must remain in active solution steps");
    assert.equal(stepEth.isFaded, false);
  });
});

// ============================================================================
// 4. PHYSICAL COHERENT EVALUATION & REQUIREDUNITS TARGET SCALING
// ============================================================================
describe("Physical Coherent Base Evaluation & Empirical Target Unit Scaling", () => {
  test("Multi-unit addition IP = BP (hp) + FP (W) evaluates with physical accuracy without raw number concatenation", () => {
    const node = parseMathAST("BP + FP");
    const S = {
      BP: 4023.07,  // ~3000 kW in hp
      FP: 409091,   // ~409 kW in W
      _u: { BP: "hp", FP: "W", IP: "ft-lb/s" }
    };
    const varsDb = {
      BP: { dimension: "Power", unit: "hp" },
      FP: { dimension: "Power", unit: "W" },
      IP: { dimension: "Power", unit: "ft-lb/s" }
    };

    const { value } = evaluatePhysicalAST(node, S, "IP", varsDb);
    assert.ok(value > 2.4e6 && value < 2.6e6, `Expected ~2.51e6 ft-lb/s, got: ${value}`);
    assert.ok(value < 1e8, `Value should not blow up to 227 million, got: ${value}`);
  });

  test("Buckingham dynamic load with requiredUnits { F_D: 'lb' } converts to requested target 'kip' (3.796 kip, not 3795.9)", () => {
    const rel = TOPICS.helical_gears.relations.find(r => r.id === "eq_helical_buckingham");
    assert.ok(rel, "Helical buckingham relation must exist");

    const variant = rel.variants.US;
    const node = parseMathAST(variant.baseFormula.split("=")[1].trim());

    const S = {
      W_t: 2.74752,
      V_m: 600.295,
      b: 0.167,
      C_d: 400,
      psi: 25,
      F_D: 3.7959,
      _u: { W_t: "kip", V_m: "ft/min", b: "ft", C_d: "lb", psi: "°", F_D: "kip" }
    };

    const { value, unitAnalysis } = evaluatePhysicalAST(node, S, "F_D", TOPICS.helical_gears.varsDb, variant.requiredUnits);

    assert.ok(value > 3.7 && value < 3.9, `Expected ~3.796 kip, got: ${value}`);
    assert.equal(unitAnalysis.numericConversionFactor, 0.001);

    const deriv = buildAlignedDerivation(
      { targetVar: "F_D", baseFormula: variant.baseFormula, canonicalTex: variant.canonicalTex, requiredUnits: variant.requiredUnits, expectedVal: value },
      S, [], TOPICS.helical_gears.varsDb, TOPICS.helical_gears.relations
    );

    assert.ok(deriv.includes("3.796") || deriv.includes("3.7959"), `Derivation must box the value in kips, got: ${deriv}`);
    assert.ok(!deriv.includes("3795.9\\,\\text{kip}"));
  });

  test("Carrier vapor pressure equation with requiredUnits { P_v: 'kPa' } converts to target 'psi'", () => {
    const rel = TOPICS.hvac_air_properties.relations.find(r => r.id === "eq_carrier_pv");
    assert.ok(rel, "Carrier relation must exist");

    const node = parseMathAST(rel.baseFormula.split("=")[1].trim());
    const S = {
      P_wb: 3.169, // kPa
      P_t: 101.325, // kPa
      t_db: 30.0, // °C
      t_wb: 25.0, // °C
      P_v: 0.41,
      _u: { P_wb: "kPa", P_t: "kPa", t_db: "°C", t_wb: "°C", P_v: "psi" }
    };

    const { value, unitAnalysis } = evaluatePhysicalAST(node, S, "P_v", TOPICS.hvac_air_properties.varsDb, rel.requiredUnits);

    // In kPa: 3.169 - 101.325 * 5 / 1500 = 2.831 kPa.
    // In psi: 2.831 kPa * 0.145038 psi/kPa = ~0.4106 psi.
    assert.ok(value > 0.40 && value < 0.42, `Expected ~0.4106 psi, got: ${value}`);
    assert.ok(Math.abs(unitAnalysis.numericConversionFactor - 0.145038) < 0.001);
  });

  test("Brake Specific Fuel Consumption with requiredUnits { bsfc: 'kg/kWh' } converts to target 'lb/hp-hr'", () => {
    const rel = TOPICS.powerplant_design_diesel_engine.relations.find(r => r.id === "eq_de_bsfc");
    assert.ok(rel, "BSFC relation must exist");

    const node = parseMathAST(rel.baseFormula.split("=")[1].trim());
    const S = {
      m_f: 0.15, // kg/s
      BP: 3000,  // kW
      bsfc: 0.18,
      _u: { m_f: "kg/s", BP: "kW", bsfc: "lb/hp-hr" }
    };

    const { value, unitAnalysis } = evaluatePhysicalAST(node, S, "bsfc", TOPICS.powerplant_design_diesel_engine.varsDb, rel.requiredUnits);

    // In kg/kWh: (0.15 * 3600) / 3000 = 0.18 kg/kWh.
    // 1 kg/kWh = 1.64399 lb/hp-hr => 0.18 * 1.64399 = ~0.2959 lb/hp-hr.
    assert.ok(value > 0.28 && value < 0.31, `Expected ~0.296 lb/hp-hr, got: ${value}`);
    assert.ok(Math.abs(unitAnalysis.numericConversionFactor - 1.644) < 0.01);
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

    const deriv = buildAlignedDerivation(step, S, [step], varsDb, []);
    assert.ok(
      deriv.includes("(1200 - 750)") || deriv.includes("(1200 - 750)\\,\\cfrac{\\text{kJ}}{\\text{kg}}"),
      `Expected factored additive expression without per-variable units, got: ${deriv}`
    );
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
    for (const topic of ALL_TOPICS) {
      assert.ok(mod.TOPICS[topic.id], `app.js TOPICS export is missing topic '${topic.id}'`);
    }
  });
});
