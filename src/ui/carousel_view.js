/**
 * src/ui/carousel_view.js
 * Flashcard carousel modal with dynamic AST variable isolation,
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
 * Controller to open and display the interactive carousel flashcard modal.
 * Syncs the initial slide to the formula shown in the tooltip, and defaults to canonical textbook formulas.
 */
export function openCarouselForVariable(varKey, relations = [], varsDb = {}, S = {}, initialRelId = null) {
  const matchingRels = relations.filter(r => r.nodes && r.nodes.includes(varKey));
  if (matchingRels.length === 0) return;

  const carouselModal = document.getElementById("view-carousel");
  if (!carouselModal) return;

  // Open modal overlay
  carouselModal.classList.add("active");

  // Sync initial slide to the relation shown in the tooltip
  let currentRelIdx = 0;
  if (initialRelId) {
    const idx = matchingRels.findIndex(r => r.id === initialRelId);
    if (idx >= 0) currentRelIdx = idx;
  }

  // Active isolated target is null by default so canonical formula is shown first
  let isolatedTarget = null;

  const varTitleEl = document.getElementById("c-var-title");
  const counterEl = document.getElementById("c-counter");
  const dimEl = document.getElementById("c-dimension");
  const formulaEl = document.getElementById("c-formula");
  const notesEl = document.getElementById("c-notes");
  const varsContainerEl = document.getElementById("c-vars-container");
  const prevBtn = document.getElementById("c-prev");
  const nextBtn = document.getElementById("c-next");
  const dotsEl = document.getElementById("c-dots");
  const backBtn = document.getElementById("btn-back-to-problem");

  function closeModal() {
    carouselModal.classList.remove("active");
    document.removeEventListener("keydown", handleKeyDown);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prevBtn?.click();
    if (e.key === "ArrowRight") nextBtn?.click();
  }
  document.addEventListener("keydown", handleKeyDown);

  // Close on backdrop click (outside container)
  carouselModal.onclick = (e) => {
    if (e.target === carouselModal) closeModal();
  };

  if (backBtn) {
    backBtn.onclick = closeModal;
  }

  function renderCard() {
    const rel = matchingRels[currentRelIdx];
    const meta = varsDb[varKey] || {};
    const allowableTargets = rel.solvable || rel.nodes;

    if (varTitleEl) {
      varTitleEl.innerHTML = `${meta.name || varKey} &nbsp;<span style="color: var(--accent-math)">$${meta.symbol || varKey}$</span>`;
    }

    if (counterEl) {
      counterEl.textContent = `${currentRelIdx + 1} / ${matchingRels.length}`;
    }

    if (dimEl) {
      const u = S._u?.[varKey] || meta.unit || "";
      dimEl.textContent = `${meta.dimension || "Dimensionless"}${u ? ` (${u})` : ""}`;
    }

    if (notesEl) {
      notesEl.textContent = rel.name || "";
    }

    const activeVariant = (rel.variants && S && S.sys && rel.variants[S.sys]) ? rel.variants[S.sys] : null;
    const baseFormula = activeVariant?.baseFormula || rel.baseFormula;

    // By default, display the canonical formula as taught in textbooks
    if (!isolatedTarget) {
      const canonicalTex = activeVariant?.canonicalTex || rel.canonicalTex || casToTex(baseFormula, varsDb);
      if (formulaEl) {
        formulaEl.innerHTML = `$$${canonicalTex}$$`;
      }
    } else {
      // Manual isolation triggered by student clicking a pill
      const isolated = isolateVariable(baseFormula, isolatedTarget, varsDb);
      const targetSymbol = varsDb[isolatedTarget]?.symbol || isolatedTarget;
      if (formulaEl) {
        formulaEl.innerHTML = `$$${targetSymbol} = ${casToTex(isolated.isolatedRhs, varsDb)}$$`;
      }
    }

    // Build rearrange pills for all variables in this equation
    if (varsContainerEl) {
      varsContainerEl.innerHTML = allowableTargets.map(tVar => {
        const tMeta = varsDb[tVar] || {};
        const isAct = tVar === isolatedTarget;
        return `<button class="var-pill ${isAct ? 'active' : ''}" data-target="${tVar}">$${tMeta.symbol || tVar}$</button>`;
      }).join(" ");

      varsContainerEl.querySelectorAll(".var-pill").forEach(btn => {
        btn.addEventListener("click", () => {
          isolatedTarget = (isolatedTarget === btn.dataset.target) ? null : btn.dataset.target;
          renderCard();
        });
      });
    }

    // Navigation dots
    if (dotsEl) {
      dotsEl.innerHTML = matchingRels.map((_, i) => `<span class="dot ${i === currentRelIdx ? 'active' : ''}"></span>`).join("");
    }

    if (window.renderMathInElement) {
      window.renderMathInElement(carouselModal, {
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
      isolatedTarget = null; // Reset to canonical formula on slide change
      renderCard();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentRelIdx = (currentRelIdx + 1) % matchingRels.length;
      isolatedTarget = null; // Reset to canonical formula on slide change
      renderCard();
    };
  }

  renderCard();
}

/**
 * Attaches hover tooltips and click navigation to .interactive-var tokens.
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
    let matchedRelId = null;

    const targetStep = solution.find(s => s.targetVar === varKey);
    if (targetStep) {
      relFormulaTex = targetStep.canonicalTex || (targetStep.baseFormula ? casToTex(targetStep.baseFormula, varsDb) : "");
      matchedRelId = targetStep.eqId;
    } else {
      const consumingStep = solution.find(s => s.nodes && s.nodes.includes(varKey));
      if (consumingStep) {
        relFormulaTex = consumingStep.canonicalTex || (consumingStep.baseFormula ? casToTex(consumingStep.baseFormula, varsDb) : "");
        matchedRelId = consumingStep.eqId;
      } else {
        const fallbackRel = relations.find(r => r.nodes && r.nodes.includes(varKey));
        if (fallbackRel) {
          relFormulaTex = fallbackRel.canonicalTex || (fallbackRel.baseFormula ? casToTex(fallbackRel.baseFormula, varsDb) : "");
          matchedRelId = fallbackRel.id;
        }
      }
    }

    // 2. Human Descriptive Synonyms Filter
    const humanAliases = getCleanHumanAliases(meta, varKey, primaryName);

    // Click handler: opens carousel directly on the relation shown in the tooltip
    el.addEventListener("click", e => {
      e.stopPropagation();
      tooltip.style.display = "none";
      openCarouselForVariable(varKey, relations, varsDb, S, matchedRelId);
    });

    el.addEventListener("mouseenter", () => {
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

export function renderCarouselPills() {}
export function renderCarouselCard() {}
