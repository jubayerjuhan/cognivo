import { NextResponse } from "next/server";
import { HttpError, handler, isValidId, requireUser } from "@/lib/api";
import { Attachment } from "@/models/Attachment";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// GET streams the stored PDF back (opens inline in the browser).
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Not found");
  const att = await Attachment.findOne({ _id: params.id, userId }).select("+data");
  if (!att) throw new HttpError(404, "Not found");
  return new Response(new Uint8Array(att.data), {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(att.fileName)}"`,
    },
  });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Not found");
  await Attachment.deleteOne({ _id: params.id, userId });
  return NextResponse.json({ ok: true });
});
