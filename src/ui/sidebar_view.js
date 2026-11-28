/**
 * src/ui/sidebar_view.js
 * Sidebar drawer controller with:
 * - Sorting from least to greatest mastery (weakest on top)
 * - Continuous Oklab color gradient interpolation (red -> amber -> green)
 * - View scope toggle: "Current Problem" vs "All Selected Topics"
 */

import { FADING_THRESHOLD, getRelationTaxonomy, PRINCIPLES, APPLICATIONS } from "../mastery/index.js";

export const MASTERY_CHANGED_EVENT = "bsme:mastery-changed";

let activeCurrentRelations = [];
let activeAllRelations = [];
let activeGetMastery = () => 0;
let sidebarScope = "current"; // "current" | "all"
let sidebarViewMode = "hierarchy"; // "hierarchy" | "flat"
let scopeLabels = { current: "Current Problem", all: "All Selected" };
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

export function updateSidebarRelations(
  currentRelations = [],
  allSelectedRelations = [],
  getMastery = null,
  options = {}
) {
  activeCurrentRelations = currentRelations;
  activeAllRelations = allSelectedRelations && allSelectedRelations.length > 0 ? allSelectedRelations : currentRelations;
  if (getMastery) activeGetMastery = getMastery;
  if (options && typeof options === "object") {
    if (options.currentLabel) scopeLabels.current = options.currentLabel;
    if (options.allLabel) scopeLabels.all = options.allLabel;
  }
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
    btnCurrent.id = "sidebar-btn-scope-current";
    btnCurrent.className = "btn";
    btnCurrent.style.flex = "1";
    btnCurrent.style.fontSize = "0.72rem";

    const btnAll = document.createElement("button");
    btnAll.id = "sidebar-btn-scope-all";
    btnAll.className = "btn";
    btnAll.style.flex = "1";
    btnAll.style.fontSize = "0.72rem";

    const btnMode = document.createElement("button");
    btnMode.id = "sidebar-btn-mode-toggle";
    btnMode.className = "btn";
    btnMode.style.flex = "0.7";
    btnMode.style.fontSize = "0.72rem";

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

    btnMode.addEventListener("click", () => {
      sidebarViewMode = sidebarViewMode === "hierarchy" ? "flat" : "hierarchy";
      updateBtnStyles();
      renderMasteryView();
    });

    [btnCurrent, btnAll, btnMode].forEach(b => toggleBar.appendChild(b));
    el.parentElement?.prepend(toggleBar);
  }

  function updateBtnStyles() {
    const btnCurrent = document.getElementById("sidebar-btn-scope-current");
    const btnAll = document.getElementById("sidebar-btn-scope-all");
    const btnMode = document.getElementById("sidebar-btn-mode-toggle");
    if (btnCurrent) {
      btnCurrent.textContent = scopeLabels.current;
      btnCurrent.style.background = sidebarScope === "current" ? "var(--border)" : "transparent";
      btnCurrent.style.color = sidebarScope === "current" ? "#fff" : "var(--text-muted)";
    }
    if (btnAll) {
      btnAll.textContent = scopeLabels.all;
      btnAll.style.background = sidebarScope === "all" ? "var(--border)" : "transparent";
      btnAll.style.color = sidebarScope === "all" ? "#fff" : "var(--text-muted)";
    }
    if (btnMode) {
      btnMode.textContent = sidebarViewMode === "hierarchy" ? "Hierarchy" : "Flat";
      btnMode.style.background = "var(--border-subtle)";
      btnMode.style.color = "#fff";
    }
  }

  updateBtnStyles();

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

  if (sidebarViewMode === "hierarchy") {
    renderHierarchicalMasteryBars(el, sorted, activeGetMastery);
  } else {
    renderMasteryBars(el, sorted, activeGetMastery);
  }
}

/**
 * Renders the 3-Tier Conceptual Mastery Hierarchy:
 *   Principle -> Application -> Concrete Instance
 */
export function renderHierarchicalMasteryBars(container, relations = [], getMastery = () => 0) {
  if (!container) return;
  container.innerHTML = "";

  // Group relations by Principle and Application
  const principleGroups = new Map();

  relations.forEach(rel => {
    const tax = getRelationTaxonomy(rel);
    const pId = tax?.principleId || "principle_other";
    const aId = tax?.applicationId || "app_other";

    if (!principleGroups.has(pId)) {
      principleGroups.set(pId, new Map());
    }
    const appMap = principleGroups.get(pId);
    if (!appMap.has(aId)) {
      appMap.set(aId, []);
    }
    appMap.get(aId).push(rel);
  });

  // Calculate aggregated scores and sort principles from weakest to strongest
  const principleList = Array.from(principleGroups.entries()).map(([pId, appMap]) => {
    const allRels = Array.from(appMap.values()).flat();
    const avgMastery = allRels.reduce((sum, r) => sum + getMastery(r), 0) / (allRels.length || 1);
    const pMeta = Object.values(PRINCIPLES).find(p => p.id === pId) || { name: "General Engineering Principle" };
    return { pId, pName: pMeta.name, avgMastery, appMap, allRels };
  }).sort((a, b) => a.avgMastery - b.avgMastery);

  principleList.forEach(({ pId, pName, avgMastery, appMap }) => {
    const pBox = document.createElement("div");
    pBox.className = "mastery-principle-box";
    pBox.style.marginBottom = "0.85rem";
    pBox.style.border = "1px solid var(--border-subtle)";
    pBox.style.borderRadius = "4px";
    pBox.style.padding = "0.4rem 0.5rem";
    pBox.style.background = "rgba(255, 255, 255, 0.02)";

    const pHeader = document.createElement("div");
    pHeader.style.display = "flex";
    pHeader.style.justifyContent = "space-between";
    pHeader.style.alignItems = "center";
    pHeader.style.marginBottom = "0.25rem";
    pHeader.style.cursor = "pointer";

    const pTitle = document.createElement("strong");
    pTitle.style.fontSize = "0.78rem";
    pTitle.style.color = "#fff";
    pTitle.textContent = pName;

    const pPct = document.createElement("span");
    pPct.style.fontFamily = "monospace";
    pPct.style.fontSize = "0.75rem";
    pPct.textContent = `${Math.round(avgMastery * 100)}%`;

    pHeader.appendChild(pTitle);
    pHeader.appendChild(pPct);

    const pBarBg = document.createElement("div");
    pBarBg.style.height = "5px";
    pBarBg.style.background = "var(--border-subtle)";
    pBarBg.style.borderRadius = "2px";
    pBarBg.style.overflow = "hidden";
    pBarBg.style.marginBottom = "0.45rem";

    const pBarFill = document.createElement("div");
    pBarFill.style.height = "100%";
    pBarFill.style.width = `${Math.round(avgMastery * 100)}%`;
    pBarFill.style.background = getOklabMasteryColor(avgMastery);
    pBarBg.appendChild(pBarFill);

    const appContainer = document.createElement("div");
    appContainer.className = "mastery-app-container";
    appContainer.style.paddingLeft = "0.5rem";

    // Sort applications by average mastery
    const appList = Array.from(appMap.entries()).map(([aId, instRels]) => {
      const aAvg = instRels.reduce((sum, r) => sum + getMastery(r), 0) / (instRels.length || 1);
      const aMeta = Object.values(APPLICATIONS).find(a => a.id === aId) || { name: "Application" };
      return { aId, aName: aMeta.name, aAvg, instRels };
    }).sort((a, b) => a.aAvg - b.aAvg);

    appList.forEach(({ aName, aAvg, instRels }) => {
      const aRow = document.createElement("div");
      aRow.style.marginBottom = "0.35rem";

      const aLabelBar = document.createElement("div");
      aLabelBar.style.display = "flex";
      aLabelBar.style.justifyContent = "space-between";
      aLabelBar.style.fontSize = "0.72rem";
      aLabelBar.style.color = "var(--text-muted)";

      const aTitleSpan = document.createElement("span");
      aTitleSpan.textContent = `↳ ${aName}`;

      const aPctSpan = document.createElement("span");
      aPctSpan.style.fontFamily = "monospace";
      aPctSpan.textContent = `${Math.round(aAvg * 100)}%`;

      aLabelBar.appendChild(aTitleSpan);
      aLabelBar.appendChild(aPctSpan);

      const aBarBg = document.createElement("div");
      aBarBg.style.height = "3px";
      aBarBg.style.background = "var(--border-subtle)";
      aBarBg.style.borderRadius = "2px";
      aBarBg.style.overflow = "hidden";
      aBarBg.style.margin = "0.15rem 0 0.35rem 0";

      const aBarFill = document.createElement("div");
      aBarFill.style.height = "100%";
      aBarFill.style.width = `${Math.round(aAvg * 100)}%`;
      aBarFill.style.background = getOklabMasteryColor(aAvg);
      aBarBg.appendChild(aBarFill);

      aRow.appendChild(aLabelBar);
      aRow.appendChild(aBarBg);

      // Render instance rows under this application
      instRels.forEach(rel => {
        const m = getMastery(rel);
        const row = document.createElement("div");
        row.className = "weight-row";
        row.style.paddingLeft = "0.6rem";
        row.style.marginBottom = "0.25rem";

        const labelBar = document.createElement("div");
        labelBar.className = "weight-label-bar";

        const nameSpan = document.createElement("span");
        nameSpan.style.fontSize = "0.68rem";
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.title = rel.name;
        nameSpan.textContent = rel.name;

        const pctSpan = document.createElement("span");
        pctSpan.style.fontFamily = "monospace";
        pctSpan.style.fontSize = "0.68rem";
        pctSpan.textContent = `${Math.round(m * 100)}%`;

        labelBar.appendChild(nameSpan);
        labelBar.appendChild(pctSpan);

        const barBg = document.createElement("div");
        barBg.style.height = "2px";
        barBg.style.background = "var(--border-subtle)";
        barBg.style.borderRadius = "1px";
        barBg.style.overflow = "hidden";

        const barFill = document.createElement("div");
        barFill.style.height = "100%";
        barFill.style.width = `${Math.round(m * 100)}%`;
        barFill.style.background = getOklabMasteryColor(m);

        barBg.appendChild(barFill);
        row.appendChild(labelBar);
        row.appendChild(barBg);
        aRow.appendChild(row);
      });

      appContainer.appendChild(aRow);
    });

    pHeader.addEventListener("click", () => {
      const isHidden = appContainer.style.display === "none";
      appContainer.style.display = isHidden ? "block" : "none";
    });

    pBox.appendChild(pHeader);
    pBox.appendChild(pBarBg);
    pBox.appendChild(appContainer);
    container.appendChild(pBox);
  });
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