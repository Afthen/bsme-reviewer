/**
 * app.js
 * Application Lifecycle & Multi-Tier Topic Orchestrator.
 */

import { TOPIC_MANIFEST, hasTopic, loadTopic, loadTopics } from "./src/topics/index.js";
import { MCQ_MANIFEST, hasMcqSet, loadMcqSets } from "./src/mcq/index.js";
import {
  listCustomManifests, loadCustomSet, saveCustomSetFromFile, deleteCustomSet
} from "./src/mcq/custom_store.js";
import { getSetMastery, getSetStats } from "./src/mcq/engine.js";
import { generateProblem } from "./src/core/problem_gen.js";
import { pickWeakestTopic } from "./src/core/topic_mix.js";
import {
  loadMastery, getDecayedMastery, incrementTopicTick,
  exportMasteryJSON, importMasteryJSON
} from "./src/mastery/index.js";
import { renderProblemView } from "./src/ui/problem_view.js";
import { renderMcqSets } from "./src/ui/mcq_view.js";
import {
  initSidebarView, updateSidebarRelations, renderMasteryBars, MASTERY_CHANGED_EVENT
} from "./src/ui/sidebar_view.js";

const SELECTED_TOPICS_KEY = "bsme.selectedTopicIds";
const SELECTED_MCQS_KEY = "bsme.selectedMcqIds";
const APP_MODE_KEY = "bsme.appMode";
const MANIFEST_BY_ID = new Map(TOPIC_MANIFEST.map(m => [m.id, m]));
const masteryFor = topic => eq => getDecayedMastery(eq, topic);

function loadSelectedTopicIds() {
  try {
    const raw = localStorage.getItem(SELECTED_TOPICS_KEY);
    if (raw === null) return [];
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) {
      return ids.filter(hasTopic);
    }
  } catch (_) { /* fallback to empty selection */ }
  return [];
}

function loadSelectedMcqIds() {
  try {
    const raw = localStorage.getItem(SELECTED_MCQS_KEY);
    if (raw) {
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) return ids;
    }
  } catch (_) {}
  return [];
}

function loadAppMode() {
  try {
    return localStorage.getItem(APP_MODE_KEY) === "mcq" ? "mcq" : "problems";
  } catch (_) {
    return "problems";
  }
}

let appMode = loadAppMode();
let selectedTopicIds = loadSelectedTopicIds();
let selectedMcqIds = loadSelectedMcqIds();
let customMcqManifests = [];
let currentTopic = null;
let currentProblem = null;
let selectionSeq = 0;

export { TOPIC_MANIFEST, loadTopic };

function getSelectedManifests() {
  return selectedTopicIds.map(id => MANIFEST_BY_ID.get(id)).filter(Boolean);
}

async function getSelectedTopics() {
  return loadTopics(selectedTopicIds);
}

async function getAllSelectedRelations() {
  const topics = await getSelectedTopics();
  return topics.flatMap(t => t.relations);
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

function setMcqSelected(id, on) {
  if (on) {
    if (!selectedMcqIds.includes(id)) selectedMcqIds.push(id);
  } else {
    selectedMcqIds = selectedMcqIds.filter(x => x !== id);
  }
  try {
    localStorage.setItem(SELECTED_MCQS_KEY, JSON.stringify(selectedMcqIds));
  } catch (_) {}
}

function getAllMcqManifests() {
  return [...MCQ_MANIFEST, ...customMcqManifests];
}

async function getSelectedMcqSets() {
  const repoIds = selectedMcqIds.filter(hasMcqSet);
  const customIds = selectedMcqIds.filter(id => customMcqManifests.some(m => m.id === id));
  const [repoSets, customSets] = await Promise.all([
    loadMcqSets(repoIds),
    Promise.all(customIds.map(loadCustomSet))
  ]);
  return [...repoSets, ...customSets.filter(Boolean)];
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
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openDropdown();
  });

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

  badge.textContent = topic.category
    ? `${topic.subject} · ${topic.category}: ${topic.title}`
    : `${topic.subject}: ${topic.title}`;
}

function renderMcqEmptyPrompt() {
  const view = document.getElementById("view-mcq");
  if (!view) return;
  view.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.id = "mcq-selection-prompt";
  wrap.className = "selection-prompt";

  const heading = document.createElement("h2");
  heading.textContent = "No quiz sets selected";

  const body = document.createElement("p");
  body.textContent =
    "Open the set checklist to tick curated quiz banks or upload your own .json / .zip reviewer.";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn";
  btn.textContent = "Choose quiz sets";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openDropdown();
  });

  wrap.append(heading, body, btn);
  view.classList.add("is-empty");
  view.appendChild(wrap);
}

async function refreshMcqMode() {
  const sets = await getSelectedMcqSets();
  const view = document.getElementById("view-mcq");
  if (!view) return;
  if (sets.length === 0) {
    renderMcqEmptyPrompt();
  } else {
    view.classList.remove("is-empty");
    renderMcqSets(sets);
  }
  updateMcqSidebar(sets);
}

function updateMcqSidebar(sets) {
  const sidebarTitle = document.querySelector("#sidebar-drawer .sidebar-title");
  if (sidebarTitle) sidebarTitle.textContent = "Quiz Set Mastery";
  const el = document.getElementById("weight-bars-el");
  if (!el) return;

  const entries = sets
    .map(s => {
      const stats = getSetStats(s);
      return {
        id: s.id,
        name: `${s.title} (${stats.seen}/${stats.total})`,
        mastery: getSetMastery(s)
      };
    })
    .sort((a, b) => a.mastery - b.mastery);

  renderMasteryBars(el, entries, e => e.mastery);
}

function applyAppMode(mode) {
  appMode = mode;
  try { localStorage.setItem(APP_MODE_KEY, mode); } catch (_) {}

  document.querySelectorAll("#app-mode-switch .mode-switch-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  const viewProblem = document.getElementById("view-problem");
  const viewMcq = document.getElementById("view-mcq");
  const viewCarousel = document.getElementById("view-carousel");
  viewCarousel?.classList.remove("active");

  if (mode === "mcq") {
    viewProblem?.classList.remove("active");
    viewMcq?.classList.add("active");
    setupMcqSelector();
    refreshMcqMode();
  } else {
    viewMcq?.classList.remove("active");
    viewProblem?.classList.add("active");
    const sidebarTitle = document.querySelector("#sidebar-drawer .sidebar-title");
    if (sidebarTitle) sidebarTitle.textContent = "Formula Mastery (Harmonic)";
    setupTopicSelector();
    generateNewProblem();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  loadMastery();
  customMcqManifests = await listCustomManifests();
  initSidebarView([], () => 0, []);
  setupHeaderActions();

  document.querySelectorAll("#app-mode-switch .mode-switch-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode && btn.dataset.mode !== appMode) {
        applyAppMode(btn.dataset.mode);
      }
    });
  });

  document.addEventListener(MASTERY_CHANGED_EVENT, async () => {
    if (appMode === "mcq") {
      const sets = await getSelectedMcqSets();
      updateMcqSidebar(sets);
    } else if (currentTopic) {
      const allRels = await getAllSelectedRelations();
      updateSidebarRelations(
        currentTopic.relations,
        allRels,
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

  applyAppMode(appMode);
});

function setupTopicSelector() {
  const container = document.getElementById("topic-dropdown-container");
  if (!container) return;

  const toggleBtn = document.getElementById("topic-dropdown-toggle");
  const label = document.getElementById("topic-dropdown-label");
  const menu = document.getElementById("topic-dropdown-menu");

  const subjects = {};
  TOPIC_MANIFEST.forEach(topic => {
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
  const leafBoxes = [];
  const groupBoxes = [];
  let footerCount = null;

  const hasChecked = root => root.querySelector(".topic-checkbox:checked") !== null;

  function updateDropdownLabel() {
    const topics = getSelectedManifests();
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
      footerCount.textContent = `${topics.length} of ${TOPIC_MANIFEST.length} topics in review set`;
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

  async function commitSelection() {
    syncGroupBoxes();
    updateDropdownLabel();
    if (selectedTopicIds.length === 0) {
      selectionSeq++;
      currentTopic = null;
      currentProblem = null;
      renderSelectionPrompt();
    } else if (!currentTopic || !selectedTopicIds.includes(currentTopic.id)) {
      await generateNewProblem();
    } else {
      const seq = ++selectionSeq;
      const allRels = await getAllSelectedRelations();
      if (seq !== selectionSeq || !currentTopic) return;
      updateSidebarRelations(
        currentTopic.relations,
        allRels,
        masteryFor(currentTopic)
      );
    }
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
      const catNameSpan = document.createElement("span");
      catNameSpan.textContent = catName;

      catHeader.append(catBox, catChevron, catNameSpan);
      catHeader.addEventListener("click", (e) => {
        e.stopPropagation();
        catGroup.classList.toggle("open");
      });

      const catList = document.createElement("div");
      catList.className = "category-list";
      catTopics.forEach(t => catList.appendChild(createTopicLeaf(t, "level-3")));

      catGroup.append(catHeader, catList);
      if (hasChecked(catGroup)) catGroup.classList.add("open");
      subjectList.appendChild(catGroup);
    }

    standalone.forEach(t => subjectList.appendChild(createTopicLeaf(t, "level-2")));
    subjectGroup.append(subjectHeader, subjectList);
    if (hasChecked(subjectGroup)) subjectGroup.classList.add("open");
    menu.appendChild(subjectGroup);
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

  if (!container.dataset.boundDropdown) {
    container.dataset.boundDropdown = "1";
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
}

function setupMcqSelector() {
  const container = document.getElementById("topic-dropdown-container");
  if (!container) return;
  const toggleBtn = document.getElementById("topic-dropdown-toggle");
  const label = document.getElementById("topic-dropdown-label");
  const menu = document.getElementById("topic-dropdown-menu");

  const manifests = getAllMcqManifests();
  const subjects = {};
  manifests.forEach(m => {
    const subj = m.subject || "General";
    if (!subjects[subj]) subjects[subj] = { categories: {}, standalone: [] };
    if (m.category) {
      if (!subjects[subj].categories[m.category]) subjects[subj].categories[m.category] = [];
      subjects[subj].categories[m.category].push(m);
    } else {
      subjects[subj].standalone.push(m);
    }
  });

  menu.innerHTML = "";
  const leafBoxes = [];

  function updateLabel() {
    const selected = getAllMcqManifests().filter(m => selectedMcqIds.includes(m.id));
    if (selected.length === 0) label.textContent = "Select quiz sets…";
    else if (selected.length === 1) label.textContent = selected[0].title;
    else label.textContent = `${selected.length} quiz sets selected`;
    toggleBtn.title = selected.map(s => s.title).join(", ");
  }

  function createMcqLeaf(m, levelClass) {
    const leaf = document.createElement("label");
    leaf.className = `topic-item topic-leaf ${levelClass}`;
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "topic-checkbox";
    box.dataset.mcqId = m.id;
    box.checked = selectedMcqIds.includes(m.id);

    const title = document.createElement("span");
    title.className = "topic-leaf-title";
    title.textContent = `${m.title} (${m.count})`;

    leaf.append(box, title);
    if (m.isCustom) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "menu-mini-btn";
      del.textContent = "✕";
      del.style.marginLeft = "auto";
      del.addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();
        await deleteCustomSet(m.id);
        setMcqSelected(m.id, false);
        customMcqManifests = await listCustomManifests();
        setupMcqSelector();
        refreshMcqMode();
      });
      leaf.appendChild(del);
    }

    leaf.classList.toggle("checked", box.checked);
    leafBoxes.push(box);

    box.addEventListener("change", () => {
      setMcqSelected(m.id, box.checked);
      leaf.classList.toggle("checked", box.checked);
      updateLabel();
      refreshMcqMode();
    });

    return leaf;
  }

  for (const [subjName, { categories, standalone }] of Object.entries(subjects)) {
    const group = document.createElement("div");
    group.className = "subject-group open";
    const header = document.createElement("div");
    header.className = "subject-header";
    const chev = document.createElement("span");
    chev.className = "subject-chevron";
    chev.textContent = "▶";
    const name = document.createElement("span");
    name.textContent = subjName;
    header.append(chev, name);
    header.addEventListener("click", e => { e.stopPropagation(); group.classList.toggle("open"); });

    const list = document.createElement("div");
    list.className = "topic-list";
    for (const [catName, items] of Object.entries(categories)) {
      const catGroup = document.createElement("div");
      catGroup.className = "category-group open";
      const catHeader = document.createElement("div");
      catHeader.className = "category-header";
      const catChev = document.createElement("span");
      catChev.className = "category-chevron";
      catChev.textContent = "▶";
      const catSpan = document.createElement("span");
      catSpan.textContent = catName;
      catHeader.append(catChev, catSpan);
      catHeader.addEventListener("click", e => { e.stopPropagation(); catGroup.classList.toggle("open"); });
      const catList = document.createElement("div");
      catList.className = "category-list";
      items.forEach(m => catList.appendChild(createMcqLeaf(m, "level-3")));
      catGroup.append(catHeader, catList);
      list.appendChild(catGroup);
    }
    standalone.forEach(m => list.appendChild(createMcqLeaf(m, "level-2")));
    group.append(header, list);
    menu.appendChild(group);
  }

  const footer = document.createElement("div");
  footer.className = "topic-menu-footer";
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "menu-mini-btn";
  addBtn.textContent = "+ Add Quiz (.json / .zip)";
  addBtn.addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("mcq-file-input")?.click();
  });

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "menu-mini-btn";
  clearBtn.textContent = "Deselect all";
  clearBtn.addEventListener("click", e => {
    e.stopPropagation();
    leafBoxes.forEach(b => {
      b.checked = false;
      b.closest(".topic-leaf")?.classList.remove("checked");
      setMcqSelected(b.dataset.mcqId, false);
    });
    updateLabel();
    refreshMcqMode();
  });

  footer.append(addBtn, clearBtn);
  menu.appendChild(footer);
  updateLabel();
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
      reader.onload = async ev => {
        const res = importMasteryJSON(ev.target.result);
        if (res.success) {
          alert("Global Mastery profile imported successfully!");
          if (currentTopic) {
            const allRels = await getAllSelectedRelations();
            updateSidebarRelations(
              currentTopic.relations,
              allRels,
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

  const mcqFileInput = document.getElementById("mcq-file-input");
  if (mcqFileInput) {
    mcqFileInput.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const saved = await saveCustomSetFromFile(file);
        customMcqManifests = await listCustomManifests();
        setMcqSelected(saved.id, true);
        if (appMode === "mcq") {
          setupMcqSelector();
          refreshMcqMode();
        }
      } catch (err) {
        alert(`Could not load quiz file: ${err.message}`);
      } finally {
        mcqFileInput.value = "";
      }
    });
  }

  const nextBtn = document.getElementById("btn-generate-next");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => generateNewProblem());
  }
}

async function generateNewProblem() {
  if (selectedTopicIds.length === 0) {
    selectionSeq++;
    currentTopic = null;
    currentProblem = null;
    renderSelectionPrompt();
    openDropdown();
    return;
  }

  const seq = ++selectionSeq;
  const pool = await getSelectedTopics();
  if (seq !== selectionSeq) return;

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
    pool.flatMap(t => t.relations),
    masteryFor(topic)
  );
}