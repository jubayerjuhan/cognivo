import { NextResponse } from "next/server";
import { HttpError, handler, isValidId, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";
import { Attachment } from "@/models/Attachment";
import { Deck } from "@/models/Deck";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

async function findNote(userId: string, id: string) {
  if (!isValidId(id)) throw new HttpError(404, "Note not found");
  const note = await Note.findOne({ _id: id, userId });
  if (!note) throw new HttpError(404, "Note not found");
  return note;
}

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  const note = await findNote(userId, params.id);
  return NextResponse.json(note);
});

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  const note = await findNote(userId, params.id);
  const body = await req.json();
  if (typeof body.title === "string") note.title = body.title || "Untitled";
  if (Array.isArray(body.content)) {
    note.content = body.content;
    note.markModified("content");
  }
  if (Array.isArray(body.tags)) {
    note.tags = body.tags.filter((t: unknown) => typeof t === "string").map((t: string) => t.trim()).filter(Boolean).slice(0, 10);
    note.markModified("tags");
  }
  if (typeof body.folder === "string") note.folder = body.folder.trim().slice(0, 60);
  await note.save();
  return NextResponse.json({ _id: note._id, title: note.title, tags: note.tags, folder: note.folder, updatedAt: note.updatedAt });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  const note = await findNote(userId, params.id);
  await Attachment.deleteMany({ noteId: note._id, userId });
  await Deck.deleteMany({ noteId: String(note._id), userId });
  await note.deleteOne();
  return NextResponse.json({ ok: true });
});
