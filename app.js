/**
 * app.js
 * Universal Reviewer entrypoint & application lifecycle orchestrator (ES Module).
 * Organizes topics under Subjects with dynamic optgroup rendering.
 */

import {
  loadMastery, exportMasteryJSON, importMasteryJSON,
  getDecayedMastery, FADING_THRESHOLD
} from "./src/repetition/mastery.js";

import { GEAR_VARS_DB } from "./src/topics/machine_design/spur_gears/schema.js";
import { GEAR_RELATION_GRAPH } from "./src/topics/machine_design/spur_gears/relations.js";
import { createGroundTruthSystem } from "./src/topics/machine_design/spur_gears/system.js";

import { HELICAL_VARS_DB } from "./src/topics/machine_design/helical_gears/schema.js";
import { HELICAL_RELATION_GRAPH } from "./src/topics/machine_design/helical_gears/relations.js";
import { createGroundTruthHelicalSystem } from "./src/topics/machine_design/helical_gears/system.js";

import { generateAutonomousProblem, buildProblemStatement } from "./src/core/problem_gen.js";
import { solveDAG, pruneSolutionPath } from "./src/core/graph_solver.js";
import { initSidebarView, renderMasteryBars } from "./src/ui/sidebar_view.js";
import { initCarouselView } from "./src/ui/carousel_view.js";
import { renderProblemView } from "./src/ui/problem_view.js";
import { validateTopic } from "./src/core/validator.js";

// ========================================================
// 1. SUBJECT & TOPIC REGISTRY
// ========================================================
export const SUBJECTS = Object.freeze({
  machine_design: {
    id: "machine_design",
    title: "Machine Design",
    topics: ["spur_gears", "helical_gears"]
  },
  powerplant_design: {
    id: "powerplant_design",
    title: "Powerplant Design",
    topics: [] // Groundwork ready: "diesel_powerplant" will drop in here
  }
});

export const TOPICS = Object.freeze({
  spur_gears: {
    id: "spur_gears",
    subjectId: "machine_design",
    title: "Spur Gears",
    varsDb: GEAR_VARS_DB,
    relations: GEAR_RELATION_GRAPH,
    createSystem: createGroundTruthSystem
  },
  helical_gears: {
    id: "helical_gears",
    subjectId: "machine_design",
    title: "Helical Gears",
    varsDb: HELICAL_VARS_DB,
    relations: HELICAL_RELATION_GRAPH,
    createSystem: createGroundTruthHelicalSystem
  }
});

let currentTopic = TOPICS.spur_gears;
let activeProblem = null;

// Expose validator for console debugging
if (typeof window !== "undefined") {
  window.validateTopic = validateTopic;
  window.TOPICS = TOPICS;
}

export function generateNewProblem() {
  const S = currentTopic.createSystem();
  const getMastery = id => getDecayedMastery(id, currentTopic.id);

  const problemPlan = generateAutonomousProblem(currentTopic.relations, S, currentTopic.varsDb, getMastery);
  const allRawSteps = solveDAG(problemPlan.givens, S, currentTopic.relations, currentTopic.varsDb, getMastery);
  const requiredSteps = pruneSolutionPath(allRawSteps, problemPlan.goalVar);

  requiredSteps.forEach(st => {
    if (st.targetVar === problemPlan.goalVar) {
      st.isFaded = false;
    } else {
      st.isFaded = getMastery(st.eqId) >= FADING_THRESHOLD;
    }
  });

  const visibleSteps = requiredSteps.filter(st => !st.isFaded).map(st => {
    const fadedAncestors = (st.ancestorIndices || [])
      .map(i => allRawSteps[i])
      .filter(s => s && s.isFaded);

    return {
      ...st,
      fadedAncestorEqIds: fadedAncestors.map(s => s.eqId),
      isAnswered: false,
      isRevealed: false
    };
  });

  const visibleGoals = visibleSteps.map(s => s.targetVar);
  const statement = buildProblemStatement(problemPlan.givens, visibleGoals, S, currentTopic.varsDb, currentTopic);
  const goalMeta = currentTopic.varsDb[problemPlan.goalVar] || {};

  activeProblem = {
    title: `${goalMeta.name || problemPlan.goalVar} Determination`,
    statement,
    givens: problemPlan.givens,
    goal: problemPlan.goalVar,
    distractors: problemPlan.distractors || [],
    system: S,
    allSteps: allRawSteps,
    solution: visibleSteps,
    varsDb: currentTopic.varsDb
  };

  renderProblemView(activeProblem, currentTopic.relations, currentTopic.id);
}

function populateTopicSelector() {
  const select = document.getElementById("topic-selector");
  if (!select) return;

  select.innerHTML = "";
  for (const [sKey, subj] of Object.entries(SUBJECTS)) {
    const activeSubjTopics = subj.topics.filter(tId => TOPICS[tId]);
    if (activeSubjTopics.length === 0) continue;

    const optgroup = document.createElement("optgroup");
    optgroup.label = subj.title;

    activeSubjTopics.forEach(tId => {
      const top = TOPICS[tId];
      const opt = document.createElement("option");
      opt.value = top.id;
      opt.textContent = top.title;
      optgroup.appendChild(opt);
    });

    select.appendChild(optgroup);
  }
  select.value = currentTopic.id;
}

function initApp() {
  loadMastery(currentTopic.id);

  populateTopicSelector();
  initSidebarView(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
  initCarouselView(currentTopic.relations, currentTopic.varsDb);
  renderMasteryBars(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));

  document.getElementById("btn-generate-next")?.addEventListener("click", generateNewProblem);

  const topicSelect = document.getElementById("topic-selector");
  if (topicSelect) {
    topicSelect.addEventListener("change", e => {
      const selectedId = e.target.value;
      if (TOPICS[selectedId]) {
        currentTopic = TOPICS[selectedId];
        loadMastery(currentTopic.id);
        initSidebarView(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
        initCarouselView(currentTopic.relations, currentTopic.varsDb);
        renderMasteryBars(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
        generateNewProblem();
      }
    });
  }

  document.getElementById("btn-export")?.addEventListener("click", () => {
    const blob = new Blob([exportMasteryJSON(currentTopic.id)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentTopic.id}_mastery.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = document.getElementById("mastery-file-input");
  document.getElementById("btn-import")?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const res = importMasteryJSON(ev.target.result, currentTopic.id);
      if (res.success) {
        renderMasteryBars(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
        alert("Mastery profile imported successfully!");
      } else {
        alert(`Import failed: ${res.reason || "Invalid JSON file"}`);
      }
    };
    reader.readAsText(file);
  });

  generateNewProblem();
}

window.addEventListener("DOMContentLoaded", initApp);
