import { NextResponse } from "next/server";
import { handler, HttpError, isValidId, requireUser } from "@/lib/api";
import { Deck } from "@/models/Deck";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// Leitner intervals in days, by box (0..5).
const INTERVALS = [0, 1, 3, 7, 16, 35];

// POST {cardIndex, result: "again" | "good"} -> updates box/dueAt for that card.
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Deck not found");
  const deck = await Deck.findOne({ _id: params.id, userId });
  if (!deck) throw new HttpError(404, "Deck not found");
  const body = await req.json();
  const idx = Number(body.cardIndex);
  const cards = (deck.cards ?? []) as { question: string; answer: string; box: number; dueAt: string }[];
  if (!Number.isInteger(idx) || idx < 0 || idx >= cards.length) throw new HttpError(400, "Bad card index");

  const card = cards[idx];
  if (body.result === "again") {
    card.box = 0;
    card.dueAt = new Date(Date.now() + 10 * 60_000).toISOString(); // again in 10 minutes
  } else {
    card.box = Math.min(5, (card.box ?? 0) + 1);
    card.dueAt = new Date(Date.now() + INTERVALS[card.box] * 86_400_000).toISOString();
  }
  deck.cards = cards;
  deck.markModified("cards");
  await deck.save();

  const now = Date.now();
  const due = cards.filter((c) => new Date(c.dueAt).getTime() <= now).length;
  return NextResponse.json({ box: card.box, dueAt: card.dueAt, dueRemaining: due });
});
