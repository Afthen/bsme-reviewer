/**
 * src/ui/sidebar_view.js
 * Sidebar drawer controller with single-listener initialization guard.
 * Supports flexible signature: renderMasteryBars(relations, getMastery) or
 * renderMasteryBars(container, relations, getMastery).
 * initSidebarView is the ONLY setter of the drawer's active source.
 */

import { FADING_THRESHOLD, phi } from "../mastery/index.js";

/** Views dispatch this after mastery mutations; app.js re-renders per mode. */
export const MASTERY_CHANGED_EVENT = "bsme:mastery-changed";

let activeRelations = [];
let activeGetMastery = () => 0;
let isInitialized = false;

export function initSidebarView(relations = [], getMastery = () => 0) {
  activeRelations = relations;
  activeGetMastery = getMastery;

  renderMasteryBars(activeRelations, activeGetMastery);
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
      renderMasteryBars(activeRelations, activeGetMastery);
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
    ? containerOrRelations.querySelector("#weight-bars-el") || document.getElementById("weight-bars-el")
    : document.getElementById("weight-bars-el");

  if (!el) return;
  el.innerHTML = "";

  relations.forEach(eq => {
    // Passes the full equation object so AST token complexity can be evaluated
    const mastery = getMastery(eq);
    const pct = Math.round(mastery * 100);

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
    barFill.style.background = mastery >= FADING_THRESHOLD
      ? "var(--success)"
      : (mastery >= phi(-2) ? "var(--warning)" : "var(--accent-math)");
    barFill.style.transition = "width 0.3s ease";

    barBg.appendChild(barFill);
    row.appendChild(labelBar);
    row.appendChild(barBg);
    el.appendChild(row);
  });
}

// Named alias for app.js import
export const renderSidebar = renderMasteryBars;