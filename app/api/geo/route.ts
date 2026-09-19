import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Check Cloudflare / Vercel geolocation headers first
    const cfCountry = request.headers.get("cf-ipcountry");
    const vercelCountry = request.headers.get("x-vercel-ip-country");
    let countryCode = (cfCountry || vercelCountry || "").toUpperCase();

    // 2. Extract Client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    let ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "";

    // Fast in-memory cache for IP geo lookups
    const ipGeoCache = (global as any).__ipGeoCache || new Map<string, string>();
    (global as any).__ipGeoCache = ipGeoCache;

    // 3. If no header country and not on local private IP, check cache or fast lookup
    if (!countryCode && ip && ip !== "127.0.0.1" && ip !== "::1" && !ip.startsWith("192.168.") && !ip.startsWith("10.") && !ip.startsWith("172.")) {
      if (ipGeoCache.has(ip)) {
        countryCode = ipGeoCache.get(ip)!;
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 400); // Fast 400ms max
          const geoRes = await fetch(`https://freeipapi.com/api/json/${ip}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.countryCode) {
              countryCode = geoData.countryCode.toUpperCase();
              ipGeoCache.set(ip, countryCode);
            }
          }
        } catch {
          // Fallback gracefully without blocking
        }
      }
    }

    // 4. Default to Nigeria (NG) if unknown or local development
    if (!countryCode) {
      countryCode = "NG";
    }

    // 5. Map Country Code to Default Currency and Language
    let defaultCurrency = "USD";
    let defaultLanguage = "en";

    switch (countryCode) {
      case "NG":
        defaultCurrency = "NGN";
        defaultLanguage = "en";
        break;
      case "GB":
        defaultCurrency = "GBP";
        defaultLanguage = "en";
        break;
      case "US":
        defaultCurrency = "USD";
        defaultLanguage = "en";
        break;
      case "CA":
        defaultCurrency = "CAD";
        defaultLanguage = "en";
        break;
      case "FR":
        defaultCurrency = "EUR";
        defaultLanguage = "fr";
        break;
      case "DE":
      case "ES":
      case "IT":
      case "NL":
      case "IE":
      case "BE":
      case "AT":
      case "PT":
        defaultCurrency = "EUR";
        defaultLanguage = "en";
        break;
      case "GH":
        defaultCurrency = "GHS";
        defaultLanguage = "en";
        break;
      case "KE":
        defaultCurrency = "KES";
        defaultLanguage = "en";
        break;
      default:
        defaultCurrency = "USD";
        defaultLanguage = "en";
        break;
    }

    return NextResponse.json({
      success: true,
      country: countryCode,
      currency: defaultCurrency,
      language: defaultLanguage,
      ip,
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      country: "NG",
      currency: "NGN",
      language: "en",
      ip: "",
    });
  }
}
