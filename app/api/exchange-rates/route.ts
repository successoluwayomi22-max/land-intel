import { NextResponse } from "next/server";

// Fallback baseline market rates (NGN per 1 unit of foreign currency)
const BASELINE_RATES: Record<string, number> = {
  NGN: 1,
  USD: 1500,
  GBP: 1950,
  EUR: 1650,
  CAD: 1100,
  AUD: 1000,
};

let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

export async function GET() {
  const now = Date.now();

  if (cachedRates && now - cachedRates.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      rates: cachedRates.rates,
      source: "cache",
      updatedAt: new Date(cachedRates.timestamp).toISOString(),
    });
  }

  try {
    // Free open exchange rates API without API key requirement
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.NGN) {
        const usdToNgn = data.rates.NGN; // e.g. ~1350 - 1550 NGN per USD
        
        // Compute NGN per 1 unit of each currency:
        // rateToNgn = usdToNgn / usdToForeignRate
        const liveRates: Record<string, number> = {
          NGN: 1,
          USD: Math.round(usdToNgn),
          GBP: Math.round(usdToNgn / (data.rates.GBP || 0.75)),
          EUR: Math.round(usdToNgn / (data.rates.EUR || 0.90)),
          CAD: Math.round(usdToNgn / (data.rates.CAD || 1.38)),
          AUD: Math.round(usdToNgn / (data.rates.AUD || 1.50)),
        };

        cachedRates = { rates: liveRates, timestamp: now };

        return NextResponse.json({
          rates: liveRates,
          source: "live_forex",
          updatedAt: new Date(now).toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn("[EXCHANGE_RATES_FETCH_ERROR]", err);
  }

  // Fallback to baseline calibrated rates if external forex fetch fails
  return NextResponse.json({
    rates: cachedRates ? cachedRates.rates : BASELINE_RATES,
    source: cachedRates ? "stale_cache" : "baseline_fallback",
    updatedAt: new Date().toISOString(),
  });
}
