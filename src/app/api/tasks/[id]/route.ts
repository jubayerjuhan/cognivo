import { NextResponse } from "next/server";
import { handler, HttpError, isValidId, requireUser } from "@/lib/api";
import { Task } from "@/models/Task";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Task not found");
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body.completed === "boolean") update.completed = body.completed;
  if ("dueDate" in body) update.dueDate = body.dueDate || null;
  const task = await Task.findOneAndUpdate({ _id: params.id, userId }, { $set: update }, { new: true });
  if (!task) throw new HttpError(404, "Task not found");
  return NextResponse.json(task);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Task not found");
  await Task.deleteOne({ _id: params.id, userId });
  return NextResponse.json({ ok: true });
});
