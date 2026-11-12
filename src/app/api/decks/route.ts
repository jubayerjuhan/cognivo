import { NextResponse } from "next/server";
import { handler, HttpError, requireUser } from "@/lib/api";
import { Deck } from "@/models/Deck";

export const dynamic = "force-dynamic";

type CardIn = { question?: unknown; answer?: unknown };
export type StoredCard = { question: string; answer: string; box: number; dueAt: string };

function dueCount(cards: StoredCard[]) {
  const now = Date.now();
  return cards.filter((c) => new Date(c.dueAt).getTime() <= now).length;
}

// GET -> decks with card counts and how many are due
export const GET = handler(async () => {
  const userId = await requireUser();
  const decks = await Deck.find({ userId }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json(
    decks.map((d) => {
      const cards = (d.cards ?? []) as StoredCard[];
      return {
        _id: d._id,
        title: d.title,
        noteId: d.noteId,
        total: cards.length,
        due: dueCount(cards),
        updatedAt: d.updatedAt,
      };
    })
  );
});

// POST {title, noteId?, cards:[{question,answer}]} -> creates a deck (all cards due now)
export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json();
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : "Flashcards";
  const now = new Date().toISOString();
  const cards: StoredCard[] = (Array.isArray(body.cards) ? body.cards : [])
    .filter((c: CardIn) => c && typeof c.question === "string" && typeof c.answer === "string")
    .slice(0, 100)
    .map((c: CardIn) => ({ question: c.question as string, answer: c.answer as string, box: 0, dueAt: now }));
  if (!cards.length) throw new HttpError(400, "No valid cards");
  const deck = await Deck.create({ userId, title, noteId: typeof body.noteId === "string" ? body.noteId : "", cards });
  return NextResponse.json({ _id: deck._id, total: cards.length }, { status: 201 });
});
