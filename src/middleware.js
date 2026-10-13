import { NextResponse } from "next/server";
import { isLocalhost } from "@/lib/local-only";

export function middleware(request) {
  return isLocalhost(request.headers) ? NextResponse.next() : new NextResponse(null, { status: 404 });
}

export const config = { matcher: ["/contact-sheet/:path*", "/api/contact-sheet/:path*"] };
