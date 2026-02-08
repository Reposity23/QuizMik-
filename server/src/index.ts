import express from "express";
import cors from "cors";
import { generateQuizRouter } from "./routes/generateQuiz";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", generateQuizRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`QuizForge server running on http://localhost:${port}`);
});
