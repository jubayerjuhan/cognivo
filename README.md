# Cognivo

AI-powered knowledge workspace for students and researchers.

- **Notes** — rich-text notes with [BlockNote](https://www.blocknotejs.org/) (headings, lists, code blocks, tables, images), autosave, title search
- **PDF attachments** — upload PDFs to a note; text is extracted with `pdf-parse`
- **AI assistant** (Google Gemini) — summarize a note or PDF, generate 5 flashcards, ask questions about a PDF/note
- **Whiteboard** — [Excalidraw](https://excalidraw.com/) canvas with manual save (Ctrl/Cmd+S), polling for changes saved elsewhere, and "last saved by" info
- **Tasks** — to-do list with due dates and completion
- **Dashboard** — counts for notes, tasks, completed tasks, AI calls, plus a 7-day AI usage chart

Stack: Next.js 14 (App Router) · MongoDB/Mongoose · Clerk · Tailwind CSS · Gemini API · Vercel.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   - **Clerk**: create an app at <https://dashboard.clerk.com>, copy the publishable + secret keys.
   - **MongoDB**: create a free Atlas cluster, copy the connection string (include a db name, e.g. `/cognivo`).
     In Atlas → Network Access, allow `0.0.0.0/0` so Vercel can connect.
   - **Gemini**: create a key at <https://aistudio.google.com/apikey>. `GEMINI_MODEL` defaults to `gemini-2.5-flash`.
3. Run it:
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>.

## Deploy to Vercel

Import the repo in Vercel and add the same environment variables from `.env.local` in
Project → Settings → Environment Variables. No other configuration is needed.

## Notes & limits

- PDFs are stored in MongoDB (Vercel has no persistent disk) and capped at **4MB** (Vercel's request body limit).
  Scanned/image-only PDFs have no extractable text, so AI features won't work on them.
- Images inside notes are embedded as data URLs (max 2MB each).
- AI prompts send the full text, truncated to 100k characters — no vector DB/RAG.
- The whiteboard is one per user; sync is save-based (no real-time collaboration). Another tab/device's
  save shows a "New changes available" banner within ~8 seconds.

## Project structure

```
src/
  app/
    (app)/            authenticated pages: dashboard, notes, notes/[id], whiteboard, tasks
    api/              route handlers: notes, attachments, ai/{summarize,quiz,ask}, whiteboard, tasks
    sign-in, sign-up  Clerk auth pages
  components/         Sidebar, NoteEditor, AiPanel, Flashcards, WhiteboardCanvas, AiUsageChart
  lib/                db connection, auth/route helpers, Gemini client, BlockNote→text
  models/             Mongoose schemas: Note, Attachment, Whiteboard, Task, AiCall
  middleware.ts       Clerk route protection
```
