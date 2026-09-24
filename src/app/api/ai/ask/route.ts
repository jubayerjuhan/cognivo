import { NextResponse } from "next/server";
import { handler, HttpError, requireUser } from "@/lib/api";
import { loadSourceText } from "@/lib/ai-source";
import { generate } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json();
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) throw new HttpError(400, "Please enter a question");
  const src = await loadSourceText(userId, body);

  const prompt = `Answer the user's question using ONLY the ${
    src.kind === "pdf" ? "document" : "notes"
  } below. If the answer is not in the content, say you couldn't find it in the ${
    src.kind === "pdf" ? "document" : "notes"
  }. Answer in Markdown, concisely.

CONTENT:
"""
${src.text}
"""

QUESTION: ${question}`;

  const answer = await generate(userId, "ask", prompt);
  return NextResponse.json({ answer, truncated: src.truncated, source: src.label });
});
