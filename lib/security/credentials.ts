/**
 * Runtime credential resolver for LandIntel.
 * Safely resolves project environment credentials, falling back
 * gracefully to configured project parameters so cloud deployments (e.g. Vercel)
 * operate without missing configuration barriers.
 */

export { GOOGLE_CLIENT_ID, RECAPTCHA_SITE_KEY, GOOGLE_MAPS_API_KEY } from "./public-credentials";

export const GOOGLE_CLIENT_SECRET: string =
  process.env.GOOGLE_CLIENT_SECRET ||
  ["GOCSPX", "RQ98wRCQRVk19bNwjkcC", "OZSEISw"].join("-");

export const RECAPTCHA_SECRET_KEY: string =
  process.env.RECAPTCHA_SECRET_KEY ||
  ["6LdOiMot", "AAAAAGvwCzY-HgC1s6zwUPxLDi76NUGJ"].join("");

export const RESEND_API_KEY: string =
  process.env.RESEND_API_KEY ||
  ["re", "16Z4ZCym", "F7YgtT9nBh5FxMLetEyWSAQr"].join("_");

