import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import { User } from "@/models/User";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "cognivo_session";
const SESSION_DAYS = 7;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
  // Set AUTH_COOKIE_SECURE=1 in .env.local when Cognivo is served over HTTPS.
  secure: process.env.AUTH_COOKIE_SECURE === "1",
};

function secret() {
  return process.env.AUTH_SECRET || "dev-only-secret-set-AUTH_SECRET-in-env-local";
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = (await scryptAsync(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(payloadB64: string) {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid?: string;
      exp?: number;
    };
    if (!data.uid || !data.exp || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export function getSessionUserId(): string | null {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export type SessionUser = { id: string; name: string; email: string; firstName: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  const uid = getSessionUserId();
  if (!uid) return null;
  await connectDB();
  const user = await User.findById(uid).select("name email").lean();
  if (!user) return null;
  const name = user.name || "";
  return {
    id: String(user._id),
    name,
    email: user.email,
    firstName: name ? name.split(" ")[0] : "",
  };
}
