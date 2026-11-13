/**
 * src/core/relation_builder.js
 * Unified AST-driven relation constructor supporting:
 * - Auto-derived node lists from formula ASTs
 * - Auto-derived canonical LaTeX (optional override)
 * - Multi-'=' equality chains
 * - Indexed per-element templates (_i)
 * - Nestable continued operators: sum(...), prod(...), chain(...)
 */

import { parseMathAST, astToExprStr, getAstIdentifiers } from "../cas/ast.js";
import { RESERVED_MATH_TOKENS } from "../cas/algebra.js";
import { astToLatex } from "../cas/latex.js";

const FOLD_FNS = new Set(["sum", "prod", "chain"]);

function extractNodes(exprStr) {
  const ast = parseMathAST(exprStr);
  if (!ast) return [];
  return Array.from(new Set(getAstIdentifiers(ast).filter(t => !RESERVED_MATH_TOKENS.has(t))));
}

function replaceIndexedIds(node, idx) {
  if (!node) return null;
  if (node.type === "id") {
    if (node.name.endsWith("_i")) {
      return { type: "id", name: `${node.name.slice(0, -2)}_${idx}` };
    }
    return { ...node };
  }
  if (node.type === "group") return { type: "group", expr: replaceIndexedIds(node.expr, idx) };
  if (node.type === "call") return { type: "call", fn: node.fn, arg: replaceIndexedIds(node.arg, idx) };
  if (node.type === "binary") {
    return {
      type: "binary",
      op: node.op,
      left: replaceIndexedIds(node.left, idx),
      right: replaceIndexedIds(node.right, idx)
    };
  }
  return { ...node };
}

function hasFoldCall(node, targetFn = null) {
  if (!node) return false;
  if (node.type === "group") return hasFoldCall(node.expr, targetFn);
  if (node.type === "call") {
    if (FOLD_FNS.has(node.fn) && (!targetFn || node.fn === targetFn)) return true;
    return hasFoldCall(node.arg, targetFn);
  }
  if (node.type === "binary") return hasFoldCall(node.left, targetFn) || hasFoldCall(node.right, targetFn);
  return false;
}

function hasIndexedSuffix(node) {
  if (!node) return false;
  return getAstIdentifiers(node).some(id => id.endsWith("_i"));
}

function expandFoldCallsInAST(node, count) {
  if (!node) return null;
  if (node.type === "group") return { type: "group", expr: expandFoldCallsInAST(node.expr, count) };
  if (node.type === "call") {
    if (node.fn === "sum" || node.fn === "prod") {
      const op = node.fn === "sum" ? "+" : "*";
      const expandedArg = expandFoldCallsInAST(node.arg, count);
      let acc = replaceIndexedIds(expandedArg, 1);
      for (let i = 2; i <= count; i++) {
        const nextTerm = replaceIndexedIds(expandedArg, i);
        const wrapRight = op === "*" && nextTerm.type === "binary" && (nextTerm.op === "+" || nextTerm.op === "-");
        const wrapLeft = i === 2 && op === "*" && acc.type === "binary" && (acc.op === "+" || acc.op === "-");
        acc = {
          type: "binary",
          op,
          left: wrapLeft ? { type: "group", expr: acc } : acc,
          right: wrapRight ? { type: "group", expr: nextTerm } : nextTerm
        };
      }
      return { type: "group", expr: acc };
    }
    return { type: "call", fn: node.fn, arg: expandFoldCallsInAST(node.arg, count) };
  }
  if (node.type === "binary") {
    return {
      type: "binary",
      op: node.op,
      left: expandFoldCallsInAST(node.left, count),
      right: expandFoldCallsInAST(node.right, count)
    };
  }
  return { ...node };
}

function renderFoldExprTex(node, varsDb = {}) {
  if (!node) return "";
  if (node.type === "group") {
    const inner = renderFoldExprTex(node.expr, varsDb);
    return `(${inner})`;
  }
  if (node.type === "call" && FOLD_FNS.has(node.fn)) {
    const t1 = astToLatex(replaceIndexedIds(node.arg, 1), null, varsDb);
    const t2 = astToLatex(replaceIndexedIds(node.arg, 2), null, varsDb);
    const tn = astToLatex(replaceIndexedIds(node.arg, "n"), null, varsDb);
    if (node.fn === "sum") return `${t1} + ${t2} + \\dots + ${tn}`;
    if (node.fn === "prod") return `${t1} \\cdot ${t2} \\cdots ${tn}`;
    if (node.fn === "chain") return `${t1} = ${t2} = \\dots = ${tn}`;
  }
  if (node.type === "binary") {
    if (node.op === "/") {
      return `\\cfrac{${renderFoldExprTex(node.left, varsDb)}}{${renderFoldExprTex(node.right, varsDb)}}`;
    }
    if (node.op === "*") {
      return `${renderFoldExprTex(node.left, varsDb)} \\, ${renderFoldExprTex(node.right, varsDb)}`;
    }
    if (node.op === "+" || node.op === "-") {
      return `${renderFoldExprTex(node.left, varsDb)} ${node.op} ${renderFoldExprTex(node.right, varsDb)}`;
    }
    if (node.op === "^") {
      return `{${renderFoldExprTex(node.left, varsDb)}}^{${renderFoldExprTex(node.right, varsDb)}}`;
    }
  }
  return astToLatex(node, null, varsDb);
}

function buildCanonicalTexFromParts(parts, varsDb = {}) {
  return parts.map(p => renderFoldExprTex(parseMathAST(p), varsDb)).join(" = ");
}

function compileSingleVariant(formula, varsDb, count) {
  const astLhsRhs = formula.split("=").map(s => s.trim());
  const lhsAst = parseMathAST(astLhsRhs[0]);
  const rhsAst = parseMathAST(astLhsRhs[1]);
  const expLhs = astToExprStr(expandFoldCallsInAST(lhsAst, count));
  const expRhs = astToExprStr(expandFoldCallsInAST(rhsAst, count));
  const baseFormula = `${expLhs} = ${expRhs}`;
  const nodes = Array.from(new Set([...extractNodes(expLhs), ...extractNodes(expRhs)]));
  return { baseFormula, nodes, canonicalTex: buildCanonicalTexFromParts(astLhsRhs, varsDb) };
}

export function defineRelation(spec) {
  return Object.freeze({ ...spec, _isRelationSpec: true });
}

export function instantiateRelation(specOrRel, { varsDb = {}, count = 3 } = {}) {
  if (!specOrRel || !specOrRel._isRelationSpec) return [specOrRel];

  const {
    id,
    name,
    formula,
    baseFormula,
    canonicalTex,
    requiredUnits = null,
    variants = null,
    masteryId = null
  } = specOrRel;

  const rawFormula = formula || baseFormula;

  if (variants) {
    const compiledVariants = {};
    for (const [sysKey, vSpec] of Object.entries(variants)) {
      const vFormula = vSpec.formula || vSpec.baseFormula;
      const compiled = compileSingleVariant(vFormula, varsDb, count);
      compiledVariants[sysKey] = {
        canonicalTex: vSpec.canonicalTex || compiled.canonicalTex,
        baseFormula: compiled.baseFormula,
        nodes: compiled.nodes,
        ...(vSpec.requiredUnits ? { requiredUnits: vSpec.requiredUnits } : {})
      };
    }
    const defVar = compiledVariants.SI || compiledVariants.US || Object.values(compiledVariants)[0];
    return [Object.freeze({
      id,
      masteryId: masteryId || id,
      name,
      variants: compiledVariants,
      canonicalTex: canonicalTex || defVar.canonicalTex,
      baseFormula: defVar.baseFormula,
      nodes: defVar.nodes,
      ...(requiredUnits || defVar.requiredUnits ? { requiredUnits: requiredUnits || defVar.requiredUnits } : {})
    })];
  }

  const segments = rawFormula.split("=").map(s => s.trim()).filter(Boolean);
  if (segments.length < 2) return [];

  const fullChainTex = canonicalTex || buildCanonicalTexFromParts(segments, varsDb);
  const anchorExpr = segments[0];
  const results = [];

  for (let sIdx = 1; sIdx < segments.length; sIdx++) {
    const segExpr = segments[sIdx];
    const segId = segments.length > 2 ? `${id}__${sIdx}` : id;
    const segMasteryId = masteryId || segId;
    const segTex = canonicalTex || buildCanonicalTexFromParts([anchorExpr, segExpr], varsDb);

    const anchorAst = parseMathAST(anchorExpr);
    const segAst = parseMathAST(segExpr);

    if (segAst && segAst.type === "call" && segAst.fn === "chain") {
      const expAnchor = astToExprStr(expandFoldCallsInAST(anchorAst, count));
      for (let i = 1; i <= count; i++) {
        const termAst = replaceIndexedIds(segAst.arg, i);
        const termStr = astToExprStr(termAst);
        const bf = `${termStr} = ${expAnchor}`;
        results.push(Object.freeze({
          id: `${segId}__${i}`,
          masteryId: segMasteryId,
          name,
          canonicalTex: fullChainTex,
          baseFormula: bf,
          nodes: Array.from(new Set([...extractNodes(termStr), ...extractNodes(expAnchor)])),
          ...(requiredUnits ? { requiredUnits } : {})
        }));
      }
      continue;
    }

    const usesIndexed =
      (hasIndexedSuffix(anchorAst) && !hasFoldCall(anchorAst)) ||
      (hasIndexedSuffix(segAst) && !hasFoldCall(segAst));

    if (usesIndexed && !hasFoldCall(anchorAst, "sum") && !hasFoldCall(segAst, "sum") &&
        !hasFoldCall(anchorAst, "prod") && !hasFoldCall(segAst, "prod")) {
      for (let i = 1; i <= count; i++) {
        const lhsI = astToExprStr(replaceIndexedIds(anchorAst, i));
        const rhsI = astToExprStr(replaceIndexedIds(segAst, i));
        const bf = `${lhsI} = ${rhsI}`;
        results.push(Object.freeze({
          id: `${segId}__${i}`,
          masteryId: segMasteryId,
          name,
          canonicalTex: segTex,
          baseFormula: bf,
          nodes: Array.from(new Set([...extractNodes(lhsI), ...extractNodes(rhsI)])),
          ...(requiredUnits ? { requiredUnits } : {})
        }));
      }
      continue;
    }

    const expLhs = astToExprStr(expandFoldCallsInAST(anchorAst, count));
    const expRhs = astToExprStr(expandFoldCallsInAST(segAst, count));
    const bf = `${expLhs} = ${expRhs}`;
    results.push(Object.freeze({
      id: segId,
      masteryId: segMasteryId,
      name,
      canonicalTex: segTex,
      baseFormula: bf,
      nodes: Array.from(new Set([...extractNodes(expLhs), ...extractNodes(expRhs)])),
      ...(requiredUnits ? { requiredUnits } : {})
    }));
  }

  return results;
}

export function compileRelations(items = [], options = {}) {
  const flat = [];
  for (const item of items) {
    if (!item) continue;
    if (Array.isArray(item)) {
      flat.push(...compileRelations(item, options));
    } else if (item._isRelationSpec) {
      flat.push(...instantiateRelation(item, options));
    } else {
      flat.push(item);
    }
  }
  return Object.freeze(flat);
}

export function expandIndexedVarsDb(staticVars = {}, indexedTemplates = {}, count = 3) {
  const db = { ...staticVars };
  for (let i = 1; i <= count; i++) {
    for (const [tmplKey, meta] of Object.entries(indexedTemplates)) {
      const key = tmplKey.endsWith("_i") ? `${tmplKey.slice(0, -2)}_${i}` : `${tmplKey}_${i}`;
      const replaceIdx = str => typeof str === "string"
        ? str.replace(/\{i\}/g, String(i)).replace(/_i\b/g, `_${i}`)
        : str;

      db[key] = {
        ...meta,
        name: replaceIdx(meta.name),
        symbol: replaceIdx(meta.symbol),
        ...(meta.aliases ? { aliases: meta.aliases.map(replaceIdx) } : {}),
        ...(meta.nameAliases ? { nameAliases: meta.nameAliases.map(replaceIdx) } : {}),
        ...(meta.symbolAliases ? { symbolAliases: meta.symbolAliases.map(replaceIdx) } : {})
      };
    }
  }
  return Object.freeze(db);
}
