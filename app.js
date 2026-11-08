/**
 * app.js
 * Application Lifecycle & Black-Box Topic Orchestrator.
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
  loadMastery();

  setupTopicSelector();

  initSidebarView(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));

  setupHeaderActions();

  const btnBack = document.getElementById("btn-back-to-problem");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      document.getElementById("view-carousel")?.classList.remove("active");
      document.getElementById("view-problem")?.classList.add("active");
    });
  }

  generateNewProblem();
});

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
      initSidebarView(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));
      generateNewProblem();
    }
  });
}

function setupHeaderActions() {
  const exportBtn = document.getElementById("btn-export");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportMasteryJSON());
      const dl = document.createElement("a");
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", `mastery_global.json`);
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
        const res = importMasteryJSON(ev.target.result);
        if (res.success) {
          alert("Global Mastery profile imported successfully!");
          renderSidebar(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));
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

function generateNewProblem() {
  // Advance local topic tick and shared common tick
  incrementTopicTick(currentTopic.id);
  incrementTopicTick("common");

  currentProblem = generateProblem(currentTopic, eq => getDecayedMastery(eq, currentTopic));

  renderProblemView(currentProblem, currentTopic.relations, currentTopic.id);
  renderSidebar(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));
}
