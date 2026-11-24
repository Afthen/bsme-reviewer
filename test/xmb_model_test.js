/**
 * test/xmb_model_test.js
 * XMB motion model: simultaneous two-axis drag, continuity, per-column memory,
 * settling to integers, frame-rate independence, wheel, keys, reduced motion.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createXmbModel } from "../src/ui/xmb_model.js";

const COLS = [9, 9, 9, 9, 9, 9, 9];
const mk = (extra = {}) => createXmbModel({ columns: COLS, col: 3, row: 4, ...extra });
const sum = a => a.reduce((s, v) => s + v, 0);

function fling(m) {
  m.down();
  let t = 0;
  for (let i = 0; i < 5; i++) { t += 16; m.move(0.2, -0.3, t); }
  m.up(t);
}

test("A circular stroke moves both axes on every step and never jumps", () => {
  const m = mk();
  m.down();
  let t = 0;
  for (let k = 0; k <= 60; k++) {
    const a = 0.37 + k * 0.1;
    const dx = 0.8 * (Math.cos(a + 0.1) - Math.cos(a));
    const dy = 0.8 * (Math.sin(a + 0.1) - Math.sin(a));
    const x0 = m.x, ys0 = m.ys;
    t += 16;
    m.move(dx, dy, t);
    assert.ok(Math.abs(m.x - x0) > 1e-9, `x did not move at step ${k}`);
    assert.ok(Math.abs(sum(m.ys) - sum(ys0)) > 1e-9, `y did not move at step ${k}`);
    assert.ok(Math.abs(m.x - x0) <= Math.abs(dx) + 1e-12);
    m.ys.forEach((y, i) => assert.ok(Math.abs(y - ys0[i]) <= Math.abs(dy) + 1e-12, `column ${i} jumped at step ${k}`));
  }
});

test("Each column remembers its own row when the drag leaves and returns", () => {
  const m = mk();
  m.down();
  m.move(0, 1, 16);
  m.move(-1, 0, 32);
  m.move(0, 2, 48);
  m.move(1, 0, 64);
  assert.ok(Math.abs(m.ys[3] - 5) < 1e-9);
  assert.ok(Math.abs(m.ys[2] - 2) < 1e-9);
});

test("After a fling both axes settle on integers inside the grid", () => {
  const m = mk();
  fling(m);
  for (let i = 0; i < 240; i++) m.tick(1 / 60);
  assert.equal(m.settled, true);
  assert.equal(Number.isInteger(m.x) && m.x >= 0 && m.x <= 6, true);
  m.ys.forEach(y => assert.equal(Number.isInteger(y) && y >= 0 && y <= 8, true));
});

test("The same gesture ends in the same cell at 30, 60 and 144 Hz", () => {
  const cells = [30, 60, 144].map(hz => {
    const m = mk();
    fling(m);
    for (let s = 0; s < hz * 3; s++) m.tick(1 / hz);
    return JSON.stringify(m.selected());
  });
  assert.equal(new Set(cells).size, 1, cells.join(" vs "));
});

test("Dragging past the edge rubber-bands and settles back inside", () => {
  const m = mk({ col: 0, row: 0 });
  m.down();
  m.move(-1, -1, 16);
  assert.ok(m.x > -1 && m.x < 0);
  m.up(200);
  for (let i = 0; i < 240; i++) m.tick(1 / 60);
  assert.equal(m.x, 0);
  assert.equal(m.ys[0], 0);
});

test("Wheel input applies both axes then snaps after it goes idle", () => {
  const m = mk();
  m.wheel(0.4, 0.3);
  assert.equal(m.settled, false);
  assert.ok(m.x > 3 && m.ys[3] > 4);
  for (let i = 0; i < 120; i++) m.tick(1 / 60);
  assert.equal(m.settled, true);
  assert.equal(Number.isInteger(m.x), true);
});

test("Keys step one cell and goTo targets a cell", () => {
  const m = mk();
  m.key(1, 0);
  for (let i = 0; i < 120; i++) m.tick(1 / 60);
  assert.deepEqual(m.selected(), { col: 4, row: 0 });
  m.key(0, 1);
  for (let i = 0; i < 120; i++) m.tick(1 / 60);
  assert.deepEqual(m.selected(), { col: 4, row: 1 });
  m.goTo(1, 7);
  for (let i = 0; i < 240; i++) m.tick(1 / 60);
  assert.deepEqual(m.selected(), { col: 1, row: 7 });
});

test("Reduced motion snaps on release without inertia", () => {
  const m = mk({ reducedMotion: true });
  fling(m);
  assert.equal(m.settled, true);
  assert.equal(Number.isInteger(m.x), true);
});
