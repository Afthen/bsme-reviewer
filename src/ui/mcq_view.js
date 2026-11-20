/**
 * src/ui/mcq_view.js
 * Multiple-Choice Quiz View:
 * - Instant Check mode: focused 1-question-at-a-time with keyboard shortcuts
 * - Exam Sheet mode: scrollable page with '---' dividers, no numbers, adaptive 1x4/2x2/4x1 grid, in-place grading
 */

import {
  selectBatch,
  buildSessionItems,
  recordQuestionAttempt,
  getQuestionMastery
} from "../mcq/engine.js";
import { MASTERY_CHANGED_EVENT } from "./sidebar_view.js";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const BATCH_OPTIONS = [10, 25, 50, 0]; // 0 = All

let activeSets = [];
let sessionItems = [];
let mcqMode = "instant"; // "instant" | "exam"
let batchSize = 25;
let currentIndex = 0;
let answers = {}; // idx -> letter
let examSubmitted = false;
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

export function renderMcqSets(sets = []) {
  activeSets = sets;
  const view = document.getElementById("view-mcq");
  if (!view) return;

  if (!keyHandlerBound) {
    document.addEventListener("keydown", handleKeyDown);
    keyHandlerBound = true;
  }

  startNewMcqBatch();
}

export function startNewMcqBatch(customItems = null) {
  const view = document.getElementById("view-mcq");
  if (!view) return;

  if (Array.isArray(customItems)) {
    sessionItems = customItems;
  } else {
    const packed = selectBatch(activeSets, batchSize);
    sessionItems = buildSessionItems(packed);
  }

  currentIndex = 0;
  answers = {};
  examSubmitted = false;
  renderMcqShell();
}

function setMcqMode(mode) {
  if (mcqMode === mode) return;
  mcqMode = mode;
  examSubmitted = false;
  answers = {};
  currentIndex = 0;
  renderMcqShell();
}

function renderMcqShell() {
  const view = document.getElementById("view-mcq");
  if (!view) return;
  view.innerHTML = "";

  if (activeSets.length === 0 || sessionItems.length === 0) {
    return;
  }

  const container = document.createElement("div");
  container.className = "article-container mcq-container";

  const bar = document.createElement("div");
  bar.className = "mcq-toolbar";

  const modeSeg = document.createElement("div");
  modeSeg.className = "mcq-segmented";

  const btnInstant = document.createElement("button");
  btnInstant.type = "button";
  btnInstant.className = `mcq-seg-btn ${mcqMode === "instant" ? "active" : ""}`;
  btnInstant.textContent = "Instant Check";
  btnInstant.addEventListener("click", () => setMcqMode("instant"));

  const btnExam = document.createElement("button");
  btnExam.type = "button";
  btnExam.className = `mcq-seg-btn ${mcqMode === "exam" ? "active" : ""}`;
  btnExam.textContent = "Exam Sheet";
  btnExam.addEventListener("click", () => setMcqMode("exam"));

  modeSeg.append(btnInstant, btnExam);

  const rightControls = document.createElement("div");
  rightControls.className = "mcq-toolbar-right";

  const batchWrap = document.createElement("div");
  batchWrap.className = "mcq-batch-pills";
  BATCH_OPTIONS.forEach(opt => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `menu-mini-btn ${batchSize === opt ? "active" : ""}`;
    btn.textContent = opt === 0 ? "All" : `${opt}`;
    btn.title = opt === 0 ? "All questions" : `${opt} questions`;
    btn.addEventListener("click", () => {
      batchSize = opt;
      startNewMcqBatch();
    });
    batchWrap.appendChild(btn);
  });

  const btnNew = document.createElement("button");
  btnNew.type = "button";
  btnNew.className = "btn";
  btnNew.textContent = "⚡ New Batch";
  btnNew.addEventListener("click", () => startNewMcqBatch());

  rightControls.append(batchWrap, btnNew);
  bar.append(modeSeg, rightControls);
  container.appendChild(bar);

  const stage = document.createElement("div");
  stage.id = "mcq-stage";
  container.appendChild(stage);

  view.appendChild(container);

  if (mcqMode === "instant") {
    renderInstantView(stage);
  } else {
    renderExamSheetView(stage);
  }
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

function renderInstantView(stage) {
  stage.innerHTML = "";
  const item = sessionItems[currentIndex];
  if (!item) return;

  const metaRow = document.createElement("div");
  metaRow.className = "mcq-meta-row";

  const progress = document.createElement("span");
  progress.className = "mcq-progress-label";
  progress.textContent = `${currentIndex + 1} / ${sessionItems.length}`;

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

  let correctCount = 0;
  let answeredCount = 0;
  for (const [idxStr, letter] of Object.entries(answers)) {
    answeredCount++;
    if (sessionItems[Number(idxStr)]?.answer === letter) correctCount++;
  }
  const scorePill = document.createElement("span");
  scorePill.className = "mcq-score-pill";
  scorePill.textContent = `${correctCount} / ${answeredCount}`;

  badges.append(statusPill, scorePill);
  metaRow.append(progress, badges);
  stage.appendChild(metaRow);

  const qCard = document.createElement("div");
  qCard.className = "mcq-instant-card";

  const qText = document.createElement("div");
  qText.className = "mcq-question-text";
  qText.innerHTML = item.q;
  qCard.appendChild(qText);

  const media = renderQuestionMedia(item);
  if (media) qCard.appendChild(media);

  const optsGrid = document.createElement("div");
  optsGrid.className = `mcq-options ${item.gridClass}`;

  const chosen = answers[currentIndex];
  const hasAnswered = chosen !== undefined;

  item.options.forEach((optText, i) => {
    const letter = LETTERS[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mcq-option-btn";

    if (hasAnswered) {
      btn.disabled = true;
      if (letter === item.answer) btn.classList.add("correct");
      else if (letter === chosen) btn.classList.add("wrong");
    } else {
      btn.addEventListener("click", () => selectInstantOption(letter));
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
      renderInstantView(stage);
    }
  });

  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.className = "btn-generate-next";
  btnNext.textContent = currentIndex === sessionItems.length - 1 ? "⚡ New Batch" : "Next →";
  btnNext.addEventListener("click", () => {
    if (currentIndex < sessionItems.length - 1) {
      currentIndex++;
      renderInstantView(stage);
    } else {
      startNewMcqBatch();
    }
  });

  nav.append(btnPrev, btnNext);
  stage.appendChild(nav);
  typeset(stage);
}

function selectInstantOption(letter) {
  if (answers[currentIndex] !== undefined) return;
  answers[currentIndex] = letter;

  const item = sessionItems[currentIndex];
  const isCorrect = letter === item.answer;
  recordQuestionAttempt(item.setId, item.item.id, isCorrect);
  document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));

  const stage = document.getElementById("mcq-stage");
  if (stage) renderInstantView(stage);
}

function renderExamSheetView(stage) {
  stage.innerHTML = "";

  if (examSubmitted) {
    let correct = 0;
    const missed = [];
    sessionItems.forEach((item, idx) => {
      if (answers[idx] === item.answer) correct++;
      else missed.push(item);
    });

    const pct = sessionItems.length > 0 ? Math.round((correct / sessionItems.length) * 100) : 0;
    const banner = document.createElement("div");
    banner.className = "mcq-exam-banner";

    const scoreText = document.createElement("div");
    scoreText.className = "mcq-exam-score";
    scoreText.textContent = `Score: ${correct} / ${sessionItems.length} (${pct}%)`;

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

    const btnFresh = document.createElement("button");
    btnFresh.type = "button";
    btnFresh.className = "btn-generate-next";
    btnFresh.textContent = "⚡ New Exam";
    btnFresh.addEventListener("click", () => startNewMcqBatch());
    actions.appendChild(btnFresh);

    banner.append(scoreText, actions);
    stage.appendChild(banner);
  }

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

      if (examSubmitted) {
        btn.disabled = true;
        if (letter === item.answer) btn.classList.add("correct");
        else if (letter === chosen) btn.classList.add("wrong");
      } else {
        if (letter === chosen) btn.classList.add("selected");
        btn.addEventListener("click", () => {
          answers[idx] = letter;
          Array.from(optsGrid.children).forEach((el, k) => {
            el.classList.toggle("selected", LETTERS[k] === letter);
          });
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

  stage.appendChild(list);

  if (!examSubmitted) {
    const footer = document.createElement("div");
    footer.className = "problem-footer-actions";
    const btnCheck = document.createElement("button");
    btnCheck.type = "button";
    btnCheck.className = "btn-generate-next";
    btnCheck.textContent = "Check Answers";
    btnCheck.addEventListener("click", submitExamSheet);
    footer.appendChild(btnCheck);
    stage.appendChild(footer);
  }

  typeset(stage);
}

function submitExamSheet() {
  if (examSubmitted) return;
  examSubmitted = true;

  sessionItems.forEach((item, idx) => {
    const isCorrect = answers[idx] === item.answer;
    recordQuestionAttempt(item.setId, item.item.id, isCorrect);
  });
  document.dispatchEvent(new CustomEvent(MASTERY_CHANGED_EVENT));

  const stage = document.getElementById("mcq-stage");
  if (stage) {
    renderExamSheetView(stage);
    stage.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleKeyDown(e) {
  const view = document.getElementById("view-mcq");
  if (!view || !view.classList.contains("active") || mcqMode !== "instant") return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

  const k = e.key.toUpperCase();
  const stage = document.getElementById("mcq-stage");
  if (!stage) return;

  if (LETTERS.includes(k)) {
    const item = sessionItems[currentIndex];
    const idx = LETTERS.indexOf(k);
    if (item && idx < item.options.length) selectInstantOption(k);
  } else if (["1", "2", "3", "4"].includes(k)) {
    const letter = LETTERS[Number(k) - 1];
    const item = sessionItems[currentIndex];
    if (item && Number(k) <= item.options.length) selectInstantOption(letter);
  } else if (e.key === "ArrowRight") {
    if (currentIndex < sessionItems.length - 1) {
      currentIndex++;
      renderInstantView(stage);
    }
  } else if (e.key === "ArrowLeft") {
    if (currentIndex > 0) {
      currentIndex--;
      renderInstantView(stage);
    }
  }
}
