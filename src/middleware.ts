import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * STRICT MIDDLEWARE FOR DEBUGGING
 * This should block EVERYTHING matching the config.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // RBAC: Protect admin routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      // Use absolute redirect with basePath to ensure it lands correctly
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin", // next-auth prepends basePath if NEXTAUTH_URL includes it
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/admin/:path*", 
    "/api/:path*", // Protect all API except auth (handled by withAuth logic)
  ],
};
