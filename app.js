/**
 * app.js
 * Universal Reviewer entrypoint & application lifecycle orchestrator (ES Module).
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

export const TOPICS = Object.freeze({
  spur_gears: {
    id: "spur_gears",
    title: "Spur Gears",
    varsDb: GEAR_VARS_DB,
    relations: GEAR_RELATION_GRAPH,
    createSystem: createGroundTruthSystem
  },
  helical_gears: {
    id: "helical_gears",
    title: "Helical Gears",
    varsDb: HELICAL_VARS_DB,
    relations: HELICAL_RELATION_GRAPH,
    createSystem: createGroundTruthHelicalSystem
  }
});

let currentTopic = TOPICS.spur_gears;
let activeProblem = null;

export function generateNewProblem() {
  const S = currentTopic.createSystem();
  const problemPlan = generateAutonomousProblem(currentTopic.relations, S, currentTopic.varsDb, getDecayedMastery);

  const allRawSteps = solveDAG(problemPlan.givens, S, currentTopic.relations, currentTopic.varsDb, getDecayedMastery);
  const requiredSteps = pruneSolutionPath(allRawSteps, problemPlan.goalVar);

  requiredSteps.forEach(st => {
    if (st.targetVar === problemPlan.goalVar) {
      st.isFaded = false;
    } else {
      st.isFaded = getDecayedMastery(st.eqId) >= FADING_THRESHOLD;
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
  const statement = buildProblemStatement(problemPlan.givens, visibleGoals, S, currentTopic.varsDb, currentTopic.title);
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

function initApp() {
  loadMastery(currentTopic.id);

  initSidebarView(currentTopic.relations, getDecayedMastery);
  initCarouselView(currentTopic.relations, currentTopic.varsDb);
  renderMasteryBars(currentTopic.relations, getDecayedMastery);

  document.getElementById("btn-generate-next")?.addEventListener("click", generateNewProblem);

  const topicSelect = document.getElementById("topic-selector");
  if (topicSelect) {
    topicSelect.value = currentTopic.id;
    topicSelect.addEventListener("change", e => {
      const selectedId = e.target.value;
      if (TOPICS[selectedId]) {
        currentTopic = TOPICS[selectedId];
        loadMastery(currentTopic.id);
        initSidebarView(currentTopic.relations, getDecayedMastery);
        initCarouselView(currentTopic.relations, currentTopic.varsDb);
        renderMasteryBars(currentTopic.relations, getDecayedMastery);
        generateNewProblem();
      }
    });
  }

  document.getElementById("btn-export")?.addEventListener("click", () => {
    const blob = new Blob([exportMasteryJSON()], { type: "application/json" });
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
      if (importMasteryJSON(ev.target.result, currentTopic.id)) {
        renderMasteryBars(currentTopic.relations, getDecayedMastery);
        alert("Mastery profile imported successfully!");
      } else {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  });

  generateNewProblem();
}

window.addEventListener("DOMContentLoaded", initApp);
