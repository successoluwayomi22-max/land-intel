export interface CurrencyInfo {
  code: string; // ISO 4217 code
  name: string;
  symbol: string;
  minorUnit: number;
  countryCode: string;
  rateToNgn: number;
  rateToUsd: number;
}

export const ISO_CURRENCIES: Record<string, CurrencyInfo> = {
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", minorUnit: 2, countryCode: "NG", rateToNgn: 1, rateToUsd: 1 / 1500 },
  USD: { code: "USD", name: "US Dollar", symbol: "$", minorUnit: 2, countryCode: "US", rateToNgn: 1500, rateToUsd: 1 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", minorUnit: 2, countryCode: "EU", rateToNgn: 1650, rateToUsd: 1.1 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", minorUnit: 2, countryCode: "GB", rateToNgn: 1950, rateToUsd: 1.3 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", minorUnit: 2, countryCode: "CA", rateToNgn: 1100, rateToUsd: 0.73 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", minorUnit: 2, countryCode: "AU", rateToNgn: 1000, rateToUsd: 0.67 },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", minorUnit: 2, countryCode: "GH", rateToNgn: 100, rateToUsd: 0.067 },
  KES: { code: "KES", name: "Kenyan Shilling", symbol: "KSh", minorUnit: 2, countryCode: "KE", rateToNgn: 11.5, rateToUsd: 0.0077 },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "R", minorUnit: 2, countryCode: "ZA", rateToNgn: 85, rateToUsd: 0.057 },
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", minorUnit: 2, countryCode: "AE", rateToNgn: 408, rateToUsd: 0.272 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", minorUnit: 2, countryCode: "SA", rateToNgn: 400, rateToUsd: 0.267 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "QR", minorUnit: 2, countryCode: "QA", rateToNgn: 412, rateToUsd: 0.275 },
};

export interface MonetaryValue {
  originalAmount: number;
  originalCurrency: string;
  displayAmount: number;
  displayCurrency: string;
  formattedOriginal: string;
  formattedDisplay: string;
  exchangeRateUsed: number;
  rateTimestamp: string;
  rateSource: string;
}

export function formatCurrencyAmount(amount: number, currencyCode: string, locale: string = "en-US"): string {
  const curr = ISO_CURRENCIES[currencyCode.toUpperCase()] || { symbol: currencyCode, minorUnit: 2 };
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: curr.minorUnit,
      maximumFractionDigits: curr.minorUnit,
    }).format(amount);
  } catch {
    return `${curr.symbol}${amount.toLocaleString(locale, { minimumFractionDigits: curr.minorUnit, maximumFractionDigits: curr.minorUnit })}`;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): {
  convertedAmount: number;
  rate: number;
  timestamp: string;
  source: string;
} {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) {
    return {
      convertedAmount: amount,
      rate: 1.0,
      timestamp: new Date().toISOString(),
      source: "IDENTITY",
    };
  }

  const fromInfo = ISO_CURRENCIES[from] || { rateToUsd: 1 };
  const toInfo = ISO_CURRENCIES[to] || { rateToUsd: 1 };

  // Convert via USD bridge
  const amountInUsd = amount * fromInfo.rateToUsd;
  const convertedAmount = amountInUsd / toInfo.rateToUsd;
  const rate = convertedAmount / (amount || 1);

  return {
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    rate: Math.round(rate * 10000) / 10000,
    timestamp: new Date().toISOString(),
    source: "CENTRAL_CURRENCY_REGISTRY",
  };
}

export function createMonetaryRepresentation(
  originalAmount: number,
  originalCurrency: string,
  displayCurrency: string,
  locale: string = "en-US"
): MonetaryValue {
  const conversion = convertCurrency(originalAmount, originalCurrency, displayCurrency);

  return {
    originalAmount,
    originalCurrency: originalCurrency.toUpperCase(),
    displayAmount: conversion.convertedAmount,
    displayCurrency: displayCurrency.toUpperCase(),
    formattedOriginal: formatCurrencyAmount(originalAmount, originalCurrency, locale),
    formattedDisplay: formatCurrencyAmount(conversion.convertedAmount, displayCurrency, locale),
    exchangeRateUsed: conversion.rate,
    rateTimestamp: conversion.timestamp,
    rateSource: conversion.source,
  };
}
