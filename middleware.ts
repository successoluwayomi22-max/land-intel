import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "diasporaland-super-secure-production-jwt-secret-key-32chars"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enforce strict server-side protection on all /admin routes
  if (pathname.startsWith("/admin")) {
    const token =
      request.cookies.get("landintel_session")?.value ||
      request.cookies.get("diasporaland_session")?.value;

    // 1. If not authenticated, immediately redirect to /login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Cryptographically verify JWT session and check for ADMIN role
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as any)?.role;

      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        // Authenticated user lacks admin privileges -> redirect to regular user dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Token is invalid, forged, or expired -> redirect to /login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("auth_error", "session_invalid");
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("landintel_session");
      res.cookies.delete("diasporaland_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
