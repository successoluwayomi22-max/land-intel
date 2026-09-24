import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "diasporaland-super-secure-production-jwt-secret-key-32chars"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Enforce strict server-side protection on all /admin routes
  if (pathname.startsWith("/admin")) {
    const token =
      request.cookies.get("landintel_session")?.value ||
      request.cookies.get("diasporaland_session")?.value;

    // If not authenticated, redirect to /login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cryptographically verify JWT session and check for ADMIN role
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as any)?.role;

      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("auth_error", "session_invalid");
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("landintel_session");
      res.cookies.delete("diasporaland_session");
      return res;
    }
  }

  // 2. Robust Content Security Policy (CSP)
  // Secures assets while ensuring Next.js client-side bundles and hydration execute smoothly
  const cspHeader = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.google.com https://www.gstatic.com https://accounts.google.com https://js.paystack.co https://checkout.paystack.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://accounts.google.com; img-src 'self' blob: data: https://maps.googleapis.com https://maps.gstatic.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://www.google.com https://lh3.googleusercontent.com https://checkout.paystack.com https://fonts.gstatic.com; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; frame-src 'self' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://checkout.paystack.com https://www.google.com https://recaptcha.google.com https://accounts.google.com; connect-src 'self' https://translate.googleapis.com https://translate-pa.googleapis.com https://translate.google.com https://maps.googleapis.com https://api.paystack.co https://checkout.paystack.com https://accounts.google.com https://open.er-api.com; upgrade-insecure-requests;`.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|googled610769079a4ec09\\.html|google.*\\.html).*)",
  ],
};
