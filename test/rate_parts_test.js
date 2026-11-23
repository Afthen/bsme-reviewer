/**
 * test/rate_parts_test.js
 * Regression: sibling-term target units are emitted as "n/(d)" by unitForSubExpr, and
 * formatPairConversion must split them into per-part registered ratios instead of
 * lumping one fused, non-canonical scalar (e.g. 334.553 = 737.562 * 0.453592).
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { formatPairConversion, isCanonicalScaleFactor } from "../src/cas/units/index.js";

describe("formatPairConversion with parenthesised rate targets", () => {
  test("kJ/kg -> ft-lb_f/(lb_m) decomposes into canonical numerator and denominator ratios", () => {
    const conv = formatPairConversion("kJ/kg", "ft-lb_f/(lb_m)");
    assert.equal(conv.isDecomposed, true);
    assert.equal(conv.scalars.length, 2);
    for (const s of conv.scalars) assert.ok(isCanonicalScaleFactor(s), `alien scalar ${s}`);
  });

  test("Btu/h -> kJ/(s) keeps the time factor separate from the energy factor", () => {
    const conv = formatPairConversion("Btu/h", "kJ/(s)");
    for (const s of conv.scalars) assert.ok(isCanonicalScaleFactor(s), `alien scalar ${s}`);
  });

  test("a '1/(...)' target is not split into a unit-less numerator", () => {
    const conv = formatPairConversion("1/min", "1/(s)");
    for (const s of conv.scalars) assert.ok(isCanonicalScaleFactor(s), `alien scalar ${s}`);
  });
});
