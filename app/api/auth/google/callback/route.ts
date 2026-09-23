import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { sendWelcomeEmail } from "@/lib/email/send";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    console.warn("[GOOGLE_CALLBACK] Auth cancelled or failed:", errorParam);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam || "Google authentication was cancelled")}`, origin)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[GOOGLE_CALLBACK] Missing Google OAuth credentials in environment");
    return NextResponse.redirect(
      new URL("/login?error=Google+OAuth+is+not+fully+configured+on+the+server", origin)
    );
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error("No ID token returned by Google OAuth");
    }

    // Cryptographically verify ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Failed to extract verified user profile from Google ID token");
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || "Google Investor";
    const googleId = payload.sub;
    const picture = payload.picture;

    // Look for existing user
    let user = await db.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString("hex") + "!Aa1";
      const passwordHash = await hashPassword(randomPassword);

      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "FREE",
          isVerified: true,
          googleId,
          avatarUrl: picture || null,
        },
      });

      await logAudit({
        userId: user.id,
        action: "GOOGLE_ACCOUNT_CREATED",
        resourceType: "User",
        resourceId: user.id,
        details: { email, method: "Google_OAuth_Redirect" },
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail({ email: user.email, name: user.name }).catch((err) => {
        console.error("[GOOGLE_CALLBACK] Welcome email error:", err);
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await db.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: picture || user.avatarUrl,
          isVerified: true,
        },
      });
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN_GOOGLE",
      resourceType: "User",
      resourceId: user.id,
      details: { email: user.email, isNewUser, method: "OAuth_Redirect" },
    });

    const targetPath =
      user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";

    const response = NextResponse.redirect(new URL(targetPath, origin));

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[GOOGLE_CALLBACK_ERROR]", err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || "Failed to complete Google Sign-In")}`, origin)
    );
  }
}
