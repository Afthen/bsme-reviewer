/**
 * src/ui/unit_card_view.js
 * Interactive unit converter card: fraction boxes of unit chips, each opened with the XMB picker,
 * and a factor-label conversion train rendered below once the dimensions match.
 */

import { getUnitAtomBag } from "../cas/units/index.js";
import {
  getCategories, ENTRY_BY_ID, categoryIndexOf, composeUnit, chipsFromUnit, buildConversion, dimKeyOf
} from "../core/unit_catalog.js";
import { openXmbPicker } from "./xmb_picker_view.js";

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const cloneSide = s => ({ num: s.num.map(c => ({ ...c })), den: s.den.map(c => ({ ...c })) });

export function openUnitCard({ varKey = "", title = "", value = 1, unit = "", dimension = null } = {}) {
  document.getElementById("view-unit-card")?.remove?.();
  const cats = getCategories();
  const initial = chipsFromUnit(unit, dimension) || { num: [], den: [] };
  const state = { from: cloneSide(initial), to: cloneSide(initial), value: Number.isFinite(value) ? value : 1 };
  const bagOf = side => { const u = composeUnit(side); return u === "dimless" ? null : getUnitAtomBag(u); };
  const refBag = bagOf(initial);
  const refDim = refBag && !refBag.isUnknown ? dimKeyOf(refBag.dimMap) : null;

  const overlay = el("div");
  overlay.id = "view-unit-card";
  const card = el("div", "uc-card");
  const head = el("div", "uc-head");
  head.appendChild(el("span", "uc-title", title || "Unit converter"));
  if (varKey) head.appendChild(el("span", "uc-var", varKey));
  const closeBtn = el("button", "btn", "✕");
  head.appendChild(closeBtn);

  const valueRow = el("div", "uc-value-row");
  const valueInput = el("input", "uc-value");
  valueInput.type = "number";
  valueInput.step = "any";
  valueInput.value = String(state.value);
  valueRow.appendChild(el("span", "uc-label", "Value"));
  valueRow.appendChild(valueInput);

  const sidesEl = el("div", "uc-sides");
  const trainEl = el("div", "uc-train-wrap");
  const swapBtn = el("button", "btn uc-swap", "⇄ Swap");
  card.appendChild(head);
  card.appendChild(valueRow);
  card.appendChild(sidesEl);
  card.appendChild(swapBtn);
  card.appendChild(trainEl);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function close() {
    document.removeEventListener("keydown", onKey);
    overlay.remove?.();
  }
  function onKey(e) {
    if (e.key === "Escape" && !document.getElementById("view-xmb")) close();
  }
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  closeBtn.addEventListener("click", close);

  function openPicker(side, row, index) {
    const chips = state[side];
    const total = chips.num.length + chips.den.length;
    const fromBag = bagOf(state.from);
    const reference = side === "to" ? (fromBag && !fromBag.isUnknown ? dimKeyOf(fromBag.dimMap) : null) : refDim;
    const lock = total <= 1 && reference ? reference : null;
    const current = index === null ? null : chips[row][index];
    let startCategory = lock ? cats.findIndex(c => c.id === lock) : (current ? categoryIndexOf(current.entryId) : 0);
    if (startCategory < 0) startCategory = 0;
    const startEntry = current ? Math.max(0, cats[startCategory].entries.findIndex(e => e.id === current.entryId)) : 0;
    openXmbPicker({
      categories: cats, startCategory, startEntry, lockDimKey: lock,
      onPick: ({ entry, prefix }) => {
        if (entry.kind === "preset") {
          state[side] = chipsFromUnit(entry.unit) || state[side];
        } else {
          const chip = { entryId: entry.id, prefix, power: 1 };
          if (index === null) chips[row].push(chip); else chips[row][index] = chip;
        }
        update();
      }
    });
  }

  function renderRow(side, row) {
    const rowEl = el("div", "uc-row");
    state[side][row].forEach((chip, idx) => {
      const wrap = el("span", "uc-chip");
      const main = el("button", "uc-chip-main", `${chip.prefix || ""}${ENTRY_BY_ID.get(chip.entryId)?.unit ?? chip.entryId}`);
      if (chip.power !== 1) main.appendChild(el("sup", "", String(chip.power)));
      main.addEventListener("click", () => openPicker(side, row, idx));
      const pow = el("button", "uc-chip-mini", "^");
      pow.title = "Change exponent";
      pow.addEventListener("click", () => { chip.power = chip.power >= 3 ? 1 : chip.power + 1; update(); });
      const rm = el("button", "uc-chip-mini", "×");
      rm.title = "Remove";
      rm.addEventListener("click", () => { state[side][row].splice(idx, 1); update(); });
      wrap.appendChild(main);
      wrap.appendChild(pow);
      wrap.appendChild(rm);
      rowEl.appendChild(wrap);
    });
    const add = el("button", "uc-add", "+ unit");
    add.addEventListener("click", () => openPicker(side, row, null));
    rowEl.appendChild(add);
    return rowEl;
  }

  function renderSides() {
    sidesEl.innerHTML = "";
    for (const side of ["from", "to"]) {
      const box = el("div", "uc-side");
      box.appendChild(el("span", "uc-label", side === "from" ? "From" : "To"));
      const frac = el("div", "uc-frac");
      frac.appendChild(renderRow(side, "num"));
      frac.appendChild(el("div", "uc-bar"));
      frac.appendChild(renderRow(side, "den"));
      box.appendChild(frac);
      sidesEl.appendChild(box);
    }
  }

  function renderTrain() {
    trainEl.innerHTML = "";
    const f = composeUnit(state.from), t = composeUnit(state.to);
    if (f === "dimless" || t === "dimless") {
      trainEl.appendChild(el("div", "uc-warn", "Pick a unit in both boxes."));
      return;
    }
    const res = buildConversion(f, t, state.value);
    if (!res.ok) {
      trainEl.appendChild(el("div", "uc-warn", res.reason));
      return;
    }
    const math = el("div", "uc-train");
    math.innerHTML = `$$${res.lhsTex} = ${res.resultTex} \\, ${res.toTex}$$`;
    trainEl.appendChild(math);
    if (!res.canonical) trainEl.appendChild(el("div", "uc-warn", "This conversion uses a non-standard factor."));
    if (window.renderMathInElement) {
      window.renderMathInElement(trainEl, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }] });
    }
  }

  function update() { renderSides(); renderTrain(); }

  valueInput.addEventListener("input", () => {
    const v = parseFloat(valueInput.value);
    if (Number.isFinite(v)) { state.value = v; renderTrain(); }
  });
  swapBtn.addEventListener("click", () => { [state.from, state.to] = [state.to, state.from]; update(); });

  update();
}
