/**
 * src/core/unit_sampler.js
 * 40% SI / 40% US / 20% MIXED Unit Sampler with:
 * - Coupled State Variable Coherence (cycle temperatures and stream enthalpies
 *   belong to uniform, physically consistent unit systems)
 * - Exact affine temperature transformation (300 K = 26.85 °C = 80.33 °F = 540 °R)
 * - Inverse-token compound decomposition probability ($w_i = 1/t_i$)
 * - 3-significant-figure retention validation ($|v| >= 0.100$)
 */

import { getUnitAtomBag, isDimEqual, valueToCoherentBase, formatValueInUnit } from "../cas/units/definitions.js";
import { CONSTANTS_DB } from "./constants_registry.js";
import { DIMENSIONS } from "./dimensions.js";

export const DIMENSION_TOKEN_PALETTES = Object.freeze({
  SI: {
    [DIMENSIONS.LENGTH]: [
      { unit: "mm", tokens: 1 },
      { unit: "cm", tokens: 1 },
      { unit: "m", tokens: 1 }
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
    [DIMENSIONS.ENERGY]: [
      { unit: "kJ", tokens: 1 },
      { unit: "J", tokens: 1 },
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
    [DIMENSIONS.VOLUME_FLOW]: [
      { unit: "m^3/s", tokens: 2 },
      { unit: "m^3/h", tokens: 2 },
      { unit: "L/h", tokens: 2 }
    ],
    [DIMENSIONS.TEMPERATURE]: [
      { unit: "K", tokens: 1 },
      { unit: "°C", tokens: 1 }
    ],
    [DIMENSIONS.TEMPERATURE_DIFF]: [
      { unit: "°C", tokens: 1 },
      { unit: "K", tokens: 1 }
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
    [DIMENSIONS.FORCE]: [
      { unit: "lb", tokens: 1 },
      { unit: "kip", tokens: 1 }
    ],
    [DIMENSIONS.PRESSURE]: [
      { unit: "psi", tokens: 1 },
      { unit: "lb/in^2", tokens: 2 },
      { unit: "psf", tokens: 1 },
      { unit: "lb/ft^2", tokens: 2 },
      { unit: "ksi", tokens: 1 }
    ],
    [DIMENSIONS.STRESS]: [
      { unit: "psi", tokens: 1 },
      { unit: "lb/in^2", tokens: 2 },
      { unit: "ksi", tokens: 1 }
    ],
    [DIMENSIONS.POWER]: [
      { unit: "hp", tokens: 1 },
      { unit: "Btu/min", tokens: 2 },
      { unit: "Btu/h", tokens: 2 },
      { unit: "ft-lb/s", tokens: 3 },
      { unit: "ft-lb/min", tokens: 3 }
    ],
    [DIMENSIONS.TORQUE]: [
      { unit: "lb-in", tokens: 2 },
      { unit: "lb-ft", tokens: 2 }
    ],
    [DIMENSIONS.ENERGY]: [
      { unit: "Btu", tokens: 1 }
    ],
    [DIMENSIONS.SPECIFIC_ENERGY]: [
      { unit: "Btu/lb", tokens: 2 }
    ],
    [DIMENSIONS.MASS_FLOW]: [
      { unit: "lb/s", tokens: 2 },
      { unit: "lb/min", tokens: 2 },
      { unit: "lb/h", tokens: 2 }
    ],
    [DIMENSIONS.VELOCITY]: [
      { unit: "ft/min", tokens: 2 },
      { unit: "ft/s", tokens: 2 }
    ],
    [DIMENSIONS.VOLUME]: [
      { unit: "ft^3", tokens: 1 }
    ],
    [DIMENSIONS.VOLUME_FLOW]: [
      { unit: "cfm", tokens: 1 }
    ],
    [DIMENSIONS.TEMPERATURE]: [
      { unit: "°F", tokens: 1 },
      { unit: "°R", tokens: 1 }
    ],
    [DIMENSIONS.TEMPERATURE_DIFF]: [
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

export function retainsSufficientSigFigs(convertedValue) {
  if (typeof convertedValue !== "number" || isNaN(convertedValue)) return false;
  const abs = Math.abs(convertedValue);
  if (abs === 0) return true;
  return abs >= 0.0995 && abs <= 9.99e6;
}

export function sampleConstantUnit(varKey, sys = "SI") {
  const meta = CONSTANTS_DB[varKey];
  if (!meta) return null;

  if (varKey === "c_pw") {
    return sys === "US"
      ? { unit: "Btu/(lb*F)", value: 1.0 }
      : { unit: "kJ/kg-K", value: 4.187 };
  }
  if (varKey === "c_pa") {
    return sys === "US"
      ? { unit: "Btu/(lb*F)", value: 0.24 }
      : { unit: "kJ/kg-K", value: 1.0062 };
  }
  if (varKey === "g") {
    return sys === "US"
      ? { unit: "ft/s^2", value: 32.2 }
      : { unit: "m/s^2", value: 9.81 };
  }
  return sys === "US"
    ? { unit: meta.unitUS || meta.unit, value: meta.valueUS }
    : { unit: meta.unitSI || meta.unit, value: meta.valueSI };
}

/**
 * Recognizes coupled state variables that must share the same physical unit in any problem:
 * - Cycle state temperatures (e.g. T_1, T_2, T_3, T_4 in Diesel cycle or t_o, t_r, t_m, t_s in Air handling)
 * - Stream specific energies / enthalpies (e.g. h_o, h_r, h_m, h_s or q_A, q_R, w_net)
 * - Cooling tower temperatures and range/approach differences
 * - Heat balance percentage shares
 */
const COUPLED_VARIABLE_GROUPS = Object.freeze([
  new Set(["T_1", "T_2", "T_3", "T_4"]),
  new Set(["t_o", "t_r", "t_m", "t_s", "t_adp", "t_rh"]),
  new Set(["h_o", "h_r", "h_m", "h_s", "h_adp", "h_rh"]),
  new Set(["Q_A", "Q_R", "W_net"]),
  new Set(["Q_ip", "Q_cw", "Q_exh", "Q_rad"]),
  new Set(["t_w1", "t_w2", "t_wb1", "R_ct", "A_ct"]),
  new Set(["pct_ip", "pct_cw", "pct_exh", "pct_rad"])
]);

function findCoupledGroup(varKey) {
  for (const grp of COUPLED_VARIABLE_GROUPS) {
    if (grp.has(varKey)) return grp;
  }
  return null;
}

/**
 * Master Problem Unit System & Intra-System Variational Sampler.
 * Guarantees state point coherence, exact affine offsets, and 3-sig-fig retention.
 */
export function applyProblemUnitSampling(S, varsDb = {}, forcedMode = null) {
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

    // Preserve coupled state variable integrity: all members of a coupled group
    // must land in the same system (SI or US)
    COUPLED_VARIABLE_GROUPS.forEach(grp => {
      const activeMembers = Array.from(grp).filter(k => dimensionalKeys.includes(k));
      if (activeMembers.length > 1) {
        const primarySys = usKeys.has(activeMembers[0]) ? "US" : "SI";
        activeMembers.forEach(k => {
          if (primarySys === "US") {
            usKeys.add(k);
            siKeys.delete(k);
          } else {
            siKeys.add(k);
            usKeys.delete(k);
          }
        });
      }
    });
  } else if (mode === "US") {
    usKeys = new Set(dimensionalKeys);
  } else {
    siKeys = new Set(dimensionalKeys);
  }

  // Track unit assigned to coupled groups so all group members share the identical unit
  const groupUnitMap = new Map();

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

    const isDiff = meta.dimension === DIMENSIONS.TEMPERATURE_DIFF || !!meta.isDifference;

    // 2. Check if this variable belongs to an already-sampled coupled state group
    const grp = findCoupledGroup(k);
    if (grp && groupUnitMap.has(grp)) {
      const coupledUnit = groupUnitMap.get(grp);
      const coherentVal = valueToCoherentBase(S[k], canonUnit, isDiff);
      const convertedVal = formatValueInUnit(coherentVal, coupledUnit, isDiff);
      S[k] = convertedVal;
      S._u[k] = coupledUnit;
      return;
    }

    const canonBag = getUnitAtomBag(canonUnit);
    const canonVal = S[k];
    const coherentVal = valueToCoherentBase(canonVal, canonUnit, isDiff);

    let palette = DIMENSION_TOKEN_PALETTES[targetSys]?.[meta.dimension] || [];

    // Special thermodynamic constraint: ideal gas cycles (with K base) require absolute temperature (K or °R)
    if (canonUnit === "K" && meta.dimension === DIMENSIONS.TEMPERATURE) {
      palette = targetSys === "US"
        ? [{ unit: "°R", tokens: 1 }]
        : [{ unit: "K", tokens: 1 }];
    }

    const validCandidates = palette.filter(p => {
      const b = getUnitAtomBag(p.unit);
      return isDimEqual(canonBag.dimMap, b.dimMap);
    });

    if (validCandidates.length === 0) return;

    const shuffledCandidates = [...validCandidates].sort(() => Math.random() - 0.5);
    let chosenUnit = null;

    for (const cand of shuffledCandidates) {
      const candVal = formatValueInUnit(coherentVal, cand.unit, isDiff);
      if (retainsSufficientSigFigs(candVal)) {
        chosenUnit = cand.unit;
        S[k] = candVal;
        S._u[k] = cand.unit;
        break;
      }
    }

    if (chosenUnit) {
      if (grp) groupUnitMap.set(grp, chosenUnit);
    } else {
      S._u[k] = canonUnit;
    }
  });

  S.sys = mode;
  return S;
}
