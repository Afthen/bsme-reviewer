/**
 * src/topics/machine_design/springs/systems/common/system_helper.js
 * Shared ground truth builder for Series and Parallel spring systems.
 * Eliminates duplicate arithmetic logic across series/parallel system generators.
 */

export function createSpringSystemGroundTruth({ sys = "SI", isParallel = false, count = 3 } = {}) {
  const isUS = sys === "US";

  // Individual spring rates
  const k_rates = isUS
    ? [20.0, 30.0, 40.0, 50.0, 60.0].slice(0, count) // lb/in
    : [1.0, 1.5, 2.0, 2.5, 3.0].slice(0, count);     // N/mm

  let k_T, F_T, delta_T;
  const F_arr = [];
  const delta_arr = [];

  if (isParallel) {
    k_T = k_rates.reduce((sum, ki) => sum + ki, 0);
    delta_T = isUS ? 1.5 : 25.0; // in or mm
    F_T = k_T * delta_T;

    for (let i = 0; i < count; i++) {
      delta_arr[i] = delta_T;
      F_arr[i] = k_rates[i] * delta_T;
    }
  } else {
    const sumRecip = k_rates.reduce((sum, ki) => sum + 1 / ki, 0);
    k_T = 1 / sumRecip;
    F_T = isUS ? 120.0 : 500.0; // lb or N
    delta_T = F_T / k_T;

    for (let i = 0; i < count; i++) {
      F_arr[i] = F_T;
      delta_arr[i] = F_T / k_rates[i];
    }
  }

  const S = { sys, F_T, delta_T, k_T };
  const _u = {
    F_T: isUS ? "lb" : "N",
    delta_T: isUS ? "in" : "mm",
    k_T: isUS ? "lb/in" : "N/mm"
  };

  for (let i = 1; i <= count; i++) {
    const ki = k_rates[i - 1];
    const fi = F_arr[i - 1];
    const di = delta_arr[i - 1];

    S[`k_${i}`] = ki;
    S[`F_${i}`] = fi;
    S[`delta_${i}`] = di;

    _u[`k_${i}`] = isUS ? "lb/in" : "N/mm";
    _u[`F_${i}`] = isUS ? "lb" : "N";
    _u[`delta_${i}`] = isUS ? "in" : "mm";
  }

  return { S, _u };
}
