/**
 * test/prefix_policy_test.js
 * Prefix permission is registry data: only listed (prefix, base) pairs resolve, and every
 * unit string in the sampler palettes still parses.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_UNITS, PREFIXES, parseUnitToSemanticAST, getUnitAtomBag } from "../src/cas/units/index.js";
import { DIMENSION_TOKEN_PALETTES } from "../src/core/unit_sampler.js";

const resolvesAs = (code, key, symbol) => {
  const ast = parseUnitToSemanticAST(`${code}${symbol}`);
  return ast.length === 1 && ast[0].power === 1 && ast[0].prefix === PREFIXES[code].name && ast[0].base === key;
};

test("Every declared prefix code exists and sits on a non-temperature base", () => {
  for (const [key, meta] of Object.entries(BASE_UNITS)) {
    if (!meta.prefixes) continue;
    assert.ok(!meta.dimMap?.Th, `${key}: temperatures take no prefixes`);
    for (const code of meta.prefixes) assert.ok(PREFIXES[code], `${key}: unknown prefix code "${code}"`);
  }
});

test("A (prefix, base) pair resolves exactly when the registry lists it", () => {
  for (const [key, meta] of Object.entries(BASE_UNITS)) {
    if (meta.isDelta || meta.symbol.includes("_") || /[°Δ]/.test(meta.symbol)) continue;
    for (const code of Object.keys(PREFIXES)) {
      const listed = !!meta.prefixes?.includes(code);
      assert.equal(resolvesAs(code, key, meta.symbol), listed, `${code}${meta.symbol} (${key}) listed=${listed}`);
    }
  }
});

test("Microinch is a registered unit, used for thermal expansion coefficients", () => {
  assert.equal(getUnitAtomBag("uin/(in*Δ°F)").isUnknown, false);
  assert.ok(Math.abs(getUnitAtomBag("uin").scale - 0.0254e-6) < 1e-15);
});

test("Non-standard prefixed strings are unknown units", () => {
  for (const bad of ["ks", "kmin", "kin", "kft", "mhp", "kBtu", "MBtu", "kdeg"]) {
    assert.equal(getUnitAtomBag(bad).isUnknown, true, `${bad} must be unknown`);
  }
});

test("Every unit string in the sampler palettes parses as a known unit", () => {
  for (const [sys, byDim] of Object.entries(DIMENSION_TOKEN_PALETTES)) {
    for (const [dim, list] of Object.entries(byDim)) {
      for (const { unit } of list) {
        assert.equal(getUnitAtomBag(unit, dim).isUnknown, false, `${sys}/${dim}: "${unit}" is unknown`);
      }
    }
  }
});
