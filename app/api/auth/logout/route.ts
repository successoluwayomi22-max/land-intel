import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";

const COOKIE_NAMES = [AUTH_COOKIE_NAME, "diasporaland_session", "token", "session"];

async function handleLogoutProcess(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user) {
      await logAudit({
        userId: user.id,
        action: "USER_LOGOUT",
        resourceType: "User",
        resourceId: user.id,
      });
    }
  } catch {}

  const isGet = request.method === "GET";
  const response = isGet
    ? NextResponse.redirect(new URL("/login?logged_out=true", request.url), 303)
    : NextResponse.json({ success: true, message: "Logged out successfully" });

  const isHttps = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

  COOKIE_NAMES.forEach((name) => {
    // 1. Delete through Next.js cookies helper
    response.cookies.delete(name);

    // 2. Explicitly overwrite with past expiration across domain & path
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });

  return response;
}

export async function POST(request: NextRequest) {
  return handleLogoutProcess(request);
}

export async function GET(request: NextRequest) {
  return handleLogoutProcess(request);
}
