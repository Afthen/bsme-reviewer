/**
 * src/repetition/mastery.js
 * ============================================================================
 * ARCHITECTURAL PILLAR IV: Harmonic Decay & Complexity-Scaled Repetition
 * ============================================================================
 * 1. Global Unified Mastery: A single student profile across all subjects.
 * 2. AST Complexity Scaling: Tokenizing an equation determines its cognitive 
 *    complexity. The required history window is calculated purely via Euler's 
 *    number (tokens / e) and snapped to the nearest Fibonacci number.
 * 3. Harmonic Weights: Recent attempts weigh exponentially more via the Golden Ratio.
 * ============================================================================
 */

import { tokenizeExpr } from "../cas/ast.js";

// The Golden Ratio & Harmonic Discounts
export const PHI = (1 + Math.sqrt(5)) / 2;              // 1.6180339887...
export const PHI_INV = 1 / PHI;                         // 0.6180339887...
export const PHI_INV2 = PHI_INV * PHI_INV;              // 0.3819660113...
export const PHI_INV3 = PHI_INV2 * PHI_INV;             // 0.2360679775...
export const PHI_INV6 = Math.pow(PHI_INV, 6);           // 0.0557280900...
export const PHI_INV7 = Math.pow(PHI_INV, 7);           // 0.0344418537... (Decay λ)
export const PHI_INV8 = Math.pow(PHI_INV, 8);           // 0.0212862363...

export const FADING_THRESHOLD = 1 - PHI_INV3;           // 0.7639320225...

// Fibonacci Sequence Constants
export const FIB_2 = 2;
export const FIB_3 = 3;
export const FIB_5 = 5;
export const FIB_8 = 8;
export const FIB_13 = 13;
export const FIB_21 = 21;

export const VALID_WINDOWS = [FIB_2, FIB_3, FIB_5, FIB_8, FIB_13, FIB_21];

export const TICK_DECAY_LAMBDA = PHI_INV7;
export const MAX_HISTORY = FIB_21; 

const STORAGE_KEY_TICK = "me_global_tick";
const STORAGE_KEY_MASTERY = "me_mastery_global";

let masteryState = {};

export function getGlobalTick() {
  return parseInt(localStorage.getItem(STORAGE_KEY_TICK) || "0", 10);
}

export function incrementGlobalTick() {
  const next = getGlobalTick() + 1;
  localStorage.setItem(STORAGE_KEY_TICK, next.toString());
  return next;
}

/**
 * Snaps a target float value to the nearest mathematically valid Fibonacci window size.
 */
function snapToFibonacci(val) {
  return VALID_WINDOWS.reduce((prev, curr) => 
    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
  );
}

/**
 * Calculates decayed mastery [0, 1] using AST Token Complexity via Euler's number
 * snapped to the Fibonacci sequence.
 */
export function getDecayedMastery(eq) {
  if (!eq || !eq.id) return 0;
  
  const h = masteryState[eq.id];
  const history = h && Array.isArray(h.attempts) ? h.attempts : [];
  
  // 1. Pure Mathematical Scaling: tokens / e, snapped to nearest Fibonacci
  const tokens = tokenizeExpr(eq.baseFormula || "").length;
  const targetSize = tokens / Math.E;
  const windowSize = snapToFibonacci(targetSize);
  
  // 2. Pad history with false if the student hasn't met the window requirement
  const recent = history.slice(-windowSize);
  const padded = [...Array(Math.max(0, windowSize - recent.length)).fill(false), ...recent];

  // 3. Harmonic attempt weighting via Golden Ratio
  let weightSum = 0;
  let scoreSum = 0;
  for (let i = 0; i < windowSize; i++) {
    const w = Math.pow(PHI_INV, windowSize - 1 - i);
    weightSum += w;
    scoreSum += (padded[i] ? 1 : 0) * w;
  }
  const baseMastery = weightSum > 0 ? scoreSum / weightSum : 0;

  // 4. Exponential interference decay across global problem ticks
  const currentTick = getGlobalTick();
  const lastTick = h && typeof h.lastTick === "number" ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);
  const decayMultiplier = Math.exp(-TICK_DECAY_LAMBDA * deltaTicks);

  return baseMastery * decayMultiplier;
}

export function recordAttempt(eqId, success) {
  const currentTick = getGlobalTick();
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

export function penalizeAncestors(ancestorEqIds = []) {
  const currentTick = getGlobalTick();
  ancestorEqIds.forEach(eqId => {
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

export function reinforceAncestors(ancestorEqIds = []) {
  const currentTick = getGlobalTick();
  ancestorEqIds.forEach(eqId => {
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
    globalTick: getGlobalTick(),
    masteryState
  };
  return JSON.stringify(payload, null, 2);
}

export function importMasteryJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== "object") return { success: false, reason: "Malformed JSON" };

    const state = (data.masteryState && typeof data.masteryState === "object") ? data.masteryState : data;
    
    const cleanState = {};
    let validRecords = 0;
    for (const [k, v] of Object.entries(state)) {
      if (v && Array.isArray(v.attempts)) {
        cleanState[k] = {
          attempts: v.attempts.map(Boolean),
          lastTick: typeof v.lastTick === "number" ? v.lastTick : 0
        };
        validRecords++;
      }
    }

    if (validRecords === 0 && Object.keys(state).length > 0) {
      return { success: false, reason: "No valid mastery records found in file" };
    }

    masteryState = cleanState;
    if (data.globalTick !== undefined) {
      localStorage.setItem(STORAGE_KEY_TICK, data.globalTick.toString());
    }
    saveMastery();
    return { success: true };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
