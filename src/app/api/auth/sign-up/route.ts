import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { createSessionToken, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { User } from "@/models/User";
import { rateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`signup:${ip}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many accounts created from here. Please wait an hour." }, { status: 429 });
  }
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  await connectDB();
  if (await User.findOne({ email }).select("_id").lean()) {
    return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
  }
  const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(String(user._id)), sessionCookieOptions);
  return res;
}
