import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow access to auth pages and public API routes
  if (
    path.startsWith("/auth") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/test") ||
    path.startsWith("/api/debug") ||
    path.startsWith("/customer") ||
    path === "/"
  ) {
    return NextResponse.next();
  }

  // Check if this is a slug-based route: /[slug]/dashboard
  const slugMatch = path.match(/^\/([^\/]+)\/dashboard/);

  if (slugMatch) {
    const slug = slugMatch[1];
    const response = NextResponse.next();

    // Set the shop slug in a header for the page to use
    response.headers.set("x-shop-slug", slug);

    return response;
  }

  // For legacy dashboard routes, check Supabase session
  if (path.startsWith("/dashboard")) {
    // Get session from cookies
    const sessionCookie = req.cookies.get("sb-access-token")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Check if user has a shop slug cookie - redirect to slug-based URL
    const shopSlug = req.cookies.get("shop-slug")?.value;
    if (shopSlug) {
      // Redirect to slug-based URL
      const newUrl = new URL(`/${shopSlug}${path}`, req.url);
      return NextResponse.redirect(newUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/:slug/dashboard/:path*"]
};
