import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyAndUnlockPayment } from "@/lib/services/payment";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const reference = body.reference;

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const result = await verifyAndUnlockPayment(reference);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Payment verification failed" }, { status: 500 });
  }
}
