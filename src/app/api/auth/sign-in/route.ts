import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { rateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`signin:${ip}:${email}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many sign-in attempts. Please wait 15 minutes." }, { status: 429 });
  }
  await connectDB();
  const user = await User.findOne({ email }).lean();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(String(user._id)), sessionCookieOptions);
  return res;
}
