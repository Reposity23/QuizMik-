export type QuizType =
  | "mcq"
  | "fill_blank"
  | "identification"
  | "matching"
  | "mixed";

export type QuizQuestion =
  | {
      id: string;
      type: "mcq";
      prompt: string;
      choices: string[];
      answer_index: number;
      explanation: string;
    }
  | {
      id: string;
      type: "fill_blank";
      prompt: string;
      answers: string[];
      explanation: string;
    }
  | {
      id: string;
      type: "identification";
      prompt: string;
      answers: string[];
      explanation: string;
    }
  | {
      id: string;
      type: "matching";
      pairs: { left: string; right: string }[];
      explanation: string;
    };

export type Quiz = {
  quiz_title: string;
  quiz_type: QuizType;
  question_count: number;
  source_summary: string;
  questions: QuizQuestion[];
};
