/**
 * src/mcq/engine.js
 * MCQ session builder, adaptive choice layout classifier, and phi-based mastery tracking.
 */

import { phi, fib } from "../mastery/constants.js";
import { readMcqMasteryStore, writeMcqMasteryStore } from "../mastery/storage.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const MCQ_WINDOW = fib(5); // 5-attempt window

export function normalizeText(str) {
  return String(str ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function getAnswerText(item) {
  if (!item) return "";
  const opts = item.options || [];
  const rawAns = String(item.answer || item.correctAnswer || "").trim();
  if (!rawAns) return opts[0] !== undefined ? String(opts[0]).trim() : "";

  const normAns = normalizeText(rawAns);
  for (const opt of opts) {
    if (normalizeText(opt) === normAns) return String(opt).trim();
  }

  const letterMatch = rawAns.match(/\b([A-Za-z])\b/);
  if (letterMatch) {
    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < opts.length) return String(opts[idx]).trim();
  }

  const numMatch = rawAns.match(/\b(\d+)\b/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 0 && n < opts.length) return String(opts[n]).trim();
    if (n >= 1 && n <= opts.length) return String(opts[n - 1]).trim();
  }

  return rawAns;
}

function resolveCorrectIndex(item, opts) {
  const rawAns = String(item?.answer || item?.correctAnswer || "").trim();
  if (!rawAns) return 0;

  const normAns = normalizeText(rawAns);
  const byText = opts.findIndex(o => normalizeText(o) === normAns);
  if (byText !== -1) return byText;

  const letterMatch = rawAns.match(/\b([A-Za-z])\b/);
  if (letterMatch) {
    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < opts.length) return idx;
  }

  const numMatch = rawAns.match(/\b(\d+)\b/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 0 && n < opts.length) return n;
    if (n >= 1 && n <= opts.length) return n - 1;
  }

  return 0;
}

function applyShufflePartition(entries, shuffleGroups) {
  const n = entries.length;
  const groups = Array.isArray(shuffleGroups)
    ? shuffleGroups.map(g => [...new Set(g)].filter(i => Number.isInteger(i) && i >= 0 && i < n))
    : [entries.map((_, i) => i)];

  const inAnyGroup = new Set();
  const groupOf = new Map();
  groups.forEach((g, gIdx) => {
    g.forEach(i => {
      if (!inAnyGroup.has(i)) {
        inAnyGroup.add(i);
        groupOf.set(i, gIdx);
      }
    });
  });

  if (n <= 4) {
    const result = [...entries];
    for (const g of groups) {
      if (g.length <= 1) continue;
      const shuffled = shuffleArray(g.map(i => entries[i]));
      g.forEach((slotIdx, k) => {
        result[slotIdx] = shuffled[k];
      });
    }
    return result;
  }

  // Pool > 4: keep pinned items in relative order, sample remaining slots from groups
  const targetLen = 4;
  const pinnedIndices = [];
  for (let i = 0; i < n; i++) {
    if (!inAnyGroup.has(i)) pinnedIndices.push(i);
  }

  const availableSlots = Math.max(0, targetLen - pinnedIndices.length);
  const groupSamples = groups.map(g => {
    const pool = g.map(i => entries[i]);
    const correctEntry = pool.find(e => e.isCorrect);
    const seen = new Set(correctEntry ? [normalizeText(correctEntry.text)] : []);
    const distractors = [];
    for (const e of pool) {
      const norm = normalizeText(e.text);
      if (!e.isCorrect && !seen.has(norm)) {
        seen.add(norm);
        distractors.push(e);
      }
    }
    return { correctEntry, distractors };
  });

  // Allocate slots across groups
  let remaining = availableSlots;
  const quotas = groups.map(() => 0);
  groups.forEach((g, idx) => {
    if (remaining <= 0) return;
    if (groupSamples[idx].correctEntry) {
      quotas[idx] = 1;
      remaining--;
    }
  });
  let gCursor = 0;
  let guard = 0;
  while (remaining > 0 && groups.length > 0 && guard < 100) {
    const idx = gCursor % groups.length;
    const cap = (groupSamples[idx].correctEntry ? 1 : 0) + groupSamples[idx].distractors.length;
    if (quotas[idx] < cap) {
      quotas[idx]++;
      remaining--;
    }
    gCursor++;
    guard++;
  }

  const sampledByGroup = groups.map((_, idx) => {
    const q = quotas[idx];
    const { correctEntry, distractors } = groupSamples[idx];
    const chosen = [];
    if (correctEntry && q > 0) chosen.push(correctEntry);
    const need = Math.max(0, q - chosen.length);
    chosen.push(...shuffleArray(distractors).slice(0, need));
    return shuffleArray(chosen);
  });

  const groupHeads = groups.map(() => 0);
  const finalEntries = [];
  for (let i = 0; i < n && finalEntries.length < targetLen; i++) {
    if (!inAnyGroup.has(i)) {
      finalEntries.push(entries[i]);
    } else {
      const gIdx = groupOf.get(i);
      const list = sampledByGroup[gIdx];
      if (groupHeads[gIdx] < list.length) {
        finalEntries.push(list[groupHeads[gIdx]++]);
      }
    }
  }
  return finalEntries;
}

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getMcqKey(setId, qId) {
  return `${setId}::${qId}`;
}

export function getQuestionRecord(setId, qId) {
  const store = readMcqMasteryStore();
  return store[getMcqKey(setId, qId)] || { attempts: [], seen: 0 };
}

export function getQuestionMastery(setId, qId) {
  const rec = getQuestionRecord(setId, qId);
  const attempts = Array.isArray(rec.attempts) ? rec.attempts.slice(-MCQ_WINDOW) : [];
  if (attempts.length === 0) return 0;

  const padded = [...Array(Math.max(0, MCQ_WINDOW - attempts.length)).fill(false), ...attempts];
  let wSum = 0;
  let sSum = 0;
  for (let i = 0; i < MCQ_WINDOW; i++) {
    const w = phi(-(MCQ_WINDOW - 1 - i));
    wSum += w;
    sSum += (padded[i] ? 1 : 0) * w;
  }
  return wSum > 0 ? sSum / wSum : 0;
}

export function recordQuestionAttempt(setId, qId, success) {
  const store = readMcqMasteryStore();
  const key = getMcqKey(setId, qId);
  const rec = store[key] || { attempts: [], seen: 0 };
  rec.attempts = [...(rec.attempts || []), !!success].slice(-MCQ_WINDOW * 2);
  rec.seen = (rec.seen || 0) + 1;
  store[key] = rec;
  writeMcqMasteryStore(store);
}

export function getSetMastery(setObj) {
  const qs = setObj?.questions || [];
  if (qs.length === 0) return 0;
  let sum = 0;
  for (const q of qs) {
    sum += getQuestionMastery(setObj.id, q.id);
  }
  return sum / qs.length;
}

export function getSetStats(setObj) {
  const store = readMcqMasteryStore();
  const qs = setObj?.questions || [];
  let seen = 0;
  let weak = 0;
  for (const q of qs) {
    const rec = store[getMcqKey(setObj.id, q.id)];
    if (rec && rec.seen > 0) {
      seen++;
      if (getQuestionMastery(setObj.id, q.id) < phi(-1)) weak++;
    }
  }
  return { total: qs.length, seen, weak };
}

export function resolveQuestionImage(item, setBaseUrl = null) {
  const raw = typeof item?.image === "string" ? item.image : item?.image?.src;
  if (!raw) return null;
  if (/^(https?:|data:image\/|blob:)/i.test(raw)) return raw;
  if (setBaseUrl) return new URL(raw.replace(/^\.\//, ""), setBaseUrl).href;
  return raw;
}

/**
 * Classifies option layout to minimize vertical height per item:
 *   "cols-4" (1x4) | "cols-2" (2x2) | "cols-1" (4x1)
 */
export function classifyOptionsGrid(options = []) {
  if (options.length !== 4) return "cols-1";
  const maxLen = Math.max(
    ...options.map(opt =>
      String(opt)
        .replace(/\$+/g, "")
        .replace(/\\text\{([^}]*)\}/g, "$1")
        .replace(/\\[a-zA-Z]+/g, "x")
        .trim().length
    )
  );
  if (maxLen <= 16) return "cols-4";
  if (maxLen <= 42) return "cols-2";
  return "cols-1";
}

export function selectBatch(sets = [], size = 25) {
  const pool = [];
  for (const setObj of sets) {
    for (const q of setObj.questions || []) {
      const rec = getQuestionRecord(setObj.id, q.id);
      const mastery = getQuestionMastery(setObj.id, q.id);
      pool.push({
        setId: setObj.id,
        setTitle: setObj.title,
        baseUrl: setObj.baseUrl || null,
        item: q,
        seen: rec.seen || 0,
        mastery
      });
    }
  }

  const fresh = shuffleArray(pool.filter(p => p.seen === 0));
  const seen = pool.filter(p => p.seen > 0);
  seen.sort((a, b) => (a.mastery - b.mastery) || (Math.random() - 0.5));

  const ordered = [...fresh, ...seen];
  const limit = size > 0 ? Math.min(size, ordered.length) : ordered.length;
  return ordered.slice(0, limit);
}

export function buildSessionItems(packedList = []) {
  return packedList.map(entry => {
    const item = entry.item;
    const imageSrc = resolveQuestionImage(item, entry.baseUrl);
    const imageAlt = typeof item.image === "object" ? (item.image?.alt || "") : (item.imageAlt || "");

    const rawOpts = (item.options || []).map(o => String(o).trim());
    const correctOrigIdx = resolveCorrectIndex(item, rawOpts);
    const entries = rawOpts.map((text, idx) => ({
      text,
      isCorrect: idx === correctOrigIdx
    }));

    const finalEntries = applyShufflePartition(entries, item.shuffle);
    const correctIdx = finalEntries.findIndex(c => c.isCorrect);
    const options = finalEntries.map(c => c.text);

    return {
      ...entry,
      q: item.q,
      imageSrc,
      imageAlt,
      options,
      answer: LETTERS[correctIdx >= 0 ? correctIdx : 0] || "A",
      gridClass: classifyOptionsGrid(options)
    };
  });
}
