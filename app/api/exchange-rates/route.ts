import { NextResponse } from "next/server";

// Fallback baseline market rates (Units of foreign currency per 1 USD)
const BASELINE_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  NGN: 1500,
  GBP: 0.76,
  EUR: 0.88,
  CAD: 1.40,
  AUD: 1.45,
  GHS: 12.0,
  KES: 130.0,
  ZAR: 16.5,
  AED: 3.67,
};

let cachedData: {
  ratesFromUsd: Record<string, number>;
  rates: Record<string, number>;
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

export async function GET() {
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      base: "USD",
      ratesFromUsd: cachedData.ratesFromUsd,
      rates: cachedData.rates,
      source: "cache",
      updatedAt: new Date(cachedData.timestamp).toISOString(),
    });
  }

  try {
    // Open reliable forex rates API without API key requirement
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.NGN) {
        // Enforce Nigerian real-market exchange floor (never lower than 1,500 NGN per USD)
        const rawUsdToNgn = Number(data.rates.NGN) || 1500;
        const usdToNgn = Math.max(rawUsdToNgn, 1500);

        const liveRatesFromUsd: Record<string, number> = {
          USD: 1,
          NGN: Math.round(usdToNgn),
          GBP: Number((data.rates.GBP || 0.76).toFixed(4)),
          EUR: Number((data.rates.EUR || 0.88).toFixed(4)),
          CAD: Number((data.rates.CAD || 1.40).toFixed(4)),
          AUD: Number((data.rates.AUD || 1.45).toFixed(4)),
          GHS: Number((data.rates.GHS || 12.0).toFixed(2)),
          KES: Number((data.rates.KES || 130.0).toFixed(2)),
          ZAR: Number((data.rates.ZAR || 16.5).toFixed(2)),
          AED: Number((data.rates.AED || 3.67).toFixed(2)),
        };

        // Also compute NGN-per-unit for legacy compatibility
        const legacyRatesToNgn: Record<string, number> = {
          NGN: 1,
          USD: Math.round(usdToNgn),
          GBP: Math.round(usdToNgn / (data.rates.GBP || 0.76)),
          EUR: Math.round(usdToNgn / (data.rates.EUR || 0.88)),
          CAD: Math.round(usdToNgn / (data.rates.CAD || 1.40)),
          AUD: Math.round(usdToNgn / (data.rates.AUD || 1.45)),
          GHS: Math.round(usdToNgn / (data.rates.GHS || 12.0)),
          KES: Math.round(usdToNgn / (data.rates.KES || 130.0)),
          ZAR: Math.round(usdToNgn / (data.rates.ZAR || 16.5)),
          AED: Math.round(usdToNgn / (data.rates.AED || 3.67)),
        };

        cachedData = {
          ratesFromUsd: liveRatesFromUsd,
          rates: legacyRatesToNgn,
          timestamp: now,
        };

        return NextResponse.json({
          base: "USD",
          ratesFromUsd: liveRatesFromUsd,
          rates: legacyRatesToNgn,
          source: "live_forex",
          updatedAt: new Date(now).toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn("[EXCHANGE_RATES_FETCH_ERROR]", err);
  }

  // Fallback to baseline calibrated rates if external forex fetch fails
  const fallbackRates = cachedData
    ? cachedData
    : {
        ratesFromUsd: BASELINE_RATES_FROM_USD,
        rates: {
          NGN: 1,
          USD: 1500,
          GBP: 1950,
          EUR: 1650,
          CAD: 1100,
          AUD: 1000,
          GHS: 120,
          KES: 11.5,
          ZAR: 88,
          AED: 395,
        },
        timestamp: now,
      };

  return NextResponse.json({
    base: "USD",
    ratesFromUsd: fallbackRates.ratesFromUsd,
    rates: fallbackRates.rates,
    source: "fallback",
    updatedAt: new Date(now).toISOString(),
  });
}
