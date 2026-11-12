import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/", "/sign-in", "/sign-up"];

// API routes check auth themselves (requireUser) so they can return a JSON 401.
function isPublic(req: NextRequest) {
  const p = req.nextUrl.pathname;
  return PUBLIC.includes(p) || p.startsWith("/api/") || p.startsWith("/s/");
}

function sessionLooksValid(req: NextRequest) {
  const token = req.cookies.get("cognivo_session")?.value;
  if (!token) return false;
  // Cheap expiry check here; the HMAC signature is fully verified server-side
  // in src/lib/auth.ts (getSessionUserId) before any data is served.
  try {
    const payload = token.split(".")[0];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { exp?: number };
    return !!data.exp && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  if (isPublic(req) || sessionLooksValid(req)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
