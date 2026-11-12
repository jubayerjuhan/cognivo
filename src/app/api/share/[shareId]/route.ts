import { NextResponse } from "next/server";
import { handler, HttpError } from "@/lib/api";
import { Note } from "@/models/Note";

export const dynamic = "force-dynamic";
type Ctx = { params: { shareId: string } };

// Public read-only view of a shared note (no auth).
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const note = await Note.findOne({ shareId: params.shareId, shared: true })
    .select("title content updatedAt")
    .lean();
  if (!note) throw new HttpError(404, "This shared note is not available");
  return NextResponse.json(note);
});
