/**
 * src/cas/units/analysis.js
 * AST-Driven Unit Analysis, In-Situ Conversion, and Factor-Label Markup Engine.
 */

import { parseMathAST, evalAST, getAstIdentifiers } from "../ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../algebra.js";
import { DIMENSIONS } from "../../core/dimensions.js";
import {
  parseUnitToSemanticAST,
  BASE_UNITS,
  getUnitAtomBag,
  isDimEqual,
  unitToTex,
  unitToCancelledTex,
  getUnitOffset,
  getUnitKind,
  toDeltaUnit,
  valueToCoherentBase,
  formatValueInUnit
} from "./definitions.js";
import {
  fmtScale,
  formatPairConversion,
  formatComponentMismatch,
  isCanonicalScaleFactor,
  buildCompoundTokenConversions
} from "./scales.js";

function getFormulaFractionDepth(node, targetName, currentDepth = 0) {
  if (!node) return null;
  if (node.type === "id" && node.name === targetName) return currentDepth;
  if (node.type === "group") return getFormulaFractionDepth(node.expr, targetName, currentDepth);
  if (node.type === "call") return getFormulaFractionDepth(node.arg, targetName, currentDepth);
  if (node.type === "binary") {
    const nextDepth = currentDepth + (node.op === "/" ? 1 : 0);
    const l = getFormulaFractionDepth(node.left, targetName, nextDepth);
    if (l !== null) return l;
    return getFormulaFractionDepth(node.right, targetName, nextDepth);
  }
  return null;
}

function isUnaryMinusNode(n) {
  return !!(n && n.type === "binary" && n.op === "-" && n.left?.type === "num" && n.left.val === "0");
}

function astHasNonReservedVar(n) {
  return getAstIdentifiers(n).some(t => !isReservedMathToken(t));
}

function isPureThDim(d = {}) {
  const keys = Object.keys(d);
  return keys.length === 1 && d.Th === 1;
}

function combineDimMaps(a = {}, b = {}, sign = 1) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const next = (out[k] || 0) + sign * v;
    if (Math.abs(next) < 1e-9) delete out[k];
    else out[k] = next;
  }
  return out;
}

function scaleDimMapLocal(d = {}, p = 1) {
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    const next = v * p;
    if (Math.abs(next) >= 1e-9) out[k] = next;
  }
  return out;
}

/**
 * Pure AST temperature typing pass: distinguishes affine points (P), temperature
 * differences (L = P - P or Δ units), and expressions requiring absolute frames (abs).
 */
export function analyzeTempAST(node, unitOfKey, varsDb = {}) {
  const empty = () => ({ dimMap: {}, tempState: "none", hasAbs: false, liftTokens: new Set(), pointTokens: new Set() });

  function walk(n) {
    if (!n) return empty();
    if (n.type === "num") return empty();
    if (n.type === "group") return walk(n.expr);

    if (n.type === "id") {
      if (isReservedMathToken(n.name)) return empty();
      const cKey = resolveCanonicalKey(n.name, varsDb);
      const meta = varsDb[cKey] || varsDb[n.name] || {};
      const uName = unitOfKey(n.name) || unitOfKey(cKey) || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio") return empty();
      const bag = getUnitAtomBag(uName, meta.dimension);
      if (bag.kind === "point") {
        return { dimMap: bag.dimMap, tempState: "point", hasAbs: false, liftTokens: new Set(), pointTokens: new Set([n.name]) };
      }
      if (bag.kind === "delta") {
        return { dimMap: bag.dimMap, tempState: "delta", hasAbs: false, liftTokens: new Set(), pointTokens: new Set() };
      }
      return { dimMap: bag.dimMap, tempState: "none", hasAbs: false, liftTokens: new Set(), pointTokens: new Set() };
    }

    if (n.type === "call") {
      const A = walk(n.arg);
      const liftTokens = new Set(A.liftTokens);
      if (A.tempState === "point") A.pointTokens.forEach(t => liftTokens.add(t));
      return {
        dimMap: {},
        tempState: "none",
        hasAbs: A.hasAbs || A.tempState === "point" || A.tempState === "abs",
        liftTokens,
        pointTokens: new Set()
      };
    }

    if (n.type === "binary") {
      const L = walk(n.left);
      const R = walk(n.right);
      const liftTokens = new Set([...L.liftTokens, ...R.liftTokens]);

      if (n.op === "+" || n.op === "-") {
        const hasAbs = L.hasAbs || R.hasAbs;
        if (L.tempState === "point" && R.tempState === "point") {
          if (n.op === "-") {
            return {
              dimMap: L.dimMap,
              tempState: "delta",
              hasAbs,
              liftTokens,
              pointTokens: new Set([...L.pointTokens, ...R.pointTokens])
            };
          }
          L.pointTokens.forEach(t => liftTokens.add(t));
          R.pointTokens.forEach(t => liftTokens.add(t));
          return { dimMap: L.dimMap, tempState: "abs", hasAbs: true, liftTokens, pointTokens: new Set() };
        }
        if (L.tempState === "point" && R.tempState === "delta") {
          return { dimMap: L.dimMap, tempState: "point", hasAbs, liftTokens, pointTokens: new Set([...L.pointTokens, ...R.pointTokens]) };
        }
        if (L.tempState === "delta" && R.tempState === "point") {
          if (n.op === "+") {
            return { dimMap: R.dimMap, tempState: "point", hasAbs, liftTokens, pointTokens: new Set([...L.pointTokens, ...R.pointTokens]) };
          }
          R.pointTokens.forEach(t => liftTokens.add(t));
          return { dimMap: R.dimMap, tempState: "abs", hasAbs: true, liftTokens, pointTokens: new Set() };
        }
        if (L.tempState === "delta" && R.tempState === "delta") {
          return { dimMap: L.dimMap, tempState: "delta", hasAbs, liftTokens, pointTokens: new Set([...L.pointTokens, ...R.pointTokens]) };
        }
        if (L.tempState === "abs" || R.tempState === "abs") {
          if (L.tempState === "point") L.pointTokens.forEach(t => liftTokens.add(t));
          if (R.tempState === "point") R.pointTokens.forEach(t => liftTokens.add(t));
          const outDim = isPureThDim(L.dimMap) ? L.dimMap : R.dimMap;
          return { dimMap: outDim, tempState: "abs", hasAbs: true, liftTokens, pointTokens: new Set() };
        }
        let lifted = false;
        if (L.tempState === "point") { L.pointTokens.forEach(t => liftTokens.add(t)); lifted = true; }
        if (R.tempState === "point") { R.pointTokens.forEach(t => liftTokens.add(t)); lifted = true; }
        const outDim = Object.keys(L.dimMap).length ? L.dimMap : R.dimMap;
        const tempState = lifted ? "abs" : (L.tempState === "delta" || R.tempState === "delta" ? "delta" : "none");
        return { dimMap: outDim, tempState, hasAbs: hasAbs || lifted, liftTokens, pointTokens: new Set() };
      }

      if (n.op === "*" || n.op === "/") {
        if (L.tempState === "point") L.pointTokens.forEach(t => liftTokens.add(t));
        if (R.tempState === "point") R.pointTokens.forEach(t => liftTokens.add(t));
        const hasAbs = L.hasAbs || R.hasAbs || L.tempState === "point" || R.tempState === "point" || L.tempState === "abs" || R.tempState === "abs";
        const dimMap = combineDimMaps(L.dimMap, R.dimMap, n.op === "*" ? 1 : -1);
        const tempState = isPureThDim(dimMap) ? (hasAbs ? "abs" : "delta") : "none";
        return { dimMap, tempState, hasAbs, liftTokens, pointTokens: new Set([...L.pointTokens, ...R.pointTokens]) };
      }

      if (n.op === "^") {
        if (L.tempState === "point") L.pointTokens.forEach(t => liftTokens.add(t));
        if (R.tempState === "point") R.pointTokens.forEach(t => liftTokens.add(t));
        const hasAbs = L.hasAbs || R.hasAbs || L.tempState === "point" || R.tempState === "point";
        const p = evalAST(n.right, {});
        const dimMap = Number.isFinite(p) ? scaleDimMapLocal(L.dimMap, p) : {};
        const tempState = isPureThDim(dimMap) ? (hasAbs ? "abs" : "delta") : "none";
        return { dimMap, tempState, hasAbs, liftTokens, pointTokens: new Set(L.pointTokens) };
      }
    }

    return empty();
  }

  return walk(node);
}

export function solveUnitAlgebra(
  exprOrAST,
  S,
  targetVar,
  targetUnit,
  varsDb = {},
  requiredUnits = null,
  forceInSitu = false,
  cancelTokenDims = null
) {
  const ast = typeof exprOrAST === "string" ? parseMathAST(exprOrAST) : exprOrAST;
  const tokenMarkup = {};
  // Tokens outside a branch's exponent map get plain markup only as a placeholder;
  // a sibling-term analysis is authoritative for them (see mergeSubAnalysis).
  const placeholderMarkup = new Set();
  const tokenConversions = {};
  const preConversions = [];
  const conversionScalars = [];
  let globalConversionTex = "";
  let numericConversionFactor = 1.0;

  // 1. Empirical relations with requiredUnits contracts
  if (requiredUnits && typeof requiredUnits === "object") {
    const varTokens = Array.from(new Set(getAstIdentifiers(ast).filter(t => !isReservedMathToken(t))));
    varTokens.forEach(tok => {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const reqU = requiredUnits[cKey] || requiredUnits[tok];
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const currU = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      const effectiveU = reqU || currU;
      if (effectiveU && getUnitAtomBag(effectiveU, meta.dimension).dimMap?.Ang === 1) {
        tokenMarkup[tok] = unitToTex(effectiveU, false, meta.dimension);
      }
      if (!reqU) return;

      if (currU && reqU && currU !== reqU) {
        const currBag = getUnitAtomBag(currU, meta.dimension);
        const reqBag = getUnitAtomBag(reqU, meta.dimension);
        if (currBag.scale && reqBag.scale) {
          const rawVal = S[cKey] !== undefined ? S[cKey] : S[tok];
          const convertedVal = formatValueInUnit(
            valueToCoherentBase(rawVal, currU, meta.dimension),
            reqU,
            meta.dimension
          );
          preConversions.push({
            token: tok, canonicalKey: cKey, fromUnit: currU, toUnit: reqU,
            rawVal, convertedVal
          });
        }
      }
    });

    const cTarget = resolveCanonicalKey(targetVar, varsDb);
    const reqTargetU = requiredUnits[cTarget] || requiredUnits[targetVar];
    if (reqTargetU && targetUnit && reqTargetU !== targetUnit) {
      const targetMeta = varsDb[cTarget] || varsDb[targetVar] || {};
      const reqBag = getUnitAtomBag(reqTargetU, targetMeta.dimension);
      const targetBag = getUnitAtomBag(targetUnit, targetMeta.dimension);
      const hasTargetOffset = (reqBag.offset !== 0 || targetBag.offset !== 0);

      if (reqBag.scale && targetBag.scale && !hasTargetOffset) {
        numericConversionFactor = reqBag.scale / targetBag.scale;
        if (Math.abs(numericConversionFactor - 1) > 1e-12) {
          const ratio = numericConversionFactor;
          if (ratio < 1) {
            globalConversionTex = ` \\cdot \\left[\\cfrac{${unitToTex(targetUnit)}}{${fmtScale(1 / ratio, true)}\\,${unitToTex(reqTargetU)}}\\right]`;
          } else {
            globalConversionTex = ` \\cdot \\left[\\cfrac{${fmtScale(ratio, true)}\\,${unitToTex(targetUnit)}}{${unitToTex(reqTargetU)}}\\right]`;
          }
        }
      }
    }
    return { tokenMarkup, conversionFactors: [], conversionFactorTex: "", numericConversionFactor, globalConversionTex, preConversions, tokenConversions, conversionScalars };
  }

  // 2. Pure Physics: Recursive Additive-Branch + Multiplicative AST Analysis
  const cTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetDim = (varsDb[cTarget] || varsDb[targetVar] || {}).dimension || null;

  function hasTopAdditive(node) {
    if (!node) return false;
    if (node.type === "group") return hasTopAdditive(node.expr);
    return node.type === "binary" && (node.op === "+" || node.op === "-");
  }

  function collectAdditiveBranches(node) {
    if (!node) return [];
    if (node.type === "group") return collectAdditiveBranches(node.expr);
    if (isUnaryMinusNode(node)) {
      const sub = collectAdditiveBranches(node.right);
      if (sub.length > 1) return sub.map(b => ({ type: "binary", op: "-", left: { type: "num", val: "0" }, right: b }));
      return [node];
    }
    if (node.type === "call" && node.fn === "sqrt") {
      const sub = collectAdditiveBranches(node.arg);
      if (sub.length > 1) return sub.map(b => ({ type: "call", fn: "sqrt", arg: b }));
      return [node];
    }
    if (node.type === "binary" && node.op === "^") {
      const sub = collectAdditiveBranches(node.left);
      if (sub.length > 1) return sub.map(b => ({ type: "binary", op: "^", left: b, right: node.right }));
      return [node];
    }
    if (node.type === "binary" && node.op === "*") {
      if (!astHasNonReservedVar(node.right)) {
        const sub = collectAdditiveBranches(node.left);
        if (sub.length > 1) return sub.map(b => ({ type: "binary", op: "*", left: b, right: node.right }));
      } else if (!astHasNonReservedVar(node.left)) {
        const sub = collectAdditiveBranches(node.right);
        if (sub.length > 1) return sub.map(b => ({ type: "binary", op: "*", left: node.left, right: b }));
      }
      return [node];
    }
    if (node.type === "binary" && node.op === "/" && !astHasNonReservedVar(node.right)) {
      const sub = collectAdditiveBranches(node.left);
      if (sub.length > 1) return sub.map(b => ({ type: "binary", op: "/", left: b, right: node.right }));
      return [node];
    }
    if (node.type === "binary" && (node.op === "+" || node.op === "-")) {
      return [...collectAdditiveBranches(node.left), ...collectAdditiveBranches(node.right)];
    }
    return [node];
  }

  function isTokenInAdditiveSubtree(node, targetTok, insideAdd = false) {
    if (!node) return false;
    if (node.type === "id") return insideAdd && node.name === targetTok;
    if (node.type === "group") return isTokenInAdditiveSubtree(node.expr, targetTok, insideAdd);
    if (node.type === "call") return isTokenInAdditiveSubtree(node.arg, targetTok, insideAdd);
    if (node.type === "binary") {
      const nextAdd = insideAdd || node.op === "+" || node.op === "-";
      return isTokenInAdditiveSubtree(node.left, targetTok, nextAdd) ||
        isTokenInAdditiveSubtree(node.right, targetTok, nextAdd);
    }
    return false;
  }

  const branches = collectAdditiveBranches(ast);
  const isMultiBranch = branches.length > 1;

  // A dimensionless physical ratio projected into a percentage target must
  // acquire the target unit's scale. Percentage is intentionally distinct
  // from ordinary dimensionless units in the semantic unit registry.
  function isDimensionlessBranch(branchAst) {
    const exps = collectTokenExponents(branchAst);
    const dimensions = {};

    for (const [tok, exp] of Object.entries(exps)) {
      const cKey = resolveCanonicalKey(tok, varsDb);
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio") continue;

      const dimMap = getUnitAtomBag(uName, meta.dimension).dimMap || {};
      for (const [dim, power] of Object.entries(dimMap)) {
        dimensions[dim] = (dimensions[dim] || 0) + power * exp;
      }
    }

    return Object.values(dimensions).every(power => Math.abs(power) < 1e-9);
  }

  for (const branchAst of branches) {
    const branchTokens = Array.from(new Set(getAstIdentifiers(branchAst).filter(t => !isReservedMathToken(t))));
    const exps = collectTokenExponents(branchAst);

    const tokenBags = {};
    for (const tok of branchTokens) {
      if (exps[tok] === undefined) continue;
      const cKey = resolveCanonicalKey(tok, varsDb);
      const meta = varsDb[cKey] || varsDb[tok] || {};
      const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
      if (!uName || uName === "dimless" || uName === "ratio" || uName === "%" || uName === "\\%") continue;
      tokenBags[tok] = { uName, dim: meta.dimension, exp: exps[tok], bag: getUnitAtomBag(uName, meta.dimension) };
    }

    const hasExplicitTarget = !!(targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio");
    let effectiveBranchTarget = targetUnit;
    if (hasExplicitTarget && isMultiBranch && getUnitKind(targetUnit, targetDim) === "point") {
      const branchTemp = analyzeTempAST(branchAst, k => {
        const cK = resolveCanonicalKey(k, varsDb);
        const m = varsDb[cK] || varsDb[k] || {};
        return S._u?.[cK] || S._u?.[k] || m.unit || "";
      }, varsDb);
      if (branchTemp.tempState === "delta") {
        effectiveBranchTarget = toDeltaUnit(targetUnit);
      }
    }
    const branchTargetBag = hasExplicitTarget
      ? getUnitAtomBag(effectiveBranchTarget, targetDim)
      : null;

    const pairedInSectionC = new Set();
    const fullyCancelledTokens = new Set();
    const cancelTokSet = new Set();
    if (Array.isArray(cancelTokenDims) && cancelTokenDims.length > 0) {
      for (const [tok, info] of Object.entries(tokenBags)) {
        if (cancelTokenDims.some(d => isDimEqual(info.bag.dimMap, d))) {
          cancelTokSet.add(tok);
        }
      }
    }
    const resolvedUnitByTok = {};

    const findCounterpart = (tok, sameAdditiveOnly = false) => {
      const myInfo = tokenBags[tok];
      if (!myInfo || myInfo.exp === 0) return null;
      const myInAdd = isTokenInAdditiveSubtree(branchAst, tok);
      let fallback = null;
      for (const [otherTok, otherInfo] of Object.entries(tokenBags)) {
        if (
          otherTok === tok ||
          pairedInSectionC.has(otherTok) ||
          otherInfo.exp !== -myInfo.exp ||
          !isDimEqual(myInfo.bag.dimMap, otherInfo.bag.dimMap) ||
          (sameAdditiveOnly && isTokenInAdditiveSubtree(branchAst, otherTok) !== myInAdd)
        ) {
          continue;
        }
        const ratio = myInfo.bag.scale / otherInfo.bag.scale;
        if (Math.abs(ratio - 1) < 1e-6) {
          return { tok: otherTok, uName: otherInfo.uName, dim: otherInfo.dim };
        }
        if (!fallback) {
          fallback = { tok: otherTok, uName: otherInfo.uName, dim: otherInfo.dim };
        }
      }
      return fallback;
    };

    // Pass 1: Non-dimensional markers, Section B (affine temp), and Section C (1:1 counterpart bijection)
    // Match tokens sharing an additive scope first so inner dimensionless ratios cancel internally before outer tokens.
    for (const sameAdditiveOnly of [true, false]) {
      for (const tok of branchTokens) {
        const cKey = resolveCanonicalKey(tok, varsDb);
        const meta = varsDb[cKey] || varsDb[tok] || {};
        const uName = S._u?.[cKey] || S._u?.[tok] || meta.unit || "";
        if (!uName || uName === "dimless" || uName === "ratio") continue;

        const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
        const useInlineUnit = fDepth >= 2;

        if (uName === "%" || uName === "\\%" || exps[tok] === undefined) {
          if (sameAdditiveOnly) {
            tokenMarkup[tok] = unitToTex(uName, useInlineUnit, meta.dimension);
            if (exps[tok] === undefined && uName !== "%" && uName !== "\\%") placeholderMarkup.add(tok);
          }
          continue;
        }

        if (pairedInSectionC.has(tok)) continue;

        const counterpart = findCounterpart(tok, sameAdditiveOnly);

        // C. Counterpart with Matching Dimension Vector
        if (counterpart) {
        const bagCurrent = getUnitAtomBag(uName, meta.dimension);
        const bagTarget = getUnitAtomBag(counterpart.uName, counterpart.dim);
        const scaleRatio = bagCurrent.scale / bagTarget.scale;
        const otherDepth = getFormulaFractionDepth(branchAst, counterpart.tok) || 0;
        const otherInline = otherDepth >= 2;

        pairedInSectionC.add(tok);
        pairedInSectionC.add(counterpart.tok);
        fullyCancelledTokens.add(tok);
        fullyCancelledTokens.add(counterpart.tok);

        if (Math.abs(scaleRatio - 1) < 1e-6) {
          tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, "whole");
          tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherInline, counterpart.dim, "whole");
          resolvedUnitByTok[tok] = uName;
          resolvedUnitByTok[counterpart.tok] = counterpart.uName;
          continue;
        }

        if (isDimEqual(bagCurrent.dimMap, bagTarget.dimMap)) {
          const mismatch = formatComponentMismatch(uName, counterpart.uName, meta.dimension, counterpart.dim);
          const cancelMode = mismatch.isComponentBijection ? "component" : "whole";
          tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, cancelMode);
          tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherInline, counterpart.dim, cancelMode);

          const mTex = useInlineUnit ? mismatch.tex.replaceAll("\\cfrac", "\\tfrac") : mismatch.tex;
          const mScalars = mismatch.scalars || (mismatch.scalar !== null ? [mismatch.scalar] : []);

          if (fDepth <= 1 || forceInSitu) {
            if (!tokenConversions[tok] && !tokenConversions[counterpart.tok]?.length) {
              tokenConversions[tok] = [mTex];
              conversionScalars.push(...mScalars);
              resolvedUnitByTok[tok] = counterpart.uName;
              resolvedUnitByTok[counterpart.tok] = counterpart.uName;
            } else {
              resolvedUnitByTok[tok] = uName;
              resolvedUnitByTok[counterpart.tok] = counterpart.uName;
            }
          } else if (otherDepth <= 1) {
            const revMismatch = formatComponentMismatch(counterpart.uName, uName, counterpart.dim, meta.dimension);
            const revMode = revMismatch.isComponentBijection ? "component" : "whole";
            tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, meta.dimension, revMode);
            tokenMarkup[counterpart.tok] = unitToCancelledTex(counterpart.uName, otherInline, counterpart.dim, revMode);
            const revTex = otherInline ? revMismatch.tex.replaceAll("\\cfrac", "\\tfrac") : revMismatch.tex;
            const revScalars = revMismatch.scalars || (revMismatch.scalar !== null ? [revMismatch.scalar] : []);
            tokenConversions[counterpart.tok] = [revTex];
            conversionScalars.push(...revScalars);
            resolvedUnitByTok[tok] = uName;
            resolvedUnitByTok[counterpart.tok] = uName;
          } else if (!isMultiBranch && !globalConversionTex && exps[tok] === 1 && !isTokenInAdditiveSubtree(branchAst, tok)) {
            globalConversionTex = mismatch.tex;
            conversionScalars.push(...mScalars);
            resolvedUnitByTok[tok] = counterpart.uName;
            resolvedUnitByTok[counterpart.tok] = counterpart.uName;
          } else {
            tokenConversions[tok] = [mTex];
            conversionScalars.push(...mScalars);
            resolvedUnitByTok[tok] = counterpart.uName;
            resolvedUnitByTok[counterpart.tok] = counterpart.uName;
          }
          continue;
        }
      }
      }
    }

    // Pass 2: Section D — Target Unit Scaling over remaining unpaired tokens
    const remainingTokens = branchTokens.filter(tok => tokenBags[tok] && !pairedInSectionC.has(tok));
    if (remainingTokens.length > 0) {
      let effectiveDTarget = effectiveBranchTarget;
      let effectiveDBag = branchTargetBag;
      if (hasExplicitTarget && remainingTokens.length === 1 && !cancelTokSet.has(remainingTokens[0])) {
        const onlyInfo = tokenBags[remainingTokens[0]];
        if (Math.abs(onlyInfo.exp) > 1 && isDimEqual(scaleDimMapLocal(onlyInfo.bag.dimMap, onlyInfo.exp), branchTargetBag.dimMap)) {
          const targetAst = parseUnitToSemanticAST(effectiveBranchTarget, targetDim);
          if (targetAst.length > 0 && targetAst.every(f => Math.abs(f.power / onlyInfo.exp - Math.round(f.power / onlyInfo.exp)) < 1e-6)) {
            const pSym = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
            const nParts = [];
            const dParts = [];
            for (const f of targetAst) {
              const np = Math.round(f.power / onlyInfo.exp);
              if (np === 0) continue;
              const str = `${f.prefix ? (pSym[f.prefix] || f.prefix) : ""}${BASE_UNITS[f.base]?.symbol || f.base}`;
              const part = Math.abs(np) === 1 ? str : `${str}^${Math.abs(np)}`;
              (np > 0 ? nParts : dParts).push(part);
            }
            const rootU = dParts.length ? `${nParts.join("*") || "1"}/(${dParts.join("*")})` : (nParts.join("*") || "dimless");
            const rootBag = getUnitAtomBag(rootU, onlyInfo.dim);
            if (!rootBag.isUnknown && isDimEqual(onlyInfo.bag.dimMap, rootBag.dimMap)) {
              effectiveDTarget = rootU;
              effectiveDBag = rootBag;
            }
          }
        }
      }

      const isSingleDimRemaining = !!effectiveDBag
        && remainingTokens.every(tok => isDimEqual(tokenBags[tok].bag.dimMap, effectiveDBag.dimMap));

      // The pairwise shortcut is valid only when every token converts by registered ratios.
      // Atom-soup targets (e.g. kg*m*m/(h*h^2)) and outer-cancelled sibling terms route to compound builder.
      const pairwiseIsCanonical = hasExplicitTarget && isSingleDimRemaining
        && remainingTokens.every(tok => {
          if (cancelTokSet.has(tok)) return false;
          const { uName, dim } = tokenBags[tok];
          return formatPairConversion(uName, effectiveDTarget, dim, targetDim, "whole").scalars.every(isCanonicalScaleFactor);
        });

      if (pairwiseIsCanonical) {
        const mismatchingCount = remainingTokens.filter(tok =>
          Math.abs(tokenBags[tok].bag.scale / effectiveDBag.scale - 1) >= 1e-6
        ).length;

        for (const tok of remainingTokens) {
          const { uName, dim: tokDim, exp: tokExp } = tokenBags[tok];
          const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
          const useInlineUnit = fDepth >= 2;
          const inAdditive = forceInSitu || isMultiBranch || isTokenInAdditiveSubtree(branchAst, tok);
          const conv = formatPairConversion(uName, effectiveDTarget, tokDim, targetDim, "whole");

          if (!conv.tex) {
            tokenMarkup[tok] = unitToTex(uName, useInlineUnit, tokDim);
            resolvedUnitByTok[tok] = uName;
          } else {
            const cancelTarget = conv.cancelledIndices || (conv.isDecomposed ? "component" : "whole");
            tokenMarkup[tok] = unitToCancelledTex(uName, useInlineUnit, tokDim, cancelTarget);
            const convTex = useInlineUnit ? conv.tex.replaceAll("\\cfrac", "\\tfrac") : conv.tex;
            const convScalars = conv.scalars || (conv.scalar !== null ? [conv.scalar] : []);

            if (cancelTarget === "whole" || (cancelTarget instanceof Set && cancelTarget.size === parseUnitToSemanticAST(uName, tokDim).length)) {
              fullyCancelledTokens.add(tok);
            }

            if (!inAdditive && !globalConversionTex && tokExp === 1 && mismatchingCount === 1 && fDepth <= 1) {
              globalConversionTex = convTex;
              conversionScalars.push(...convScalars);
              resolvedUnitByTok[tok] = effectiveDTarget;
            } else {
              tokenConversions[tok] = [convTex];
              conversionScalars.push(...convScalars);
              resolvedUnitByTok[tok] = effectiveDTarget;
            }
          }
        }
      } else {
        const entries = remainingTokens.map(tok => ({
          tok,
          uName: tokenBags[tok].uName,
          dim: tokenBags[tok].dim,
          exp: tokenBags[tok].exp
        }));
        const compoundTarget = (targetDim === DIMENSIONS.PERCENTAGE && isDimensionlessBranch(branchAst))
          ? "dimless"
          : (effectiveBranchTarget || "dimless");
        const compoundDim = compoundTarget === "dimless" ? null : targetDim;
        const { conversionsByToken, scalars, cancelledIndicesByToken, globalConvTex, resolvedUnitsByToken } =
          buildCompoundTokenConversions(entries, compoundTarget, compoundDim, cancelTokSet);

        for (const [k, convList] of Object.entries(conversionsByToken)) {
          const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
          tokenConversions[k] = kDepth >= 2
            ? convList.map(c => c.replaceAll("\\cfrac", "\\tfrac"))
            : convList;
        }
        for (const [k, idxSet] of Object.entries(cancelledIndicesByToken || {})) {
          if (tokenMarkup[k] !== undefined) continue;
          const kCanon = resolveCanonicalKey(k, varsDb);
          const kMeta = varsDb[kCanon] || varsDb[k] || {};
          const kU = S._u?.[kCanon] || S._u?.[k] || kMeta.unit || "";
          const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
          const kAst = parseUnitToSemanticAST(kU, kMeta.dimension);
          const hasConvs = (tokenConversions[k] || []).length > 0;
          if (kAst.length > 0 && idxSet.size === kAst.length) {
            fullyCancelledTokens.add(k);
          }
          const mode = (!hasConvs && kAst.length > 0 && idxSet.size === kAst.length) ? "whole" : idxSet;
          tokenMarkup[k] = unitToCancelledTex(kU, kDepth >= 2, kMeta.dimension, mode);
        }
        Object.assign(resolvedUnitByTok, resolvedUnitsByToken || {});
        if (globalConvTex) {
          const anyInAdd = entries.some(e => isTokenInAdditiveSubtree(branchAst, e.tok));
          if (forceInSitu || isMultiBranch || anyInAdd) {
            const attachTok = entries.find(e => e.exp === 1)?.tok;
            if (attachTok) {
              if (!tokenConversions[attachTok]) tokenConversions[attachTok] = [];
              const aDepth = getFormulaFractionDepth(branchAst, attachTok) || 0;
              tokenConversions[attachTok].push(aDepth >= 2 ? globalConvTex.replaceAll("\\cfrac", "\\tfrac") : globalConvTex);
            }
          } else {
            globalConversionTex += globalConvTex;
          }
        }
        conversionScalars.push(...scalars);

        for (const tok of remainingTokens) {
          const { uName, dim: tokDim } = tokenBags[tok];
          const fDepth = getFormulaFractionDepth(branchAst, tok) || 0;
          if (tokenMarkup[tok] === undefined) {
            tokenMarkup[tok] = unitToCancelledTex(uName, fDepth >= 2, tokDim, new Set());
          }
          if (resolvedUnitByTok[tok] === undefined) {
            resolvedUnitByTok[tok] = uName;
          }
        }
      }
    }

    // Solve nested unfactored sums (e.g. 1 / (1/k_1 + 1/k_2)) and transcendental call arguments (e.g. acos(P_cn / P_c))
    const prefixSymbols = { pico: "p", nano: "n", micro: "u", milli: "m", centi: "c", deci: "d", kilo: "k", mega: "M", giga: "G" };
    const unitForSubExpr = (exprNode) => {
      const subExps = collectTokenExponents(exprNode, 1, {});
      const numParts = [];
      const denParts = [];
      for (const [t, p] of Object.entries(subExps)) {
        const cK = resolveCanonicalKey(t, varsDb);
        const m = varsDb[cK] || varsDb[t] || {};
        const u = resolvedUnitByTok[t] || S._u?.[cK] || S._u?.[t] || m.unit || "";
        if (!u || u === "dimless" || u === "ratio") continue;
        for (const f of parseUnitToSemanticAST(u, m.dimension)) {
          const netP = f.power * p;
          if (Math.abs(netP) < 1e-9) continue;
          const bSym = BASE_UNITS[f.base]?.symbol || f.base;
          const pSym = f.prefix ? (prefixSymbols[f.prefix] || f.prefix) : "";
          const absP = Math.abs(netP);
          const uStr = absP === 1 ? `${pSym}${bSym}` : `${pSym}${bSym}^${absP}`;
          if (netP > 0) numParts.push(uStr);
          else denParts.push(uStr);
        }
      }
      const n = numParts.join("*");
      const d = denParts.join("*");
      return d ? `${n || "1"}/(${d})` : (n || "dimless");
    };

    // Conversions are per token, so a conversion a sibling term adopts for a token the main
    // pass left alone applies at every occurrence and shifts the main net unit by
    // (U_sub / U_main)^exp. One canonical factor restores the target unit.
    const compensateSharedToken = (k, subUnit) => {
      const e = exps[k];
      if (forceInSitu || !subUnit || !e || !Number.isInteger(e)) return;
      const cK = resolveCanonicalKey(k, varsDb);
      const m = varsDb[cK] || varsDb[k] || {};
      const mainUnit = resolvedUnitByTok[k] || S._u?.[cK] || S._u?.[k] || m.unit || "";
      if (!mainUnit || mainUnit === subUnit) return;
      const single = (u) => {
        const atoms = parseUnitToSemanticAST(u, m.dimension);
        return atoms.length === 1 && atoms[0].power === 1;
      };
      if (!single(mainUnit) || !single(subUnit)) return;
      const sMain = getUnitAtomBag(mainUnit, m.dimension).scale;
      const sSub = getUnitAtomBag(subUnit, m.dimension).scale;
      if (!(sMain > 0) || !(sSub > 0) || Math.abs(sSub / sMain - 1) < 1e-6) return;
      const n = Math.abs(e);
      const pw = (u) => (n === 1 ? u : `${u}^${n}`);
      const [from, to] = e > 0 ? [subUnit, mainUnit] : [mainUnit, subUnit];
      const conv = formatPairConversion(pw(from), pw(to), m.dimension, m.dimension, "whole");
      if (!conv.tex) return;
      globalConversionTex += conv.tex;
      conversionScalars.push(...(conv.scalars || (conv.scalar !== null ? [conv.scalar] : [])));
    };

    const mergeSubAnalysis = (sub) => {
      for (const [k, m] of Object.entries(sub.tokenMarkup || {})) {
        if (tokenMarkup[k] !== undefined && !placeholderMarkup.has(k)) continue;
        const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
        tokenMarkup[k] = kDepth >= 2 ? m.replaceAll("\\cfrac", "\\tfrac") : m;
        placeholderMarkup.delete(k);
      }
      for (const [k, list] of Object.entries(sub.tokenConversions || {})) {
        if (tokenConversions[k]) continue;
        const kDepth = getFormulaFractionDepth(branchAst, k) || 0;
        tokenConversions[k] = kDepth >= 2 ? list.map(c => c.replaceAll("\\cfrac", "\\tfrac")) : list;
        if (list.length > 0) compensateSharedToken(k, sub.resolvedUnitByTok?.[k]);
      }
      conversionScalars.push(...(sub.conversionScalars || []));
    };

    const unfactoredSums = [];
    const transcendentalArgs = [];
    (function scanNested(n) {
      if (!n) return;
      if (n.type === "group") { scanNested(n.expr); return; }
      if (n.type === "call") {
        if (n.fn === "sqrt" || n.fn === "abs") scanNested(n.arg);
        else if (!["sin", "cos", "tan"].includes(n.fn)) transcendentalArgs.push(n.arg);
        return;
      }
      if (n.type === "binary") {
        if (isUnaryMinusNode(n)) {
          scanNested(n.right);
          return;
        }
        if (n.op === "+" || n.op === "-") {
          const flat = [];
          (function collectTerms(t) {
            const u = t && t.type === "group" ? t.expr : t;
            if (isUnaryMinusNode(u)) {
              flat.push(u.right);
              return;
            }
            if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
              collectTerms(u.left);
              collectTerms(u.right);
            } else if (u) {
              flat.push(u);
            }
          })(n);
          if (flat.length > 1) {
            unfactoredSums.push({ firstTerm: flat[0], siblingTerms: flat.slice(1) });
            scanNested(flat[0]);
            return;
          }
        }
        scanNested(n.left);
        scanNested(n.right);
      }
    })(branchAst);

    for (const { firstTerm, siblingTerms } of unfactoredSums) {
      const sibTargetUnit = unitForSubExpr(firstTerm);
      const ftIds = Array.from(new Set(getAstIdentifiers(firstTerm).filter(t => !isReservedMathToken(t))));
      const cancelledTokDims = [];
      for (const ftTok of ftIds) {
        if (fullyCancelledTokens.has(ftTok) && tokenBags[ftTok]) {
          cancelledTokDims.push(tokenBags[ftTok].bag.dimMap);
        }
      }
      for (const sib of siblingTerms) {
        mergeSubAnalysis(solveUnitAlgebra(sib, S, "__sum_sib__", sibTargetUnit, varsDb, null, true, cancelledTokDims));
      }
    }
    for (const argNode of transcendentalArgs) {
      mergeSubAnalysis(solveUnitAlgebra(argNode, S, "__call_arg__", "dimless", varsDb, null, true));
    }
  }

  if (
    !forceInSitu &&
    targetUnit &&
    targetDim === DIMENSIONS.PERCENTAGE &&
    branches.length > 0 &&
    branches.every(isDimensionlessBranch)
  ) {
    const targetScale = getUnitAtomBag(targetUnit, targetDim).scale;
    if (Number.isFinite(targetScale) && targetScale > 0) {
      const ratioToTarget = 1 / targetScale;
      if (Math.abs(ratioToTarget - 1) > 1e-12) {
        globalConversionTex += ` \\cdot ${fmtScale(ratioToTarget)}`;
        conversionScalars.push(ratioToTarget);
      }
    }
  }

  return {
    tokenMarkup,
    conversionFactors: [],
    conversionFactorTex: "",
    numericConversionFactor: 1.0,
    globalConversionTex,
    preConversions,
    tokenConversions,
    conversionScalars,
    resolvedUnitByTok
  };
}

function collectTokenExponents(node, sign = 1, acc = {}) {
  if (!node) return acc;
  if (node.type === "group") return collectTokenExponents(node.expr, sign, acc);
  if (node.type === "id") {
    acc[node.name] = (acc[node.name] || 0) + sign;
    return acc;
  }
  if (node.type === "call") {
    if (node.fn === "sqrt") {
      return collectTokenExponents(node.arg, sign * 0.5, acc);
    }
    if (node.fn === "abs") {
      return collectTokenExponents(node.arg, sign, acc);
    }
    // Transcendental calls (sin, cos, tan, exp, ln, log, etc.) consume their argument units
    return acc;
  }
  if (node.type === "binary") {
    if (isUnaryMinusNode(node)) {
      collectTokenExponents(node.right, sign, acc);
    } else if (node.op === "+" || node.op === "-") {
      // Terms of a sum are alternatives of one shared dimension: count one representative.
      collectTokenExponents(node.left, sign, acc);
    } else if (node.op === "*") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, sign, acc);
    } else if (node.op === "/") {
      collectTokenExponents(node.left, sign, acc);
      collectTokenExponents(node.right, -sign, acc);
    } else if (node.op === "^") {
      const rawP = evalAST(node.right, {});
      const p = Number.isFinite(rawP) ? rawP : 1;
      collectTokenExponents(node.left, sign * p, acc);
    }
  }
  return acc;
}
