/**
 * app.js
 * Application Lifecycle & Multi-Tier Topic Orchestrator.
 */

import { TOPICS, ALL_TOPICS } from "./src/topics/index.js";
import { generateProblem } from "./src/core/problem_gen.js";
import { pickWeakestTopic } from "./src/core/topic_mix.js";
import {
  loadMastery, getDecayedMastery, incrementTopicTick,
  exportMasteryJSON, importMasteryJSON
} from "./src/mastery/index.js";
import { renderProblemView } from "./src/ui/problem_view.js";
import { initSidebarView, renderSidebar } from "./src/ui/sidebar_view.js";

/* ------------------------------------------------------------------ *
 *  Multi-topic review set (checklist dropdown)                       *
 *  Persisted in localStorage; leaves of the Subject -> Category ->   *
 *  Topic tree are checkboxes. Problems are drawn from the selected   *
 *  pool, weakest-mastery topic first (see src/core/topic_mix.js).    *
 * ------------------------------------------------------------------ */
const SELECTED_TOPICS_KEY = "bsme.selectedTopicIds";

function defaultTopic() {
  return TOPICS.spur_gears || ALL_TOPICS[0];
}

function loadSelectedTopicIds() {
  try {
    const raw = localStorage.getItem(SELECTED_TOPICS_KEY);
    if (raw) {
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) {
        const valid = ids.filter(id => ALL_TOPICS.some(t => t.id === id));
        if (valid.length > 0) return valid;
      }
    }
  } catch (_) { /* corrupted state -> fall through to default */ }
  return [defaultTopic().id];
}

let selectedTopicIds = loadSelectedTopicIds();
let currentTopic = topicById(selectedTopicIds[0]) || defaultTopic();
let currentProblem = null;

export { TOPICS };

function topicById(id) {
  return ALL_TOPICS.find(t => t.id === id) || null;
}

function getSelectedTopics() {
  return selectedTopicIds.map(topicById).filter(Boolean);
}

function isTopicSelected(id) {
  return selectedTopicIds.includes(id);
}

function setTopicSelected(id, on) {
  if (on) {
    if (!selectedTopicIds.includes(id)) selectedTopicIds.push(id);
  } else {
    selectedTopicIds = selectedTopicIds.filter(x => x !== id);
  }
  try {
    localStorage.setItem(SELECTED_TOPICS_KEY, JSON.stringify(selectedTopicIds));
  } catch (_) { /* private mode: session-only selection */ }
}

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

/* ------------------------------------------------------------------ *
 *  Checklist dropdown: Subject -> Category (optional) -> [x] Topic   *
 *  Collapsible groups kept; leaves are checkboxes; menu stays open   *
 *  while ticking. Group checkboxes bulk-toggle their subtree and     *
 *  show indeterminate for partial selections. The review set can     *
 *  never become empty (last tick is denied with a flash).            *
 * ------------------------------------------------------------------ */
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

  const leafBoxes = [];                       // every leaf checkbox, in build order
  const groupBoxes = [];                      // { box, collectLeaves } for sync

  function flashDeny(el) {
    el.classList.remove("deny-flash");
    void el.offsetWidth;                      // restart animation
    el.classList.add("deny-flash");
  }

  function updateDropdownLabel() {
    const topics = getSelectedTopics();
    if (topics.length === 0) {
      label.textContent = "Select topics…";
    } else if (topics.length === 1) {
      const t = topics[0];
      label.textContent = t.category ? `${t.category}: ${t.title}` : t.title;
    } else {
      label.textContent = `${topics.length} topics selected`;
    }
    toggleBtn.title = topics.map(t => t.title).join(", ");
    if (footerCount) {
      footerCount.textContent = `${topics.length} of ${ALL_TOPICS.length} topics in review set`;
    }
  }

  function syncGroupBoxes() {
    groupBoxes.forEach(({ box, collectLeaves }) => {
      const leaves = collectLeaves();
      if (leaves.length === 0) { box.checked = false; box.indeterminate = false; return; }
      const on = leaves.filter(b => b.checked).length;
      box.checked = on === leaves.length;
      box.indeterminate = on > 0 && on < leaves.length;
    });
  }

  function createTopicLeaf(t, levelClass) {
    const leaf = document.createElement("label");
    leaf.className = `topic-item topic-leaf ${levelClass}`;
    leaf.dataset.topicId = t.id;

    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "topic-checkbox";
    box.dataset.topicId = t.id;
    box.checked = isTopicSelected(t.id);

    const title = document.createElement("span");
    title.className = "topic-leaf-title";
    title.textContent = t.title;

    leaf.append(box, title);
    leaf.classList.toggle("checked", box.checked);
    leafBoxes.push(box);

    box.addEventListener("change", () => {
      // Never allow an empty review set: deny un-ticking the last topic.
      if (!box.checked && selectedTopicIds.length === 1 && selectedTopicIds[0] === t.id) {
        box.checked = true;
        flashDeny(leaf);
        return;
      }
      setTopicSelected(t.id, box.checked);
      leaf.classList.toggle("checked", box.checked);
      syncGroupBoxes();
      updateDropdownLabel();
      // NOTE: no auto-regenerate here — the student keeps the current
      // problem; the new pool applies from the next "Next problem" click.
    });

    return leaf;
  }

  function createGroupBox(collectLeaves) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "group-checkbox";
    box.tabIndex = -1;                        // mouse-only bulk toggle

    box.addEventListener("click", e => e.stopPropagation());   // don't collapse
    box.addEventListener("change", () => {
      const leaves = collectLeaves();
      const ids = leaves.map(b => b.dataset.topicId);

      if (!box.checked) {
        const remaining = selectedTopicIds.filter(id => !ids.includes(id));
        if (remaining.length === 0) {         // would empty the review set
          flashDeny(box);
          syncGroupBoxes();
          return;
        }
      }

      leaves.forEach(b => {
        b.checked = box.checked;
        b.closest(".topic-leaf")?.classList.toggle("checked", box.checked);
        setTopicSelected(b.dataset.topicId, box.checked);
      });
      syncGroupBoxes();
      updateDropdownLabel();
    });

    groupBoxes.push({ box, collectLeaves });
    return box;
  }

  let footerCount = null;

  for (const [subjName, { categories, standalone }] of Object.entries(subjects)) {
    const subjectGroup = document.createElement("div");
    subjectGroup.className = "subject-group";

    const subjectHeader = document.createElement("div");
    subjectHeader.className = "subject-header";

    const subjectBox = createGroupBox(() =>
      Array.from(subjectGroup.querySelectorAll(".topic-checkbox")));

    const subjectChevron = document.createElement("span");
    subjectChevron.className = "subject-chevron";
    subjectChevron.textContent = "▶";

    const subjectName = document.createElement("span");
    subjectName.textContent = subjName;

    subjectHeader.append(subjectBox, subjectChevron, subjectName);
    subjectHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      subjectGroup.classList.toggle("open");
    });

    const subjectList = document.createElement("div");
    subjectList.className = "topic-list";

    // 1. Sub-categories (e.g. Air Handling collapsible folder)
    for (const [catName, catTopics] of Object.entries(categories)) {
      const catGroup = document.createElement("div");
      catGroup.className = "category-group";

      const catHeader = document.createElement("div");
      catHeader.className = "category-header";

      const catBox = createGroupBox(() =>
        Array.from(catGroup.querySelectorAll(".topic-checkbox")));

      const catChevron = document.createElement("span");
      catChevron.className = "category-chevron";
      catChevron.textContent = "▶";

      const catName = document.createElement("span");
      catName.textContent = catName;

      catHeader.append(catBox, catChevron, catName);
      catHeader.addEventListener("click", (e) => {
        e.stopPropagation();
        catGroup.classList.toggle("open");
      });

      const catList = document.createElement("div");
      catList.className = "category-list";
      catTopics.forEach(t => catList.appendChild(createTopicLeaf(t, "level-3")));

      catGroup.append(catHeader, catList);
      if (Array.from(catGroup.querySelectorAll(".topic-checkbox")).some(b => b.checked)) {
        catGroup.classList.add("open");
      }
      subjectList.appendChild(catGroup);
    }

    // 2. Standalone topics under subject (e.g. Cooling Towers, Spur Gears)
    standalone.forEach(t => subjectList.appendChild(createTopicLeaf(t, "level-2")));

    subjectGroup.append(subjectHeader, subjectList);
    if (Array.from(subjectGroup.querySelectorAll(".topic-checkbox")).some(b => b.checked)) {
      subjectGroup.classList.add("open");
    }
    menu.appendChild(subjectGroup);
  }

  // Footer: live count + quick "Select all" (midterm prep)
  const footer = document.createElement("div");
  footer.className = "topic-menu-footer";

  footerCount = document.createElement("span");
  footerCount.className = "topic-menu-count";

  const selectAllBtn = document.createElement("button");
  selectAllBtn.type = "button";
  selectAllBtn.className = "menu-mini-btn";
  selectAllBtn.textContent = "Select all";
  selectAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    leafBoxes.forEach(b => {
      b.checked = true;
      b.closest(".topic-leaf")?.classList.add("checked");
      setTopicSelected(b.dataset.topicId, true);
    });
    syncGroupBoxes();
    updateDropdownLabel();
  });

  footer.append(footerCount, selectAllBtn);
  menu.appendChild(footer);

  syncGroupBoxes();
  updateDropdownLabel();

  // Toggle dropdown
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("active");
    toggleBtn.classList.toggle("active", isOpen);
  });

  // Click outside to dismiss (menu stays open while ticking boxes)
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

/* ------------------------------------------------------------------ *
 *  Generation: draw from the whole checked pool.                     *
 *  pickWeakestTopic targets the weakest-mastery topic in the set;    *
 *  generateProblem then runs its untouched per-relation mastery      *
 *  pipeline (hops, fading, recall, distractors) inside that topic.   *
 *  Mastery bookkeeping stays scoped per topic via problem.topicId.   *
 * ------------------------------------------------------------------ */
function generateNewProblem() {
  const pool = getSelectedTopics();
  if (pool.length === 0) return;              // guarded: UI denies empty set

  const topic = pickWeakestTopic(pool, t => eq => getDecayedMastery(eq, t)) || pool[0];
  currentTopic = topic;

  incrementTopicTick(topic.id);
  incrementTopicTick("common");

  currentProblem = generateProblem(topic, eq => getDecayedMastery(eq, topic));

  renderProblemView(currentProblem, topic.relations, topic.id);
  renderSidebar(topic.relations, eq => getDecayedMastery(eq, topic));
}
