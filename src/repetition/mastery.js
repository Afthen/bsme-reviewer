/**
 * src/repetition/mastery.js
 * Golden Ratio (Φ) harmonic decay spaced repetition engine and persistence layer.
 * Scoped per topic to prevent cross-subject mastery degradation.
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
export const PHI_INV8 = Math.pow(PHI_INV, 8);           // 0.0212862363... (Relative error tolerance ~2.13%)

export const FADING_THRESHOLD = 1 - PHI_INV3;           // 1 - φ⁻³ ≈ 0.7639 (Golden Fading Threshold)
export const HISTORY_WINDOW_SIZE = 8;                   // F_6 = 8 (Fibonacci attempt buffer)
export const TICK_DECAY_LAMBDA = PHI_INV7;              // Half-life ≈ 20.13 ticks

const STORAGE_KEY_TICK_PREFIX = "me_topic_tick_";
const STORAGE_KEY_PREFIX = "me_mastery_";

let currentActiveTopicId = "spur_gears";
let masteryState = {};

// ========================================================
// 2. TOPIC-SCOPED TICK MANAGEMENT & DECAY CALCULATIONS
// ========================================================

export function getTopicTick(topicId = currentActiveTopicId) {
  return parseInt(localStorage.getItem(`${STORAGE_KEY_TICK_PREFIX}${topicId}`) || "0", 10);
}

export function incrementTopicTick(topicId = currentActiveTopicId) {
  const next = getTopicTick(topicId) + 1;
  localStorage.setItem(`${STORAGE_KEY_TICK_PREFIX}${topicId}`, next.toString());
  return next;
}

/**
 * Calculates decayed mastery in [0, 1] using harmonic weights and topic-scoped tick decay.
 */
export function getDecayedMastery(eqId, topicId = currentActiveTopicId) {
  const h = masteryState[eqId];
  if (!h || !Array.isArray(h.attempts) || h.attempts.length === 0) return 0;

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

  // 2. Exponential interference decay across problem ticks for this topic
  const currentTick = getTopicTick(topicId);
  const lastTick = typeof h.lastTick === "number" ? h.lastTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);
  const decayMultiplier = Math.exp(-TICK_DECAY_LAMBDA * deltaTicks);

  return baseMastery * decayMultiplier;
}

// ========================================================
// 3. ATTEMPT RECORDING & ANCESTOR BLAME
// ========================================================

export function recordAttempt(eqId, success, topicId = currentActiveTopicId) {
  const currentTick = getTopicTick(topicId);
  if (!masteryState[eqId]) {
    masteryState[eqId] = { attempts: [], lastTick: currentTick };
  }
  masteryState[eqId].attempts.push(!!success);
  if (masteryState[eqId].attempts.length > HISTORY_WINDOW_SIZE) {
    masteryState[eqId].attempts.shift();
  }
  masteryState[eqId].lastTick = currentTick;
  saveMastery(topicId);
}

export function penalizeAncestors(ancestorEqIds = [], topicId = currentActiveTopicId) {
  const currentTick = getTopicTick(topicId);
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

export function reinforceAncestors(ancestorEqIds = [], topicId = currentActiveTopicId) {
  const currentTick = getTopicTick(topicId);
  ancestorEqIds.forEach(eqId => {
    if (masteryState[eqId]) {
      masteryState[eqId].lastTick = currentTick;
    }
  });
  saveMastery(topicId);
}

// ========================================================
// 4. STORAGE & BACKUP (WITH STRICT VALIDATION)
// ========================================================

export function loadMastery(topicId = "spur_gears") {
  currentActiveTopicId = topicId;
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${topicId}`);
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

export function saveMastery(topicId = currentActiveTopicId) {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${topicId}`, JSON.stringify(masteryState));
}

export function exportMasteryJSON(topicId = currentActiveTopicId) {
  const payload = {
    version: 1,
    topicId,
    exportedAt: new Date().toISOString(),
    masteryState
  };
  return JSON.stringify(payload, null, 2);
}

export function importMasteryJSON(jsonStr, targetTopicId = currentActiveTopicId) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== "object") return false;

    // Support both wrapped export payload and legacy raw JSON
    const state = data.masteryState && typeof data.masteryState === "object" ? data.masteryState : data;
    
    // Ensure every record has an attempts array
    const cleanState = {};
    for (const [k, v] of Object.entries(state)) {
      if (v && Array.isArray(v.attempts)) {
        cleanState[k] = {
          attempts: v.attempts.map(Boolean),
          lastTick: typeof v.lastTick === "number" ? v.lastTick : 0
        };
      }
    }

    masteryState = cleanState;
    saveMastery(targetTopicId);
    return true;
  } catch {
    return false;
  }
}