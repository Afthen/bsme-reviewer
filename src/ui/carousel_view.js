/**
 * src/ui/carousel_view.js
 * Flashcard carousel with dynamic AST variable isolation,
 * interactive variable click navigation, and clean educational tooltips.
 */

import { isolateVariable } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";

/**
 * Filters raw schema aliases to only human descriptive synonyms.
 * Strips out code keys, LaTeX commands, technical symbols, and the currently used name.
 */
function getCleanHumanAliases(meta = {}, varKey = "", primaryName = "") {
  const all = meta.aliases || [];
  const primaryLower = (primaryName || "").trim().toLowerCase();
  const keyLower = (varKey || "").trim().toLowerCase();
  const symAlpha = (meta.symbol || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  const seen = new Set();
  const result = [];

  for (const alias of all) {
    if (!alias) continue;
    const aTrim = alias.trim();
    const aLower = aTrim.toLowerCase();

    // 1. Skip if it matches the name already shown at the top of the tooltip
    if (aLower === primaryLower) continue;

    // 2. Skip LaTeX commands e.g. \phi, \psi
    if (aTrim.startsWith("\\")) continue;

    // 3. Skip variable keys or raw symbol representations e.g. phi, Q, D_1, W_t, D_p
    if (aLower === keyLower) continue;
    if (aTrim === meta.symbol) continue;
    const aAlpha = aTrim.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (aAlpha === keyLower || aAlpha === symAlpha) continue;

    // 4. Skip short technical abbreviations (<= 3 chars without spaces, e.g. "Q", "SR", "N_p")
    if (aTrim.length <= 3 && !aTrim.includes(" ")) continue;

    if (!seen.has(aLower)) {
      seen.add(aLower);
      result.push(aTrim);
    }
  }

  return result;
}

/**
 * Controller to open and display the interactive carousel flashcard for a clicked variable.
 */
export function openCarouselForVariable(varKey, relations = [], varsDb = {}, S = {}) {
  const matchingRels = relations.filter(r => r.nodes && r.nodes.includes(varKey));
  if (matchingRels.length === 0) return;

  const problemView = document.getElementById("view-problem");
  const carouselView = document.getElementById("view-carousel");
  if (!problemView || !carouselView) return;

  problemView.classList.remove("active");
  carouselView.classList.add("active");

  let currentRelIdx = 0;
  let activeTarget = varKey;

  const varTitleEl = document.getElementById("c-var-title");
  const counterEl = document.getElementById("c-counter");
  const dimEl = document.getElementById("c-dimension");
  const formulaEl = document.getElementById("c-formula");
  const notesEl = document.getElementById("c-notes");
  const varsContainerEl = document.getElementById("c-vars-container");
  const prevBtn = document.getElementById("c-prev");
  const nextBtn = document.getElementById("c-next");
  const dotsEl = document.getElementById("c-dots");

  function renderCard() {
    const rel = matchingRels[currentRelIdx];
    const meta = varsDb[activeTarget] || {};
    const allowableTargets = rel.solvable || rel.nodes;

    if (varTitleEl) {
      varTitleEl.innerHTML = `${meta.name || activeTarget} &nbsp;<span style="color: var(--accent-math)">$${meta.symbol || activeTarget}$</span>`;
    }

    if (counterEl) {
      counterEl.textContent = `${currentRelIdx + 1} / ${matchingRels.length}`;
    }

    if (dimEl) {
      const u = S._u?.[activeTarget] || meta.unit || "";
      dimEl.textContent = `${meta.dimension || "Dimensionless"}${u ? ` (${u})` : ""}`;
    }

    if (notesEl) {
      notesEl.textContent = rel.name || "";
    }

    // Isolate activeTarget in the current relation
    const activeVariant = (rel.variants && S && S.sys && rel.variants[S.sys]) ? rel.variants[S.sys] : null;
    const baseFormula = activeVariant?.baseFormula || rel.baseFormula;
    const isolated = isolateVariable(baseFormula, activeTarget, varsDb);
    const targetSymbol = meta.symbol || activeTarget;

    if (formulaEl) {
      formulaEl.innerHTML = `$$${targetSymbol} = ${casToTex(isolated.isolatedRhs, varsDb)}$$`;
    }

    // Build rearrange pills for all variables in this equation
    if (varsContainerEl) {
      varsContainerEl.innerHTML = allowableTargets.map(tVar => {
        const tMeta = varsDb[tVar] || {};
        const isAct = tVar === activeTarget;
        return `<button class="var-pill ${isAct ? 'active' : ''}" data-target="${tVar}">$${tMeta.symbol || tVar}$</button>`;
      }).join(" ");

      varsContainerEl.querySelectorAll(".var-pill").forEach(btn => {
        btn.addEventListener("click", () => {
          activeTarget = btn.dataset.target;
          renderCard();
        });
      });
    }

    // Build navigation dots
    if (dotsEl) {
      dotsEl.innerHTML = matchingRels.map((_, i) => `<span class="dot ${i === currentRelIdx ? 'active' : ''}"></span>`).join("");
    }

    if (window.renderMathInElement) {
      window.renderMathInElement(carouselView, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    }
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentRelIdx = (currentRelIdx - 1 + matchingRels.length) % matchingRels.length;
      const rel = matchingRels[currentRelIdx];
      if (rel.nodes.includes(varKey)) activeTarget = varKey;
      else activeTarget = rel.nodes[0];
      renderCard();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentRelIdx = (currentRelIdx + 1) % matchingRels.length;
      const rel = matchingRels[currentRelIdx];
      if (rel.nodes.includes(varKey)) activeTarget = varKey;
      else activeTarget = rel.nodes[0];
      renderCard();
    };
  }

  renderCard();
}

/**
 * Attaches hover tooltips and variable click navigation to .interactive-var tokens.
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

    // 1. Dynamic Graph-Aware Formula Discovery (from this specific problem)
    let relFormulaTex = "";

    const targetStep = solution.find(s => s.targetVar === varKey);
    if (targetStep) {
      relFormulaTex = targetStep.canonicalTex || (targetStep.baseFormula ? casToTex(targetStep.baseFormula, varsDb) : "");
    } else {
      const consumingStep = solution.find(s => s.nodes && s.nodes.includes(varKey));
      if (consumingStep) {
        relFormulaTex = consumingStep.canonicalTex || (consumingStep.baseFormula ? casToTex(consumingStep.baseFormula, varsDb) : "");
      } else {
        const fallbackRel = relations.find(r => r.nodes && r.nodes.includes(varKey));
        if (fallbackRel) {
          relFormulaTex = fallbackRel.canonicalTex || (fallbackRel.baseFormula ? casToTex(fallbackRel.baseFormula, varsDb) : "");
        }
      }
    }

    // 2. Human Descriptive Synonyms Filter
    const humanAliases = getCleanHumanAliases(meta, varKey, primaryName);

    // Click handler to enter flashcard carousel mode
    el.addEventListener("click", e => {
      e.stopPropagation();
      tooltip.style.display = "none";
      openCarouselForVariable(varKey, relations, varsDb, S);
    });

    el.addEventListener("mouseenter", () => {
      // Formula speaks for itself (no preamble text)
      const formulaHtml = relFormulaTex ? `
        <div class="tt-formula-box">$$${relFormulaTex}$$</div>
      ` : "";

      const aliasesHtml = humanAliases.length > 0 ? `
        <div class="tt-section-label">Aliases / Synonyms:</div>
        <div class="tt-aliases-list">
          ${humanAliases.map(a => `<div class="tt-alias-item">• ${a}</div>`).join("")}
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

// Retain compatibility
export function renderCarouselPills() {}
export function renderCarouselCard() {}
