import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to auth pages
    if (path.startsWith("/auth")) {
      return NextResponse.next();
    }

    // Require authentication for dashboard
    if (path.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Role-based access control - admins only for settings
    if (path.startsWith("/dashboard/settings") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    // Only protect specific API routes, exclude auth and health
    "/api/((?!auth|health).*)"
  ]
};
