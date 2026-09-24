import { NextResponse } from "next/server";
// Import the library entry directly: pdf-parse's index.js runs a debug harness that reads a test file.
import pdf from "pdf-parse/lib/pdf-parse.js";
import { HttpError, handler, isValidId, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";
import { Attachment } from "@/models/Attachment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: { id: string } };

// Vercel serverless functions reject request bodies over 4.5MB.
const MAX_BYTES = 4 * 1024 * 1024;

async function assertNote(userId: string, id: string) {
  if (!isValidId(id) || !(await Note.exists({ _id: id, userId }))) {
    throw new HttpError(404, "Note not found");
  }
}

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  await assertNote(userId, params.id);
  const list = await Attachment.find({ noteId: params.id, userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(list);
});

export const POST = handler(async (req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  await assertNote(userId, params.id);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file uploaded");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new HttpError(400, "Only PDF files are supported");
  }
  if (file.size > MAX_BYTES) throw new HttpError(413, "PDF must be 4MB or smaller");

  const data = Buffer.from(await file.arrayBuffer());
  let text = "";
  let pages = 0;
  try {
    const parsed = await pdf(data);
    text = parsed.text.trim();
    pages = parsed.numpages;
  } catch (e) {
    console.error("pdf-parse failed", e);
    throw new HttpError(422, "Could not read this PDF (is it encrypted or corrupted?)");
  }

  const att = await Attachment.create({
    userId,
    noteId: params.id,
    fileName: file.name,
    size: file.size,
    data,
    text,
    pages,
  });
  return NextResponse.json(
    {
      _id: att._id,
      fileName: att.fileName,
      size: att.size,
      pages: att.pages,
      createdAt: att.createdAt,
      hasText: text.length > 0,
    },
    { status: 201 }
  );
});
