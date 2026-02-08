import Prism from "prismjs";
import { renderTextWithLatex } from "./latex";
import type { Quiz, QuizQuestion } from "./types";

export type AnswerState = {
  [questionId: string]: string | number | Record<string, string>;
};

const renderRichText = (text: string) => {
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let html = "";
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(text)) !== null) {
    const [full, lang, code] = match;
    const start = match.index;
    if (start > lastIndex) {
      const segment = text.slice(lastIndex, start);
      html += `<p>${renderTextWithLatex(segment)}</p>`;
    }
    const language = lang || "markup";
    const grammar = Prism.languages[language] || Prism.languages.markup;
    const highlighted = Prism.highlight(code, grammar, language);
    html += `<pre class="code-window"><code class="language-${language}">${highlighted}</code></pre>`;
    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    html += `<p>${renderTextWithLatex(text.slice(lastIndex))}</p>`;
  }

  return html;
};

const buildQuestionHeader = (index: number) =>
  `<div class="question-header">
    <span class="question-index">${index + 1}</span>
  </div>`;

export const renderQuizQuestions = (
  quiz: Quiz,
  container: HTMLElement,
  answers: AnswerState
) => {
  container.innerHTML = "";

  quiz.questions.forEach((question, index) => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.dataset.questionId = question.id;
    card.innerHTML = `${buildQuestionHeader(index)}
      <div class="question-body">${renderQuestionBody(question)}</div>`;

    const inputs = card.querySelectorAll("input, select");
    inputs.forEach((input) => {
      const handler = () => {
        const value = collectAnswer(question, card);
        answers[question.id] = value;
      };
      input.addEventListener("change", handler);
      if ((input as HTMLInputElement).type === "text") {
        input.addEventListener("input", handler);
      }
    });

    container.appendChild(card);
  });
};

const renderQuestionBody = (question: QuizQuestion) => {
  if (question.type === "mcq") {
    const choices = question.choices
      .map(
        (choice, idx) => `
        <label class="choice">
          <input type="radio" name="${question.id}" value="${idx}" />
          <span>${renderRichText(choice)}</span>
        </label>`
      )
      .join("");
    return `
      <div class="question-prompt">${renderRichText(question.prompt)}</div>
      <div class="choice-list">${choices}</div>`;
  }

  if (question.type === "fill_blank" || question.type === "identification") {
    return `
      <div class="question-prompt">${renderRichText(question.prompt)}</div>
      <input class="text-input" type="text" placeholder="Type your answer" />`;
  }

  const pairs = question.pairs
    .map(
      (pair, idx) => `
      <div class="match-row">
        <div class="match-left">${renderRichText(pair.left)}</div>
        <select class="match-select" data-match-index="${idx}">
          <option value="">Select</option>
          ${question.pairs
            .map(
              (option) =>
                `<option value="${option.right}">${option.right}</option>`
            )
            .join("")}
        </select>
      </div>`
    )
    .join("");
  return `
    <div class="question-prompt">Match the items:</div>
    <div class="match-grid">${pairs}</div>`;
};

const collectAnswer = (question: QuizQuestion, card: HTMLElement) => {
  if (question.type === "mcq") {
    const selected = card.querySelector("input:checked") as HTMLInputElement | null;
    return selected ? Number(selected.value) : "";
  }
  if (question.type === "fill_blank" || question.type === "identification") {
    const input = card.querySelector("input") as HTMLInputElement | null;
    return input?.value ?? "";
  }

  const selects = Array.from(card.querySelectorAll("select"));
  const matches: Record<string, string> = {};
  selects.forEach((select) => {
    const index = select.getAttribute("data-match-index");
    if (index) {
      matches[index] = (select as HTMLSelectElement).value;
    }
  });
  return matches;
};
