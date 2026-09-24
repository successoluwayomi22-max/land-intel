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
export const KNOWN_NIGERIAN_COORDINATES: Record<string, { lat: number; lng: number }> = {
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

/**
 * Detects placeholder, gibberish, or test input string.
 */
export function isNonsenseOrDummy(str?: string | null): boolean {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  if (!s || s.length < 3) return true;

  // Obvious placeholder keywords and keyboard walks
  if (
    /^(qwerty|asdf|zxcv|12345|test|dummy|fake|sample|weere|werey|xyz|abc|none|na|n\/a|null|undefined|blah|foo|bar)/i.test(
      s
    )
  ) {
    return true;
  }

  // Common Yoruba / slang test words meaning crazy or gibberish
  if (s === "weere" || s === "werey" || s === "were") return true;

  // Single character repeats like "aaaaa" or "xxxxxx"
  if (/^(.)\1{3,}$/.test(s)) return true;

  // Substring checks for obvious keyboard mashed strings
  if (s.includes("qwerty") || s.includes("asdfgh") || s.includes("zxcvb")) return true;

  // Words with 5+ consonants and no vowels (e.g. "sdfghjk")
  const words = s.split(/[\s,.-]+/);
  for (const w of words) {
    if (w.length >= 5 && !/[aeiouy]/i.test(w)) return true;
  }

  return false;
}

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

  // Check if address or LGA is clearly placeholder / gibberish
  if (isNonsenseOrDummy(address) || isNonsenseOrDummy(lga)) {
    return {
      found: false,
      status: "INVALID_LOCATION_INPUT",
    };
  }

  const queryParts = [address, lga, state, country].filter(Boolean).join(", ");
  if (!queryParts || queryParts.length < 4) {
    return {
      found: false,
      status: "UNRESOLVABLE_LOCATION",
    };
  }

  const apiKey = GOOGLE_MAPS_API_KEY;

  // 1. Try Google Maps Geocoding API
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryParts)}&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const types: string[] = firstResult.types || [];
        const loc = firstResult.geometry?.location;

        // If the user specified a street address or specific LGA, verify whether Google
        // actually matched the location or just fell back to the broad State or Country!
        const isBroadAdminOnly =
          (types.includes("administrative_area_level_1") || types.includes("country")) &&
          !types.includes("route") &&
          !types.includes("street_address") &&
          !types.includes("sublocality") &&
          !types.includes("sublocality_level_1") &&
          !types.includes("neighborhood") &&
          !types.includes("locality") &&
          !types.includes("establishment") &&
          !types.includes("point_of_interest") &&
          !types.includes("premise");

        if (address && isBroadAdminOnly) {
          // The specific address was NOT found by Google; it only returned the broad state
          return {
            found: false,
            status: "LOCATION_NOT_FOUND",
            isApproximate: true,
          };
        }

        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          return {
            found: true,
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: firstResult.formatted_address,
            placeId: firstResult.place_id,
            status: "OK",
            isApproximate: firstResult.geometry?.location_type === "APPROXIMATE",
          };
        }
      } else if (data.status === "ZERO_RESULTS") {
        return {
          found: false,
          status: "LOCATION_NOT_FOUND",
        };
      }
    } catch (err) {
      console.warn("[GEOCODE] Google Geocoding API notice:", err);
    }
  }

  // 2. OpenStreetMap Nominatim fallback if Google is unavailable or inconclusive
  try {
    const osmQuery = [address, lga, state, country].filter(Boolean).join(", ");
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(osmQuery)}&format=json&limit=1`;
    const osmRes = await fetch(osmUrl, {
      headers: { "User-Agent": "LandIntel-Cadastral-Platform/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      if (Array.isArray(osmData) && osmData.length > 0) {
        const item = osmData[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const itemClass = item.class || "";
        const itemType = item.type || "";

        // If OSM only returned boundary / administrative state, reject fake address
        if (address && (itemClass === "boundary" && itemType === "administrative")) {
          return {
            found: false,
            status: "LOCATION_NOT_FOUND",
            isApproximate: true,
          };
        }

        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            found: true,
            lat,
            lng,
            formattedAddress: item.display_name,
            placeId: String(item.place_id),
            status: "OK",
            isApproximate: false,
          };
        }
      }
    }
  } catch {
    // OSM lookup silent fallback
  }

  // 3. Fallback: If address was provided but failed resolution, do NOT fake coordinates!
  // Return found: false so the UI accurately displays "Location Not Found / Unverified"
  return {
    found: false,
    status: "LOCATION_NOT_FOUND",
  };
}
