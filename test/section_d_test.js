/**
 * test/section_d_test.js
 * Regression: a same-dimension token whose pairwise conversion to the target would need a
 * fused, non-canonical scalar (kW -> kg*m*m/(h*h^2) = 1000 * 3600^3) must route through the
 * per-atom compound builder, so every emitted conversion scalar is canonical.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { DIMENSIONS } from "../src/core/dimensions.js";
import { solveUnitAlgebra, isCanonicalScaleFactor } from "../src/cas/units/index.js";

test("Q_s / (Q_s + Q_l) with Btu/h and kW yields only canonical scalars", () => {
  const varsDb = {
    SHR: { dimension: DIMENSIONS.DIMENSIONLESS, unit: "dimless" },
    Q_s: { dimension: DIMENSIONS.POWER, unit: "kW" },
    Q_l: { dimension: DIMENSIONS.POWER, unit: "kW" }
  };
  const S = { SHR: 0.7, Q_s: 1000, Q_l: 2, sys: "SI", _u: { SHR: "dimless", Q_s: "Btu/h", Q_l: "kW" } };
  const ua = solveUnitAlgebra("Q_s / (Q_s + Q_l)", S, "SHR", "dimless", varsDb, null);
  for (const s of ua.conversionScalars || []) assert.ok(isCanonicalScaleFactor(s), `alien scalar ${s}`);
});
