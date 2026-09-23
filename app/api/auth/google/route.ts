import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/services/audit";
import { sendWelcomeEmail } from "@/lib/email/send";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "@/lib/security/credentials";
import crypto from "crypto";

const GoogleAuthSchema = z.object({
  credential: z.string().optional(),
  code: z.string().optional(),
  redirect_uri: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  imageUrl: z.string().optional(),
});

/**
 * GET: Redirect directly to Google OAuth 2.0 authorization screen
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const clientId = GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("[GOOGLE_AUTH] Missing GOOGLE_CLIENT_ID in environment");
    return NextResponse.redirect(
      new URL(
        "/login?error=Google+Sign-In+is+not+configured+on+this+domain.",
        origin
      )
    );
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;

  return NextResponse.redirect(authUrl);
}

/**
 * Verify a Google ID token and extract the payload.
 * Uses google-auth-library when GOOGLE_CLIENT_ID is set.
 * Falls back to simple JWT decode for development.
 */
async function verifyGoogleToken(
  credential: string
): Promise<{ email: string; name: string; sub: string; picture?: string } | null> {
  const clientId = GOOGLE_CLIENT_ID;

  if (clientId) {
    try {
      // Use google-auth-library for cryptographic verification
      const { OAuth2Client } = await import("google-auth-library");
      const client = new OAuth2Client(clientId);

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        console.error("[GOOGLE_AUTH] No email in verified payload");
        return null;
      }

      return {
        email: payload.email,
        name: payload.name || "Google User",
        sub: payload.sub,
        picture: payload.picture,
      };
    } catch (err) {
      console.error("[GOOGLE_AUTH] Token verification failed:", err);
      return null;
    }
  }

  // Fallback: decode JWT without cryptographic verification (development only)
  try {
    const parts = credential.split(".");
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
      const googlePayload = JSON.parse(payloadJson);
      if (googlePayload.email) {
        return {
          email: googlePayload.email,
          name: googlePayload.name || "Google User",
          sub: googlePayload.sub || googlePayload.email,
          picture: googlePayload.picture,
        };
      }
    }
  } catch (decodeErr) {
    console.warn("[GOOGLE_AUTH] Could not decode JWT:", decodeErr);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = GoogleAuthSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Google authentication payload" }, { status: 400 });
    }

    let email: string | undefined;
    let name = "Google Investor";
    let googleId: string | undefined;
    let picture: string | undefined;

    // 1. If authorization code is provided (from Google OAuth2 popup code client)
    if (parsed.data.code) {
      try {
        const { OAuth2Client } = await import("google-auth-library");
        const redirectUri = parsed.data.redirect_uri || "postmessage";
        const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
        const { tokens } = await oauth2Client.getToken(parsed.data.code);

        if (tokens.id_token) {
          const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (payload && payload.email) {
            email = payload.email.trim().toLowerCase();
            name = payload.name || "Google Investor";
            googleId = payload.sub;
            picture = payload.picture;
          }
        }
      } catch (codeErr) {
        console.error("[GOOGLE_AUTH] Code exchange failed:", codeErr);
        return NextResponse.json(
          { error: "Google authentication code exchange failed. Please try again." },
          { status: 401 }
        );
      }
    }

    // 2. Verify Google credential JWT if provided (from One Tap or GSI credential)
    if (!email && parsed.data.credential) {
      const verified = await verifyGoogleToken(parsed.data.credential);
      if (verified) {
        email = verified.email.trim().toLowerCase();
        name = verified.name;
        googleId = verified.sub;
        picture = verified.picture;
      } else {
        return NextResponse.json(
          { error: "Google token verification failed. Please try again." },
          { status: 401 }
        );
      }
    }

    // 3. Use explicitly provided email/name as fallback
    if (!email && parsed.data.email) {
      email = parsed.data.email.trim().toLowerCase();
      name = parsed.data.name?.trim() || "Google Investor";
    }

    // 4. No credential, code, or email
    if (!email) {
      return NextResponse.json(
        {
          error: "No Google account credentials received. Redirecting to Google Sign-In...",
          code: "GOOGLE_CREDENTIAL_REQUIRED",
          authUrl: "/api/auth/google",
        },
        { status: 400 }
      );
    }

    // Find existing user by googleId or email
    let user = googleId
      ? await db.user.findFirst({
          where: {
            OR: [
              { googleId },
              { email },
            ],
          },
        })
      : await db.user.findUnique({ where: { email } });

    let isNewUser = false;

    if (!user) {
      // Create new account
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString("hex") + "!Aa1";
      const passwordHash = await hashPassword(randomPassword);

      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "FREE",
          isVerified: true, // Google-authenticated users are pre-verified
          googleId: googleId || null,
          avatarUrl: picture || null,
        },
      });

      await logAudit({
        userId: user.id,
        action: "GOOGLE_ACCOUNT_CREATED",
        resourceType: "User",
        resourceId: user.id,
        details: { email, method: "Google_OAuth" },
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail({ email: user.email, name: user.name }).catch((err) => {
        console.error("[GOOGLE_AUTH] Welcome email error:", err);
      });
    } else if (googleId && !user.googleId) {
      // Link Google account to existing email-based account
      await db.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: picture || user.avatarUrl,
          isVerified: true,
        },
      });
    }

    // Generate session token
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
      details: { email: user.email, isNewUser },
    });

    const response = NextResponse.json({
      success: true,
      message: isNewUser ? "Google account registered successfully" : "Signed in with Google",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
      token,
      isNewUser,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[GOOGLE_AUTH_ERROR]", error);
    return NextResponse.json({ error: error.message || "Google authentication failed" }, { status: 500 });
  }
}
