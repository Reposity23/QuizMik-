import { QuizType } from "./quizSchema";

export const buildGrokSystemPrompt = () =>
  "You are a quiz generator. You must output valid JSON only. No markdown. Do not invent facts. Use ONLY the attached files or provided SOURCE PACK. If information is insufficient, reduce the number of questions and state that in source_summary. Render math using LaTeX delimiters: inline \\\\( ... \\\\) and block \\\\[ ... \\\\]. Keep questions exam-ready and unambiguous. Provide short explanations.";

export const buildGrokUserPrompt = (params: {
  quizType: QuizType;
  questionCount: number;
  difficulty?: string;
  sourceMode: "files" | "text";
  sourceSummaryNote?: string;
}) => {
  const difficultyLine = params.difficulty
    ? `Difficulty: ${params.difficulty}`
    : "Difficulty: not specified";
  return `Generate a quiz with the following requirements.

Quiz type: ${params.quizType}
Requested question count: ${params.questionCount}
${difficultyLine}
Source mode: ${params.sourceMode}
${params.sourceSummaryNote ? `Source note: ${params.sourceSummaryNote}` : ""}

Strict JSON schema (no markdown, no extra keys):
{
  "quiz_title": string,
  "quiz_type": "mcq"|"fill_blank"|"identification"|"matching"|"mixed",
  "question_count": number,
  "source_summary": string,
  "questions": [
    {
      "id": string,
      "type": "mcq",
      "prompt": string,
      "choices": string[],
      "answer_index": number,
      "explanation": string
    },
    {
      "id": string,
      "type": "fill_blank",
      "prompt": string,
      "answers": string[],
      "explanation": string
    },
    {
      "id": string,
      "type": "identification",
      "prompt": string,
      "answers": string[],
      "explanation": string
    },
    {
      "id": string,
      "type": "matching",
      "pairs": [
        { "left": string, "right": string }
      ],
      "explanation": string
    }
  ]
}

Rules:
1) Use ONLY information found in the provided files or SOURCE PACK.
2) If sources are insufficient, reduce question_count accordingly and explain in source_summary.
3) No hallucinations. Omit any uncertain question.
4) Output MUST be valid JSON only.
5) All math must use LaTeX delimiters (\\( \\) and \\[ \\]).
6) Keep questions exam-ready and unambiguous; avoid trick wording.
7) Ensure MCQ distractors are plausible.
8) Matching pairs should be 4-10 pairs depending on questionCount; do not repeat.
9) Keep explanations short and grounded.
10) Never include copyrighted exam answer keys verbatim; paraphrase into practice questions.

Return JSON only and ensure it parses.`;
};
