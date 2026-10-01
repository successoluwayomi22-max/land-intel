import { GOOGLE_MAPS_API_KEY } from "@/lib/security/credentials";

export interface GeocodeResult {
  found: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  placeId?: string;
  status: string;
  isApproximate?: boolean;
  country?: string;
  jurisdictionCode?: string;
}

/**
 * Strips emoji flags, symbols, and generic placeholder terms from country strings.
 * e.g., "United Kingdom 🇬🇧" -> "United Kingdom", "Other / International 🌐" -> ""
 */
export function cleanCountryName(country?: string | null): string {
  if (!country) return "";
  const c = country
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[^\w\s-]/g, "")
    .trim();
  if (/^(other|international|global|worldwide|all)$/i.test(c)) return "";
  return c;
}

// Well-known cadastral anchor coordinates for Nigerian states, LGAs, and prime commercial/residential zones
export const KNOWN_NIGERIAN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Lagos High-Density & Commercial Zones
  "victoria island": { lat: 6.4281, lng: 3.4219 },
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

// Well-known cadastral anchor coordinates for major global cities & commercial capitals
export const KNOWN_GLOBAL_COORDINATES: Record<string, { lat: number; lng: number; country: string; code: string }> = {
  // United Kingdom 🇬🇧
  "canary wharf": { lat: 51.5054, lng: -0.0209, country: "United Kingdom", code: "GB" },
  westminster: { lat: 51.4975, lng: -0.1357, country: "United Kingdom", code: "GB" },
  london: { lat: 51.5074, lng: -0.1278, country: "United Kingdom", code: "GB" },
  manchester: { lat: 53.4808, lng: -2.2426, country: "United Kingdom", code: "GB" },
  birmingham: { lat: 52.4862, lng: -1.8904, country: "United Kingdom", code: "GB" },
  edinburgh: { lat: 55.9533, lng: -3.1883, country: "United Kingdom", code: "GB" },
  glasgow: { lat: 55.8642, lng: -4.2518, country: "United Kingdom", code: "GB" },

  // United States 🇺🇸
  "new york": { lat: 40.7128, lng: -74.006, country: "United States", code: "US" },
  manhattan: { lat: 40.7831, lng: -73.9712, country: "United States", code: "US" },
  brooklyn: { lat: 40.6782, lng: -73.9442, country: "United States", code: "US" },
  houston: { lat: 29.7604, lng: -95.3698, country: "United States", code: "US" },
  austin: { lat: 30.2672, lng: -97.7431, country: "United States", code: "US" },
  dallas: { lat: 32.7767, lng: -96.797, country: "United States", code: "US" },
  "los angeles": { lat: 34.0522, lng: -118.2437, country: "United States", code: "US" },
  "san francisco": { lat: 37.7749, lng: -122.4194, country: "United States", code: "US" },
  chicago: { lat: 41.8781, lng: -87.6298, country: "United States", code: "US" },
  miami: { lat: 25.7617, lng: -80.1918, country: "United States", code: "US" },
  atlanta: { lat: 33.749, lng: -84.388, country: "United States", code: "US" },
  seattle: { lat: 47.6062, lng: -122.3321, country: "United States", code: "US" },

  // Canada 🇨🇦
  toronto: { lat: 43.6532, lng: -79.3832, country: "Canada", code: "CA" },
  vancouver: { lat: 49.2827, lng: -123.1207, country: "Canada", code: "CA" },
  montreal: { lat: 45.5017, lng: -73.5673, country: "Canada", code: "CA" },
  calgary: { lat: 51.0447, lng: -114.0719, country: "Canada", code: "CA" },

  // United Arab Emirates 🇦🇪
  "downtown dubai": { lat: 25.1972, lng: 55.2744, country: "United Arab Emirates", code: "AE" },
  "dubai marina": { lat: 25.0805, lng: 55.1403, country: "United Arab Emirates", code: "AE" },
  "business bay": { lat: 25.1857, lng: 55.2675, country: "United Arab Emirates", code: "AE" },
  "palm jumeirah": { lat: 25.1124, lng: 55.139, country: "United Arab Emirates", code: "AE" },
  dubai: { lat: 25.2048, lng: 55.2708, country: "United Arab Emirates", code: "AE" },
  "abu dhabi": { lat: 24.4539, lng: 54.3773, country: "United Arab Emirates", code: "AE" },
  sharjah: { lat: 25.3463, lng: 55.4209, country: "United Arab Emirates", code: "AE" },

  // Kenya 🇰🇪
  westlands: { lat: -1.2674, lng: 36.811, country: "Kenya", code: "KE" },
  kilimani: { lat: -1.2921, lng: 36.7856, country: "Kenya", code: "KE" },
  karen: { lat: -1.3197, lng: 36.7065, country: "Kenya", code: "KE" },
  nairobi: { lat: -1.2921, lng: 36.8219, country: "Kenya", code: "KE" },
  mombasa: { lat: -4.0435, lng: 39.6682, country: "Kenya", code: "KE" },

  // South Africa 🇿🇦
  sandton: { lat: -26.1076, lng: 28.0567, country: "South Africa", code: "ZA" },
  rosebank: { lat: -26.1465, lng: 28.0416, country: "South Africa", code: "ZA" },
  johannesburg: { lat: -26.2041, lng: 28.0473, country: "South Africa", code: "ZA" },
  "cape town": { lat: -33.9249, lng: 18.4241, country: "South Africa", code: "ZA" },
  durban: { lat: -29.8587, lng: 31.0218, country: "South Africa", code: "ZA" },
  pretoria: { lat: -25.7479, lng: 28.2293, country: "South Africa", code: "ZA" },

  // Ghana 🇬🇭
  "east legon": { lat: 5.6358, lng: -0.1587, country: "Ghana", code: "GH" },
  cantonments: { lat: 5.5802, lng: -0.1775, country: "Ghana", code: "GH" },
  accra: { lat: 5.6037, lng: -0.187, country: "Ghana", code: "GH" },
  tema: { lat: 5.6698, lng: -0.0166, country: "Ghana", code: "GH" },
  kumasi: { lat: 6.6885, lng: -1.6244, country: "Ghana", code: "GH" },

  // Australia 🇦🇺
  sydney: { lat: -33.8688, lng: 151.2093, country: "Australia", code: "AU" },
  melbourne: { lat: -37.8136, lng: 144.9631, country: "Australia", code: "AU" },
  brisbane: { lat: -27.4698, lng: 153.0251, country: "Australia", code: "AU" },

  // Europe 🇪🇺
  paris: { lat: 48.8566, lng: 2.3522, country: "France", code: "FR" },
  berlin: { lat: 52.52, lng: 13.405, country: "Germany", code: "DE" },
  madrid: { lat: 40.4168, lng: -3.7038, country: "Spain", code: "ES" },
  rome: { lat: 41.9028, lng: 12.4964, country: "Italy", code: "IT" },
  amsterdam: { lat: 52.3676, lng: 4.9041, country: "Netherlands", code: "NL" },
  dublin: { lat: 53.3498, lng: -6.2603, country: "Ireland", code: "IE" },
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
 * Checks whether the query explicitly targets Nigeria.
 */
function isNigerianContext(text: string, cleanCountry: string, countryCode?: string): boolean {
  if (countryCode?.toUpperCase() === "NG") return true;
  if (/nigeria/i.test(cleanCountry)) return true;
  if (cleanCountry && !/nigeria/i.test(cleanCountry)) return false;
  return /\b(lagos|abuja|fct|lekki|ikoyi|ikeja|eti-osa|ibeju|enugu|rivers|port\s+harcourt|ibadan|kano|kaduna|anambra|calabar|uyo|nigeria)\b/i.test(
    text
  );
}

/**
 * Matches text against curated global and regional cadastral anchors.
 */
function matchCadastralAnchor(
  text: string,
  isNigeria: boolean
): { key: string; lat: number; lng: number; country: string; code: string } | null {
  const lower = text.toLowerCase();

  // 1. Check Global Major Hubs (longest matches first)
  const globalKeys = Object.keys(KNOWN_GLOBAL_COORDINATES).sort((a, b) => b.length - a.length);
  for (const key of globalKeys) {
    const regex = new RegExp(`(^|[\\s,.-])${key}([\\s,.-]|$)`, "i");
    if (regex.test(lower)) {
      return { key, ...KNOWN_GLOBAL_COORDINATES[key] };
    }
  }

  // 2. Check Nigerian Anchors ONLY if context is Nigeria
  if (isNigeria) {
    const ngKeys = Object.keys(KNOWN_NIGERIAN_COORDINATES).sort((a, b) => b.length - a.length);
    for (const key of ngKeys) {
      const regex = new RegExp(`(^|[\\s,.-])${key}([\\s,.-]|$)`, "i");
      if (regex.test(lower)) {
        return { key, ...KNOWN_NIGERIAN_COORDINATES[key], country: "Nigeria", code: "NG" };
      }
    }
  }

  return null;
}

export async function geocodePropertyLocation(params: {
  address?: string;
  lga?: string;
  state?: string;
  country?: string;
  countryCode?: string;
}): Promise<GeocodeResult> {
  const rawAddress = params.address?.trim() || "";
  const lga = params.lga?.trim() || "";
  const state = params.state?.trim() || "";
  const cleanCountry = cleanCountryName(params.country);
  const countryCode = params.countryCode?.trim() || "";

  // Check if address or LGA is clearly placeholder / gibberish
  if (isNonsenseOrDummy(rawAddress) || isNonsenseOrDummy(lga)) {
    return {
      found: false,
      status: "INVALID_LOCATION_INPUT",
    };
  }

  // 1. Direct GPS coordinates parsing (e.g. "51.5074, -0.1278" or "6.4281° N, 3.4219° E")
  const fullInput = `${rawAddress} ${lga} ${state}`;
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
        country: cleanCountry || undefined,
        jurisdictionCode: countryCode || undefined,
      };
    }
  }

  // Determine if this is a Nigerian specific search
  const isNigeria = isNigerianContext(`${rawAddress} ${lga} ${state}`, cleanCountry, countryCode);
  const finalCountry = cleanCountry || (isNigeria ? "Nigeria" : "");

  // Candidate queries for progressive search
  const cleanedAddress = cleanCadastralPrefixes(rawAddress);
  const candidateQueries: string[] = [];

  // If address already contains the full location (e.g. "Canary Wharf, London, UK" or "Dubai Marina"), search it directly
  if (rawAddress.length >= 4) {
    candidateQueries.push(rawAddress);
  }

  if (cleanedAddress && cleanedAddress !== rawAddress) {
    candidateQueries.push(cleanedAddress);
  }

  // Combine components if multiple parts exist
  const combined = [cleanedAddress || rawAddress, lga, state, finalCountry].filter(Boolean).join(", ");
  if (combined && !candidateQueries.includes(combined)) {
    candidateQueries.push(combined);
  }

  const regionCombined = [lga, state, finalCountry].filter(Boolean).join(", ");
  if (regionCombined && !candidateQueries.includes(regionCombined)) {
    candidateQueries.push(regionCombined);
  }

  if (candidateQueries.length === 0) {
    return {
      found: false,
      status: "UNRESOLVABLE_LOCATION",
    };
  }

  const apiKey = GOOGLE_MAPS_API_KEY;

  // 2. Try Google Maps Geocoding API if key is available
  if (apiKey) {
    for (const q of candidateQueries.slice(0, 2)) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const data = await res.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const firstResult = data.results[0];
          const types: string[] = firstResult.types || [];
          const loc = firstResult.geometry?.location;

          const isBroadCountryOnly = types.length === 1 && types.includes("country");

          if (!isBroadCountryOnly && loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            return {
              found: true,
              lat: loc.lat,
              lng: loc.lng,
              formattedAddress: firstResult.formatted_address,
              placeId: firstResult.place_id,
              status: "OK",
              isApproximate: firstResult.geometry?.location_type === "APPROXIMATE",
              country: finalCountry || undefined,
            };
          }
        }
      } catch (err) {
        console.warn("[GEOCODE] Google Geocoding API notice:", err);
      }
    }
  }

  // 3. OpenStreetMap Nominatim Fallback (Global Coverage)
  for (const q of candidateQueries) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`;
      const osmRes = await fetch(osmUrl, {
        headers: { "User-Agent": "LandIntel-Global-Cadastral/2.0 (contact@landintel.ai)" },
        signal: AbortSignal.timeout(3500),
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
            const countryResolved = item.address?.country || finalCountry;
            return {
              found: true,
              lat,
              lng,
              formattedAddress: item.display_name,
              placeId: String(item.place_id),
              status: "OK",
              isApproximate: false,
              country: countryResolved,
            };
          }
        }
      }
    } catch {
      // Continue to next candidate query
    }
  }

  // 4. Cadastral Anchor Dictionary Fallback (Instant global & regional cities)
  const fullSearchText = `${rawAddress} ${lga} ${state} ${finalCountry}`;
  const anchorMatch = matchCadastralAnchor(fullSearchText, isNigeria);
  if (anchorMatch) {
    return {
      found: true,
      lat: anchorMatch.lat,
      lng: anchorMatch.lng,
      formattedAddress: `${rawAddress || anchorMatch.key.toUpperCase()}, ${lga || state || anchorMatch.country}`,
      status: "CADASTRAL_ANCHOR_RESOLVED",
      isApproximate: true,
      country: anchorMatch.country,
      jurisdictionCode: anchorMatch.code,
    };
  }

  // 5. Unresolvable location
  return {
    found: false,
    status: "LOCATION_NOT_FOUND",
  };
}
