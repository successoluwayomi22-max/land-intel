import { GOOGLE_MAPS_API_KEY } from "@/lib/security/credentials";

export interface GeocodeResult {
  found: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  placeId?: string;
  status: string;
  isApproximate?: boolean;
}

// Well-known cadastral anchor coordinates for Nigerian states / cities
const KNOWN_NIGERIAN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  lagos: { lat: 6.5244, lng: 3.3792 },
  ikeja: { lat: 6.6018, lng: 3.3515 },
  "eti-osa": { lat: 6.4584, lng: 3.6015 },
  lekki: { lat: 6.4698, lng: 3.5852 },
  "ibeju-lekki": { lat: 6.4947, lng: 3.9056 },
  ikoyi: { lat: 6.4521, lng: 3.4357 },
  "victoria island": { lat: 6.4281, lng: 3.4219 },
  epe: { lat: 6.5841, lng: 3.9833 },
  abuja: { lat: 9.0765, lng: 7.3986 },
  fct: { lat: 9.0765, lng: 7.3986 },
  rivers: { lat: 4.8156, lng: 7.0498 },
  "port harcourt": { lat: 4.8156, lng: 7.0498 },
  ogun: { lat: 7.1475, lng: 3.3619 },
  abeokuta: { lat: 7.1475, lng: 3.3619 },
  oyo: { lat: 7.3775, lng: 3.947 },
  ibadan: { lat: 7.3775, lng: 3.947 },
  enugu: { lat: 6.4584, lng: 7.5464 },
  anambra: { lat: 6.2209, lng: 7.0673 },
  awka: { lat: 6.2209, lng: 7.0673 },
  delta: { lat: 5.5325, lng: 5.8987 },
  asaba: { lat: 6.1984, lng: 6.7328 },
  kano: { lat: 12.0022, lng: 8.592 },
  kaduna: { lat: 10.5105, lng: 7.4165 },
  edo: { lat: 6.335, lng: 5.6037 },
  "benin city": { lat: 6.335, lng: 5.6037 },
};

export async function geocodePropertyLocation(params: {
  address?: string;
  lga?: string;
  state?: string;
  country?: string;
}): Promise<GeocodeResult> {
  const address = params.address?.trim() || "";
  const lga = params.lga?.trim() || "";
  const state = params.state?.trim() || "";
  const country = params.country?.trim() || "Nigeria";

  // Check if all fields are empty or purely placeholder
  const combined = `${address} ${lga} ${state}`.trim().toLowerCase();
  const isDummy = !combined || /^(qwerty|test|dummy|asdf|foo|bar|none|n\/a)$/i.test(combined);

  if (isDummy && !state && !lga) {
    return {
      found: false,
      status: "UNRESOLVABLE_LOCATION",
    };
  }

  const apiKey = GOOGLE_MAPS_API_KEY;

  // 1. Try full Google Maps Geocoding API if key is present
  if (apiKey) {
    const queryParts = [address, lga, state, country].filter(Boolean).join(", ");
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryParts)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return {
          found: true,
          lat: loc.lat,
          lng: loc.lng,
          formattedAddress: data.results[0].formatted_address,
          placeId: data.results[0].place_id,
          status: "OK",
          isApproximate: false,
        };
      }

      // If full query didn't match, fallback to district / city / state
      if (lga || state) {
        const fallbackParts = [lga, state, country].filter(Boolean).join(", ");
        const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fallbackParts)}&key=${apiKey}`;
        const fallbackRes = await fetch(fallbackUrl);
        const fallbackData = await fallbackRes.json();

        if (fallbackData.status === "OK" && fallbackData.results && fallbackData.results.length > 0) {
          const loc = fallbackData.results[0].geometry.location;
          return {
            found: true,
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: fallbackData.results[0].formatted_address,
            placeId: fallbackData.results[0].place_id,
            status: "APPROXIMATE_AREA",
            isApproximate: true,
          };
        }
      }
    } catch (err) {
      console.warn("[GEOCODE] Google Geocoding API notice:", err);
    }
  }

  // 2. Fallback to Known Regional Cadastral Registry Anchors
  for (const [key, coords] of Object.entries(KNOWN_NIGERIAN_COORDINATES)) {
    if (combined.includes(key)) {
      return {
        found: true,
        lat: coords.lat,
        lng: coords.lng,
        formattedAddress: `${state || lga || "Nigeria"} Cadastral District`,
        status: "REGIONAL_ANCHOR",
        isApproximate: true,
      };
    }
  }

  return {
    found: false,
    status: "ZERO_RESULTS",
  };
}
