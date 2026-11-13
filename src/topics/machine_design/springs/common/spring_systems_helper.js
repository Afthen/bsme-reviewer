/**
 * src/topics/machine_design/springs/common/spring_systems_helper.js
 * Shared variadic continued-formula specs & ground truth for Series and Parallel springs.
 */

import { DIMENSIONS } from "../../../../core/dimensions.js";
import { defineRelation, compileRelations, expandIndexedVarsDb } from "../../../../core/relation_builder.js";
import { buildVarNames, pickRandom } from "./spring_system_utils.js";

const SYSTEM_BASE_VARS = Object.freeze({
  F_T: {
    name: "Total System Load",
    symbol: "F_T",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    aliases: ["Total System Load", "Applied System Force", "F_T"]
  },
  delta_T: {
    name: "Total System Deflection",
    symbol: "\\delta_T",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Total System Deflection", "Total Travel", "delta_T"]
  },
  k_T: {
    name: "Equivalent Spring Rate",
    symbol: "k_T",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    aliases: ["Equivalent Spring Rate", "Effective Stiffness", "Total Spring Rate", "k_T"]
  }
});

const SYSTEM_INDEXED_VARS = Object.freeze({
  k_i: {
    name: "Spring {i} Rate",
    symbol: "k_{i}",
    dimension: DIMENSIONS.STIFFNESS,
    unit: "N/mm",
    aliases: ["Spring {i} Rate", "Spring {i} Stiffness", "k_{i}"]
  },
  F_i: {
    name: "Spring {i} Load",
    symbol: "F_{i}",
    dimension: DIMENSIONS.FORCE,
    unit: "N",
    aliases: ["Spring {i} Load", "Force on Spring {i}", "F_{i}"]
  },
  delta_i: {
    name: "Spring {i} Deflection",
    symbol: "\\delta_{i}",
    dimension: DIMENSIONS.LENGTH,
    unit: "mm",
    aliases: ["Spring {i} Deflection", "Travel of Spring {i}", "delta_{i}"]
  }
});

const SYS_RATE_REL = defineRelation({
  id: "eq_base_spring_system_rate",
  name: "System Spring Rate",
  formula: "k_T = F_T / delta_T"
});

const SERIES_SPECS = Object.freeze([
  defineRelation({ id: "eq_springs_series_force_chain", name: "Series Force Equality", formula: "F_T = chain(F_i)" }),
  defineRelation({ id: "eq_springs_series_defl_i", name: "Individual Spring Deflection (Series)", formula: "delta_i = F_T / k_i" }),
  defineRelation({ id: "eq_springs_series_defl_sum", name: "Total Deflection (Series)", formula: "delta_T = sum(delta_i)" }),
  defineRelation({ id: "eq_springs_series_defl_rate", name: "Total Deflection from Rates (Series)", formula: "delta_T = sum(F_T / k_i)" }),
  defineRelation({ id: "eq_springs_series_stiffness", name: "Equivalent Spring Rate (Series)", formula: "1 / k_T = sum(1 / k_i)" }),
  SYS_RATE_REL
]);

const PARALLEL_SPECS = Object.freeze([
  defineRelation({ id: "eq_springs_parallel_defl_chain", name: "Parallel Deflection Equality", formula: "delta_T = chain(delta_i)" }),
  defineRelation({ id: "eq_springs_parallel_force_i", name: "Individual Spring Load (Parallel)", formula: "F_i = k_i * delta_T" }),
  defineRelation({ id: "eq_springs_parallel_force_sum", name: "Total Load (Parallel)", formula: "F_T = sum(F_i)" }),
  defineRelation({ id: "eq_springs_parallel_force_rate", name: "Total Load from Rates (Parallel)", formula: "F_T = sum(k_i * delta_T)" }),
  defineRelation({ id: "eq_springs_parallel_stiffness", name: "Equivalent Spring Rate (Parallel)", formula: "k_T = sum(k_i)" }),
  SYS_RATE_REL
]);

export function buildSpringNetworkSchema(count = 3) {
  return expandIndexedVarsDb(SYSTEM_BASE_VARS, SYSTEM_INDEXED_VARS, count);
}

export function buildSpringNetworkRelations(mode = "series", count = 3) {
  const specs = mode === "series" ? SERIES_SPECS : PARALLEL_SPECS;
  return compileRelations(specs, { varsDb: buildSpringNetworkSchema(count), count });
}

export function createSpringNetworkSystem({ sys = "SI", mode = "series", count = 3 } = {}) {
  const isUS = sys === "US";
  const kPool = isUS ? [60, 80, 120, 150, 200] : [10, 15, 20, 30, 40];
  const fUnit = isUS ? "lb" : "N";
  const lUnit = isUS ? "in" : "mm";
  const kUnit = isUS ? "lb/in" : "N/mm";

  const varsDb = buildSpringNetworkSchema(count);
  const _names = buildVarNames(varsDb);
  const _u = { F_T: fUnit, delta_T: lUnit, k_T: kUnit };
  const S = { sys, _names, _u };

  let kSum = 0;
  let invKSum = 0;
  for (let i = 1; i <= count; i++) {
    const ki = pickRandom(kPool);
    S[`k_${i}`] = ki;
    _u[`k_${i}`] = kUnit;
    _u[`F_${i}`] = fUnit;
    _u[`delta_${i}`] = lUnit;
    kSum += ki;
    invKSum += 1 / ki;
  }

  if (mode === "series") {
    const F_T = isUS ? pickRandom([180, 240, 360]) : pickRandom([240, 300, 480]);
    const k_T = 1 / invKSum;
    const delta_T = F_T / k_T;
    S.F_T = F_T;
    S.k_T = k_T;
    S.delta_T = delta_T;
    for (let i = 1; i <= count; i++) {
      S[`F_${i}`] = F_T;
      S[`delta_${i}`] = F_T / S[`k_${i}`];
    }
  } else {
    const delta_T = isUS ? pickRandom([1.0, 1.5, 2.0]) : pickRandom([10, 12, 16]);
    const k_T = kSum;
    const F_T = k_T * delta_T;
    S.delta_T = delta_T;
    S.k_T = k_T;
    S.F_T = F_T;
    for (let i = 1; i <= count; i++) {
      S[`delta_${i}`] = delta_T;
      S[`F_${i}`] = S[`k_${i}`] * delta_T;
    }
  }

  return S;
}
