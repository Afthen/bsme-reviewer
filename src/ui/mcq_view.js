/**
 * src/ui/mcq_view.js
 * Multiple-Choice Quiz View:
 * - Setup Lobby: infinite-step pill rows (pooled in Study, per-set in Exam), calculator-style timer (0 = off)
 * - Study Mode: 1-question-at-a-time, 2x2 or 1x4 layout, per-item timer, pause, keyboard shortcuts
 * - Exam Mode: scrollable borderless-option sheet, click-to-unselect, unanswered guard, total timer, pause
 * - Summary View: score, time, Retry Missed, New Batch with pill picker, graded review
 */

import {
  selectBatch,
  buildSessionItems,
  recordQuestionAttempt,
  getQuestionMastery,
  getSetStats,
  getSetMastery,
  shuffleArray
} from "../mcq/engine.js";
import { MASTERY_CHANGED_EVENT } from "./sidebar_view.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const DECADE_1_MULTS = [1, 1.5, 2, 2.5, 5, 7.5];
const DECADE_N_MULTS = [1, 1.25, 1.5, 2, 2.5, 5, 7.5];

let activeSets = [];
let sessionItems = [];
let phase = "setup"; // "setup" | "active" | "summary"
let mcqMode = "study"; // "study" | "exam"

// Batch counts
let studyBatchSize = 25;
let setCounts = {}; // setId -> number (for Exam Mode)

// Timer config (0 = disabled)
let studyTimerSeconds = 0;
let examTimerSeconds = 0;

// Active session timer state
let remainingSeconds = 0;
let timerLocked = false;
let isPaused = false;
let timerId = null;
let sessionStartMs = 0;
let elapsedSeconds = 0;

let currentIndex = 0;
let answers = {}; // idx -> letter
let timedOutItems = new Set();
let examSubmitted = false;
let unansweredPromptOpen = false;
let keyHandlerBound = false;
let lastActiveSetId = null;

export function getCurrentMcqSetId() {
  if (phase === "active" && sessionItems[currentIndex]?.setId) {
    return sessionItems[currentIndex].setId;
  }
  if (lastActiveSetId) {
    return lastActiveSetId;
  }
  return activeSets[0]?.id || null;
}

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

function getSetMax(setObj) {
  return setObj?.questions?.length || 0;
}

function getTotalAvailableQuestions() {
  return activeSets.reduce((sum, s) => sum + getSetMax(s), 0);
}

/**
 * Generates infinite clean step counts < max, plus max ("All"):
 * 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750, 1000, ...
 */
function getBatchSteps(max) {
  if (max <= 0) return [];
  const steps = [];
  if (5 < max) steps.push(5);

  let power = 10;
  let decade = 1;
  while (power < max) {
    const mults = decade === 1 ? DECADE_1_MULTS : DECADE_N_MULTS;
    for (const m of mults) {
      const val = Math.round(m * power);
      if (val < max && !steps.includes(val)) {
        steps.push(val);
      }
    }
    power *= 10;
    decade++;
  }
  steps.push(max);
  return steps;
}

function snapToStep(val, max) {
  const steps = getBatchSteps(max);
  if (steps.length === 0) return 0;
  if (steps.includes(val)) return val;
  let best = steps[0];
  let bestDist = Math.abs(val - best);
  for (const s of steps) {
    const d = Math.abs(val - s);
    if (d < bestDist) {
      best = s;
      bestDist = d;
    }
  }
  return best;
}

function syncBatchCounts() {
  const totalAvail = getTotalAvailableQuestions();
  if (totalAvail > 0) {
    const target = studyBatchSize > 0 ? Math.min(studyBatchSize, totalAvail) : Math.min(25, totalAvail);
    studyBatchSize = snapToStep(target, totalAvail);
  } else {
    studyBatchSize = 0;
  }

  const next = {};
  for (const s of activeSets) {
    const max = getSetMax(s);
    if (max <= 0) {
      next[s.id] = 0;
      continue;
    }
    const prev = setCounts[s.id];
    const target = prev !== undefined ? Math.min(prev, max) : Math.min(25, max);
    next[s.id] = snapToStep(target, max);
  }
  setCounts = next;
}

function getSelectedQuestionCount() {
  if (mcqMode === "study") return studyBatchSize;
  return activeSets.reduce((sum, s) => sum + (setCounts[s.id] || 0), 0);
}

function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  const pad = n => String(n).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(rem)}` : `${pad(mins)}:${pad(rem)}`;
}

function secondsToDigitBuffer(sec, mode) {
  const s = Math.max(0, Math.floor(sec));
  const pad = n => String(n).padStart(2, "0");
  if (mode === "study") {
    const mins = Math.min(99, Math.floor(s / 60));
    const rem = s % 60;
    return `${pad(mins)}${pad(rem)}`;
  }
  const hrs = Math.min(99, Math.floor(s / 3600));
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return `${pad(hrs)}${pad(mins)}${pad(rem)}`;
}

function formatDigitBuffer(buf, mode) {
  if (mode === "study") {
    return `${buf.slice(0, 2)}:${buf.slice(2, 4)}`;
  }
  return `${buf.slice(0, 2)}:${buf.slice(2, 4)}:${buf.slice(4, 6)}`;
}

function digitBufferToSeconds(buf, mode) {
  if (mode === "study") {
    const mins = parseInt(buf.slice(0, 2), 10) || 0;
    const secs = parseInt(buf.slice(2, 4), 10) || 0;
    return mins * 60 + secs;
  }
  const hrs = parseInt(buf.slice(0, 2), 10) || 0;
  const mins = parseInt(buf.slice(2, 4), 10) || 0;
  const secs = parseInt(buf.slice(4, 6), 10) || 0;
  return hrs * 3600 + mins * 60 + secs;
}

function formatTimeTrimmed(sec) {
  const s = Math.max(0, Math.floor(sec));
  if (s === 0) return "0";
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  const pad = n => String(n).padStart(2, "0");
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(rem)}`;
  if (mins > 0) return `${mins}:${pad(rem)}`;
  return `0:${pad(rem)}`;
}

function isTimerEnabled() {
  return (mcqMode === "study" ? studyTimerSeconds : examTimerSeconds) > 0;
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function runTimerInterval(onExpire) {
  stopTimer();
  if (remainingSeconds <= 0) {
    timerLocked = true;
    updateTimerDisplay();
    onExpire();
    return;
  }

  timerId = setInterval(() => {
    const view = document.getElementById("view-mcq");
    if (!view || !view.classList.contains("active") || phase !== "active") {
      stopTimer();
      return;
    }
    if (isPaused) return;

    remainingSeconds = Math.max(0, remainingSeconds - 1);
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      stopTimer();
      timerLocked = true;
      updateTimerDisplay();
      onExpire();
    }
  }, 1000);
}

function startCountdown(seconds, onExpire) {
  stopTimer();
  remainingSeconds = Math.max(1, Math.floor(seconds));
  timerLocked = false;
  runTimerInterval(onExpire);
}

function updateTimerDisplay() {
  const el = document.getElementById("mcq-timer-pill");
  if (!el) return;
  el.textContent = formatClock(remainingSeconds);
  el.classList.toggle("is-low", !timerLocked && remainingSeconds > 0 && remainingSeconds <= 10);
  el.classList.toggle("is-locked", timerLocked);
}

function togglePause() {
  if (phase !== "active") return;
  isPaused = !isPaused;
  const stage = document.getElementById("mcq-stage");
  const btnPause = document.getElementById("mcq-pause-btn");
  if (btnPause) {
    btnPause.textContent = isPaused ? "▶ Resume" : "⏸ Pause";
    btnPause.classList.toggle("active", isPaused);
  }
  if (stage) {
    stage.classList.toggle("is-paused", isPaused);
  }
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
  syncBatchCounts();
  phase = "setup";
  sessionItems = [];
  answers = {};
  timedOutItems = new Set();
  examSubmitted = false;
  timerLocked = false;
  isPaused = false;
  unansweredPromptOpen = false;
  renderMcqShell();
}

export function startNewMcqBatch(customItems = null) {
  const view = document.getElementById("view-mcq");
  if (!view) return;

  stopTimer();

  if (Array.isArray(customItems)) {
    sessionItems = customItems;
  } else {
    syncBatchCounts();
    let packed = [];
    if (mcqMode === "study") {
      packed = selectBatch(activeSets, studyBatchSize);
    } else {
      for (const s of activeSets) {
        const count = setCounts[s.id] || 0;
        if (count > 0) {
          packed.push(...selectBatch([s], count));
        }
      }
    }
    sessionItems = buildSessionItems(activeSets.length > 1 ? shuffleArray(packed) : packed);
  }

  phase = "active";
  currentIndex = 0;
  answers = {};
  timedOutItems = new Set();
  examSubmitted = false;
  timerLocked = false;
  isPaused = false;
  unansweredPromptOpen = false;
  sessionStartMs = Date.now();
  elapsedSeconds = 0;

  if (isTimerEnabled() && sessionItems.length > 0) {
    if (mcqMode === "study") {
      startStudyItemTimer();
    } else {
      startCountdown(examTimerSeconds, handleExamTimerExpire);
    }
  }

  renderMcqShell();
}

function handleStudyTimerExpire() {
  timedOutItems.add(currentIndex);
  const stage = document.getElementById("mcq-stage");
  if (stage && phase === "active" && mcqMode === "study") {
    renderStudyView(stage);
  }
}

function startStudyItemTimer() {
  if (!isTimerEnabled()) {
    stopTimer();
    timerLocked = false;
    return;
  }
  if (answers[currentIndex] !== undefined || timedOutItems.has(currentIndex)) {
    stopTimer();
    timerLocked = timedOutItems.has(currentIndex) && answers[currentIndex] === undefined;
    if (timerLocked) remainingSeconds = 0;
    return;
  }
  startCountdown(studyTimerSeconds, handleStudyTimerExpire);
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
  isPaused = false;
  unansweredPromptOpen = false;
  renderMcqShell();
}

function buildPillGroup(max, currentVal, onSelect) {
  const group = document.createElement("div");
  group.className = "mcq-pill-group";
  const steps = getBatchSteps(max);

  steps.forEach(step => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `mcq-count-pill ${currentVal === step ? "active" : ""}`;
    btn.textContent = step === max ? "All" : String(step);
    btn.addEventListener("click", () => {
      Array.from(group.children).forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      onSelect(step);
    });
    group.appendChild(btn);
  });

  return group;
}

function buildBatchCountSection(onAnyChange) {
  const wrap = document.createElement("div");
  wrap.className = "mcq-pill-rows";

  if (mcqMode === "study") {
    const totalAvail = getTotalAvailableQuestions();
    const row = document.createElement("div");
    row.className = "mcq-set-pill-row";

    const label = document.createElement("span");
    label.className = "mcq-set-row-name";
    label.textContent = activeSets.length === 1 ? activeSets[0].title : "All Selected Sets";

    const group = buildPillGroup(totalAvail, studyBatchSize, val => {
      studyBatchSize = val;
      onAnyChange();
    });

    row.append(label, group);
    wrap.appendChild(row);
    return wrap;
  }

  // Exam Mode: per-set aligned pill rows
  activeSets.forEach(s => {
    const max = getSetMax(s);
    const row = document.createElement("div");
    row.className = "mcq-set-pill-row";

    const nameEl = document.createElement("span");
    nameEl.className = "mcq-set-row-name";
    nameEl.textContent = s.title;
    nameEl.title = s.title;

    const group = buildPillGroup(max, setCounts[s.id], val => {
      setCounts[s.id] = val;
      onAnyChange();
    });

    row.append(nameEl, group);
    wrap.appendChild(row);
  });

  return wrap;
}

function createTimerInputBlock(mode) {
  const wrap = document.createElement("div");
  wrap.className = "mcq-timer-field-wrap";

  const getSec = () => (mode === "study" ? studyTimerSeconds : examTimerSeconds);
  const setSec = v => {
    const clamped = Math.max(0, Math.min(mode === "study" ? 5999 : 359999, v));
    if (mode === "study") studyTimerSeconds = clamped;
    else examTimerSeconds = clamped;
  };

  let digitBuf = secondsToDigitBuffer(getSec(), mode);
  let isFocused = false;

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.className = `mcq-timer-input ${getSec() === 0 ? "is-off" : ""}`;
  input.value = formatTimeTrimmed(getSec());
  input.setAttribute("aria-label", mode === "study" ? "Timer per question" : "Total exam timer");

  const sub = document.createElement("span");
  sub.className = "mcq-timer-sublabel";
  sub.textContent = mode === "study" ? "per question" : "total";

  input.addEventListener("focus", () => {
    isFocused = true;
    digitBuf = secondsToDigitBuffer(getSec(), mode);
    input.classList.remove("is-off");
    input.value = formatDigitBuffer(digitBuf, mode);
    queueMicrotask(() => {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    });
  });

  input.addEventListener("keydown", e => {
    if (!isFocused) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      digitBuf = digitBuf.slice(1) + e.key;
      input.value = formatDigitBuffer(digitBuf, mode);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      digitBuf = "0" + digitBuf.slice(0, -1);
      input.value = formatDigitBuffer(digitBuf, mode);
    } else if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      input.blur();
    } else if (e.key !== "Tab") {
      e.preventDefault();
    }
  });

  input.addEventListener("blur", () => {
    isFocused = false;
    const totalSec = digitBufferToSeconds(digitBuf, mode);
    setSec(totalSec);
    const saved = getSec();
    input.value = formatTimeTrimmed(saved);
    input.classList.toggle("is-off", saved === 0);
  });

  wrap.append(input, sub);
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
  if (phase === "active" && isPaused) {
    stage.classList.add("is-paused");
  }
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

  if (isTimerEnabled()) {
    const timerEl = document.createElement("span");
    timerEl.id = "mcq-timer-pill";
    timerEl.className = "mcq-timer-pill";
    right.appendChild(timerEl);
  }

  const btnPause = document.createElement("button");
  btnPause.id = "mcq-pause-btn";
  btnPause.type = "button";
  btnPause.className = `btn ${isPaused ? "active" : ""}`;
  btnPause.textContent = isPaused ? "▶ Resume" : "⏸ Pause";
  btnPause.addEventListener("click", togglePause);

  const btnQuit = document.createElement("button");
  btnQuit.type = "button";
  btnQuit.className = "btn";
  btnQuit.textContent = "Quit";
  btnQuit.addEventListener("click", returnToSetup);

  right.append(btnPause, btnQuit);
  bar.append(left, right);

  queueMicrotask(updateTimerDisplay);
  return bar;
}

function renderSetupView(stage) {
  stage.innerHTML = "";

  const totalAvail = getTotalAvailableQuestions();
  let totalSeen = 0;
  let weightedMastery = 0;
  for (const s of activeSets) {
    const stats = getSetStats(s);
    totalSeen += stats.seen;
    weightedMastery += getSetMastery(s) * getSetMax(s);
  }
  const avgMasteryPct = totalAvail > 0 ? Math.round((weightedMastery / totalAvail) * 100) : 0;
  const unseen = Math.max(0, totalAvail - totalSeen);

  const card = document.createElement("div");
  card.className = "mcq-setup-card";

  const header = document.createElement("div");
  header.className = "mcq-setup-header";

  const title = document.createElement("h2");
  title.className = "mcq-setup-title";
  title.textContent = "Quiz Setup";

  const sub = document.createElement("p");
  sub.className = "mcq-setup-subtitle";
  sub.textContent = `${activeSets.length} set${activeSets.length === 1 ? "" : "s"} selected · ${totalAvail} questions (${unseen} unseen · ${avgMasteryPct}% mastery)`;

  header.append(title, sub);
  card.appendChild(header);

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

  const countHeader = document.createElement("div");
  countHeader.className = "mcq-setup-section-head";

  const countLabel = document.createElement("span");
  countLabel.className = "mcq-setup-label";
  countLabel.textContent = mcqMode === "study" ? "Questions" : "Questions per Set";

  const totalBadge = document.createElement("span");
  totalBadge.className = "mcq-count-total-badge";
  totalBadge.textContent = `Total: ${getSelectedQuestionCount()}`;

  countHeader.append(countLabel, totalBadge);
  countSection.appendChild(countHeader);
  countSection.appendChild(buildBatchCountSection(() => {
    totalBadge.textContent = `Total: ${getSelectedQuestionCount()}`;
  }));
  card.appendChild(countSection);

  const bottomRow = document.createElement("div");
  bottomRow.className = "mcq-setup-bottom";

  const timerWrap = document.createElement("div");
  timerWrap.className = "mcq-setup-timer-group";
  timerWrap.appendChild(createTimerInputBlock(mcqMode));

  const btnStart = document.createElement("button");
  btnStart.type = "button";
  btnStart.className = "btn-generate-next";
  btnStart.disabled = getSelectedQuestionCount() === 0;
  btnStart.textContent = mcqMode === "study" ? "Start Study Session" : "Start Exam";
  btnStart.addEventListener("click", () => startNewMcqBatch());

  bottomRow.append(timerWrap, btnStart);
  card.appendChild(bottomRow);
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
  qCard.className = "mcq-instant-card mcq-pausable";

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
  const isTimedOut = timedOutItems.has(currentIndex) && !hasAnswered;
  const isLocked = hasAnswered || isTimedOut;

  if (isTimedOut) {
    optsGrid.classList.add("is-timed-out");
  }

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
    if (currentIndex > 0 && !isPaused) {
      currentIndex--;
      lastActiveSetId = sessionItems[currentIndex]?.setId || lastActiveSetId;
      startStudyItemTimer();
      renderStudyView(stage);
      updateTimerDisplay();
      document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));
    }
  });

  const isLast = currentIndex === sessionItems.length - 1;
  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.className = "btn-generate-next";
  btnNext.textContent = isLast ? "Finish & View Summary →" : "Next →";
  btnNext.addEventListener("click", () => {
    if (isPaused) return;
    if (!isLast) {
      currentIndex++;
      lastActiveSetId = sessionItems[currentIndex]?.setId || lastActiveSetId;
      startStudyItemTimer();
      renderStudyView(stage);
      updateTimerDisplay();
      document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));
    } else {
      finishSession();
    }
  });

  nav.append(btnPrev, btnNext);
  stage.appendChild(nav);
  typeset(stage);
}

function selectStudyOption(letter) {
  if (isPaused || answers[currentIndex] !== undefined || timedOutItems.has(currentIndex)) return;
  stopTimer();
  answers[currentIndex] = letter;

  const item = sessionItems[currentIndex];
  lastActiveSetId = item.setId || lastActiveSetId;
  const isCorrect = letter === item.answer;
  recordQuestionAttempt(item.setId, item.item.id, isCorrect);
  document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));

  const stage = document.getElementById("mcq-stage");
  if (stage) renderStudyView(stage);
}

function buildExamListDom(graded = false) {
  const list = document.createElement("div");
  list.className = "mcq-exam-list mcq-pausable";

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
    if (!graded && timerLocked) {
      optsGrid.classList.add("is-timed-out");
    }

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
          if (isPaused) return;
          if (answers[idx] === letter) {
            delete answers[idx];
          } else {
            answers[idx] = letter;
            lastActiveSetId = item.setId || lastActiveSetId;
            document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));
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
    if (isPaused) return;
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
  isPaused = false;
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

  const batchWrap = document.createElement("div");
  batchWrap.className = "mcq-summary-batch";

  const batchHeader = document.createElement("div");
  batchHeader.className = "mcq-setup-section-head";

  const batchLabel = document.createElement("span");
  batchLabel.className = "mcq-setup-label";
  batchLabel.textContent = "Next Batch Questions";

  const totalBadge = document.createElement("span");
  totalBadge.className = "mcq-count-total-badge";
  totalBadge.textContent = `Total: ${getSelectedQuestionCount()}`;

  batchHeader.append(batchLabel, totalBadge);
  batchWrap.appendChild(batchHeader);
  batchWrap.appendChild(buildBatchCountSection(() => {
    totalBadge.textContent = `Total: ${getSelectedQuestionCount()}`;
  }));
  card.appendChild(batchWrap);

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
  btnFresh.addEventListener("click", () => startNewMcqBatch());
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
  if (isPaused) return;
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
