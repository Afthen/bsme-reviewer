/**
 * test/memo_equivalence_test.js
 * Cached isolation and unit resolution must equal their uncached computations.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadAllTopics } from "../src/topics/index.js";
import { isolateVariable, isolateVariableUncached } from "../src/cas/algebra.js";
import {
  BASE_UNITS, PREFIXES, DIMENSIONS, resolveUnitToken, resolveUnitTokenUncached,
  findExactBase, findPrefixedBase
} from "../src/cas/units/definitions.js";

const topics = await loadAllTopics();

test("Cached isolateVariable equals a fresh computation for every relation, target, system and varsDb", () => {
  let checked = 0;
  for (const topic of topics) {
    for (const sys of ["SI", "US"]) {
      for (const rel of topic.relations) {
        const v = rel.variants?.[sys] || null;
        const baseFormula = v?.baseFormula || rel.baseFormula;
        const nodes = v?.nodes || rel.nodes;
        if (!baseFormula) continue;
        for (const target of nodes) {
          for (const db of [topic.varsDb, {}]) {
            const fresh = isolateVariableUncached(baseFormula, target, db);
            const cached = isolateVariable(baseFormula, target, db);
            const again = isolateVariable(baseFormula, target, db);
            assert.equal(again, cached, `${topic.id} ${rel.id} ${target}: cache must return the same object`);
            assert.equal(cached.success, fresh.success, `${topic.id} ${rel.id} ${target}`);
            assert.equal(cached.isolatedRhs, fresh.isolatedRhs, `${topic.id} ${rel.id} ${target}`);
            assert.equal(JSON.stringify(cached.isolatedAST), JSON.stringify(fresh.isolatedAST), `${topic.id} ${rel.id} ${target}`);
            assert.ok(Object.isFrozen(cached), "cached results must be frozen");
            checked++;
          }
        }
      }
    }
  }
  assert.ok(checked > 0);
});

test("Unit lookup tables match the legacy first-match linear scans", () => {
  const names = new Set();
  for (const [key, meta] of Object.entries(BASE_UNITS)) {
    names.add(key);
    names.add(meta.symbol);
  }
  for (const name of names) {
    const exact = Object.keys(BASE_UNITS).find(
      k => !BASE_UNITS[k].isDelta && (k === name || BASE_UNITS[k].symbol === name)
    );
    const prefixed = Object.keys(BASE_UNITS).find(
      k => !BASE_UNITS[k].isDelta && !BASE_UNITS[k].dimMap?.Th && (k === name || BASE_UNITS[k].symbol === name)
    );
    assert.equal(findExactBase(name), exact, `exact lookup for "${name}"`);
    assert.equal(findPrefixedBase(name), prefixed, `prefixed lookup for "${name}"`);
  }
});

test("Cached resolveUnitToken equals the uncached resolver for every symbol, prefix and dimension", () => {
  const stems = new Set();
  for (const [key, meta] of Object.entries(BASE_UNITS)) {
    stems.add(key);
    stems.add(meta.symbol);
  }
  for (const s of ["kip", "klb", "hr", "lbm", "lbf", "kgf", "lb_m", "lb_f", "kg_f", "°", "deg", "%", "ΔK", "Δ°C"]) stems.add(s);

  const tokens = new Set(stems);
  for (const p of Object.keys(PREFIXES)) for (const s of stems) tokens.add(p + s);

  const dims = [null, ...new Set(Object.values(DIMENSIONS))];
  for (const token of tokens) {
    for (const dim of dims) {
      const fresh = resolveUnitTokenUncached(token, dim);
      const cached = resolveUnitToken(token, dim);
      assert.deepEqual({ ...cached }, { ...fresh }, `token "${token}" dim ${dim}`);
      assert.ok(Object.isFrozen(cached));
    }
  }
});
