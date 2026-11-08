/**
 * src/ui/carousel_view.js
 * Flashcard carousel with dynamic AST variable isolation and graph-aware educational tooltips.
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
    window.renderMathInElement(cardEl, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ]
    });
  }

  cardEl.querySelectorAll(".carousel-var-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const newTarget = btn.dataset.target;
      renderCarouselCard(cardEl, rel, varsDb, newTarget, S);
    });
  });
}

/**
 * Attaches graph-aware educational tooltips to all interactive variables across the problem.
 * Discovers the relevant formula from the active problem's solution graph and orders aliases.
 */
export function attachTooltips(problemOrSystem, maybeSolution, maybeVarsDb, maybeRelations) {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  let S = {};
  let solution = [];
  let varsDb = {};
  let relations = [];
  let activeProblem = null;

  if (problemOrSystem && problemOrSystem.solution) {
    activeProblem = problemOrSystem;
    S = activeProblem.system || {};
    solution = activeProblem.solution || [];
    varsDb = activeProblem.varsDb || {};
    relations = Array.isArray(maybeSolution) ? maybeSolution : (activeProblem.relations || []);
  } else {
    S = problemOrSystem || {};
    solution = Array.isArray(maybeSolution) ? maybeSolution : [];
    varsDb = maybeVarsDb || {};
    relations = Array.isArray(maybeRelations) ? maybeRelations : [];
  }

  document.querySelectorAll(".interactive-var").forEach(el => {
    const varKey = el.dataset.var;
    if (!varKey) return;

    const meta = varsDb[varKey] || {};
    const primaryName = S._names?.[varKey] || meta.name || varKey;
    const dimStr = meta.dimension || "Dimensionless";
    const unit = S._u?.[varKey] || meta.unit || "";
    const unitStr = (unit && unit !== "dimless" && unit !== "ratio") ? ` (${unit})` : "";

    // 1. Dynamic Graph-Aware Formula Discovery
    let relFormulaTex = "";
    let relEqName = "";

    // Check A: Is varKey solved in a solution step?
    const targetStep = solution.find(s => s.targetVar === varKey);
    if (targetStep) {
      relFormulaTex = targetStep.canonicalTex || (targetStep.baseFormula ? casToTex(targetStep.baseFormula, varsDb) : "");
      relEqName = targetStep.eqName || "";
    } else {
      // Check B: Is varKey an input to a solution step in this problem?
      const consumingStep = solution.find(s => s.nodes && s.nodes.includes(varKey));
      if (consumingStep) {
        relFormulaTex = consumingStep.canonicalTex || (consumingStep.baseFormula ? casToTex(consumingStep.baseFormula, varsDb) : "");
        relEqName = consumingStep.eqName || "";
      } else {
        // Check C: Fallback to topic relations defining/using this variable
        const fallbackRel = relations.find(r => r.nodes && r.nodes.includes(varKey));
        if (fallbackRel) {
          relFormulaTex = fallbackRel.canonicalTex || (fallbackRel.baseFormula ? casToTex(fallbackRel.baseFormula, varsDb) : "");
          relEqName = fallbackRel.name || "";
        }
      }
    }

    // 2. Build Aliases List (Active problem name first, followed by unique synonyms)
    const allAliases = [primaryName, meta.name, ...(meta.aliases || [])].filter(Boolean);
    const uniqueAliases = [];
    const seen = new Set();
    for (const name of allAliases) {
      const lower = name.toLowerCase().trim();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueAliases.push(name);
      }
    }

    el.addEventListener("mouseenter", () => {
      const formulaHtml = relFormulaTex ? `
        <div class="tt-section-label">Relevant Formula${relEqName ? ` (${relEqName})` : ""}:</div>
        <div class="tt-formula-box">$$${relFormulaTex}$$</div>
      ` : "";

      const aliasesHtml = uniqueAliases.length > 1 ? `
        <div class="tt-section-label">Aliases / Synonyms:</div>
        <div class="tt-aliases-list">
          ${uniqueAliases.map((a, i) => `
            <div class="tt-alias-item ${i === 0 ? "active" : ""}">
              • ${a}${i === 0 ? ` <span class="tt-tag-used">(in problem)</span>` : ""}
            </div>
          `).join("")}
        </div>
      ` : "";

      tooltip.innerHTML = `
        <div class="tt-header">
          <div class="tt-name">${primaryName}</div>
          <div class="tt-dim">${dimStr}${unitStr}</div>
        </div>
        <div class="tt-symbol">$${meta.symbol || varKey}$</div>
        ${formulaHtml}
        ${aliasesHtml}
      `;

      tooltip.style.display = "block";
      if (window.renderMathInElement) {
        window.renderMathInElement(tooltip, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ]
        });
      }
    });

    el.addEventListener("mousemove", e => {
      const ttWidth = tooltip.offsetWidth || 300;
      const ttHeight = tooltip.offsetHeight || 180;
      let left = e.clientX + 14;
      let top = e.clientY + 14;

      // Screen edge collision avoidance
      if (left + ttWidth > window.innerWidth - 12) {
        left = e.clientX - ttWidth - 12;
      }
      if (top + ttHeight > window.innerHeight - 12) {
        top = e.clientY - ttHeight - 12;
      }

      tooltip.style.left = `${Math.max(8, left)}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    });

    el.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}
