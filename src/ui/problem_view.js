/**
 * src/ui/problem_view.js
 * Interactive problem presenter, step input validator, and derivation renderer.
 */

import { buildAlignedDerivation } from "../core/derivation.js";
import { getVarMeta } from "../topics/machine_design/spur_gears/schema.js";
import { targetLabel } from "../core/dimensions.js";
import {
  recordAttempt, penalizeAncestors, reinforceAncestors,
  incrementGlobalTick, PHI_INV8, getDecayedMastery
} from "../repetition/mastery.js";
import { attachTooltips } from "./carousel_view.js";
import { renderMasteryBars } from "./sidebar_view.js";

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

    const meta = getVarMeta(step.targetVar);
    const unit = activeProblem.system._u?.[step.targetVar] || meta.unit || "";
    const rawTarget = targetLabel(meta.name, `{{${meta.symbol || step.targetVar}|${step.targetVar}}}`, unit);

    const targetSpan = document.createElement("span");
    targetSpan.innerHTML = `Step ${idx + 1}: ${renderTargetMarkup(rawTarget)}`;

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
      input.value = step.userVal !== undefined ? step.userVal : step.expectedVal;
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
    mathDiv.innerHTML = buildAlignedDerivation(step, activeProblem.system, activeProblem.allSteps, activeProblem.varsDb, relations);

    body.appendChild(mathDiv);
    item.appendChild(summary);
    item.appendChild(body);
    flowEl.appendChild(item);
  });

  renderDistractorBanner(activeProblem);
  updateToggleAllButton(activeProblem);

  if (window.renderMathInElement) {
    window.renderMathInElement(document.getElementById("view-problem"), {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true }, { left: "$", right: "$", display: false }]
    });
  }

  attachTooltips(activeProblem.system, activeProblem.solution);
}

function checkStepAnswer(idx, inputEl, activeProblem, relations, topicId) {
  const step = activeProblem.solution[idx];
  const raw = inputEl.value.trim();
  if (raw === "") return revealStepAnswer(idx, inputEl, activeProblem, relations, topicId);

  incrementGlobalTick();
  const val = parseFloat(raw);
  if (isNaN(val)) return;

  const meta = getVarMeta(step.targetVar);
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

  renderMasteryBars(relations, getDecayedMastery);
  updateToggleAllButton(activeProblem);
}

function revealStepAnswer(idx, inputEl, activeProblem, relations, topicId) {
  const step = activeProblem.solution[idx];
  step.isAnswered = true;
  step.isRevealed = true;
  step.userVal = step.expectedVal;
  inputEl.value = step.expectedVal;
  inputEl.classList.add("state-revealed");
  inputEl.disabled = true;

  recordAttempt(step.eqId, false, topicId);
  penalizeAncestors(step.fadedAncestorEqIds || [], topicId);

  document.getElementById(`step-item-${idx}`).classList.add("open");
  renderMasteryBars(relations, getDecayedMastery);
  updateToggleAllButton(activeProblem);
}

function renderDistractorBanner(activeProblem) {
  const banner = document.getElementById("distractor-banner");
  if (!banner) return;
  if (activeProblem.distractors && activeProblem.distractors.length > 0) {
    const list = activeProblem.distractors.map(v => `<strong>${getVarMeta(v).name} ($${getVarMeta(v).symbol}$)</strong>`).join(", ");
    banner.style.display = "block";
    banner.innerHTML = `<strong>Exam Tip (Distractor Variable Detected):</strong> Notice that ${list} was given in the specifications but is not needed in the solution path. Exams often supply extra parameters to test whether you choose the correct relations.`;
  } else {
    banner.style.display = "none";
  }
}

function updateToggleAllButton(activeProblem) {
  const btn = document.getElementById("btn-toggle-all");
  const items = document.querySelectorAll(".solution-item");
  if (!btn || items.length === 0) return;

  btn.onclick = () => {
    const anyClosed = Array.from(items).some(it => !it.classList.contains("open"));
    items.forEach(it => anyClosed ? it.classList.add("open") : it.classList.remove("open"));
  };
}

function renderTargetMarkup(targetStr) {
  return targetStr.replace(/\{\{([^}]+)\}\}/g, (_, p1) => {
    const parts = p1.split("|");
    return `<span class="interactive-var" data-var="${parts[1] || parts[0]}">$${parts[0]}$</span>`;
  });
}
