import fs from "fs/promises";
import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { pptxToJson } from "pptx2json";

export type ExtractedSource = {
  filename: string;
  text: string;
  skipped?: string;
};

const readTextFile = async (filePath: string) => fs.readFile(filePath, "utf-8");

const extractPdf = async (filePath: string) => {
  const dataBuffer = await fs.readFile(filePath);
  const parsed = await pdf(dataBuffer);
  return parsed.text || "";
};

const extractDocx = async (filePath: string) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
};

const extractPptx = async (filePath: string) => {
  const json = await pptxToJson(filePath);
  const slides = json?.slides || [];
  const textBlocks: string[] = [];
  slides.forEach((slide: { texts?: { text?: string }[] }, index: number) => {
    slide.texts?.forEach((t) => {
      if (t.text) {
        textBlocks.push(`Slide ${index + 1}: ${t.text}`);
      }
    });
  });
  return textBlocks.join("\n");
};

const isTextType = (ext: string) => [".txt", ".md", ".csv", ".json"].includes(ext);

export const extractTextFromFile = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();
  if (isTextType(ext)) {
    return readTextFile(filePath);
  }
  if (ext === ".pdf") {
    return extractPdf(filePath);
  }
  if (ext === ".docx") {
    return extractDocx(filePath);
  }
  if (ext === ".pptx") {
    return extractPptx(filePath);
  }
  return "";
};

export const buildSourcePack = async (
  files: Express.Multer.File[]
): Promise<{ sourcePack: string; extracted: ExtractedSource[] }> => {
  const extracted: ExtractedSource[] = [];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      extracted.push({
        filename: file.originalname,
        text: "",
        skipped: "Image OCR not enabled yet."
      });
      continue;
    }
    try {
      const text = await extractTextFromFile(file.path);
      if (!text.trim()) {
        extracted.push({
          filename: file.originalname,
          text: "",
          skipped: "No extractable text found."
        });
      } else {
        extracted.push({ filename: file.originalname, text });
      }
    } catch (error) {
      extracted.push({
        filename: file.originalname,
        text: "",
        skipped: `Extraction failed: ${(error as Error).message}`
      });
    }
  }

  const combined = extracted
    .map((item) => {
      if (item.text) {
        return `FILE: ${item.filename}\n${item.text}`;
      }
      return `FILE: ${item.filename}\n[SKIPPED] ${item.skipped ?? "No text"}`;
    })
    .join("\n\n---\n\n");

  return { sourcePack: combined, extracted };
};
