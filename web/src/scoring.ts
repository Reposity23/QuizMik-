import type { Quiz, QuizQuestion } from "./types";
import type { AnswerState } from "./renderQuiz";

export type QuestionResult = {
  id: string;
  correct: boolean;
  score: number;
  total: number;
  correctAnswer: string;
  explanation: string;
};

const normalize = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const scoreQuestion = (
  question: QuizQuestion,
  answer: AnswerState[string]
): QuestionResult => {
  if (question.type === "mcq") {
    const isCorrect = Number(answer) === question.answer_index;
    return {
      id: question.id,
      correct: isCorrect,
      score: isCorrect ? 1 : 0,
      total: 1,
      correctAnswer: question.choices[question.answer_index],
      explanation: question.explanation
    };
  }

  if (question.type === "fill_blank" || question.type === "identification") {
    const input = typeof answer === "string" ? answer : "";
    const normalized = normalize(input);
    const isCorrect = question.answers.some(
      (a) => normalize(a) === normalized
    );
    return {
      id: question.id,
      correct: isCorrect,
      score: isCorrect ? 1 : 0,
      total: 1,
      correctAnswer: question.answers.join(" / "),
      explanation: question.explanation
    };
  }

  const mapping = (answer as Record<string, string>) || {};
  let score = 0;
  question.pairs.forEach((pair, index) => {
    const selected = mapping[String(index)] || "";
    if (normalize(selected) === normalize(pair.right)) {
      score += 1;
    }
  });

  return {
    id: question.id,
    correct: score === question.pairs.length,
    score,
    total: question.pairs.length,
    correctAnswer: question.pairs
      .map((pair) => `${pair.left} → ${pair.right}`)
      .join("; "),
    explanation: question.explanation
  };
};

export const scoreQuiz = (quiz: Quiz, answers: AnswerState) => {
  const results = quiz.questions.map((question) =>
    scoreQuestion(question, answers[question.id])
  );
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const totalPossible = results.reduce((sum, r) => sum + r.total, 0);

  return {
    results,
    totalScore,
    totalPossible,
    percent: totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0
  };
};
