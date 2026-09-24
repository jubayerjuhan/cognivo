import { NextResponse } from "next/server";
import { handler, HttpError, requireUser } from "@/lib/api";
import { loadSourceText } from "@/lib/ai-source";
import { generate } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Card = { question: string; answer: string };

export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const src = await loadSourceText(userId, await req.json());

  const prompt = `Create exactly 5 flashcards that test understanding of the most important ideas in the content below.
Respond ONLY with a JSON array of objects: [{"question": "...", "answer": "..."}].
Keep answers concise (1-3 sentences).

CONTENT:
"""
${src.text}
"""`;

  const raw = await generate(userId, "quiz", prompt, true);
  let cards: Card[];
  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    const list = Array.isArray(parsed) ? parsed : parsed.flashcards ?? parsed.cards ?? [];
    cards = list
      .filter((c: Card) => c && typeof c.question === "string" && typeof c.answer === "string")
      .slice(0, 5);
  } catch {
    throw new HttpError(502, "The AI returned an invalid quiz. Please try again.");
  }
  if (!cards.length) throw new HttpError(502, "The AI returned no flashcards. Please try again.");
  return NextResponse.json({ cards, truncated: src.truncated, source: src.label });
});
