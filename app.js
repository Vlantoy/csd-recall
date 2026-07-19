"use strict";

let subjects = [];

const storageKey = "csd-recall-progress-v1";
const reviewIntervals = [
  10 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
];
const maxMasteryScore = reviewIntervals.length - 1;
const answerOptions = ["A", "B", "C", "D", "E"];

let state = {
  subjectId: "",
  mode: "learn",
  currentIndex: 0,
  selectedAnswers: [],
  answerChecked: false,
  progress: loadProgress(),
};

const els = {
  subjectList: document.getElementById("subjectList"),
  queueList: document.getElementById("queueList"),
  headerSummary: document.getElementById("headerSummary"),
  overallProgress: document.getElementById("overallProgress"),
  courseEyebrow: document.getElementById("courseEyebrow"),
  studyTitle: document.getElementById("studyTitle"),
  cardPosition: document.getElementById("cardPosition"),
  statusBadge: document.getElementById("statusBadge"),
  sessionFill: document.getElementById("sessionFill"),
  frameLoading: document.getElementById("frameLoading"),
  slideCanvas: document.getElementById("slideCanvas"),
  cardFront: document.getElementById("cardFront"),
  studyHeatmap: document.getElementById("studyHeatmap"),
  answerChoices: document.getElementById("answerChoices"),
  answerFeedback: document.getElementById("answerFeedback"),
  answerCheck: document.getElementById("answerCheck"),
  answerExplanation: document.getElementById("answerExplanation"),
  slideSurface: document.getElementById("slideSurface"),
  prevCard: document.getElementById("prevCard"),
  nextCard: document.getElementById("nextCard"),
  resetProgress: document.getElementById("resetProgress"),
  slideSearch: document.getElementById("slideSearch"),
  queueSummary: document.getElementById("queueSummary"),
};

void init();

async function init() {
  bindEvents();
  await loadManifest();
  state.subjectId = subjects[0].id;
  state.currentIndex = pickInitialIndex();
  renderAll();
}

async function loadManifest() {
  const response = await fetch("data/slides.json");
  if (!response.ok) throw new Error("Cannot load slide data");
  const data = await response.json();
  subjects = data.subjects;
}

function bindEvents() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode || "review";
      state.currentIndex = pickInitialIndex();
      resetCardInteraction();
      renderAll();
    });
  });

  els.prevCard.addEventListener("click", () => moveCard(-1));
  els.nextCard.addEventListener("click", () => moveCard(1));
  els.answerChoices.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest(".answer-choice") : null;
    if (!button) return;
    handleAnswerChoice(button.dataset.answer || "");
  });
  els.answerCheck.addEventListener("click", checkAnswerSelection);

  els.resetProgress.addEventListener("click", () => {
    state.progress = {};
    saveProgress();
    state.currentIndex = 0;
    resetCardInteraction();
    renderAll();
  });

  els.slideSearch.addEventListener("change", () => {
    const parsed = Number.parseInt(els.slideSearch.value, 10);
    if (!Number.isFinite(parsed)) return;
    const subject = getSubject();
    state.currentIndex = clamp(parsed - 1, 0, getSlideCount(subject) - 1);
    state.mode = "browse";
    resetCardInteraction();
    renderAll();
  });

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.target instanceof HTMLButtonElement) return;
    if (event.key === "ArrowRight") moveCard(1);
    if (event.key === "ArrowLeft") moveCard(-1);
    if (/^[a-e]$/i.test(event.key)) handleAnswerChoice(event.key.toUpperCase());
    if (event.key === "Enter") checkAnswerSelection();
  });
}

function renderAll() {
  renderModeTabs();
  renderSubjects();
  renderStudyCard();
  renderQueue();
  renderStats();
}

function renderModeTabs() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
    button.setAttribute("aria-selected", String(button.dataset.mode === state.mode));
  });
}

function renderSubjects() {
  els.subjectList.innerHTML = subjects.map((subject) => {
    const stats = getSubjectStats(subject);
    const correctPercent = Math.round((stats.correct / stats.total) * 100);
    const wrongPercent = Math.round((stats.wrong / stats.total) * 100);
    const active = subject.id === state.subjectId ? " is-active" : "";
    return `
      <button class="subject-button${active}" type="button" data-subject="${subject.id}" aria-pressed="${subject.id === state.subjectId}" aria-label="${subject.code}, tổng ${stats.total} thẻ, ${stats.correct} đúng, ${stats.wrong} sai, ${stats.unanswered} chưa làm">
        <span class="subject-card-top">
          <span class="subject-code">${subject.code}</span>
          <span class="subject-total">${formatNumber(stats.total)} thẻ</span>
        </span>
        <span class="subject-title">${subject.title}</span>
        <span class="subject-progress-copy">
          <span><strong>${formatNumber(stats.correct)}</strong> đúng</span>
          <span>${formatNumber(stats.wrong)} sai · ${formatNumber(stats.unanswered)} chưa làm</span>
        </span>
        <span class="progress-track" aria-hidden="true">
          <span class="progress-correct" style="width:${correctPercent}%"></span>
          <span class="progress-wrong" style="width:${wrongPercent}%"></span>
        </span>
        <span class="subject-heatmap" aria-hidden="true">${renderSubjectHeatmap(subject, 48)}</span>
      </button>
    `;
  }).join("");

  els.subjectList.querySelectorAll(".subject-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.subjectId = button.dataset.subject || subjects[0].id;
      state.currentIndex = pickInitialIndex();
      resetCardInteraction();
      renderAll();
    });
  });
}

function renderStudyCard() {
  const subject = getSubject();
  const card = getCurrentCard();
  const slide = getCurrentSlide();
  const progress = getCardProgress(subject.id, card.index);
  const statusText = getStatusText(progress);
  const count = getSlideCount(subject);

  els.courseEyebrow.textContent = subject.code;
  els.studyTitle.textContent = subject.title;
  els.cardPosition.textContent = `Thẻ ${formatNumber(card.index + 1)} / ${formatNumber(count)}`;
  els.statusBadge.textContent = statusText;
  els.sessionFill.style.transform = `scaleX(${(card.index + 1) / count})`;
  els.slideSurface.setAttribute("aria-label", getCardAccessibleLabel(subject, card.index, count, slide));
  els.cardFront.setAttribute("aria-hidden", "false");
  renderStudyHeatmap(subject, card.index);
  renderAnswerPanel(slide);
  void renderSlideSvg(slide, subject);
  els.slideSearch.value = String(card.index + 1);
}

async function renderSlideSvg(slide, subject) {
  if (!slide) return;
  if (els.slideCanvas.dataset.src === slide.image) return;

  els.frameLoading.classList.remove("is-hidden");
  els.slideCanvas.dataset.src = slide.image;
  els.slideCanvas.setAttribute("aria-label", `${subject.code} slide ${slide.number}`);

  try {
    const response = await fetch(slide.image);
    if (!response.ok) throw new Error(`Cannot load ${slide.image}`);
    const svgText = (await response.text()).replace(/@font-face\s*\{[^}]*filesystem:[^}]*\}/g, "");
    const documentSvg = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = documentSvg.documentElement;
    if (svg.nodeName.toLowerCase() !== "svg") throw new Error("Invalid SVG");

    svg.removeAttribute("style");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    els.slideCanvas.replaceChildren(document.importNode(svg, true));
  } catch (error) {
    els.slideCanvas.textContent = "Không tải được ảnh slide.";
    console.error(error);
  } finally {
    els.frameLoading.classList.add("is-hidden");
  }
}

function renderQueue() {
  const fullQueue = buildQueue();
  const queue = fullQueue.slice(0, 8);
  els.queueSummary.textContent = `${formatNumber(fullQueue.length)} thẻ`;
  if (queue.length === 0) {
    els.queueList.innerHTML = `<div class="empty-state">Chưa có thẻ đến hạn. Sau khi chọn đáp án, câu sai và câu đến lịch ôn sẽ xuất hiện ở đây.</div>`;
    return;
  }

  els.queueList.innerHTML = queue.map((item) => {
    const selected = item.subject.id === state.subjectId && item.index === state.currentIndex ? " is-selected" : "";
    return `
      <button class="queue-item${selected}" type="button" data-subject="${item.subject.id}" data-index="${item.index}">
        <span class="queue-title">${item.subject.code} slide ${item.index + 1}</span>
        <span class="queue-meta">${item.label}</span>
      </button>
    `;
  }).join("");

  els.queueList.querySelectorAll(".queue-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.subjectId = button.dataset.subject || state.subjectId;
      state.currentIndex = Number.parseInt(button.dataset.index || "0", 10);
      resetCardInteraction();
      renderAll();
    });
  });
}

function renderStats() {
  const allStats = subjects.reduce((acc, subject) => {
    const stats = getSubjectStats(subject);
    acc.total += stats.total;
    acc.correct += stats.correct;
    acc.wrong += stats.wrong;
    acc.unanswered += stats.unanswered;
    return acc;
  }, { total: 0, correct: 0, wrong: 0, unanswered: 0 });

  els.headerSummary.textContent = `${formatNumber(allStats.total)} thẻ · ${formatNumber(allStats.correct)} đúng · ${formatNumber(allStats.wrong)} sai`;
  els.overallProgress.textContent = `${formatNumber(allStats.wrong)} sai · ${formatNumber(allStats.unanswered)} chưa làm`;
}

function moveCard(delta) {
  const subject = getSubject();
  const count = getSlideCount(subject);
  state.currentIndex = (state.currentIndex + delta + count) % count;
  resetCardInteraction();
  renderAll();
}

function pickInitialIndex() {
  const due = buildQueue().find((item) => item.subject.id === state.subjectId);
  if (due) return due.index;
  return pickFirstUnseen(getSubject());
}

function pickNextIndex() {
  if (state.mode === "browse") return (state.currentIndex + 1) % getSlideCount(getSubject());
  return pickInitialIndex();
}

function pickFirstUnseen(subject) {
  const count = getSlideCount(subject);
  for (let index = 0; index < count; index += 1) {
    if (!getCardProgress(subject.id, index)) return index;
  }
  return 0;
}

function buildQueue() {
  const now = Date.now();
  const queue = [];
  subjects.forEach((subject) => {
    const count = getSlideCount(subject);
    for (let index = 0; index < count; index += 1) {
      const progress = getCardProgress(subject.id, index);
      if (!progress) {
        if (state.mode === "learn" && subject.id === state.subjectId) {
          queue.push({ subject, index, priority: 2, dueAt: index, label: "Chưa làm" });
        }
        continue;
      }
      if (progress.result === "wrong") {
        queue.push({
          subject,
          index,
          priority: 0,
          dueAt: progress.dueAt,
          label: "Sai - ôn lại ngay",
        });
        continue;
      }
      if (progress.dueAt <= now) {
        queue.push({
          subject,
          index,
          priority: 1,
          dueAt: progress.dueAt,
          label: "Đúng - đến lịch ôn",
        });
      }
    }
  });
  return queue.sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt);
}

function getSubjectStats(subject) {
  const now = Date.now();
  let due = 0;
  let correct = 0;
  let wrong = 0;
  let deep = 0;
  let seen = 0;
  const count = getSlideCount(subject);
  for (let index = 0; index < count; index += 1) {
    const progress = getCardProgress(subject.id, index);
    if (!progress) continue;
    seen += 1;
    if (progress.result === "correct") correct += 1;
    if (progress.result === "wrong") wrong += 1;
    if (progress.score >= maxMasteryScore) deep += 1;
    if (progress.dueAt <= now) due += 1;
  }
  return {
    due,
    correct,
    wrong,
    deep,
    seen,
    unanswered: count - seen,
    total: count,
  };
}

function getCurrentCard() {
  const subject = getSubject();
  return {
    subject,
    index: clamp(state.currentIndex, 0, getSlideCount(subject) - 1),
  };
}

function getCurrentSlide() {
  const subject = getSubject();
  return subject.slides[getCurrentCard().index];
}

function getSubject() {
  return subjects.find((subject) => subject.id === state.subjectId) || subjects[0] || { slides: [] };
}

function getSlideCount(subject) {
  return subject.slides.length;
}

function renderAnswerPanel(slide) {
  const answerInfo = getAnswerInfo(slide?.notes || "");
  const answers = answerInfo.keys;
  const isMulti = answers.length > 1;
  const hasAnswer = answers.length > 0;
  const isChecked = state.answerChecked;
  const isCorrect = isChecked && isAnswerSelectionCorrect(answers);

  els.answerChoices.innerHTML = answerOptions.map((option) => {
    const selected = state.selectedAnswers.includes(option);
    const correct = isChecked && answers.includes(option);
    const wrong = isChecked && selected && !answers.includes(option);
    const missed = isChecked && !selected && answers.includes(option);
    const classes = [
      "answer-choice",
      selected ? "is-selected" : "",
      correct ? "is-correct" : "",
      wrong ? "is-wrong" : "",
      missed ? "is-missed" : "",
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-answer="${option}" aria-pressed="${selected}" ${!hasAnswer || isChecked ? "disabled" : ""}>${option}</button>`;
  }).join("");

  els.answerFeedback.classList.toggle("is-correct", isCorrect);
  els.answerFeedback.classList.toggle("is-wrong", isChecked && !isCorrect);
  els.answerFeedback.textContent = getAnswerFeedbackText(answers);
  els.answerCheck.classList.toggle("is-hidden", !isMulti || isChecked);
  els.answerCheck.disabled = !hasAnswer || !isMulti || isChecked || state.selectedAnswers.length === 0;
  els.answerExplanation.classList.toggle("is-hidden", !isChecked);
  els.answerExplanation.textContent = isChecked ? answerInfo.explanation : "";
}

function handleAnswerChoice(answer) {
  if (!answerOptions.includes(answer) || state.answerChecked) return;
  const answers = getAnswerKeys(getCurrentSlide()?.notes || "");
  if (answers.length === 0) return;

  if (answers.length > 1) {
    state.selectedAnswers = state.selectedAnswers.includes(answer)
      ? state.selectedAnswers.filter((item) => item !== answer)
      : [...state.selectedAnswers, answer].sort();
    renderStudyCard();
    return;
  }

  state.selectedAnswers = [answer];
  checkAnswerSelection();
}

function checkAnswerSelection() {
  const answers = getAnswerKeys(getCurrentSlide()?.notes || "");
  if (answers.length === 0 || state.answerChecked || state.selectedAnswers.length === 0) return;
  state.answerChecked = true;
  recordAnswerResult(isAnswerSelectionCorrect(answers));
  renderAll();
}

function recordAnswerResult(isCorrect) {
  const subject = getSubject();
  const key = getProgressKey(subject.id, state.currentIndex);
  const previous = getCardProgress(subject.id, state.currentIndex) || {};
  const previousScore = Number.isFinite(previous.score) ? previous.score : 0;
  const score = isCorrect ? clamp(previousScore + 1, 1, maxMasteryScore) : 0;
  const now = Date.now();

  state.progress[key] = {
    result: isCorrect ? "correct" : "wrong",
    score,
    attempts: (previous.attempts || 0) + 1,
    correct: (previous.correct || 0) + (isCorrect ? 1 : 0),
    wrong: (previous.wrong || 0) + (isCorrect ? 0 : 1),
    updatedAt: now,
    dueAt: now + reviewIntervals[score],
  };

  saveProgress();
}

function getAnswerKeys(note) {
  return getAnswerInfo(note).keys;
}

function getAnswerInfo(note) {
  const text = note.trim();
  if (!text) return { keys: [], explanation: "Slide này chưa có giải thích." };
  const match = text.match(/^(?:answer\s*[:\-]?\s*|đáp\s*án\s*[:\-]?\s*)?\(?([A-Ea-e]{1,5})\)?(?=\s|$|[.,:)])/i);
  if (!match) return { keys: [], explanation: text || "Slide này chưa có giải thích." };
  const keys = [...new Set(match[1].toUpperCase().split("").filter((item) => answerOptions.includes(item)))].sort();
  const explanation = text.slice(match[0].length).trim().replace(/^[.)\]\-:,\s]+/, "");
  return {
    keys,
    explanation: explanation || "Không có giải thích thêm.",
  };
}

function isAnswerSelectionCorrect(answers) {
  const selected = [...state.selectedAnswers].sort();
  return answers.length === selected.length && answers.every((answer, index) => answer === selected[index]);
}

function getAnswerFeedbackText(answers) {
  if (answers.length === 0) return "Chưa có đáp án";
  if (!state.answerChecked) {
    return answers.length > 1 ? "Chọn nhiều đáp án" : "Chưa chọn";
  }
  const answerText = answers.join(", ");
  return isAnswerSelectionCorrect(answers) ? `Đúng: ${answerText}` : `Chưa đúng: ${answerText}`;
}

function getCardAccessibleLabel(subject, index, count, slide) {
  const position = `${subject.code}, thẻ ${index + 1} trên ${count}.`;
  const answerInfo = getAnswerInfo(slide?.notes || "");
  const suffix = answerInfo.keys.length ? "Chọn đáp án A đến E ở bên dưới." : "Slide này chưa có đáp án tự động.";
  return `${position} Mặt trước là ảnh slide câu hỏi. ${suffix}`;
}

function renderStudyHeatmap(subject, activeIndex) {
  const cells = subject.slides.map((_, index) => {
    const stateName = getCardStudyState(subject.id, index);
    const activeClass = index === activeIndex ? " is-active" : "";
    const label = `${subject.code} thẻ ${index + 1}: ${getHeatmapLabel(stateName)}`;
    return `<button class="heatmap-cell is-${stateName}${activeClass}" type="button" data-index="${index}" title="${label}" aria-label="${label}"></button>`;
  });
  els.studyHeatmap.innerHTML = cells.join("");
  els.studyHeatmap.setAttribute("aria-label", `Heatmap ${subject.code}: ${getSubjectHeatmapSummary(subject)}`);
  els.studyHeatmap.querySelectorAll(".heatmap-cell").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentIndex = Number.parseInt(button.dataset.index || "0", 10);
      state.mode = "browse";
      resetCardInteraction();
      renderAll();
    });
  });
  const activeCell = els.studyHeatmap.querySelector(".heatmap-cell.is-active");
  if (activeCell) {
    els.studyHeatmap.scrollLeft = Math.max(0, activeCell.offsetLeft - els.studyHeatmap.clientWidth / 2);
  }
}

function renderSubjectHeatmap(subject, buckets) {
  const count = getSlideCount(subject);
  return Array.from({ length: buckets }, (_, bucketIndex) => {
    const start = Math.floor((bucketIndex * count) / buckets);
    const end = Math.max(start + 1, Math.floor(((bucketIndex + 1) * count) / buckets));
    const stateName = getBucketStudyState(subject.id, start, Math.min(end, count));
    return `<span class="heatmap-cell is-${stateName}"></span>`;
  }).join("");
}

function getBucketStudyState(subjectId, start, end) {
  const states = [];
  for (let index = start; index < end; index += 1) {
    states.push(getCardStudyState(subjectId, index));
  }
  if (states.includes("level-0")) return "level-0";
  if (states.includes("level-1")) return "level-1";
  if (states.includes("level-2")) return "level-2";
  if (states.includes("level-3")) return "level-3";
  if (states.includes("level-4")) return "level-4";
  if (states.every((stateName) => stateName === "level-5")) return "level-5";
  if (states.includes("level-5")) return "level-4";
  return "unseen";
}

function getCardStudyState(subjectId, index) {
  const progress = getCardProgress(subjectId, index);
  if (!progress) return "unseen";
  return `level-${clamp(progress.score, 0, maxMasteryScore)}`;
}

function getSubjectHeatmapSummary(subject) {
  const counts = { unseen: 0, wrong: 0, correct: 0, deep: 0 };
  subject.slides.forEach((_, index) => {
    const progress = getCardProgress(subject.id, index);
    if (!progress) {
      counts.unseen += 1;
    } else if (progress.result === "wrong") {
      counts.wrong += 1;
    } else {
      counts.correct += 1;
      if (progress.score >= maxMasteryScore) counts.deep += 1;
    }
  });
  return `${formatNumber(counts.correct)} đúng, ${formatNumber(counts.wrong)} sai, ${formatNumber(counts.deep)} xanh sâu, ${formatNumber(counts.unseen)} chưa làm`;
}

function getHeatmapLabel(stateName) {
  if (stateName.startsWith("level-")) {
    const score = Number.parseInt(stateName.replace("level-", ""), 10);
    if (score === 0) return "sai - đỏ, chưa nắm";
    if (score === maxMasteryScore) return `đúng - xanh sâu ${score}/${maxMasteryScore}`;
    return `đúng - mức ${score}/${maxMasteryScore}`;
  }
  const labels = {
    unseen: "chưa làm",
  };
  return labels[stateName] || labels.unseen;
}

function getStatusText(progress) {
  if (!progress) return "Chưa làm";
  if (progress.result === "wrong") return "Sai";
  return `Đúng · mức ${progress.score}/${maxMasteryScore}`;
}

function resetCardInteraction() {
  state.selectedAnswers = [];
  state.answerChecked = false;
}

function getCardProgress(subjectId, index) {
  const progress = state.progress[getProgressKey(subjectId, index)];
  return progress ? normalizeProgress(progress) : null;
}

function normalizeProgress(progress) {
  if (progress.result === "correct" || progress.result === "wrong") {
    return {
      ...progress,
      score: clamp(Number.isFinite(progress.score) ? progress.score : 0, 0, maxMasteryScore),
      dueAt: Number.isFinite(progress.dueAt) ? progress.dueAt : 0,
    };
  }

  if (progress.grade) {
    const isCorrect = progress.grade !== "hard";
    const score = isCorrect ? clamp(progress.grade === "easy" ? 4 : progress.streak || 2, 1, maxMasteryScore) : 0;
    return {
      result: isCorrect ? "correct" : "wrong",
      score,
      attempts: progress.seen || 1,
      correct: isCorrect ? progress.seen || 1 : 0,
      wrong: isCorrect ? 0 : progress.seen || 1,
      updatedAt: progress.updatedAt || 0,
      dueAt: Number.isFinite(progress.dueAt) ? progress.dueAt : 0,
    };
  }

  return null;
}

function getProgressKey(subjectId, index) {
  return `${subjectId}:${index}`;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(state.progress));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(value);
}
