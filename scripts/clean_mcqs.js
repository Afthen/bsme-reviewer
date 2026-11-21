/**
 * scripts/clean_mcqs.js
 * In-place sanitizer for MCQ set.json files.
 * 1. Deduplicates questions based on (Question Text + Correct Answer Text).
 * 2. Merges options from duplicates into the original.
 * 3. Re-indexes question IDs to a strict 1..N sequence.
 */

import fs from "node:fs";
import path from "node:path";
import { normalizeText, getAnswerText } from "../src/mcq/engine.js";

const MCQ_ROOT = "src/mcq";

function findSetFiles(dir, acc = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      findSetFiles(res, acc);
    } else if (file.name === "set.json") {
      acc.push(res);
    }
  }
  return acc;
}

function cleanSet(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!content.questions || !Array.isArray(content.questions)) return;

  const originalCount = content.questions.length;
  const uniqueQuestions = [];
  const seenMap = new Map(); // key: normQ + normAns -> index in uniqueQuestions

  for (const q of content.questions) {
    const normQ = normalizeText(q.q);
    const ansText = getAnswerText(q);
    const normAns = normalizeText(ansText);
    const key = `${normQ}|${normAns}`;

    if (seenMap.has(key)) {
      const existingIdx = seenMap.get(key);
      const existing = uniqueQuestions[existingIdx];

      // Merge options: keep all unique option strings
      const mergedOptions = new Set([...(existing.options || []), ...(q.options || [])]);
      existing.options = Array.from(mergedOptions).map(o => String(o).trim());
      
      // Note: we keep the original's shuffle/id/etc.
    } else {
      // Clone to avoid mutating original array during iteration
      uniqueQuestions.push({ ...q });
      seenMap.set(key, uniqueQuestions.length - 1);
    }
  }

  // Re-index IDs to 1..N
  const finalizedQuestions = uniqueQuestions.map((q, idx) => ({
    ...q,
    id: idx + 1
  }));

  if (finalizedQuestions.length !== originalCount) {
    console.log(`[Clean] ${path.relative(process.cwd(), filePath)}: ${originalCount} -> ${finalizedQuestions.length} (merged duplicates)`);
  }

  content.questions = finalizedQuestions;
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
}

async function main() {
  console.log("🧹 Cleaning MCQ sets...");
  const setFiles = findSetFiles(path.resolve(MCQ_ROOT));
  setFiles.forEach(cleanSet);
  console.log(`✅ Processed ${setFiles.length} sets.`);
}

main().catch(console.error);
