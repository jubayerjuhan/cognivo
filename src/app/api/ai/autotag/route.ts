import { NextResponse } from "next/server";
import { handler, HttpError, isValidId, requireUser } from "@/lib/api";
import { loadSourceText } from "@/lib/ai-source";
import { generate } from "@/lib/ai";
import { Note } from "@/models/Note";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Suggests up to 5 short tags for a note and saves them.
export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json();
  if (!body.noteId || !isValidId(body.noteId)) throw new HttpError(400, "Provide noteId");
  const src = await loadSourceText(userId, body);

  const prompt = `Suggest up to 5 short lowercase tags (1-2 words each) for the content below.
Respond ONLY with a JSON object of the form {"tags": ["...", "..."]}.

CONTENT:
"""
${src.text}
"""`;

  const raw = await generate(userId, "autotag", prompt, true);
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    const list = Array.isArray(parsed) ? parsed : parsed.tags ?? [];
    tags = list.filter((t: unknown) => typeof t === "string").map((t: string) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
  } catch {
    throw new HttpError(502, "The AI returned invalid tags. Please try again.");
  }
  await Note.updateOne({ _id: body.noteId, userId }, { $set: { tags } });
  return NextResponse.json({ tags });
});
