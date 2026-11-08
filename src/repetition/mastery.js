/**
 * src/repetition/mastery.js
 * ============================================================================
 * ARCHITECTURAL PILLAR IV: Local Topic Ticking & Option D Token Decay
 * ============================================================================
 * 1. Local Scoped Ticks: Each topic advances its own ticks. Practicing Helical
 *    does NOT decay Spur or Diesel. Shared base relations advance on a common tick.
 * 2. Option D Cognitive Decay Anchor:
 *    T_1/2 = (Tokens_unique / e) + (Tokens_common / (e * Phi))
 *    lambda = ln(2) / T_1/2
 *    Ensures realistic study runways where mastery stays high across study loops.
 * ============================================================================
 */

import { tokenizeExpr } from "../cas/ast.js";

export const PHI = (1 + Math.sqrt(5)) / 2;              // 1.6180339887...
export const PHI_INV = 1 / PHI;                         // 0.6180339887...
export const PHI_INV2 = PHI_INV * PHI_INV;              // 0.3819660113...
export const PHI_INV3 = PHI_INV2 * PHI_INV;             // 0.2360679775...
export const PHI_INV6 = Math.pow(PHI_INV, 6);           // 0.0557280900...
export const PHI_INV7 = Math.pow(PHI_INV, 7);           // 0.0344418537...
export const PHI_INV8 = Math.pow(PHI_INV, 8);           // 0.0212862363...

export const FADING_THRESHOLD = 1 - PHI_INV3;           // 0.7639320225...

export const FIB_2 = 2;
export const FIB_3 = 3;
export const FIB_5 = 5;
export const FIB_8 = 8;
export const FIB_13 = 13;
export const FIB_21 = 21;

export const VALID_WINDOWS = [FIB_2, FIB_3, FIB_5, FIB_8, FIB_13, FIB_21];
export const MAX_HISTORY = FIB_21; 

const STORAGE_KEY_TOPIC_TICKS = "me_topic_ticks";
const STORAGE_KEY_MASTERY = "me_mastery_global";

let masteryState = {};

// ========================================================
// 1. LOCAL TOPIC TICKING ENGINE (NO CROSS-TOPIC ROT)
// ========================================================

function getTopicTicksMap() {
  const raw = localStorage.getItem(STORAGE_KEY_TOPIC_TICKS);
  if (raw) {
    try { return JSON.parse(raw) || {}; } catch { return {}; }
  }
  return {};
}

export function getTopicTick(scopeKey = "common") {
  const map = getTopicTicksMap();
  return map[scopeKey] || 0;
}

export function incrementTopicTick(scopeKey = "common") {
  const map = getTopicTicksMap();
  map[scopeKey] = (map[scopeKey] || 0) + 1;
  localStorage.setItem(STORAGE_KEY_TOPIC_TICKS, JSON.stringify(map));
  return map[scopeKey];
}

// Backward-compatibility aliases
export function getGlobalTick() {
  return getTopicTick("common");
}

export function incrementGlobalTick() {
  return incrementTopicTick("common");
}

function snapToFibonacci(val) {
  return VALID_WINDOWS.reduce((prev, curr) => 
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  );
}

// ========================================================
// 2. OPTION D DYNAMIC COGNITIVE DECAY EVALUATOR
// ========================================================

export function calculateTopicLambda(topic) {
  if (!topic || !Array.isArray(topic.relations) || topic.relations.length === 0) {
    return PHI_INV7;
  }

  const commonRels = topic.relations.filter(r => r.id.startsWith("eq_base_"));
  const uniqueRels = topic.relations.filter(r => !r.id.startsWith("eq_base_"));

  const tokensCommon = commonRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);
  const tokensUnique = uniqueRels.reduce((acc, r) => acc + tokenizeExpr(r.baseFormula || "").length, 0);

  const halfLife = (tokensUnique / Math.E) + (tokensCommon / (Math.E * PHI));
  const safeHalfLife = Math.max(FIB_21, halfLife);

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
    const w = Math.pow(PHI_INV, windowSize - 1 - i);
    weightSum += w;
    scoreSum += (padded[i] ? 1 : 0) * w;
  }
  const baseMastery = weightSum > 0 ? scoreSum / weightSum : 0;

  const isCommon = eq.id.startsWith("eq_base_");
  const scopeKey = isCommon ? "common" : (topic?.id || "common");
  const currentTick = getTopicTick(scopeKey);
  const lastTick = h && typeof h.lastTick === "number" ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);

  const lambdaTopic = topic ? calculateTopicLambda(topic) : PHI_INV7;
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

export function loadMastery() {
  const raw = localStorage.getItem(STORAGE_KEY_MASTERY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      masteryState = (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
    } catch {
      masteryState = {};
    }
  } else {
    masteryState = {};
  }
  return masteryState;
}

export function saveMastery() {
  localStorage.setItem(STORAGE_KEY_MASTERY, JSON.stringify(masteryState));
}

export function exportMasteryJSON() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    topicTicks: getTopicTicksMap(),
    masteryState
  };
  return JSON.stringify(payload, null, 2);
}

export function importMasteryJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== "object") return { success: false, reason: "Malformed JSON" };

    const state = (data.masteryState && typeof data.masteryState === "object") ? data.masteryState : data;
    let validRecords = 0;

    for (const [k, v] of Object.entries(state)) {
      if (v && Array.isArray(v.attempts)) {
        masteryState[k] = {
          attempts: v.attempts.map(Boolean),
          lastTick: typeof v.lastTick === "number" ? v.lastTick : 0
        };
        validRecords++;
      }
    }

    if (validRecords === 0) {
      return { success: false, reason: "No valid mastery records found in file" };
    }

    if (data.topicTicks && typeof data.topicTicks === "object") {
      localStorage.setItem(STORAGE_KEY_TOPIC_TICKS, JSON.stringify(data.topicTicks));
    }

    saveMastery();
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
