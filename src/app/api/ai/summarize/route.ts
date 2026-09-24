import { NextResponse } from "next/server";
import { handler, requireUser } from "@/lib/api";
import { loadSourceText } from "@/lib/ai-source";
import { generate } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const src = await loadSourceText(userId, await req.json());

  const prompt = `You are a study assistant. Summarize the following ${
    src.kind === "pdf" ? "document" : "notes"
  } for a student.
Return Markdown with:
- A one-paragraph overview
- A "Key points" bulleted list (5-8 bullets)
- A "Key terms" list with short definitions, if relevant

CONTENT:
"""
${src.text}
"""`;

  const summary = await generate(userId, "summarize", prompt);
  return NextResponse.json({ summary, truncated: src.truncated, source: src.label });
});
