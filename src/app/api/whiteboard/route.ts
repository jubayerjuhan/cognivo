import { NextResponse } from "next/server";
import { currentUserName, handler, HttpError, requireUser } from "@/lib/api";
import { Whiteboard } from "@/models/Whiteboard";

export const dynamic = "force-dynamic";

function meta(wb: { updatedAt?: Date; lastEditedBy?: string; lastClientId?: string } | null) {
  return {
    updatedAt: wb?.updatedAt ?? null,
    lastEditedBy: wb?.lastEditedBy ?? "",
    lastClientId: wb?.lastClientId ?? "",
  };
}

// GET /api/whiteboard          -> full scene
// GET /api/whiteboard?meta=1   -> lightweight timestamp check used for polling
export const GET = handler(async (req: Request) => {
  const userId = await requireUser();
  const onlyMeta = new URL(req.url).searchParams.has("meta");
  if (onlyMeta) {
    const wb = await Whiteboard.findOne({ userId }).select("updatedAt lastEditedBy lastClientId").lean();
    return NextResponse.json(meta(wb));
  }
  const wb = await Whiteboard.findOne({ userId }).lean();
  return NextResponse.json({
    elements: wb?.elements ?? [],
    files: wb?.files ?? {},
    ...meta(wb),
  });
});

export const PUT = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json();
  if (!Array.isArray(body.elements)) throw new HttpError(400, "elements must be an array");
  const wb = await Whiteboard.findOneAndUpdate(
    { userId },
    {
      $set: {
        elements: body.elements,
        files: body.files && typeof body.files === "object" ? body.files : {},
        lastEditedBy: await currentUserName(),
        lastClientId: typeof body.clientId === "string" ? body.clientId : "",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return NextResponse.json(meta(wb));
});
