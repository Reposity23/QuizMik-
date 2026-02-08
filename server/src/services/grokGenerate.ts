import fs from "fs";
import { client } from "../xaiClient";
import { buildGrokSystemPrompt, buildGrokUserPrompt } from "./promptBuilder";
import { buildSourcePack } from "./textExtract";
import { quizSchema, QuizType } from "./quizSchema";

const extractOutputText = (response: unknown): string => {
  const res = response as {
    output_text?: string;
    output?: { content?: { text?: string }[] }[];
    choices?: { message?: { content?: string } }[];
  };
  if (res.choices?.[0]?.message?.content) {
    return res.choices[0].message.content;
  }
  if (res.output_text) {
    return res.output_text;
  }
  const textParts: string[] = [];
  res.output?.forEach((item) => {
    item.content?.forEach((part) => {
      if (part.text) {
        textParts.push(part.text);
      }
    });
  });
  return textParts.join("\n").trim();
};

export const generateQuizWithGrok = async (params: {
  files: Express.Multer.File[];
  quizType: QuizType;
  questionCount: number;
  difficulty?: string;
}) => {
  const systemPrompt = buildGrokSystemPrompt();

  let fileParts: { type: "input_file"; file_id: string }[] = [];
  let sourceMode: "files" | "text" = "files";
  let sourcePack = "";
  let sourceSummaryNote: string | undefined;

  try {
    fileParts = await Promise.all(
      params.files.map(async (file) => {
        const upload = await client.files.create({
          file: fs.createReadStream(file.path),
          purpose: "user_data"
        });
        return { type: "input_file", file_id: upload.id };
      })
    );
  } catch (error) {
    sourceMode = "text";
    const extracted = await buildSourcePack(params.files);
    sourcePack = extracted.sourcePack;
    sourceSummaryNote = "Some files could not be attached; using SOURCE PACK text instead.";
    if (!sourcePack.trim()) {
      sourceSummaryNote = "No extractable text found; quiz may be empty.";
    }
  }

  const userPrompt = buildGrokUserPrompt({
    quizType: params.quizType,
    questionCount: params.questionCount,
    difficulty: params.difficulty,
    sourceMode,
    sourceSummaryNote
  });

  const userContent: (
    | { type: "input_text"; text: string }
    | { type: "input_file"; file_id: string }
  )[] = [{ type: "input_text", text: userPrompt }];

  if (sourceMode === "files") {
    userContent.push(...fileParts);
  } else {
    userContent.push({
      type: "input_text",
      text: `SOURCE PACK\n${sourcePack}`
    });
  }

  const response = await client.responses.create({
    model: "grok-4-1-fast-non-reasoning",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userContent
      }
    ]
  });

  const outputText = extractOutputText(response);
  let parsed: unknown = null;
  let parsedError: string | null = null;

  try {
    parsed = JSON.parse(outputText);
    const validated = quizSchema.parse(parsed);
    return { ok: true, quiz: validated, raw: outputText } as const;
  } catch (error) {
    parsedError = (error as Error).message;
  }

  return {
    ok: false,
    error: `Invalid JSON output: ${parsedError ?? "Unknown error"}`,
    raw: outputText
  } as const;
};
