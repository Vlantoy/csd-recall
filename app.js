"use strict";

let subjects = [];

const storageKey = "csd-recall-progress-v1";
const intervals = {
  hard: 10 * 60 * 1000,
  good: 24 * 60 * 60 * 1000,
  easy: 4 * 24 * 60 * 60 * 1000,
};
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

  document.querySelectorAll(".grade-button").forEach((button) => {
    button.addEventListener("click", () => gradeCurrent(button.dataset.grade || "good"));
  });

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
    if (event.key === "1") gradeCurrent("hard");
    if (event.key === "2") gradeCurrent("good");
    if (event.key === "3") gradeCurrent("easy");
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
    const knownPercent = Math.round((stats.known / stats.total) * 100);
    const learningPercent = Math.round((stats.learning / stats.total) * 100);
    const active = subject.id === state.subjectId ? " is-active" : "";
    return `
      <button class="subject-button${active}" type="button" data-subject="${subject.id}" aria-pressed="${subject.id === state.subjectId}" aria-label="${subject.code}, tổng ${stats.total} thẻ, ${stats.remaining} còn lại, ${stats.known} đã chắc">
        <span class="subject-card-top">
          <span class="subject-code">${subject.code}</span>
          <span class="subject-total">${formatNumber(stats.total)} thẻ</span>
        </span>
        <span class="subject-title">${subject.title}</span>
        <span class="subject-progress-copy">
          <span><strong>${formatNumber(stats.remaining)}</strong> còn lại</span>
          <span>${formatNumber(stats.known)} đã chắc</span>
        </span>
        <span class="progress-track" aria-hidden="true">
          <span class="progress-known" style="width:${knownPercent}%"></span>
          <span class="progress-learning" style="width:${learningPercent}%"></span>
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
  setGradeEnabled(state.answerChecked);
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
    els.queueList.innerHTML = `<div class="empty-state">Chưa có thẻ đến hạn. Khi bạn tự chấm mức độ nhớ, các thẻ cần lặp lại sẽ xuất hiện ở đây.</div>`;
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
    acc.known += stats.known;
    acc.remaining += stats.remaining;
    return acc;
  }, { total: 0, known: 0, remaining: 0 });

  els.headerSummary.textContent = `${formatNumber(allStats.total)} thẻ · ${formatNumber(allStats.known)} đã chắc`;
  els.overallProgress.textContent = `${formatNumber(allStats.remaining)} thẻ còn lại`;
}

function moveCard(delta) {
  const subject = getSubject();
  const count = getSlideCount(subject);
  state.currentIndex = (state.currentIndex + delta + count) % count;
  resetCardInteraction();
  renderAll();
}

function gradeCurrent(grade) {
  if (!state.answerChecked) return;
  const subject = getSubject();
  const key = getProgressKey(subject.id, state.currentIndex);
  const previous = state.progress[key] || {};
  const now = Date.now();
  const streak = grade === "hard" ? 0 : (previous.streak || 0) + 1;
  const multiplier = grade === "easy" ? Math.max(1, streak) : 1;

  state.progress[key] = {
    grade,
    streak,
    seen: (previous.seen || 0) + 1,
    updatedAt: now,
    dueAt: now + intervals[grade] * multiplier,
  };

  saveProgress();
  state.currentIndex = pickNextIndex();
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
    if (!state.progress[getProgressKey(subject.id, index)]) return index;
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
          queue.push({ subject, index, priority: 1, dueAt: index, label: "Chưa học" });
        }
        continue;
      }
      if (progress.dueAt <= now) {
        queue.push({
          subject,
          index,
          priority: 0,
          dueAt: progress.dueAt,
          label: progress.grade === "hard" ? "Cần lặp lại ngay" : "Đến lịch ôn",
        });
      }
    }
  });
  return queue.sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt);
}

function getSubjectStats(subject) {
  const now = Date.now();
  let due = 0;
  let weak = 0;
  let known = 0;
  let seen = 0;
  const count = getSlideCount(subject);
  for (let index = 0; index < count; index += 1) {
    const progress = getCardProgress(subject.id, index);
    if (!progress) continue;
    seen += 1;
    if (progress.grade === "hard") weak += 1;
    if (progress.grade === "easy" || progress.streak >= 2) known += 1;
    if (progress.dueAt <= now) due += 1;
  }
  return {
    due,
    weak,
    known,
    seen,
    learning: Math.max(0, seen - known),
    remaining: count - known,
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
  renderStudyCard();
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
    return `<span class="heatmap-cell is-${stateName}${activeClass}" title="${subject.code} thẻ ${index + 1}: ${getHeatmapLabel(stateName)}"></span>`;
  });
  els.studyHeatmap.innerHTML = cells.join("");
  els.studyHeatmap.setAttribute("aria-label", `Heatmap ${subject.code}: ${getSubjectHeatmapSummary(subject)}`);
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
  if (states.includes("due") || states.includes("hard")) return "due";
  if (states.every((stateName) => stateName === "known")) return "known";
  if (states.includes("known")) return "learning";
  if (states.includes("learning")) return "learning";
  return "unseen";
}

function getCardStudyState(subjectId, index) {
  const progress = getCardProgress(subjectId, index);
  if (!progress) return "unseen";
  if (progress.dueAt <= Date.now()) return "due";
  if (progress.grade === "hard") return "hard";
  if (progress.grade === "easy" || progress.streak >= 2) return "known";
  return "learning";
}

function getSubjectHeatmapSummary(subject) {
  const counts = { unseen: 0, due: 0, hard: 0, learning: 0, known: 0 };
  subject.slides.forEach((_, index) => {
    counts[getCardStudyState(subject.id, index)] += 1;
  });
  const needsReview = counts.due + counts.hard;
  return `${formatNumber(counts.known)} đã chắc, ${formatNumber(counts.learning)} đang học, ${formatNumber(needsReview)} cần ôn, ${formatNumber(counts.unseen)} chưa học`;
}

function getHeatmapLabel(stateName) {
  const labels = {
    unseen: "chưa học",
    due: "cần ôn",
    hard: "đang lủng",
    learning: "đang học",
    known: "đã chắc",
  };
  return labels[stateName] || labels.unseen;
}

function getStatusText(progress) {
  if (!progress) return "Chưa học";
  if (progress.grade === "hard") return "Đang lủng";
  if (progress.grade === "good") return "Đang học";
  return "Đã chắc";
}

function setGradeEnabled(enabled) {
  document.querySelectorAll(".grade-button").forEach((button) => {
    button.disabled = !enabled;
  });
}

function resetCardInteraction() {
  state.selectedAnswers = [];
  state.answerChecked = false;
}

function getCardProgress(subjectId, index) {
  return state.progress[getProgressKey(subjectId, index)] || null;
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
