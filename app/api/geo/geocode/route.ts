import { NextRequest, NextResponse } from "next/server";
import { geocodePropertyLocation, isNonsenseOrDummy } from "@/lib/geo/geocoding";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("address") || "";
    const lga = searchParams.get("lga") || "";
    const state = searchParams.get("state") || "";
    const country = searchParams.get("country") || "";

    if (!query.trim() && !lga.trim() && !state.trim()) {
      return NextResponse.json(
        { found: false, error: "Please provide an address, city, or coordinates to scan." },
        { status: 400 }
      );
    }

    if (isNonsenseOrDummy(query)) {
      return NextResponse.json(
        { found: false, status: "INVALID_LOCATION_INPUT", error: "Location text appears to be placeholder or test data." },
        { status: 200 }
      );
    }

    const result = await geocodePropertyLocation({
      address: query,
      lga,
      state,
      country,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Vercel-CDN-Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("[GEOCODE_API_ERROR]", error);
    return NextResponse.json(
      { found: false, error: error.message || "Failed to resolve location coordinates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = body.address || body.query || body.q || "";
    const lga = body.lga || "";
    const state = body.state || "";
    const country = body.country || "";

    if (!address.trim() && !lga.trim() && !state.trim()) {
      return NextResponse.json(
        { found: false, error: "Please provide an address, city, or coordinates to scan." },
        { status: 400 }
      );
    }

    if (isNonsenseOrDummy(address)) {
      return NextResponse.json(
        { found: false, status: "INVALID_LOCATION_INPUT", error: "Location text appears to be placeholder or test data." },
        { status: 200 }
      );
    }

    const result = await geocodePropertyLocation({
      address,
      lga,
      state,
      country,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GEOCODE_API_POST_ERROR]", error);
    return NextResponse.json(
      { found: false, error: error.message || "Failed to resolve location coordinates" },
      { status: 500 }
    );
  }
}
