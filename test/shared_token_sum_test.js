/**
 * test/shared_token_sum_test.js
 * Regression: a token shared by a sum's sibling term and the rest of the expression carries one
 * per-token conversion at every occurrence. The derivation must still evaluate to the target unit.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTopic } from "../src/topics/index.js";
import { withSeededRandom, collectSteps, restate, checkStep } from "./matrix_helpers.js";

const CASES = [
  { I: "in^4" },
  { I: "in^4", E: "N/mm^2" },
  { a: "ft", b: "ft", L: "cm", E: "N/mm^2", I: "in^4" }
];

for (const overrides of CASES) {
  test(`shared token in a sum keeps the target unit: ${JSON.stringify(overrides)}`, async () => {
    const topic = await loadTopic("shafting_rigidity_deflection");
    const sys = "SI";
    const S = withSeededRandom(1, () => topic.createSystem({ sys }));
    const step = collectSteps(topic, sys, S).find((s) => s.id === "eq_shaft_rdef_theta_a" && s.targetVar === "L");
    assert.ok(step, "eq_shaft_rdef_theta_a -> L step exists");

    const tokens = [...new Set([...step.nodes, step.targetVar])].filter((k) => topic.varsDb[k]);
    const units = Object.fromEntries(tokens.map((k) => [k, overrides[k] || S._u?.[k] || topic.varsDb[k].unit]));
    const S2 = restate(S, tokens, units, topic.varsDb, sys);
    const where = `shared-token ${JSON.stringify(units)}`;
    const { failures } = checkStep({
      step: { ...step, expectedVal: S2[step.targetVar] },
      S: S2,
      varsDb: topic.varsDb,
      relations: topic.relations,
      where,
      topicTag: "shafting_rigidity_deflection[SI]"
    });
    assert.deepEqual(failures.map((f) => `${f.layer}: ${f.msg}`), []);
  });
}
