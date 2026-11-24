/**
 * test/trace_test.js
 * Regression tests for the TRACE directive: case-line parsing, numeric push/fill
 * recording, Array.prototype restoration after a throw, and fulfill() rejection
 * of malformed TRACE requests without spawning anything.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseCase } from "../scripts/lib/trace_parse.js";
import { recordNumericPushes } from "../scripts/lib/trace_hooks.js";
import { fulfill, LIMITS } from "../scripts/fulfill_ctx.js";

describe("trace_parse.parseCase", () => {
  test("parses a matrix line with and without seed", () => {
    const line = "hvac_cooling_tower[US] eq_ct_heat_air -> m_a {Q_rej:kg*m^2/s^3, m_a:lb_m/h, h_2:kJ/kg}";
    const c = parseCase(line);
    assert.equal(c.topicId, "hvac_cooling_tower");
    assert.equal(c.sys, "US");
    assert.equal(c.relId, "eq_ct_heat_air");
    assert.equal(c.target, "m_a");
    assert.deepEqual(c.units, { Q_rej: "kg*m^2/s^3", m_a: "lb_m/h", h_2: "kJ/kg" });
    assert.equal(c.seed, null);
    assert.equal(parseCase(`${line} seed=2`).seed, 2);
  });

  test("rejects malformed input", () => {
    assert.equal(parseCase("nonsense"), null);
    assert.equal(parseCase("t[SI] eq -> x {badpair}"), null);
  });
});

describe("trace_hooks.recordNumericPushes", () => {
  const any = /./;

  test("records bad numbers from push and fill, ignores good ones", () => {
    const { result, hits } = recordNumericPushes((v) => v !== 1, () => {
      const a = [];
      a.push(1715.57);
      a.push(1);
      Array(2).fill(3.5);
      return a.length;
    }, { frameFilter: any });
    assert.equal(result, 2);
    assert.deepEqual(hits.map((h) => [h.kind, h.value]), [["push", 1715.57], ["fill", 3.5]]);
    assert.ok(hits[0].frames.length > 0);
  });

  test("restores Array.prototype even when the traced function throws", () => {
    const push = Array.prototype.push;
    const fill = Array.prototype.fill;
    assert.throws(() => recordNumericPushes(() => false, () => { throw new Error("boom"); }), /boom/);
    assert.equal(Array.prototype.push, push);
    assert.equal(Array.prototype.fill, fill);
  });
});

describe("fulfill TRACE", () => {
  test("malformed TRACE is rejected with usage, not executed", async () => {
    const out = await fulfill("TRACE not a case");
    assert.match(out, /TRACE needs a matrix case/);
    assert.ok(out.includes(`1/${LIMITS.MAX_DIRECTIVES} directives used`));
  });
});
