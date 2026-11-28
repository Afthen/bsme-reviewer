/**
 * test/unit_frame_coherence_test.js
 * Regressions for mixed-dimension derivation frame coherence:
 *  - A net-result -> target factor binds the branch root, never an operand under sqrt/^2.
 *  - Every additive-group term reduces to one working frame (target's remembered family atom),
 *    so no computed conversion scalar is discarded (orphan) and the LaTeX matches the boxed answer.
 *  - The unit sampler orders candidates by inverse-token weight with one draw per candidate.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTopic } from "../src/topics/index.js";
import { withSeededRandom, collectSteps, restate, checkStep, mulberry32 } from "./matrix_helpers.js";
import { weightedCandidateOrder } from "../src/core/unit_sampler.js";

const DERIV_CASES = [
  { topic: "shafting_static_combined_strength", sys: "SI", rel: "eq_shaft_stat_zp_de_sizing", target: "S_y",
    units: { Z_p: "mm^3", n_DE: "dimless", M: "lb_f-ft", T: "N-m", S_y: "bar" } },
  { topic: "shafting_static_combined_strength", sys: "US", rel: "eq_shaft_stat_zp_de_sizing", target: "S_y",
    units: { Z_p: "in^3", n_DE: "dimless", M: "kN-m", T: "lb_f-in", S_y: "bar" } },
  { topic: "shafting_rigidity_deflection", sys: "SI", rel: "eq_shaft_rdef_islope", target: "L",
    units: { I_slope: "in^4", F: "kg*m/s^2", a: "mm", b: "in", L: "mm", E: "ksi", theta_allow: "rad" } },
  { topic: "shafting_rigidity_deflection", sys: "US", rel: "eq_shaft_rdef_theta_a", target: "L",
    units: { theta_A: "rad", F: "kg*m/s^2", a: "in", b: "yd", L: "mm", E: "MPa", I: "in^4" } },
  { topic: "shafting_overhung_design", sys: "SI", rel: "eq_shaft_oh_theta_tip", target: "L",
    units: { theta_tip: "rad", W: "kg*m/s^2", a: "in", L: "mm", E: "N/mm^2", I: "mm^4" } }
];

for (const c of DERIV_CASES) {
  test(`frame coherence: ${c.topic}[${c.sys}] ${c.rel} -> ${c.target}`, async () => {
    const topic = await loadTopic(c.topic);
    const S = withSeededRandom(1, () => topic.createSystem({ sys: c.sys }));
    const step = collectSteps(topic, c.sys, S).find(s => s.id === c.rel && s.targetVar === c.target);
    assert.ok(step, `${c.rel} -> ${c.target} step exists`);
    const tokens = [...new Set([...step.nodes, step.targetVar])].filter(k => topic.varsDb[k]);
    const units = Object.fromEntries(tokens.map(k => [k, c.units[k] || S._u?.[k] || topic.varsDb[k].unit]));
    const S2 = restate(S, tokens, units, topic.varsDb, c.sys);
    const { failures } = checkStep({
      step: { ...step, expectedVal: S2[step.targetVar] },
      S: S2, varsDb: topic.varsDb, relations: topic.relations,
      where: `frame-coherence ${JSON.stringify(units)}`, topicTag: `${c.topic}[${c.sys}]`
    });
    assert.deepEqual(failures.map(f => `${f.layer}: ${f.msg}`), []);
  });
}

test("weightedCandidateOrder consumes one draw per candidate and down-weights atom soup", () => {
  const candidates = [
    { unit: "N", tokens: 1 },
    { unit: "kN", tokens: 1 },
    { unit: "kg*m/s^2", tokens: 4 }
  ];
  const orig = Math.random;
  let calls = 0;
  Math.random = () => { calls++; return mulberry32(calls * 7 + 1)(); };
  try {
    weightedCandidateOrder(candidates);
    assert.equal(calls, candidates.length, "one draw per candidate");
  } finally {
    Math.random = orig;
  }

  const rng = mulberry32(42);
  const orig2 = Math.random;
  Math.random = rng;
  let soupFirst = 0, plainFirst = 0;
  try {
    for (let i = 0; i < 4000; i++) {
      const first = weightedCandidateOrder(candidates)[0].unit;
      if (first === "kg*m/s^2") soupFirst++; else plainFirst++;
    }
  } finally {
    Math.random = orig2;
  }
  assert.ok(soupFirst < plainFirst / 2, `atom soup must be rarer: soup=${soupFirst} plain=${plainFirst}`);
});
