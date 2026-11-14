/**
 * src/core/topic_mix.js
 * Cross-topic weak-point targeting for multi-topic review sessions.
 *
 * Unified Stochastic Selection:
 *   Draws topics with probability proportional to their aggregate weakness score:
 *     P(topic_i) = topicScore_i / Σ topicScore_j
 *
 * - Single-topic pool reduces verbatim to that topic (100% deterministic).
 * - Lowest mastery topic has the highest probability of being chosen.
 * - Higher mastery topics maintain non-zero probability for spaced review.
 * - Pure AST / algebraic weighting with zero regex.
 */
import { phi, isCommonEq } from "../mastery/index.js";
import { relationWeaknessWeight } from "./problem_gen.js";

/**
 * Effective share of one relation in a topic's size aggregate.
 * @param {object} eq relation object
 * @returns {number} 1 for unique material, phi(-1) for shared eq_base_* material
 */
export function relationShare(eq) {
  return isCommonEq(eq) ? phi(-1) : 1;
}

/**
 * Size-normalized mean weakness of a topic's material.
 * @param {Array}    relations  topic.relations
 * @param {Function} getMastery relation -> decayed mastery (contract: gets a RELATION)
 * @returns {number} mean weakness weight in [phi(-7), (1+phi(-6))^fib(4)]
 */
export function topicScore(relations = [], getMastery = () => 0) {
  let shareSum = 0;
  let weighted = 0;
  const seen = new Set();
  relations.forEach(rel => {
    const key = rel.masteryId || rel.id;
    if (key && seen.has(key)) return;
    if (key) seen.add(key);
    const share = relationShare(rel);
    shareSum += share;
    weighted += share * relationWeaknessWeight(getMastery(rel));
  });
  return shareSum > 0 ? weighted / shareSum : 0;
}

/**
 * Pick which topic the next problem comes from using unified weakness-proportional sampling.
 * @param {Array}    topics        selected topic objects
 * @param {Function} getMasteryFor topic -> (relation -> mastery)
 * @param {Function} rng           random generator returning [0, 1)
 * @returns {object|null} the chosen topic, or null for an empty pool
 */
export function pickWeakestTopic(topics = [], getMasteryFor = () => () => 0, rng = Math.random) {
  if (!topics || topics.length === 0) return null;
  if (topics.length === 1) return topics[0];

  const scores = topics.map(t => {
    const getMastery = getMasteryFor(t) || (() => 0);
    return Math.max(0, topicScore(t.relations, getMastery));
  });

  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  if (totalScore <= 0) {
    return topics[Math.floor(rng() * topics.length)];
  }

  let threshold = rng() * totalScore;
  for (let i = 0; i < topics.length; i++) {
    threshold -= scores[i];
    if (threshold <= 0) {
      return topics[i];
    }
  }

  return topics[topics.length - 1];
}
