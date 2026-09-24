import { NextResponse } from "next/server";
import { handler, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";

export const dynamic = "force-dynamic";

// GET /api/notes?q=title-filter
export const GET = handler(async (req: Request) => {
  const userId = await requireUser();
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const filter: Record<string, unknown> = { userId };
  if (q) filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const notes = await Note.find(filter)
    .select("title createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json(notes);
});

export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json().catch(() => ({}));
  const note = await Note.create({
    userId,
    title: body.title || "Untitled",
    content: Array.isArray(body.content) ? body.content : [],
  });
  return NextResponse.json(note, { status: 201 });
});
