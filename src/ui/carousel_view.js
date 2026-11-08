/**
 * src/ui/carousel_view.js
 * Flashcard Carousel Modal & Formula Variable Isolator.
 */

import { isolateVariable } from "../cas/algebra.js";
import { casToTex } from "../cas/latex.js";

// Facade re-export so all existing callers and tests remain 100% unbroken
export { attachTooltips } from "./tooltip_view.js";

let activeKeyDownHandler = null;

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
