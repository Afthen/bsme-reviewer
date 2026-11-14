/**
 * src/core/relation_builder.js
 * Unified Relation Constructor & Continued-Formula Compiler.
 * Supports standard equations, SI/US variants, requiredUnits, multi-"=" chains,
 * indexed (_i) laws, and nested continued operators: sum(...), prod(...), chain(...).
 */

import { parseMathAST, astToExprStr, getAstIdentifiers, unwrapGroup } from "../cas/ast.js";
import { isReservedMathToken } from "../cas/algebra.js";
import { astToLatex } from "../cas/latex.js";

const DEFAULT_COUNT = 3;

function instantiateIdName(name, idx) {
  if (name.endsWith("_i")) {
    return `${name.slice(0, -1)}${idx}`;
  }
  return name;
}

function instantiateAST(node, idx) {
  if (!node) return null;
  if (node.type === "id") return { type: "id", name: instantiateIdName(node.name, idx) };
  if (node.type === "group") return { type: "group", expr: instantiateAST(node.expr, idx) };
  if (node.type === "call") return { type: "call", fn: node.fn, arg: instantiateAST(node.arg, idx) };
  if (node.type === "binary") {
    return {
      type: "binary",
      op: node.op,
      left: instantiateAST(node.left, idx),
      right: instantiateAST(node.right, idx)
    };
  }
  return { ...node };
}

function astHasFoldCall(node) {
  if (!node) return false;
  if (node.type === "call") {
    if (node.fn === "sum" || node.fn === "prod" || node.fn === "chain") return true;
    return astHasFoldCall(node.arg);
  }
  if (node.type === "group") return astHasFoldCall(node.expr);
  if (node.type === "binary") return astHasFoldCall(node.left) || astHasFoldCall(node.right);
  return false;
}

function expandFoldCallsAST(node, count) {
  if (!node) return null;
  if (node.type === "group") return { type: "group", expr: expandFoldCallsAST(node.expr, count) };
  if (node.type === "call") {
    if (node.fn === "sum" || node.fn === "prod") {
      const op = node.fn === "sum" ? "+" : "*";
      const terms = [];
      for (let i = 1; i <= count; i++) {
        let termAst = expandFoldCallsAST(instantiateAST(node.arg, i), count);
        if (op === "*" && termAst.type === "binary" && (termAst.op === "+" || termAst.op === "-")) {
          termAst = { type: "group", expr: termAst };
        }
        terms.push(termAst);
      }
      let acc = terms[0];
      for (let i = 1; i < terms.length; i++) {
        acc = { type: "binary", op, left: acc, right: terms[i] };
      }
      return { type: "group", expr: acc };
    }
    return { type: "call", fn: node.fn, arg: expandFoldCallsAST(node.arg, count) };
  }
  if (node.type === "binary") {
    return {
      type: "binary",
      op: node.op,
      left: expandFoldCallsAST(node.left, count),
      right: expandFoldCallsAST(node.right, count)
    };
  }
  return node;
}

function astToEllipsisLatex(node, varsDb = {}) {
  if (!node) return "";
  if (node.type === "group") {
    const inner = unwrapGroup(node.expr);
    if (inner?.type === "call" && (inner.fn === "sum" || inner.fn === "prod")) {
      return `\\left(${astToEllipsisLatex(inner, varsDb)}\\right)`;
    }
    return `(${astToEllipsisLatex(node.expr, varsDb)})`;
  }
  if (node.type === "call") {
    if (node.fn === "sum" || node.fn === "prod") {
      const t1 = astToEllipsisLatex(instantiateAST(node.arg, 1), varsDb);
      const t2 = astToEllipsisLatex(instantiateAST(node.arg, 2), varsDb);
      const tn = astToEllipsisLatex(instantiateAST(node.arg, "n"), varsDb);
      if (node.fn === "sum") return `${t1} + ${t2} + \\dots + ${tn}`;
      return `${t1} \\cdot ${t2} \\cdots ${tn}`;
    }
    if (node.fn === "chain") {
      const t1 = astToEllipsisLatex(instantiateAST(node.arg, 1), varsDb);
      const t2 = astToEllipsisLatex(instantiateAST(node.arg, 2), varsDb);
      const tn = astToEllipsisLatex(instantiateAST(node.arg, "n"), varsDb);
      return `${t1} = ${t2} = \\dots = ${tn}`;
    }
    const wrapper = { ...node, arg: astToEllipsisLatexNodeSafe(node.arg, varsDb) };
    if (typeof wrapper.arg === "string") return `\\text{${node.fn}}\\left(${wrapper.arg}\\right)`;
    return astToLatex(node, null, varsDb);
  }
  if (node.type === "binary") {
    if (node.op === "/") {
      return `\\cfrac{${astToEllipsisLatex(node.left, varsDb)}}{${astToEllipsisLatex(node.right, varsDb)}}`;
    }
    if (node.op === "*") {
      const L = astToEllipsisLatex(node.left, varsDb);
      const R = astToEllipsisLatex(node.right, varsDb);
      const uR = unwrapGroup(node.right);
      const wrapR = (uR?.type === "call" && uR.fn === "sum") ? `\\left(${R}\\right)` : R;
      return `${L} \\, ${wrapR}`;
    }
    if (node.op === "+" || node.op === "-") {
      return `${astToEllipsisLatex(node.left, varsDb)} ${node.op} ${astToEllipsisLatex(node.right, varsDb)}`;
    }
    if (node.op === "^") {
      return `{${astToEllipsisLatex(node.left, varsDb)}}^{${astToEllipsisLatex(node.right, varsDb)}}`;
    }
  }
  return astToLatex(node, null, varsDb);
}

function astToEllipsisLatexNodeSafe(node, varsDb) {
  if (!astHasFoldCall(node)) return node;
  return astToEllipsisLatex(node, varsDb);
}

function extractNodesFromFormula(formulaStr) {
  const parts = formulaStr.split("=").map(s => s.trim());
  const seen = new Set();
  const ordered = [];
  for (const part of parts) {
    const ast = parseMathAST(part);
    if (!ast) continue;
    for (const id of getAstIdentifiers(ast)) {
      if (!isReservedMathToken(id) && !seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
  }
  return ordered;
}

function compileSingleEquation(spec, formulaStr, count, varsDb, idOverride = null, masteryIdOverride = null, texOverride = null) {
  const parts = formulaStr.split("=").map(s => s.trim());
  const lhsAst = parseMathAST(parts[0]);
  const rhsAst = parseMathAST(parts[1]);

  if (!lhsAst || !rhsAst) {
    throw new Error(`Invalid formula in relation [${spec.id}]: "${formulaStr}"`);
  }

  function buildInstantiatedEdge(i, baseFormula, canonicalTex) {
    return {
      id: `${spec.id}__${i}`,
      masteryId: spec.id,
      name: spec.name,
      canonicalTex,
      baseFormula,
      nodes: extractNodesFromFormula(baseFormula),
      ...(spec.requiredUnits ? { requiredUnits: spec.requiredUnits } : {})
    };
  }

  // Case 1: Symmetric equality chain: lhs = chain(term_i)
  const uRhs = unwrapGroup(rhsAst);
  if (uRhs?.type === "call" && uRhs.fn === "chain") {
    const lhsExpanded = expandFoldCallsAST(lhsAst, count);
    const lhsStr = astToExprStr(lhsExpanded);
    const lhsTex = astToEllipsisLatex(lhsAst, varsDb);
    const chainTex = astToEllipsisLatex(uRhs, varsDb);
    const canonicalTex = texOverride || `${lhsTex} = ${chainTex}`;

    const out = [];
    for (let i = 1; i <= count; i++) {
      const termInst = expandFoldCallsAST(instantiateAST(uRhs.arg, i), count);
      out.push(buildInstantiatedEdge(i, `${astToExprStr(termInst)} = ${lhsStr}`, canonicalTex));
    }
    return out;
  }

  // Case 2: Indexed per-element equation outside sum/prod (e.g. delta_i = F_T / k_i)
  const isExplicitIndexed = Boolean(spec.indexed);

  if (isExplicitIndexed) {
    const canonicalTex = texOverride || `${astToEllipsisLatex(lhsAst, varsDb)} = ${astToEllipsisLatex(rhsAst, varsDb)}`;
    const out = [];
    for (let i = 1; i <= count; i++) {
      const lInst = expandFoldCallsAST(instantiateAST(lhsAst, i), count);
      const rInst = expandFoldCallsAST(instantiateAST(rhsAst, i), count);
      out.push(buildInstantiatedEdge(i, `${astToExprStr(lInst)} = ${astToExprStr(rInst)}`, canonicalTex));
    }
    return out;
  }

  // Case 3: Standard or folded (sum/prod) binary equation
  const expandedLhs = expandFoldCallsAST(lhsAst, count);
  const expandedRhs = expandFoldCallsAST(rhsAst, count);
  const baseFormula = `${astToExprStr(expandedLhs)} = ${astToExprStr(expandedRhs)}`;
  const canonicalTex = texOverride || `${astToEllipsisLatex(lhsAst, varsDb)} = ${astToEllipsisLatex(rhsAst, varsDb)}`;

  return [{
    id: idOverride || spec.id,
    masteryId: masteryIdOverride || spec.id,
    name: spec.name,
    canonicalTex,
    baseFormula,
    nodes: extractNodesFromFormula(baseFormula),
    ...(spec.requiredUnits ? { requiredUnits: spec.requiredUnits } : {})
  }];
}

function compileVariantMap(variantsSpec, count, varsDb, spec) {
  if (!variantsSpec) return null;
  const compiled = {};
  for (const [sysKey, vSpec] of Object.entries(variantsSpec)) {
    const fStr = vSpec.formula || vSpec.baseFormula;
    const [res] = compileSingleEquation(
      spec,
      fStr,
      count,
      varsDb,
      spec.id,
      spec.id,
      vSpec.canonicalTex || null
    );
    compiled[sysKey] = {
      canonicalTex: res.canonicalTex,
      baseFormula: res.baseFormula,
      nodes: res.nodes,
      ...(vSpec.requiredUnits ? { requiredUnits: vSpec.requiredUnits } : {})
    };
  }
  return compiled;
}

export function defineRelation(spec, options = {}) {
  const count = options.count ?? spec.count ?? DEFAULT_COUNT;
  const varsDb = options.varsDb || {};
  const rawFormula = spec.formula || spec.baseFormula;

  if (!rawFormula || !rawFormula.includes("=")) {
    throw new Error(`Relation [${spec.id}] missing valid "=" formula`);
  }

  const segments = rawFormula.split("=").map(s => s.trim()).filter(Boolean);
  const compiledVariants = compileVariantMap(spec.variants, count, varsDb, spec);

  // Multi-"=" chain: A = B = C -> distinct binary edges A = B, A = C
  if (segments.length > 2) {
    const chainTex = spec.canonicalTex || segments
      .map(seg => astToEllipsisLatex(parseMathAST(seg), varsDb))
      .join(" = ");

    const out = [];
    for (let j = 1; j < segments.length; j++) {
      const subFormula = `${segments[0]} = ${segments[j]}`;
      const subId = `${spec.id}__${j}`;
      const entries = compileSingleEquation(spec, subFormula, count, varsDb, subId, subId, chainTex);
      entries.forEach(e => {
        if (compiledVariants) e.variants = compiledVariants;
        out.push(e);
      });
    }
    return out;
  }

  const entries = compileSingleEquation(spec, rawFormula, count, varsDb, spec.id, spec.id, spec.canonicalTex || null);
  entries.forEach(e => {
    if (compiledVariants) e.variants = compiledVariants;
  });
  return entries.length === 1 ? entries[0] : entries;
}

export function compileRelations(items = [], options = {}) {
  const flat = [];
  for (const item of items) {
    if (!item) continue;
    if (Array.isArray(item)) {
      flat.push(...compileRelations(item, options));
      continue;
    }
    // Already-compiled concrete relation (e.g. spread from a common/ base file)
    if (item.baseFormula && Array.isArray(item.nodes) && !item.formula) {
      flat.push(item);
      continue;
    }
    const built = defineRelation(item, options);
    if (Array.isArray(built)) flat.push(...built);
    else flat.push(built);
  }
  return Object.freeze(flat);
}

export function expandIndexedVarsDb(templateDb, count = DEFAULT_COUNT) {
  const out = {};
  const replaceIdx = (str, i) => typeof str === "string"
    ? str.replaceAll("{i}", String(i)).replaceAll("_i", `_${i}`)
    : str;

  for (const [key, meta] of Object.entries(templateDb)) {
    if (!key.endsWith("_i")) {
      out[key] = meta;
      continue;
    }
    const stem = key.slice(0, -1); // e.g. "k_"
    for (let i = 1; i <= count; i++) {
      const concreteKey = `${stem}${i}`;
      out[concreteKey] = {
        ...meta,
        name: replaceIdx(meta.name, i),
        symbol: replaceIdx(meta.symbol, i),
        ...(meta.aliases ? { aliases: meta.aliases.map(a => replaceIdx(a, i)) } : {}),
        ...(meta.nameAliases ? { nameAliases: meta.nameAliases.map(a => replaceIdx(a, i)) } : {}),
        ...(meta.symbolAliases ? { symbolAliases: meta.symbolAliases.map(a => replaceIdx(a, i)) } : {})
      };
    }
  }
  return Object.freeze(out);
}
