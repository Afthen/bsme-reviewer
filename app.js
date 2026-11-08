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
  const container = document.getElementById("topic-dropdown-container");
  if (!container) return;

  const toggleBtn = document.getElementById("topic-dropdown-toggle");
  const label = document.getElementById("topic-dropdown-label");
  const menu = document.getElementById("topic-dropdown-menu");

  // Group topics dynamically by Subject
  const subjects = {};
  ALL_TOPICS.forEach(topic => {
    const subj = topic.subject || "General Engineering";
    if (!subjects[subj]) subjects[subj] = [];
    subjects[subj].push(topic);
  });

  menu.innerHTML = "";

  // Build the collapsible nested UI with arrow toggles
  for (const [subjName, topics] of Object.entries(subjects)) {
    const group = document.createElement("div");
    
    // Auto-expand the folder containing the currently active topic
    const hasActiveTopic = topics.some(t => t.id === currentTopic.id);
    group.className = `subject-group ${hasActiveTopic ? "open" : ""}`;

    const header = document.createElement("div");
    header.className = "subject-header";
    header.innerHTML = `<span class="subject-chevron">▶</span><span>${subjName}</span>`;

    // Folder collapse / expand toggle
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      group.classList.toggle("open");
    });

    const list = document.createElement("div");
    list.className = "topic-list";

    topics.forEach(t => {
      const item = document.createElement("div");
      item.className = "topic-item";
      if (t.id === currentTopic.id) {
        item.classList.add("selected");
      }
      item.textContent = t.title;

      // Click handler passes the direct topic object reference (kills the key-lookup bug!)
      item.addEventListener("click", (e) => {
        e.stopPropagation();

        currentTopic = t;

        // Update UI states
        label.textContent = t.title;
        menu.querySelectorAll(".topic-item").forEach(el => el.classList.remove("selected"));
        item.classList.add("selected");

        // Close dropdown menu
        menu.classList.remove("active");
        toggleBtn.classList.remove("active");

        // Reset sidebar mastery weights and generate new problem
        initSidebarView(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));
        generateNewProblem();
      });

      list.appendChild(item);
    });

    group.appendChild(header);
    group.appendChild(list);
    menu.appendChild(group);
  }

  // Display initial active topic label
  label.textContent = currentTopic.title;

  // Toggle Dropdown Menu visibility
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("active");
    toggleBtn.classList.toggle("active", isOpen);
  });

  // Click outside to dismiss menu
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      menu.classList.remove("active");
      toggleBtn.classList.remove("active");
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
