import { NextResponse } from "next/server";
import { handler, HttpError, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";
import { Attachment } from "@/models/Attachment";
import { blocksToText } from "@/lib/blocknote-text";
import { generate, MAX_CHARS } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ask a question across ALL of the user's notes + PDF texts.
// Personal-scale RAG: notes are stuffed into the prompt (newest first),
// truncated to the model's budget; the answer cites note titles.
export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json();
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) throw new HttpError(400, "Please enter a question");

  const notes = await Note.find({ userId }).sort({ updatedAt: -1 }).limit(60).lean();
  const atts = await Attachment.find({ userId }).select("+text noteId fileName").lean();
  const attByNote = new Map<string, string[]>();
  for (const a of atts) {
    const k = String(a.noteId);
    attByNote.set(k, [...(attByNote.get(k) ?? []), `PDF "${a.fileName}":\n${a.text || ""}`]);
  }

  const sources: string[] = [];
  let corpus = "";
  for (const n of notes) {
    const parts = [`NOTE "${n.title}":\n${blocksToText(n.content)}`, ...(attByNote.get(String(n._id)) ?? [])];
    const chunk = parts.join("\n\n");
    if (!chunk.replace(`NOTE "${n.title}":`, "").trim()) continue;
    if (corpus.length + chunk.length > MAX_CHARS) break;
    corpus += (corpus ? "\n\n---\n\n" : "") + chunk;
    sources.push(n.title || "Untitled");
  }
  if (!corpus) throw new HttpError(422, "You have no notes with content yet — write something first.");

  const prompt = `Answer the user's question using ONLY the workspace content below (their notes and PDFs). If the answer is not in the content, say you couldn't find it in their workspace. Answer in Markdown, concisely, and mention which note(s) the answer came from.

WORKSPACE CONTENT:
"""
${corpus}
"""

QUESTION: ${question}`;

  const answer = await generate(userId, "askAll", prompt);
  return NextResponse.json({ answer, sources });
});
