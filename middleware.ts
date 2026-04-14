import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Only assign once — if cookie already exists, keep it
  const existing = req.cookies.get("event_ab_test")?.value;
  if (existing === "A" || existing === "B") {
    console.log("🔥 Variant Kept:", existing);
    return res;
  }

  // First visit — assign based on random (50/50)
  const variant = Math.random() < 0.5 ? "A" : "B";

  res.cookies.set("event_ab_test", variant, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false,
    sameSite: "lax",
  });

  console.log("🔥 Variant Assigned:", variant);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|_next/data).*)"],
};
