/**
 * src/repetition/mastery.js
 * Mastery Engine Orchestrator linking Cognitive Constants and Storage.
 */

import { tokenizeExpr } from "../cas/ast.js";
import {
  phi, fib, PHI, PHI_INV, PHI_INV2, PHI_INV3, PHI_INV6, PHI_INV7, PHI_INV8,
  FADING_THRESHOLD, FIB_2, FIB_3, FIB_5, FIB_8, FIB_13, FIB_21,
  VALID_WINDOWS, MAX_HISTORY, snapToFibonacci
} from "./constants.js";
import {
  getTopicTick, incrementTopicTick, getGlobalTick, incrementGlobalTick,
  loadMastery as storageLoadMastery, saveMastery as storageSaveMastery,
  exportMasteryJSON as storageExportMasteryJSON, importMasteryJSON as storageImportMasteryJSON
} from "./storage.js";

// Re-export all constants and functions so existing consumers never break
export {
  phi, fib, PHI, PHI_INV, PHI_INV2, PHI_INV3, PHI_INV6, PHI_INV7, PHI_INV8,
  FADING_THRESHOLD, FIB_2, FIB_3, FIB_5, FIB_8, FIB_13, FIB_21,
  VALID_WINDOWS, MAX_HISTORY, snapToFibonacci,
  getTopicTick, incrementTopicTick, getGlobalTick, incrementGlobalTick
};

let masteryState = {};

export function loadMastery() {
  masteryState = storageLoadMastery();
  return masteryState;
}

export function saveMastery() {
  storageSaveMastery(masteryState);
}

export function exportMasteryJSON() {
  return storageExportMasteryJSON(masteryState);
}

export function importMasteryJSON(jsonStr) {
  return storageImportMasteryJSON(jsonStr, newState => {
    masteryState = newState;
  });
}

export function calculateTopicLambda(topic) {
  if (!topic || !Array.isArray(topic.relations) || topic.relations.length === 0) {
    return phi(-7);
  }

  const commonRels = topic.relations.filter(r => r.id.startsWith("eq_base_"));
  const uniqueRels = topic.relations.filter(r => !r.id.startsWith("eq_base_"));

  const tokensCommon = commonRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);
  const tokensUnique = uniqueRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);

  const halfLife = (tokensUnique / Math.E) + (tokensCommon / (Math.E * phi(1)));
  const safeHalfLife = Math.max(fib(8), halfLife);

  return Math.LN2 / safeHalfLife;
}

export function getDecayedMastery(eq, topic = null) {
  if (!eq || !eq.id) return 0;
  
  const h = masteryState[eq.id];
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

  const isCommon = eq.id.startsWith("eq_base_");
  const scopeKey = isCommon ? "common" : (topic?.id || "common");
  const currentTick = getTopicTick(scopeKey);
  const lastTick = h && typeof h.lastTick === "number" ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);

  const lambdaTopic = topic ? calculateTopicLambda(topic) : phi(-7);
  const decayMultiplier = Math.exp(-lambdaTopic * deltaTicks);

  return baseMastery * decayMultiplier;
}

export function recordAttempt(eqId, success, topicId = null) {
  const isCommon = eqId.startsWith("eq_base_");
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
    const isCommon = eqId.startsWith("eq_base_");
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
    const isCommon = eqId.startsWith("eq_base_");
    const scopeKey = isCommon ? "common" : (topicId || "common");
    const currentTick = getTopicTick(scopeKey);

    if (masteryState[eqId]) {
      masteryState[eqId].lastTick = currentTick;
    }
  });
  saveMastery();
}
