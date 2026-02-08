import { z } from "zod";

export const quizTypeEnum = z.enum([
  "mcq",
  "fill_blank",
  "identification",
  "matching",
  "mixed"
]);
export type QuizType = z.infer<typeof quizTypeEnum>;

const mcqSchema = z.object({
  id: z.string(),
  type: z.literal("mcq"),
  prompt: z.string(),
  choices: z.array(z.string()).min(2),
  answer_index: z.number().int().nonnegative(),
  explanation: z.string()
});

const fillBlankSchema = z.object({
  id: z.string(),
  type: z.literal("fill_blank"),
  prompt: z.string(),
  answers: z.array(z.string()).min(1),
  explanation: z.string()
});

const identificationSchema = z.object({
  id: z.string(),
  type: z.literal("identification"),
  prompt: z.string(),
  answers: z.array(z.string()).min(1),
  explanation: z.string()
});

const matchingSchema = z.object({
  id: z.string(),
  type: z.literal("matching"),
  pairs: z
    .array(
      z.object({
        left: z.string(),
        right: z.string()
      })
    )
    .min(2),
  explanation: z.string()
});

export const quizSchema = z.object({
  quiz_title: z.string(),
  quiz_type: quizTypeEnum,
  question_count: z.number().int().nonnegative(),
  source_summary: z.string(),
  questions: z.array(
    z.union([mcqSchema, fillBlankSchema, identificationSchema, matchingSchema])
  )
});

export type Quiz = z.infer<typeof quizSchema>;
