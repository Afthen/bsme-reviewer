/**
 * src/core/topic_mix.js
 * Cross-topic weak-point targeting for multi-topic review sessions.
 *
 * Tournament: exactly one randomized ticket per topic per draw,
 *   key = topicScore * (phi(-1) + phi(-2) * rand())
 * topicScore is the share-weighted MEAN weakness per effective equation:
 *   score = Σ share(rel)·weight(mastery(rel)) / Σ share(rel)
 *   share = 1 for unique relations, phi(-1) for common (eq_base_*) —
 *   the same discount idiom calculateTopicLambda applies to half-life tokens.
 *
 * Why mean (not sum, not max): equation count cancels (size-neutral), there is
 * no order-statistics leak, and breadth of weakness — not a single worst
 * equation — earns topic airtime, which is the midterm-prep signal.
 * The weight formula is imported from problem_gen.js (one source of truth).
 * With a 1-topic pool the single ticket always wins, so mechanics reduce
 * verbatim to the legacy single-topic generation path.
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
  relations.forEach(rel => {
    const share = relationShare(rel);
    shareSum += share;
    weighted += share * relationWeaknessWeight(getMastery(rel));
  });
  return shareSum > 0 ? weighted / shareSum : 0;
}

/**
 * Pick which topic the next problem comes from, weakest-material-first.
 * @param {Array}    topics        selected topic objects
 * @param {Function} getMasteryFor topic -> (relation -> mastery)
 * @returns {object|null} the chosen topic, or null for an empty pool
 */
export function pickWeakestTopic(topics = [], getMasteryFor = () => () => 0) {
  if (!topics || topics.length === 0) return null;

  let bestTopic = topics[0];
  let bestKey = -Infinity;

  topics.forEach(topic => {
    const getMastery = getMasteryFor(topic) || (() => 0);
    const key =
      topicScore(topic.relations, getMastery) *
      (phi(-1) + phi(-2) * Math.random());
    if (key > bestKey) {
      bestKey = key;
      bestTopic = topic;
    }
  });

  return bestTopic;
}
