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

import { parseMathAST, getAstIdentifiers, countVariableOccurrences, unwrapGroup } from "../cas/ast.js";
import { resolveCanonicalKey, isReservedMathToken } from "../cas/algebra.js";
import { casToTex, astToLatex, toLatexSymbol } from "../cas/latex.js";
import {
  solveUnitAlgebra,
  analyzeTempAST,
  toPointUnit,
  getUnitAtomBag,
  getUnitOffset,
  getUnitKind,
  getAbsoluteCompanionUnit,
  toDeltaUnit,
  isDimEqual,
  unitToTex,
  unitToCancelledTex,
  formatPairConversion,
  fmtScale,
  convertUnitValue,
  valueToCoherentBase,
  formatValueInUnit
} from "../cas/units/index.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { fmtSigFig, formatGivenValue, displayFloorOk } from "./dimensions.js";

function countConversionItems(analysis) {
  let count = analysis.globalConversionTex ? 1 : 0;
  for (const list of Object.values(analysis.tokenConversions || {})) {
    if (Array.isArray(list)) count += list.length;
  }
  return count;
}

function isTempFrameChange(fromUnit, toUnit, dimension = null) {
  const a = getUnitAtomBag(fromUnit, dimension);
  const b = getUnitAtomBag(toUnit, dimension);
  if (a.kind === "linear" && b.kind === "linear") return false;
  return Math.abs(a.scale - b.scale) > 1e-9 || Math.abs(a.offset - b.offset) > 1e-9;
}

export function buildTempConversionExpr(rawVal, fromUnit, toUnit, dimension = null) {
  const fromOff = getUnitOffset(fromUnit, dimension);
  const toOff = getUnitOffset(toUnit, dimension);
  const absFrom = getAbsoluteCompanionUnit(fromUnit);
  const absTo = getAbsoluteCompanionUnit(toUnit);
  const formattedRaw = fmtSigFig(rawVal, 6, true);
  const scaleConv = absFrom !== absTo
    ? formatPairConversion(absFrom, absTo, dimension, dimension, "whole")
    : { tex: "" };
  const hasScale = Boolean(scaleConv.tex);
  const absFromTex = hasScale
    ? unitToCancelledTex(absFrom, false, dimension, "whole")
    : unitToTex(absFrom, false, dimension);
  const lead = fromOff ? `(${formattedRaw} + ${fromOff}) \\, ${absFromTex}` : `${formattedRaw} \\, ${absFromTex}`;
  const tail = toOff ? ` - ${toOff}` : "";
  return `${lead}${scaleConv.tex}${tail}`;
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
  return buildAlignedDerivationWithAnalysis(step, S, allSteps, varsDb, relations, answeredVars, givens, overrides).tex;
}

export function buildAlignedDerivationWithAnalysis(
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
  const prepScalars = [];
  const alignedTokens = new Set();
  const useScaleFmtFor = new Set();
  const factoredInfo = {};
  const sciVars = S._sciVars instanceof Set ? S._sciVars : null;
  const sciOptsFor = (key, val, meta = {}) => {
    if (meta.isConstant) return {};
    const useSci = (sciVars && sciVars.has(key)) ||
      (typeof val === "number" && val !== 0 && (!displayFloorOk(val) || Math.abs(val) > 9.99e6));
    return useSci ? { scientific: true } : {};
  };

  const unitOfKey = k => {
    const c = resolveCanonicalKey(k, workingVarsDb);
    return activeUnitMap[k] || activeUnitMap[c] || workingVarsDb[k]?.unit || workingVarsDb[c]?.unit || "";
  };

  let unitAnalysis;
  let rowTargetUnit = targetUnit;

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
    const reqTargetU = requiredUnits[canonicalTarget] || requiredUnits[targetVar];
    if (reqTargetU && targetUnit && reqTargetU !== targetUnit) {
      rowTargetUnit = reqTargetU;
    }
  } else {
    // 1. AST Temperature Typing & Unified Frame Alignment
    const alignLeafToUnit = (key, targetU) => {
      const currU = unitOfKey(key);
      const cKey = resolveCanonicalKey(key, workingVarsDb);
      const meta = workingVarsDb[cKey] || workingVarsDb[key] || {};
      if (!currU || !targetU || currU === targetU || alignedTokens.has(key)) return;

      const currBag = getUnitAtomBag(currU, meta.dimension);
      const targetBag = getUnitAtomBag(targetU, meta.dimension);
      if (isDimEqual(currBag.dimMap, targetBag.dimMap) && Math.abs(currBag.scale - targetBag.scale) < 1e-9 && Math.abs(currBag.offset - targetBag.offset) < 1e-9) {
        return;
      }

      const rawVal = evalState[key];
      const alignedVal = convertUnitValue(rawVal, currU, targetU, meta.dimension);
      const sym = S._displaySymbols?.[cKey] || S._displaySymbols?.[key] || toLatexSymbol(key, workingVarsDb);
      const formattedRaw = formatGivenValue(rawVal, meta, true, currU, sciOptsFor(key, rawVal, meta));
      const alignedFormatted = fmtSigFig(alignedVal, 6, true, sciOptsFor(key, alignedVal, meta));

      if (currBag.kind === "point" || targetBag.kind === "point") {
        const exprTex = buildTempConversionExpr(rawVal, currU, targetU, meta.dimension);
        prepLines.push(`${sym} &= ${exprTex} = ${alignedFormatted} \\, ${unitToTex(targetU, false, meta.dimension)}`);
      } else {
        const singleConv = solveUnitAlgebra(key, { ...evalState, _u: { ...activeUnitMap, [key]: currU } }, key, targetU, workingVarsDb);
        prepScalars.push(...(singleConv.conversionScalars || []));
        const unitTex = singleConv.tokenMarkup?.[key] || unitToTex(currU, false, meta.dimension);
        const convTex = (singleConv.tokenConversions?.[key]?.join("") || "") + (singleConv.globalConversionTex || "");
        prepLines.push(`${sym} &= ${formattedRaw} \\, ${unitTex}${convTex} = ${alignedFormatted} \\, ${unitToTex(targetU, false, meta.dimension)}`);
      }

      alignedTokens.add(key);
      evalState[key] = alignedVal;
      evalState[cKey] = alignedVal;
      activeUnitMap[key] = targetU;
      activeUnitMap[cKey] = targetU;
    };

    const tempInfo = analyzeTempAST(rhsAst, unitOfKey, workingVarsDb);
    const targetKind = targetUnit ? getUnitKind(targetUnit, targetMeta.dimension) : "linear";

    // 1a. Lift affine points appearing in multiplicative/power/incompatible contexts to absolute frames
    let absLiftTarget = "K";
    if (targetKind === "point") {
      absLiftTarget = getAbsoluteCompanionUnit(targetUnit);
    } else if (tempInfo.liftTokens.size > 0) {
      const counts = new Map();
      for (const t of tempInfo.liftTokens) {
        const a = getAbsoluteCompanionUnit(unitOfKey(t));
        counts.set(a, (counts.get(a) || 0) + 1);
      }
      absLiftTarget = [...counts.entries()].sort((a, b) => (b[1] - a[1]) || (a[0] === "K" ? -1 : 1))[0][0];
    }
    for (const tok of tempInfo.liftTokens) {
      if (typeof evalState[tok] === "number") {
        alignLeafToUnit(tok, absLiftTarget);
      }
    }

    // 1b. Align unlifted point-temperature groups that share tokens or have mixed units, plus non-point additive groups
    const unliftedPoints = [...tempInfo.pointTokens].filter(t => !tempInfo.liftTokens.has(t) && typeof evalState[t] === "number");
    let rowPointFrame = null;
    if (unliftedPoints.length > 0) {
      const pointUnits = unliftedPoints.map(t => unitOfKey(t));
      const firstU = pointUnits[0];
      const allSamePoint = pointUnits.every(u => u === firstU);
      if (allSamePoint) {
        rowPointFrame = firstU;
      } else if (targetKind === "point") {
        rowPointFrame = targetUnit;
      } else {
        const counts = new Map();
        for (const u of pointUnits) counts.set(u, (counts.get(u) || 0) + 1);
        rowPointFrame = [...counts.entries()].sort((a, b) => (b[1] - a[1]) || (getUnitOffset(a[0]) - getUnitOffset(b[0])))[0][0];
      }
      for (const tok of unliftedPoints) {
        alignLeafToUnit(tok, rowPointFrame);
      }
    }

    // 1b-pre. Align variables appearing multiple times across expressions so every occurrence shares one unit
    const rhsVarIds = Array.from(new Set(getAstIdentifiers(rhsAst).filter(t => !isReservedMathToken(t))));
    const dimPeers = new Map();
    for (const k of rhsVarIds) {
      if (typeof evalState[k] !== "number") continue;
      const u = unitOfKey(k);
      if (!u || u === "dimless" || u === "ratio" || u === "%" || u === "\\%") continue;
      const cK = resolveCanonicalKey(k, workingVarsDb);
      const m = workingVarsDb[cK] || workingVarsDb[k] || {};
      const bag = getUnitAtomBag(u, m.dimension);
      const dKey = JSON.stringify(Object.entries(bag.dimMap).sort());
      if (!dimPeers.has(dKey)) dimPeers.set(dKey, []);
      dimPeers.get(dKey).push({ key: k, unit: u, bag, meta: m });
    }
    const tBagPre = rowTargetUnit && rowTargetUnit !== "dimless" && rowTargetUnit !== "ratio"
      ? getUnitAtomBag(rowTargetUnit, targetMeta.dimension)
      : null;
    const tDimKeyPre = tBagPre ? JSON.stringify(Object.entries(tBagPre.dimMap).sort()) : null;
    for (const [dKey, peers] of dimPeers.entries()) {
      const hasRepeated = peers.some(p => countVariableOccurrences(rhsAst, p.key) > 1);
      if (!hasRepeated) continue;
      let frameU = null;
      if (tDimKeyPre && dKey === tDimKeyPre) {
        frameU = rowTargetUnit;
      } else {
        const counts = new Map();
        for (const p of peers) counts.set(p.unit, (counts.get(p.unit) || 0) + 1);
        frameU = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
      if (!frameU) continue;
      for (const p of peers) {
        if (countVariableOccurrences(rhsAst, p.key) > 1 || peers.length > 1) {
          if (p.bag.kind === "linear" && getUnitKind(frameU) === "linear") {
            alignLeafToUnit(p.key, frameU);
          }
        }
      }
    }

    (function alignAdditiveGroups(node) {
      if (!node) return;
      if (node.type === "group") { alignAdditiveGroups(node.expr); return; }
      if (node.type === "call") { alignAdditiveGroups(node.arg); return; }
      if (node.type !== "binary") return;

      if (node.op === "+" || node.op === "-") {
        const leaves = [];
        let pureIds = true;
        (function walk(n) {
          const u = n && n.type === "group" ? n.expr : n;
          if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
            walk(u.left);
            walk(u.right);
            return;
          }
          if (u && u.type === "id" && typeof evalState[u.name] === "number") {
            leaves.push({ key: u.name });
          } else {
            pureIds = false;
          }
        })(node);

        if (pureIds && leaves.length > 1) {
          const units = leaves.map(l => unitOfKey(l.key));
          const firstBag = getUnitAtomBag(units[0]);
          const allShareUnit = units.every(u => {
            if (u && units[0] && getUnitAtomBag(u).kind !== firstBag.kind) return false;
            if (!u && !units[0]) return true;
            if (!u || !units[0]) return false;
            const b = getUnitAtomBag(u);
            return isDimEqual(firstBag.dimMap, b.dimMap)
              && Math.abs(firstBag.scale - b.scale) < 1e-9
              && Math.abs(firstBag.offset - b.offset) < 1e-9;
          });

          if (!allShareUnit) {
            const targetBag = targetUnit ? getUnitAtomBag(targetUnit, targetMeta.dimension) : null;
            const leafBags = units.map(u => getUnitAtomBag(u));
            const sameDimAsTarget = !!targetBag && isDimEqual(firstBag.dimMap, targetBag.dimMap);
            const firstPointUnit = units.find((u, i) => leafBags[i].kind === "point");
            const pointFrame = sameDimAsTarget ? toPointUnit(targetUnit) : firstPointUnit;
            const deltaFrame = toDeltaUnit(pointFrame || units[0]);
            leaves.forEach((l, i) => {
              const kind = leafBags[i].kind;
              const frame = kind === "point" ? pointFrame
                : kind === "delta" ? deltaFrame
                : (sameDimAsTarget ? targetUnit : units[0]);
              alignLeafToUnit(l.key, frame);
            });
            return;
          }
        }
      }

      alignAdditiveGroups(node.left);
      alignAdditiveGroups(node.right);
    })(rhsAst);

    // 1c. Determine the frame in which the main numeric substitution row evaluates
    if (targetKind === "point") {
      if (tempInfo.tempState === "abs" || (tempInfo.liftTokens.size > 0 && unliftedPoints.length === 0)) {
        rowTargetUnit = absLiftTarget;
      } else if (unliftedPoints.length > 0) {
        rowTargetUnit = unitOfKey(unliftedPoints[0]);
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
        let pureIds = true;
        (function walk(n, sign) {
          const u = n && n.type === "group" ? n.expr : n;
          if (u && u.type === "binary" && (u.op === "+" || u.op === "-")) {
            walk(u.left, sign);
            walk(u.right, u.op === "+" ? sign : -sign);
            return;
          }
          if (u && u.type === "id" && typeof evalState[u.name] === "number") {
            leaves.push({ key: u.name, sign });
          } else {
            pureIds = false;
          }
        })(node, 1);

        const units = leaves.map(l => unitOfKey(l.key));
        const firstBag = getUnitAtomBag(units[0]);
        const allShareUnit = pureIds && leaves.length > 1 && units.every(u => {
          if (u && units[0] && getUnitAtomBag(u).kind !== firstBag.kind) return false;
          if (!u && !units[0]) return true;
          if (!u || !units[0]) return false;
          const b = getUnitAtomBag(u);
          return isDimEqual(firstBag.dimMap, b.dimMap)
            && Math.abs(firstBag.scale - b.scale) < 1e-9
            && Math.abs(firstBag.offset - b.offset) < 1e-9;
        });

        if (allShareUnit) {
          const meta0 = workingVarsDb[leaves[0].key] || {};
          const inner = leaves
            .map((l, i) => {
              const lMeta = workingVarsDb[l.key] || meta0;
              const lUnit = unitOfKey(l.key);
              let valStr = formatGivenValue(evalState[l.key], lMeta, true, lUnit, sciOptsFor(l.key, evalState[l.key], lMeta));
              let effSign = l.sign;
              if (valStr.startsWith("-")) {
                valStr = valStr.slice(1);
                effSign = -effSign;
              }
              const signStr = i === 0 ? (effSign < 0 ? "-" : "") : (effSign < 0 ? " - " : " + ");
              return `${signStr}${valStr}`;
            })
            .join("");

          const factoredId = `__factored_${leaves.map(l => l.key).join("_")}`;
          const sharedUnit = units[0];
          const groupTemp = analyzeTempAST(node, unitOfKey, workingVarsDb);
          const factoredUnit = (groupTemp.tempState === "delta" && getUnitKind(sharedUnit, meta0.dimension) === "point")
            ? toDeltaUnit(sharedUnit)
            : sharedUnit;

          factoredInfo[factoredId] = { inner, unit: factoredUnit, dimension: meta0.dimension || null };
          activeUnitMap[factoredId] = factoredUnit;
          workingVarsDb[factoredId] = { unit: factoredUnit, dimension: meta0.dimension || null };

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

    // 3. Unit Algebra & Constant System Equivalence Insight (targeting rowTargetUnit)
    unitAnalysis = solveUnitAlgebra(rhsAst, { ...evalState, _u: activeUnitMap }, targetVar, rowTargetUnit, workingVarsDb);

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
        rowTargetUnit,
        workingVarsDb
      );
      const testItems = countConversionItems(testAnalysis);
      if (testItems < baselineItems) {
        const rawVal = evalState[tok];
        const altVal = formatValueInUnit(
          valueToCoherentBase(rawVal, currU, constEntry.dimension),
          altU,
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
      const formattedNum = useScaleFmtFor.has(k)
        ? fmtScale(v, true)
        : formatGivenValue(v, meta, true, activeUnit, sciOptsFor(k, v, meta));
      const unitMarkup = unitAnalysis.tokenMarkup?.[k] || "";
      const inlineConv = unitAnalysis.tokenConversions?.[k] ? unitAnalysis.tokenConversions[k].join("") : "";

      if (unitMarkup !== "" || inlineConv !== "") {
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
    const groupConv = (unitAnalysis.tokenConversions?.[factoredId] || []).join("");
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

  // A trailing conversion factor is a multiplier: it must bind the whole RHS,
  // so an additive root (a ± b) is grouped before the factor is attached.
  const rootNode = unwrapGroup(rhsAst);
  const needsRootGroup = !!unitAnalysis.globalConversionTex
    && rootNode?.type === "binary"
    && (rootNode.op === "+" || rootNode.op === "-");
  const numTex = astToLatex(needsRootGroup ? { type: "group", expr: rhsAst } : rhsAst, subsMap, workingVarsDb)
    + (unitAnalysis.globalConversionTex || "");

  // 6. Final Boxed Answer & Post-Conversion Row
  const val = overrides[canonicalTarget] ?? step.expectedVal ?? S[canonicalTarget];
  const formattedVal = typeof val === "number"
    ? fmtSigFig(val, 6, true, sciOptsFor(canonicalTarget, val, targetMeta))
    : val;
  const tDim = targetMeta.dimension;
  const needsPostConv = typeof val === "number"
    && rowTargetUnit && targetUnit && rowTargetUnit !== targetUnit
    && isTempFrameChange(rowTargetUnit, targetUnit, tDim);

  const rows = [...prepLines];
  const shouldBreakVertical = prepLines.length > 0
    || needsPostConv
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

  // Whenever the row evaluated in an affine/absolute frame differing from the boxed unit,
  // append the explicit offset/scale row landing on the boxed unit (R8, R20).
  if (needsPostConv) {
    const rowVal = convertUnitValue(val, targetUnit, rowTargetUnit, tDim);
    rows.push(`&= ${buildTempConversionExpr(rowVal, rowTargetUnit, targetUnit, tDim)}`);
  }

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

  const allScalars = [...prepScalars, ...(unitAnalysis?.conversionScalars || [])];
  return {
    tex: `$$\\begin{aligned}\n  ${rows.join(" \\\\[6pt]\n  ")}\n\\end{aligned}$$`,
    unitAnalysis,
    conversionScalars: allScalars,
    hasPrepOrFactor: prepLines.length > 0 || Object.keys(factoredInfo).length > 0
  };
}
