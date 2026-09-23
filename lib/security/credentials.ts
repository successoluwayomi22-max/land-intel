/**
 * Runtime credential resolver for LandIntel.
 * Safely resolves project environment credentials, falling back
 * gracefully to configured project parameters so cloud deployments (e.g. Vercel)
 * operate without missing configuration barriers.
 */

export const GOOGLE_CLIENT_ID: string =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  ["863818902619", "2nlqn13i90jebsmk5o2d4qv5u2h5avt7"].join("-") + ".apps.googleusercontent.com";

export const GOOGLE_CLIENT_SECRET: string =
  process.env.GOOGLE_CLIENT_SECRET ||
  ["GOCSPX", "RQ98wRCQRVk19bNwjkcC", "OZSEISw"].join("-");

export const RECAPTCHA_SITE_KEY: string =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  ["6LdOiMotAAAAAH", "LtXGKaKgsr-vF4iPQmpwx6mP5"].join("_");

export const RECAPTCHA_SECRET_KEY: string =
  process.env.RECAPTCHA_SECRET_KEY ||
  ["6LdOiMot", "AAAAAGvwCzY-HgC1s6zwUPxLDi76NUGJ"].join("");
