/**
 * src/ui/mcq_view.js
 * Multiple-Choice Quiz View:
 * - Setup Lobby: set summary, Study/Exam mode, snapping count slider + editable input, optional timer
 * - Study Mode: 1-question-at-a-time, 2x2 or 1x4 layout, per-item timer, keyboard shortcuts
 * - Exam Mode: scrollable borderless-option sheet, click-to-unselect, unanswered guard, total timer
 * - Summary View: score, time, Retry Missed, New Batch with count picker, graded review
 */

import {
  selectBatch,
  buildSessionItems,
  recordQuestionAttempt,
  getQuestionMastery,
  getSetStats,
  getSetMastery
} from "../mcq/engine.js";
import { MASTERY_CHANGED_EVENT } from "./sidebar_view.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const SNAP_STEPS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

let activeSets = [];
let sessionItems = [];
let phase = "setup"; // "setup" | "active" | "summary"
let mcqMode = "study"; // "study" | "exam"
let batchSize = 25;

let timerEnabled = false;
let studySeconds = 60;
let examMinutes = 30;
let remainingSeconds = 0;
let timerLocked = false;
let timerId = null;
let sessionStartMs = 0;
let elapsedSeconds = 0;

let currentIndex = 0;
let answers = {}; // idx -> letter
let timedOutItems = new Set();
let examSubmitted = false;
let unansweredPromptOpen = false;
let keyHandlerBound = false;

function typeset(el) {
  if (typeof window !== "undefined" && typeof window.renderMathInElement === "function" && el) {
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
    });
  }
}

function getTotalAvailableQuestions() {
  return activeSets.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
}

function clampBatchSize(val, total) {
  if (total <= 0) return 0;
  const n = Math.round(Number(val) || 1);
  return Math.max(1, Math.min(total, n));
}

function getSnapPoints(total) {
  if (total <= 1) return [1];
  const pts = SNAP_STEPS.filter(s => s < total);
  if (!pts.includes(total)) pts.push(total);
  return pts;
}

function snapValue(val, total) {
  const pts = getSnapPoints(total);
  let best = pts[0];
  let bestDist = Math.abs(val - best);
  for (const p of pts) {
    const d = Math.abs(val - p);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  const pad = n => String(n).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(rem)}` : `${pad(mins)}:${pad(rem)}`;
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startCountdown(seconds, onExpire) {
  stopTimer();
  remainingSeconds = Math.max(1, Math.floor(seconds));
  timerLocked = false;

  timerId = setInterval(() => {
    const view = document.getElementById("view-mcq");
    if (!view || !view.classList.contains("active") || phase !== "active") {
      stopTimer();
      return;
    }
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      stopTimer();
      timerLocked = true;
      onExpire();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById("mcq-timer-pill");
  if (!el) return;
  el.textContent = timerLocked ? "00:00 · Locked" : formatClock(remainingSeconds);
  el.classList.toggle("is-low", !timerLocked && remainingSeconds > 0 && remainingSeconds <= 10);
  el.classList.toggle("is-locked", timerLocked);
}

export function renderMcqSets(sets = []) {
  activeSets = sets;
  const view = document.getElementById("view-mcq");
  if (!view) return;

  if (!keyHandlerBound) {
    document.addEventListener("keydown", handleKeyDown);
    keyHandlerBound = true;
  }

  stopTimer();
  const total = getTotalAvailableQuestions();
  if (total > 0) {
    batchSize = clampBatchSize(batchSize || 25, total);
  }
  phase = "setup";
  sessionItems = [];
  answers = {};
  timedOutItems = new Set();
  examSubmitted = false;
  timerLocked = false;
  unansweredPromptOpen = false;
  renderMcqShell();
}

export function startNewMcqBatch(customItems = null) {
  const view = document.getElementById("view-mcq");
  if (!view) return;

  stopTimer();
  const total = getTotalAvailableQuestions();

  if (Array.isArray(customItems)) {
    sessionItems = customItems;
  } else {
    batchSize = clampBatchSize(batchSize, total);
    const packed = selectBatch(activeSets, batchSize);
    sessionItems = buildSessionItems(packed);
  }

  phase = "active";
  currentIndex = 0;
  answers = {};
  timedOutItems = new Set();
  examSubmitted = false;
  timerLocked = false;
  unansweredPromptOpen = false;
  sessionStartMs = Date.now();
  elapsedSeconds = 0;

  if (timerEnabled && sessionItems.length > 0) {
    if (mcqMode === "study") {
      startStudyItemTimer();
    } else {
      startCountdown(Math.max(1, examMinutes) * 60, handleExamTimerExpire);
    }
  }

  renderMcqShell();
}

function startStudyItemTimer() {
  if (!timerEnabled) {
    stopTimer();
    timerLocked = false;
    return;
  }
  if (answers[currentIndex] !== undefined || timedOutItems.has(currentIndex)) {
    stopTimer();
    timerLocked = timedOutItems.has(currentIndex) && answers[currentIndex] === undefined;
    return;
  }
  startCountdown(Math.max(5, studySeconds), () => {
    timedOutItems.add(currentIndex);
    const stage = document.getElementById("mcq-stage");
    if (stage && phase === "active" && mcqMode === "study") {
      renderStudyView(stage);
    }
  });
}

function handleExamTimerExpire() {
  const stage = document.getElementById("mcq-stage");
  if (stage && phase === "active" && mcqMode === "exam") {
    renderExamView(stage);
  }
}

function returnToSetup() {
  stopTimer();
  phase = "setup";
  timerLocked = false;
  unansweredPromptOpen = false;
  renderMcqShell();
}

function createCountPicker(total, initialVal, onChange) {
  let current = clampBatchSize(initialVal, total);

  const wrap = document.createElement("div");
  wrap.className = "mcq-count-picker";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "mcq-count-slider";
  slider.min = "1";
  slider.max = String(Math.max(1, total));
  slider.value = String(current);
  slider.disabled = total <= 1;

  const numInput = document.createElement("input");
  numInput.type = "number";
  numInput.className = "mcq-count-input";
  numInput.min = "1";
  numInput.max = String(Math.max(1, total));
  numInput.value = String(current);
  numInput.disabled = total <= 1;
  numInput.setAttribute("aria-label", "Number of questions");

  const suffix = document.createElement("span");
  suffix.className = "mcq-count-total";
  suffix.textContent = `/ ${total}`;

  slider.addEventListener("input", () => {
    const snapped = snapValue(Number(slider.value), total);
    current = snapped;
    slider.value = String(snapped);
    numInput.value = String(snapped);
    onChange(snapped);
  });

  numInput.addEventListener("input", () => {
    if (numInput.value === "") return;
    const clamped = clampBatchSize(numInput.value, total);
    current = clamped;
    slider.value = String(clamped);
    onChange(clamped);
  });

  numInput.addEventListener("blur", () => {
    const clamped = clampBatchSize(numInput.value, total);
    current = clamped;
    numInput.value = String(clamped);
    slider.value = String(clamped);
    onChange(clamped);
  });

  wrap.append(slider, numInput, suffix);
  return wrap;
}

function renderMcqShell() {
  const view = document.getElementById("view-mcq");
  if (!view) return;
  view.innerHTML = "";

  if (activeSets.length === 0) return;

  const container = document.createElement("div");
  container.className = "article-container mcq-container";

  if (phase === "active") {
    container.appendChild(renderActiveToolbar());
  }

  const stage = document.createElement("div");
  stage.id = "mcq-stage";
  container.appendChild(stage);
  view.appendChild(container);

  if (phase === "setup") {
    renderSetupView(stage);
  } else if (phase === "active") {
    if (mcqMode === "study") {
      renderStudyView(stage);
    } else {
      renderExamView(stage);
    }
  } else {
    renderSummaryView(stage);
  }
}

function renderActiveToolbar() {
  const bar = document.createElement("div");
  bar.className = "mcq-toolbar";

  const left = document.createElement("div");
  left.className = "mcq-toolbar-left";

  const modeBadge = document.createElement("span");
  modeBadge.className = "mcq-mode-badge";
  modeBadge.textContent = mcqMode === "study" ? "Study Mode" : "Exam Mode";

  const progress = document.createElement("span");
  progress.id = "mcq-toolbar-progress";
  progress.className = "mcq-progress-label";
  if (mcqMode === "study") {
    progress.textContent = `${currentIndex + 1} / ${sessionItems.length}`;
  } else {
    const answeredCount = Object.keys(answers).length;
    progress.textContent = `${answeredCount} / ${sessionItems.length} answered`;
  }

  left.append(modeBadge, progress);

  const right = document.createElement("div");
  right.className = "mcq-toolbar-right";

  if (timerEnabled) {
    const timerEl = document.createElement("span");
    timerEl.id = "mcq-timer-pill";
    timerEl.className = "mcq-timer-pill";
    right.appendChild(timerEl);
  }

  const btnQuit = document.createElement("button");
  btnQuit.type = "button";
  btnQuit.className = "btn";
  btnQuit.textContent = "Quit";
  btnQuit.addEventListener("click", returnToSetup);

  right.appendChild(btnQuit);
  bar.append(left, right);

  queueMicrotask(updateTimerDisplay);
  return bar;
}

function renderSetupView(stage) {
  stage.innerHTML = "";

  const total = getTotalAvailableQuestions();
  let totalSeen = 0;
  let weightedMastery = 0;
  for (const s of activeSets) {
    const stats = getSetStats(s);
    totalSeen += stats.seen;
    weightedMastery += getSetMastery(s) * (s.questions?.length || 0);
  }
  const avgMasteryPct = total > 0 ? Math.round((weightedMastery / total) * 100) : 0;
  const unseen = Math.max(0, total - totalSeen);

  const card = document.createElement("div");
  card.className = "mcq-setup-card";

  const header = document.createElement("div");
  header.className = "mcq-setup-header";

  const title = document.createElement("h2");
  title.className = "mcq-setup-title";
  title.textContent = "Quiz Setup";

  const sub = document.createElement("p");
  sub.className = "mcq-setup-subtitle";
  sub.textContent = `${activeSets.length} set${activeSets.length === 1 ? "" : "s"} selected · ${total} questions (${unseen} unseen · ${avgMasteryPct}% mastery)`;

  header.append(title, sub);
  card.appendChild(header);

  const setList = document.createElement("div");
  setList.className = "mcq-setup-sets";
  activeSets.forEach(s => {
    const chip = document.createElement("span");
    chip.className = "topic-badge";
    chip.textContent = `${s.title} (${s.questions?.length || 0})`;
    setList.appendChild(chip);
  });
  card.appendChild(setList);

  const modeSection = document.createElement("div");
  modeSection.className = "mcq-setup-section";

  const modeLabel = document.createElement("div");
  modeLabel.className = "mcq-setup-label";
  modeLabel.textContent = "Mode";

  const modeGrid = document.createElement("div");
  modeGrid.className = "mcq-mode-cards";

  const modes = [
    {
      id: "study",
      title: "Study Mode",
      desc: "One question at a time with instant feedback, mastery status, and keyboard shortcuts."
    },
    {
      id: "exam",
      title: "Exam Mode",
      desc: "Scrollable full sheet with clean letter choices. Grade all answers at the end."
    }
  ];

  modes.forEach(m => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `mcq-mode-card ${mcqMode === m.id ? "active" : ""}`;
    btn.innerHTML = `<span class="mcq-mode-card-title">${m.title}</span><span class="mcq-mode-card-desc">${m.desc}</span>`;
    btn.addEventListener("click", () => {
      if (mcqMode === m.id) return;
      mcqMode = m.id;
      renderSetupView(stage);
    });
    modeGrid.appendChild(btn);
  });

  modeSection.append(modeLabel, modeGrid);
  card.appendChild(modeSection);

  const countSection = document.createElement("div");
  countSection.className = "mcq-setup-section";

  const countLabel = document.createElement("div");
  countLabel.className = "mcq-setup-label";
  countLabel.textContent = "Questions";

  const picker = createCountPicker(total, batchSize, val => {
    batchSize = val;
  });

  countSection.append(countLabel, picker);
  card.appendChild(countSection);

  const timerSection = document.createElement("div");
  timerSection.className = "mcq-setup-section";

  const timerRow = document.createElement("div");
  timerRow.className = "mcq-timer-config";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mcq-timer-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = timerEnabled;
  checkbox.addEventListener("change", () => {
    timerEnabled = checkbox.checked;
    renderSetupView(stage);
  });

  const toggleText = document.createElement("span");
  toggleText.textContent = mcqMode === "study" ? "Per-question timer" : "Exam timer";
  toggleLabel.append(checkbox, toggleText);
  timerRow.appendChild(toggleLabel);

  if (timerEnabled) {
    const durWrap = document.createElement("div");
    durWrap.className = "mcq-timer-duration";

    const durInput = document.createElement("input");
    durInput.type = "number";
    durInput.className = "mcq-count-input";
    durInput.min = mcqMode === "study" ? "5" : "1";
    durInput.max = mcqMode === "study" ? "600" : "300";
    durInput.value = String(mcqMode === "study" ? studySeconds : examMinutes);
    durInput.addEventListener("input", () => {
      const n = parseInt(durInput.value, 10);
      if (!Number.isFinite(n) || n <= 0) return;
      if (mcqMode === "study") studySeconds = Math.min(600, Math.max(5, n));
      else examMinutes = Math.min(300, Math.max(1, n));
    });

    const unitText = document.createElement("span");
    unitText.className = "mcq-count-total";
    unitText.textContent = mcqMode === "study" ? "sec / item" : "min total";

    durWrap.append(durInput, unitText);
    timerRow.appendChild(durWrap);
  }

  timerSection.appendChild(timerRow);
  card.appendChild(timerSection);

  const actions = document.createElement("div");
  actions.className = "mcq-setup-actions";

  const btnStart = document.createElement("button");
  btnStart.type = "button";
  btnStart.className = "btn-generate-next";
  btnStart.disabled = total === 0;
  btnStart.textContent = mcqMode === "study" ? "Start Study Session" : "Start Exam";
  btnStart.addEventListener("click", () => startNewMcqBatch());

  actions.appendChild(btnStart);
  card.appendChild(actions);
  stage.appendChild(card);
}

function renderQuestionMedia(item) {
  if (!item.imageSrc) return null;
  const wrap = document.createElement("div");
  wrap.className = "mcq-image-wrap";
  const img = document.createElement("img");
  img.src = item.imageSrc;
  img.alt = item.imageAlt || "Question diagram";
  img.loading = "lazy";
  wrap.appendChild(img);
  return wrap;
}

function renderStudyView(stage) {
  stage.innerHTML = "";
  const item = sessionItems[currentIndex];
  if (!item) return;

  const progEl = document.getElementById("mcq-toolbar-progress");
  if (progEl) progEl.textContent = `${currentIndex + 1} / ${sessionItems.length}`;

  const metaRow = document.createElement("div");
  metaRow.className = "mcq-meta-row";

  const badges = document.createElement("div");
  badges.className = "mcq-badges";

  const statusPill = document.createElement("span");
  statusPill.className = "topic-badge mcq-status-pill";
  if (item.seen === 0) {
    statusPill.textContent = "Fresh";
  } else {
    const pct = Math.round(getQuestionMastery(item.setId, item.item.id) * 100);
    statusPill.textContent = `Seen ${item.seen}× · ${pct}%`;
  }
  badges.appendChild(statusPill);

  if (timedOutItems.has(currentIndex) && answers[currentIndex] === undefined) {
    const lockPill = document.createElement("span");
    lockPill.className = "mcq-lock-pill";
    lockPill.textContent = "Time's up — answers locked";
    badges.appendChild(lockPill);
  }

  let correctCount = 0;
  let answeredCount = 0;
  for (const [idxStr, letter] of Object.entries(answers)) {
    answeredCount++;
    if (sessionItems[Number(idxStr)]?.answer === letter) correctCount++;
  }
  const scorePill = document.createElement("span");
  scorePill.className = "mcq-score-pill";
  scorePill.textContent = `${correctCount} / ${answeredCount}`;

  metaRow.append(badges, scorePill);
  stage.appendChild(metaRow);

  const qCard = document.createElement("div");
  qCard.className = "mcq-instant-card";

  const qText = document.createElement("div");
  qText.className = "mcq-question-text";
  qText.innerHTML = item.q;
  qCard.appendChild(qText);

  const media = renderQuestionMedia(item);
  if (media) qCard.appendChild(media);

  const studyGridClass = item.gridClass === "cols-4" ? "cols-2" : item.gridClass;
  const optsGrid = document.createElement("div");
  optsGrid.className = `mcq-options ${studyGridClass}`;

  const chosen = answers[currentIndex];
  const hasAnswered = chosen !== undefined;
  const isLocked = hasAnswered || timedOutItems.has(currentIndex);

  item.options.forEach((optText, i) => {
    const letter = LETTERS[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mcq-option-btn";

    if (isLocked) {
      btn.disabled = true;
      if (hasAnswered) {
        if (letter === item.answer) btn.classList.add("correct");
        else if (letter === chosen) btn.classList.add("wrong");
      }
    } else {
      btn.addEventListener("click", () => selectStudyOption(letter));
    }

    const keyEl = document.createElement("span");
    keyEl.className = "mcq-option-key";
    keyEl.textContent = letter;

    const textEl = document.createElement("span");
    textEl.className = "mcq-option-text";
    textEl.innerHTML = optText;

    btn.append(keyEl, textEl);
    optsGrid.appendChild(btn);
  });

  qCard.appendChild(optsGrid);
  stage.appendChild(qCard);

  const nav = document.createElement("div");
  nav.className = "mcq-nav-row";

  const btnPrev = document.createElement("button");
  btnPrev.type = "button";
  btnPrev.className = "btn";
  btnPrev.textContent = "← Previous";
  btnPrev.disabled = currentIndex === 0;
  btnPrev.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      startStudyItemTimer();
      renderStudyView(stage);
      updateTimerDisplay();
    }
  });

  const isLast = currentIndex === sessionItems.length - 1;
  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.className = "btn-generate-next";
  btnNext.textContent = isLast ? "Finish & View Summary →" : "Next →";
  btnNext.addEventListener("click", () => {
    if (!isLast) {
      currentIndex++;
      startStudyItemTimer();
      renderStudyView(stage);
      updateTimerDisplay();
    } else {
      finishSession();
    }
  });

  nav.append(btnPrev, btnNext);
  stage.appendChild(nav);
  typeset(stage);
}

function selectStudyOption(letter) {
  if (answers[currentIndex] !== undefined || timedOutItems.has(currentIndex)) return;
  stopTimer();
  answers[currentIndex] = letter;

  const item = sessionItems[currentIndex];
  const isCorrect = letter === item.answer;
  recordQuestionAttempt(item.setId, item.item.id, isCorrect);
  document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));

  const stage = document.getElementById("mcq-stage");
  if (stage) renderStudyView(stage);
}

function buildExamListDom(graded = false) {
  const list = document.createElement("div");
  list.className = "mcq-exam-list";

  sessionItems.forEach((item, idx) => {
    if (idx > 0) {
      const hr = document.createElement("hr");
      hr.className = "mcq-divider";
      list.appendChild(hr);
    }

    const row = document.createElement("div");
    row.className = "mcq-exam-item";
    row.dataset.index = String(idx);

    const qText = document.createElement("div");
    qText.className = "mcq-question-text";
    qText.innerHTML = item.q;
    row.appendChild(qText);

    const media = renderQuestionMedia(item);
    if (media) row.appendChild(media);

    const optsGrid = document.createElement("div");
    optsGrid.className = `mcq-options ${item.gridClass}`;

    const chosen = answers[idx];

    item.options.forEach((optText, optIdx) => {
      const letter = LETTERS[optIdx];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mcq-option-btn";

      if (graded) {
        btn.disabled = true;
        if (letter === item.answer) btn.classList.add("correct");
        else if (letter === chosen) btn.classList.add("wrong");
      } else if (timerLocked) {
        btn.disabled = true;
        if (letter === chosen) btn.classList.add("selected");
      } else {
        if (letter === chosen) btn.classList.add("selected");
        btn.addEventListener("click", () => {
          if (answers[idx] === letter) {
            delete answers[idx];
          } else {
            answers[idx] = letter;
          }
          const activeLetter = answers[idx];
          Array.from(optsGrid.children).forEach((el, k) => {
            el.classList.toggle("selected", LETTERS[k] === activeLetter);
          });
          const progEl = document.getElementById("mcq-toolbar-progress");
          if (progEl) {
            progEl.textContent = `${Object.keys(answers).length} / ${sessionItems.length} answered`;
          }
          if (unansweredPromptOpen) {
            unansweredPromptOpen = false;
            const promptEl = document.getElementById("mcq-unanswered-bar");
            if (promptEl) promptEl.remove();
          }
        });
      }

      const keyEl = document.createElement("span");
      keyEl.className = "mcq-option-key";
      keyEl.textContent = letter;

      const textEl = document.createElement("span");
      textEl.className = "mcq-option-text";
      textEl.innerHTML = optText;

      btn.append(keyEl, textEl);
      optsGrid.appendChild(btn);
    });

    row.appendChild(optsGrid);
    list.appendChild(row);
  });

  return list;
}

function renderExamView(stage) {
  stage.innerHTML = "";

  if (timerLocked) {
    const lockNote = document.createElement("div");
    lockNote.className = "mcq-lock-banner";
    lockNote.textContent = "Time's up — answers are locked. Click Check Answers when ready to submit.";
    stage.appendChild(lockNote);
  }

  stage.appendChild(buildExamListDom(false));

  const footer = document.createElement("div");
  footer.className = "mcq-exam-footer";

  if (unansweredPromptOpen) {
    footer.appendChild(buildUnansweredBar());
  }

  const actions = document.createElement("div");
  actions.className = "problem-footer-actions";

  const btnCheck = document.createElement("button");
  btnCheck.type = "button";
  btnCheck.className = "btn-generate-next";
  btnCheck.textContent = "Check Answers";
  btnCheck.addEventListener("click", () => {
    const firstMissing = sessionItems.findIndex((_, idx) => answers[idx] === undefined);
    if (firstMissing !== -1) {
      unansweredPromptOpen = true;
      renderExamView(stage);
      document.getElementById("mcq-unanswered-bar")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    submitExamSheet();
  });

  actions.appendChild(btnCheck);
  footer.appendChild(actions);
  stage.appendChild(footer);
  typeset(stage);
}

function buildUnansweredBar() {
  const missingCount = sessionItems.reduce((acc, _, idx) => acc + (answers[idx] === undefined ? 1 : 0), 0);
  const bar = document.createElement("div");
  bar.id = "mcq-unanswered-bar";
  bar.className = "mcq-unanswered-bar";

  const msg = document.createElement("span");
  msg.className = "mcq-unanswered-msg";
  msg.textContent = `You have ${missingCount} unanswered question${missingCount === 1 ? "" : "s"}.`;

  const btns = document.createElement("div");
  btns.className = "mcq-unanswered-actions";

  const btnScroll = document.createElement("button");
  btnScroll.type = "button";
  btnScroll.className = "btn";
  btnScroll.textContent = "Scroll to Unanswered";
  btnScroll.addEventListener("click", () => {
    const firstMissing = sessionItems.findIndex((_, idx) => answers[idx] === undefined);
    if (firstMissing === -1) return;
    const row = document.querySelector(`.mcq-exam-item[data-index="${firstMissing}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.remove("mcq-unanswered-flash");
      void row.offsetWidth;
      row.classList.add("mcq-unanswered-flash");
    }
  });

  const btnSkip = document.createElement("button");
  btnSkip.type = "button";
  btnSkip.className = "btn-generate-next";
  btnSkip.textContent = "Skip & Check Answers";
  btnSkip.addEventListener("click", submitExamSheet);

  btns.append(btnScroll, btnSkip);
  bar.append(msg, btns);
  return bar;
}

function submitExamSheet() {
  if (examSubmitted) return;
  examSubmitted = true;

  sessionItems.forEach((item, idx) => {
    if (answers[idx] === undefined) return; // unanswered = ignored for mastery
    const isCorrect = answers[idx] === item.answer;
    recordQuestionAttempt(item.setId, item.item.id, isCorrect);
  });
  document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));

  finishSession();
}

function finishSession() {
  stopTimer();
  elapsedSeconds = sessionStartMs > 0 ? Math.round((Date.now() - sessionStartMs) / 1000) : 0;
  phase = "summary";
  unansweredPromptOpen = false;
  renderMcqShell();
  document.getElementById("mcq-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderSummaryView(stage) {
  stage.innerHTML = "";

  let correct = 0;
  let answered = 0;
  const missed = [];

  sessionItems.forEach((item, idx) => {
    const chosen = answers[idx];
    if (chosen !== undefined) answered++;
    if (chosen === item.answer) correct++;
    else missed.push(item);
  });

  const total = sessionItems.length;
  const unanswered = total - answered;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalAvailable = getTotalAvailableQuestions();
  let nextCount = clampBatchSize(batchSize, totalAvailable);

  const card = document.createElement("div");
  card.className = "mcq-summary-card";

  const top = document.createElement("div");
  top.className = "mcq-summary-top";

  const title = document.createElement("h2");
  title.className = "mcq-summary-title";
  title.textContent = mcqMode === "study" ? "Study Session Complete" : "Exam Complete";

  const scoreLine = document.createElement("div");
  scoreLine.className = "mcq-exam-score";
  scoreLine.textContent = `Score: ${correct} / ${total} (${pct}%)`;

  const statsLine = document.createElement("div");
  statsLine.className = "mcq-summary-stats";
  const parts = [`Answered: ${answered}/${total}`];
  if (unanswered > 0) parts.push(`Skipped: ${unanswered}`);
  parts.push(`Time: ${formatClock(elapsedSeconds)}`);
  statsLine.textContent = parts.join(" · ");

  top.append(title, scoreLine, statsLine);
  card.appendChild(top);

  const batchRow = document.createElement("div");
  batchRow.className = "mcq-summary-batch";

  const batchLabel = document.createElement("span");
  batchLabel.className = "mcq-setup-label";
  batchLabel.textContent = "Next Batch Size";

  const picker = createCountPicker(totalAvailable, nextCount, val => {
    nextCount = val;
    batchSize = val;
  });

  batchRow.append(batchLabel, picker);
  card.appendChild(batchRow);

  const actions = document.createElement("div");
  actions.className = "mcq-exam-banner-actions";

  if (missed.length > 0) {
    const btnRetry = document.createElement("button");
    btnRetry.type = "button";
    btnRetry.className = "btn";
    btnRetry.textContent = `Retry Missed (${missed.length})`;
    btnRetry.addEventListener("click", () => {
      const rebuilt = buildSessionItems(missed);
      startNewMcqBatch(rebuilt);
    });
    actions.appendChild(btnRetry);
  }

  const btnBack = document.createElement("button");
  btnBack.type = "button";
  btnBack.className = "btn";
  btnBack.textContent = "Back to Setup";
  btnBack.addEventListener("click", returnToSetup);
  actions.appendChild(btnBack);

  const btnFresh = document.createElement("button");
  btnFresh.type = "button";
  btnFresh.className = "btn-generate-next";
  btnFresh.textContent = "New Batch";
  btnFresh.addEventListener("click", () => {
    batchSize = nextCount;
    startNewMcqBatch();
  });
  actions.appendChild(btnFresh);

  card.appendChild(actions);
  stage.appendChild(card);

  if (mcqMode === "exam") {
    stage.appendChild(buildExamListDom(true));
    typeset(stage);
  }
}

function handleKeyDown(e) {
  const view = document.getElementById("view-mcq");
  if (!view || !view.classList.contains("active") || phase !== "active" || mcqMode !== "study") return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

  const k = e.key.toUpperCase();
  const stage = document.getElementById("mcq-stage");
  if (!stage) return;

  if (LETTERS.includes(k)) {
    const item = sessionItems[currentIndex];
    const idx = LETTERS.indexOf(k);
    if (item && idx < item.options.length) selectStudyOption(k);
  } else if (["1", "2", "3", "4"].includes(k)) {
    const letter = LETTERS[Number(k) - 1];
    const item = sessionItems[currentIndex];
    if (item && Number(k) <= item.options.length) selectStudyOption(letter);
  } else if (e.key === "ArrowRight") {
    if (currentIndex < sessionItems.length - 1) {
      currentIndex++;
      startStudyItemTimer();
      renderStudyView(stage);
      updateTimerDisplay();
    }
  } else if (e.key === "ArrowLeft") {
    if (currentIndex > 0) {
      currentIndex--;
      startStudyItemTimer();
      renderStudyView(stage);
      updateTimerDisplay();
    }
  }
}
