/**
 * src/mastery/storage.js
 * Low-level persistence, topic-scoped ticks, and JSON payload serialization.
 */

export const STORAGE_KEY_TOPIC_TICKS = "me_topic_ticks";
export const STORAGE_KEY_MASTERY = "me_mastery_global";

export function getTopicTicksMap() {
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

export function getGlobalTick() {
  return getTopicTick("common");
}

export function incrementGlobalTick() {
  return incrementTopicTick("common");
}

export function readMasteryStore() {
  const raw = localStorage.getItem(STORAGE_KEY_MASTERY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function writeMasteryStore(masteryState) {
  localStorage.setItem(STORAGE_KEY_MASTERY, JSON.stringify(masteryState));
}

export function serializeMasteryPayload(masteryState) {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    topicTicks: getTopicTicksMap(),
    masteryState
  };
  return JSON.stringify(payload, null, 2);
}

export function parseMasteryPayload(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== "object") return { success: false, reason: "Malformed JSON" };

    const state = (data.masteryState && typeof data.masteryState === "object") ? data.masteryState : data;
    const newState = {};
    let validRecords = 0;

    for (const [k, v] of Object.entries(state)) {
      if (v && Array.isArray(v.attempts)) {
        newState[k] = {
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

    return { success: true, newState };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}
