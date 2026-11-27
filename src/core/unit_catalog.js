/**
 * src/core/unit_catalog.js
 * Pure unit catalog for the converter card: categories derived from the 7D dimension
 * vectors in BASE_UNITS, chip <-> unit-string composition, and factor-label conversions.
 */

import {
  BASE_UNITS, PREFIXES, parseUnitToSemanticAST, getUnitAtomBag, isDimEqual,
  convertUnitValue, unitToTex, unitToCancelledTex, formatPairConversion,
  buildCompoundTokenConversions, isCanonicalScaleFactor
} from "../cas/units/index.js";
import { fmtSigFig } from "./dimensions.js";
import { buildTempConversionExpr } from "./derivation.js";
import { DIMENSION_TOKEN_PALETTES } from "./unit_sampler.js";

export function dimKeyOf(dimMap = {}) {
  return Object.entries(dimMap).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}${v}`).join("");
}

const LABELS = [
  [{ L: 1 }, "Length"], [{ M: 1 }, "Mass"], [{ T: 1 }, "Time"], [{ Th: 1 }, "Temperature"],
  [{ M: 1, L: 1, T: -2 }, "Force"], [{ M: 1, L: -1, T: -2 }, "Pressure"],
  [{ M: 1, L: 2, T: -2 }, "Energy"], [{ M: 1, L: 2, T: -3 }, "Power"],
  [{ L: 3 }, "Volume"], [{ L: 3, T: -1 }, "Volume flow"], [{ T: -1 }, "Frequency"],
  [{ L: 2 }, "Area"], [{ L: 4 }, "Second moment of area"], [{ Th: -1 }, "Thermal expansion"],
  [{ Ang: 1 }, "Angle"], [{ C: 1 }, "Count"], [{ C: 1, T: -1 }, "Rotational speed"], [{ Pct: 1 }, "Percent"]
].map(([m, label]) => ({ key: dimKeyOf(m), label }));

const PRESET_EXTRAS = ["psi", "psf", "ksi"];
const CODE_BY_NAME = Object.fromEntries(Object.entries(PREFIXES).map(([code, p]) => [p.name, code]));

function prefixCodesFor(baseKey, symbol) {
  const bare = parseUnitToSemanticAST(symbol);
  if (bare.length !== 1 || bare[0].power !== 1 || bare[0].base !== baseKey) return [];
  return Object.entries(PREFIXES).filter(([code, p]) => {
    try {
      const ast = parseUnitToSemanticAST(`${code}${symbol}`);
      return ast.length === 1 && ast[0].power === 1 && ast[0].prefix === p.name && ast[0].base === baseKey;
    } catch { return false; }
  }).map(([code]) => code);
}

function buildCatalog() {
  const cats = new Map();
  const catFor = dimMap => {
    const key = dimKeyOf(dimMap);
    if (!cats.has(key)) {
      cats.set(key, { id: key, label: LABELS.find(l => l.key === key)?.label || key, dimMap: { ...dimMap }, entries: [] });
    }
    return cats.get(key);
  };

  for (const [id, meta] of Object.entries(BASE_UNITS)) {
    // Group by what the engine resolves the unit string to, not by the raw registry vector.
    catFor(getUnitAtomBag(meta.symbol).dimMap).entries.push({
      id, kind: "base", unit: meta.symbol, label: meta.symbol,
      subtitle: id.replace(/_/g, " "), prefixes: prefixCodesFor(id, meta.symbol)
    });
  }

  const baseSymbols = new Set(Object.values(BASE_UNITS).map(m => m.symbol));
  const seen = new Set();
  const presetSources = [];
  for (const sys of Object.values(DIMENSION_TOKEN_PALETTES)) {
    for (const [dim, list] of Object.entries(sys)) list.forEach(p => presetSources.push([p.unit, dim]));
  }
  PRESET_EXTRAS.forEach(u => presetSources.push([u, null]));
  for (const [unit, dim] of presetSources) {
    if (baseSymbols.has(unit) || seen.has(unit)) continue;
    const bag = getUnitAtomBag(unit, dim);
    if (bag.isUnknown) continue;
    seen.add(unit);
    catFor(bag.dimMap).entries.push({ id: `preset:${unit}`, kind: "preset", unit, label: unit, subtitle: "compound", prefixes: [] });
  }

  const order = k => { const i = LABELS.findIndex(l => l.key === k); return i < 0 ? 999 : i; };
  return [...cats.values()].sort((a, b) => order(a.id) - order(b.id));
}

const CATEGORIES = buildCatalog();
export const ENTRY_BY_ID = new Map();
const CATEGORY_INDEX_BY_ENTRY = new Map();
CATEGORIES.forEach((c, ci) => c.entries.forEach(e => { ENTRY_BY_ID.set(e.id, e); CATEGORY_INDEX_BY_ENTRY.set(e.id, ci); }));

export const getCategories = () => CATEGORIES;
export const categoryIndexOf = entryId => CATEGORY_INDEX_BY_ENTRY.get(entryId) ?? 0;

/** Chips: { entryId, prefix: code|null, power: positive number }. Sides: { num: Chip[], den: Chip[] }. */
export function chipsFromUnit(unit, dimension = null) {
  const num = [];
  const den = [];
  for (const a of parseUnitToSemanticAST(unit, dimension)) {
    if (!ENTRY_BY_ID.has(a.base)) return null;
    const chip = { entryId: a.base, prefix: a.prefix ? (CODE_BY_NAME[a.prefix] || null) : null, power: Math.abs(a.power) };
    (a.power > 0 ? num : den).push(chip);
  }
  return { num, den };
}

export function composeUnit({ num = [], den = [] }) {
  const atom = c => {
    const base = `${c.prefix || ""}${ENTRY_BY_ID.get(c.entryId).unit}`;
    return c.power === 1 ? base : `${base}^${c.power}`;
  };
  const n = num.map(atom).join("*");
  const d = den.map(atom).join("*");
  if (!n && !d) return "dimless";
  return d ? `${n || "1"}/(${d})` : n;
}

const refuse = (reason, extra = {}) => ({ ok: false, reason, ...extra });

export function buildConversion(fromUnit, toUnit, value = 1) {
  const a = getUnitAtomBag(fromUnit);
  const b = getUnitAtomBag(toUnit);
  if (a.isUnknown || b.isUnknown) return refuse("Unknown unit");
  if (!isDimEqual(a.dimMap, b.dimMap)) {
    return refuse("Dimensions differ", { fromDim: dimKeyOf(a.dimMap), toDim: dimKeyOf(b.dimMap) });
  }
  if ((a.kind === "point" && b.kind === "delta") || (a.kind === "delta" && b.kind === "point")) {
    return refuse(`Cannot convert affine temperature "${fromUnit}" to/from temperature difference "${toUnit}"`);
  }

  const result = convertUnitValue(value, fromUnit, toUnit);
  const v = fmtSigFig(value, 6, true);
  const out = { ok: true, result, resultTex: fmtSigFig(result, 6, true), toTex: unitToTex(toUnit, false), scalars: [], canonical: true };

  if (fromUnit === toUnit) return { ...out, kind: "identity", lhsTex: `${v} \\, ${unitToTex(fromUnit, false)}` };
  if (a.kind === "point" || b.kind === "point") {
    return { ...out, kind: "affine", lhsTex: buildTempConversionExpr(value, fromUnit, toUnit) };
  }
  if (Math.abs(a.scale / b.scale - 1) < 1e-6) {
    return { ...out, kind: "identity", lhsTex: `${v} \\, ${unitToTex(fromUnit, false)}` };
  }

  // Same gate as Section D of solveUnitAlgebra: pairwise only when every scalar is canonical.
  const conv = formatPairConversion(fromUnit, toUnit, null, null, "whole");
  let tex = conv.tex;
  let scalars = conv.scalars || [];
  let mode = conv.cancelledIndices || (conv.isDecomposed ? "component" : "whole");
  if (!scalars.every(isCanonicalScaleFactor)) {
    const compound = buildCompoundTokenConversions([{ tok: "x", uName: fromUnit, dim: null, exp: 1 }], toUnit, null);
    tex = (compound.conversionsByToken.x || []).join("") + (compound.globalConvTex || "");
    scalars = compound.scalars || [];
    const idx = compound.cancelledIndicesByToken?.x;
    mode = idx && idx.size > 0 ? idx : "whole";
  }
  return {
    ...out, kind: "factor", scalars, canonical: scalars.every(isCanonicalScaleFactor),
    lhsTex: `${v} \\, ${unitToCancelledTex(fromUnit, false, null, mode)}${tex}`
  };
}
