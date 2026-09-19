import { NextResponse } from "next/server";
import { PLANS } from "@/lib/services/plans";

export async function GET() {
  return NextResponse.json({
    success: true,
    plans: Object.values(PLANS),
  });
}
