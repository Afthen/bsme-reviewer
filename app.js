/**
 * app.js
 * Application Lifecycle & Multi-Tier Topic Orchestrator.
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

  // Multi-tier hierarchy: Subject -> Category (optional subfolder) -> Topic
  const subjects = {};
  ALL_TOPICS.forEach(topic => {
    const subj = topic.subject || "General Engineering";
    if (!subjects[subj]) subjects[subj] = { categories: {}, standalone: [] };

    if (topic.category) {
      if (!subjects[subj].categories[topic.category]) {
        subjects[subj].categories[topic.category] = [];
      }
      subjects[subj].categories[topic.category].push(topic);
    } else {
      subjects[subj].standalone.push(topic);
    }
  });

  menu.innerHTML = "";

  function createTopicItem(t, levelClass) {
    const item = document.createElement("div");
    item.className = `topic-item ${levelClass}`;
    if (t.id === currentTopic.id) {
      item.classList.add("selected");
    }
    item.textContent = t.title;

    item.addEventListener("click", (e) => {
      e.stopPropagation();

      currentTopic = t;

      label.textContent = t.category ? `${t.category}: ${t.title}` : t.title;
      menu.querySelectorAll(".topic-item").forEach(el => el.classList.remove("selected"));
      item.classList.add("selected");

      menu.classList.remove("active");
      toggleBtn.classList.remove("active");

      initSidebarView(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));
      generateNewProblem();
    });

    return item;
  }

  for (const [subjName, { categories, standalone }] of Object.entries(subjects)) {
    const subjectGroup = document.createElement("div");

    // Auto-open subject if currentTopic belongs to it
    const inStandalone = standalone.some(t => t.id === currentTopic.id);
    const inCategories = Object.values(categories).some(list => list.some(t => t.id === currentTopic.id));
    const isSubjectActive = inStandalone || inCategories;

    subjectGroup.className = `subject-group ${isSubjectActive ? "open" : ""}`;

    const subjectHeader = document.createElement("div");
    subjectHeader.className = "subject-header";
    subjectHeader.innerHTML = `<span class="subject-chevron">▶</span><span>${subjName}</span>`;

    subjectHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      subjectGroup.classList.toggle("open");
    });

    const subjectList = document.createElement("div");
    subjectList.className = "topic-list";

    // 1. Sub-categories (e.g. Air Handling collapsible folder)
    for (const [catName, catTopics] of Object.entries(categories)) {
      const catGroup = document.createElement("div");
      const isCatActive = catTopics.some(t => t.id === currentTopic.id);
      catGroup.className = `category-group ${isCatActive ? "open" : ""}`;

      const catHeader = document.createElement("div");
      catHeader.className = "category-header";
      catHeader.innerHTML = `<span class="category-chevron">▶</span><span>${catName}</span>`;

      catHeader.addEventListener("click", (e) => {
        e.stopPropagation();
        catGroup.classList.toggle("open");
      });

      const catList = document.createElement("div");
      catList.className = "category-list";

      catTopics.forEach(t => {
        catList.appendChild(createTopicItem(t, "level-3"));
      });

      catGroup.appendChild(catHeader);
      catGroup.appendChild(catList);
      subjectList.appendChild(catGroup);
    }

    // 2. Standalone topics under subject (e.g. Cooling Towers, Spur Gears)
    standalone.forEach(t => {
      subjectList.appendChild(createTopicItem(t, "level-2"));
    });

    subjectGroup.appendChild(subjectHeader);
    subjectGroup.appendChild(subjectList);
    menu.appendChild(subjectGroup);
  }

  // Set initial label
  label.textContent = currentTopic.category ? `${currentTopic.category}: ${currentTopic.title}` : currentTopic.title;

  // Toggle dropdown
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("active");
    toggleBtn.classList.toggle("active", isOpen);
  });

  // Click outside to dismiss
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
  incrementTopicTick(currentTopic.id);
  incrementTopicTick("common");

  currentProblem = generateProblem(currentTopic, eq => getDecayedMastery(eq, currentTopic));

  renderProblemView(currentProblem, currentTopic.relations, currentTopic.id);
  renderSidebar(currentTopic.relations, eq => getDecayedMastery(eq, currentTopic));
}
