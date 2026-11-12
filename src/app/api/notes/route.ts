import { NextResponse } from "next/server";
import { handler, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";
import { Attachment } from "@/models/Attachment";
import { blocksToText } from "@/lib/blocknote-text";

export const dynamic = "force-dynamic";

// GET /api/notes?q=..&folder=..&tag=..
// q matches title, note body text and extracted PDF text (not just titles).
export const GET = handler(async (req: Request) => {
  const userId = await requireUser();
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim().toLowerCase();
  const folder = sp.get("folder");
  const tag = sp.get("tag");

  const filter: Record<string, unknown> = { userId };
  if (folder) filter.folder = folder;
  if (tag) filter.tags = tag;

  const notes = await Note.find(filter).sort({ updatedAt: -1 }).lean();

  let matchedPdfNoteIds = new Set<string>();
  if (q) {
    const atts = await Attachment.find({ userId }).select("+text noteId").lean();
    for (const a of atts) {
      if ((a.text || "").toLowerCase().includes(q)) matchedPdfNoteIds.add(String(a.noteId));
    }
  }

  const out = notes
    .filter((n) => {
      if (!q) return true;
      if ((n.title || "").toLowerCase().includes(q)) return true;
      if (matchedPdfNoteIds.has(String(n._id))) return true;
      return blocksToText(n.content).toLowerCase().includes(q);
    })
    .map((n) => ({
      _id: n._id,
      title: n.title,
      tags: n.tags ?? [],
      folder: n.folder ?? "",
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

  return NextResponse.json(out);
});

export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json().catch(() => ({}));
  const note = await Note.create({
    userId,
    title: body.title || "Untitled",
    content: Array.isArray(body.content) ? body.content : [],
    tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string").slice(0, 10) : [],
    folder: typeof body.folder === "string" ? body.folder.slice(0, 60) : "",
  });
  return NextResponse.json(note, { status: 201 });
});
