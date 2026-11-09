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
import { initSidebarView, renderSidebar, MASTERY_CHANGED_EVENT } from "./src/ui/sidebar_view.js";

/* ------------------------------------------------------------------ *
 *  Multi-topic review set (checklist dropdown)                       *
 *  Persisted in localStorage; leaves of the Subject -> Category ->   *
 *  Topic tree are checkboxes. Problems are drawn from the selected   *
 *  pool, weakest-material topic first (see src/core/topic_mix.js).   *
 *  First run: nothing selected — the student is prompted to pick.    *
 * ------------------------------------------------------------------ */
const SELECTED_TOPICS_KEY = "bsme.selectedTopicIds";

const TOPIC_BY_ID = new Map(ALL_TOPICS.map(t => [t.id, t]));

const masteryFor = topic => eq => getDecayedMastery(eq, topic);

function loadSelectedTopicIds() {
  try {
    const raw = localStorage.getItem(SELECTED_TOPICS_KEY);
    if (raw === null) return [];              // first visit: prompt to pick
    const ids = JSON.parse(raw);
    if (Array.isArray(ids)) {
      return ids.filter(id => TOPIC_BY_ID.has(id));
    }
  } catch (_) { /* corrupted state -> start empty and prompt */ }
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
    "ideal for midterm prep. Your selection is remembered between sessions.";

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
  badge.textContent = topic.category
    ? `${topic.subject} · ${topic.category}: ${topic.title}`
    : `${topic.subject}: ${topic.title}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadMastery();
  setupTopicSelector();
  initSidebarView(
    currentTopic ? currentTopic.relations : [],
    currentTopic ? masteryFor(currentTopic) : () => 0
  );
  setupHeaderActions();

  document.addEventListener(MASTERY_CHANGED_EVENT, () => {
    if (currentTopic) {
      renderSidebar(currentTopic.relations, masteryFor(currentTopic));
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

/* ------------------------------------------------------------------ *
 *  Checklist dropdown: Subject -> Category (optional) -> [x] Topic   *
 *  Collapsible groups kept; leaves are checkboxes; menu stays open   *
 *  while ticking. Group checkboxes bulk-toggle their subtree and     *
 *  show indeterminate for partial selections. Once at least one      *
 *  topic is ticked the set can never become empty (deny flash).      *
 *  All mutation sites funnel through commitSelection().              *
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
  let footerCount = null;                     // live "N of M" readout in menu footer

  const hasChecked = root => root.querySelector(".topic-checkbox:checked") !== null;

  const wouldEmptyAfterRemoving = ids =>
    selectedTopicIds.filter(id => !ids.includes(id)).length === 0;

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

  // Single commit path for every mutation site (leaf / group / select-all).
  function commitSelection(wasEmpty) {
    syncGroupBoxes();
    updateDropdownLabel();
    // First tick of a session: no problem in progress, start right away.
    if (wasEmpty) generateNewProblem();
    // NOTE: otherwise no auto-regenerate — the student keeps the current
    // problem; the new pool applies from the next "Next problem" click.
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
      const wasEmpty = selectedTopicIds.length === 0;

      // Never allow an empty review set: deny un-ticking the last topic.
      if (!box.checked && wouldEmptyAfterRemoving([t.id])) {
        box.checked = true;
        flashDeny(leaf);
        return;
      }

      setTopicSelected(t.id, box.checked);
      leaf.classList.toggle("checked", box.checked);
      commitSelection(wasEmpty);
    });

    return leaf;
  }

  function createGroupBox(collectLeaves) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "group-checkbox";

    box.addEventListener("click", e => e.stopPropagation());   // don't collapse
    box.addEventListener("change", () => {
      const wasEmpty = selectedTopicIds.length === 0;
      const leaves = collectLeaves();
      const ids = leaves.map(b => b.dataset.topicId);

      if (!box.checked && wouldEmptyAfterRemoving(ids)) {
        flashDeny(box);
        syncGroupBoxes();
        return;
      }

      leaves.forEach(b => {
        b.checked = box.checked;
        b.closest(".topic-leaf")?.classList.toggle("checked", box.checked);
        setTopicSelected(b.dataset.topicId, box.checked);
      });
      commitSelection(wasEmpty);
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

    // 2. Standalone topics under subject (e.g. Cooling Towers, Spur Gears)
    standalone.forEach(t => subjectList.appendChild(createTopicLeaf(t, "level-2")));

    subjectGroup.append(subjectHeader, subjectList);
    if (hasChecked(subjectGroup)) subjectGroup.classList.add("open");
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