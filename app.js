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
import { generateAutonomousProblem, buildProblemStatement } from "./src/core/problem_gen.js";
import { solveDAG, pruneSolutionPath } from "./src/core/graph_solver.js";
import { initSidebarView, renderMasteryBars } from "./src/ui/sidebar_view.js";
import { initCarouselView } from "./src/ui/carousel_view.js";
import { renderProblemView } from "./src/ui/problem_view.js";

const TOPIC = Object.freeze({
  id: "spur_gears",
  title: "Spur Gears",
  varsDb: GEAR_VARS_DB,
  relations: GEAR_RELATION_GRAPH,
  createSystem: createGroundTruthSystem
});

let activeProblem = null;

export function generateNewProblem() {
  const S = TOPIC.createSystem();
  const problemPlan = generateAutonomousProblem(TOPIC.relations, S, TOPIC.varsDb, getDecayedMastery);

  const allRawSteps = solveDAG(problemPlan.givens, S, TOPIC.relations, TOPIC.varsDb);
  const requiredSteps = pruneSolutionPath(allRawSteps, problemPlan.goalVar);

  // Apply fading scaffolding: master intermediate steps fade into the algebraic derivation
  requiredSteps.forEach(st => {
    if (st.targetVar === problemPlan.goalVar) {
      st.isFaded = false;
    } else {
      st.isFaded = getDecayedMastery(st.eqId) >= FADING_THRESHOLD;
    }
  });

  // Extract visible steps and map faded ancestor IDs for spaced repetition credit
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
  const statement = buildProblemStatement(problemPlan.givens, visibleGoals, S, TOPIC.varsDb);
  const goalMeta = TOPIC.varsDb[problemPlan.goalVar] || {};

  activeProblem = {
    title: `${goalMeta.name || problemPlan.goalVar} Determination`,
    statement,
    givens: problemPlan.givens,
    goal: problemPlan.goalVar,
    distractors: problemPlan.distractors || [],
    system: S,
    allSteps: allRawSteps,
    solution: visibleSteps,
    varsDb: TOPIC.varsDb
  };

  renderProblemView(activeProblem, TOPIC.relations, TOPIC.id);
}

// ========================================================
// LIFECYCLE & EVENT BINDINGS
// ========================================================
function initApp() {
  loadMastery(TOPIC.id);

  initSidebarView(TOPIC.relations, getDecayedMastery);
  initCarouselView(TOPIC.relations);
  renderMasteryBars(TOPIC.relations, getDecayedMastery);

  document.getElementById("btn-generate-next")?.addEventListener("click", generateNewProblem);

  // Mastery Profile Backup & Restore
  document.getElementById("btn-export")?.addEventListener("click", () => {
    const blob = new Blob([exportMasteryJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${TOPIC.id}_mastery.json`;
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
      if (importMasteryJSON(ev.target.result, TOPIC.id)) {
        renderMasteryBars(TOPIC.relations, getDecayedMastery);
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
