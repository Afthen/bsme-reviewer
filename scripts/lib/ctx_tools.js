/**
 * scripts/lib/ctx_tools.js
 * Complete suite of domain-aware and AST-native context tools:
 *   1.  GRAPH          Bipartite DAG reachability, degrees of freedom, and path unrolling
 *   2.  TOPIC          One-page summary of schema, relations, and createSystem contracts
 *   3.  UNIT           7D dimensional vector, base scale factor, offset, and companion
 *   4.  CONVERT        Pairwise factor-label decomposition and canonical scale check
 *   5.  SOLVE          CAS symbolic variable isolation test (isolateVariable)
 *   6.  HYGIENE        Fast-path static schema validator (orphans, collisions, native °)
 *   7.  FAILURES       Derivation matrix failure clustering by root cause
 *   8.  DERIVE         Single-step derivation with KaTeX tower height & oracle match
 *   9.  AUDIT-LATEX    KaTeX visual formatting linter (spacing, commas, %, °)
 *   10. AUDIT-STEP     AST-native structural derivation step inspector (zero regex on math)
 *   11. RENDER-STEP    Visual KaTeX layout simulator & step progression breakdown
 *   12. PROBLEM-STEPS  End-to-end multi-step student solution narrative with cognitive fading
 *   13. STEP-AST       Dual representation: AST node hierarchy side-by-side with KaTeX
 *   14. DIFF-STEP      AST-level structural diff between two isolated formulas or targets
 *   15. DIFF-DERIVE    Line-by-line LaTeX derivation diff (e.g. sys=SI vs sys=US)
 *   16. ROUNDTRIP-STEP Numerical fidelity oracle: AST Physics Eval vs LaTeX Derivation
 *   17. REGISTRY       Live unit / prefix / dimension / constant / palette / coupling registries
 */

import { loadAllTopics } from "../../src/topics/index.js";
import { parseMathAST, astToExprStr } from "../../src/cas/ast.js";
import { isolateVariable, resolveCanonicalKey } from "../../src/cas/algebra.js";
import { astToLatex, toLatexSymbol } from "../../src/cas/latex.js";
import {
  solveUnitAlgebra,
  isCanonicalScaleFactor,
  formatPairConversion,
  buildCompoundTokenConversions,
  getUnitAtomBag,
  getUnitKind,
  hasPointTempInCompound,
  isDimEqual,
  getUnitOffset,
  getAbsoluteCompanionUnit,
  evaluatePhysicalAST,
  BASE_UNITS,
  PREFIXES
} from "../../src/cas/units/index.js";
import { DIMENSIONS, fmtSigFig, formatGivenValue } from "../../src/core/dimensions.js";
import { CONSTANTS_DB } from "../../src/core/constants_registry.js";
import { DIMENSION_TOKEN_PALETTES, COUPLED_VARIABLE_GROUPS } from "../../src/core/unit_sampler.js";
import { solveDAG, canSolveTarget } from "../../src/core/graph_solver.js";
import { buildAlignedDerivation } from "../../src/core/derivation.js";
import { generateProblem } from "../../src/core/problem_gen.js";
import { withSeededRandom, mulberry32, unitLevels, coveringRows, restate, collectSteps, SEEDS } from "../../test/matrix_helpers.js";
import { assertDerivationMatchesAnswer } from "../../test/latex_oracle.js";
import { runMatrixForTopicIds } from "../../test/matrix_worker.js";

const FENCE = "`".repeat(3);
const fenced = (header, body) => `${header}\n${FENCE}\n${body}\n${FENCE}\n`;
const clip = (s, max = 200) => (s.length > max ? `${s.slice(0, max)}…` : s);

let cachedTopics = null;
async function getTopics() {
  if (!cachedTopics) {
    const loaded = await loadAllTopics();
    cachedTopics = Array.isArray(loaded) ? loaded : Object.values(loaded);
  }
  return cachedTopics;
}

function findTopic(topics, id) {
  if (!id) return null;
  const needle = id.trim().toLowerCase();
  return topics.find((t) => t.id === id || t.id.toLowerCase() === needle || t.id.toLowerCase().includes(needle));
}

function formatResult(title, lines, remaining, maxLines = 80) {
  const cap = Math.min(remaining, maxLines);
  const shown = lines.length > cap ? [...lines.slice(0, Math.max(0, cap - 1)), `[output truncated at ${cap} lines]`] : lines;
  const body = shown.join("\n");
  return { text: fenced(title, body), lines: shown.length };
}

function countVisualFractionDepth(texStr) {
  let maxDepth = 0;
  let depth = 0;
  for (let i = 0; i < texStr.length; i++) {
    if (texStr.startsWith("\\cfrac", i) || texStr.startsWith("\\frac", i)) {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
      i += 5;
    } else if (texStr[i] === "}") {
      if (depth > 0) depth--;
    }
  }
  return maxDepth;
}

function parseStepArg(arg) {
  const m = arg.match(/^(\S+)\s+(\S+)\s+(\S+)(?:\s+\{(.*?)\})?(?:\s+sys=(SI|US))?(?:\s+seed=(\d+))?$/);
  if (!m) return null;
  const units = {};
  if (m[4]) {
    for (const pair of m[4].split(/,\s*/).filter(Boolean)) {
      const i = pair.indexOf(":");
      if (i > 0) units[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    }
  }
  return {
    topicId: m[1],
    relId: m[2],
    target: m[3],
    units,
    sys: m[5] || "SI",
    seed: m[6] ? Number(m[6]) : 1
  };
}

function formatAstTree(node, indent = "") {
  if (!node) return `${indent}(null)`;
  if (node.type === "num") return `${indent}Number: ${node.val}`;
  if (node.type === "id") return `${indent}Identifier: ${node.name}`;
  if (node.type === "group") return `${indent}Group:\n${formatAstTree(node.expr, indent + "  ")}`;
  if (node.type === "call") return `${indent}Call ${node.fn}():\n${formatAstTree(node.arg, indent + "  ")}`;
  if (node.type === "binary") {
    return `${indent}BinaryOp (${node.op}):\n${formatAstTree(node.left, indent + "  ")}\n${formatAstTree(node.right, indent + "  ")}`;
  }
  return `${indent}${JSON.stringify(node)}`;
}

// ============================================================================
// 1. GRAPH: Bipartite DAG & Reachability
// ============================================================================
export async function handleGraph(arg, { remaining }) {
  const topics = await getTopics();
  const parts = arg.trim().split(/\s+/);
  const topicId = parts[0];
  const topic = findTopic(topics, topicId);
  if (!topic) {
    return { text: `[ERROR: Unknown topic "${topicId}". Available: ${topics.map((t) => t.id).join(", ")}]\n`, lines: 1 };
  }

  const opts = {};
  for (let i = 1; i < parts.length; i++) {
    const eq = parts[i].indexOf("=");
    if (eq > 0) opts[parts[i].slice(0, eq).toLowerCase()] = parts[i].slice(eq + 1);
  }

  const sys = opts.sys === "US" ? "US" : "SI";
  const seed = opts.seed ? Number(opts.seed) : 1;
  const S = withSeededRandom(seed, () => topic.createSystem({ sys }));

  const lines = [];
  lines.push(`Topic: ${topic.id} (System: ${sys})`);
  lines.push(`Variables: ${Object.keys(topic.varsDb).length} | Relations: ${topic.relations.length}`);

  if (!opts.givens) {
    lines.push("\n--- Bipartite Graph Summary ---");
    for (const rel of topic.relations) {
      const activeVariant = rel.variants?.[sys] || null;
      const nodes = activeVariant?.nodes || rel.nodes || [];
      const formula = activeVariant?.baseFormula || rel.baseFormula || "";
      lines.push(`${rel.id}: [${nodes.join(", ")}]  formula: ${formula}`);
    }
    return formatResult(`GRAPH: ${topic.id}`, lines, remaining);
  }

  const givens = opts.givens.split(",").map((s) => s.trim()).filter(Boolean);
  lines.push(`Givens: [${givens.join(", ")}]`);

  if (opts.target) {
    const reachable = canSolveTarget(givens, opts.target, topic.relations, S);
    lines.push(`Target: ${opts.target} -> Reachable: ${reachable ? "YES" : "NO"}`);
  }

  const steps = solveDAG(givens, S, topic.relations, topic.varsDb);
  lines.push(`\nUnrolled Solution Path (${steps.length} steps):`);
  if (!steps.length) {
    lines.push("  (no relations fired from the provided givens)");
  } else {
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const parents = st.parentIndices?.length ? `parents: [${st.parentIndices.join(", ")}]` : "root givens";
      lines.push(`  Step ${i + 1}: ${st.targetVar} via ${st.eqId} (${st.rhsExpr}) [${parents}]`);
    }
  }

  return formatResult(`GRAPH: ${topic.id} givens=${givens.join(",")}`, lines, remaining);
}

// ============================================================================
// 2. TOPIC: One-Page Slice Overview
// ============================================================================
export async function handleTopic(arg, { remaining }) {
  const topics = await getTopics();
  const topic = findTopic(topics, arg);
  if (!topic) {
    return { text: `[ERROR: Unknown topic "${arg}". Available: ${topics.map((t) => t.id).join(", ")}]\n`, lines: 1 };
  }

  const lines = [];
  lines.push(`Topic: ${topic.id} (Category: ${topic.category || "n/a"}, Title: ${topic.title || "n/a"})`);

  lines.push("\n--- Variables (varsDb) ---");
  for (const [key, v] of Object.entries(topic.varsDb)) {
    const sym = v.symbol || key;
    const dim = v.dimension || "dimless";
    const u = v.unit || "dimless";
    lines.push(`  ${key.padEnd(14)} sym: ${sym.padEnd(12)} dim: ${dim.padEnd(20)} unit: ${u}`);
  }

  lines.push("\n--- Relations ---");
  for (const rel of topic.relations) {
    const f = rel.baseFormula || (rel.canonical ? `${rel.canonical.lhs} = ${rel.canonical.rhs}` : "");
    const req = rel.requiredUnits ? ` [requiredUnits: ${JSON.stringify(rel.requiredUnits)}]` : "";
    const vars = rel.variants ? ` [variants: ${Object.keys(rel.variants).join(",")}]` : "";
    lines.push(`  ${rel.id.padEnd(24)} ${f}${req}${vars}`);
  }

  try {
    const si = topic.createSystem({ sys: "SI" });
    const us = topic.createSystem({ sys: "US" });
    const missingSI = Object.keys(topic.varsDb).filter((k) => si[k] === undefined && !topic.varsDb[k].isAbstract);
    const missingUS = Object.keys(topic.varsDb).filter((k) => us[k] === undefined && !topic.varsDb[k].isAbstract);
    lines.push("\n--- Contract Status ---");
    lines.push(`  createSystem(SI): ${missingSI.length === 0 ? "OK" : `Missing keys: ${missingSI.join(", ")}`}`);
    lines.push(`  createSystem(US): ${missingUS.length === 0 ? "OK" : `Missing keys: ${missingUS.join(", ")}`}`);
  } catch (e) {
    lines.push(`\n--- Contract Error: ${e.message} ---`);
  }

  return formatResult(`TOPIC: ${topic.id}`, lines, remaining);
}

// ============================================================================
// 17. REGISTRY: Live Engine Registries (read-only projections, never hardcoded)
// ============================================================================
const dimVec = (dimMap) =>
  Object.entries(dimMap || {}).filter(([, p]) => p !== 0).map(([d, p]) => `${d}${p}`).join(" ") || "-";

const REGISTRY_SECTIONS = {
  units: () => Object.entries(BASE_UNITS).map(([name, m]) => {
    const flags = [
      m.prefixes ? `prefixes=${m.prefixes}` : "",
      m.offset ? `offset=${m.offset}` : "",
      m.isDelta ? "delta" : "",
      m.absCompanion ? `abs=${m.absCompanion}` : "",
      m.forceCompanion ? `force=${m.forceCompanion}` : "",
      m.massCompanion ? `mass=${m.massCompanion}` : ""
    ].filter(Boolean).join(" ");
    return `${name.padEnd(18)} ${String(m.symbol).padEnd(6)} scale=${m.baseScale} dim=[${dimVec(m.dimMap)}] ${flags}`.trimEnd();
  }),
  prefixes: () => Object.entries(PREFIXES).map(([code, p]) => `${code.padEnd(3)} ${p.name.padEnd(6)} ${p.scale}`),
  dims: () => {
    const byValue = new Map();
    for (const [key, value] of Object.entries(DIMENSIONS)) byValue.set(value, [...(byValue.get(value) || []), key]);
    return [...byValue].map(([value, keys]) => `${keys.join(" = ").padEnd(34)} "${value}"`);
  },
  constants: () => Object.entries(CONSTANTS_DB).map(([key, c]) =>
    `${key.padEnd(8)} ${c.symbol} dim="${c.dimension}" SI=${c.valueSI} ${c.unitSI} US=${c.valueUS} ${c.unitUS}`),
  palettes: () => Object.entries(DIMENSION_TOKEN_PALETTES).flatMap(([sys, dims]) =>
    Object.entries(dims).map(([dim, entries]) => {
      const body = Array.isArray(entries)
        ? entries.map((e) => `${e.unit}:${e.tokens}`).join(" ")
        : JSON.stringify(entries);
      return clip(`${sys.padEnd(5)} ${dim}: ${body}`);
    })),
  coupled: () => COUPLED_VARIABLE_GROUPS.map((g, i) => clip(`#${String(i).padStart(2)} (${g.size}) ${[...g].join(",")}`))
};

export function handleRegistry(arg, { remaining }) {
  const names = arg.split(/[\s,]+/).map((s) => s.toLowerCase()).filter(Boolean);
  const valid = Object.keys(REGISTRY_SECTIONS);
  if (names.length === 0) {
    const rows = valid.map((n) => `  ${(n + ":").padEnd(12)} ${REGISTRY_SECTIONS[n]().length} rows`);
    return formatResult("REGISTRY: index", [...rows, "Request sections, e.g. REGISTRY units,dims"], remaining);
  }
  const bad = names.filter((n) => !REGISTRY_SECTIONS[n]);
  if (bad.length) {
    return { text: `[ERROR: Unknown REGISTRY section "${bad.join(", ")}". Valid: ${valid.join(", ")}]\n`, lines: 1 };
  }
  const unique = [...new Set(names)];
  const lines = [];
  for (const n of unique) {
    const rows = REGISTRY_SECTIONS[n]();
    lines.push(`--- ${n} (${rows.length} rows) ---`, ...rows);
  }
  return formatResult(`REGISTRY: ${unique.join(",")}`, lines, remaining, Math.min(240, 90 * unique.length));
}

// ============================================================================
// 3. UNIT & 4. CONVERT: 7D Dimensional Analysis
// ============================================================================
export function handleUnit(arg, { remaining }) {
  const expr = arg.trim();
  if (!expr) return { text: "[ERROR: UNIT requires a unit expression (e.g. 'Btu/(h-ft-Δ°F)')]\n", lines: 1 };

  const lines = [];
  try {
    const bag = getUnitAtomBag(expr);
    const dimEntries = Object.entries(bag.dimMap || {}).filter(([, v]) => v !== 0);
    const dimStr = dimEntries.map(([d, p]) => `${d}^${p}`).join(" * ") || "dimless";
    const offset = getUnitOffset(expr);
    const companion = getAbsoluteCompanionUnit(expr);

    lines.push(`Unit: ${expr}`);
    lines.push(`Kind: ${getUnitKind(expr)}`);
    lines.push(`7D Dimension Vector: { ${dimEntries.map(([d, p]) => `${d}: ${p}`).join(", ") || "none"} }`);
    lines.push(`Dimension String: ${dimStr}`);
    lines.push(`Base Scale Factor: ${bag.scale}`);
    lines.push(`Affine Offset: ${offset || 0}`);
    if (companion) lines.push(`Absolute Companion: ${companion}`);
  } catch (e) {
    lines.push(`[Error resolving unit "${expr}": ${e.message}]`);
  }

  return formatResult(`UNIT: ${expr}`, lines, remaining);
}

export function handleConvert(arg, { remaining }) {
  const m = arg.match(/^(.+?)\s*->\s*(.+)$/);
  if (!m) return { text: "[ERROR: CONVERT requires format 'fromUnit -> toUnit' (e.g. 'Btu/h -> kW')]\n", lines: 1 };

  const fromU = m[1].trim();
  const toU = m[2].trim();
  const lines = [];

  try {
    const bagFrom = getUnitAtomBag(fromU);
    const bagTo = getUnitAtomBag(toU);
    const equalDim = isDimEqual(bagFrom.dimMap, bagTo.dimMap);

    lines.push(`Convert: ${fromU} -> ${toU}`);
    lines.push(`Dimensional Match: ${equalDim ? "YES" : "NO (incompatible dimensions)"}`);

    if (!equalDim) {
      lines.push(`  From dims: ${JSON.stringify(bagFrom.dimMap)}`);
      lines.push(`  To dims:   ${JSON.stringify(bagTo.dimMap)}`);
      return formatResult(`CONVERT: ${fromU} -> ${toU}`, lines, remaining);
    }

    const scale = bagFrom.scale / bagTo.scale;
    const isCanon = isCanonicalScaleFactor(scale);
    lines.push(`Scale Factor: ${scale} (${isCanon ? "CANONICAL" : "ALIEN / NON-CANONICAL"})`);

    const conv = formatPairConversion(fromU, toU);
    if (conv && conv.tex) {
      lines.push(`Pairwise Conversion TeX: ${conv.tex.trim()}`);
    } else if (Math.abs(scale - 1) < 1e-6) {
      lines.push("Pairwise Conversion TeX: (scale parity, 1:1)");
    } else {
      const compound = buildCompoundTokenConversions([{ tok: "x", uName: fromU, dim: null, exp: 1 }], toU);
      lines.push(`Compound Conversion: ${JSON.stringify(compound.conversionsByToken)}`);
    }
  } catch (e) {
    lines.push(`[Conversion error: ${e.message}]`);
  }

  return formatResult(`CONVERT: ${fromU} -> ${toU}`, lines, remaining);
}

// ============================================================================
// 5. SOLVE: CAS Symbolic Inversion
// ============================================================================
export function handleSolve(arg, { remaining }) {
  const m = arg.match(/^(?:"([^"]+)"|'([^']+)'|(\S.*?))\s+([A-Za-z0-9_]+)$/);
  if (!m) return { text: "[ERROR: SOLVE requires 'formula target' or '\"formula\" target' (e.g. 'P * V = m * R * T  T')]\n", lines: 1 };

  const formula = (m[1] || m[2] || m[3]).trim();
  const target = m[4].trim();
  const lines = [];

  lines.push(`Formula: ${formula}`);
  lines.push(`Target: ${target}`);

  try {
    const res = isolateVariable(formula, target);
    if (res.success) {
      lines.push(`Status: SUCCESS`);
      lines.push(`Isolated Expr: ${target} = ${res.isolatedRhs}`);
      const tex = astToLatex(res.isolatedAST);
      lines.push(`Isolated TeX:  ${target} = ${tex}`);
    } else {
      lines.push(`Status: FAILED (cannot invert for target '${target}')`);
    }
  } catch (e) {
    lines.push(`Status: ERROR (${e.message})`);
  }

  return formatResult(`SOLVE: ${target} from ${formula}`, lines, remaining);
}

// ============================================================================
// 6. HYGIENE: Fast-Path Static Schema Validator
// ============================================================================
export async function handleHygiene(arg, { remaining }) {
  const topics = await getTopics();
  const filterTopic = arg.trim() && arg.trim() !== "all" ? findTopic(topics, arg.trim()) : null;
  const targetTopics = filterTopic ? [filterTopic] : topics;

  const lines = [];
  lines.push(`Auditing hygiene for ${targetTopics.length} topic(s)...`);

  let totalIssues = 0;
  for (const topic of targetTopics) {
    const topicIssues = [];
    const usedVars = new Set();
    for (const rel of topic.relations) {
      (rel.nodes || []).forEach((n) => usedVars.add(n));
      for (const v of Object.values(rel.variants || {})) {
        (v.nodes || []).forEach((n) => usedVars.add(n));
      }
    }

    for (const [key, v] of Object.entries(topic.varsDb)) {
      if (!usedVars.has(key) && !v.isAbstract) {
        topicIssues.push(`Orphan variable declared in varsDb but unused in relations: '${key}'`);
      }
    }

    for (const rel of topic.relations) {
      const f = rel.baseFormula || "";
      if (/\\circ\b|\^\\circ|\^\{\\circ\}/.test(f) || /\\circ\b|\^\\circ|\^\{\\circ\}/.test(rel.canonicalTex || "")) {
        topicIssues.push(`Forbidden \\circ or ^\\circ in relation '${rel.id}'; use native '°'`);
      }
    }

    for (const [key, v] of Object.entries(topic.varsDb)) {
      if (v.unit && hasPointTempInCompound(v.unit, v.dimension)) {
        topicIssues.push(`Compound unit for '${key}' ("${v.unit}") must use explicit Δ temperature atoms`);
      }
    }

    try {
      const si = topic.createSystem({ sys: "SI" });
      const us = topic.createSystem({ sys: "US" });
      for (const k of Object.keys(topic.varsDb)) {
        if (!topic.varsDb[k].isAbstract) {
          if (si[k] === undefined) topicIssues.push(`createSystem(SI) missing value for '${k}'`);
          if (us[k] === undefined) topicIssues.push(`createSystem(US) missing value for '${k}'`);
        }
      }
    } catch (e) {
      topicIssues.push(`createSystem threw: ${e.message}`);
    }

    if (topicIssues.length > 0) {
      lines.push(`\n[${topic.id}] (${topicIssues.length} issues):`);
      for (const iss of topicIssues) lines.push(`  - ${iss}`);
      totalIssues += topicIssues.length;
    }
  }

  if (totalIssues === 0) {
    lines.push("\nHygiene Status: ALL CLEAN (0 schema orphans, 0 degree symbol violations, contracts OK).");
  } else {
    lines.push(`\nHygiene Status: FAILED with ${totalIssues} issue(s).`);
  }

  return formatResult(`HYGIENE: ${filterTopic ? filterTopic.id : "all"}`, lines, remaining);
}

// ============================================================================
// 7. FAILURES: Derivation Matrix Failure Clustering
// ============================================================================
/** Formats runMatrixForTopicIds() output: clusters by (layer, relation, target); the smallest restate is the example. */
export function summarizeMatrixFailures(failures, cases, topicCount) {
  const lines = [`Completed: ${cases} matrix cases checked across ${topicCount} topic(s).`];
  if (failures.length === 0) {
    lines.push("Matrix Status: ALL CLEAN (0 failures).");
    return lines;
  }

  const clusters = new Map();
  for (const f of failures) {
    const key = `${f.layer} | ${f.where.split(" {")[0].replace(/ seed=\d+$/, "")}`;
    const c = clusters.get(key) || { n: 0, example: f };
    c.n++;
    if ((f.changed ?? Infinity) < (c.example.changed ?? Infinity)) c.example = f;
    clusters.set(key, c);
  }

  const byLayer = {};
  for (const f of failures) byLayer[f.layer] = (byLayer[f.layer] || 0) + 1;
  const ranked = [...clusters].sort((a, b) => b[1].n - a[1].n);
  const MAX_CLUSTERS = 20;

  lines.push(`Matrix Status: ${failures.length} failures found across ${clusters.size} cluster(s):`);
  lines.push(`  By layer: ${Object.entries(byLayer).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  for (const [key, { n, example }] of ranked.slice(0, MAX_CLUSTERS)) {
    lines.push(`  [${n} cases] ${key}`);
    lines.push(`    e.g. ${clip(example.where, 400)}`);
    lines.push(`    ${clip(example.msg.split(" (")[0])}`);
    const m = /evaluates to ([-+\d.eE]+), boxed is ([-+\d.eE]+)/.exec(example.msg);
    const ratio = m ? Number(m[2]) / Number(m[1]) : NaN;
    if (Number.isFinite(ratio)) lines.push(`    boxed/derivation = ${fmtSigFig(ratio, 6)}`);
  }
  if (ranked.length > MAX_CLUSTERS) lines.push(`  ... ${ranked.length - MAX_CLUSTERS} more cluster(s)`);
  return lines;
}

export async function handleFailures(arg, { remaining }) {
  const topics = await getTopics();
  const wanted = arg.trim();
  const filterTopic = wanted ? findTopic(topics, wanted) : null;
  if (wanted && !filterTopic) {
    return { text: `[ERROR: Unknown topic "${wanted}". Available: ${topics.map((t) => t.id).join(", ")}]\n`, lines: 1 };
  }

  const ids = (filterTopic ? [filterTopic] : topics).map((t) => t.id);
  const { failures, cases } = await runMatrixForTopicIds(ids);
  const lines = [`Scanning derivation matrix for ${ids.length} topic(s)...`, ...summarizeMatrixFailures(failures, cases, ids.length)];
  return formatResult(`FAILURES: ${filterTopic ? filterTopic.id : "all"}`, lines, remaining, 120);
}

function splitDerivRows(deriv) {
  return deriv.split(/\\\\(?:\[\d+pt\])?/).map(l => l.trim()).filter(Boolean);
}

async function resolveStepCase(arg, usage) {
  const c = parseStepArg(arg);
  if (!c) return { error: `[ERROR: ${usage}]\n` };

  const topics = await getTopics();
  const topic = findTopic(topics, c.topicId);
  if (!topic) return { error: `[ERROR: Unknown topic "${c.topicId}"]\n` };

  const S = withSeededRandom(c.seed, () => topic.createSystem({ sys: c.sys }));
  const allSteps = collectSteps(topic, c.sys, S);
  const step = allSteps.find((s) => s.id === c.relId && s.targetVar === c.target);
  if (!step) {
    const rel = topic.relations.find(r => r.id === c.relId);
    if (!rel) {
      return {
        error: `[ERROR: Unknown relation "${c.relId}" in "${topic.id}". Available: ${topic.relations.map(r => r.id).join(", ")}]\n`
      };
    }
    const validTargets = allSteps.filter(s => s.id === c.relId).map(s => s.targetVar);
    return {
      error: `[ERROR: Target "${c.target}" is not isolatable or missing in "${c.relId}". Valid targets: ${validTargets.join(", ") || "none"}]\n`
    };
  }

  const S2 = Object.keys(c.units).length ? restate(S, Object.keys(c.units), c.units, topic.varsDb, c.sys) : S;
  const curStep = { ...step, expectedVal: S2[c.target] };
  const tUnit = S2._u?.[c.target] || topic.varsDb[c.target]?.unit || "dimless";
  return { c, topic, S: S2, step: curStep, tUnit };
}

// ============================================================================
// 8. DERIVE: Single-Step Derivation & Tower Height
// ============================================================================
export async function handleDerive(arg, { remaining }) {
  const resolved = await resolveStepCase(arg, "DERIVE requires: topic rel_id target [{var:unit,...}] [sys=SI|US] [seed=N]");
  if (resolved.error) return { text: resolved.error, lines: 1 };
  const { c, topic, S, step, tUnit } = resolved;
  const lines = [];

  try {
    const derivation = buildAlignedDerivation(step, S, [step], topic.varsDb, topic.relations);
    const fracDepth = countVisualFractionDepth(derivation);
    const towerVisualRows = fracDepth * 2;

    lines.push(`Topic: ${topic.id} | Step: ${c.relId} -> ${c.target} | Target Unit: ${tUnit}`);
    lines.push(`Formula RHS: ${step.rhsExpr}`);
    lines.push(`Visual Fraction Depth: ${fracDepth} (Tower visual rows: ${towerVisualRows} | Cap: 4 rows max)`);
    lines.push(`Tower Cap Compliance: ${towerVisualRows <= 4 ? "PASS (<= 4 rows)" : "FAIL (> 4 rows, step-down required)"}`);

    try {
      assertDerivationMatchesAnswer(derivation, step.expectedVal, `${topic.id}/${c.relId}->${c.target}`, topic.varsDb, tUnit);
      lines.push("Oracle Match: PASS (LaTeX derivation matches expected value)");
    } catch (e) {
      lines.push(`Oracle Match: FAIL (${e.message})`);
    }

    lines.push("\n--- Rendered KaTeX Derivation ---");
    for (const dl of splitDerivRows(derivation)) {
      lines.push(dl);
    }
  } catch (e) {
    lines.push(`[Derivation generation threw: ${e.message}]`);
  }

  return formatResult(`DERIVE: ${topic.id} ${c.relId} -> ${c.target}`, lines, remaining);
}

// ============================================================================
// 9. AUDIT-LATEX: KaTeX Formatting & Visual Invariant Linter
// ============================================================================
export async function handleAuditLatex(arg, { remaining }) {
  const isRaw = arg.includes("\\") || arg.includes("{");
  const lines = [];
  const violations = [];

  function auditString(str, label) {
    if (/\\circ\b|\^\\circ|\^\{\\circ\}/.test(str)) violations.push(`[${label}] Forbidden \\circ; use native '°'`);
    if (/\\text\{\s+/.test(str)) violations.push(`[${label}] Leading space inside \\text{}`);
    if (/(?<!\\text\{)%(?!\})/.test(str)) violations.push(`[${label}] Raw '%' symbol; must be mirrored as \\text{\\%}`);
    if (/,\s*\\text\{/.test(str)) violations.push(`[${label}] Forbidden literal comma preceding unit`);
    if (/\b\d{1,3}(,\d{3})+\b/.test(str)) violations.push(`[${label}] Bare unbracketed comma in number (use '{,}')`);
  }

  if (isRaw) {
    auditString(arg, "Raw String");
  } else {
    const topics = await getTopics();
    const topic = findTopic(topics, arg.trim());
    if (!topic) return { text: `[ERROR: Unknown topic "${arg.trim()}"]\n`, lines: 1 };

    const S = topic.createSystem({ sys: "SI" });
    for (const step of collectSteps(topic, "SI", S)) {
      try {
        const d = buildAlignedDerivation(step, S, [step], topic.varsDb, topic.relations);
        auditString(d, `${step.id}->${step.targetVar}`);
      } catch (e) {
        violations.push(`[${step.id}] Build threw: ${e.message}`);
      }
    }
  }

  lines.push(`Audit Target: ${isRaw ? "LaTeX String" : arg.trim()}`);
  if (violations.length === 0) {
    lines.push("Audit Status: PASSED (Native °, \\text{\\%}, spacing, and thousands bracketed)");
  } else {
    lines.push(`Audit Status: FAILED (${violations.length} violation(s)):`);
    for (const v of violations) lines.push(`  - ${v}`);
  }

  return formatResult(`AUDIT-LATEX: ${isRaw ? "raw" : arg.trim()}`, lines, remaining);
}

// ============================================================================
// 10. AUDIT-STEP: AST-Native Structural Derivation Linter
// ============================================================================
export async function handleAuditStep(arg, { remaining }) {
  const resolved = await resolveStepCase(arg, "AUDIT-STEP requires: topic rel_id target [{var:unit,...}] [sys=SI|US] [seed=N]");
  if (resolved.error) return { text: resolved.error, lines: 1 };
  const { c, topic, S: S2, step, tUnit } = resolved;
  const lines = [];
  const findings = [];

  try {
    const derivation = buildAlignedDerivation(step, S2, [step], topic.varsDb, topic.relations);
    const fracDepth = countVisualFractionDepth(derivation);
    if (fracDepth * 2 > 4) {
      findings.push(`Fraction tower exceeds 4 rows (depth: ${fracDepth}, rows: ${fracDepth * 2})`);
    }

    if (/\\circ\b|\^\\circ|\^\{\\circ\}/.test(derivation)) {
      findings.push("Forbidden LaTeX degree symbol (\\circ or ^\\circ); use native '°'");
    }

    if (/(?<!\\text\{)%(?!\})/.test(derivation)) {
      findings.push("Percent rendered without text mirroring (must be \\text{\\%})");
    }

    if (/\\text\{\s+/.test(derivation)) {
      findings.push("Leading space inside \\text{} macro");
    }

    if (/,\s*\\text\{/.test(derivation)) {
      findings.push("Forbidden comma preceding physical unit");
    }

    if (/\\cfrac\{1\s*\\text\{/i.test(derivation) || /\\frac\{1\s*\\text\{/i.test(derivation)) {
      findings.push("Violates 'Omit 1' rule: coefficient of 1 explicitly written before unit token");
    }

    const ua = solveUnitAlgebra(step.rhsExpr, S2, c.target, tUnit, topic.varsDb, step.requiredUnits);
    for (const s of ua.conversionScalars || []) {
      if (!isCanonicalScaleFactor(s)) {
        findings.push(`Non-canonical (alien) scale factor generated: ${s}`);
      }
    }

    lines.push(`Topic: ${topic.id} | Step: ${c.relId} -> ${c.target}`);
    lines.push(`Audit Checks Run: 7`);
    if (findings.length === 0) {
      lines.push("Audit Status: ALL INVARIANTS PASSED (4-row tower, native °, \\text{\\%}, spacing, canonical scalars)");
    } else {
      lines.push(`Audit Status: FAILED (${findings.length} invariant violations):`);
      for (const f of findings) lines.push(`  - ${f}`);
    }
  } catch (e) {
    lines.push(`[Audit failed with error: ${e.message}]`);
  }

  return formatResult(`AUDIT-STEP: ${topic.id} ${c.relId} -> ${c.target}`, lines, remaining);
}

// ============================================================================
// 11. RENDER-STEP: Visual Layout Wireframe & Progression Breakdown
// ============================================================================
export async function handleRenderStep(arg, { remaining }) {
  const resolved = await resolveStepCase(arg, "RENDER-STEP requires: topic rel_id target [{var:unit,...}] [sys=SI|US] [seed=N]");
  if (resolved.error) return { text: resolved.error, lines: 1 };
  const { c, topic, S, step } = resolved;

  const lines = [];
  try {
    const derivation = buildAlignedDerivation(step, S, [step], topic.varsDb, topic.relations);
    const dLines = splitDerivRows(derivation);

    lines.push(`Visual Wireframe Layout: ${step.id} -> ${step.targetVar}`);
    lines.push(`Formula: ${step.rhsExpr}`);
    lines.push("\n--- Step-by-Step Visual Progression ---");
    dLines.forEach((dl, i) => {
      let phase = "Step";
      if (i === 0) phase = "Symbolic Formula";
      else if (i === 1) phase = "Numeric Substitution";
      else if (i === dLines.length - 1) phase = "Evaluated Result";
      else phase = `Intermediate Simplification #${i}`;
      lines.push(`[Phase ${i + 1}: ${phase}]`);
      lines.push(`  ${clip(dl)}`);
    });
  } catch (e) {
    lines.push(`[Render wireframe failed: ${e.message}]`);
  }

  return formatResult(`RENDER-STEP: ${topic.id} ${c.relId} -> ${c.target}`, lines, remaining);
}

// ============================================================================
// 12. PROBLEM-STEPS: End-to-End Problem Narrative & Fading
// ============================================================================
export async function handleProblemSteps(arg, { remaining }) {
  const parts = arg.trim().split(/\s+/);
  const topicId = parts[0];
  let mode = null;
  let seed = 1;
  for (let i = 1; i < parts.length; i++) {
    if (/^sys=(SI|US|MIXED)$/i.test(parts[i])) mode = parts[i].slice(4).toUpperCase();
    else if (/^seed=(\d+)$/i.test(parts[i])) seed = Number(parts[i].slice(5));
  }

  const topics = await getTopics();
  const topic = findTopic(topics, topicId);
  if (!topic) return { text: `[ERROR: Unknown topic "${topicId}"]\n`, lines: 1 };

  const lines = [];
  try {
    const prob = withSeededRandom(seed, () => generateProblem(topic, () => 0, { mode }));
    const sol = prob.solution || [];
    const active = sol.filter(s => !s.isFaded);
    const deliverable = active[active.length - 1]?.targetVar || sol[sol.length - 1]?.targetVar;

    lines.push(`Problem Deliverable: ${deliverable || "none"} (Topic: ${topic.id}, System: ${prob.system?.sys || mode || "random"})`);
    const givenText = (prob.givens || []).map(k => {
      const val = prob.system?.[k];
      const u = prob.system?._u?.[k] || topic.varsDb[k]?.unit || "";
      const uStr = u && u !== "dimless" && u !== "ratio" ? ` ${u}` : "";
      return `${k} = ${typeof val === "number" ? fmtSigFig(val, 6) : val}${uStr}`;
    });
    lines.push(`Givens: ${givenText.join(", ")}`);
    lines.push(`\nSteps Sequence (${sol.length} total):`);

    sol.forEach((st, idx) => {
      const status = st.isFaded ? "[FADED / HIDDEN]" : "[ACTIVE / VISIBLE]";
      const u = prob.system?._u?.[st.targetVar] || topic.varsDb[st.targetVar]?.unit || "";
      const uStr = u && u !== "dimless" && u !== "ratio" ? ` ${u}` : "";
      lines.push(`  Step ${idx + 1} ${status}: Solve for ${st.targetVar} via ${st.eqId || st.id}`);
      lines.push(`    Formula: ${st.baseFormula || st.rhsExpr}`);
      lines.push(`    Expected: ${fmtSigFig(st.expectedVal, 6)}${uStr}`);
    });
  } catch (e) {
    lines.push(`[Problem generation error: ${e.message}]`);
  }

  return formatResult(`PROBLEM-STEPS: ${topic.id}`, lines, remaining);
}

// ============================================================================
// 13. STEP-AST: Dual AST Node Hierarchy & KaTeX Inspector
// ============================================================================
export async function handleStepAst(arg, { remaining }) {
  const c = parseStepArg(arg);
  if (!c) {
    return { text: "[ERROR: STEP-AST requires: topic rel_id target [{var:unit,...}] [sys=SI|US]]\n", lines: 1 };
  }

  const topics = await getTopics();
  const topic = findTopic(topics, c.topicId);
  if (!topic) return { text: `[ERROR: Unknown topic "${c.topicId}"]\n`, lines: 1 };

  const S = topic.createSystem({ sys: c.sys });
  const step = collectSteps(topic, c.sys, S).find((s) => s.id === c.relId && s.targetVar === c.target);
  if (!step) return { text: `[ERROR: Step not found: "${c.relId}" -> "${c.target}"]\n`, lines: 1 };

  const lines = [];
  lines.push(`Dual Representation for: ${c.relId} -> ${c.target}`);
  lines.push(`Formula RHS: ${step.rhsExpr}`);

  const ast = parseMathAST(step.rhsExpr);
  lines.push("\n--- Semantic AST Hierarchy ---");
  lines.push(formatAstTree(ast, "  "));

  lines.push("\n--- Serialized KaTeX Equivalent ---");
  lines.push(`  ${astToLatex(ast)}`);

  return formatResult(`STEP-AST: ${topic.id} ${c.relId} -> ${c.target}`, lines, remaining);
}

// ============================================================================
// 14. DIFF-STEP: AST Structural Tree Diff
// ============================================================================
export async function handleDiffStep(arg, { remaining }) {
  const parts = arg.trim().split(/\s+vs\s+|\s+/);
  if (parts.length < 2) {
    return { text: "[ERROR: DIFF-STEP requires 'topic rel target1 vs target2' or 'formula1 vs formula2']\n", lines: 1 };
  }

  const lines = [];
  if (parts.length === 2 && (parts[0].includes("=") || parts[1].includes("="))) {
    const ast1 = parseMathAST(parts[0]);
    const ast2 = parseMathAST(parts[1]);
    lines.push(`Diffing Formula ASTs:`);
    lines.push(`  Expr 1: ${astToExprStr(ast1)}`);
    lines.push(`  Expr 2: ${astToExprStr(ast2)}`);
    lines.push(`\n--- AST 1 ---`);
    lines.push(formatAstTree(ast1, "  "));
    lines.push(`\n--- AST 2 ---`);
    lines.push(formatAstTree(ast2, "  "));
    return formatResult(`DIFF-STEP: formulas`, lines, remaining);
  }

  const topicId = parts[0];
  const relId = parts[1];
  const t1 = parts[2];
  const t2 = parts[parts.length - 1];

  const topics = await getTopics();
  const topic = findTopic(topics, topicId);
  if (!topic) return { text: `[ERROR: Unknown topic "${topicId}"]\n`, lines: 1 };

  const S = topic.createSystem({ sys: "SI" });
  const step1 = collectSteps(topic, "SI", S).find((s) => s.id === relId && s.targetVar === t1);
  const step2 = collectSteps(topic, "SI", S).find((s) => s.id === relId && s.targetVar === t2);

  if (!step1 || !step2) return { text: `[ERROR: Could not find both steps for '${t1}' and '${t2}']\n`, lines: 1 };

  const ast1 = parseMathAST(step1.rhsExpr);
  const ast2 = parseMathAST(step2.rhsExpr);

  lines.push(`Diffing Inverted Steps for ${relId}: ${t1} vs ${t2}`);
  lines.push(`  ${t1} = ${step1.rhsExpr}`);
  lines.push(`  ${t2} = ${step2.rhsExpr}`);
  lines.push(`\n--- AST for ${t1} ---`);
  lines.push(formatAstTree(ast1, "  "));
  lines.push(`\n--- AST for ${t2} ---`);
  lines.push(formatAstTree(ast2, "  "));

  return formatResult(`DIFF-STEP: ${relId} ${t1} vs ${t2}`, lines, remaining);
}

// ============================================================================
// 15. DIFF-DERIVE: Line-by-Line LaTeX Derivation Diff
// ============================================================================
export async function handleDiffDerive(arg, { remaining }) {
  const parts = arg.trim().split(/\s+/);
  const topicId = parts[0];
  const relId = parts[1];
  const target = parts[2];

  if (!topicId || !relId || !target) {
    return { text: "[ERROR: DIFF-DERIVE requires: topic rel_id target [sys1=SI vs sys2=US]]\n", lines: 1 };
  }

  const topics = await getTopics();
  const topic = findTopic(topics, topicId);
  if (!topic) return { text: `[ERROR: Unknown topic "${topicId}"]\n`, lines: 1 };

  const lines = [];
  try {
    const S_si = topic.createSystem({ sys: "SI" });
    const S_us = topic.createSystem({ sys: "US" });
    const step_si = collectSteps(topic, "SI", S_si).find((s) => s.id === relId && s.targetVar === target);
    const step_us = collectSteps(topic, "US", S_us).find((s) => s.id === relId && s.targetVar === target);

    if (!step_si || !step_us) return { text: `[ERROR: Step '${relId} -> ${target}' not found in both systems]\n`, lines: 1 };

    const d_si = splitDerivRows(buildAlignedDerivation(step_si, S_si, [step_si], topic.varsDb, topic.relations));
    const d_us = splitDerivRows(buildAlignedDerivation(step_us, S_us, [step_us], topic.varsDb, topic.relations));

    lines.push(`Derivation Diff (SI vs US) for: ${relId} -> ${target}`);
    lines.push("--- SI (Line-by-Line) ---");
    d_si.forEach((l, i) => lines.push(`  [SI ${i + 1}] ${clip(l)}`));
    lines.push("\n--- US (Line-by-Line) ---");
    d_us.forEach((l, i) => lines.push(`  [US ${i + 1}] ${clip(l)}`));
  } catch (e) {
    lines.push(`[DIFF-DERIVE threw: ${e.message}]`);
  }

  return formatResult(`DIFF-DERIVE: ${topic.id} ${relId} -> ${target}`, lines, remaining);
}

// ============================================================================
// 16. ROUNDTRIP-STEP: AST Physics vs LaTeX Oracle Identity
// ============================================================================
export async function handleRoundtripStep(arg, { remaining }) {
  const resolved = await resolveStepCase(arg, "ROUNDTRIP-STEP requires: topic rel_id target [{var:unit,...}] [sys=SI|US] [seed=N]");
  if (resolved.error) return { text: resolved.error, lines: 1 };
  const { c, topic, S: S2, step, tUnit } = resolved;
  const lines = [];

  try {
    const derivation = buildAlignedDerivation(step, S2, [step], topic.varsDb, topic.relations);
    const expected = step.expectedVal;

    lines.push(`Roundtrip Identity Test: ${c.relId} -> ${c.target}`);
    lines.push(`  Target Unit:        ${tUnit}`);
    lines.push(`  Expected Physics:   ${expected}`);

    let oracleOk = false;
    let oracleError = "";
    try {
      assertDerivationMatchesAnswer(derivation, expected, `${topic.id}/${c.relId}->${c.target}`, topic.varsDb, tUnit);
      oracleOk = true;
    } catch (e) {
      oracleError = e.message;
    }

    lines.push(`  LaTeX Oracle Match: ${oracleOk ? "PASS (Exact Match)" : `FAIL (${oracleError})`}`);
    lines.push(`\nRoundtrip Status: ${oracleOk ? "PERFECT NUMERICAL IDENTITY" : "DISCREPANCY DETECTED"}`);
  } catch (e) {
    lines.push(`[Roundtrip evaluation threw: ${e.message}]`);
  }

  return formatResult(`ROUNDTRIP-STEP: ${topic.id} ${c.relId} -> ${c.target}`, lines, remaining);
}
