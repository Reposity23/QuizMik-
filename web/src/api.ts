import type { Quiz } from "./types";

export type GenerateQuizResponse =
  | { ok: true; quiz: Quiz; raw?: string }
  | { ok: false; error: string; raw?: string };

export const generateQuiz = async (params: {
  files: File[];
  quizType: string;
  questionCount: number;
  difficulty?: string;
}): Promise<GenerateQuizResponse> => {
  const formData = new FormData();
  formData.append("quizType", params.quizType);
  formData.append("questionCount", String(params.questionCount));
  if (params.difficulty) {
    formData.append("difficulty", params.difficulty);
  }
  params.files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/generate-quiz", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const data = (await response.json()) as GenerateQuizResponse;
    return data;
  }

  return (await response.json()) as GenerateQuizResponse;
};
