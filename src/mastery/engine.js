/**
 * src/mastery/engine.js
 * Mastery Engine: Decay curves, attempt history, and graph ancestry propagation.
 * isCommonEq is the single source of the eq_base_* prefix convention.
 */

import { tokenizeExpr } from "../cas/ast.js";
import { phi, fib, snapToFibonacci, MAX_HISTORY, PHI_INV, PHI_INV2, PHI_INV3 } from "./constants.js";
import {
  getTopicTick,
  readMasteryStore,
  writeMasteryStore,
  serializeMasteryPayload,
  parseMasteryPayload
} from "./storage.js";
import { getRelationTaxonomy } from "./taxonomy.js";

let masteryState = {};

/** Single source of the shared-material prefix convention. */
export function isCommonEq(eq) {
  return !!eq && typeof eq.id === "string" && eq.id.startsWith("eq_base_");
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

  const commonRels = topic.relations.filter(isCommonEq);
  const uniqueRels = topic.relations.filter(r => !isCommonEq(r));

  const tokensCommon = commonRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);
  const tokensUnique = uniqueRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);

  const halfLife = (tokensUnique / Math.E) + (tokensCommon / (Math.E * phi(1)));
  const safeHalfLife = Math.max(fib(8), halfLife);

  return Math.LN2 / safeHalfLife;
}

/**
 * Evaluates the decayed mastery score for a single key record.
 */
function evaluateKeyScore(key, baseFormula = "", topic = null, isCommon = false) {
  if (!key) return { score: 0, hasAttempts: false };
  const h = masteryState[key];
  const history = h && Array.isArray(h.attempts) ? h.attempts : [];
  if (history.length === 0) {
    return { score: 0, hasAttempts: false };
  }

  const tokens = tokenizeExpr(baseFormula || "").length;
  const windowSize = snapToFibonacci(Math.max(1, tokens / Math.E));

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

  const scopeKey = isCommon ? "common" : (topic?.id || "common");
  const currentTick = getTopicTick(scopeKey);
  const lastTick = h && typeof h.lastTick === "number" ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);

  const lambdaTopic = topic ? calculateTopicLambda(topic) : phi(-7);
  const decayMultiplier = Math.exp(-lambdaTopic * deltaTicks);

  return { score: baseMastery * decayMultiplier, hasAttempts: true };
}

/**
 * Hierarchical Decayed Mastery lookup.
 * Blends Instance, Application, and Principle evidence so transferable understanding
 * gives learners prior readiness on new instances while maintaining local confirmation.
 */
export function getDecayedMastery(eq, topic = null, options = {}) {
  const key = typeof eq === "string" ? eq : (eq?.masteryId || eq?.id);
  if (!key) return 0;

  const isConstant = key.startsWith("const_");
  const isCommon = isCommonEq(typeof eq === "object" ? eq : { id: key });
  const instEval = evaluateKeyScore(key, eq?.baseFormula || "", topic, isCommon);

  if (options.rawOnly || isConstant || !eq || typeof eq !== "object") {
    return instEval.score;
  }

  const tax = getRelationTaxonomy(eq, topic);
  if (!tax) return instEval.score;

  const appEval = evaluateKeyScore(tax.applicationId, "", topic, true);
  const princEval = evaluateKeyScore(tax.principleId, "", topic, true);

  if (instEval.hasAttempts) {
    // Instance has direct practice: blend with Application & Principle context
    const wInst = 1.0;
    const wApp = appEval.hasAttempts ? PHI_INV : 0;
    const wPrinc = princEval.hasAttempts ? PHI_INV2 : 0;
    const totalW = wInst + wApp + wPrinc;
    return (wInst * instEval.score + wApp * appEval.score + wPrinc * princEval.score) / totalW;
  }

  // Instance has zero direct attempts: inherits prior from Application and Principle
  if (appEval.hasAttempts || princEval.hasAttempts) {
    const wApp = appEval.hasAttempts ? 1.0 : 0;
    const wPrinc = princEval.hasAttempts ? PHI_INV : 0;
    const totalW = wApp + wPrinc;
    if (totalW > 0) {
      const familyPrior = (wApp * appEval.score + wPrinc * princEval.score) / totalW;
      // Scale by PHI_INV (~0.618) to provide strong prior readiness without prematurely triggering fading
      return familyPrior * PHI_INV;
    }
  }

  return 0;
}

function recordSingleKey(key, success, scopeKey) {
  const currentTick = getTopicTick(scopeKey);
  if (!masteryState[key]) {
    masteryState[key] = { attempts: [], lastTick: currentTick };
  }
  masteryState[key].attempts.push(!!success);
  if (masteryState[key].attempts.length > MAX_HISTORY) {
    masteryState[key].attempts.shift();
  }
  masteryState[key].lastTick = currentTick;
}

/**
 * Records an attempt and propagates evidence up the 3-tier hierarchy:
 *   Instance -> Application -> Principle.
 */
export function recordAttempt(target, success, topicId = null) {
  const key = typeof target === "string" ? target : (target?.masteryId || target?.eqId || target?.id);
  if (!key) return;

  const isCommon = isCommonEq({ id: key });
  const scopeKey = isCommon ? "common" : (topicId || "common");
  recordSingleKey(key, success, scopeKey);

  // Propagate evidence upward to Application and Principle
  const tax = getRelationTaxonomy(typeof target === "object" ? target : { id: key }, topicId ? { id: topicId } : null);
  if (tax) {
    recordSingleKey(tax.applicationId, success, "common");
    recordSingleKey(tax.principleId, success, "common");
  }

  saveMastery();
}

export function penalizeAncestors(ancestorEqIds = [], topicId = null) {
  const topicObj = typeof topicId === "string" ? { id: topicId } : topicId;
  ancestorEqIds.forEach(eqId => {
    const isCommon = isCommonEq({ id: eqId });
    const scopeKey = isCommon ? "common" : (topicObj?.id || "common");
    const currentTick = getTopicTick(scopeKey);

    if (!masteryState[eqId]) {
      masteryState[eqId] = { attempts: [], lastTick: currentTick };
    }

    // Dampened ancestral penalty: failure on child DAG node reduces confidence
    masteryState[eqId].attempts.push(false);
    if (masteryState[eqId].attempts.length > MAX_HISTORY) {
      masteryState[eqId].attempts.shift();
    }
    masteryState[eqId].lastTick = currentTick;

    // Upward dampened penalty
    const tax = getRelationTaxonomy({ id: eqId }, topicObj);
    if (tax) {
      recordSingleKey(tax.applicationId, false, "common");
    }
  });
  saveMastery();
}

export function reinforceAncestors(ancestorEqIds = [], topicId = null) {
  const topicObj = typeof topicId === "string" ? { id: topicId } : topicId;
  ancestorEqIds.forEach(eqId => {
    const isCommon = isCommonEq({ id: eqId });
    const scopeKey = isCommon ? "common" : (topicObj?.id || "common");
    const currentTick = getTopicTick(scopeKey);

    if (masteryState[eqId]) {
      masteryState[eqId].lastTick = currentTick;
      // Successful synthesis through a child node reinforces prerequisite retention
      masteryState[eqId].attempts.push(true);
      if (masteryState[eqId].attempts.length > MAX_HISTORY) {
        masteryState[eqId].attempts.shift();
      }
    }
  });
  saveMastery();
}
