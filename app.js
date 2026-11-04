// ========================================================
// app.js — Spaced Repetition Engine & UI Controller
// ========================================================

window.onerror = function (msg, url, line) {
  console.error("Reviewer Error:", msg, "at line", line);
  const container = document.getElementById("p-statement");
  if (container) {
    container.innerHTML = `<div style="color: #f87171; background: #261616; padding: 1rem; border-radius: 4px; border: 1px solid #7f1d1d;">
      <strong>JavaScript Error:</strong> ${msg} (Line ${line})<br>
      <small style="color: #94a3b8;">Check Developer Tools console for full trace.</small>
    </div>`;
  }
};

// ========================================================
// 1. PHI HARMONIC ENGINE
// ========================================================
const PHI = (1 + Math.sqrt(5)) / 2;     // 1.6180339887...
const PHI_INV = 1 / PHI;                // 0.6180339887...
const PHI_INV2 = PHI_INV * PHI_INV;     // 0.3819660113...
const PHI_INV3 = Math.pow(PHI_INV, 3);  // 0.2360679774...
const PHI_INV6 = Math.pow(PHI_INV, 6);  // 0.0557280900...
const DECAY_WINDOW = 13;                // Fibonacci window

let edgeHistory = loadStoredMastery();
let globalProblemCounter = loadStoredCounter();
let loadedProblems = [];
let activeProblem = null;
let currentVarKey = null;
let cardIdx = 0;
let activeCarouselCards = [];
let currentDirHandle = null;
let lastSeedKey = null;

const INTEGER_VARS = ["T", "T_1", "T_2"];

function loadStoredMastery() {
  const saved = localStorage.getItem("spur_gear_mastery_clean");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      return data.history || data;
    } catch (e) {}
  }
  return {};
}

function loadStoredCounter() {
  const saved = localStorage.getItem("spur_gear_problem_count");
  return saved ? parseInt(saved, 10) || 0 : 0;
}

function saveMastery() {
  const exportPayload = {
    version: "3.9",
    updatedAt: new Date().toISOString(),
    globalProblemCount: globalProblemCounter,
    history: edgeHistory
  };
  localStorage.setItem("spur_gear_mastery_clean", JSON.stringify(exportPayload));
  localStorage.setItem("spur_gear_problem_count", String(globalProblemCounter));
  writeMasteryToFolder(exportPayload);
}

async function writeMasteryToFolder(payload) {
  if (!currentDirHandle) return;
  try {
    const fileHandle = await currentDirHandle.getFileHandle("mastery.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
  } catch (e) {
    console.log("Could not auto-write mastery.json to folder", e);
  }
}

function exportMasteryFile() {
  const payload = {
    version: "3.9",
    exportedAt: new Date().toISOString(),
    globalProblemCount: globalProblemCounter,
    history: edgeHistory
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mastery.json";
  a.click();
}

function triggerImportMastery() {
  document.getElementById("mastery-file-input").click();
}

function handleMasteryImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const data = JSON.parse(evt.target.result);
      edgeHistory = data.history || data;
      globalProblemCounter = data.globalProblemCount || globalProblemCounter;
      saveMastery();
      renderLeitnerSidebar();
      if (activeProblem) selectProblem(activeProblem.id);
      alert("Mastery progress restored from mastery.json!");
    } catch (err) {
      alert("Invalid mastery.json file format");
    }
  };
  reader.readAsText(file);
}

function ensureEdgeHistoryItem(eqId) {
  if (!edgeHistory || typeof edgeHistory !== "object") edgeHistory = {};
  if (!edgeHistory[eqId] || typeof edgeHistory[eqId] !== "object") {
    edgeHistory[eqId] = { c: 0, w: 0, u: 0, lastTested: globalProblemCounter, recent: [] };
    return edgeHistory[eqId];
  }
  if (Array.isArray(edgeHistory[eqId])) {
    const arr = edgeHistory[eqId];
    const c = arr.filter(x => x === '✓').length;
    const w = arr.filter(x => x === '✕').length;
    edgeHistory[eqId] = { c, w, u: 0, lastTested: globalProblemCounter, recent: [...arr] };
    return edgeHistory[eqId];
  }
  if (!Array.isArray(edgeHistory[eqId].recent)) edgeHistory[eqId].recent = [];
  if (typeof edgeHistory[eqId].c !== "number") edgeHistory[eqId].c = 0;
  if (typeof edgeHistory[eqId].w !== "number") edgeHistory[eqId].w = 0;
  if (typeof edgeHistory[eqId].u !== "number") edgeHistory[eqId].u = 0;
  if (typeof edgeHistory[eqId].lastTested !== "number") edgeHistory[eqId].lastTested = globalProblemCounter;
  return edgeHistory[eqId];
}

function getFormulaStats(eqId) {
  const record = ensureEdgeHistoryItem(eqId);
  const c = record.c, w = record.w, u = record.u;
  const S_eff = (PHI * c) + (PHI_INV * u) + (PHI_INV3 * w);
  const urgency = Math.exp(-S_eff / PHI);
  return { c, w, u, S_eff, urgency, recent: record.recent, lastTested: record.lastTested };
}

function getEdgeTierInfo(eqId) {
  const eq = GEAR_RELATION_GRAPH.find(e => e.id === eqId);
  const targetWins = eq?.termsCount || 3;
  const stats = getFormulaStats(eqId);
  const recent = stats.recent;

  if (recent.length === 0) {
    return { tier: 2, label: "New", weight: 1.0, recent, targetWins };
  }

  const deltaN = globalProblemCounter - stats.lastTested;
  if (deltaN > DECAY_WINDOW && recent.length >= targetWins && recent.every(x => x === '✓')) {
    recent.shift();
    ensureEdgeHistoryItem(eqId).lastTested = globalProblemCounter;
    saveMastery();
  }

  const consecutiveWins = recent.slice(-targetWins).filter(x => x === '✓').length;
  const isMastered = (recent.length >= targetWins && consecutiveWins === targetWins);

  if (isMastered) {
    return { tier: 3, label: "Mastered", weight: Math.max(PHI_INV6, stats.urgency), recent, targetWins };
  }

  const isNeedsWork = (recent[recent.length - 1] === '✕' || stats.w > stats.c);
  if (isNeedsWork) {
    return { tier: 1, label: "Needs Practice", weight: Math.max(PHI, stats.urgency * PHI * PHI), recent, targetWins };
  }

  return { tier: 2, label: "In Progress", weight: stats.urgency, recent, targetWins };
}

function recordStepResult(eqId, isCorrect) {
  if (!eqId) return;
  const eq = GEAR_RELATION_GRAPH.find(e => e.id === eqId);
  const targetWins = eq?.termsCount || 3;
  const record = ensureEdgeHistoryItem(eqId);

  record.lastTested = globalProblemCounter;
  if (isCorrect) {
    record.c += 1;
    record.recent.push('✓');
  } else {
    record.w += 1;
    record.recent.push('✕');
  }

  if (record.recent.length > targetWins) record.recent.shift();
  saveMastery();
  renderLeitnerSidebar();
}

function recordPassiveExposure(eqId) {
  if (!eqId) return;
  const record = ensureEdgeHistoryItem(eqId);
  record.u += 1;
  saveMastery();
}

function resetProgress() {
  if (confirm("Reset all formula mastery history and practice dots?")) {
    edgeHistory = {};
    saveMastery();
    renderLeitnerSidebar();
    if (activeProblem) selectProblem(activeProblem.id);
  }
}

function renderLeitnerSidebar() {
  const container = document.getElementById("weight-bars-el");
  if (!container) return;
  container.innerHTML = "";

  const items = GEAR_RELATION_GRAPH.map(eq => {
    const info = getEdgeTierInfo(eq.id);
    return { eqId: eq.id, name: eq.name, ...info };
  });

  items.sort((a, b) => a.tier - b.tier);

  const tierSections = [
    { tier: 1, title: "🔴 Needs Practice", list: items.filter(i => i.tier === 1) },
    { tier: 2, title: "🟡 In Progress", list: items.filter(i => i.tier === 2) },
    { tier: 3, title: "🟢 Mastered", list: items.filter(i => i.tier === 3) }
  ];

  tierSections.forEach(sec => {
    if (sec.list.length === 0) return;
    const secTitle = document.createElement("div");
    secTitle.style.fontSize = "0.72rem";
    secTitle.style.fontWeight = "600";
    secTitle.style.color = "var(--text)";
    secTitle.style.marginTop = "0.4rem";
    secTitle.textContent = `${sec.title} (${sec.list.length})`;
    container.appendChild(secTitle);

    sec.list.forEach(item => {
      const row = document.createElement("div");
      row.className = "weight-row";

      let dotsHtml = "";
      const rec = item.recent;
      for (let i = 0; i < item.targetWins; i++) {
        const sym = rec[i];
        if (sym === '✓') dotsHtml += `<span style="color:#22c55e;">●</span>`;
        else if (sym === '✕') dotsHtml += `<span style="color:#ef4444;">●</span>`;
        else dotsHtml += `<span style="color:#3f3f46;">○</span>`;
      }

      row.innerHTML = `
        <div class="weight-label-bar">
          <span title="${item.name}">${item.name}</span>
          <span style="font-size: 0.8rem; letter-spacing: 2px;">${dotsHtml}</span>
        </div>
      `;
      container.appendChild(row);
    });
  });

  const resetDiv = document.createElement("div");
  resetDiv.style.textAlign = "right";
  resetDiv.style.marginTop = "0.75rem";
  resetDiv.innerHTML = `<button onclick="resetProgress()" style="background:none; border:none; color:var(--text-dim); font-size:0.68rem; cursor:pointer; text-decoration:underline;">Reset Mastery</button>`;
  container.appendChild(resetDiv);
}

// ========================================================
// 2. A-RES SEED SAMPLER & GENERATOR
// ========================================================
function generateOrganicStatement(givens, targetSteps, S) {
  const givenPhrases = givens.map(varKey => {
    const meta = GEAR_VARS_DB[varKey] || { name: varKey, unit: "" };
    const u = unitOf(S, varKey);
    const val = fmt(S[varKey]);
    let displaySym = varKey === "phi" ? "\\phi" : varKey.replace(/_([a-zA-Z0-9]{2,})/g, "_{$1}");
    const uStr = (u === "deg" || varKey === "phi") ? "°" : (Units.tex(u) ? `\\,${Units.tex(u)}` : "");
    return `${meta.name} ({{${displaySym}|${varKey}}}) = $${val}${uStr}$`;
  });

  const givensText = givenPhrases.join(", ");
  const activeTargets = targetSteps.filter(s => !s.isFaded);
  const finalTargets = activeTargets.length > 0 ? activeTargets : [targetSteps[targetSteps.length - 1]];
  const targetText = finalTargets.map(s => s.target).join(", ");

  return `A spur gear drive operates with the following specifications: ${givensText}. Determine: ${targetText}.`;
}

function generateGraphProblem() {
  globalProblemCounter += 1;
  const S = createGroundTruthSystem();

  const W = {};
  GEAR_RELATION_GRAPH.forEach(eq => { W[eq.id] = getEdgeTierInfo(eq.id); });

  let pick = null, bestKey = -1;
  getSeedCandidates().forEach(cand => {
    const steps = solveProblemOnGraph(cand.givens, S);
    const gi = steps.findIndex(s => s.targetVar === cand.goal);
    if (gi < 0) return;
    const req = new Set([gi, ...steps[gi].ancestorIndices]);
    let score = 0;
    req.forEach(i => { score += W[steps[i].eqId].weight; });
    if (cand.key === lastSeedKey) score *= PHI_INV3;
    const key = Math.pow(Math.random(), 1 / Math.pow(score, PHI));
    if (key > bestKey) { bestKey = key; pick = { cand }; }
  });

  if (!pick) {
    const p = ORGANIC_SEED_PATTERNS[0];
    pick = { cand: { name: p.name, topic: p.topic, givens: p.givens, goal: p.goals[0], key: `${p.name}>${p.goals[0]}` } };
  }

  const cand = pick.cand;
  const steps = solveProblemOnGraph(cand.givens, S);
  const gi = steps.findIndex(s => s.targetVar === cand.goal);
  if (gi >= 0) {
    const req = new Set([gi, ...steps[gi].ancestorIndices]);
    steps.forEach((step, idx) => {
      step.outOfScope = !req.has(idx);
      step.isFaded = step.outOfScope || (W[step.eqId].tier === 3 && idx !== gi);
    });
  }

  lastSeedKey = cand.key;
  const statement = generateOrganicStatement(cand.givens, steps, S);

  const newProblem = {
    id: `graph_${Date.now()}`,
    archetype: cand.topic,
    title: cand.name,
    statement,
    givens: cand.givens,
    solution: steps,
    S
  };

  loadedProblems.push(newProblem);
  selectProblem(newProblem.id);
  renderLeitnerSidebar();
}

// ========================================================
// 3. WORKSPACE & UI CONTROLLER
// ========================================================
window.addEventListener("DOMContentLoaded", async () => {
  renderLeitnerSidebar();
  generateGraphProblem();
});

async function openFolderPicker() {
  if (window.showDirectoryPicker) {
    try {
      currentDirHandle = await window.showDirectoryPicker();
      try {
        const masteryFileHandle = await currentDirHandle.getFileHandle("mastery.json");
        const file = await masteryFileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        edgeHistory = data.history || data;
        globalProblemCounter = data.globalProblemCount || globalProblemCounter;
        saveMastery();
      } catch (e) {
        writeMasteryToFolder({ version: "3.9", globalProblemCount: globalProblemCounter, history: edgeHistory });
      }
      renderLeitnerSidebar();
    } catch (e) {
      console.log("Folder sync canceled", e);
    }
  }
}

function getExpectedValue(item) {
  if (!item) return null;
  if (typeof item.expectedVal === "number" && !isNaN(item.expectedVal)) {
    return item.expectedVal;
  }
  if (item.equation) {
    const m = item.equation.match(/\\mathbf\{([0-9.]+)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function updateToggleAllVisibility() {
  const btn = document.getElementById("btn-toggle-all");
  const distractorBanner = document.getElementById("distractor-banner");
  if (!activeProblem) return;

  const allResolved = (activeProblem.solution || []).every(s => s.isResolved || s.isFaded);

  if (allResolved) {
    if (btn) btn.style.display = "block";

    if (activeProblem.givens && distractorBanner) {
      const usedGivens = new Set();
      activeProblem.solution.forEach(step => {
        if (step.isResolved) {
          const eq = GEAR_RELATION_GRAPH.find(e => e.id === step.eqId);
          if (eq) {
            eq.nodes.forEach(n => {
              if (activeProblem.givens.includes(n)) usedGivens.add(n);
            });
          }
        }
      });

      const unused = activeProblem.givens.filter(g => !usedGivens.has(g));
      if (unused.length > 0) {
        const unusedLabels = unused.map(k => {
          const m = GEAR_VARS_DB[k] || { name: k };
          let sym = k === "phi" ? "\\phi" : k.replace(/_([a-zA-Z0-9]{2,})/g, "_{$1}");
          return `<strong>${m.name}</strong> ($${sym}$)`;
        }).join(", ");

        const verb = unused.length > 1 ? "were distractor specifications" : "was a distractor specification";
        distractorBanner.innerHTML = `💡 <strong>Exam Sharpness Check:</strong> You correctly identified that ${unusedLabels} ${verb} not needed for your solution path!`;
        distractorBanner.style.display = "block";

        if (window.renderMathInElement) {
          renderMathInElement(distractorBanner, {
            delimiters: [{ left: "$", right: "$", display: false }],
            throwOnError: false
          });
        }
      } else {
        distractorBanner.style.display = "none";
      }
    }
  } else {
    if (btn) btn.style.display = "none";
    if (distractorBanner) distractorBanner.style.display = "none";
  }
}

function selectProblem(id) {
  activeProblem = loadedProblems.find(p => p.id === id);
  if (!activeProblem) return;

  document.getElementById("p-title").textContent = activeProblem.title;
  renderTextWithMath(document.getElementById("p-statement"), activeProblem.statement);

  const flowEl = document.getElementById("p-solution-flow");
  flowEl.innerHTML = "";

  const activeTargets = (activeProblem.solution || []).filter(s => !s.isFaded);
  const finalTargets = activeTargets.length > 0 ? activeTargets : [activeProblem.solution[activeProblem.solution.length - 1]];

  const neededIndices = new Set();
  finalTargets.forEach(targetStep => {
    const tIdx = activeProblem.solution.indexOf(targetStep);
    if (tIdx >= 0) neededIndices.add(tIdx);
    (targetStep.ancestorIndices || []).forEach(aIdx => neededIndices.add(aIdx));
  });

  (activeProblem.solution || []).forEach((item, index) => {
    if (!neededIndices.has(index)) return;
    if (item.isFaded) return;

    const itemEl = document.createElement("div");
    itemEl.className = "solution-item";
    itemEl.id = `step-item-${index}`;

    item.isResolved = item.isResolved || false;
    item.triedValues = item.triedValues || new Set();

    const summary = document.createElement("div");
    summary.className = "solution-summary";

    const labelWrap = document.createElement("div");
    labelWrap.className = "step-label-wrap";
    labelWrap.innerHTML = `<span class="chevron">▸</span><span id="sum-text-${index}"></span>`;

    labelWrap.onclick = e => {
      e.stopPropagation();
      const willOpen = !itemEl.classList.contains("open");
      itemEl.classList.toggle("open");

      if (willOpen && !item.isResolved) {
        item.isResolved = true;
        if (!item.penalized) {
          item.penalized = true;
          recordStepResult(item.eqId, false);
        }
        const inp = document.getElementById(`input-step-${index}`);
        if (inp) {
          inp.className = "step-ans-input state-revealed";
          inp.value = "";
          inp.placeholder = "Revealed";
          inp.disabled = true;
        }
        updateToggleAllVisibility();
      }
    };

    summary.appendChild(labelWrap);

    const inputWrap = document.createElement("div");
    inputWrap.className = "step-input-wrap";
    inputWrap.onclick = e => {
      e.stopPropagation();
      const inp = document.getElementById(`input-step-${index}`);
      if (inp) inp.focus();
    };

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.className = "step-ans-input";
    input.placeholder = "Value...";
    input.id = `input-step-${index}`;
    input.autocomplete = "off";

    if (item.isResolved) {
      if (item.isCorrect) {
        input.className = "step-ans-input state-correct";
        input.value = `${fmt(getExpectedValue(item))}  ✓`;
        input.disabled = true;
        itemEl.classList.add("open");
      } else {
        input.className = "step-ans-input state-revealed";
        input.placeholder = "Revealed";
        input.disabled = true;
      }
    }

    input.oninput = () => input.classList.remove("state-wrong", "state-warning");
    input.onkeydown = e => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        checkStepAnswer(index, input.value.trim(), item);
      }
    };

    inputWrap.appendChild(input);
    summary.appendChild(inputWrap);
    itemEl.appendChild(summary);

    const body = document.createElement("div");
    body.className = "solution-body";

    if (item.text) {
      const txt = document.createElement("div");
      txt.className = "solution-text";
      renderTextWithMath(txt, item.text);
      body.appendChild(txt);
    }

    const compound = buildCompoundDerivation(item, activeProblem.S, activeProblem.solution);
    if (compound) {
      const derivBox = document.createElement("div");
      derivBox.className = "solution-math-display";
      renderMathOnly(derivBox, compound.derivationBlock);
      body.appendChild(derivBox);

      const finalBox = document.createElement("div");
      finalBox.className = "solution-math-display";
      finalBox.style.marginTop = "0.5rem";
      renderMathOnly(finalBox, compound.finalBlock);
      body.appendChild(finalBox);
    } else if (item.equation) {
      const eq = document.createElement("div");
      eq.className = "solution-math-display";
      renderMathOnly(eq, item.equation);
      body.appendChild(eq);
    }

    itemEl.appendChild(body);
    flowEl.appendChild(itemEl);

    const label = item.target ? `Solve for ${item.target}` : `Step ${index + 1}`;
    renderTextWithMath(document.getElementById(`sum-text-${index}`), label);
  });

  updateToggleAllVisibility();
  backToProblem();
}

function checkStepAnswer(stepIndex, userStr, item) {
  const itemEl = document.getElementById(`step-item-${stepIndex}`);
  const inputEl = document.getElementById(`input-step-${stepIndex}`);

  if (!userStr) {
    if (inputEl) inputEl.focus();
    return;
  }

  const cleanStr = userStr.replace(',', '.');
  const userVal = parseFloat(cleanStr);
  if (isNaN(userVal) || !/^-?\d*(\.\d+)?$/.test(cleanStr)) {
    if (inputEl) {
      inputEl.classList.add("shake-trigger");
      inputEl.focus();
    }
    return;
  }

  const expected = getExpectedValue(item);
  if (expected === null || isNaN(expected)) {
    item.isResolved = true;
    itemEl.classList.add("open");
    if (inputEl) {
      inputEl.className = "step-ans-input state-revealed";
      inputEl.disabled = true;
    }
    updateToggleAllVisibility();
    return;
  }

  const relDiff = Math.abs(userVal - expected) / Math.max(Math.abs(expected), 1e-4);
  const maxAbsAllowed = Math.max(0.0005, Math.abs(expected) * 0.025);
  const absDiff = Math.abs(userVal - expected);
  const isCorrect = INTEGER_VARS.includes(item.targetVar)
    ? absDiff < 1e-9
    : (relDiff < 0.025 || absDiff <= maxAbsAllowed);

  if (isCorrect) {
    item.isResolved = true;
    item.isCorrect = true;
    recordStepResult(item.eqId, true);

    if (inputEl) {
      inputEl.value = `${userStr}  ✓`;
      inputEl.className = "step-ans-input state-correct";
      inputEl.disabled = true;
    }
    itemEl.classList.add("open");

    const ancestors = item.ancestorIndices || [];
    ancestors.forEach(prevIndex => {
      const prevItem = activeProblem.solution[prevIndex];
      if (prevItem && !prevItem.isResolved) {
        prevItem.isResolved = true;
        prevItem.isCorrect = true;
        recordStepResult(prevItem.eqId, true);

        const prevItemEl = document.getElementById(`step-item-${prevIndex}`);
        const prevInputEl = document.getElementById(`input-step-${prevIndex}`);
        if (prevInputEl) {
          prevInputEl.value = `${fmt(getExpectedValue(prevItem))}  ✓`;
          prevInputEl.className = "step-ans-input state-correct";
          prevInputEl.disabled = true;
        }
        if (prevItemEl) prevItemEl.classList.add("open");
      }
    });

    activeProblem.solution.forEach(st => {
      if (!st.isResolved && !st.outOfScope && !st.exposed && !ancestors.includes(activeProblem.solution.indexOf(st))) {
        st.exposed = true;
        recordPassiveExposure(st.eqId);
      }
    });

    updateToggleAllVisibility();
  } else {
    const exactNumericKey = String(userVal);
    const alreadyTried = item.triedValues.has(exactNumericKey);

    if (!alreadyTried) {
      item.triedValues.add(exactNumericKey);
      if (!item.penalized) {
        item.penalized = true;
        recordStepResult(item.eqId, false);
      }
      if (inputEl) inputEl.className = "step-ans-input state-wrong";
    } else {
      if (inputEl) inputEl.className = "step-ans-input state-warning";
    }

    if (inputEl) {
      inputEl.classList.remove("shake-trigger");
      void inputEl.offsetWidth;
      inputEl.classList.add("shake-trigger");
      inputEl.focus();
      inputEl.select();
    }
  }
}

function toggleAllSolutions() {
  const items = document.querySelectorAll(".solution-item");
  const anyClosed = Array.from(items).some(it => !it.classList.contains("open"));
  items.forEach(it => {
    if (anyClosed) {
      it.style.display = "block";
      it.classList.add("open");
    } else {
      it.classList.remove("open");
    }
  });
}

// ========================================================
// 4. MATH, TOOLTIP & CAROUSEL (Base Formula Shown)
// ========================================================
function renderTextWithMath(container, rawText) {
  if (!container) return;
  container.innerHTML = "";
  if (!rawText) return;

  const varTokens = [];
  const processed = rawText.replace(/\{\{(.+?)(?:\|([a-zA-Z0-9_\\-]+))?\}\}/g, (_, disp, base) => {
    const token = `__VARKATEX_${varTokens.length}__`;
    varTokens.push({ display: disp.trim(), base: (base || disp).trim() });
    return token;
  });

  const mathParts = processed.split("$");
  mathParts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      const span = document.createElement("span");
      katex.render(part, span, { throwOnError: false });
      container.appendChild(span);
    } else {
      const chunks = part.split(/(__VARKATEX_\d+__)/);
      chunks.forEach(chunk => {
        const m = chunk.match(/__VARKATEX_(\d+)__/);
        if (m) {
          const item = varTokens[parseInt(m[1], 10)];
          container.appendChild(createInteractiveVarNode(item.display, item.base));
        } else if (chunk) {
          container.appendChild(document.createTextNode(chunk));
        }
      });
    }
  });
}

function renderMathOnly(container, eqString) {
  if (!container) return;
  katex.render(eqString, container, { displayMode: true, throwOnError: false });
}

function createInteractiveVarNode(displayVar, baseVarKey) {
  const span = document.createElement("span");
  span.className = "interactive-var";

  let latexExpr = displayVar === "phi" ? "\\phi" : displayVar.replace(/_([a-zA-Z0-9]{2,})/g, "_{$1}");
  katex.render(latexExpr, span, { throwOnError: false });

  span.onmouseenter = e => showTooltip(e, baseVarKey, displayVar);
  span.onmouseleave = hideTooltip;
  span.onclick = e => {
    e.stopPropagation();
    openCarousel(baseVarKey);
  };
  return span;
}

function showTooltip(e, baseVarKey, displayVar) {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  const meta = GEAR_VARS_DB[baseVarKey] || GEAR_VARS_DB[displayVar] || { name: displayVar, unit: "" };
  const cards = getGraphCardsForVariable(baseVarKey, activeProblem);

  let mathContent = "";
  let hintContent = "";
  let titleContent = meta.name;

  if (cards.length > 0) {
    const primaryCard = cards.find(c => c.isBase) || cards[0];
    mathContent = primaryCard.formula;
    const isContext = cards.some(c => c.usedInProblem);
    titleContent = primaryCard.notes;
    hintContent = isContext
      ? `★ Standard textbook formula (Click to explore ${cards.length} forms)`
      : `Click to explore all ${cards.length} forms`;
  } else {
    mathContent = displayVar;
    hintContent = meta.unit ? `Unit: ${meta.unit}` : "Variable";
  }

  tooltip.innerHTML = `
    <div class="tt-name">${titleContent}</div>
    <div class="tt-math" id="tt-m"></div>
    <div class="tt-hint">${hintContent}</div>
  `;

  const mathEl = document.getElementById("tt-m");
  if (mathEl) katex.render(mathContent, mathEl, { throwOnError: false });

  tooltip.style.display = "block";
  const rect = e.target.getBoundingClientRect();
  tooltip.style.left = `${Math.max(10, rect.left)}px`;
  tooltip.style.top = `${rect.bottom + 8}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (tooltip) tooltip.style.display = "none";
}

function openCarousel(baseVarKey) {
  const meta = GEAR_VARS_DB[baseVarKey] || { name: baseVarKey, unit: "" };
  activeCarouselCards = getGraphCardsForVariable(baseVarKey, activeProblem);
  if (activeCarouselCards.length === 0) return;

  currentVarKey = baseVarKey;
  cardIdx = 0;

  document.getElementById("view-problem").classList.remove("active");
  document.getElementById("view-carousel").classList.add("active");

  document.getElementById("c-var-title").textContent = meta.name;
  document.getElementById("c-unit").textContent = meta.unit ? `Unit: ${meta.unit}` : "";

  renderCarouselCard();
}

function renderCarouselCard() {
  const card = activeCarouselCards[cardIdx];
  const badge = card.usedInProblem ? " ★ Relevant to this Problem" : "";
  document.getElementById("c-counter").textContent = `${cardIdx + 1} / ${activeCarouselCards.length}${badge}`;

  katex.render(card.formula, document.getElementById("c-formula"), { displayMode: true, throwOnError: false });
  document.getElementById("c-notes").textContent = card.notes;

  const linkContainer = document.getElementById("c-linked-container");
  linkContainer.innerHTML = "";
  (card.vars || []).forEach(vKey => {
    if (GEAR_VARS_DB[vKey]) {
      const vNode = createInteractiveVarNode(vKey, vKey);
      linkContainer.appendChild(vNode);
    }
  });

  const dotsEl = document.getElementById("c-dots");
  dotsEl.innerHTML = "";
  activeCarouselCards.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = `dot ${i === cardIdx ? 'active' : ''}`;
    dotsEl.appendChild(dot);
  });

  document.getElementById("c-prev").disabled = (cardIdx === 0);
  document.getElementById("c-next").disabled = (cardIdx === activeCarouselCards.length - 1);
}

function prevCard() {
  if (cardIdx > 0) { cardIdx--; renderCarouselCard(); }
}

function nextCard() {
  if (cardIdx < activeCarouselCards.length - 1) { cardIdx++; renderCarouselCard(); }
}

function backToProblem() {
  document.getElementById("view-carousel").classList.remove("active");
  document.getElementById("view-problem").classList.add("active");
}