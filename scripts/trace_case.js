/**
 * scripts/trace_case.js
 * Re-runs one derivation-matrix case through solveUnitAlgebra with push/fill hooks
 * and prints every non-canonical scalar with the stack frames that created it.
 * Usage: node scripts/trace_case.js 'topic[US] eq_id -> var {tok:unit, ...} [seed=N]'
 */

import { loadAllTopics } from "../src/topics/index.js";
import { solveUnitAlgebra, isCanonicalScaleFactor } from "../src/cas/units/index.js";
import { SEEDS, withSeededRandom, restate, collectSteps } from "../test/matrix_helpers.js";
import { parseCase } from "./lib/trace_parse.js";
import { recordNumericPushes } from "./lib/trace_hooks.js";

/**
 * Scalars visible in rendered conversion TeX: strips unit names and unit powers, removes
 * thousands separators, and expands (x)^p into p copies, so the result is comparable with
 * the planned conversionScalars list.
 */
function texScalars(tex) {
  const cleaned = String(tex)
    .replaceAll("{,}", "")
    .replace(/\\text\s*\{[^{}]*\}/g, " ")
    .replace(/\^\s*\{[^{}]*\}/g, " ");
  const out = [];
  const flat = cleaned.replace(/\((\d+(?:\.\d+)?)\)\^(\d+)/g, (_m, num, pow) => {
    for (let i = 0; i < Number(pow); i++) out.push(Number(num));
    return " ";
  });
  for (const m of flat.matchAll(/\d+(?:\.\d+)?/g)) out.push(Number(m[0]));
  return out;
}

/**
 * Planned scalars with no counterpart in the rendered conversions. A non-empty list means a
 * conversion was computed and then discarded (clobbered train, dropped sibling merge), which
 * leaves additive terms in different frames even when every scalar is canonical.
 */
function orphanScalars(planned, rendered) {
  const pool = [...rendered];
  const orphans = [];
  for (const s of planned) {
    const i = pool.findIndex((r) => Math.abs(r - s) <= 1e-6 * Math.max(1, Math.abs(s)));
    if (i >= 0) pool.splice(i, 1);
    else orphans.push(s);
  }
  return orphans;
}

const isAlien = (v) => v > 0 && !(Number.isInteger(v) && v < 1000) && !isCanonicalScaleFactor(v);
const shortFrame = (l) => l.replace(/\(?file:\/\/.*?\/((?:src|test)\/[^)]*)\)?/, "$1");

const c = parseCase(process.argv.slice(2).join(" "));
if (!c) {
  console.log("[TRACE ERROR: expected 'topic[SI|US] relation -> target {tok:unit, ...} [seed=N]']");
  process.exit(0);
}

const loaded = await loadAllTopics();
const topics = Array.isArray(loaded) ? loaded : Object.values(loaded);
const topic = topics.find((t) => t.id === c.topicId);
if (!topic) {
  console.log(`[TRACE ERROR: unknown topic ${c.topicId}. Known: ${topics.map((t) => t.id).join(", ")}]`);
  process.exit(0);
}

for (const seed of c.seed === null ? SEEDS : [c.seed]) {
  const S = withSeededRandom(seed, () => topic.createSystem({ sys: c.sys }));
  const step = collectSteps(topic, c.sys, S).find((s) => s.id === c.relId && s.targetVar === c.target);
  if (!step) { console.log(`seed=${seed}: no step ${c.relId} -> ${c.target}`); continue; }

  const S2 = restate(S, Object.keys(c.units), c.units, topic.varsDb, c.sys);
  const tUnit = S2._u?.[c.target] || topic.varsDb[c.target].unit;
  console.log(`seed=${seed} rhs: ${step.rhsExpr} | target unit: ${tUnit}`);
  try {
    const { result: ua, hits } = recordNumericPushes(isAlien, () =>
      solveUnitAlgebra(step.rhsExpr, S2, c.target, tUnit, topic.varsDb, step.requiredUnits));
    const scalars = ua.conversionScalars || [];
    console.log(`conversionScalars: ${scalars.map((s) => `${s}${isCanonicalScaleFactor(s) ? "" : " (ALIEN)"}`).join(", ") || "(none)"}`);
    console.log(`globalConversionTex: ${ua.globalConversionTex || "(empty)"}`);
    for (const [tok, list] of Object.entries(ua.tokenConversions || {})) {
      (list || []).forEach((item, i) => {
        const text = String(item).replace(/\s+/g, " ").trim();
        for (let p = 0; p < text.length; p += 150) {
          console.log(`conv ${tok}[${i}]${p ? "+" : ":"} ${text.slice(p, p + 150)}`);
        }
      });
    }
    const renderedTex = [
      ua.globalConversionTex || "",
      ...Object.values(ua.tokenConversions || {}).flatMap((list) => list || [])
    ].join(" ");
    const orphans = orphanScalars(scalars, texScalars(renderedTex));
    const resolved = Object.entries(ua.resolvedUnitByTok || {}).map(([k, u]) => `${k}:${u}`).join(", ");
    console.log(`resolvedUnitByTok: ${resolved || "(none)"}`);
    console.log(orphans.length
      ? `ORPHAN SCALARS planned but absent from rendered conversions: ${orphans.join(", ")}`
      : "orphan scalars: (none)");

    const seen = new Set();
    for (const h of hits) {
      const k = `${h.kind}|${h.value}|${h.frames[0]}`;
      if (seen.has(k)) continue;
      seen.add(k);
      console.log(`ALIEN ${h.kind} ${h.value}`);
      for (const f of h.frames) console.log(`    ${shortFrame(f)}`);
    }
    if (!hits.length) console.log("(no non-canonical push/fill seen inside src/)");
  } catch (e) {
    console.log(`solveUnitAlgebra threw: ${e.message}`);
  }
}
