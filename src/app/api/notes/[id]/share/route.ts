import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { handler, HttpError, isValidId, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// POST {shared: boolean} -> {shared, shareId}
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Note not found");
  const note = await Note.findOne({ _id: params.id, userId });
  if (!note) throw new HttpError(404, "Note not found");
  const body = await req.json().catch(() => ({}));
  const shared = body.shared === true;
  if (shared && !note.shareId) note.shareId = randomUUID();
  note.shared = shared;
  await note.save();
  return NextResponse.json({ shared: note.shared, shareId: note.shareId });
});
