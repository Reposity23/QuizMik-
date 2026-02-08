# QuizForge Prototype

A complete, runnable prototype that generates exam-ready quizzes from uploaded files using xAI Grok (OpenAI-compatible SDK). No login, no database, no subscriptions.

## ✅ Features
- Upload up to **10 files** per request (20MB each limit).
- Uses xAI Files API when possible; falls back to local text extraction for common formats.
- Quiz types: MCQ, Fill in the Blank, Identification, Matching, Mixed.
- Exam-ready quiz UI with scoring, results, and review.
- LaTeX rendering via KaTeX + code blocks styled with Prism.js.
- Strict JSON validation with Zod and debug output.

## ⚠️ Security Warning (Important)
**Never commit a real API key.**
- Paste your key in: `server/src/config.ts`
- `config.ts` is ignored by Git.
- Use the example file as a template:
  - `server/src/config.example.ts`

## Install
```bash
npm install
npm install --prefix server
npm install --prefix web
```

## Configure API Key
Edit:
```
server/src/config.ts
```
Paste your key:
```ts
export const XAI_API_KEY = "PASTE_YOUR_KEY_HERE";
```

## Run (dev)
```bash
npm run dev
```
- Web UI: http://localhost:5173
- API: http://localhost:3001

## Limitations
- Image OCR is not enabled yet (images are skipped with a notice).
- Quiz quality depends on the source files provided.

## Notes
- Uses xAI Files API attachment_search for document grounding.
- If file attachment fails, the server builds a single SOURCE PACK text and sends it to Grok.
