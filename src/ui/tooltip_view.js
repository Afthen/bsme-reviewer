/**
 * src/ui/tooltip_view.js
 * Dedicated Hover Tooltip Controller with viewport clamp & synonym resolution.
 */

import { casToTex } from "../cas/latex.js";
import { openCarouselForVariable } from "./carousel_view.js";

export function getCleanHumanAliases(meta = {}, varKey = "", primaryName = "") {
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
