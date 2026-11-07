/**
 * src/ui/sidebar_view.js
 * Mastery progress visualization and sidebar drawer controller.
 */

import { FADING_THRESHOLD, PHI_INV2 } from "../repetition/mastery.js";

let activeRelations = [];
let activeGetMastery = () => 0;
let isInitialized = false;

export function initSidebarView(relations = [], getMastery = () => 0) {
  activeRelations = relations;
  activeGetMastery = getMastery;

  // Always re-render the bars with the new topic relations
  renderMasteryBars(activeRelations, activeGetMastery);

  // Only bind the click event listeners ONCE to prevent instant-close bugs
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

export function renderMasteryBars(relations = [], getMastery = () => 0) {
  const el = document.getElementById("weight-bars-el");
  if (!el) return;
  el.innerHTML = "";

  relations.forEach(eq => {
    const mastery = getMastery(eq.id);
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
      : (mastery >= PHI_INV2 ? "var(--warning)" : "var(--accent-math)");
    barFill.style.transition = "width 0.3s ease";

    barBg.appendChild(barFill);
    row.appendChild(labelBar);
    row.appendChild(barBg);
    el.appendChild(row);
  });
}