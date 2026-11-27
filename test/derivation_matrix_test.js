/**
 * test/derivation_matrix_test.js
 * Deterministic derivation matrix across two layers (parallelized across CPU cores):
 * 1. Pairwise step matrix: every topic x system x relation x solvable target under
 *    2-wise unit coverage (deduplicating identical deterministic seed states).
 * 2. Seeded problem-generator matrix: every topic x mode (SI/US/MIXED) x seed x mastery.
 * All failures are collected and reported grouped by layer; nothing stops at the first one.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import { Worker } from "node:worker_threads";
import { TOPIC_MANIFEST } from "../src/topics/index.js";
import { runMatrixForTopicIds } from "./matrix_worker.js";

function runWorker(topicIds) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./matrix_worker.js", import.meta.url), {
      workerData: { topicIds }
    });
    w.once("message", resolve);
    w.once("error", reject);
    w.once("exit", code => {
      if (code !== 0) reject(new Error(`Matrix worker exited with code ${code}`));
    });
  });
}

test("Derivation matrix: pairwise step coverage and seeded problem-generator invariants", async () => {
  const filter = process.env.MATRIX_TOPIC?.trim();
  const topicIds = TOPIC_MANIFEST
    .map(m => m.id)
    .filter(id => !filter || id === filter);

  const workerCount = Math.min(topicIds.length, Math.max(1, os.availableParallelism?.() ?? os.cpus().length));
  let results;
  if (workerCount <= 1) {
    results = [await runMatrixForTopicIds(topicIds)];
  } else {
    const buckets = Array.from({ length: workerCount }, () => []);
    topicIds.forEach((id, idx) => buckets[idx % workerCount].push(id));
    results = await Promise.all(buckets.map(runWorker));
  }

  const failures = [];
  let cases = 0;
  let skipped = 0;
  for (const r of results) {
    failures.push(...r.failures);
    cases += r.cases;
    skipped += r.skipped;
  }

  if (skipped > 0) console.log(`[matrix] skipped ${skipped} unit levels below the display floor`);
  if (failures.length > 0) {
    const groups = new Map();
    for (const f of failures) {
      const k = `${f.layer} | ${f.where.split(" {")[0]}`;
      if (!groups.has(k)) groups.set(k, { n: 0, example: f });
      groups.get(k).n++;
    }
    const byLayer = {};
    for (const f of failures) byLayer[f.layer] = (byLayer[f.layer] || 0) + 1;
    console.log(`\n[matrix] ${cases} cases, ${failures.length} failures`);
    console.log("[matrix] failures by layer:", byLayer);
    const count = (keyFn) => {
      const m = new Map();
      for (const f of failures) for (const k of [].concat(keyFn(f) ?? [])) m.set(k, (m.get(k) || 0) + 1);
      return [...m].sort((a, b) => b[1] - a[1]);
    };
    console.log("[matrix] by topic:", count(f => f.topic));
    console.log("[matrix] by tag:", count(f => f.tags));

    console.log("[matrix] failures with all tokens in canonical units:", failures.filter(f => f.changed === 0).length);
    const minimal = new Map();
    for (const f of failures) {
      if (f.layer !== "derivation-numeric") continue;
      const k = f.where.split(" {")[0];
      if (!minimal.has(k) || f.changed < minimal.get(k).changed) minimal.set(k, f);
    }
    const mins = [...minimal.values()].sort((a, b) => a.changed - b.changed);
    console.log(`[matrix] distinct failing (relation,target): ${mins.length}`);
    for (const f of mins.slice(0, 10)) {
      console.log(`[matrix] MIN changed=${f.changed} ${f.where} | ROW: ${(f.row || "").slice(0, 160)}`);
    }
    for (const [k, g] of groups) {
      const ex = g.example.where;
      const brace = ex.indexOf(" {");
      console.log(`  ${k} x${g.n} | ${brace >= 0 ? ex.slice(brace + 1) : ""} | ${g.example.msg.split(" (")[0]}`);
    }
  }

  assert.equal(failures.length, 0, `${failures.length} matrix failures (see summary above)`);
});
