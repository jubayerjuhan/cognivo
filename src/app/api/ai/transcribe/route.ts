import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { handler, HttpError, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";
import { AiCall } from "@/models/AiCall";
import { rateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_AUDIO = 24 * 1024 * 1024; // Groq's upload cap is 25MB

function paragraphBlocks(text: string) {
  const chunks: string[] = [];
  let cur = "";
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((cur + " " + sentence).length > 700 && cur) {
      chunks.push(cur.trim());
      cur = sentence;
    } else {
      cur = cur ? cur + " " + sentence : sentence;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.map((t) => ({
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: [{ type: "text", text: t, styles: {} }],
    children: [],
  }));
}

// POST multipart audio file -> transcribes with Whisper and creates a note.
export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  if (rateLimited("ai:" + userId, 20, 60_000)) {
    throw new HttpError(429, "Too many AI requests - please wait a minute and try again.");
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new HttpError(500, "GROQ_API_KEY is not set");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Attach an audio file");
  if (file.size > MAX_AUDIO) throw new HttpError(413, "Audio must be under 24MB");

  let text = "";
  try {
    const client = new Groq({ apiKey, maxRetries: 2 });
    const res = await client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
    });
    text = (res.text || "").trim();
  } catch {
    throw new HttpError(502, "Transcription failed. Try a clearer or shorter recording.");
  }
  if (!text) throw new HttpError(422, "No speech could be transcribed from that audio.");

  await AiCall.create({ userId, kind: "transcribe" });
  const note = await Note.create({
    userId,
    title: `Audio note - ${new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`,
    content: paragraphBlocks(text),
    tags: ["audio"],
  });
  return NextResponse.json({ noteId: String(note._id), chars: text.length }, { status: 201 });
});
