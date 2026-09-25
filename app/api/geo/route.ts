import { NextRequest, NextResponse } from "next/server";

// Comprehensive country-to-currency and country-to-language mapping
const COUNTRY_LOCALE_MAP: Record<string, { currency: string; language: string }> = {
  // Nigeria & West Africa
  NG: { currency: "NGN", language: "en" },
  GH: { currency: "GHS", language: "en" },
  // East Africa
  KE: { currency: "KES", language: "sw" },
  TZ: { currency: "KES", language: "sw" },
  UG: { currency: "KES", language: "sw" },
  RW: { currency: "KES", language: "sw" },
  // Southern Africa
  ZA: { currency: "ZAR", language: "en" },
  NA: { currency: "ZAR", language: "en" },
  BW: { currency: "ZAR", language: "en" },
  ZW: { currency: "ZAR", language: "en" },
  // United Kingdom & Commonwealth
  GB: { currency: "GBP", language: "en" },
  // North America
  US: { currency: "USD", language: "en" },
  CA: { currency: "CAD", language: "en" },
  // Australia & Oceania
  AU: { currency: "AUD", language: "en" },
  NZ: { currency: "AUD", language: "en" },
  // Middle East & Arab World
  AE: { currency: "AED", language: "ar" },
  SA: { currency: "AED", language: "ar" },
  QA: { currency: "AED", language: "ar" },
  KW: { currency: "AED", language: "ar" },
  OM: { currency: "AED", language: "ar" },
  BH: { currency: "AED", language: "ar" },
  EG: { currency: "USD", language: "ar" },
  JO: { currency: "USD", language: "ar" },
  LB: { currency: "USD", language: "ar" },
  // Europe (Eurozone)
  FR: { currency: "EUR", language: "fr" },
  DE: { currency: "EUR", language: "de" },
  AT: { currency: "EUR", language: "de" },
  CH: { currency: "EUR", language: "de" },
  ES: { currency: "EUR", language: "es" },
  IT: { currency: "EUR", language: "it" },
  NL: { currency: "EUR", language: "nl" },
  BE: { currency: "EUR", language: "fr" },
  PT: { currency: "EUR", language: "pt" },
  IE: { currency: "EUR", language: "en" },
  FI: { currency: "EUR", language: "en" },
  GR: { currency: "EUR", language: "en" },
  LU: { currency: "EUR", language: "fr" },
  MC: { currency: "EUR", language: "fr" },
  PL: { currency: "EUR", language: "pl" },
  // Latin America
  BR: { currency: "USD", language: "pt" },
  MX: { currency: "USD", language: "es" },
  CO: { currency: "USD", language: "es" },
  AR: { currency: "USD", language: "es" },
  CL: { currency: "USD", language: "es" },
  PE: { currency: "USD", language: "es" },
  // Asia
  CN: { currency: "USD", language: "zh" },
  HK: { currency: "USD", language: "zh" },
  TW: { currency: "USD", language: "zh" },
  JP: { currency: "USD", language: "ja" },
  KR: { currency: "USD", language: "ko" },
  IN: { currency: "USD", language: "hi" },
  PK: { currency: "USD", language: "ur" },
  BD: { currency: "USD", language: "bn" },
  ID: { currency: "USD", language: "id" },
  VN: { currency: "USD", language: "vi" },
  TR: { currency: "USD", language: "tr" },
  RU: { currency: "USD", language: "ru" },
  BY: { currency: "USD", language: "ru" },
  KZ: { currency: "USD", language: "ru" },
};

// Supported language codes
const SUPPORTED_LANGUAGES = new Set([
  "en", "zh", "es", "hi", "ar", "fr", "bn", "pt", "ru", "ur",
  "id", "de", "ja", "sw", "tr", "it", "nl", "ko", "vi", "pl",
  "pcm", "yo", "ig", "ha",
]);

export async function GET(request: NextRequest) {
  try {
    // 1. Check Cloudflare / Vercel geolocation headers first
    const cfCountry = request.headers.get("cf-ipcountry");
    const vercelCountry = request.headers.get("x-vercel-ip-country");
    const vercelCity = request.headers.get("x-vercel-ip-city") || "";
    const vercelTimezone = request.headers.get("x-vercel-ip-timezone") || "";
    let countryCode = (cfCountry || vercelCountry || "").toUpperCase();

    // 2. Extract Client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    let ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "";

    // Fast in-memory cache for IP geo lookups
    const ipGeoCache = (global as any).__ipGeoCache || new Map<string, { country: string; city?: string }>();
    (global as any).__ipGeoCache = ipGeoCache;

    let detectedCity = vercelCity;

    // 3. If no header country and not on local private IP, check cache or fast lookup
    if (
      !countryCode &&
      ip &&
      ip !== "127.0.0.1" &&
      ip !== "::1" &&
      !ip.startsWith("192.168.") &&
      !ip.startsWith("10.") &&
      !ip.startsWith("172.")
    ) {
      if (ipGeoCache.has(ip)) {
        const cached = ipGeoCache.get(ip)!;
        countryCode = cached.country;
        detectedCity = detectedCity || cached.city || "";
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms max
          const geoRes = await fetch(`https://freeipapi.com/api/json/${ip}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.countryCode) {
              countryCode = geoData.countryCode.toUpperCase();
              detectedCity = detectedCity || geoData.cityName || "";
              ipGeoCache.set(ip, { country: countryCode, city: detectedCity });
            }
          }
        } catch {
          // Fallback gracefully without blocking
        }
      }
    }

    // 4. Default to Nigeria (NG) if unknown or local development without geo
    if (!countryCode) {
      countryCode = "NG";
    }

    // 5. Detect device language from Accept-Language header
    const acceptLang = request.headers.get("accept-language") || "";
    let deviceLanguage = "";
    if (acceptLang) {
      // e.g. "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7" -> check primary code
      const primaryLang = acceptLang.split(",")[0].split(";")[0].trim().toLowerCase();
      const baseCode = primaryLang.split("-")[0];
      if (SUPPORTED_LANGUAGES.has(baseCode)) {
        deviceLanguage = baseCode;
      }
    }

    // 6. Map Country to Currency and Language
    const mapped = COUNTRY_LOCALE_MAP[countryCode] || { currency: "USD", language: "en" };
    const defaultCurrency = mapped.currency;
    // Prefer device language if explicitly requested by device, otherwise country language
    const defaultLanguage = deviceLanguage || mapped.language || "en";

    return NextResponse.json({
      success: true,
      country: countryCode,
      city: detectedCity,
      timezone: vercelTimezone,
      currency: defaultCurrency,
      language: defaultLanguage,
      deviceLanguage,
      ip,
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      country: "NG",
      city: "Lagos",
      timezone: "Africa/Lagos",
      currency: "NGN",
      language: "en",
      ip: "",
    });
  }
}
