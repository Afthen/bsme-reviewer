/**
 * src/ui/xmb_model.js
 * Pure 2D motion model for the XMB-style unit picker (no DOM).
 * x = fractional column index; ys[i] = fractional row index of column i.
 * One pointer stream drives both axes; each column remembers its own row.
 */

const OMEGA = 16;
const FRICTION = 5;
const STEP = 1 / 240;
const RUBBER = 0.35;
const VELOCITY_WINDOW_MS = 100;
const STALE_MS = 80;
const WHEEL_IDLE_S = 0.12;
const EPS = 1e-3;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Damp only the part of a move that pushes past an edge; moving back inward stays 1:1.
const band = (pos, delta, max) => {
  const next = pos + delta;
  if (next < 0 && delta < 0) return pos >= 0 ? next * RUBBER : pos + delta * RUBBER;
  if (next > max && delta > 0) return pos <= max ? max + (next - max) * RUBBER : pos + delta * RUBBER;
  return next;
};

export function createXmbModel({ columns, col = 0, row = 0, reducedMotion = false }) {
  const n = columns.length;
  const ys = columns.map(() => 0);
  const vys = columns.map(() => 0);
  let tys = columns.map(() => 0);
  let x = 0, vx = 0, tx = 0, mode = "idle", idle = 0, acc = 0;
  let samples = [];

  const active = () => clamp(Math.round(x), 0, n - 1);
  const rowOf = i => clamp(Math.round(ys[i]), 0, columns[i] - 1);

  function setCell(c, r) {
    const cc = clamp(c, 0, n - 1);
    ys.forEach((_, i) => { ys[i] = rowOf(i); vys[i] = 0; });
    ys[cc] = clamp(r, 0, columns[cc] - 1);
    x = tx = cc; vx = 0; tys = ys.slice(); mode = "idle";
  }
  setCell(col, row);

  function apply(dx, dy) {
    x = clamp(band(x, dx, n - 1), -1, n);
    const c = active();
    ys[c] = clamp(band(ys[c], dy, columns[c] - 1), -1, columns[c]);
  }

  function settle(targetX, vx0 = 0, over = null) {
    vx = vx0;
    tx = clamp(Math.round(targetX), 0, n - 1);
    tys = ys.map((_, i) => rowOf(i));
    vys.fill(0);
    if (over) {
      tys[over.col] = clamp(Math.round(over.target), 0, columns[over.col] - 1);
      vys[over.col] = over.v ?? 0;
    }
    if (reducedMotion) {
      x = tx; vx = 0;
      ys.forEach((_, i) => { ys[i] = tys[i]; });
      vys.fill(0); mode = "idle";
      return;
    }
    mode = "settle"; acc = 0;
  }

  function down() { mode = "drag"; samples = []; vx = 0; vys.fill(0); }

  function move(dx, dy, t) {
    if (mode !== "drag") down();
    apply(dx, dy);
    samples.push({ t, dx, dy });
    if (samples.length > 64) samples.shift();
  }

  function velocity(t) {
    const recent = samples.filter(s => t - s.t <= VELOCITY_WINDOW_MS);
    const last = recent[recent.length - 1];
    if (recent.length < 2 || t - last.t > STALE_MS) return { vx: 0, vy: 0 };
    const span = (last.t - recent[0].t) / 1000;
    if (span <= 0) return { vx: 0, vy: 0 };
    let sx = 0, sy = 0;
    for (let i = 1; i < recent.length; i++) { sx += recent[i].dx; sy += recent[i].dy; }
    return { vx: sx / span, vy: sy / span };
  }

  function up(t = 0) {
    if (mode !== "drag") return;
    const v = velocity(t);
    const c = active();
    settle(x + v.vx / FRICTION, v.vx, { col: c, target: ys[c] + v.vy / FRICTION, v: v.vy });
    samples = [];
  }

  function wheel(dx, dy) {
    if (mode === "drag") return;
    mode = "wheel"; idle = 0;
    apply(dx, dy);
  }

  function key(dc, dr) {
    const c = active();
    settle(c + dc, 0, { col: c, target: rowOf(c) + dr });
  }

  function goTo(c, r) {
    const cc = clamp(c, 0, n - 1);
    settle(cc, 0, { col: cc, target: r });
  }

  function substep() {
    const ax = OMEGA * OMEGA * (tx - x) - 2 * OMEGA * vx;
    vx += ax * STEP; x += vx * STEP;
    for (let i = 0; i < n; i++) {
      const ay = OMEGA * OMEGA * (tys[i] - ys[i]) - 2 * OMEGA * vys[i];
      vys[i] += ay * STEP; ys[i] += vys[i] * STEP;
    }
    const done = Math.abs(tx - x) < EPS && Math.abs(vx) < EPS &&
      ys.every((y, i) => Math.abs(tys[i] - y) < EPS && Math.abs(vys[i]) < EPS);
    if (done) {
      x = tx; vx = 0;
      ys.forEach((_, i) => { ys[i] = tys[i]; vys[i] = 0; });
      mode = "idle";
    }
  }

  function tick(dt) {
    if (mode === "wheel") {
      idle += dt;
      if (idle >= WHEEL_IDLE_S) settle(x);
      return;
    }
    if (mode !== "settle") return;
    acc = Math.min(acc + dt, 0.25);
    while (acc >= STEP && mode === "settle") { substep(); acc -= STEP; }
  }

  return {
    down, move, up, wheel, key, goTo, setCell, tick,
    selected: () => ({ col: active(), row: rowOf(active()) }),
    get x() { return x; },
    get ys() { return ys.slice(); },
    get mode() { return mode; },
    get settled() { return mode === "idle"; }
  };
}
