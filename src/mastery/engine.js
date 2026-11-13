/**
 * src/mastery/engine.js
 * Mastery Engine: Decay curves, attempt history, and graph ancestry propagation.
 * isCommonEq is the single source of the eq_base_* prefix convention.
 */

import { tokenizeExpr } from "../cas/ast.js";
import { phi, fib, snapToFibonacci, MAX_HISTORY } from "./constants.js";
import {
  getTopicTick,
  readMasteryStore,
  writeMasteryStore,
  serializeMasteryPayload,
  parseMasteryPayload
} from "./storage.js";

let masteryState = {};

/** Single source of the shared-material prefix convention. */
export function isCommonEq(eq) {
  const id = eq?.masteryId || eq?.id;
  return typeof id === "string" && id.startsWith("eq_base_");
}

export function loadMastery() {
  masteryState = readMasteryStore();
  return masteryState;
}

export function saveMastery() {
  writeMasteryStore(masteryState);
}

export function exportMasteryJSON() {
  return serializeMasteryPayload(masteryState);
}

export function importMasteryJSON(jsonStr) {
  const res = parseMasteryPayload(jsonStr);
  if (res.success) {
    masteryState = res.newState;
    saveMastery();
    return { success: true };
  }
  return res;
}

export function calculateTopicLambda(topic) {
  if (!topic || !Array.isArray(topic.relations) || topic.relations.length === 0) {
    return phi(-7);
  }

  const seen = new Map();
  topic.relations.forEach(r => {
    const key = r.masteryId || r.id;
    if (key && !seen.has(key)) seen.set(key, r);
  });
  const deduped = Array.from(seen.values());
  const commonRels = deduped.filter(isCommonEq);
  const uniqueRels = deduped.filter(r => !isCommonEq(r));

  const tokensCommon = commonRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);
  const tokensUnique = uniqueRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);

  const halfLife = (tokensUnique / Math.E) + (tokensCommon / (Math.E * phi(1)));
  const safeHalfLife = Math.max(fib(8), halfLife);

  return Math.LN2 / safeHalfLife;
}

export function getDecayedMastery(eq, topic = null) {
  const eqId = eq?.masteryId || eq?.id;
  if (!eqId) return 0;

  const h = masteryState[eqId];
  const history = h && Array.isArray(h.attempts) ? h.attempts : [];

  const tokens = tokenizeExpr(eq.baseFormula || "").length;
  const windowSize = snapToFibonacci(tokens / Math.E);

  const recent = history.slice(-windowSize);
  const padded = [...Array(Math.max(0, windowSize - recent.length)).fill(false), ...recent];

  let weightSum = 0;
  let scoreSum = 0;
  for (let i = 0; i < windowSize; i++) {
    const w = phi(-(windowSize - 1 - i));
    weightSum += w;
    scoreSum += (padded[i] ? 1 : 0) * w;
  }
  const baseMastery = weightSum > 0 ? scoreSum / weightSum : 0;

  const isCommon = isCommonEq(eq);
  const scopeKey = isCommon ? "common" : (topic?.id || "common");
  const currentTick = getTopicTick(scopeKey);
  const lastTick = h && typeof h.lastTick === "number" ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);

  const lambdaTopic = topic ? calculateTopicLambda(topic) : phi(-7);
  const decayMultiplier = Math.exp(-lambdaTopic * deltaTicks);

  return baseMastery * decayMultiplier;
}

export function recordAttempt(eqId, success, topicId = null) {
  const isCommon = isCommonEq({ id: eqId });
  const scopeKey = isCommon ? "common" : (topicId || "common");
  const currentTick = getTopicTick(scopeKey);

  if (!masteryState[eqId]) {
    masteryState[eqId] = { attempts: [], lastTick: currentTick };
  }
  masteryState[eqId].attempts.push(!!success);
  if (masteryState[eqId].attempts.length > MAX_HISTORY) {
    masteryState[eqId].attempts.shift();
  }
  masteryState[eqId].lastTick = currentTick;
  saveMastery();
}

export function penalizeAncestors(ancestorEqIds = [], topicId = null) {
  ancestorEqIds.forEach(eqId => {
    const isCommon = isCommonEq({ id: eqId });
    const scopeKey = isCommon ? "common" : (topicId || "common");
    const currentTick = getTopicTick(scopeKey);

    if (!masteryState[eqId]) {
      masteryState[eqId] = { attempts: [], lastTick: currentTick };
    }
    masteryState[eqId].attempts.push(false);
    if (masteryState[eqId].attempts.length > MAX_HISTORY) {
      masteryState[eqId].attempts.shift();
    }
    masteryState[eqId].lastTick = currentTick;
  });
  saveMastery();
}

export function reinforceAncestors(ancestorEqIds = [], topicId = null) {
  ancestorEqIds.forEach(eqId => {
    const isCommon = isCommonEq({ id: eqId });
    const scopeKey = isCommon ? "common" : (topicId || "common");
    const currentTick = getTopicTick(scopeKey);

    if (masteryState[eqId]) {
      masteryState[eqId].lastTick = currentTick;
    }
  });
  saveMastery();
}
