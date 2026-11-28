/**
 * src/core/unit_sampler.js
 * 40% SI / 40% US / 20% MIXED Unit Sampler with:
 * - Uncoupled Givens (any given variable can freely roll valid units)
 * - Inverse-token compound decomposition probability ($w_i = 1/t_i$)
 * - 3-significant-figure retention validation ($|v| >= 0.100$)
 */

import {
  BASE_UNITS, PREFIXES, parseUnitToSemanticAST,
  getUnitAtomBag, getUnitKind, toDeltaUnit, isDimEqual,
  valueToCoherentBase, formatValueInUnit, convertUnitValue
} from "../cas/units/definitions.js";
import { formatPairConversion, isCanonicalScaleFactor } from "../cas/units/scales.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { DIMENSIONS } from "./dimensions.js";

export const DIMENSION_TOKEN_PALETTES = Object.freeze({
  SI: {
    [DIMENSIONS.LENGTH]: [
      { unit: "mm", tokens: 1 },
      { unit: "cm", tokens: 1 },
      { unit: "m", tokens: 1 }
    ],
    [DIMENSIONS.AREA]: [
      { unit: "mm^2", tokens: 1 },
      { unit: "cm^2", tokens: 1 },
      { unit: "m^2", tokens: 1 }
    ],
    [DIMENSIONS.SECOND_MOMENT_OF_AREA]: [
      { unit: "mm^4", tokens: 1 },
      { unit: "cm^4", tokens: 1 },
      { unit: "m^4", tokens: 1 }
    ],
    [DIMENSIONS.THERMAL_EXPANSION]: [
      { unit: "um/(m*Δ°C)", tokens: 3 },
      { unit: "um/(m*ΔK)", tokens: 3 }
    ],
    [DIMENSIONS.FORCE]: [
      { unit: "N", tokens: 1 },
      { unit: "kN", tokens: 1 },
      { unit: "kg*m/s^2", tokens: 4 }
    ],
    [DIMENSIONS.PRESSURE]: [
      { unit: "kPa", tokens: 1 },
      { unit: "kN/m^2", tokens: 2 },
      { unit: "bar", tokens: 1 },
      { unit: "MPa", tokens: 1 },
      { unit: "N/mm^2", tokens: 2 },
      { unit: "Pa", tokens: 1 },
      { unit: "N/m^2", tokens: 2 }
    ],
    [DIMENSIONS.STRESS]: [
      { unit: "MPa", tokens: 1 },
      { unit: "N/mm^2", tokens: 2 },
      { unit: "kPa", tokens: 1 },
      { unit: "bar", tokens: 1 }
    ],
    [DIMENSIONS.MODULUS]: [
      { unit: "GPa", tokens: 1 },
      { unit: "MPa", tokens: 1 },
      { unit: "N/mm^2", tokens: 2 }
    ],
    [DIMENSIONS.STIFFNESS]: [
      { unit: "N/mm", tokens: 2 },
      { unit: "kN/m", tokens: 2 },
      { unit: "N/m", tokens: 2 },
      { unit: "kgf/mm", tokens: 3 }
    ],
    [DIMENSIONS.TIME]: [
      { unit: "s", tokens: 1 },
      { unit: "ms", tokens: 1 },
      { unit: "min", tokens: 1 }
    ],
    [DIMENSIONS.FREQUENCY]: [
      { unit: "Hz", tokens: 1 },
      { unit: "kHz", tokens: 1 }
    ],
    [DIMENSIONS.ACCELERATION]: [
      { unit: "m/s^2", tokens: 2 }
    ],
    [DIMENSIONS.POWER]: [
      { unit: "kW", tokens: 1 },
      { unit: "kJ/s", tokens: 2 },
      { unit: "W", tokens: 1 },
      { unit: "J/s", tokens: 2 },
      { unit: "N-m/s", tokens: 3 },
      { unit: "kg*m^2/s^3", tokens: 6 }
    ],
    [DIMENSIONS.TORQUE]: [
      { unit: "N-m", tokens: 2 },
      { unit: "kN-m", tokens: 2 },
      { unit: "J", tokens: 1 }
    ],
    [DIMENSIONS.MASS]: [
      { unit: "kg", tokens: 1 },
      { unit: "g", tokens: 1 }
    ],
    [DIMENSIONS.ENERGY]: [
      { unit: "kJ", tokens: 1 },
      { unit: "J", tokens: 1 },
      { unit: "N-m", tokens: 2 },
      { unit: "kWh", tokens: 1 }
    ],
    [DIMENSIONS.SPECIFIC_ENERGY]: [
      { unit: "kJ/kg", tokens: 2 }
    ],
    [DIMENSIONS.MASS_FLOW]: [
      { unit: "kg/s", tokens: 2 },
      { unit: "kg/min", tokens: 2 },
      { unit: "kg/h", tokens: 2 },
      { unit: "g/s", tokens: 2 }
    ],
    [DIMENSIONS.VELOCITY]: [
      { unit: "m/s", tokens: 2 },
      { unit: "m/min", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME]: [
      { unit: "m^3", tokens: 1 },
      { unit: "L", tokens: 1 }
    ],
    [DIMENSIONS.DENSITY]: [
      { unit: "kg/m^3", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME_FLOW]: [
      { unit: "m^3/s", tokens: 2 },
      { unit: "m^3/h", tokens: 2 },
      { unit: "L/s", tokens: 2 },
      { unit: "L/h", tokens: 2 }
    ],
    [DIMENSIONS.TEMPERATURE]: [
      { unit: "K", tokens: 1 },
      { unit: "°C", tokens: 1 }
    ],
    [DIMENSIONS.PERCENTAGE]: [
      { unit: "%", tokens: 1 }
    ]
  },
  US: {
    [DIMENSIONS.LENGTH]: [
      { unit: "in", tokens: 1 },
      { unit: "ft", tokens: 1 },
      { unit: "yd", tokens: 1 }
    ],
    [DIMENSIONS.AREA]: [
      { unit: "in^2", tokens: 1 },
      { unit: "ft^2", tokens: 1 }
    ],
    [DIMENSIONS.SECOND_MOMENT_OF_AREA]: [
      { unit: "in^4", tokens: 1 }
    ],
    [DIMENSIONS.THERMAL_EXPANSION]: [
      { unit: "uin/(in*Δ°F)", tokens: 3 },
      { unit: "uin/(in*Δ°R)", tokens: 3 }
    ],
    [DIMENSIONS.FORCE]: [
      { unit: "lb_f", tokens: 1 },
      { unit: "kip", tokens: 1 }
    ],
    [DIMENSIONS.PRESSURE]: [
      { unit: "psi", tokens: 1 },
      { unit: "lb_f/in^2", tokens: 2 },
      { unit: "psf", tokens: 1 },
      { unit: "lb_f/ft^2", tokens: 2 },
      { unit: "ksi", tokens: 1 }
    ],
    [DIMENSIONS.STRESS]: [
      { unit: "psi", tokens: 1 },
      { unit: "lb_f/in^2", tokens: 2 },
      { unit: "ksi", tokens: 1 }
    ],
    [DIMENSIONS.MODULUS]: [
      { unit: "ksi", tokens: 1 },
      { unit: "psi", tokens: 1 },
      { unit: "lb_f/in^2", tokens: 2 }
    ],
    [DIMENSIONS.STIFFNESS]: [
      { unit: "lb_f/in", tokens: 2 },
      { unit: "lb_f/ft", tokens: 2 },
      { unit: "kip/in", tokens: 2 }
    ],
    [DIMENSIONS.TIME]: [
      { unit: "s", tokens: 1 },
      { unit: "ms", tokens: 1 },
      { unit: "min", tokens: 1 }
    ],
    [DIMENSIONS.FREQUENCY]: [
      { unit: "Hz", tokens: 1 },
      { unit: "kHz", tokens: 1 }
    ],
    [DIMENSIONS.ACCELERATION]: [
      { unit: "ft/s^2", tokens: 2 },
      { unit: "in/s^2", tokens: 2 }
    ],
    [DIMENSIONS.MASS]: [
      { unit: "lb_m", tokens: 1 }
    ],
    [DIMENSIONS.POWER]: [
      { unit: "hp", tokens: 1 },
      { unit: "Btu/min", tokens: 2 },
      { unit: "Btu/h", tokens: 2 },
      { unit: "ft-lb_f/s", tokens: 3 },
      { unit: "ft-lb_f/min", tokens: 3 }
    ],
    [DIMENSIONS.TORQUE]: [
      { unit: "lb_f-in", tokens: 2 },
      { unit: "lb_f-ft", tokens: 2 }
    ],
    [DIMENSIONS.ENERGY]: [
      { unit: "in-lb_f", tokens: 2 },
      { unit: "ft-lb_f", tokens: 2 },
      { unit: "Btu", tokens: 1 }
    ],
    [DIMENSIONS.SPECIFIC_ENERGY]: [
      { unit: "Btu/lb_m", tokens: 2 }
    ],
    [DIMENSIONS.MASS_FLOW]: [
      { unit: "lb_m/s", tokens: 2 },
      { unit: "lb_m/min", tokens: 2 },
      { unit: "lb_m/h", tokens: 2 }
    ],
    [DIMENSIONS.VELOCITY]: [
      { unit: "ft/min", tokens: 2 },
      { unit: "ft/s", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME]: [
      { unit: "ft^3", tokens: 1 }
    ],
    [DIMENSIONS.DENSITY]: [
      { unit: "lb_m/ft^3", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME_FLOW]: [
      { unit: "cfm", tokens: 1 },
      { unit: "gpm", tokens: 1 },
      { unit: "ft^3/s", tokens: 2 }
    ],
    [DIMENSIONS.TEMPERATURE]: [
      { unit: "°F", tokens: 1 },
      { unit: "°R", tokens: 1 }
    ],
    [DIMENSIONS.PERCENTAGE]: [
      { unit: "%", tokens: 1 }
    ]
  }
});

export function sampleSystemMode(requestedSys = null) {
  if (requestedSys === "SI" || requestedSys === "US" || requestedSys === "MIXED") {
    return requestedSys;
  }
  const r = Math.random();
  if (r < 0.40) return "SI";
  if (r < 0.80) return "US";
  return "MIXED";
}

export function sampleByInverseTokens(candidateList = []) {
  if (!candidateList || candidateList.length === 0) return null;
  if (candidateList.length === 1) return candidateList[0].unit;

  const weights = candidateList.map(c => 1.0 / Math.max(1, c.tokens || 1));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidateList.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidateList[i].unit;
  }
  return candidateList[candidateList.length - 1].unit;
}

import { MIN_DISPLAY_MAGNITUDE } from "./dimensions.js";

export function retainsSufficientSigFigs(convertedValue) {
  if (typeof convertedValue !== "number" || isNaN(convertedValue)) return false;
  const abs = Math.abs(convertedValue);
  if (abs === 0) return true;
  return abs >= MIN_DISPLAY_MAGNITUDE && abs <= 9.99e6;
}

/**
 * Cleanliness grid: at most 2 significant digits, or 3 when the last is 5
 * (step = leading-decade / 20). Idempotent; snapClean(snapClean(x)) === snapClean(x).
 */
export function snapClean(x) {
  if (!Number.isFinite(x) || x === 0) return x;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(x))));
  const step = mag / 20;
  return Number((Math.round(x / step) * step).toPrecision(3));
}

/**
 * Plans display units for every root variable (varsDb entries declaring
 * `typical: [lo, hi]` in their canonical `unit`) BEFORE createSystem runs.
 * A candidate unit is accepted when the typical-range midpoint stays readable
 * in it; otherwise the canonical unit is kept.
 */
export function candidateUnitsFor(sys, dimension, canonUnit) {
  const palette = DIMENSION_TOKEN_PALETTES[sys]?.[dimension] || [];
  const canonBag = getUnitAtomBag(canonUnit, dimension);
  if (canonBag.kind === "delta") {
    return palette
      .map(p => ({ ...p, unit: toDeltaUnit(p.unit) }))
      .filter(p => {
        const b = getUnitAtomBag(p.unit, dimension);
        return b.kind === "delta" && isDimEqual(canonBag.dimMap, b.dimMap);
      });
  }
  return palette.filter(p => {
    const b = getUnitAtomBag(p.unit, dimension);
    return b.kind === canonBag.kind && isDimEqual(canonBag.dimMap, b.dimMap);
  });
}

const US_HINT_RE = /\b(in|ft|yd|lb|lb_f|lb_m|kip|psi|psf|ksi|hp|Btu|cfm|gpm|gal|uin)\b|°F|°R/;

export function inferUnitSystem(unitStr, fallbackSys = "SI") {
  if (fallbackSys === "SI" || fallbackSys === "US") return fallbackSys;
  return US_HINT_RE.test(unitStr || "") ? "US" : "SI";
}

function prefixedScaleCandidates(currUnit, dimension, direction) {
  const ast = parseUnitToSemanticAST(currUnit, dimension);
  if (ast.length !== 1 || ast[0].power !== 1) return [];
  const baseMeta = BASE_UNITS[ast[0].base];
  if (!baseMeta || !baseMeta.prefixes) return [];
  const prefixPool = direction === "smaller" ? ["d", "c", "m", "u"] : ["k", "M", "G"];
  const out = [];
  for (const code of prefixPool) {
    if (!baseMeta.prefixes.includes(code)) continue;
    const cand = `${code}${baseMeta.symbol}`;
    if (cand === currUnit) continue;
    const bag = getUnitAtomBag(cand, dimension);
    if (bag.isUnknown || !PREFIXES[code]) continue;
    out.push(cand);
  }
  return out;
}

function collectOrderedScaleUnits(currUnit, dimension, sysMode, direction) {
  if (!currUnit || currUnit === "dimless" || currUnit === "ratio" || !dimension) return [];
  const currBag = getUnitAtomBag(currUnit, dimension);
  if (currBag.isUnknown || currBag.kind === "point" || currBag.isDimensionless) return [];

  const unitSys = inferUnitSystem(currUnit, sysMode);
  const pool = new Set(candidateUnitsFor(unitSys, dimension, currUnit).map(p => p.unit));

  if (dimension === DIMENSIONS.SECTION_MODULUS && unitSys === "SI") {
    pool.add("cm^3");
    pool.add("mm^3");
  } else if (dimension === DIMENSIONS.SECOND_MOMENT_OF_AREA && unitSys === "SI") {
    pool.add("cm^4");
    pool.add("mm^4");
  }
  for (const pUnit of prefixedScaleCandidates(currUnit, dimension, direction)) {
    pool.add(pUnit);
  }

  const valid = [];
  for (const u of pool) {
    if (u === currUnit) continue;
    const bag = getUnitAtomBag(u, dimension);
    if (bag.isUnknown || bag.kind !== currBag.kind || !isDimEqual(currBag.dimMap, bag.dimMap)) continue;
    const isMatch = direction === "smaller"
      ? bag.scale < currBag.scale * (1 - 1e-6)
      : bag.scale > currBag.scale * (1 + 1e-6);
    if (!isMatch) continue;
    const conv = formatPairConversion(currUnit, u, dimension, dimension, "whole");
    if (conv.scalars && !conv.scalars.every(isCanonicalScaleFactor)) continue;
    valid.push({ unit: u, scale: bag.scale });
  }

  // Prefer the minimal step from the current scale first (descending for smaller, ascending for larger).
  valid.sort((a, b) => direction === "smaller" ? b.scale - a.scale : a.scale - b.scale);
  return valid.map(v => v.unit);
}

export function smallerUnitsFor(currUnit, dimension, sysMode = "SI") {
  return collectOrderedScaleUnits(currUnit, dimension, sysMode, "smaller");
}

export function largerUnitsFor(currUnit, dimension, sysMode = "SI") {
  return collectOrderedScaleUnits(currUnit, dimension, sysMode, "larger");
}

export function planProblemUnits(varsDb = {}, forcedMode = null) {
  const mode = sampleSystemMode(forcedMode);
  const roots = Object.keys(varsDb).filter(k => {
    const m = varsDb[k] || {};
    return Array.isArray(m.typical) && m.unit && m.dimension &&
      m.dimension !== DIMENSIONS.DIMENSIONLESS && !m.isAbstract;
  });
  const shuffled = [...roots].sort(() => Math.random() - 0.5);
  const usCount = mode === "US" ? shuffled.length
    : mode === "MIXED" ? shuffled.length - Math.floor(shuffled.length / 2) : 0;
  const plan = {};
  shuffled.forEach((k, i) => {
    const meta = varsDb[k];
    const mid = valueToCoherentBase((meta.typical[0] + meta.typical[1]) / 2, meta.unit, meta.dimension);
    const candidates = candidateUnitsFor(i < usCount ? "US" : "SI", meta.dimension, meta.unit);
    const chosen = [...candidates]
      .sort(() => Math.random() - 0.5)
      .find(p => retainsSufficientSigFigs(formatValueInUnit(mid, p.unit, meta.dimension)));
    plan[k] = chosen ? chosen.unit : meta.unit;
  });
  return plan;
}

/**
 * Clean-number draw for system.js. Samples the variable's typical range in its
 * PLANNED display unit, snaps to the cleanliness grid, and returns the value in
 * the canonical unit, so display and ground truth can never diverge.
 * bounds {lo, hi} (canonical units) narrow the range, e.g. t_wb below t_db.
 */
export function makeDraw(unitPlan = {}, varsDb = {}, rng = Math.random) {
  return function draw(key, bounds = {}) {
    const meta = varsDb[key] || {};
    if (!Array.isArray(meta.typical)) throw new Error(`draw(${key}): varsDb entry needs typical: [lo, hi]`);
    const lo = bounds.lo ?? meta.typical[0];
    const hi = bounds.hi ?? meta.typical[1];
    if (!(hi > lo)) throw new Error(`draw(${key}): empty range [${lo}, ${hi}]`);
    const shown = unitPlan[key] || meta.unit;
    const toShown = v => convertUnitValue(v, meta.unit, shown, meta.dimension);
    const toCanon = v => convertUnitValue(v, shown, meta.unit, meta.dimension);
    const [a, b] = [toShown(lo), toShown(hi)].sort((x, y) => x - y);
    const clean = Math.min(snapClean(b), Math.max(snapClean(a), snapClean(a + rng() * (b - a))));
    return toCanon(clean);
  };
}

export function sampleConstantUnit(varKey, sys = "SI") {
  const meta = CONSTANTS_DB[varKey];
  if (!meta) return null;

  return sys === "US"
    ? { unit: meta.unitUS || meta.unit, value: meta.valueUS }
    : { unit: meta.unitSI || meta.unit, value: meta.valueSI };
}

/**
 * Recognizes coupled state variables that must share the same physical unit in any problem
 * IF they end up as required deliverables. Givens are completely uncoupled and free to roll.
 */
export const COUPLED_VARIABLE_GROUPS = Object.freeze([
  new Set(["T_1", "T_2", "T_3", "T_4"]),
  new Set(["t_o", "t_r", "t_m", "t_s", "t_adp", "t_rh"]),
  new Set(["h_o", "h_r", "h_m", "h_s", "h_adp", "h_rh"]),
  new Set(["Q_A", "Q_R", "W_net"]),
  new Set(["Q_ip", "Q_cw", "Q_exh", "Q_rad"]),
  new Set(["t_w1", "t_w2", "t_wb1", "R_ct", "A_ct"]),
  new Set(["h_1", "h_2"]),
  new Set(["m_w", "m_evap", "m_bd", "m_drift", "m_mu"]),
  new Set(["t_a1", "t_a2"]),
  new Set(["M_w1", "M_w2"]),
  new Set(["m_f", "m_p", "m_s", "m_w"]),
  new Set(["Q_h", "Q_evap"]),
  new Set(["pct_ip", "pct_cw", "pct_exh", "pct_rad"]),
  new Set(["phi_n", "phi_t", "psi"]),
  new Set(["p_n", "p_t", "p_x"]),
  new Set(["W_t", "F_a", "F_r", "F_N"]),
  new Set(["D_o", "D_i", "D_m", "R_m", "d_w", "FL", "SL", "OL", "delta", "delta_solid"]),
  new Set(["F_1", "F_2", "F_3", "F_4"]),
  new Set(["delta_1", "delta_2", "delta_3", "delta_4"]),
  new Set(["k_1", "k_2", "k_3", "k_4"]),
  new Set(["T_i", "T_f"]),
  new Set(["sigma_1", "sigma_2", "sigma_3"]),
  new Set(["sigma_xp", "sigma_yp", "tau_xyp"]),
  new Set(["sigma_max", "sigma_min", "sigma_a", "sigma_m"]),
  new Set(["p_i", "p_o", "P_des", "sigma_h", "sigma_L", "sigma_s", "sigma_t_i", "sigma_t_o", "sigma_r_i", "tau_max_in", "tau_max", "tau_max_i", "S_allow"]),
  new Set(["D_i", "D_o", "D_m", "r_i", "r_o", "r_m", "t", "L", "c_a", "t_nom", "t_cyl_h", "t_cyl_L", "t_hemi", "t_ellip", "t_tori", "L_c", "t_cone", "t_flat", "d_c"]),
  new Set(["delta_D", "delta_L", "u_o", "delta_D_o"]),
  new Set(["R_Av", "R_Bv", "R_Ah", "R_Bh", "R_A", "R_B"]),
  new Set(["M_h", "M_v", "M_v1", "M_h1", "M_1", "M_v2", "M_h2", "M_2", "M_f", "T_e", "M_e"]),
  new Set(["d_1", "d_2", "d_3", "d_eq", "d_str", "d_rig", "d_rig_T", "d_str_T", "d_o", "d_i"]),
  new Set(["delta_v", "delta_h", "delta_tip", "delta_allow"]),
  new Set(["theta_1", "theta_2", "theta_3", "theta_tot", "theta_A", "theta_B", "theta_tip", "theta_allow"]),
  new Set(["sigma_vm_a", "sigma_vm_m", "tau_a", "tau_m", "sigma_comb", "sigma_nom", "tau_nom"]),
  new Set(["f_1", "f_2", "f_D", "f_R", "f_op", "f_nt", "f_cr"]),
  new Set(["I_m1", "I_m2", "I_eq"])
]);

export function findCoupledGroup(varKey) {
  for (const grp of COUPLED_VARIABLE_GROUPS) {
    if (grp.has(varKey)) return grp;
  }
  return null;
}

/**
 * Master Problem Unit System & Intra-System Variational Sampler.
 * Guarantees exact affine offsets and 3-sig-fig retention.
 * Deliberately removes constraints to allow "givens" to roll any valid physical unit.
 */
export function applyProblemUnitSampling(S, varsDb = {}, forcedMode = null, unitPlan = {}) {
  if (!S || !S._u) return S;

  const mode = sampleSystemMode(forcedMode);
  const dimensionalKeys = Object.keys(varsDb).filter(k => {
    const meta = varsDb[k] || {};
    return meta.dimension &&
      meta.dimension !== DIMENSIONS.DIMENSIONLESS &&
      !meta.isAbstract &&
      typeof S[k] === "number" &&
      !isNaN(S[k]);
  });

  let siKeys = new Set();
  let usKeys = new Set();

  if (mode === "MIXED") {
    const shuffled = [...dimensionalKeys].sort(() => Math.random() - 0.5);
    const half = Math.floor(shuffled.length / 2);
    siKeys = new Set(shuffled.slice(0, half));
    usKeys = new Set(shuffled.slice(half));
  } else if (mode === "US") {
    usKeys = new Set(dimensionalKeys);
  } else {
    siKeys = new Set(dimensionalKeys);
  }

  dimensionalKeys.forEach(k => {
    const meta = varsDb[k] || {};
    const targetSys = usKeys.has(k) ? "US" : "SI";

    // 1. Physical Constants: roll between recognizable textbook figures
    if (meta.isConstant || CONSTANTS_DB[k]) {
      const cRes = sampleConstantUnit(k, targetSys);
      if (cRes) {
        S._u[k] = cRes.unit;
        S[k] = cRes.value;
      }
      return;
    }

    const canonUnit = S._u[k] || meta.unit;
    if (!canonUnit || canonUnit === "dimless" || canonUnit === "ratio" || canonUnit === "°" || canonUnit === "deg") {
      return;
    }

    const canonVal = S[k];
    const coherentVal = valueToCoherentBase(canonVal, canonUnit, meta.dimension);

    // Root variables drawn clean in their planned unit: convert, never re-choose.
    const plannedUnit = unitPlan[k];
    if (plannedUnit) {
      S[k] = formatValueInUnit(coherentVal, plannedUnit, meta.dimension);
      S._u[k] = plannedUnit;
      return;
    }

    const validCandidates = candidateUnitsFor(targetSys, meta.dimension, canonUnit);
    if (validCandidates.length === 0) return;

    const shuffledCandidates = [...validCandidates].sort(() => Math.random() - 0.5);
    let chosenUnit = null;

    for (const cand of shuffledCandidates) {
      const candVal = formatValueInUnit(coherentVal, cand.unit, meta.dimension);
      if (retainsSufficientSigFigs(candVal)) {
        chosenUnit = cand.unit;
        S[k] = candVal;
        S._u[k] = cand.unit;
        break;
      }
    }

    if (!chosenUnit) {
      S._u[k] = canonUnit;
    }
  });

  S.sys = mode;
  return S;
}
