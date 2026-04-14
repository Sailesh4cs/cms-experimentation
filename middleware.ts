import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const existingCookie = req.cookies.get("event_ab_test");

  console.log("🟡 Middleware hit:", req.nextUrl.pathname);
  console.log("🍪 Existing cookie:", existingCookie?.value ?? "NONE");

  if (!existingCookie) {
    const variant = Math.random() > 0.5 ? "A" : "B";

    res.cookies.set("event_ab_test", variant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
    });

    console.log("🔥 NEW Variant Assigned:", variant);
  } else {
    console.log("✅ Existing Variant:", existingCookie.value);
  }

  return res;
}

// ✅ CRITICAL: Without this matcher, middleware does NOT run on page routes
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
