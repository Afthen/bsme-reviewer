// ========================================================
// app.js — Universal Reviewer & Spaced Repetition Engine
// ========================================================

const topic = window.CURRENT_TOPIC || {
  id: "spur_gears",
  title: "Spur Gears",
  varsDb: typeof GEAR_VARS_DB !== "undefined" ? GEAR_VARS_DB : {},
  relations: typeof GEAR_RELATION_GRAPH !== "undefined" ? GEAR_RELATION_GRAPH : [],
  seeds: typeof ORGANIC_SEED_PATTERNS !== "undefined" ? ORGANIC_SEED_PATTERNS : [],
  createSystem: typeof createGroundTruthSystem !== "undefined" ? createGroundTruthSystem : () => ({})
};

// ========================================================
// 1. MATHEMATICAL CONSTANTS & GOLDEN SYSTEM (Φ & e)
// ========================================================
const PHI = (1 + Math.sqrt(5)) / 2;             // 1.6180339887...
const PHI_INV = 1 / PHI;                         // 0.6180339887... (Harmonic discount)
const PHI_INV2 = PHI_INV * PHI_INV;              // 0.3819660113...
const PHI_INV3 = PHI_INV2 * PHI_INV;             // 0.2360679775...
const PHI_INV6 = Math.pow(PHI_INV, 6);           // 0.0557280900... (Min selection floor)
const PHI_INV7 = Math.pow(PHI_INV, 7);           // 0.0344418537... (Tick decay constant λ)
const PHI_INV8 = Math.pow(PHI_INV, 8);           // 0.0212862363... (Relative error tolerance)
const E = Math.E;                                // 2.7182818284...

// Derived pedagogical parameters
const FADING_MASTERY_THRESHOLD = 1 - PHI_INV3;   // 1 - φ⁻³ ≈ 0.7639 (Golden Fading Threshold)
const HISTORY_WINDOW_SIZE = 8;                   // F_6 = 8 (Fibonacci attempt buffer)
const TICK_DECAY_LAMBDA = PHI_INV7;              // Half-life = ln(2)/φ⁻⁷ ≈ 20.13 ≈ 21 ticks (F_8)

// Storage Keys
const STORAGE_KEY_GLOBAL_TICK = "me_global_problem_tick";
const STORAGE_KEY_MASTERY = `${topic.id}_mastery_clean`;
const STORAGE_KEY_COUNT = `${topic.id}_problem_count`;
const STORAGE_KEY_ACTIVE = `${topic.id}_active_problem_v4`;

let edgeHistory = {};
let fileHandle = null;
let activeProblem = null;

// ========================================================
// 2. TICK-BASED FORGETTING & HARMONIC MASTERY
// ========================================================
function getGlobalTick() {
  return parseInt(localStorage.getItem(STORAGE_KEY_GLOBAL_TICK) || "0", 10);
}

function incrementGlobalTick() {
  const t = getGlobalTick() + 1;
  localStorage.setItem(STORAGE_KEY_GLOBAL_TICK, t.toString());
  return t;
}

function loadMastery() {
  const raw = localStorage.getItem(STORAGE_KEY_MASTERY);
  if (raw) {
    try {
      edgeHistory = JSON.parse(raw);
    } catch (e) {
      edgeHistory = {};
    }
  }
}

function saveMastery() {
  localStorage.setItem(STORAGE_KEY_MASTERY, JSON.stringify(edgeHistory));
  syncToFile();
}

async function syncToFile() {
  if (!fileHandle) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(edgeHistory, null, 2));
    await writable.close();
  } catch (err) {
    console.warn("Auto-sync to file failed:", err);
  }
}

/**
 * Calculates decayed mastery using harmonic attempt weighting and
 * tick-based exponential interference: M = M_base * e^(-λ * Δticks)
 */
function calculateDecayedMastery(eqId) {
  const h = edgeHistory[eqId];
  if (!h || !h.attempts || h.attempts.length === 0) return 0;

  // 1. Harmonic attempt weighting using powers of PHI_INV
  let weightSum = 0;
  let scoreSum = 0;
  const len = h.attempts.length;
  for (let i = 0; i < len; i++) {
    const w = Math.pow(PHI_INV, len - 1 - i);
    weightSum += w;
    scoreSum += (h.attempts[i] ? 1 : 0) * w;
  }
  const baseMastery = weightSum > 0 ? scoreSum / weightSum : 0;

  // 2. Discrete interference decay using e and PHI_INV7
  const currentTick = getGlobalTick();
  const lastTick = h.lastPracticedTick !== undefined ? h.lastPracticedTick : currentTick;
  const deltaTicks = Math.max(0, currentTick - lastTick);
  const decayMultiplier = Math.pow(E, -TICK_DECAY_LAMBDA * deltaTicks);

  return baseMastery * decayMultiplier;
}

function recordEquationAttempt(eqId, success) {
  const currentTick = getGlobalTick();
  if (!edgeHistory[eqId]) {
    edgeHistory[eqId] = { attempts: [], lastPracticedTick: currentTick };
  }
  edgeHistory[eqId].attempts.push(success);
  if (edgeHistory[eqId].attempts.length > HISTORY_WINDOW_SIZE) {
    edgeHistory[eqId].attempts.shift();
  }
  edgeHistory[eqId].lastPracticedTick = currentTick;
  saveMastery();
  renderWeightBars();
}

/**
 * Backpropagates diagnostic blame to faded ancestors when a compound step is failed.
 */
function penalizeBlameEquation(eqId) {
  const currentTick = getGlobalTick();
  if (!edgeHistory[eqId]) {
    edgeHistory[eqId] = { attempts: [], lastPracticedTick: currentTick };
  }
  edgeHistory[eqId].attempts.push(false);
  if (edgeHistory[eqId].attempts.length > HISTORY_WINDOW_SIZE) {
    edgeHistory[eqId].attempts.shift();
  }
  edgeHistory[eqId].lastPracticedTick = currentTick;
  saveMastery();
}

/**
 * Reinforces decay timers of faded ancestors on successful compound execution.
 */
function reinforceEquationAttempt(eqId) {
  const currentTick = getGlobalTick();
  if (edgeHistory[eqId]) {
    edgeHistory[eqId].lastPracticedTick = currentTick;
    saveMastery();
  }
}

// ========================================================
// 3. SIDEBAR MASTERY VISUALIZATION
// ========================================================
function toggleSidebar() {
  const aside = document.querySelector("aside");
  const overlay = document.getElementById("sidebar-overlay");
  const isOpen = aside.classList.contains("open");
  if (isOpen) {
    aside.classList.remove("open");
    overlay.classList.remove("active");
  } else {
    aside.classList.add("open");
    overlay.classList.add("active");
    renderWeightBars();
  }
}

function renderWeightBars() {
  const el = document.getElementById("weight-bars-el");
  if (!el) return;
  el.innerHTML = "";

  const relations = topic.relations || [];
  relations.forEach(eq => {
    const mastery = calculateDecayedMastery(eq.id);
    const pct = Math.round(mastery * 100);

    const row = document.createElement("div");
    row.className = "weight-row";

    const labelBar = document.createElement("div");
    labelBar.className = "weight-label-bar";

    const nameSpan = document.createElement("span");
    nameSpan.style.overflow = "hidden";
    nameSpan.style.textOverflow = "ellipsis";
    nameSpan.style.whiteSpace = "nowrap";
    nameSpan.title = eq.name;
    nameSpan.textContent = eq.name;

    const pctSpan = document.createElement("span");
    pctSpan.style.fontFamily = "monospace";
    pctSpan.textContent = `${pct}%`;

    labelBar.appendChild(nameSpan);
    labelBar.appendChild(pctSpan);

    const barBg = document.createElement("div");
    barBg.style.height = "4px";
    barBg.style.background = "var(--border-subtle)";
    barBg.style.borderRadius = "2px";
    barBg.style.overflow = "hidden";

    const barFill = document.createElement("div");
    barFill.style.height = "100%";
    barFill.style.width = `${pct}%`;
    barFill.style.background = mastery >= FADING_MASTERY_THRESHOLD
      ? "var(--success)"
      : (mastery >= PHI_INV2 ? "var(--warning)" : "var(--accent-math)");
    barFill.style.transition = "width 0.3s ease";

    barBg.appendChild(barFill);
    row.appendChild(labelBar);
    row.appendChild(barBg);
    el.appendChild(row);
  });
}

// ========================================================
// 4. PROBLEM GENERATION & ADAPTIVE FADING
// ========================================================
function generateOrganicStatement(cand, S) {
  const parts = [];
  cand.givens.forEach(v => {
    const val = S[v];
    const u = unitOf(S, v, topic.varsDb);
    const meta = topic.varsDb[v] || {};
    const displaySym = meta.symbol || v;
    const name = getVarName(S, v, topic.varsDb);
    const uStr = (u && u !== "dimless" && u !== "ratio" && u !== "teeth") ? `\\text{ ${u}}` : (u === "deg" ? "^\\circ" : "");
    // Wrapped in .math-token to prevent orphaned '(' on line breaks:
    parts.push(`${name}&nbsp;<span class="math-token">($${displaySym} = ${fmt(val, 2)}${uStr}$)</span>`);
  });

  const goalMeta = topic.varsDb[cand.goal] || {};
  const goalSym = goalMeta.symbol || cand.goal;
  const goalName = getVarName(S, cand.goal, topic.varsDb);
  const goalU = unitOf(S, cand.goal, topic.varsDb);
  const goalUStr = (goalU && goalU !== "dimless" && goalU !== "ratio" && goalU !== "teeth") ? ` in $\\text{${goalU}}$` : "";

  return `A spur gear drive operates with the following specifications: ${parts.join(", ")}. Determine: <strong>${goalName}</strong>&nbsp;<span class="math-token">($${goalSym}$)</span>${goalUStr}.`;
}

function generateGraphProblem() {
  // NOTE: Does NOT advance global tick. Ticks only advance upon active student problem-solving!
  const S = topic.createSystem();
  const candidates = getSeedCandidates(topic);

  // Score candidate problems using harmonic spaced repetition weights
  const scored = candidates.map(cand => {
    const steps = solveProblemOnGraph(cand.givens, S, topic.relations);
    const goalStep = steps.find(s => s.targetVar === cand.goal);
    if (!goalStep) return { cand, steps: null, weight: 0 };

    const ancestors = [goalStep, ...goalStep.ancestorIndices.map(i => steps[i])];
    let totalMastery = 0;
    ancestors.forEach(s => {
      totalMastery += calculateDecayedMastery(s.eqId);
    });
    const avgMastery = ancestors.length > 0 ? totalMastery / ancestors.length : 0;
    const weight = Math.max(PHI_INV6, 1 - avgMastery);
    return { cand, steps, weight };
  }).filter(c => c.steps !== null);

  if (scored.length === 0) return;

  // A-RES weighted sampling
  scored.sort((a, b) => {
    const rA = Math.pow(Math.random(), 1 / a.weight);
    const rB = Math.pow(Math.random(), 1 / b.weight);
    return rB - rA;
  });

  const chosen = scored[0];
  const cand = chosen.cand;
  const solSteps = chosen.steps;
  const goalIdx = solSteps.findIndex(s => s.targetVar === cand.goal);

  // Collect all topological steps required to reach the goal
  const requiredStepIndices = new Set([goalIdx, ...solSteps[goalIdx].ancestorIndices]);
  const allPathSteps = solSteps.filter((_, idx) => requiredStepIndices.has(idx));

  // Determine Fading: Intermediate steps fade if decayed mastery >= 0.7639
  allPathSteps.forEach(st => {
    if (st.targetVar === cand.goal) {
      st.isFaded = false; // Goal is always active
    } else {
      const mastery = calculateDecayedMastery(st.eqId);
      st.isFaded = mastery >= FADING_MASTERY_THRESHOLD;
    }
  });

  // Attach faded ancestors to the goal step for compound algebraic derivation and blame tracking
  const finalVisibleSteps = allPathSteps.filter(st => !st.isFaded).map(st => {
    const fadedAncestors = (st.ancestorIndices || [])
      .map(i => solSteps[i])
      .filter(s => s && s.isFaded);

    return {
      targetVar: st.targetVar,
      eqId: st.eqId,
      text: st.text,
      equation: st.equation,
      expectedVal: st.expectedVal,
      target: st.target,
      parentIndices: st.parentIndices,
      ancestorIndices: st.ancestorIndices,
      fadedAncestorEqIds: fadedAncestors.map(s => s.eqId),
      isCompound: fadedAncestors.length > 0,
      isAnswered: false,
      isRevealed: false
    };
  });

  const statement = generateOrganicStatement(cand, S);
  activeProblem = {
    title: cand.name,
    statement,
    givens: cand.givens,
    goal: cand.goal,
    system: S,
    allPathSteps,
    solution: finalVisibleSteps
  };

  localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeProblem));
  renderProblemView();
}

// ========================================================
// 5. SOLUTION RENDERING & INTERACTIVE INPUTS
// ========================================================
function renderProblemView() {
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

    const badge = step.isCompound ? ` <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 3px; background: rgba(147, 197, 253, 0.15); color: var(--accent-math);">Compound Leapfrog</span>` : "";
    const targetSpan = document.createElement("span");
    targetSpan.innerHTML = `Step ${idx + 1}: ${renderStepTargetText(step.target)}${badge}`;

    labelWrap.appendChild(chevron);
    labelWrap.appendChild(targetSpan);

    const inputWrap = document.createElement("div");
    inputWrap.className = "step-input-wrap";

    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.className = "step-ans-input";
    input.placeholder = "Enter value...";
    input.dataset.stepIdx = idx;

    if (step.isAnswered) {
      input.value = step.userVal !== undefined ? step.userVal : step.expectedVal;
      input.classList.add(step.isRevealed ? "state-revealed" : "state-correct");
      input.disabled = true;
      item.classList.add("open");
    }

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        checkStepAnswer(idx, input);
      }
    });

    summary.addEventListener("click", e => {
      if (e.target === input) return;
      item.classList.toggle("open");
    });

    inputWrap.appendChild(input);
    summary.appendChild(labelWrap);
    summary.appendChild(inputWrap);

    const body = document.createElement("div");
    body.className = "solution-body";

    const textP = document.createElement("p");
    textP.className = "solution-text";

    const mathDiv = document.createElement("div");
    mathDiv.className = "solution-math-display";

    // Build compound algebraic derivation if ancestors were faded
    const compound = buildCompoundDerivation(step, activeProblem.system, activeProblem.allPathSteps);
    if (compound && compound.derivationBlock) {
      textP.innerHTML = compound.note || step.text;
      mathDiv.innerHTML = `\\[ ${compound.derivationBlock} \\]\n\\[ ${compound.finalBlock} \\]`;
    } else {
      textP.innerHTML = step.text;
      mathDiv.innerHTML = `\\[ ${step.equation} \\]`;
    }

    body.appendChild(textP);
    body.appendChild(mathDiv);

    item.appendChild(summary);
    item.appendChild(body);
    flowEl.appendChild(item);
  });

  checkDistractors();
  renderMathInElement(document.getElementById("view-problem"), {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false }
    ],
    throwOnError: false
  });
  attachInteractiveVars();
}

function renderStepTargetText(targetStr) {
  if (!targetStr) return "";
  return targetStr.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
    const parts = p1.split("|");
    const sym = parts[0];
    const key = parts[1] || sym;
    return `<span class="interactive-var" data-var="${key}">$${sym}$</span>`;
  });
}

function checkStepAnswer(idx, inputEl) {
  const step = activeProblem.solution[idx];
  const raw = inputEl.value.trim();

  // If empty, user chose to reveal without solving
  if (raw === "") {
    revealStepAnswer(idx, inputEl);
    return;
  }

  // Active cognitive attempt: increment global interference clock
  incrementGlobalTick();

  const val = parseFloat(raw);
  if (isNaN(val)) return;

  const expected = step.expectedVal;
  const isInteger = !!(topic.varsDb[step.targetVar] && topic.varsDb[step.targetVar].isInteger);

  let correct = false;
  if (isInteger) {
    correct = Math.round(val) === Math.round(expected);
  } else {
    // Relative tolerance using PHI_INV8 (≈ 2.1%) and absolute floor PHI_INV6 (≈ 0.056)
    const tol = Math.max(PHI_INV8 * Math.abs(expected), PHI_INV6);
    correct = Math.abs(val - expected) <= tol;
  }

  inputEl.classList.remove("state-correct", "state-wrong", "state-warning", "shake-trigger");

  if (correct) {
    inputEl.classList.add("state-correct");
    inputEl.disabled = true;
    step.isAnswered = true;
    step.userVal = val;
    step.isRevealed = false;
    recordEquationAttempt(step.eqId, true);
    
    // Reinforce decay timers of ancestors
    (step.fadedAncestorEqIds || []).forEach(ancId => reinforceEquationAttempt(ancId));
    document.getElementById(`step-item-${idx}`).classList.add("open");
  } else {
    inputEl.classList.add("state-wrong", "shake-trigger");
    recordEquationAttempt(step.eqId, false);
    
    // Backpropagate blame: knocks ancestors below 0.7639 so next problem un-fades scaffolding!
    (step.fadedAncestorEqIds || []).forEach(ancId => penalizeBlameEquation(ancId));

    setTimeout(() => {
      inputEl.classList.remove("shake-trigger");
    }, 400);
  }

  localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeProblem));
}

function revealStepAnswer(idx, inputEl) {
  const step = activeProblem.solution[idx];

  // NOTE: Revealing does NOT increment the global tick.
  step.isAnswered = true;
  step.isRevealed = true;
  step.userVal = step.expectedVal;
  inputEl.value = step.expectedVal;
  inputEl.classList.add("state-revealed");
  inputEl.disabled = true;
  
  // Local equation fail:
  recordEquationAttempt(step.eqId, false);
  
  // Diagnostic reset on ancestors:
  (step.fadedAncestorEqIds || []).forEach(ancId => penalizeBlameEquation(ancId));

  document.getElementById(`step-item-${idx}`).classList.add("open");
  localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(activeProblem));
}

function toggleAllSolutions() {
  const items = document.querySelectorAll(".solution-item");
  const anyOpen = Array.from(items).some(it => it.classList.contains("open"));
  items.forEach(it => {
    if (anyOpen) it.classList.remove("open");
    else it.classList.add("open");
  });
}

/**
 * Distractor classifier: considers BOTH active visible steps AND faded ancestor steps!
 */
function checkDistractors() {
  const banner = document.getElementById("distractor-banner");
  if (!banner || !activeProblem) return;

  const givens = activeProblem.givens;
  const usedVars = new Set();
  
  // Inspect the entire derivation tree (both visible and faded)
  (activeProblem.allPathSteps || activeProblem.solution).forEach(s => {
    const eq = (topic.relations || []).find(e => e.id === s.eqId);
    if (eq) eq.nodes.forEach(n => usedVars.add(n));
  });

  const distractors = givens.filter(v => !usedVars.has(v));

  if (distractors.length > 0) {
    const dList = distractors.map(v => {
      const sym = (topic.varsDb[v] && topic.varsDb[v].symbol) || v;
      return `${getVarName(activeProblem.system, v, topic.varsDb)} <span class="math-token">($${sym}$)</span>`;
    }).join(", ");
    banner.style.display = "block";
    banner.innerHTML = `<strong>Exam Tip (Distractor Variable Detected):</strong> Notice that <em>${dList}</em> was provided in the specifications but is not needed in the solution path. Exams often supply extra parameters to test whether you choose the correct relations.`;
  } else {
    banner.style.display = "none";
  }
}

// ========================================================
// 6. TOOLTIPS & CAROUSEL VIEW
// ========================================================
let activeCards = [];
let currentCardIdx = 0;

function attachInteractiveVars() {
  const tooltip = document.getElementById("tooltip");
  const varEls = document.querySelectorAll(".interactive-var");

  varEls.forEach(el => {
    const varKey = el.dataset.var;
    const meta = topic.varsDb[varKey];
    if (!meta) return;

    el.addEventListener("mouseenter", e => {
      const rect = el.getBoundingClientRect();
      const sym = meta.symbol || varKey;
      tooltip.innerHTML = `
        <div class="tt-name">${meta.name}</div>
        <div class="tt-math">$${sym}$ &bull; Unit: ${meta.unit || "dimless"}</div>
        <div class="tt-hint">Click variable to review formula cards</div>
      `;
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 6}px`;
      tooltip.style.display = "block";
      renderMathInElement(tooltip, { delimiters: [{ left: "$", right: "$", display: false }] });
    });

    el.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    el.addEventListener("click", () => {
      tooltip.style.display = "none";
      openCarousel(varKey);
    });
  });
}

function openCarousel(varKey) {
  activeCards = getGraphCardsForVariable(varKey, activeProblem, topic.relations, topic.varsDb);
  if (!activeCards || activeCards.length === 0) return;

  currentCardIdx = 0;
  document.getElementById("view-problem").classList.remove("active");
  document.getElementById("view-carousel").classList.add("active");

  const meta = topic.varsDb[varKey] || {};
  document.getElementById("c-var-title").textContent = meta.name || varKey;
  renderCurrentCard();
}

function renderCurrentCard() {
  if (!activeCards || activeCards.length === 0) return;
  const card = activeCards[currentCardIdx];

  document.getElementById("c-counter").textContent = `${currentCardIdx + 1} / ${activeCards.length}`;
  document.getElementById("c-unit").textContent = (topic.varsDb[card.targetVar] || {}).unit || "";
  document.getElementById("c-formula").innerHTML = `\\[ ${card.formula} \\]`;
  document.getElementById("c-notes").textContent = card.notes;

  const linkedCont = document.getElementById("c-linked-container");
  linkedCont.innerHTML = "";
  card.vars.forEach(v => {
    const meta = topic.varsDb[v] || {};
    const sym = meta.symbol || v;
    const span = document.createElement("span");
    span.className = "interactive-var";
    span.dataset.var = v;
    span.innerHTML = `$${sym}$`;
    linkedCont.appendChild(span);
  });

  const dotsCont = document.getElementById("c-dots");
  dotsCont.innerHTML = "";
  activeCards.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = `dot ${i === currentCardIdx ? "active" : ""}`;
    dotsCont.appendChild(dot);
  });

  renderMathInElement(document.getElementById("view-carousel"), {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false }
    ],
    throwOnError: false
  });
  attachInteractiveVars();
}

function nextCard() {
  if (currentCardIdx < activeCards.length - 1) {
    currentCardIdx++;
    renderCurrentCard();
  }
}

function prevCard() {
  if (currentCardIdx > 0) {
    currentCardIdx--;
    renderCurrentCard();
  }
}

function backToProblem() {
  document.getElementById("view-carousel").classList.remove("active");
  document.getElementById("view-problem").classList.add("active");
}

// ========================================================
// 7. BACKUP IMPORT / EXPORT & SYNC
// ========================================================
function exportMasteryFile() {
  const blob = new Blob([JSON.stringify(edgeHistory, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${topic.id}_mastery.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerImportMastery() {
  document.getElementById("mastery-file-input").click();
}

function handleMasteryImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      edgeHistory = data;
      saveMastery();
      renderWeightBars();
      alert("Mastery profile successfully imported!");
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

async function openFolderPicker() {
  if (!window.showSaveFilePicker) {
    alert("File System Access API is not supported in this browser. Use Export/Import buttons instead.");
    return;
  }
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: `${topic.id}_mastery.json`,
      types: [{ description: "JSON Files", accept: { "application/json": [".json"] } }]
    });
    syncToFile();
    alert("Live file sync established!");
  } catch (err) {
    console.log("File picker cancelled.");
  }
}

// ========================================================
// 8. INITIALIZATION
// ========================================================
window.addEventListener("DOMContentLoaded", () => {
  loadMastery();
  generateGraphProblem();
});