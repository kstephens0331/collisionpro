import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow access to auth pages and public API routes
  if (
    path.startsWith("/auth") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/test") ||
    path.startsWith("/api/debug")
  ) {
    return NextResponse.next();
  }

  // For dashboard routes, check Supabase session
  if (path.startsWith("/dashboard")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session from cookies
    const sessionCookie = req.cookies.get("sb-access-token")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
};
