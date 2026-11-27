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
import { renderMcqSets, getCurrentMcqSetId } from "./src/ui/mcq_view.js";
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
const liveMcqCounts = new Map();
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

function closeDropdown() {
  document.getElementById("topic-dropdown-menu")?.classList.remove("active");
  document.getElementById("topic-dropdown-toggle")?.classList.remove("active");
}

function initDropdownShell() {
  const container = document.getElementById("topic-dropdown-container");
  const toggleBtn = document.getElementById("topic-dropdown-toggle");
  const menu = document.getElementById("topic-dropdown-menu");
  if (!container || !toggleBtn || !menu) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("active");
    toggleBtn.classList.toggle("active", isOpen);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-opens-dropdown]")) return;
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });
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
  btn.dataset.opensDropdown = "1";
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
  btn.dataset.opensDropdown = "1";
  btn.addEventListener("click", openDropdown);

  wrap.append(heading, body, btn);
  view.classList.add("is-empty");
  view.appendChild(wrap);
}

async function refreshMcqMode() {
  const sets = await getSelectedMcqSets();
  for (const s of sets) {
    const qCount = s.questions?.length ?? s.count ?? 0;
    liveMcqCounts.set(s.id, qCount);
    const leaf = document.querySelector(`.topic-leaf[data-mcq-id="${s.id}"] .topic-leaf-title`);
    if (leaf) {
      leaf.textContent = `${s.title} (${qCount})`;
    }
  }
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

  const allEntries = sets
    .map(s => {
      const stats = getSetStats(s);
      return {
        id: s.id,
        name: `${s.title} (${stats.seen}/${stats.total})`,
        mastery: getSetMastery(s)
      };
    })
    .sort((a, b) => a.mastery - b.mastery);

  const activeId = getCurrentMcqSetId();
  const currentEntries = allEntries.filter(e => e.id === activeId);

  updateSidebarRelations(
    currentEntries.length > 0 ? currentEntries : allEntries,
    allEntries,
    e => e.mastery,
    { currentLabel: "Current Set", allLabel: "All Selected" }
  );
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
  initDropdownShell();
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
        masteryFor(currentTopic),
        { currentLabel: "Current Problem", allLabel: "All Selected" }
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

function setupTreeDropdown({
  items,
  defaultSubject = "General",
  pluralNoun = "items",
  dataAttr = "id",
  isItemSelected,
  setItemSelected,
  onCommit,
  getItemTitle,
  getToggleLabel,
  renderLeafExtra,
  extraFooterButtons = []
}) {
  const container = document.getElementById("topic-dropdown-container");
  if (!container) return;

  const toggleBtn = document.getElementById("topic-dropdown-toggle");
  const label = document.getElementById("topic-dropdown-label");
  const menu = document.getElementById("topic-dropdown-menu");

  const subjects = {};
  items.forEach(item => {
    const subj = item.subject || defaultSubject;
    if (!subjects[subj]) subjects[subj] = { categories: {}, standalone: [] };
    if (item.category) {
      if (!subjects[subj].categories[item.category]) {
        subjects[subj].categories[item.category] = [];
      }
      subjects[subj].categories[item.category].push(item);
    } else {
      subjects[subj].standalone.push(item);
    }
  });

  menu.innerHTML = "";
  const leafBoxes = [];
  const groupBoxes = [];
  let footerCount = null;

  const hasChecked = root => root.querySelector(".topic-checkbox:checked") !== null;

  function updateDropdownLabel() {
    const selected = items.filter(it => isItemSelected(it.id));
    if (getToggleLabel) {
      label.textContent = getToggleLabel(selected);
    } else if (selected.length === 0) {
      label.textContent = `Select ${pluralNoun}…`;
    } else if (selected.length === 1) {
      const it = selected[0];
      label.textContent = it.category ? `${it.category}: ${it.title}` : it.title;
    } else {
      label.textContent = `${selected.length} ${pluralNoun} selected`;
    }
    toggleBtn.title = selected.map(it => it.title).join(", ");
    if (footerCount) {
      footerCount.textContent = `${selected.length} of ${items.length} ${pluralNoun} in review set`;
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
    if (onCommit) await onCommit();
  }

  function createLeaf(item, levelClass) {
    const leaf = document.createElement("label");
    leaf.className = `topic-item topic-leaf ${levelClass}`;
    leaf.dataset[dataAttr] = item.id;
    leaf.dataset.id = item.id;

    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "topic-checkbox";
    box.dataset[dataAttr] = item.id;
    box.dataset.id = item.id;
    box.checked = isItemSelected(item.id);

    const title = document.createElement("span");
    title.className = "topic-leaf-title";
    title.textContent = getItemTitle ? getItemTitle(item) : item.title;

    leaf.append(box, title);

    if (renderLeafExtra) {
      renderLeafExtra(item, leaf);
    }

    leaf.classList.toggle("checked", box.checked);
    leafBoxes.push(box);

    box.addEventListener("change", () => {
      setItemSelected(item.id, box.checked);
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
        setItemSelected(b.dataset.id, box.checked);
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

    for (const [catName, catItems] of Object.entries(categories)) {
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
      catItems.forEach(it => catList.appendChild(createLeaf(it, "level-3")));

      catGroup.append(catHeader, catList);
      if (hasChecked(catGroup)) catGroup.classList.add("open");
      subjectList.appendChild(catGroup);
    }

    standalone.forEach(it => subjectList.appendChild(createLeaf(it, "level-2")));
    subjectGroup.append(subjectHeader, subjectList);
    if (hasChecked(subjectGroup)) subjectGroup.classList.add("open");
    menu.appendChild(subjectGroup);
  }

  // Footer: live count, extra buttons, Select all & Deselect all buttons
  const footer = document.createElement("div");
  footer.className = "topic-menu-footer";
  footerCount = document.createElement("span");
  footerCount.className = "topic-menu-count";

  const btnWrap = document.createElement("div");
  btnWrap.style.display = "flex";
  btnWrap.style.gap = "0.35rem";
  btnWrap.style.alignItems = "center";
  btnWrap.style.flexWrap = "wrap";
  btnWrap.style.justifyContent = "flex-end";

  extraFooterButtons.forEach(btnConfig => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-mini-btn";
    btn.textContent = btnConfig.text;
    btn.addEventListener("click", btnConfig.onClick);
    btnWrap.appendChild(btn);
  });

  const selectAllBtn = document.createElement("button");
  selectAllBtn.type = "button";
  selectAllBtn.className = "menu-mini-btn";
  selectAllBtn.textContent = "Select all";
  selectAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    leafBoxes.forEach(b => {
      b.checked = true;
      b.closest(".topic-leaf")?.classList.add("checked");
      setItemSelected(b.dataset.id, true);
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
      setItemSelected(b.dataset.id, false);
    });
    commitSelection();
  });

  btnWrap.append(selectAllBtn, deselectAllBtn);
  footer.append(footerCount, btnWrap);
  menu.appendChild(footer);

  syncGroupBoxes();
  updateDropdownLabel();
}

function setupTopicSelector() {
  setupTreeDropdown({
    items: TOPIC_MANIFEST,
    defaultSubject: "General Engineering",
    pluralNoun: "topics",
    dataAttr: "topicId",
    isItemSelected: isTopicSelected,
    setItemSelected: setTopicSelected,
    getToggleLabel: (selected) => {
      if (selected.length === 0) return "Select topics…";
      if (selected.length === 1) {
        const t = selected[0];
        return t.category ? `${t.category}: ${t.title}` : t.title;
      }
      return `${selected.length} topics selected`;
    },
    onCommit: async () => {
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
          masteryFor(currentTopic),
          { currentLabel: "Current Problem", allLabel: "All Selected" }
        );
      }
    }
  });
}

function setupMcqSelector() {
  const manifests = getAllMcqManifests();
  setupTreeDropdown({
    items: manifests,
    defaultSubject: "General",
    pluralNoun: "quiz sets",
    dataAttr: "mcqId",
    isItemSelected: (id) => selectedMcqIds.includes(id),
    setItemSelected: setMcqSelected,
    getItemTitle: (m) => {
      const count = liveMcqCounts.get(m.id) ?? m.count;
      return `${m.title} (${count})`;
    },
    getToggleLabel: (selected) => {
      if (selected.length === 0) return "Select quiz sets…";
      if (selected.length === 1) return selected[0].title;
      return `${selected.length} quiz sets selected`;
    },
    renderLeafExtra: (m, leaf) => {
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
    },
    extraFooterButtons: [
      {
        text: "+ Add Quiz (.json / .zip)",
        onClick: (e) => {
          e.stopPropagation();
          document.getElementById("mcq-file-input")?.click();
        }
      }
    ],
    onCommit: async () => {
      refreshMcqMode();
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
    masteryFor(topic),
    { currentLabel: "Current Problem", allLabel: "All Selected" }
  );
}