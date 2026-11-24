/**
 * test/sibling_markup_test.js
 * Tokens that appear only in later terms of a sum must receive the sibling
 * analysis's markup, not the plain placeholder written by the main pass.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { DIMENSIONS } from "../src/core/dimensions.js";
import { solveUnitAlgebra } from "../src/cas/units/index.js";

const varsDb = {
  m_m: { unit: "kg/s", dimension: DIMENSIONS.MASS_FLOW },
  m_o: { unit: "kg/s", dimension: DIMENSIONS.MASS_FLOW },
  m_r: { unit: "kg/s", dimension: DIMENSIONS.MASS_FLOW },
  t_m: { unit: "K", dimension: DIMENSIONS.TEMPERATURE },
  t_o: { unit: "K", dimension: DIMENSIONS.TEMPERATURE },
  t_r: { unit: "K", dimension: DIMENSIONS.TEMPERATURE }
};

test("Sibling-term tokens take sibling markup over the main-pass placeholder", () => {
  const S = { _u: { m_m: "kg/s", t_m: "K", m_o: "kg/s", t_o: "K", m_r: "kg/s", t_r: "K" } };
  const res = solveUnitAlgebra("(m_m * t_m - (m_o * t_o)) / m_r", S, "t_r", "K", varsDb);
  for (const tok of ["m_m", "m_o", "m_r"]) {
    assert.ok(
      (res.tokenMarkup[tok] || "").includes("\\cancel"),
      `Expected cancelled markup for ${tok}, got: ${res.tokenMarkup[tok]}`
    );
  }
});
