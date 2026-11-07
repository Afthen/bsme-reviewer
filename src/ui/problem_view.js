/**
 * src/ui/problem_view.js
 * Interactive problem presenter, dynamic schema resolver, and derivation renderer.
 */

import { buildAlignedDerivation } from "../core/derivation.js";
import { targetLabel, fmtSigFig } from "../core/dimensions.js";
import {
  recordAttempt, penalizeAncestors, reinforceAncestors,
  incrementGlobalTick, PHI_INV8, getDecayedMastery
} from "../repetition/mastery.js";
import { attachTooltips } from "./carousel_view.js";
import { renderMasteryBars } from "./sidebar_view.js";

function resolveMeta(varKey, varsDb = {}) {
  return varsDb[varKey] || { name: varKey, symbol: varKey, unit: "" };
}

export function renderProblemView(activeProblem, relations = [], topicId = "spur_gears") {
  if (!activeProblem) return;

  document.getElementById("p-title").textContent = activeProblem.title;
  document.getElementById("p-statement").innerHTML = activeProblem.statement;

  const flowEl = document.getElementById("p-solution-flow");
  flowEl.innerHTML = "";

  activeProblem.solution.forEach((step, idx) => {
    const item = document.createElement("div");
    item.className = "solution-item";
    item.id = `step-item-${idx}`;

    const summary = document.createElement("div");
    summary.className = "solution-summary";

    const labelWrap = document.createElement("div");
    labelWrap.className = "step-label-wrap";

    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.textContent = "▶";

    const meta = resolveMeta(step.targetVar, activeProblem.varsDb);
    const unit = activeProblem.system._u?.[step.targetVar] || meta.unit || "";
    
    // Construct the interactive token span directly so LaTeX braces inside symbols (like P_{dn}) never get corrupted
    const symSpan = `<span class="interactive-var" data-var="${step.targetVar}">$${meta.symbol || step.targetVar}$</span>`;
    const labelText = targetLabel(meta.name, symSpan, unit);

    const targetSpan = document.createElement("span");
    targetSpan.innerHTML = `Step ${idx + 1}: ${labelText}`;

    labelWrap.appendChild(chevron);
    labelWrap.appendChild(targetSpan);

    const inputWrap = document.createElement("div");
    inputWrap.className = "step-input-wrap";

    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.className = "step-ans-input";
    input.placeholder = "Enter value...";

    if (step.isAnswered) {
      input.value = step.userVal !== undefined ? step.userVal : fmtSigFig(step.expectedVal, 6);
      input.classList.add(step.isRevealed ? "state-revealed" : "state-correct");
      input.disabled = true;
      item.classList.add("open");
    }

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") checkStepAnswer(idx, input, activeProblem, relations, topicId);
    });

    summary.addEventListener("click", e => {
      if (e.target === input || e.target.closest(".interactive-var")) return;
      if (!item.classList.contains("open") && !step.isAnswered) {
        revealStepAnswer(idx, input, activeProblem, relations, topicId);
      } else {
        item.classList.toggle("open");
        refreshStepDerivations(activeProblem, relations);
      }
      updateToggleAllButton(activeProblem);
    });

    inputWrap.appendChild(input);
    summary.appendChild(labelWrap);
    summary.appendChild(inputWrap);

    const body = document.createElement("div");
    body.className = "solution-body";

    const mathDiv = document.createElement("div");
    mathDiv.className = "solution-math-display";
    mathDiv.id = `math-display-${idx}`;

    body.appendChild(mathDiv);
    item.appendChild(summary);
    item.appendChild(body);
    flowEl.appendChild(item);
  });

  refreshStepDerivations(activeProblem, relations);
  renderDistractorBanner(activeProblem);
  updateToggleAllButton(activeProblem);

  if (window.renderMathInElement) {
    window.renderMathInElement(document.getElementById("view-problem"), {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false }
      ],
      output: "html",
      strict: false,
      throwOnError: false
    });
  }

  attachTooltips(activeProblem.system, activeProblem.solution, activeProblem.varsDb);
}

function refreshStepDerivations(activeProblem, relations) {
  const answeredVars = new Set(
    activeProblem.solution.filter(s => s.isAnswered).map(s => s.targetVar)
  );

  activeProblem.solution.forEach((step, idx) => {
    const mathDiv = document.getElementById(`math-display-${idx}`);
    if (mathDiv) {
      mathDiv.innerHTML = buildAlignedDerivation(
        step,
        activeProblem.system,
        activeProblem.allSteps,
        activeProblem.varsDb,
        relations,
        answeredVars,
        activeProblem.givens
      );
    }
  });

  if (window.renderMathInElement) {
    window.renderMathInElement(document.getElementById("p-solution-flow"), {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false }
      ],
      output: "html",
      strict: false,
      throwOnError: false
    });
  }
}

function checkStepAnswer(idx, inputEl, activeProblem, relations, topicId) {
  const step = activeProblem.solution[idx];
  const raw = inputEl.value.trim();
  if (raw === "") return revealStepAnswer(idx, inputEl, activeProblem, relations, topicId);

  incrementGlobalTick();
  const val = parseFloat(raw);
  if (isNaN(val)) return;

  const meta = resolveMeta(step.targetVar, activeProblem.varsDb);
  const expected = step.expectedVal;
  const tol = meta.isInteger ? 0.5 : Math.max(PHI_INV8 * Math.abs(expected), 0.05);
  const isCorrect = Math.abs(val - expected) <= tol;

  inputEl.classList.remove("state-correct", "state-wrong", "shake-trigger");

  if (isCorrect) {
    inputEl.classList.add("state-correct");
    inputEl.disabled = true;
    step.isAnswered = true;
    step.userVal = val;
    recordAttempt(step.eqId, true, topicId);
    reinforceAncestors(step.fadedAncestorEqIds || [], topicId);
    document.getElementById(`step-item-${idx}`).classList.add("open");
  } else {
    inputEl.classList.add("state-wrong", "shake-trigger");
    recordAttempt(step.eqId, false, topicId);
    penalizeAncestors(step.fadedAncestorEqIds || [], topicId);
    setTimeout(() => inputEl.classList.remove("shake-trigger"), 400);
  }

  refreshStepDerivations(activeProblem, relations);
  renderDistractorBanner(activeProblem);
  renderMasteryBars(relations, getDecayedMastery);
  updateToggleAllButton(activeProblem);
}

function revealStepAnswer(idx, inputEl, activeProblem, relations, topicId) {
  const step = activeProblem.solution[idx];
  step.isAnswered = true;
  step.isRevealed = true;
  step.userVal = step.expectedVal;
  inputEl.value = fmtSigFig(step.expectedVal, 6);
  inputEl.classList.add("state-revealed");
  inputEl.disabled = true;

  recordAttempt(step.eqId, false, topicId);
  penalizeAncestors(step.fadedAncestorEqIds || [], topicId);

  document.getElementById(`step-item-${idx}`).classList.add("open");
  refreshStepDerivations(activeProblem, relations);
  renderDistractorBanner(activeProblem);
  renderMasteryBars(relations, getDecayedMastery);
  updateToggleAllButton(activeProblem);
}

function renderDistractorBanner(activeProblem) {
  const banner = document.getElementById("distractor-banner");
  if (!banner) return;

  const allCompleted = activeProblem.solution.every(s => s.isAnswered);

  if (allCompleted && activeProblem.distractors && activeProblem.distractors.length > 0) {
    const list = activeProblem.distractors.map(v => {
      const meta = resolveMeta(v, activeProblem.varsDb);
      return `<strong>${meta.name} ($${meta.symbol}$)</strong>`;
    }).join(", ");
    banner.style.display = "block";
    banner.innerHTML = `<strong>Exam Tip (Distractor Variable Detected):</strong> Notice that ${list} was given in the specifications but was not needed in the solution path. Exams often supply extra parameters to test whether you choose the correct relations.`;

    if (window.renderMathInElement) {
      window.renderMathInElement(banner, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        output: "html",
        strict: false,
        throwOnError: false
      });
    }
  } else {
    banner.style.display = "none";
  }
}

function updateToggleAllButton(activeProblem) {
  const btn = document.getElementById("btn-toggle-all");
  const items = document.querySelectorAll(".solution-item");
  if (!btn || items.length === 0) return;

  const allCompleted = activeProblem.solution.every(s => s.isAnswered);
  const openCount = Array.from(items).filter(it => it.classList.contains("open")).length;

  if (openCount === 0 && !allCompleted) {
    btn.style.display = "none";
  } else if (!allCompleted) {
    btn.style.display = "inline-flex";
    btn.innerHTML = `<span style="cursor: pointer; border-bottom: 1px dotted var(--text-muted);">Collapse All</span>`;
    btn.onclick = () => {
      items.forEach(it => it.classList.remove("open"));
      updateToggleAllButton(activeProblem);
    };
  } else {
    btn.style.display = "inline-flex";
    const allOpen = openCount === items.length;
    btn.innerHTML = allOpen
      ? `<span style="cursor: pointer; border-bottom: 1px dotted var(--text-muted);">Collapse All</span>`
      : `<span style="cursor: pointer; border-bottom: 1px dotted var(--text-muted);">Expand All</span>`;
    btn.onclick = () => {
      items.forEach(it => allOpen ? it.classList.remove("open") : it.classList.add("open"));
      updateToggleAllButton(activeProblem);
    };
  }
}
