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
import {
  initSidebarView, updateSidebarRelations, MASTERY_CHANGED_EVENT
} from "./src/ui/sidebar_view.js";

const SELECTED_TOPICS_KEY = "bsme.selectedTopicIds";
const TOPIC_BY_ID = new Map(ALL_TOPICS.map(t => [t.id, t]));
const masteryFor = topic => eq => getDecayedMastery(eq, topic);

function loadSelectedTopicIds() {
  try {
    const raw = localStorage.getItem(SELECTED_TOPICS_KEY);
    if (raw === null) return [];
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) {
      return ids.filter(id => TOPIC_BY_ID.has(id));
    }
  } catch (_) { /* fallback to empty selection */ }
  return [];
}

let selectedTopicIds = loadSelectedTopicIds();
let currentTopic = topicById(selectedTopicIds[0]) || null;
let currentProblem = null;

export { TOPICS };

function topicById(id) {
  return TOPIC_BY_ID.get(id) || null;
}

function getSelectedTopics() {
  return selectedTopicIds.map(topicById).filter(Boolean);
}

function getAllSelectedRelations() {
  const rels = [];
  getSelectedTopics().forEach(t => rels.push(...t.relations));
  return rels;
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
  } catch (_) {}
}

function openDropdown() {
  document.getElementById("topic-dropdown-menu")?.classList.add("active");
  document.getElementById("topic-dropdown-toggle")?.classList.add("active");
}

function clearSelectionPrompt() {
  document.getElementById("selection-prompt")?.remove();
  document.getElementById("view-problem")?.classList.remove("is-empty");
}

function renderSelectionPrompt() {
  const view = document.getElementById("view-problem");
  if (!view) return;

  document.getElementById("selection-prompt")?.remove();
  const wrap = document.createElement("div");
  wrap.id = "selection-prompt";
  wrap.className = "selection-prompt";

  const heading = document.createElement("h2");
  heading.textContent = "No topics in review set";

  const body = document.createElement("p");
  body.textContent =
    "Open the checklist and tick every topic you want to review. Problems are " +
    "drawn from the whole set and target your weakest equations first — " +
    "ideal for board exam prep. Your selection is remembered between sessions.";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = "Choose topics";
  btn.addEventListener("click", openDropdown);

  wrap.append(heading, body, btn);
  view.classList.add("is-empty");
  view.prepend(wrap);
}

function renderTopicBadge(topic) {
  const view = document.getElementById("view-problem");
  if (!view) return;

  let badge = document.getElementById("topic-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "topic-badge";
    badge.className = "topic-badge";
    view.prepend(badge);
  }

  const catLabel = Array.isArray(topic.category)
    ? topic.category.join(" · ")
    : (topic.category ? topic.category.split("/").map(s => s.trim()).filter(Boolean).join(" · ") : "");
  badge.textContent = catLabel
    ? `${topic.subject} · ${catLabel}: ${topic.title}`
    : `${topic.subject}: ${topic.title}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadMastery();
  setupTopicSelector();
  initSidebarView(
    currentTopic ? currentTopic.relations : [],
    currentTopic ? masteryFor(currentTopic) : () => 0,
    getAllSelectedRelations()
  );
  setupHeaderActions();

  document.addEventListener(MASTERY_CHANGED_EVENT, () => {
    if (currentTopic) {
      updateSidebarRelations(
        currentTopic.relations,
        getAllSelectedRelations(),
        masteryFor(currentTopic)
      );
    }
  });

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

  const getCategoryParts = (cat) => {
    if (!cat) return [];
    if (Array.isArray(cat)) return cat.map(s => String(s).trim()).filter(Boolean);
    return String(cat).split("/").map(s => s.trim()).filter(Boolean);
  };

  const makeNode = (name) => ({ name, children: new Map(), topics: [] });
  const rootTree = makeNode("root");
  ALL_TOPICS.forEach(topic => {
    const pathParts = [topic.subject || "General Engineering", ...getCategoryParts(topic.category)];
    let cursor = rootTree;
    for (const part of pathParts) {
      if (!cursor.children.has(part)) cursor.children.set(part, makeNode(part));
      cursor = cursor.children.get(part);
    }
    cursor.topics.push(topic);
  });

  menu.innerHTML = "";
  const leafBoxes = [];
  const groupBoxes = [];
  let footerCount = null;

  const hasChecked = root => root.querySelector(".topic-checkbox:checked") !== null;

  function updateDropdownLabel() {
    const topics = getSelectedTopics();
    if (topics.length === 0) {
      label.textContent = "Select topics…";
    } else if (topics.length === 1) {
      const t = topics[0];
      const parts = getCategoryParts(t.category);
      label.textContent = parts.length > 0 ? `${parts.join(" · ")}: ${t.title}` : t.title;
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
      if (leaves.length === 0) {
        box.checked = false;
        box.indeterminate = false;
        return;
      }
      const on = leaves.filter(b => b.checked).length;
      box.checked = on === leaves.length;
      box.indeterminate = on > 0 && on < leaves.length;
    });
  }

  function commitSelection() {
    syncGroupBoxes();
    updateDropdownLabel();
    if (selectedTopicIds.length === 0) {
      currentTopic = null;
      currentProblem = null;
      renderSelectionPrompt();
    } else if (!currentTopic || !selectedTopicIds.includes(currentTopic.id)) {
      generateNewProblem();
    } else {
      updateSidebarRelations(
        currentTopic.relations,
        getAllSelectedRelations(),
        masteryFor(currentTopic)
      );
    }
  }

  function createTopicLeaf(t, depth = 1) {
    const leaf = document.createElement("label");
    leaf.className = "topic-item topic-leaf";
    leaf.style.setProperty("--depth", String(depth));
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
      setTopicSelected(t.id, box.checked);
      leaf.classList.toggle("checked", box.checked);
      commitSelection();
    });

    return leaf;
  }

  function createGroupBox(collectLeaves) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "group-checkbox";
    box.addEventListener("click", e => e.stopPropagation());
    box.addEventListener("change", () => {
      const leaves = collectLeaves();
      leaves.forEach(b => {
        b.checked = box.checked;
        b.closest(".topic-leaf")?.classList.toggle("checked", box.checked);
        setTopicSelected(b.dataset.topicId, box.checked);
      });
      commitSelection();
    });

    groupBoxes.push({ box, collectLeaves });
    return box;
  }

  function renderFolderNode(node, depth = 0) {
    const isRootSubject = depth === 0;
    const group = document.createElement("div");
    group.className = isRootSubject ? "subject-group" : "category-group";

    const header = document.createElement("div");
    header.className = isRootSubject ? "subject-header" : "category-header";
    if (!isRootSubject) header.style.setProperty("--depth", String(depth));

    const box = createGroupBox(() => Array.from(group.querySelectorAll(".topic-checkbox")));
    const chevron = document.createElement("span");
    chevron.className = isRootSubject ? "subject-chevron" : "category-chevron";
    chevron.textContent = "▶";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = node.name;

    header.append(box, chevron, nameSpan);
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      group.classList.toggle("open");
    });

    const list = document.createElement("div");
    list.className = isRootSubject ? "topic-list" : "category-list";

    for (const childNode of node.children.values()) {
      list.appendChild(renderFolderNode(childNode, depth + 1));
    }
    node.topics.forEach(t => list.appendChild(createTopicLeaf(t, depth + 1)));

    group.append(header, list);
    if (hasChecked(group)) group.classList.add("open");
    return group;
  }

  for (const subjNode of rootTree.children.values()) {
    menu.appendChild(renderFolderNode(subjNode, 0));
  }
  
  // Footer: live count, Select all & Deselect all buttons
  const footer = document.createElement("div");
  footer.className = "topic-menu-footer";
  footerCount = document.createElement("span");
  footerCount.className = "topic-menu-count";

  const btnWrap = document.createElement("div");
  btnWrap.style.display = "flex";
  btnWrap.style.gap = "0.35rem";

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
    commitSelection();
  });

  const deselectAllBtn = document.createElement("button");
  deselectAllBtn.type = "button";
  deselectAllBtn.className = "menu-mini-btn";
  deselectAllBtn.textContent = "Deselect all";
  deselectAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    leafBoxes.forEach(b => {
      b.checked = false;
      b.closest(".topic-leaf")?.classList.remove("checked");
      setTopicSelected(b.dataset.topicId, false);
    });
    commitSelection();
  });

  btnWrap.append(selectAllBtn, deselectAllBtn);
  footer.append(footerCount, btnWrap);
  menu.appendChild(footer);

  syncGroupBoxes();
  updateDropdownLabel();

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("active");
    toggleBtn.classList.toggle("active", isOpen);
  });

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
          if (currentTopic) {
            updateSidebarRelations(
              currentTopic.relations,
              getAllSelectedRelations(),
              masteryFor(currentTopic)
            );
          }
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
  const pool = getSelectedTopics();
  if (pool.length === 0) {
    currentTopic = null;
    currentProblem = null;
    renderSelectionPrompt();
    openDropdown();
    return;
  }

  clearSelectionPrompt();
  const topic = pickWeakestTopic(pool, masteryFor) || pool[0];
  currentTopic = topic;

  incrementTopicTick(topic.id);
  incrementTopicTick("common");

  currentProblem = generateProblem(topic, masteryFor(topic));
  renderProblemView(currentProblem, currentProblem.relations || topic.relations, topic.id);
  renderTopicBadge(topic);
  updateSidebarRelations(
    topic.relations,
    getAllSelectedRelations(),
    masteryFor(topic)
  );
}
