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

export function isReferentialQuestion(item) {
  return Boolean(
    item &&
    (item.referential ||
      item.hasReferentialOptions ||
      item.noShuffle ||
      item.shuffle === false ||
      item.fixedOrder ||
      item.lockOptions)
  );
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

    if (isReferentialQuestion(item)) {
      const options = [...(item.options || [])];
      return {
        ...entry,
        q: item.q,
        imageSrc,
        imageAlt,
        options,
        answer: String(item.answer || "A").trim().toUpperCase(),
        gridClass: classifyOptionsGrid(options)
      };
    }

    const correctText = getAnswerText(item);
    const normCorrect = normalizeText(correctText);
    let correctChoice = null;
    const distractors = [];
    const seenDistractors = new Set();

    for (const opt of item.options || []) {
      const s = String(opt).trim();
      const norm = normalizeText(s);
      if (norm === normCorrect && correctChoice === null) {
        correctChoice = s;
      } else if (norm !== normCorrect && !seenDistractors.has(norm)) {
        seenDistractors.add(norm);
        distractors.push(s);
      }
    }

    if (!correctChoice) {
      correctChoice = correctText || String(item.options?.[0] || "Answer");
    }

    const chosenDistractors = distractors.length > 3
      ? shuffleArray(distractors).slice(0, 3)
      : distractors;

    const shuffled = shuffleArray([
      { text: correctChoice, isCorrect: true },
      ...chosenDistractors.map(d => ({ text: d, isCorrect: false }))
    ]);

    const correctIdx = shuffled.findIndex(c => c.isCorrect);
    const options = shuffled.map(c => c.text);

    return {
      ...entry,
      q: item.q,
      imageSrc,
      imageAlt,
      options,
      answer: LETTERS[correctIdx] || "A",
      gridClass: classifyOptionsGrid(options)
    };
  });
}
