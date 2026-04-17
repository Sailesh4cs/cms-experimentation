// middleware.ts — DISABLED (replaced by Ninetailed experiment)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  return NextResponse.next(); // pass-through, no cookie assignment
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|_next/data).*)"],
};
