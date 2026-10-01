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

// Well-known cadastral anchor coordinates for all 36 Nigerian states, FCT, LGAs, and prime commercial/residential zones
export const KNOWN_NIGERIAN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Lagos State & Prime Corridors
  "victoria island": { lat: 6.4281, lng: 3.4219 },
  ikoyi: { lat: 6.4521, lng: 3.4357 },
  "banana island": { lat: 6.4604, lng: 3.4475 },
  "lekki phase 1": { lat: 6.4364, lng: 3.4555 },
  "lekki phase 2": { lat: 6.4698, lng: 3.5852 },
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
  alausa: { lat: 6.6186, lng: 3.3592 },
  maryland: { lat: 6.5728, lng: 3.3681 },
  magodo: { lat: 6.6192, lng: 3.3831 },
  ogba: { lat: 6.6347, lng: 3.3421 },
  gbagada: { lat: 6.5547, lng: 3.3892 },
  ogudu: { lat: 6.5744, lng: 3.3922 },
  yaba: { lat: 6.5181, lng: 3.3768 },
  surulere: { lat: 6.4975, lng: 3.3556 },
  festac: { lat: 6.4698, lng: 3.2833 },
  "amuwo odofin": { lat: 6.4632, lng: 3.2982 },
  alaba: { lat: 6.4586, lng: 3.1972 },
  badagry: { lat: 6.4253, lng: 2.8809 },
  ikorodu: { lat: 6.6169, lng: 3.5081 },
  alimosho: { lat: 6.6084, lng: 3.2667 },
  oshodi: { lat: 6.5511, lng: 3.3444 },
  agege: { lat: 6.6181, lng: 3.3208 },
  ojodu: { lat: 6.6436, lng: 3.3622 },
  lagos: { lat: 6.5244, lng: 3.3792 },

  // Abuja FCT Cadastral Zones
  maitama: { lat: 9.0882, lng: 7.4985 },
  asokoro: { lat: 9.0436, lng: 7.5256 },
  "wuse 2": { lat: 9.0754, lng: 7.4721 },
  wuse: { lat: 9.0658, lng: 7.4644 },
  garki: { lat: 9.0305, lng: 7.4871 },
  guzape: { lat: 9.0336, lng: 7.5385 },
  jabi: { lat: 9.0754, lng: 7.4243 },
  utako: { lat: 9.0628, lng: 7.4422 },
  gwarinpa: { lat: 9.1105, lng: 7.3826 },
  katampe: { lat: 9.1082, lng: 7.4605 },
  "katampe extension": { lat: 9.1154, lng: 7.4722 },
  lugbe: { lat: 8.9836, lng: 7.3752 },
  kubwa: { lat: 9.1554, lng: 7.3326 },
  apo: { lat: 9.0084, lng: 7.5022 },
  "life camp": { lat: 9.0722, lng: 7.3911 },
  lokogoma: { lat: 8.9811, lng: 7.4622 },
  dawaki: { lat: 9.1354, lng: 7.3982 },
  mpape: { lat: 9.1382, lng: 7.4982 },
  kuje: { lat: 8.8786, lng: 7.2275 },
  bwari: { lat: 9.2833, lng: 7.3833 },
  gwagwalada: { lat: 8.9431, lng: 7.0867 },
  "central business district abuja": { lat: 9.0579, lng: 7.4951 },
  abuja: { lat: 9.0765, lng: 7.3986 },
  fct: { lat: 9.0765, lng: 7.3986 },

  // All 36 Nigerian State Capitals & Prime Industrial/Residential Hubs
  // Abia
  umuahia: { lat: 5.5265, lng: 7.4896 },
  aba: { lat: 5.1066, lng: 7.3667 },
  abia: { lat: 5.4527, lng: 7.5248 },
  // Adamawa
  yola: { lat: 9.2035, lng: 12.4954 },
  mubi: { lat: 10.2676, lng: 13.2644 },
  adamawa: { lat: 9.3265, lng: 12.4414 },
  // Akwa Ibom
  uyo: { lat: 5.0377, lng: 7.9128 },
  eket: { lat: 4.6441, lng: 7.9265 },
  "ikot ekpene": { lat: 5.1844, lng: 7.7144 },
  "akwa ibom": { lat: 5.0513, lng: 7.9332 },
  // Anambra
  awka: { lat: 6.2209, lng: 7.0673 },
  onitsha: { lat: 6.1498, lng: 6.7856 },
  nnewi: { lat: 6.0199, lng: 6.9149 },
  anambra: { lat: 6.2209, lng: 7.0673 },
  // Bauchi
  bauchi: { lat: 10.3158, lng: 9.8442 },
  azare: { lat: 11.6744, lng: 10.1894 },
  // Bayelsa
  yenagoa: { lat: 4.9267, lng: 6.2676 },
  brass: { lat: 4.3144, lng: 6.2411 },
  bayelsa: { lat: 4.7719, lng: 6.0699 },
  // Benue
  makurdi: { lat: 7.7322, lng: 8.5214 },
  gboko: { lat: 7.3194, lng: 9.0022 },
  otukpo: { lat: 7.1908, lng: 8.1325 },
  benue: { lat: 7.3369, lng: 8.7404 },
  // Borno
  maiduguri: { lat: 11.8333, lng: 13.15 },
  borno: { lat: 11.8846, lng: 13.152 },
  // Cross River
  calabar: { lat: 4.9589, lng: 8.3269 },
  ikom: { lat: 5.9644, lng: 8.7111 },
  "cross river": { lat: 5.8702, lng: 8.5988 },
  // Delta
  asaba: { lat: 6.1984, lng: 6.7328 },
  warri: { lat: 5.5174, lng: 5.7501 },
  effurun: { lat: 5.5567, lng: 5.7822 },
  ughelli: { lat: 5.4911, lng: 6.0011 },
  sapele: { lat: 5.8944, lng: 5.6767 },
  delta: { lat: 5.5325, lng: 5.8987 },
  // Ebonyi
  abakaliki: { lat: 6.3249, lng: 8.1137 },
  afikpo: { lat: 5.8911, lng: 7.9356 },
  ebonyi: { lat: 6.2649, lng: 8.0137 },
  // Edo
  "benin city": { lat: 6.335, lng: 5.6037 },
  ekpoma: { lat: 6.7444, lng: 6.1411 },
  auchi: { lat: 7.0678, lng: 6.2731 },
  edo: { lat: 6.5438, lng: 5.8987 },
  // Ekiti
  "ado ekiti": { lat: 7.6211, lng: 5.2214 },
  "ado-ekiti": { lat: 7.6211, lng: 5.2214 },
  ikere: { lat: 7.4982, lng: 5.2311 },
  ekiti: { lat: 7.719, lng: 5.3111 },
  // Enugu
  enugu: { lat: 6.4584, lng: 7.5464 },
  "independence layout": { lat: 6.4382, lng: 7.5192 },
  nsukka: { lat: 6.8566, lng: 7.3958 },
  agbani: { lat: 6.3111, lng: 7.5444 },
  // Gombe
  gombe: { lat: 10.2897, lng: 11.1673 },
  // Imo
  owerri: { lat: 5.4836, lng: 7.0332 },
  orlu: { lat: 5.7958, lng: 7.0353 },
  okigwe: { lat: 5.8294, lng: 7.3514 },
  imo: { lat: 5.572, lng: 7.0588 },
  // Jigawa
  dutse: { lat: 11.7562, lng: 9.339 },
  hadejia: { lat: 12.4497, lng: 10.0444 },
  jigawa: { lat: 12.228, lng: 9.5616 },
  // Kaduna
  kaduna: { lat: 10.5105, lng: 7.4165 },
  zaria: { lat: 11.0855, lng: 7.7199 },
  kafanchan: { lat: 9.5844, lng: 8.2911 },
  barnawa: { lat: 10.4811, lng: 7.4322 },
  // Kano
  kano: { lat: 12.0022, lng: 8.592 },
  fagge: { lat: 12.0122, lng: 8.5311 },
  dala: { lat: 12.0089, lng: 8.5089 },
  // Katsina
  katsina: { lat: 12.9908, lng: 7.6018 },
  daura: { lat: 13.0311, lng: 8.3194 },
  // Kebbi
  "birnin kebbi": { lat: 12.4539, lng: 4.1975 },
  kebbi: { lat: 11.4942, lng: 4.2333 },
  // Kogi
  lokoja: { lat: 7.7969, lng: 6.7406 },
  okene: { lat: 7.5514, lng: 6.2361 },
  kogi: { lat: 7.7337, lng: 6.6906 },
  // Kwara
  ilorin: { lat: 8.4966, lng: 4.5421 },
  offa: { lat: 8.1492, lng: 4.7206 },
  kwara: { lat: 8.9669, lng: 4.6044 },
  // Nasarawa
  lafia: { lat: 8.4932, lng: 8.5153 },
  karu: { lat: 9.0111, lng: 7.5889 },
  mararaba: { lat: 9.0211, lng: 7.6011 },
  nasarawa: { lat: 8.5378, lng: 8.1911 },
  // Niger
  minna: { lat: 9.6139, lng: 6.5569 },
  suleja: { lat: 9.1806, lng: 7.1794 },
  bida: { lat: 9.0833, lng: 6.0167 },
  niger: { lat: 9.9309, lng: 5.5983 },
  // Ogun
  abeokuta: { lat: 7.1475, lng: 3.3619 },
  sagamu: { lat: 6.8489, lng: 3.6464 },
  "ijebu ode": { lat: 6.8206, lng: 3.9206 },
  "ijebu-ode": { lat: 6.8206, lng: 3.9206 },
  mowe: { lat: 6.8089, lng: 3.4411 },
  ibafo: { lat: 6.7411, lng: 3.4211 },
  ota: { lat: 6.6906, lng: 3.2356 },
  arepo: { lat: 6.6889, lng: 3.3989 },
  ogun: { lat: 7.0, lng: 3.5 },
  // Ondo
  akure: { lat: 7.2571, lng: 5.2058 },
  "ondo town": { lat: 7.0911, lng: 4.8322 },
  owo: { lat: 7.1962, lng: 5.5868 },
  ondo: { lat: 7.1, lng: 5.1 },
  // Osun
  osogbo: { lat: 7.7827, lng: 4.5418 },
  "ile ife": { lat: 7.4833, lng: 4.5667 },
  "ile-ife": { lat: 7.4833, lng: 4.5667 },
  ilesa: { lat: 7.6289, lng: 4.7411 },
  osun: { lat: 7.6298, lng: 4.1874 },
  // Oyo
  ibadan: { lat: 7.3775, lng: 3.947 },
  bodija: { lat: 7.4344, lng: 3.9011 },
  oluyole: { lat: 7.3511, lng: 3.8644 },
  "ring road ibadan": { lat: 7.3622, lng: 3.8711 },
  ogbomoso: { lat: 8.1333, lng: 4.25 },
  "oyo town": { lat: 7.8431, lng: 3.9367 },
  oyo: { lat: 8.0, lng: 4.0 },
  // Plateau
  jos: { lat: 9.8965, lng: 8.8583 },
  bukuru: { lat: 9.7944, lng: 8.8644 },
  rayfield: { lat: 9.8411, lng: 8.9111 },
  plateau: { lat: 9.2182, lng: 9.5179 },
  // Rivers
  "port harcourt": { lat: 4.8156, lng: 7.0498 },
  "old gra port harcourt": { lat: 4.7989, lng: 7.0144 },
  "new gra port harcourt": { lat: 4.8211, lng: 6.9989 },
  "obio akpor": { lat: 4.8411, lng: 6.9811 },
  "obio-akpor": { lat: 4.8411, lng: 6.9811 },
  woji: { lat: 4.8189, lng: 7.0611 },
  "trans amadi": { lat: 4.8111, lng: 7.0311 },
  bonny: { lat: 4.4514, lng: 7.1711 },
  eleme: { lat: 4.7811, lng: 7.1211 },
  rivers: { lat: 4.8156, lng: 7.0498 },
  // Sokoto
  sokoto: { lat: 13.0059, lng: 5.2476 },
  // Taraba
  jalingo: { lat: 8.8936, lng: 11.3596 },
  wukari: { lat: 7.8711, lng: 9.7789 },
  taraba: { lat: 7.9897, lng: 10.5186 },
  // Yobe
  damaturu: { lat: 11.747, lng: 11.9608 },
  potiskum: { lat: 11.7089, lng: 11.0811 },
  yobe: { lat: 12.0, lng: 11.5 },
  // Zamfara
  gusau: { lat: 12.1628, lng: 6.6614 },
  zamfara: { lat: 12.1222, lng: 6.2236 },
};

// Well-known cadastral anchor coordinates for major global cities, territories & financial capitals
export const KNOWN_GLOBAL_COORDINATES: Record<string, { lat: number; lng: number; country: string; code: string }> = {
  // United Kingdom 🇬🇧
  "canary wharf": { lat: 51.5054, lng: -0.0209, country: "United Kingdom", code: "GB" },
  westminster: { lat: 51.4975, lng: -0.1357, country: "United Kingdom", code: "GB" },
  "city of london": { lat: 51.5123, lng: -0.0907, country: "United Kingdom", code: "GB" },
  kensington: { lat: 51.5014, lng: -0.1919, country: "United Kingdom", code: "GB" },
  chelsea: { lat: 51.4875, lng: -0.1687, country: "United Kingdom", code: "GB" },
  camden: { lat: 51.5455, lng: -0.1416, country: "United Kingdom", code: "GB" },
  greenwich: { lat: 51.4826, lng: -0.0077, country: "United Kingdom", code: "GB" },
  london: { lat: 51.5074, lng: -0.1278, country: "United Kingdom", code: "GB" },
  manchester: { lat: 53.4808, lng: -2.2426, country: "United Kingdom", code: "GB" },
  salford: { lat: 53.4875, lng: -2.2901, country: "United Kingdom", code: "GB" },
  birmingham: { lat: 52.4862, lng: -1.8904, country: "United Kingdom", code: "GB" },
  edinburgh: { lat: 55.9533, lng: -3.1883, country: "United Kingdom", code: "GB" },
  glasgow: { lat: 55.8642, lng: -4.2518, country: "United Kingdom", code: "GB" },
  leeds: { lat: 53.8008, lng: -1.5491, country: "United Kingdom", code: "GB" },
  liverpool: { lat: 53.4084, lng: -2.9916, country: "United Kingdom", code: "GB" },
  bristol: { lat: 51.4545, lng: -2.5879, country: "United Kingdom", code: "GB" },
  oxford: { lat: 51.752, lng: -1.2577, country: "United Kingdom", code: "GB" },
  cambridge: { lat: 52.2053, lng: 0.1218, country: "United Kingdom", code: "GB" },
  newcastle: { lat: 54.9783, lng: -1.6178, country: "United Kingdom", code: "GB" },
  sheffield: { lat: 53.3811, lng: -1.4701, country: "United Kingdom", code: "GB" },
  cardiff: { lat: 51.4816, lng: -3.1791, country: "United Kingdom", code: "GB" },
  belfast: { lat: 54.5973, lng: -5.9301, country: "United Kingdom", code: "GB" },

  // United States 🇺🇸
  "new york": { lat: 40.7128, lng: -74.006, country: "United States", code: "US" },
  manhattan: { lat: 40.7831, lng: -73.9712, country: "United States", code: "US" },
  brooklyn: { lat: 40.6782, lng: -73.9442, country: "United States", code: "US" },
  queens: { lat: 40.7282, lng: -73.7949, country: "United States", code: "US" },
  bronx: { lat: 40.8448, lng: -73.8648, country: "United States", code: "US" },
  houston: { lat: 29.7604, lng: -95.3698, country: "United States", code: "US" },
  austin: { lat: 30.2672, lng: -97.7431, country: "United States", code: "US" },
  dallas: { lat: 32.7767, lng: -96.797, country: "United States", code: "US" },
  "fort worth": { lat: 32.7555, lng: -97.3308, country: "United States", code: "US" },
  "san antonio": { lat: 29.4241, lng: -98.4936, country: "United States", code: "US" },
  "los angeles": { lat: 34.0522, lng: -118.2437, country: "United States", code: "US" },
  "beverly hills": { lat: 34.0736, lng: -118.4004, country: "United States", code: "US" },
  "san francisco": { lat: 37.7749, lng: -122.4194, country: "United States", code: "US" },
  "silicon valley": { lat: 37.3875, lng: -122.0575, country: "United States", code: "US" },
  "san jose": { lat: 37.3382, lng: -121.8863, country: "United States", code: "US" },
  chicago: { lat: 41.8781, lng: -87.6298, country: "United States", code: "US" },
  miami: { lat: 25.7617, lng: -80.1918, country: "United States", code: "US" },
  "fort lauderdale": { lat: 26.1224, lng: -80.1373, country: "United States", code: "US" },
  orlando: { lat: 28.5383, lng: -81.3792, country: "United States", code: "US" },
  tampa: { lat: 27.9506, lng: -82.4572, country: "United States", code: "US" },
  atlanta: { lat: 33.749, lng: -84.388, country: "United States", code: "US" },
  seattle: { lat: 47.6062, lng: -122.3321, country: "United States", code: "US" },
  boston: { lat: 42.3601, lng: -71.0589, country: "United States", code: "US" },
  denver: { lat: 39.7392, lng: -104.9903, country: "United States", code: "US" },
  phoenix: { lat: 33.4484, lng: -112.074, country: "United States", code: "US" },
  "las vegas": { lat: 36.1699, lng: -115.1398, country: "United States", code: "US" },
  "washington dc": { lat: 38.9072, lng: -77.0369, country: "United States", code: "US" },
  philadelphia: { lat: 39.9526, lng: -75.1652, country: "United States", code: "US" },
  nashville: { lat: 36.1627, lng: -86.7816, country: "United States", code: "US" },
  charlotte: { lat: 35.2271, lng: -80.8431, country: "United States", code: "US" },

  // Canada 🇨🇦
  toronto: { lat: 43.6532, lng: -79.3832, country: "Canada", code: "CA" },
  "downtown toronto": { lat: 43.6532, lng: -79.3832, country: "Canada", code: "CA" },
  mississauga: { lat: 43.589, lng: -79.6441, country: "Canada", code: "CA" },
  brampton: { lat: 43.7315, lng: -79.7624, country: "Canada", code: "CA" },
  vancouver: { lat: 49.2827, lng: -123.1207, country: "Canada", code: "CA" },
  richmond: { lat: 49.1666, lng: -123.1336, country: "Canada", code: "CA" },
  burnaby: { lat: 49.2488, lng: -122.9805, country: "Canada", code: "CA" },
  surrey: { lat: 49.1913, lng: -122.849, country: "Canada", code: "CA" },
  montreal: { lat: 45.5017, lng: -73.5673, country: "Canada", code: "CA" },
  calgary: { lat: 51.0447, lng: -114.0719, country: "Canada", code: "CA" },
  edmonton: { lat: 53.5461, lng: -113.4938, country: "Canada", code: "CA" },
  ottawa: { lat: 45.4215, lng: -75.6972, country: "Canada", code: "CA" },

  // United Arab Emirates 🇦🇪
  "downtown dubai": { lat: 25.1972, lng: 55.2744, country: "United Arab Emirates", code: "AE" },
  "dubai marina": { lat: 25.0805, lng: 55.1403, country: "United Arab Emirates", code: "AE" },
  "business bay": { lat: 25.1857, lng: 55.2675, country: "United Arab Emirates", code: "AE" },
  "palm jumeirah": { lat: 25.1124, lng: 55.139, country: "United Arab Emirates", code: "AE" },
  "dubai hills": { lat: 25.1054, lng: 55.2444, country: "United Arab Emirates", code: "AE" },
  difc: { lat: 25.2122, lng: 55.2789, country: "United Arab Emirates", code: "AE" },
  jlt: { lat: 25.0744, lng: 55.1489, country: "United Arab Emirates", code: "AE" },
  jumeirah: { lat: 25.1989, lng: 55.2411, country: "United Arab Emirates", code: "AE" },
  dubai: { lat: 25.2048, lng: 55.2708, country: "United Arab Emirates", code: "AE" },
  "abu dhabi": { lat: 24.4539, lng: 54.3773, country: "United Arab Emirates", code: "AE" },
  "al reem island": { lat: 24.4989, lng: 54.4089, country: "United Arab Emirates", code: "AE" },
  "yas island": { lat: 24.4989, lng: 54.6089, country: "United Arab Emirates", code: "AE" },
  sharjah: { lat: 25.3463, lng: 55.4209, country: "United Arab Emirates", code: "AE" },

  // Saudi Arabia 🇸🇦 & Qatar 🇶🇦
  riyadh: { lat: 24.7136, lng: 46.6753, country: "Saudi Arabia", code: "SA" },
  jeddah: { lat: 21.5433, lng: 39.1728, country: "Saudi Arabia", code: "SA" },
  doha: { lat: 25.2854, lng: 51.531, country: "Qatar", code: "QA" },

  // Kenya 🇰🇪
  westlands: { lat: -1.2674, lng: 36.811, country: "Kenya", code: "KE" },
  kilimani: { lat: -1.2921, lng: 36.7856, country: "Kenya", code: "KE" },
  karen: { lat: -1.3197, lng: 36.7065, country: "Kenya", code: "KE" },
  "upper hill": { lat: -1.2994, lng: 36.8189, country: "Kenya", code: "KE" },
  langata: { lat: -1.3628, lng: 36.7644, country: "Kenya", code: "KE" },
  lavington: { lat: -1.2822, lng: 36.7711, country: "Kenya", code: "KE" },
  runda: { lat: -1.2189, lng: 36.8222, country: "Kenya", code: "KE" },
  nairobi: { lat: -1.2921, lng: 36.8219, country: "Kenya", code: "KE" },
  mombasa: { lat: -4.0435, lng: 39.6682, country: "Kenya", code: "KE" },
  nyali: { lat: -4.0289, lng: 39.7111, country: "Kenya", code: "KE" },
  kisumu: { lat: -0.0917, lng: 34.768, country: "Kenya", code: "KE" },
  nakuru: { lat: -0.3031, lng: 36.08, country: "Kenya", code: "KE" },

  // South Africa 🇿🇦
  sandton: { lat: -26.1076, lng: 28.0567, country: "South Africa", code: "ZA" },
  rosebank: { lat: -26.1465, lng: 28.0416, country: "South Africa", code: "ZA" },
  midrand: { lat: -25.9989, lng: 28.1289, country: "South Africa", code: "ZA" },
  fourways: { lat: -26.0189, lng: 28.0089, country: "South Africa", code: "ZA" },
  johannesburg: { lat: -26.2041, lng: 28.0473, country: "South Africa", code: "ZA" },
  "cape town": { lat: -33.9249, lng: 18.4241, country: "South Africa", code: "ZA" },
  "camps bay": { lat: -33.9511, lng: 18.3789, country: "South Africa", code: "ZA" },
  "sea point": { lat: -33.9189, lng: 18.3889, country: "South Africa", code: "ZA" },
  durban: { lat: -29.8587, lng: 31.0218, country: "South Africa", code: "ZA" },
  umhlanga: { lat: -29.7289, lng: 31.0889, country: "South Africa", code: "ZA" },
  pretoria: { lat: -25.7479, lng: 28.2293, country: "South Africa", code: "ZA" },
  centurion: { lat: -25.8603, lng: 28.1894, country: "South Africa", code: "ZA" },

  // Ghana 🇬🇭
  "east legon": { lat: 5.6358, lng: -0.1587, country: "Ghana", code: "GH" },
  cantonments: { lat: 5.5802, lng: -0.1775, country: "Ghana", code: "GH" },
  "airport residential": { lat: 5.6022, lng: -0.1811, country: "Ghana", code: "GH" },
  osu: { lat: 5.5567, lng: -0.1822, country: "Ghana", code: "GH" },
  labone: { lat: 5.5689, lng: -0.1689, country: "Ghana", code: "GH" },
  dzorwulu: { lat: 5.6189, lng: -0.2011, country: "Ghana", code: "GH" },
  accra: { lat: 5.6037, lng: -0.187, country: "Ghana", code: "GH" },
  tema: { lat: 5.6698, lng: -0.0166, country: "Ghana", code: "GH" },
  spintex: { lat: 5.6311, lng: -0.1089, country: "Ghana", code: "GH" },
  kumasi: { lat: 6.6885, lng: -1.6244, country: "Ghana", code: "GH" },

  // Australia 🇦🇺 & New Zealand 🇳🇿
  sydney: { lat: -33.8688, lng: 151.2093, country: "Australia", code: "AU" },
  parramatta: { lat: -33.815, lng: 151.0011, country: "Australia", code: "AU" },
  melbourne: { lat: -37.8136, lng: 144.9631, country: "Australia", code: "AU" },
  brisbane: { lat: -27.4698, lng: 153.0251, country: "Australia", code: "AU" },
  "gold coast": { lat: -28.0167, lng: 153.4, country: "Australia", code: "AU" },
  perth: { lat: -31.9505, lng: 115.8605, country: "Australia", code: "AU" },
  adelaide: { lat: -34.9285, lng: 138.6007, country: "Australia", code: "AU" },
  canberra: { lat: -35.2809, lng: 149.13, country: "Australia", code: "AU" },
  auckland: { lat: -36.8485, lng: 174.7633, country: "New Zealand", code: "NZ" },

  // Europe 🇪🇺
  paris: { lat: 48.8566, lng: 2.3522, country: "France", code: "FR" },
  "la defense": { lat: 48.8922, lng: 2.2378, country: "France", code: "FR" },
  nice: { lat: 43.7102, lng: 7.262, country: "France", code: "FR" },
  berlin: { lat: 52.52, lng: 13.405, country: "Germany", code: "DE" },
  munich: { lat: 48.1351, lng: 11.582, country: "Germany", code: "DE" },
  frankfurt: { lat: 50.1109, lng: 8.6821, country: "Germany", code: "DE" },
  madrid: { lat: 40.4168, lng: -3.7038, country: "Spain", code: "ES" },
  barcelona: { lat: 41.3879, lng: 2.1699, country: "Spain", code: "ES" },
  rome: { lat: 41.9028, lng: 12.4964, country: "Italy", code: "IT" },
  milan: { lat: 45.4642, lng: 9.19, country: "Italy", code: "IT" },
  amsterdam: { lat: 52.3676, lng: 4.9041, country: "Netherlands", code: "NL" },
  rotterdam: { lat: 51.9244, lng: 4.4777, country: "Netherlands", code: "NL" },
  dublin: { lat: 53.3498, lng: -6.2603, country: "Ireland", code: "IE" },
  brussels: { lat: 50.8503, lng: 4.3517, country: "Belgium", code: "BE" },
  zurich: { lat: 47.3769, lng: 8.5417, country: "Switzerland", code: "CH" },
  geneva: { lat: 46.2044, lng: 6.1432, country: "Switzerland", code: "CH" },
  vienna: { lat: 48.2082, lng: 16.3738, country: "Austria", code: "AT" },
  lisbon: { lat: 38.7223, lng: -9.1393, country: "Portugal", code: "PT" },
  warsaw: { lat: 52.2297, lng: 21.0122, country: "Poland", code: "PL" },

  // Asia & Emerging Markets 🌏
  singapore: { lat: 1.3521, lng: 103.8198, country: "Singapore", code: "SG" },
  "hong kong": { lat: 22.3193, lng: 114.1694, country: "Hong Kong", code: "HK" },
  tokyo: { lat: 35.6762, lng: 139.6503, country: "Japan", code: "JP" },
  seoul: { lat: 37.5665, lng: 126.978, country: "South Korea", code: "KR" },
  "kuala lumpur": { lat: 3.139, lng: 101.6869, country: "Malaysia", code: "MY" },
  bangkok: { lat: 13.7563, lng: 100.5018, country: "Thailand", code: "TH" },
  mumbai: { lat: 19.076, lng: 72.8777, country: "India", code: "IN" },
  delhi: { lat: 28.6139, lng: 77.209, country: "India", code: "IN" },
  bengaluru: { lat: 12.9716, lng: 77.5946, country: "India", code: "IN" },
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
