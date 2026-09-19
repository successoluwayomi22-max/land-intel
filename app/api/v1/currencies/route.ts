import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const GLOBAL_CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", minorUnit: 2, numericCode: "566", active: true },
  { code: "USD", name: "US Dollar", symbol: "$", minorUnit: 2, numericCode: "840", active: true },
  { code: "GBP", name: "British Pound Sterling", symbol: "£", minorUnit: 2, numericCode: "826", active: true },
  { code: "EUR", name: "Euro", symbol: "€", minorUnit: 2, numericCode: "978", active: true },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", minorUnit: 2, numericCode: "124", active: true },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", minorUnit: 2, numericCode: "036", active: true },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", minorUnit: 2, numericCode: "936", active: true },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", minorUnit: 2, numericCode: "404", active: true },
  { code: "ZAR", name: "South African Rand", symbol: "R", minorUnit: 2, numericCode: "710", active: true },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", minorUnit: 2, numericCode: "784", active: true },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", minorUnit: 2, numericCode: "682", active: true },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR", minorUnit: 2, numericCode: "634", active: true },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", minorUnit: 0, numericCode: "392", active: true },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", minorUnit: 2, numericCode: "156", active: true },
  { code: "INR", name: "Indian Rupee", symbol: "₹", minorUnit: 2, numericCode: "356", active: true },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", minorUnit: 2, numericCode: "756", active: true },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", minorUnit: 2, numericCode: "702", active: true },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", minorUnit: 2, numericCode: "554", active: true },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", minorUnit: 2, numericCode: "986", active: true },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", minorUnit: 2, numericCode: "484", active: true },
];

export async function GET() {
  const requestId = randomUUID();
  return NextResponse.json({
    data: GLOBAL_CURRENCIES,
    meta: {
      requestId,
      total: GLOBAL_CURRENCIES.length,
    },
  });
}
