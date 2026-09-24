import { NextResponse } from "next/server";
import { handler, HttpError, requireUser } from "@/lib/api";
import { Task } from "@/models/Task";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const userId = await requireUser();
  const tasks = await Task.find({ userId }).sort({ completed: 1, dueDate: 1, createdAt: -1 }).lean();
  return NextResponse.json(tasks);
});

export const POST = handler(async (req: Request) => {
  const userId = await requireUser();
  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) throw new HttpError(400, "Title is required");
  const task = await Task.create({ userId, title, dueDate: body.dueDate || null });
  return NextResponse.json(task, { status: 201 });
});
