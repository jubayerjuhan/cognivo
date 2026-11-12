import { NextResponse } from "next/server";
import { handler, HttpError, isValidId, requireUser } from "@/lib/api";
import { Deck } from "@/models/Deck";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Deck not found");
  const deck = await Deck.findOne({ _id: params.id, userId }).lean();
  if (!deck) throw new HttpError(404, "Deck not found");
  return NextResponse.json(deck);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Deck not found");
  await Deck.deleteOne({ _id: params.id, userId });
  return NextResponse.json({ ok: true });
});
