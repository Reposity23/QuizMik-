import "./styles.css";
import { generateQuiz } from "./api";
import { renderQuizQuestions, AnswerState } from "./renderQuiz";
import { scoreQuiz } from "./scoring";
import { QuizTimer } from "./timer";
import { renderDebugSection } from "./debug";
import type { Quiz, QuizType } from "./types";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App container missing");

let selectedFiles: File[] = [];
let currentQuiz: Quiz | null = null;
let answers: AnswerState = {};
let timer = new QuizTimer();
let loadingInterval: number | null = null;
let loadingPercent = 0;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const renderApp = () => {
  app.innerHTML = `
    <div class="app-shell">
      <header>
        <div>
          <h1>QuizForge Prototype</h1>
          <div class="subtitle">Web-only prototype for xAI Grok quiz generation.</div>
        </div>
        <span class="badge">No login required</span>
      </header>

      <section class="section" id="upload-section">
        <h2>Step 1: Upload files</h2>
        <div class="upload-zone" id="upload-zone">
          <p><strong>Drag & drop</strong> your files here or click to browse.</p>
          <p class="file-meta">Max 10 files · Max 20MB each</p>
          <input type="file" id="file-input" multiple hidden />
        </div>
        <div class="file-meta">Selected: <span id="file-count">0</span> / 10 · Total size: <span id="file-size">0 B</span></div>
        <div class="file-list" id="file-list"></div>
        <div class="error" id="file-error" style="display:none"></div>
      </section>

      <section class="section">
        <h2>Step 2: Quiz options</h2>
        <div class="grid grid-2">
          <div>
            <label>Quiz Type</label>
            <select class="select" id="quiz-type">
              <option value="mcq">Multiple Choice</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="identification">Identification</option>
              <option value="matching">Matching</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label>Difficulty (optional)</label>
            <select class="select" id="difficulty">
              <option value="">Not specified</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div style="margin-top:16px;">
          <label>Question count</label>
          <div class="button-row" id="count-buttons">
            ${[5, 10, 20, 30, 50, 100]
              .map(
                (count) =>
                  `<button class="small-button" data-count="${count}">${count}</button>`
              )
              .join("")}
          </div>
          <input class="input" id="custom-count" type="number" min="5" max="100" placeholder="Custom (max 100)" style="margin-top:12px;" />
        </div>
      </section>

      <section class="section">
        <h2>Step 3: Generate quiz</h2>
        <button class="button" id="generate-button">Generate Quiz</button>
        <div id="loading" style="margin-top:12px; display:none;">
          <div class="loading">
            <div class="spinner"></div>
            <div>
              <div><strong>Generating quiz</strong></div>
              <div id="loading-text">Loading 0%</div>
            </div>
          </div>
        </div>
        <div class="error" id="generate-error" style="display:none"></div>
      </section>

      <section class="section" id="quiz-section" style="display:none;">
        <h2>Step 4: Quiz Mode</h2>
        <div id="quiz-meta" class="file-meta"></div>
        <div class="quiz-container" id="quiz-container"></div>
        <div class="button-row" style="margin-top:16px;">
          <button class="button" id="submit-quiz">Submit Quiz</button>
          <button class="button secondary" id="reset-answers">Reset Answers</button>
          <button class="button secondary" id="back-setup">Back to Setup</button>
        </div>
        <div class="toggle-row" id="toggle-row" style="display:none;">
          <label><input type="checkbox" id="toggle-answers" /> Show Answers</label>
          <label><input type="checkbox" id="toggle-explanations" /> Show Explanations</label>
        </div>
        <div id="results" class="results" style="display:none; margin-top:16px;"></div>
      </section>

      <section class="section" id="debug-section" style="display:none;"></section>
    </div>
  `;

  wireUpload();
  wireOptions();
  wireGenerate();
};

const wireUpload = () => {
  const uploadZone = document.getElementById("upload-zone") as HTMLDivElement;
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  const fileList = document.getElementById("file-list") as HTMLDivElement;
  const fileCount = document.getElementById("file-count") as HTMLSpanElement;
  const fileSize = document.getElementById("file-size") as HTMLSpanElement;
  const fileError = document.getElementById("file-error") as HTMLDivElement;

  const updateList = () => {
    fileList.innerHTML = selectedFiles
      .map(
        (file) => `
        <div class="file-item">
          <div>
            <div><strong>${file.name}</strong></div>
            <div class="file-meta">${file.type || "Unknown"} · ${formatBytes(
              file.size
            )}</div>
          </div>
        </div>`
      )
      .join("");
    fileCount.textContent = String(selectedFiles.length);
    fileSize.textContent = formatBytes(
      selectedFiles.reduce((sum, file) => sum + file.size, 0)
    );
  };

  const setError = (message?: string) => {
    if (message) {
      fileError.textContent = message;
      fileError.style.display = "block";
    } else {
      fileError.style.display = "none";
    }
  };

  const validateFiles = (files: File[]) => {
    if (files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed.`);
      return false;
    }
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`${oversized.name} exceeds 20MB limit.`);
      return false;
    }
    setError();
    return true;
  };

  uploadZone.addEventListener("click", () => fileInput.click());
  uploadZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadZone.classList.add("dragover");
  });
  uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("dragover");
  });
  uploadZone.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadZone.classList.remove("dragover");
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!validateFiles(files)) {
      return;
    }
    selectedFiles = files;
    updateList();
  });

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files ?? []);
    if (!validateFiles(files)) {
      return;
    }
    selectedFiles = files;
    updateList();
  });

  updateList();
};

const wireOptions = () => {
  const countButtons = document.getElementById("count-buttons") as HTMLDivElement;
  const customCount = document.getElementById("custom-count") as HTMLInputElement;

  const clearActive = () => {
    countButtons.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("active");
    });
  };

  countButtons.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== "BUTTON") return;
    clearActive();
    target.classList.add("active");
    customCount.value = target.dataset.count ?? "";
  });
};

const startLoading = () => {
  const loading = document.getElementById("loading") as HTMLDivElement;
  const loadingText = document.getElementById("loading-text") as HTMLDivElement;
  loading.style.display = "block";
  loadingPercent = 0;
  if (loadingInterval) {
    window.clearInterval(loadingInterval);
  }
  loadingInterval = window.setInterval(() => {
    if (loadingPercent < 95) {
      loadingPercent += Math.random() * 6;
      loadingText.textContent = `Loading ${Math.floor(loadingPercent)}%`;
    }
  }, 700);
};

const stopLoading = () => {
  const loading = document.getElementById("loading") as HTMLDivElement;
  const loadingText = document.getElementById("loading-text") as HTMLDivElement;
  if (loadingInterval) {
    window.clearInterval(loadingInterval);
  }
  loadingText.textContent = "Loading 100%";
  setTimeout(() => {
    loading.style.display = "none";
  }, 400);
};

const wireGenerate = () => {
  const generateButton = document.getElementById("generate-button") as HTMLButtonElement;
  const generateError = document.getElementById("generate-error") as HTMLDivElement;
  const quizSection = document.getElementById("quiz-section") as HTMLDivElement;
  const quizContainer = document.getElementById("quiz-container") as HTMLDivElement;
  const quizMeta = document.getElementById("quiz-meta") as HTMLDivElement;
  const debugSection = document.getElementById("debug-section") as HTMLDivElement;

  const showError = (message?: string) => {
    if (message) {
      generateError.textContent = message;
      generateError.style.display = "block";
    } else {
      generateError.style.display = "none";
    }
  };

  generateButton.addEventListener("click", async () => {
    const quizType = (document.getElementById("quiz-type") as HTMLSelectElement)
      .value as QuizType;
    const difficulty = (document.getElementById("difficulty") as HTMLSelectElement)
      .value;
    const questionCount = Number(
      (document.getElementById("custom-count") as HTMLInputElement).value || 10
    );

    if (!selectedFiles.length) {
      showError("Please upload at least one file.");
      return;
    }
    if (questionCount < 5 || questionCount > 100) {
      showError("Question count must be between 5 and 100.");
      return;
    }

    showError();
    startLoading();
    const response = await generateQuiz({
      files: selectedFiles,
      quizType,
      questionCount,
      difficulty: difficulty || undefined
    });
    stopLoading();

    debugSection.style.display = "block";

    if (!response.ok) {
      showError(response.error);
      renderDebugSection(debugSection, response.raw, response.error);
      return;
    }

    currentQuiz = response.quiz;
    answers = {};
    quizMeta.innerHTML = \"\";\n    const title = document.createElement(\"div\");\n    title.textContent = `${currentQuiz.quiz_title} · ${currentQuiz.question_count} questions`;\n    const summary = document.createElement(\"div\");\n    summary.textContent = currentQuiz.source_summary;\n    quizMeta.append(title, summary);
    renderQuizQuestions(currentQuiz, quizContainer, answers);
    quizSection.style.display = "block";
    renderDebugSection(debugSection, response.raw);

    timer.reset();
    timer.start();
    wireQuizActions();
  });
};

const wireQuizActions = () => {
  if (!currentQuiz) return;
  const submitQuiz = document.getElementById("submit-quiz") as HTMLButtonElement;
  const resetAnswers = document.getElementById("reset-answers") as HTMLButtonElement;
  const backSetup = document.getElementById("back-setup") as HTMLButtonElement;
  const resultsEl = document.getElementById("results") as HTMLDivElement;
  const toggleRow = document.getElementById("toggle-row") as HTMLDivElement;
  const toggleAnswers = document.getElementById("toggle-answers") as HTMLInputElement;
  const toggleExplanations = document.getElementById(
    "toggle-explanations"
  ) as HTMLInputElement;

  submitQuiz.onclick = () => {
    if (!currentQuiz) return;
    timer.stop();
    const scored = scoreQuiz(currentQuiz, answers);
    resultsEl.style.display = "block";
    toggleRow.style.display = "flex";

    resultsEl.innerHTML = `
      <h3>Results</h3>
      <div class="result-row">
        <div><strong>Score</strong></div>
        <div>${scored.totalScore} / ${scored.totalPossible} (${scored.percent}%)</div>
      </div>
      <div class="result-row">
        <div><strong>Time taken</strong></div>
        <div>${timer.getElapsedDisplay()}</div>
      </div>
      <div style="margin-top:12px;">
        ${scored.results
          .map((result, idx) => {
            const badge = result.correct
              ? `<span class="badge-success">Correct</span>`
              : `<span class="badge-fail">Incorrect</span>`;
            return `
              <div class="result-row">
                <div>Question ${idx + 1}</div>
                <div>${badge}</div>
              </div>
              <div class="file-meta" style="margin-bottom:12px;">
                ${toggleAnswers.checked ? `Answer: ${result.correctAnswer}<br/>` : ""}
                ${toggleExplanations.checked ? `Explanation: ${result.explanation}` : ""}
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  };

  resetAnswers.onclick = () => {
    answers = {};
    const quizContainer = document.getElementById("quiz-container") as HTMLDivElement;
    if (currentQuiz) {
      renderQuizQuestions(currentQuiz, quizContainer, answers);
    }
  };

  backSetup.onclick = () => {
    const quizSection = document.getElementById("quiz-section") as HTMLDivElement;
    quizSection.style.display = "none";
    resultsEl.style.display = "none";
  };

  const rerenderResults = () => {
    if (!currentQuiz || resultsEl.style.display === "none") return;
    submitQuiz.click();
  };

  toggleAnswers.onchange = rerenderResults;
  toggleExplanations.onchange = rerenderResults;
};

renderApp();
