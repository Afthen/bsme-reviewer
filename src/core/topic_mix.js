/**
 * src/core/topic_mix.js
 * Cross-topic weak-point targeting for multi-topic review sessions.
 *
 * Extends the single-topic mastery logic of core/problem_gen.js to a SET of
 * selected topics: each topic buys exactly one "lottery ticket" whose weight
 * is the weakness of its WEAKEST relation (same phi/fib curve problem_gen uses
 * per relation), so the session keeps drifting toward the student's worst
 * topic while remaining stochastic. Once a topic is picked, the untouched
 * generateProblem(topic, getMastery) pipeline takes over, so hops / fading /
 * recall-mode behaviour per topic is exactly as before.
 */
import { phi, fib } from "../mastery/index.js";

/**
 * Same weakness weight used by generateAutonomousProblem for one relation:
 *   weight = max(phi(-7), ((1 + phi(-6)) - mastery) ^ fib(4))
 * Monotonically decreasing in mastery -> low mastery = high weight.
 * 
 * @param {number} mastery  decayed mastery in [0, 1]
 * @returns {number} weakness weight >= phi(-7)
 */
export function relationWeaknessWeight(mastery = 0) {
  return Math.max(phi(-7), Math.pow((1 + phi(-6)) - mastery, fib(4)));
}

/**
 * Weakness of a topic = weight of its weakest (lowest-mastery) relation.
 * 
 * @param {Array}    relations   topic.relations
 * @param {Function} getMastery  relation -> decayed mastery
 * @returns {number}
 */
export function topicWeakness(relations = [], getMastery = () => 0) {
  let weakest = 0;
  relations.forEach(rel => {
    const w = relationWeaknessWeight(getMastery(rel));
    if (w > weakest) weakest = w;
  });
  return weakest;
}

/**
 * Pick which topic the next problem comes from, weakest-first.
 * One randomised ticket per topic (no bias toward topics with more equations):
 *   key = topicWeakness * (phi(-1) + phi(-2) * rand())
 * 
 * @param {Array}    topics         selected topic objects
 * @param {Function} getMasteryFor  topic -> (relation -> mastery)
 * @returns {object|null} the chosen topic, or null for an empty pool
 */
export function pickWeakestTopic(topics = [], getMasteryFor = () => () => 0) {
  if (!topics || topics.length === 0) return null;

  let bestTopic = topics[0];
  let bestKey = -Infinity;

  topics.forEach(topic => {
    const getMastery = getMasteryFor(topic) || (() => 0);
    const key =
      topicWeakness(topic.relations, getMastery) *
      (phi(-1) + phi(-2) * Math.random());
      
    if (key > bestKey) {
      bestKey = key;
      bestTopic = topic;
    }
  });

  return bestTopic;
}
