import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const BASE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  NGN: 1530.25,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AUD: 1.52,
  GHS: 15.4,
  KES: 129.5,
  ZAR: 18.2,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  JPY: 155.2,
  CNY: 7.24,
  INR: 83.5,
  CHF: 0.91,
  SGD: 1.35,
  NZD: 1.64,
  BRL: 5.65,
  MXN: 19.3,
};

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get("base") || "USD").toUpperCase();
  const quote = (searchParams.get("quote") || "NGN").toUpperCase();

  const baseRateToUsd = BASE_RATES_TO_USD[base];
  const quoteRateToUsd = BASE_RATES_TO_USD[quote];

  if (!baseRateToUsd || !quoteRateToUsd) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CURRENCY",
          message: `Currency pair ${base}/${quote} is not supported.`,
          requestId,
        },
      },
      { status: 400 }
    );
  }

  const crossRate = quoteRateToUsd / baseRateToUsd;
  const now = new Date();
  const retrievedAt = now.toISOString();
  const effectiveAt = new Date(now.getTime() - 60000).toISOString();
  const expiresAt = new Date(now.getTime() + 3600000).toISOString();

  return NextResponse.json({
    data: {
      baseCurrency: base,
      quoteCurrency: quote,
      rate: crossRate.toFixed(6),
      source: "CENTRAL_BANK_EXCHANGE_PROVIDER",
      retrievedAt,
      effectiveAt,
      expiresAt,
    },
    meta: {
      requestId,
    },
  });
}
