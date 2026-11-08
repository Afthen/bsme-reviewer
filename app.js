/**
 * app.js
 * ============================================================================
 * ARCHITECTURAL PILLAR: Application Lifecycle & Black-Box Topic Orchestrator
 * ============================================================================
 * Treats src/topics/index.js as a modular black box:
 * 1. Dynamic Subject Grouping:
 *    Auto-populates <optgroup> dropdowns directly from topic metadata
 *    (e.g. Machine Design -> Spur, Helical; Powerplant -> Diesel).
 * 2. Strict DOM Alignment:
 *    Matches IDs in index.html exactly (#topic-selector, #btn-generate-next, etc.).
 * 3. Verified Problem View Calling Convention:
 *    Calls renderProblemView(currentProblem, relations, topicId) without
 *    phantom container arguments to eliminate silent early returns.
 * ============================================================================
 */

import { TOPICS, ALL_TOPICS } from "./src/topics/index.js";
import { generateProblem } from "./src/core/problem_gen.js";
import {
  loadMastery, getDecayedMastery, incrementTopicTick,
  exportMasteryJSON, importMasteryJSON
} from "./src/repetition/mastery.js";
import { renderProblemView } from "./src/ui/problem_view.js";
import { initSidebarView, renderSidebar } from "./src/ui/sidebar_view.js";

let currentTopic = TOPICS.spur_gears || ALL_TOPICS[0];
let currentProblem = null;

export { TOPICS };

document.addEventListener("DOMContentLoaded", () => {
  loadMastery(currentTopic.id);

  // 1. Dynamic Black-Box Topic Selector Population (<optgroup> by Subject)
  setupTopicSelector();

  // 2. Initialize Spaced Repetition Sidebar Drawer
  initSidebarView(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));

  // 3. Hook Action Buttons (Matching index.html Element IDs)
  setupHeaderActions();

  // 4. Hook Carousel Return Navigation
  const btnBack = document.getElementById("btn-back-to-problem");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      document.getElementById("view-carousel")?.classList.remove("active");
      document.getElementById("view-problem")?.classList.add("active");
    });
  }

  // 5. Generate Initial Problem
  generateNewProblem();
});

/**
 * Dynamically builds <optgroup> sections based on topic.subject metadata.
 * Scales automatically when new subjects (like Powerplant) are registered.
 */
function setupTopicSelector() {
  const selector = document.getElementById("topic-selector");
  if (!selector) return;

  selector.innerHTML = "";

  const subjects = {};
  ALL_TOPICS.forEach(topic => {
    const subj = topic.subject || "General Engineering";
    if (!subjects[subj]) subjects[subj] = [];
    subjects[subj].push(topic);
  });

  for (const [subjName, topics] of Object.entries(subjects)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = subjName;

    topics.forEach(t => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.title;
      optgroup.appendChild(option);
    });

    selector.appendChild(optgroup);
  }

  selector.value = currentTopic.id;

  selector.addEventListener("change", e => {
    const selectedId = e.target.value;
    if (TOPICS[selectedId]) {
      currentTopic = TOPICS[selectedId];
      loadMastery(currentTopic.id);
      initSidebarView(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
      generateNewProblem();
    }
  });
}

/**
 * Hooks Export, Import, and Next Problem buttons to their matching IDs in index.html.
 */
function setupHeaderActions() {
  const exportBtn = document.getElementById("btn-export");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportMasteryJSON(currentTopic.id));
      const dl = document.createElement("a");
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", `mastery_${currentTopic.id}.json`);
      dl.click();
    });
  }

  const importBtn = document.getElementById("btn-import");
  const fileInput = document.getElementById("mastery-file-input");

  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const res = importMasteryJSON(ev.target.result, currentTopic.id);
        if (res.success) {
          alert("Mastery profile imported successfully!");
          renderSidebar(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
        } else {
          alert(`Import failed: ${res.reason}`);
        }
      };
      reader.readAsText(file);
    });
  }

  const nextBtn = document.getElementById("btn-generate-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => generateNewProblem());
  }
}

/**
 * Orchestrates problem generation, renders interactive steps, and updates mastery bars.
 */
function generateNewProblem() {
  incrementTopicTick(currentTopic.id);

  currentProblem = generateProblem(currentTopic, id => getDecayedMastery(id, currentTopic.id));

  // Correct signature: renderProblemView(activeProblem, relations, topicId)
  renderProblemView(currentProblem, currentTopic.relations, currentTopic.id);

  // Update sidebar mastery bars
  renderSidebar(currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
}
