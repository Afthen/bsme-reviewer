/**
 * src/ui/carousel_view.js
 * Flashcard carousel with dynamic CAS isolation and topic-aware tooltips.
 */

import { isolateVariable } from "../core/cas.js";

let currentCards = [];
let currentCardIdx = 0;
let isolatedVarMap = {};
let globalRelations = [];
let activeSystemRef = null;
let activeVarsDbRef = {};

function resolveMeta(varKey) {
  return activeVarsDbRef[varKey] || { name: varKey, symbol: varKey, dimension: "Dimensionless" };
}

export function initCarouselView(relations = []) {
  globalRelations = relations;

  document.getElementById("btn-back-to-problem")?.addEventListener("click", () => {
    document.getElementById("view-carousel").classList.remove("active");
    document.getElementById("view-problem").classList.add("active");
  });

  document.getElementById("c-prev")?.addEventListener("click", () => {
    if (currentCardIdx > 0) {
      currentCardIdx--;
      renderCurrentCard();
    }
  });

  document.getElementById("c-next")?.addEventListener("click", () => {
    if (currentCardIdx < currentCards.length - 1) {
      currentCardIdx++;
      renderCurrentCard();
    }
  });
}

export function openCarouselForVariable(varKey, system = null) {
  activeSystemRef = system;
  currentCards = globalRelations.filter(r => r.nodes && r.nodes.includes(varKey));
  if (currentCards.length === 0) return;

  currentCardIdx = 0;
  isolatedVarMap = {};

  document.getElementById("view-problem").classList.remove("active");
  document.getElementById("view-carousel").classList.add("active");

  const meta = resolveMeta(varKey);
  document.getElementById("c-var-title").textContent = meta.name || varKey;
  renderCurrentCard();
}

function renderCurrentCard() {
  if (currentCards.length === 0) return;
  const card = currentCards[currentCardIdx];
  const canonicalLhs = (card.baseFormula || "").split("=")[0].trim();
  const currentIsolated = isolatedVarMap[card.id] || canonicalLhs;

  document.getElementById("c-counter").textContent = `${currentCardIdx + 1} / ${currentCards.length}`;

  const isolatedMeta = resolveMeta(currentIsolated);
  document.getElementById("c-dimension").textContent = `[${isolatedMeta.dimension}]`;

  let displayLatex = card.canonicalTex;
  if (currentIsolated !== canonicalLhs) {
    const isolated = isolateVariable(card.baseFormula, currentIsolated, activeVarsDbRef);
    displayLatex = isolated.texEquation;
  }
  document.getElementById("c-formula").innerHTML = `\\[ ${displayLatex} \\]`;
  document.getElementById("c-notes").textContent = `${card.name} (Canonical Equation)`;

  const pillsCont = document.getElementById("c-vars-container");
  pillsCont.innerHTML = "";

  card.nodes.forEach(nodeVar => {
    const nodeMeta = resolveMeta(nodeVar);
    const pill = document.createElement("button");
    pill.className = `var-pill ${nodeVar === currentIsolated ? "active" : ""}`;
    pill.innerHTML = `$${nodeMeta.symbol || nodeVar}$`;

    pill.addEventListener("click", () => {
      isolatedVarMap[card.id] = nodeVar;
      renderCurrentCard();
    });

    pillsCont.appendChild(pill);
  });

  const dotsCont = document.getElementById("c-dots");
  dotsCont.innerHTML = "";
  currentCards.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = `dot ${i === currentCardIdx ? "active" : ""}`;
    dotsCont.appendChild(dot);
  });

  if (window.renderMathInElement) {
    window.renderMathInElement(document.getElementById("view-carousel"), {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false }
      ],
      output: "html",
      strict: false,
      throwOnError: false
    });
  }
}

export function attachTooltips(activeSystem = null, currentSteps = [], varsDb = {}) {
  activeVarsDbRef = varsDb;
  const tooltip = document.getElementById("tooltip");
  const varEls = document.querySelectorAll(".interactive-var");

  varEls.forEach(el => {
    const varKey = el.dataset.var;
    const meta = resolveMeta(varKey);
    const unit = activeSystem?._u?.[varKey] || meta.unit || "dimless";

    el.addEventListener("mouseenter", () => {
      const rect = el.getBoundingClientRect();
      const relevantStep = currentSteps.find(s => s.targetVar === varKey || (s.nodes && s.nodes.includes(varKey)));
      const relFormula = relevantStep ? `\\[ ${relevantStep.canonicalTex} \\]` : "";

      tooltip.innerHTML = `
        <div class="tt-name">${meta.name}</div>
        <div class="tt-math">$${meta.symbol || varKey}$ &bull; [${meta.dimension}] (${unit})</div>
        ${relFormula ? `<div style="margin: 0.35rem 0;">${relFormula}</div>` : ""}
        <div class="tt-hint">Click variable to review canonical formula cards</div>
      `;
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 6}px`;
      tooltip.style.display = "block";

      if (window.renderMathInElement) {
        window.renderMathInElement(tooltip, {
          delimiters: [
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          output: "html",
          strict: false,
          throwOnError: false
        });
      }
    });

    el.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    el.addEventListener("click", () => {
      tooltip.style.display = "none";
      openCarouselForVariable(varKey, activeSystem);
    });
  });
}