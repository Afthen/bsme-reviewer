/**
 * test/topic_mix_test.js
 * Unit cases for the D′ pool tournament.
 * Wire into test/index.html (browser runner) or run_test.js:
 *   import { runTopicMixTests } from "./topic_mix_test.js";
 *   runTopicMixTests();
 */
import { phi } from "../src/mastery/index.js";
import { relationWeaknessWeight } from "../src/core/problem_gen.js";
import { topicScore, pickWeakestTopic } from "../src/core/topic_mix.js";

function rel(id, mastery) {
  return { id, baseFormula: "a = b", mastery };
}

function getterFor(map) {
  return eq => (eq.id in map ? map[eq.id] : 0);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`topic_mix test failed: ${msg}`);
}

function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

export function runTopicMixTests() {
  // 1. Weight curve: monotone decreasing in mastery, floored at phi(-7).
  const w0 = relationWeaknessWeight(0);
  const w5 = relationWeaknessWeight(0.5);
  const w9 = relationWeaknessWeight(0.9);
  assert(w0 > w5 && w5 > w9, "weight monotone decreasing in mastery");
  assert(approx(relationWeaknessWeight(1), phi(-7)), "weight floors at phi(-7)");

  // 2. Size-neutrality: mean, not sum — count must cancel.
  const smallRels = [rel("s1", 0.4), rel("s2", 0.4)];
  const bigRels = Array.from({ length: 40 }, (_, i) => rel(`b${i}`, 0.4));
  const uniform = getterFor(
    Object.fromEntries([...smallRels, ...bigRels].map(r => [r.id, 0.4])));
  assert(
    approx(topicScore(smallRels, uniform), topicScore(bigRels, uniform)),
    "topicScore independent of equation count");

  // 3. Common discount: eq_base_* material carries share phi(-1).
  const mixedRels = [rel("u1", 0), rel("eq_base_c", 0.4)];
  const mixedGet = getterFor({ u1: 0, eq_base_c: 0.4 });
  const expected = (1 * w0 + phi(-1) * w5) / (1 + phi(-1));
  assert(
    approx(topicScore(mixedRels, mixedGet), expected),
    "common relations weighted phi(-1) in the mean");

  // 4. Tournament contract: null on empty, exact on single, member always.
  assert(pickWeakestTopic([], () => () => 0) === null, "empty pool -> null");
  const small = { id: "small", relations: smallRels };
  const big = { id: "big", relations: bigRels };
  const mixed = { id: "mixed", relations: mixedRels };
  assert(pickWeakestTopic([small], () => uniform) === small,
    "single-topic pool reduces to that topic (legacy exactness)");
  const pool = [small, big, mixed];
  for (let i = 0; i < 50; i++) {
    const pick = pickWeakestTopic(pool, t => (t === mixed ? mixedGet : uniform));
    assert(pool.includes(pick), "pick is always a pool member");
  }

  return true;
}
