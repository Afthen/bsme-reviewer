/**
 * src/ui/carousel_view.js
 * Flashcard carousel with pure AST isolation and disabled pills for empirical non-invertibles.
 */

import { isolateVariable } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";

export function renderCarouselPills(containerEl, relations, varsDb, onSelectRelation) {
  if (!containerEl) return;
  containerEl.innerHTML = "";

  relations.forEach((rel, idx) => {
    const pill = document.createElement("button");
    pill.className = `carousel-pill ${idx === 0 ? "active" : ""}`;
    pill.dataset.relId = rel.id;
    pill.textContent = rel.name || `Equation ${idx + 1}`;

    pill.addEventListener("click", () => {
      containerEl.querySelectorAll(".carousel-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      if (typeof onSelectRelation === "function") {
        onSelectRelation(rel);
      }
    });

    containerEl.appendChild(pill);
  });
}

export function renderCarouselCard(cardEl, rel, varsDb, activeTarget = null, S = null) {
  if (!cardEl || !rel) return;

  const allowableTargets = rel.solvable || rel.nodes;
  const target = activeTarget || allowableTargets[0];
  const activeVariant = (rel.variants && S && S.sys && rel.variants[S.sys]) ? rel.variants[S.sys] : null;
  const baseFormula = activeVariant?.baseFormula || rel.baseFormula;

  const isolated = isolateVariable(baseFormula, target, varsDb);
  const targetMeta = varsDb[target] || {};
  const targetSymbol = targetMeta.symbol || target;

  const targetSelectorHtml = allowableTargets.map(tVar => {
    const sym = varsDb[tVar]?.symbol || tVar;
    const isAct = tVar === target;
    return `<button class="carousel-var-pill ${isAct ? 'active' : ''}" data-target="${tVar}">$${sym}$</button>`;
  }).join(" ");

  cardEl.innerHTML = `
    <div class="carousel-card-title">${rel.name}</div>
    <div class="carousel-targets-row">
      <span class="carousel-targets-label">Solve for:</span>
      ${targetSelectorHtml}
    </div>
    <div class="carousel-equation-display" id="carouselEqDisplay">
      $$${targetSymbol} = ${casToTex(isolated.isolatedRhs, varsDb)}$$
    </div>
  `;

  if (window.renderMathInElement) {
    window.renderMathInElement(cardEl, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }] });
  }

  cardEl.querySelectorAll(".carousel-var-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const newTarget = btn.dataset.target;
      renderCarouselCard(cardEl, rel, varsDb, newTarget, S);
    });
  });
}
