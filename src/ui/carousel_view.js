/**
 * src/ui/carousel_view.js
 * Flashcard carousel modal with dynamic AST variable isolation,
 * interactive variable click navigation, and clean educational tooltips.
 */

import { isolateVariable } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";

let activeKeyDownHandler = null;

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

    if (aLower === primaryLower) continue;
    if (aTrim.startsWith("\\")) continue;
    if (aLower === keyLower) continue;
    if (aTrim === meta.symbol) continue;
    const aAlpha = aTrim.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (aAlpha === keyLower || aAlpha === symAlpha) continue;
    if (aTrim.length <= 3 && !aTrim.includes(" ")) continue;

    if (!seen.has(aLower)) {
      seen.add(aLower);
      result.push(aTrim);
    }
  }

  return result;
}

export function openCarouselForVariable(varKey, relations = [], varsDb = {}, S = {}, initialRelId = null) {
  const matchingRels = relations.filter(r => r.nodes && r.nodes.includes(varKey));
  if (matchingRels.length === 0) return;

  const carouselModal = document.getElementById("view-carousel");
  if (!carouselModal) return;

  carouselModal.classList.add("active");

  let currentRelIdx = 0;
  if (initialRelId) {
    const idx = matchingRels.findIndex(r => r.id === initialRelId);
    if (idx >= 0) currentRelIdx = idx;
  }

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
    if (activeKeyDownHandler) {
      document.removeEventListener("keydown", activeKeyDownHandler);
      activeKeyDownHandler = null;
    }
  }

  // Prevent listener stacking on re-open
  if (activeKeyDownHandler) {
    document.removeEventListener("keydown", activeKeyDownHandler);
  }

  activeKeyDownHandler = function(e) {
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prevBtn?.click();
    if (e.key === "ArrowRight") nextBtn?.click();
  };
  document.addEventListener("keydown", activeKeyDownHandler);

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

    if (!isolatedTarget) {
      const canonicalTex = activeVariant?.canonicalTex || rel.canonicalTex || casToTex(baseFormula, varsDb);
      if (formulaEl) {
        formulaEl.innerHTML = `$$${canonicalTex}$$`;
      }
    } else {
      const isolated = isolateVariable(baseFormula, isolatedTarget, varsDb);
      const targetSymbol = varsDb[isolatedTarget]?.symbol || isolatedTarget;
      if (formulaEl) {
        formulaEl.innerHTML = `$$${targetSymbol} = ${casToTex(isolated.isolatedRhs, varsDb)}$$`;
      }
    }

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
      isolatedTarget = null;
      renderCard();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentRelIdx = (currentRelIdx + 1) % matchingRels.length;
      isolatedTarget = null;
      renderCard();
    };
  }

  renderCard();
}

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

    const humanAliases = getCleanHumanAliases(meta, varKey, primaryName);

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
