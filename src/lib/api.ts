import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "./db";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Returns the signed-in user's id (and connects to MongoDB) or throws 401. */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new HttpError(401, "Unauthorized");
  await connectDB();
  return userId;
}

export async function currentUserName() {
  const user = await currentUser();
  if (!user) return "Unknown";
  return (
    user.fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "Unknown"
  );
}

/** Wraps a route handler so thrown errors become JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      console.error(e);
      const message = e instanceof Error ? e.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export function isValidId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}
