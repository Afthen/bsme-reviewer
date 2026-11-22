/**
 * src/core/derivation.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Pure AST-Driven Aligned Derivations
 * - Zero regex; full AST-based subtree mutation and factoring
 * - Additive terms of identical units combined into (a ± b ± ...)\\,unit
 * - Variable symbols consistently drawn from S._displaySymbols
 * - In-situ factor-label unit conversions with "omit 1" rule
 * ============================================================================
 */

import { parseMathAST, getAstIdentifiers } from "../cas/ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../cas/algebra.js";
import { casToTex, astToLatex, toLatexSymbol } from "../cas/latex.js";
import {
  solveUnitAlgebra,
  getUnitAtomBag,
  getUnitOffset,
  getAbsoluteCompanionUnit,
  isDimEqual,
  unitToTex,
  unitToCancelledTex,
  fmtScale,
  valueToCoherentBase,
  formatValueInUnit
} from "../cas/units/index.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { fmtSigFig, formatGivenValue, DIMENSIONS } from "./dimensions.js";

function countConversionItems(analysis) {
  let count = analysis.globalConversionTex ? 1 : 0;
  for (const list of Object.values(analysis.tokenConversions || {})) {
    if (Array.isArray(list)) {
      count += list.filter(item => item !== "__AFFINE_CONVERTED__").length;
    }
  }
  return count;
}

export function buildAlignedDerivation(
  step,
  S = {},
  allSteps = [],
  varsDb = {},
  relations = [],
  answeredVars = new Set(),
  givens = [],
  overrides = {}
) {
  const { targetVar, baseFormula, canonicalTex, rhsExpr, requiredUnits } = step;

  const canonicalTarget = resolveCanonicalKey(targetVar, varsDb);
  const targetMeta = varsDb[canonicalTarget] || varsDb[targetVar] || {};
  const targetSymbol = S._displaySymbols?.[canonicalTarget] || S._displaySymbols?.[targetVar] || targetMeta.symbol || targetVar;
  const targetUnit = S._u?.[canonicalTarget] || S._u?.[targetVar] || targetMeta.unit || "";

  const formulaRhs = rhsExpr || (baseFormula && baseFormula.includes("=") ? baseFormula.split("=")[1].trim() : baseFormula) || "";
  const evalState = { ...S, ...overrides };
  const activeUnitMap = { ...(S._u || {}) };
  const workingVarsDb = { ...varsDb };
  const rhsAst = parseMathAST(formulaRhs);
  const prepLines = [];
  const alignedTokens = new Set();
  const useScaleFmtFor = new Set();
  const factoredInfo = {};

  const unitOfKey = k => {
    const c = resolveCanonicalKey(k, workingVarsDb);
    return activeUnitMap[k] || activeUnitMap[c] || workingVarsDb[k]?.unit || workingVarsDb[c]?.unit || "";
  };

  let unitAnalysis;

  if (requiredUnits && typeof requiredUnits === "object") {
    unitAnalysis = solveUnitAlgebra(formulaRhs, evalState, targetVar, targetUnit, workingVarsDb, requiredUnits);
    if (unitAnalysis.preConversions && unitAnalysis.preConversions.length > 0) {
      unitAnalysis.preConversions.forEach(pc => {
        evalState[pc.token] = pc.convertedVal;
        evalState[pc.canonicalKey] = pc.convertedVal;
        const convUnit = pc.toUnit || pc.targetUnit || "__PRE_CONVERTED__";
        activeUnitMap[pc.token] = convUnit;
        activeUnitMap[pc.canonicalKey] = convUnit;
      });
    }
  } else {
    // 1. Align mismatched additive groups (including affine temperatures like °R vs °F or K vs °C)
    const alignLeafToUnit = (key, targetU) => {
      const currU = unitOfKey(key);
      const cKey = resolveCanonicalKey(key, workingVarsDb);
      const meta = workingVarsDb[cKey] || workingVarsDb[key] || {};
      if (!currU || !targetU || currU === targetU || alignedTokens.has(key)) return;

      const isDiff = meta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!meta.isDifference;
      const currOffset = getUnitOffset(currU, meta.dimension);
      const targetOffset = getUnitOffset(targetU, meta.dimension);
      const currBag = getUnitAtomBag(currU, meta.dimension);
      const targetBag = getUnitAtomBag(targetU, meta.dimension);
      if (isDimEqual(currBag.dimMap, targetBag.dimMap) && Math.abs(currBag.scale - targetBag.scale) < 1e-9 && Math.abs(currOffset - targetOffset) < 1e-9) {
        return;
      }

      const rawVal = evalState[key];
      const alignedVal = formatValueInUnit(
        valueToCoherentBase(rawVal, currU, isDiff, meta.dimension),
        targetU,
        isDiff,
        meta.dimension
      );
      const sym = S._displaySymbols?.[cKey] || S._displaySymbols?.[key] || toLatexSymbol(key, workingVarsDb);
      const formattedRaw = formatGivenValue(rawVal, meta, true, currU);

      if (currOffset && !isDiff) {
        const absUnit = getAbsoluteCompanionUnit(currU);
        const absVal = formatValueInUnit(valueToCoherentBase(rawVal, currU, false, meta.dimension), absUnit, false, meta.dimension);
        if (absUnit === targetU) {
          prepLines.push(`${sym} &= (${formattedRaw} + ${currOffset}) \\, ${unitToTex(targetU, false, meta.dimension)} = ${fmtSigFig(alignedVal, 6)} \\, ${unitToTex(targetU, false, meta.dimension)}`);
        } else {
          const singleConv = solveUnitAlgebra(key, { ...evalState, [key]: absVal, _u: { ...activeUnitMap, [key]: absUnit } }, key, targetU, workingVarsDb);
          const convTex = (singleConv.tokenConversions?.[key]?.join("") || "") + (singleConv.globalConversionTex || "");
          const absTex = convTex ? unitToCancelledTex(absUnit, false, meta.dimension, "whole") : unitToTex(absUnit, false, meta.dimension);
          prepLines.push(`${sym} &= (${formattedRaw} + ${currOffset}) \\, ${absTex}${convTex} = ${fmtSigFig(alignedVal, 6)} \\, ${unitToTex(targetU, false, meta.dimension)}`);
        }
      } else {
        const singleConv = solveUnitAlgebra(key, { ...evalState, _u: { ...activeUnitMap, [key]: currU } }, key, targetU, workingVarsDb);
        const unitTex = singleConv.tokenMarkup?.[key] || unitToTex(currU, false, meta.dimension);
        const convTex = (singleConv.tokenConversions?.[key]?.join("") || "") + (singleConv.globalConversionTex || "");
        prepLines.push(`${sym} &= ${formattedRaw} \\, ${unitTex}${convTex} = ${fmtSigFig(alignedVal, 6)} \\, ${unitToTex(targetU, false, meta.dimension)}`);
      }

      alignedTokens.add(key);
      evalState[key] = alignedVal;
      evalState[cKey] = alignedVal;
      activeUnitMap[key] = targetU;
      activeUnitMap[cKey] = targetU;
    };

    const hasOuterWrapper = rhsAst && rhsAst.type === "binary" && rhsAst.op !== "+" && rhsAst.op !== "-";

    (function alignAdditiveGroups(node, isTop) {
      if (!node) return;
      if (node.type === "group") { alignAdditiveGroups(node.expr, isTop); return; }
      if (node.type === "call") { alignAdditiveGroups(node.arg, false); return; }
      if (node.type !== "binary") return;

      if (node.op === "+" || node.op === "-") {
        const leaves = [];
        (function walk(n, sign) {
          const u = n && n.type === "group" ? n.expr : n;
          if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
            walk(u.left, sign);
            walk(u.right, u.op === "+" ? sign : -sign);
            return;
          }
          if (u && u.type === "id" && typeof evalState[u.name] === "number") {
            leaves.push({ key: u.name, sign });
          }
        })(node, 1);

        if (leaves.length > 1) {
          const units = leaves.map(l => unitOfKey(l.key));
          const firstBag = getUnitAtomBag(units[0]);
          const firstOff = getUnitOffset(units[0]);
          const allShareUnit = units.every(u => {
            if (!u && !units[0]) return true;
            if (!u || !units[0]) return false;
            const b = getUnitAtomBag(u);
            return isDimEqual(firstBag.dimMap, b.dimMap)
              && Math.abs(firstBag.scale - b.scale) < 1e-9
              && Math.abs(firstOff - getUnitOffset(u)) < 1e-9;
          });

          const isPureTemp = firstBag.dimMap && Object.keys(firstBag.dimMap).length === 1 && firstBag.dimMap.Th === 1;
          const anyOffset = units.some(u => getUnitOffset(u) !== 0);

          if (!allShareUnit || (isPureTemp && anyOffset && (!isTop || hasOuterWrapper))) {
            let alignedUnit = null;
            if (isPureTemp) {
              const zeroOffLeaf = units.find(u => getUnitOffset(u) === 0);
              if (targetUnit && getUnitAtomBag(targetUnit).dimMap?.Th === 1 && getUnitOffset(targetUnit) === 0) {
                alignedUnit = targetUnit;
              } else if (zeroOffLeaf) {
                alignedUnit = zeroOffLeaf;
              } else {
                alignedUnit = getAbsoluteCompanionUnit(units[0]);
              }
            } else {
              const targetBag = targetUnit ? getUnitAtomBag(targetUnit, targetMeta.dimension) : null;
              alignedUnit = (targetBag && isDimEqual(firstBag.dimMap, targetBag.dimMap)) ? targetUnit : units[0];
            }

            leaves.forEach(l => alignLeafToUnit(l.key, alignedUnit));
            return;
          }
        }
      }

      alignAdditiveGroups(node.left, false);
      alignAdditiveGroups(node.right, false);
    })(rhsAst, true);

    // Align non-additive affine temperature variables in compound/power expressions (e.g. T_2 = T_1 * r_k^(k-1))
    if (rhsAst && rhsAst.type !== "id") {
      const tokens = Array.from(new Set(getAstIdentifiers(rhsAst).filter(t => !isReservedMathToken(t))));
      for (const tok of tokens) {
        if (alignedTokens.has(tok) || typeof evalState[tok] !== "number") continue;
        const currU = unitOfKey(tok);
        const cKey = resolveCanonicalKey(tok, workingVarsDb);
        const meta = workingVarsDb[cKey] || workingVarsDb[tok] || {};
        const isDiff = meta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!meta.isDifference;
        const currOffset = getUnitOffset(currU, meta.dimension);
        if (currOffset && !isDiff && !(rhsAst.type === "binary" && (rhsAst.op === "+" || rhsAst.op === "-") && currU === targetUnit)) {
          alignLeafToUnit(tok, getAbsoluteCompanionUnit(currU));
        }
      }
    }

    // 2. Pure AST Additive Factoring (runs BEFORE solveUnitAlgebra so factored groups carry one unit token)
    (function factorAdditiveGroups(node) {
      if (!node) return;
      if (node.type === "group") { factorAdditiveGroups(node.expr); return; }
      if (node.type === "call") { factorAdditiveGroups(node.arg); return; }
      if (node.type !== "binary") return;

      if (node.op === "+" || node.op === "-") {
        const leaves = [];
        (function walk(n, sign) {
          const u = n && n.type === "group" ? n.expr : n;
          if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
            walk(u.left, sign);
            walk(u.right, u.op === "+" ? sign : -sign);
            return;
          }
          if (u && u.type === "id" && typeof evalState[u.name] === "number") {
            leaves.push({ key: u.name, sign });
          }
        })(node, 1);

        const units = leaves.map(l => unitOfKey(l.key));
        const firstBag = getUnitAtomBag(units[0]);
        const firstOff = getUnitOffset(units[0]);
        const allShareUnit = leaves.length > 1 && units.every(u => {
          if (!u && !units[0]) return true;
          if (!u || !units[0]) return false;
          const b = getUnitAtomBag(u);
          return isDimEqual(firstBag.dimMap, b.dimMap)
            && Math.abs(firstBag.scale - b.scale) < 1e-9
            && Math.abs(firstOff - getUnitOffset(u)) < 1e-9;
        });

        if (allShareUnit) {
          const meta0 = workingVarsDb[leaves[0].key] || {};
          const inner = leaves
            .map((l, i) => {
              const signStr = i === 0 ? (l.sign < 0 ? "-" : "") : (l.sign < 0 ? " - " : " + ");
              const lMeta = workingVarsDb[l.key] || meta0;
              const lUnit = unitOfKey(l.key);
              return `${signStr}${formatGivenValue(evalState[l.key], lMeta, true, lUnit)}`;
            })
            .join("");

          const factoredId = `__factored_${leaves.map(l => l.key).join("_")}`;
          const sharedUnit = units[0];
          const sharedDim = meta0.dimension || null;

          factoredInfo[factoredId] = { inner, unit: sharedUnit, dimension: sharedDim };
          activeUnitMap[factoredId] = sharedUnit;
          workingVarsDb[factoredId] = { unit: sharedUnit, dimension: sharedDim };

          node.type = "id";
          node.name = factoredId;
          delete node.op;
          delete node.left;
          delete node.right;
          return;
        }
      }

      factorAdditiveGroups(node.left);
      factorAdditiveGroups(node.right);
    })(rhsAst);

    // 3. Unit Algebra & Constant System Equivalence Insight
    unitAnalysis = solveUnitAlgebra(rhsAst, { ...evalState, _u: activeUnitMap }, targetVar, targetUnit, workingVarsDb);

    const activeTokens = Array.from(new Set(getAstIdentifiers(rhsAst).filter(t => !isReservedMathToken(t) && !factoredInfo[t])));
    let baselineItems = countConversionItems(unitAnalysis);

    for (const tok of activeTokens) {
      const cKey = resolveCanonicalKey(tok, workingVarsDb);
      const constEntry = CONSTANTS_DB[cKey] || CONSTANTS_DB[tok];
      if (!constEntry || !constEntry.unitSI || !constEntry.unitUS || constEntry.unitSI === constEntry.unitUS) continue;

      const currU = unitOfKey(tok);
      const altU = currU === constEntry.unitSI ? constEntry.unitUS : (currU === constEntry.unitUS ? constEntry.unitSI : null);
      if (!altU || currU === altU) continue;

      const currBag = getUnitAtomBag(currU, constEntry.dimension);
      const altBag = getUnitAtomBag(altU, constEntry.dimension);
      if (!isDimEqual(currBag.dimMap, altBag.dimMap)) continue;

      const tokConvs = unitAnalysis.tokenConversions?.[tok]?.length || 0;
      if (tokConvs < 2 && !(activeTokens.length === 1 && unitAnalysis.globalConversionTex)) continue;

      const testAnalysis = solveUnitAlgebra(
        rhsAst,
        { ...evalState, _u: { ...activeUnitMap, [tok]: altU, [cKey]: altU } },
        targetVar,
        targetUnit,
        workingVarsDb
      );
      const testItems = countConversionItems(testAnalysis);
      if (testItems < baselineItems) {
        const rawVal = evalState[tok];
        const altVal = formatValueInUnit(
          valueToCoherentBase(rawVal, currU, false, constEntry.dimension),
          altU,
          false,
          constEntry.dimension
        );
        const sym = S._displaySymbols?.[cKey] || S._displaySymbols?.[tok] || toLatexSymbol(tok, workingVarsDb);
        const meta = workingVarsDb[cKey] || workingVarsDb[tok] || constEntry;
        const currFormatted = formatGivenValue(rawVal, meta, true, currU);
        const altFormatted = fmtScale(altVal, true);

        prepLines.push(`${sym} &= ${currFormatted} \\, ${unitToTex(currU, false, constEntry.dimension)} = ${altFormatted} \\, ${unitToTex(altU, false, constEntry.dimension)}`);
        evalState[tok] = altVal;
        evalState[cKey] = altVal;
        activeUnitMap[tok] = altU;
        activeUnitMap[cKey] = altU;
        useScaleFmtFor.add(tok);
        useScaleFmtFor.add(cKey);

        unitAnalysis = testAnalysis;
        baselineItems = testItems;
      }
    }
  }

  // 4. Build Localized Substitution Mapping with explicit `\,` spacing
  const subsMap = {};
  for (const [k, v] of Object.entries(evalState)) {
    if (typeof v === "number") {
      const meta = workingVarsDb[k] || {};
      const activeUnit = activeUnitMap[k] || meta.unit || "";
      const formattedNum = useScaleFmtFor.has(k) ? fmtScale(v, true) : formatGivenValue(v, meta, true, activeUnit);
      const unitMarkup = unitAnalysis.tokenMarkup?.[k] || "";
      const inlineConv = unitAnalysis.tokenConversions?.[k] ? unitAnalysis.tokenConversions[k].join("") : "";

      if (inlineConv === "__AFFINE_CONVERTED__") {
        subsMap[k] = unitMarkup;
      } else if (unitMarkup !== "" || inlineConv !== "") {
        subsMap[k] = `${formattedNum} \\, ${unitMarkup}${inlineConv}`;
      } else {
        subsMap[k] = formattedNum;
      }
    }
  }

  for (const [factoredId, info] of Object.entries(factoredInfo)) {
    const uTex = unitAnalysis.tokenMarkup?.[factoredId] !== undefined
      ? unitAnalysis.tokenMarkup[factoredId]
      : unitToTex(info.unit, false, info.dimension);
    const groupConv = unitAnalysis.tokenConversions?.[factoredId]?.join("") || "";
    subsMap[factoredId] = uTex ? `(${info.inner})\\,${uTex}${groupConv}` : `(${info.inner})${groupConv}`;
  }

  // 5. Vertical Equation Formatting & Implication Arrow Logic
  const symRhs = casToTex(formulaRhs, varsDb);
  const displayCanonical = canonicalTex || casToTex(baseFormula, varsDb);

  const formulaLhs = baseFormula && baseFormula.includes("=")
    ? baseFormula.split("=")[0].trim()
    : "";
  const isAlreadyIsolated = formulaLhs !== "" && (
    formulaLhs === targetVar ||
    resolveCanonicalKey(formulaLhs, varsDb) === canonicalTarget
  );

  const numTex = astToLatex(rhsAst, subsMap, workingVarsDb)
    + (unitAnalysis.globalConversionTex || "");

  const rows = [...prepLines];
  const shouldBreakVertical = prepLines.length > 0
    || numTex.includes("\\cfrac")
    || numTex.includes("\\cdot")
    || numTex.length > 45;

  if (isAlreadyIsolated || !baseFormula) {
    if (shouldBreakVertical && displayCanonical.includes("=")) {
      const eqIdx = displayCanonical.indexOf("=");
      const alignedCanonical = `${displayCanonical.slice(0, eqIdx).trim()} &= ${displayCanonical.slice(eqIdx + 1).trim()}`;
      rows.push(alignedCanonical, `&= ${numTex}`);
    } else {
      rows.push(`${displayCanonical} &= ${numTex}`);
    }
  } else {
    rows.push(`${displayCanonical} \\;\\Rightarrow\\; ${targetSymbol} &= ${symRhs}`, `&= ${numTex}`);
  }

  // 6. Final Boxed Answer
  const val = overrides[canonicalTarget] ?? step.expectedVal ?? S[canonicalTarget];
  const formattedVal = typeof val === "number" ? fmtSigFig(val, 6) : val;

  let unitTex = "";
  if (targetUnit && targetUnit !== "dimless" && targetUnit !== "ratio") {
    if (targetUnit === "deg" || targetUnit === "°") {
      unitTex = "°";
    } else if (targetUnit === "%") {
      unitTex = "\\text{\\%}";
    } else {
      unitTex = unitToTex(targetUnit, true);
    }
  }

  const finalLine = unitTex
    ? (unitTex === "°" ? `${targetSymbol} &= \\boxed{${formattedVal}°}` : `${targetSymbol} &= \\boxed{${formattedVal} \\, ${unitTex}}`)
    : `${targetSymbol} &= \\boxed{${formattedVal}}`;

  rows.push(finalLine);

  return `$$\\begin{aligned}\n  ${rows.join(" \\\\[6pt]\n  ")}\n\\end{aligned}$$`;
}
