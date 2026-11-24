/**
 * src/ui/xmb_picker_view.js
 * XMB-style picker overlay: categories on the horizontal bar, units in the vertical column.
 * Free 2D drag, wheel and keys, driven by the pure motion model.
 */

import { createXmbModel } from "./xmb_model.js";

const CELL_W = 110;
const CELL_H = 58;
const TAP_PX = 6;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function openXmbPicker({ categories, startCategory = 0, startEntry = 0, lockDimKey = null, onPick, onClose }) {
  document.getElementById("view-xmb")?.remove?.();

  const root = document.createElement("div");
  root.id = "view-xmb";
  root.className = "xmb-root";
  const hint = document.createElement("div");
  hint.className = "xmb-hint";
  const strip = document.createElement("div");
  strip.className = "xmb-prefixes";
  root.appendChild(hint);
  root.appendChild(strip);

  const headers = categories.map((c, i) => {
    const h = document.createElement("div");
    h.className = "xmb-cat" + (lockDimKey && c.id !== lockDimKey ? " xmb-mismatch" : "");
    h.dataset.col = String(i);
    h.textContent = c.label;
    root.appendChild(h);
    return h;
  });

  const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const model = createXmbModel({
    columns: categories.map(c => c.entries.length),
    col: startCategory, row: startEntry, reducedMotion: reduced
  });
  const cells = new Map();
  let prefixCode = null, stripKey = "", raf = 0, last = 0, closed = false;

  document.body.appendChild(root);

  function cellFor(key, i, j) {
    let el = cells.get(key);
    if (el) return el;
    const entry = categories[i].entries[j];
    el = document.createElement("div");
    el.className = "xmb-cell";
    el.dataset.col = String(i);
    el.dataset.row = String(j);
    const t = document.createElement("div");
    t.className = "xmb-title";
    t.textContent = entry.label;
    const s = document.createElement("div");
    s.className = "xmb-sub";
    s.textContent = entry.subtitle;
    el.appendChild(t);
    el.appendChild(s);
    root.appendChild(el);
    cells.set(key, el);
    return el;
  }

  function renderStrip(sel, cx, y) {
    const entry = categories[sel.col].entries[sel.row];
    const key = `${sel.col}:${sel.row}`;
    if (!model.settled || entry.kind !== "base" || entry.prefixes.length === 0) {
      strip.style.display = "none";
      return;
    }
    strip.style.display = "flex";
    strip.style.transform = `translate3d(${cx}px, ${y}px, 0) translateX(-50%)`;
    if (key === stripKey) return;
    stripKey = key;
    prefixCode = null;
    strip.innerHTML = "";
    [null, ...entry.prefixes].forEach(code => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "xmb-prefix" + (code === null ? " active" : "");
      b.textContent = code === null ? "—" : code;
      b.addEventListener("click", ev => {
        ev.stopPropagation();
        prefixCode = code;
        strip.querySelectorAll(".xmb-prefix").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
      });
      strip.appendChild(b);
    });
  }

  function render() {
    const W = root.clientWidth || window.innerWidth || 800;
    const H = root.clientHeight || window.innerHeight || 600;
    const cx = W / 2, cy = H * 0.34, gap = CELL_H * 1.1;
    const x = model.x, ys = model.ys;
    const act = model.selected();

    headers.forEach((h, i) => {
      const d = i - x;
      const near = clamp(1 - Math.abs(d), 0, 1);
      h.style.transform = `translate3d(${cx + d * CELL_W - 48}px, ${cy}px, 0) scale(${1 + 0.25 * near})`;
      h.style.opacity = String((0.35 + 0.65 * near) * (h.classList.contains("xmb-mismatch") ? 0.55 : 1));
    });

    const needed = new Set();
    categories.forEach((cat, i) => {
      const f = clamp(1 - Math.abs(i - x), 0, 1);
      if (f <= 0.01) return;
      const yi = ys[i];
      const lo = Math.max(0, Math.floor(yi) - 3);
      const hi = Math.min(cat.entries.length - 1, Math.ceil(yi) + 3);
      for (let j = lo; j <= hi; j++) {
        const key = `${i}:${j}`;
        needed.add(key);
        const el = cellFor(key, i, j);
        const d = j - yi;
        const ty = cy + d * CELL_H + gap * clamp(d + 1, 0, 1);
        const sel = clamp(1 - Math.abs(d), 0, 1);
        el.style.transform = `translate3d(${cx + (i - x) * CELL_W - 70}px, ${ty}px, 0) scale(${1 + 0.2 * sel})`;
        el.style.opacity = String(f * clamp(1 - 0.28 * Math.abs(d), 0.1, 1));
        el.classList.toggle("selected", i === act.col && j === act.row);
      }
    });
    for (const [key, el] of cells) {
      if (!needed.has(key)) { el.remove?.(); cells.delete(key); }
    }

    renderStrip(act, cx, cy + gap + CELL_H * 0.85);
    const mismatch = lockDimKey && categories[act.col].id !== lockDimKey;
    hint.textContent = mismatch
      ? "Different dimension from the source unit: no conversion possible"
      : "Drag, scroll or use arrow keys · Enter to pick · Esc to close";
    hint.classList.toggle("warn", !!mismatch);
  }

  function frame(now) {
    raf = 0;
    if (closed) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    model.tick(dt);
    render();
    if (model.mode !== "idle") raf = requestAnimationFrame(frame);
  }
  function ensureLoop() {
    if (raf || closed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function close() {
    if (closed) return;
    closed = true;
    if (raf) cancelAnimationFrame(raf);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", render);
    root.remove?.();
    onClose?.();
  }

  function pick() {
    const sel = model.selected();
    const entry = categories[sel.col].entries[sel.row];
    onPick?.({ entry, prefix: entry.kind === "base" ? prefixCode : null, dimKey: categories[sel.col].id });
    close();
  }

  function onKey(e) {
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (map[e.key]) { model.key(...map[e.key]); }
    else if (e.key === "Enter") { pick(); }
    else if (e.key === "Escape") { close(); }
    else return;
    e.preventDefault();
    e.stopPropagation();
    ensureLoop();
  }

  let down = null;
  root.addEventListener("pointerdown", e => {
    if (e.target.closest?.(".xmb-prefixes")) return;
    down = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, target: e.target };
    root.setPointerCapture?.(e.pointerId);
    model.down();
    ensureLoop();
  });
  root.addEventListener("pointermove", e => {
    if (!down) return;
    const events = e.getCoalescedEvents?.() || [];
    for (const pe of events.length ? events : [e]) {
      if (!down.moved) {
        if (Math.hypot(pe.clientX - down.sx, pe.clientY - down.sy) <= TAP_PX) continue;
        down.moved = true;
        down.x = down.sx; down.y = down.sy;
      }
      model.move(-(pe.clientX - down.x) / CELL_W, -(pe.clientY - down.y) / CELL_H, pe.timeStamp);
      down.x = pe.clientX; down.y = pe.clientY;
    }
  });
  const release = e => {
    if (!down) return;
    const d = down;
    down = null;
    model.up(e.timeStamp);
    if (!d.moved && e.type === "pointerup") {
      const cell = d.target.closest?.(".xmb-cell, .xmb-cat");
      if (cell) {
        const c = Number(cell.dataset.col);
        const sel = model.selected();
        if (cell.classList.contains("xmb-cell")) {
          const r = Number(cell.dataset.row);
          if (c === sel.col && r === sel.row) { pick(); return; }
          model.goTo(c, r);
        } else {
          model.goTo(c, model.ys[c]);
        }
      }
    }
    ensureLoop();
  };
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("wheel", e => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    let dx = e.deltaX * k, dy = e.deltaY * k;
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    model.wheel(dx / CELL_W, dy / CELL_H);
    ensureLoop();
  }, { passive: false });
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", render);

  render();
  return { close };
}
