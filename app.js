/**
 * app.js
 * Universal Reviewer entrypoint & application lifecycle orchestrator (ES Module).
 * Organizes topics under Subjects with dynamic optgroup rendering.
 */

import { TOPICS, ALL_TOPICS } from "./src/topics/registry.js";
import { generateProblem } from "./src/core/problem_gen.js";
import {
  loadMastery, getDecayedMastery, recordAttempt, incrementTopicTick,
  exportMasteryJSON, importMasteryJSON
} from "./src/repetition/mastery.js";
import { renderCarouselPills, renderCarouselCard } from "./src/ui/carousel_view.js";
import { renderProblemView } from "./src/ui/problem_view.js";
import { renderSidebar } from "./src/ui/sidebar_view.js";

let currentTopic = TOPICS.spur_gears;
let currentProblem = null;

export { TOPICS };

document.addEventListener("DOMContentLoaded", () => {
  loadMastery(currentTopic.id);

  const topicSelect = document.getElementById("topicSelect");
  if (topicSelect) {
    topicSelect.value = currentTopic.id;
    topicSelect.addEventListener("change", e => {
      const selectedId = e.target.value;
      if (TOPICS[selectedId]) {
        currentTopic = TOPICS[selectedId];
        loadMastery(currentTopic.id);
        setupCarousel();
        generateNewProblem();
      }
    });
  }

  const exportBtn = document.getElementById("exportMasteryBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportMasteryJSON(currentTopic.id));
      const dl = document.createElement("a");
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", `mastery_${currentTopic.id}.json`);
      dl.click();
    });
  }

  const importInput = document.getElementById("importMasteryInput");
  if (importInput) {
    importInput.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const res = importMasteryJSON(ev.target.result, currentTopic.id);
        if (res.success) {
          alert("Mastery imported successfully!");
          renderSidebar(document.getElementById("sidebarContainer"), currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
        } else {
          alert(`Import failed: ${res.reason}`);
        }
      };
      reader.readAsText(file);
    });
  }

  const newProblemBtn = document.getElementById("newProblemBtn");
  if (newProblemBtn) {
    newProblemBtn.addEventListener("click", () => generateNewProblem());
  }

  setupCarousel();
  generateNewProblem();
});

function setupCarousel() {
  const pillsEl = document.getElementById("carouselPills");
  const cardEl = document.getElementById("carouselCard");
  if (!pillsEl || !cardEl) return;

  renderCarouselPills(pillsEl, currentTopic.relations, currentTopic.varsDb, rel => {
    renderCarouselCard(cardEl, rel, currentTopic.varsDb);
  });

  if (currentTopic.relations.length > 0) {
    renderCarouselCard(cardEl, currentTopic.relations[0], currentTopic.varsDb);
  }
}

function generateNewProblem() {
  const problemContainer = document.getElementById("problemContainer");
  const sidebarContainer = document.getElementById("sidebarContainer");

  incrementTopicTick(currentTopic.id);

  currentProblem = generateProblem(currentTopic, id => getDecayedMastery(id, currentTopic.id));

  renderProblemView(problemContainer, currentProblem, currentTopic, {
    onAnswerSubmit: (stepIdx, isCorrect) => {
      const step = currentProblem.solutionSteps[stepIdx];
      if (step) {
        recordAttempt(step.eqId, isCorrect, currentTopic.id);
        renderSidebar(sidebarContainer, currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
      }
    }
  });

  renderSidebar(sidebarContainer, currentTopic.relations, id => getDecayedMastery(id, currentTopic.id));
}
