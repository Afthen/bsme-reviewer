/**
 * src/repetition/mastery.js
 * Golden Ratio (Φ) harmonic decay spaced repetition engine and persistence layer.
 */

// ========================================================
// 1. GOLDEN RATIO CONSTANTS & PEDAGOGICAL PARAMETERS
// ========================================================
export const PHI = (1 + Math.sqrt(5)) / 2;             // 1.6180339887...
export const PHI_INV = 1 / PHI;                         // 0.6180339887... (Harmonic discount)
export const PHI_INV2 = PHI_INV * PHI_INV;              // 0.3819660113...
export const PHI_INV3 = PHI_INV2 * PHI_INV;             // 0.2360679775...
export const PHI_INV6 = Math.pow(PHI_INV, 6);           // 0.0557280900... (Min selection floor)
export const PHI_INV7 = Math.pow(PHI_INV, 7);           // 0.0344418537... (Decay constant λ)
export const PHI_INV8 = Math.pow(PHI_INV, 8);           // 0.0212862363... (Relative error tolerance)

export const FADING_THRESHOLD = 1 - PHI_INV3;           // 1 - φ⁻³ ≈ 0.7639 (Golden Fading Threshold)
export const HISTORY_WINDOW_SIZE = 8;                   // F_6 = 8 (Fibonacci attempt buffer)
export const TICK_DECAY_LAMBDA = PHI_INV7;              // Half-life ≈ 20.13 ticks

const STORAGE_KEY_TICK = "me_global_problem_tick";
const STORAGE_KEY_PREFIX = "me_mastery_";

let masteryState = {};

// ========================================================
// 2. TICK MANAGEMENT & DECAY CALCULATIONS
// ========================================================

export function getGlobalTick() {
  return parseInt(localStorage.getItem(STORAGE_KEY_TICK) || "0", 10);
}

export function incrementGlobalTick() {
  const next = getGlobalTick() + 1;
  localStorage.setItem(STORAGE_KEY_TICK, next.toString());
  return next;
}

/**
 * Calculates current decayed mastery in [0, 1] using harmonic weights and tick decay.
 */
export function getDecayedMastery(eqId) {
  const h = masteryState[eqId];
  if (!h || !h.attempts || h.attempts.length === 0) return 0;

  // 1. Harmonic attempt weighting using powers of PHI_INV
  let weightSum = 0;
  let scoreSum = 0;
  const len = h.attempts.length;
  for (let i = 0; i < len; i++) {
    const w = Math.pow(PHI_INV, len - 1 - i);
    weightSum += w;
    scoreSum += (h.attempts[i] ? 1 : 0) * w;
  }
  const baseMastery = weightSum > 0 ? scoreSum / weightSum : 0;

  // 2. Exponential interference decay across problem ticks
  const currentTick = getGlobalTick();
  const lastTick = h.lastTick !== undefined ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);
  const decayMultiplier = Math.exp(-TICK_DECAY_LAMBDA * deltaTicks);

  return baseMastery * decayMultiplier;
}

// ========================================================
// 3. ATTEMPT RECORDING & ANCESTOR BLAME
// ========================================================

export function recordAttempt(eqId, success, topicId = "spur_gears") {
  const currentTick = getGlobalTick();
  if (!masteryState[eqId]) {
    masteryState[eqId] = { attempts: [], lastTick: currentTick };
  }
  masteryState[eqId].attempts.push(success);
  if (masteryState[eqId].attempts.length > HISTORY_WINDOW_SIZE) {
    masteryState[eqId].attempts.shift();
  }
  masteryState[eqId].lastTick = currentTick;
  saveMastery(topicId);
}

export function penalizeAncestors(ancestorEqIds = [], topicId = "spur_gears") {
  const currentTick = getGlobalTick();
  ancestorEqIds.forEach(eqId => {
    if (!masteryState[eqId]) {
      masteryState[eqId] = { attempts: [], lastTick: currentTick };
    }
    masteryState[eqId].attempts.push(false);
    if (masteryState[eqId].attempts.length > HISTORY_WINDOW_SIZE) {
      masteryState[eqId].attempts.shift();
    }
    masteryState[eqId].lastTick = currentTick;
  });
  saveMastery(topicId);
}

export function reinforceAncestors(ancestorEqIds = [], topicId = "spur_gears") {
  const currentTick = getGlobalTick();
  ancestorEqIds.forEach(eqId => {
    if (masteryState[eqId]) {
      masteryState[eqId].lastTick = currentTick;
    }
  });
  saveMastery(topicId);
}

// ========================================================
// 4. STORAGE & BACKUP
// ========================================================

export function loadMastery(topicId = "spur_gears") {
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${topicId}`);
  if (raw) {
    try {
      masteryState = JSON.parse(raw);
    } catch {
      masteryState = {};
    }
  } else {
    masteryState = {};
  }
  return masteryState;
}

export function saveMastery(topicId = "spur_gears") {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${topicId}`, JSON.stringify(masteryState));
}

export function exportMasteryJSON() {
  return JSON.stringify(masteryState, null, 2);
}

export function importMasteryJSON(jsonStr, topicId = "spur_gears") {
  try {
    const data = JSON.parse(jsonStr);
    masteryState = data;
    saveMastery(topicId);
    return true;
  } catch {
    return false;
  }
}
