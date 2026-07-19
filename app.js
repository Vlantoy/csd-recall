"use strict";

let subjects = [];

const storageKey = "csd-recall-progress-v1";
const intervals = {
  hard: 10 * 60 * 1000,
  good: 24 * 60 * 60 * 1000,
  easy: 4 * 24 * 60 * 60 * 1000,
};

let state = {
  subjectId: "",
  mode: "learn",
  currentIndex: 0,
  revealed: false,
  progress: loadProgress(),
};

const els = {
  subjectList: document.getElementById("subjectList"),
  queueList: document.getElementById("queueList"),
  dueStat: document.getElementById("dueStat"),
  weakStat: document.getElementById("weakStat"),
  knownStat: document.getElementById("knownStat"),
  courseBadge: document.getElementById("courseBadge"),
  slideBadge: document.getElementById("slideBadge"),
  statusBadge: document.getElementById("statusBadge"),
  promptTitle: document.getElementById("promptTitle"),
  promptHint: document.getElementById("promptHint"),
  slideFrame: document.getElementById("slideFrame"),
  frameLoading: document.getElementById("frameLoading"),
  slideCanvas: document.getElementById("slideCanvas"),
  notesBack: document.getElementById("notesBack"),
  notesContent: document.getElementById("notesContent"),
  revealCard: document.getElementById("revealCard"),
  prevCard: document.getElementById("prevCard"),
  nextCard: document.getElementById("nextCard"),
  resetProgress: document.getElementById("resetProgress"),
  slideSearch: document.getElementById("slideSearch"),
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
      state.revealed = false;
      state.currentIndex = pickInitialIndex();
      renderAll();
    });
  });

  els.revealCard.addEventListener("click", () => {
    state.revealed = !state.revealed;
    renderStudyCard();
  });

  els.prevCard.addEventListener("click", () => moveCard(-1));
  els.nextCard.addEventListener("click", () => moveCard(1));

  document.querySelectorAll(".grade-button").forEach((button) => {
    button.addEventListener("click", () => gradeCurrent(button.dataset.grade || "good"));
  });

  els.resetProgress.addEventListener("click", () => {
    state.progress = {};
    saveProgress();
    state.currentIndex = 0;
    state.revealed = false;
    renderAll();
  });

  els.slideSearch.addEventListener("change", () => {
    const parsed = Number.parseInt(els.slideSearch.value, 10);
    if (!Number.isFinite(parsed)) return;
    const subject = getSubject();
    state.currentIndex = clamp(parsed - 1, 0, getSlideCount(subject) - 1);
    state.mode = "browse";
    state.revealed = true;
    renderAll();
  });

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === " ") {
      event.preventDefault();
      state.revealed = !state.revealed;
      renderStudyCard();
    }
    if (event.key === "ArrowRight") moveCard(1);
    if (event.key === "ArrowLeft") moveCard(-1);
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
    button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
  });
}

function renderSubjects() {
  els.subjectList.innerHTML = subjects.map((subject) => {
    const stats = getSubjectStats(subject);
    const percent = Math.round((stats.known / getSlideCount(subject)) * 100);
    const active = subject.id === state.subjectId ? " is-active" : "";
    return `
      <button class="subject-button${active}" type="button" data-subject="${subject.id}" aria-pressed="${subject.id === state.subjectId}">
        <span class="subject-code">${subject.code}</span>
        <span class="subject-title">${subject.title}</span>
        <span class="subject-title">${stats.due} đến hạn, ${stats.weak} đang yếu</span>
        <span class="progress-track" aria-hidden="true"><span class="progress-fill" style="width:${percent}%"></span></span>
      </button>
    `;
  }).join("");

  els.subjectList.querySelectorAll(".subject-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.subjectId = button.dataset.subject || subjects[0].id;
      state.currentIndex = pickInitialIndex();
      state.revealed = false;
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

  els.courseBadge.textContent = subject.code;
  els.slideBadge.textContent = `Slide ${card.index + 1}`;
  els.statusBadge.textContent = statusText;
  els.promptTitle.textContent = getPromptTitle(subject, card.index, progress);
  els.promptHint.textContent = getPromptHint(progress);
  els.revealCard.textContent = state.revealed ? "Ẩn chú thích" : "Lật thẻ";
  els.notesBack.classList.toggle("is-hidden", !state.revealed);
  void renderSlideSvg(slide, subject);
  if (state.revealed) {
    renderCurrentNotes();
  } else {
    els.notesContent.textContent = "";
  }
  els.slideSearch.value = String(card.index + 1);
  setGradeEnabled(state.revealed);
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
  const queue = buildQueue().slice(0, 14);
  if (queue.length === 0) {
    els.queueList.innerHTML = `<div class="empty-state">Chưa có thẻ đến hạn. Hãy học mới vài slide, chấm "chưa biết" cho phần lủng để tạo lịch ôn.</div>`;
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
      state.revealed = false;
      renderAll();
    });
  });
}

function renderStats() {
  const allStats = subjects.reduce((acc, subject) => {
    const stats = getSubjectStats(subject);
    acc.due += stats.due;
    acc.weak += stats.weak;
    acc.known += stats.known;
    return acc;
  }, { due: 0, weak: 0, known: 0 });

  els.dueStat.textContent = String(allStats.due);
  els.weakStat.textContent = String(allStats.weak);
  els.knownStat.textContent = String(allStats.known);
}

function moveCard(delta) {
  const subject = getSubject();
  const count = getSlideCount(subject);
  state.currentIndex = (state.currentIndex + delta + count) % count;
  state.revealed = state.mode === "browse";
  renderAll();
}

function gradeCurrent(grade) {
  if (!state.revealed) return;
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
  state.revealed = false;
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
          queue.push({ subject, index, dueAt: 0, label: "Chưa học" });
        }
        continue;
      }
      if (progress.dueAt <= now || progress.grade === "hard") {
        queue.push({
          subject,
          index,
          dueAt: progress.dueAt,
          label: progress.grade === "hard" ? "Cần lặp lại ngay" : "Đến lịch ôn",
        });
      }
    }
  });
  return queue.sort((a, b) => a.dueAt - b.dueAt);
}

function getSubjectStats(subject) {
  const now = Date.now();
  let due = 0;
  let weak = 0;
  let known = 0;
  const count = getSlideCount(subject);
  for (let index = 0; index < count; index += 1) {
    const progress = getCardProgress(subject.id, index);
    if (!progress) continue;
    if (progress.grade === "hard") weak += 1;
    if (progress.grade === "easy" || progress.streak >= 2) known += 1;
    if (progress.dueAt <= now) due += 1;
  }
  return { due, weak, known };
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

function renderCurrentNotes() {
  const note = getCurrentSlide()?.notes || "";
  els.notesContent.textContent = note || "Slide này chưa có chú thích.";
}

function getPromptTitle(subject, index, progress) {
  if (!progress) return `${subject.code} slide ${index + 1}: bạn còn nhớ nội dung chính không?`;
  if (progress.grade === "hard") return `${subject.code} slide ${index + 1}: đây là phần đang lủng, hãy thử nhớ lại trước.`;
  return `${subject.code} slide ${index + 1}: ôn lại để giữ nhịp nhớ.`;
}

function getPromptHint(progress) {
  if (!progress) return "Nếu không nhớ được ý chính, chấm Chưa biết để app đưa slide này quay lại sớm.";
  return `Đã xem ${progress.seen || 1} lần. Trạng thái gần nhất: ${getStatusText(progress)}.`;
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
