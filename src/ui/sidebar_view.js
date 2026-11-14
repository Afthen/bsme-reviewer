/**
 * src/ui/sidebar_view.js
 * Sidebar drawer controller with:
 * - Sorting from least to greatest mastery (weakest on top)
 * - Continuous Oklab color gradient interpolation (red -> amber -> green)
 * - View scope toggle: "Current Problem" vs "All Selected Topics"
 */

import { FADING_THRESHOLD } from "../mastery/index.js";

export const MASTERY_CHANGED_EVENT = "bsme:mastery-changed";

let activeCurrentRelations = [];
let activeAllRelations = [];
let activeGetMastery = () => 0;
let sidebarScope = "current"; // "current" | "all"
let isInitialized = false;

/**
 * Computes a perceptually smooth continuous color in Oklab space:
 *   m = 0.0:  oklab(0.63 0.22 0.12)  - vibrant danger red
 *   m = 0.5:  oklab(0.75 0.06 0.16)  - warm amber
 *   m = 1.0:  oklab(0.72 -0.17 0.14) - vivid emerald green
 */
export function getOklabMasteryColor(mastery = 0) {
  const m = Math.max(0, Math.min(1, mastery));

  const cLow = [0.63, 0.22, 0.12];
  const cMid = [0.75, 0.06, 0.16];
  const cHigh = [0.72, -0.17, 0.14];

  let L, a, b;
  if (m < 0.5) {
    const t = m / 0.5;
    L = cLow[0] + t * (cMid[0] - cLow[0]);
    a = cLow[1] + t * (cMid[1] - cLow[1]);
    b = cLow[2] + t * (cMid[2] - cLow[2]);
  } else {
    const t = (m - 0.5) / 0.5;
    L = cMid[0] + t * (cHigh[0] - cMid[0]);
    a = cMid[1] + t * (cHigh[1] - cMid[1]);
    b = cMid[2] + t * (cHigh[2] - cMid[2]);
  }

  return `oklab(${L.toFixed(3)} ${a.toFixed(3)} ${b.toFixed(3)})`;
}

export function initSidebarView(currentRelations = [], getMastery = () => 0, allSelectedRelations = []) {
  activeCurrentRelations = currentRelations;
  activeAllRelations = allSelectedRelations && allSelectedRelations.length > 0 ? allSelectedRelations : currentRelations;
  activeGetMastery = getMastery;

  renderMasteryView();
  if (isInitialized) return;

  const drawer = document.getElementById("sidebar-drawer");
  const overlay = document.getElementById("sidebar-overlay");
  const btnHamburger = document.getElementById("btn-hamburger");
  const btnClose = document.getElementById("btn-close-sidebar");

  function toggle() {
    const isOpen = drawer.classList.contains("open");
    if (isOpen) {
      drawer.classList.remove("open");
      overlay.classList.remove("active");
    } else {
      drawer.classList.add("open");
      overlay.classList.add("active");
      renderMasteryView();
    }
  }

  function close() {
    drawer.classList.remove("open");
    overlay.classList.remove("active");
  }

  btnHamburger?.addEventListener("click", toggle);
  btnClose?.addEventListener("click", close);
  overlay?.addEventListener("click", close);

  isInitialized = true;
}

export function updateSidebarRelations(currentRelations = [], allSelectedRelations = [], getMastery = null) {
  activeCurrentRelations = currentRelations;
  activeAllRelations = allSelectedRelations && allSelectedRelations.length > 0 ? allSelectedRelations : currentRelations;
  if (getMastery) activeGetMastery = getMastery;
  renderMasteryView();
}

function renderMasteryView() {
  const el = document.getElementById("weight-bars-el");
  if (!el) return;

  const drawer = document.getElementById("sidebar-drawer");
  let toggleBar = document.getElementById("sidebar-scope-toggle-bar");

  // Inject scope toggle controls if absent
  if (!toggleBar && drawer) {
    toggleBar = document.createElement("div");
    toggleBar.id = "sidebar-scope-toggle-bar";
    toggleBar.style.display = "flex";
    toggleBar.style.gap = "0.35rem";
    toggleBar.style.marginBottom = "0.75rem";

    const btnCurrent = document.createElement("button");
    btnCurrent.className = "btn";
    btnCurrent.textContent = "Current Topic";
    btnCurrent.style.flex = "1";
    btnCurrent.style.fontSize = "0.72rem";

    const btnAll = document.createElement("button");
    btnAll.className = "btn";
    btnAll.textContent = "All Selected";
    btnAll.style.flex = "1";
    btnAll.style.fontSize = "0.72rem";

    function updateBtnStyles() {
      btnCurrent.style.background = sidebarScope === "current" ? "var(--border)" : "transparent";
      btnCurrent.style.color = sidebarScope === "current" ? "#fff" : "var(--text-muted)";
      btnAll.style.background = sidebarScope === "all" ? "var(--border)" : "transparent";
      btnAll.style.color = sidebarScope === "all" ? "#fff" : "var(--text-muted)";
    }

    btnCurrent.addEventListener("click", () => {
      sidebarScope = "current";
      updateBtnStyles();
      renderMasteryView();
    });

    btnAll.addEventListener("click", () => {
      sidebarScope = "all";
      updateBtnStyles();
      renderMasteryView();
    });

    updateBtnStyles();
    toggleBar.append(btnCurrent, btnAll);
    el.parentElement?.prepend(toggleBar);
  }

  // Deduplicate relations for display
  const rawList = sidebarScope === "all" ? activeAllRelations : activeCurrentRelations;
  const uniqueMap = new Map();
  rawList.forEach(r => {
    const key = r && (r.masteryId || r.id);
    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, r);
    }
  });

  // Always sort from least mastery to greatest mastery (weakest on top)
  const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
    return activeGetMastery(a) - activeGetMastery(b);
  });

  renderMasteryBars(el, sorted, activeGetMastery);
}

export function renderMasteryBars(containerOrRelations, maybeRelations, maybeGetMastery) {
  const relations = Array.isArray(containerOrRelations)
    ? containerOrRelations
    : (Array.isArray(maybeRelations) ? maybeRelations : []);

  const getMastery = typeof containerOrRelations === "function"
    ? containerOrRelations
    : (typeof maybeRelations === "function"
        ? maybeRelations
        : (typeof maybeGetMastery === "function" ? maybeGetMastery : () => 0));

  const el = (containerOrRelations && containerOrRelations.nodeType === 1)
    ? containerOrRelations
    : document.getElementById("weight-bars-el");

  if (!el) return;
  el.innerHTML = "";

  relations.forEach(eq => {
    const mastery = getMastery(eq);
    const pct = Math.round(mastery * 100);
    const color = getOklabMasteryColor(mastery);

    const row = document.createElement("div");
    row.className = "weight-row";

    const labelBar = document.createElement("div");
    labelBar.className = "weight-label-bar";

    const nameSpan = document.createElement("span");
    nameSpan.style.overflow = "hidden";
    nameSpan.style.textOverflow = "ellipsis";
    nameSpan.style.whiteSpace = "nowrap";
    nameSpan.title = eq.name;
    nameSpan.textContent = eq.name;

    const pctSpan = document.createElement("span");
    pctSpan.style.fontFamily = "monospace";
    pctSpan.textContent = `${pct}%`;

    labelBar.appendChild(nameSpan);
    labelBar.appendChild(pctSpan);

    const barBg = document.createElement("div");
    barBg.style.height = "4px";
    barBg.style.background = "var(--border-subtle)";
    barBg.style.borderRadius = "2px";
    barBg.style.overflow = "hidden";

    const barFill = document.createElement("div");
    barFill.style.height = "100%";
    barFill.style.width = `${pct}%`;
    barFill.style.background = color;
    barFill.style.transition = "width 0.3s ease, background 0.3s ease";

    barBg.appendChild(barFill);
    row.appendChild(labelBar);
    row.appendChild(barBg);
    el.appendChild(row);
  });
}

export const renderSidebar = (relations, getMastery) => {
  renderMasteryBars(document.getElementById("weight-bars-el"), relations, getMastery);
};