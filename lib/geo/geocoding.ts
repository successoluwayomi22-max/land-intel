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

// Well-known cadastral anchor coordinates for Nigerian states, LGAs, and prime commercial/residential zones
export const KNOWN_NIGERIAN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Lagos High-Density & Commercial Zones
  "victoria island": { lat: 6.4281, lng: 3.4219 },
  vi: { lat: 6.4281, lng: 3.4219 },
  ikoyi: { lat: 6.4521, lng: 3.4357 },
  "banana island": { lat: 6.4604, lng: 3.4475 },
  "lekki phase 1": { lat: 6.4364, lng: 3.4555 },
  lekki: { lat: 6.4698, lng: 3.5852 },
  "eti-osa": { lat: 6.4584, lng: 3.6015 },
  "eti osa": { lat: 6.4584, lng: 3.6015 },
  "ibeju-lekki": { lat: 6.4947, lng: 3.9056 },
  "ibeju lekki": { lat: 6.4947, lng: 3.9056 },
  ajah: { lat: 6.4678, lng: 3.5684 },
  sangotedo: { lat: 6.4719, lng: 3.6267 },
  chevron: { lat: 6.4384, lng: 3.5283 },
  epe: { lat: 6.5841, lng: 3.9833 },
  ikeja: { lat: 6.6018, lng: 3.3515 },
  "ikeja gra": { lat: 6.5915, lng: 3.3582 },
  maryland: { lat: 6.5728, lng: 3.3681 },
  magodo: { lat: 6.6192, lng: 3.3831 },
  ogba: { lat: 6.6347, lng: 3.3421 },
  gbagada: { lat: 6.5547, lng: 3.3892 },
  yaba: { lat: 6.5181, lng: 3.3768 },
  surulere: { lat: 6.4975, lng: 3.3556 },
  festac: { lat: 6.4698, lng: 3.2833 },
  alaba: { lat: 6.4586, lng: 3.1972 },
  badagry: { lat: 6.4253, lng: 2.8809 },
  lagos: { lat: 6.5244, lng: 3.3792 },

  // Abuja FCT Cadastral Zones
  maitama: { lat: 9.0882, lng: 7.4985 },
  asokoro: { lat: 9.0436, lng: 7.5256 },
  "wuse 2": { lat: 9.0754, lng: 7.4721 },
  wuse: { lat: 9.0658, lng: 7.4644 },
  garki: { lat: 9.0305, lng: 7.4871 },
  guzape: { lat: 9.0336, lng: 7.5385 },
  jabi: { lat: 9.0754, lng: 7.4243 },
  gwarinpa: { lat: 9.1105, lng: 7.3826 },
  katampe: { lat: 9.1082, lng: 7.4605 },
  lugbe: { lat: 8.9836, lng: 7.3752 },
  kubwa: { lat: 9.1554, lng: 7.3326 },
  abuja: { lat: 9.0765, lng: 7.3986 },
  fct: { lat: 9.0765, lng: 7.3986 },

  // State Capitals & Regional Hubs
  "port harcourt": { lat: 4.8156, lng: 7.0498 },
  rivers: { lat: 4.8156, lng: 7.0498 },
  ibadan: { lat: 7.3775, lng: 3.947 },
  oyo: { lat: 7.3775, lng: 3.947 },
  abeokuta: { lat: 7.1475, lng: 3.3619 },
  ogun: { lat: 7.1475, lng: 3.3619 },
  enugu: { lat: 6.4584, lng: 7.5464 },
  awka: { lat: 6.2209, lng: 7.0673 },
  anambra: { lat: 6.2209, lng: 7.0673 },
  onitsha: { lat: 6.1498, lng: 6.7856 },
  asaba: { lat: 6.1984, lng: 6.7328 },
  warri: { lat: 5.5174, lng: 5.7501 },
  delta: { lat: 5.5325, lng: 5.8987 },
  "benin city": { lat: 6.335, lng: 5.6037 },
  edo: { lat: 6.335, lng: 5.6037 },
  kano: { lat: 12.0022, lng: 8.592 },
  kaduna: { lat: 10.5105, lng: 7.4165 },
  calabar: { lat: 4.9589, lng: 8.3269 },
  uyo: { lat: 5.0377, lng: 7.9128 },
  jos: { lat: 9.8965, lng: 8.8583 },
  ilorin: { lat: 8.4966, lng: 4.5421 },
  owerri: { lat: 5.4836, lng: 7.0332 },
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

/**
 * Strips cadastral prefixes that search engines don't index (e.g. "Plot 14", "Block 8", "Parcel 24B")
 * so geocoders can find the actual street, avenue, or neighborhood.
 */
function cleanCadastralPrefixes(str: string): string {
  return str
    .replace(/\b(plot|block|parcel|no\.?|number|suite|flat|cadastral|sector|zone)\s+[\w\d/-]+/gi, "")
    .replace(/[,;]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Matches text against the curated cadastral anchor dictionary.
 */
function matchKnownCadastralAnchor(text: string): { key: string; lat: number; lng: number } | null {
  const lower = text.toLowerCase();
  // Sort longer keys first so specific areas ("victoria island") match before broader regions ("lagos")
  const sortedKeys = Object.keys(KNOWN_NIGERIAN_COORDINATES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    // Word boundary or comma check for precision
    const regex = new RegExp(`(^|[\\s,.-])${key}([\\s,.-]|$)`, "i");
    if (regex.test(lower)) {
      return { key, ...KNOWN_NIGERIAN_COORDINATES[key] };
    }
  }
  return null;
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

  // 1. Direct GPS coordinates parsing (e.g., "6.4281, 3.4219" or "6.4281° N, 3.4219° E")
  const fullInput = `${address} ${lga}`;
  const coordMatch = fullInput.match(/([-+]?\d{1,2}\.\d+)[^\d\-+]+([-+]?\d{1,3}\.\d+)/);
  if (coordMatch) {
    const parsedLat = parseFloat(coordMatch[1]);
    const parsedLng = parseFloat(coordMatch[2]);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && Math.abs(parsedLat) <= 90 && Math.abs(parsedLng) <= 180) {
      return {
        found: true,
        lat: parsedLat,
        lng: parsedLng,
        formattedAddress: `${parsedLat.toFixed(5)}, ${parsedLng.toFixed(5)}`,
        status: "OK",
        isApproximate: false,
      };
    }
  }

  const queryParts = [address, lga, state, country].filter(Boolean).join(", ");
  if (!queryParts || queryParts.length < 4) {
    return {
      found: false,
      status: "UNRESOLVABLE_LOCATION",
    };
  }

  const apiKey = GOOGLE_MAPS_API_KEY;

  // 2. Try Google Maps Geocoding API if key is available
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryParts)}&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const types: string[] = firstResult.types || [];
        const loc = firstResult.geometry?.location;

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

        if (!isBroadAdminOnly && loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
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
      }
    } catch (err) {
      console.warn("[GEOCODE] Google Geocoding API notice:", err);
    }
  }

  // 3. OpenStreetMap Nominatim Fallback with Cadastral Cleaning
  // Progressive search: Full query -> Cleaned street query -> Area / LGA query
  const cleanedAddress = cleanCadastralPrefixes(address);
  const candidateQueries = [
    queryParts,
    cleanedAddress ? [cleanedAddress, lga, state, country].filter(Boolean).join(", ") : null,
    [lga, state, country].filter(Boolean).join(", "),
  ].filter(Boolean) as string[];

  for (const q of candidateQueries) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
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

          // Reject if it only resolved the entire country
          if (itemType === "country" || itemClass === "country") {
            continue;
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
      // Continue to next candidate query
    }
  }

  // 4. Local Cadastral Anchor Match (Instant offline fallback for Nigerian cities, LGAs, and districts)
  const fullSearchText = `${address} ${lga} ${state}`;
  const anchorMatch = matchKnownCadastralAnchor(fullSearchText);
  if (anchorMatch) {
    return {
      found: true,
      lat: anchorMatch.lat,
      lng: anchorMatch.lng,
      formattedAddress: `${address || anchorMatch.key.toUpperCase()}, ${lga || state}, ${country}`,
      status: "CADASTRAL_ANCHOR_RESOLVED",
      isApproximate: true,
    };
  }

  // 5. Unresolvable location
  return {
    found: false,
    status: "LOCATION_NOT_FOUND",
  };
}
