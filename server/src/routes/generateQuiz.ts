import { Router } from "express";
import { upload, MAX_FILES, MAX_FILE_SIZE_BYTES } from "../services/fileUpload";
import { generateQuizWithGrok } from "../services/grokGenerate";
import { quizTypeEnum } from "../services/quizSchema";
import { cleanupFiles } from "../services/tempCleanup";

export const generateQuizRouter = Router();

generateQuizRouter.post(
  "/generate-quiz",
  upload.array("files", MAX_FILES),
  async (req, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    try {
      const quizType = quizTypeEnum.safeParse(req.body.quizType);
      if (!quizType.success) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid quiz type." });
      }

      const questionCount = Number(req.body.questionCount);
      if (!Number.isFinite(questionCount) || questionCount < 5 || questionCount > 100) {
        return res
          .status(400)
          .json({ ok: false, error: "Question count must be 5-100." });
      }

      const difficulty = req.body.difficulty?.trim() || undefined;

      if (files.length === 0) {
        return res
          .status(400)
          .json({ ok: false, error: "At least one file is required." });
      }

      if (files.length > MAX_FILES) {
        return res
          .status(400)
          .json({ ok: false, error: `Max ${MAX_FILES} files allowed.` });
      }

      const oversized = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
      if (oversized) {
        return res.status(400).json({
          ok: false,
          error: `${oversized.originalname} exceeds 20MB limit.`
        });
      }

      const result = await generateQuizWithGrok({
        files,
        quizType: quizType.data,
        questionCount,
        difficulty
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: (error as Error).message
      });
    } finally {
      await cleanupFiles(files);
    }
  }
);
