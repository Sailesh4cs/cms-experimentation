import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Always assign fresh random variant on every page load
  const variant = Math.random() < 0.5 ? "A" : "B";

  res.cookies.set("event_ab_test", variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    sameSite: "lax",
  });

  console.log("🔥 Variant Assigned:", variant);

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|_next/data).*)"],
};
