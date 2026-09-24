/**
 * Official Nigerian Cadastral Jurisdictions, States, Local Government Areas (LGAs),
 * and Location Authenticity Validation for Real Estate Due Diligence.
 */

export const NIGERIAN_STATES: string[] = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

// Normalized aliases (e.g. "Abuja" -> "Federal Capital Territory")
export function normalizeStateName(stateStr?: string | null): string {
  if (!stateStr) return "";
  const s = stateStr.trim().toLowerCase();
  if (s.includes("abuja") || s.includes("fct")) return "Federal Capital Territory";
  if (s.includes("lagos")) return "Lagos";
  if (s.includes("ogun")) return "Ogun";
  if (s.includes("oyo")) return "Oyo";
  if (s.includes("rivers") || s.includes("port harcourt")) return "Rivers";
  if (s.includes("enugu")) return "Enugu";
  if (s.includes("delta")) return "Delta";
  if (s.includes("edo")) return "Edo";
  if (s.includes("anambra")) return "Anambra";
  if (s.includes("kano")) return "Kano";
  if (s.includes("kaduna")) return "Kaduna";
  
  const found = NIGERIAN_STATES.find((st) => st.toLowerCase() === s);
  return found || stateStr.trim();
}

export const CADASTRAL_LGAS_BY_STATE: Record<string, string[]> = {
  Lagos: [
    // 20 Official Statutory LGAs
    "agege", "ajeromi-ifelodun", "ajeromi ifelodun", "alimosho", "amuwo-odofin", "amuwo odofin",
    "apapa", "badagry", "epe", "eti-osa", "eti osa", "ibeju-lekki", "ibeju lekki",
    "ifako-ijaiye", "ifako ijaiye", "ikeja", "ikorodu", "kosofe", "lagos island", "island",
    "lagos mainland", "mainland", "mushin", "ojo", "oshodi-isolo", "oshodi isolo",
    "shomolu", "somolu", "surulere",
    // Prominent Statutory LCDAs & Cadastral Districts
    "lekki", "ikoyi", "victoria island", "vi", "ajah", "sangotedo", "ogombo", "ikate",
    "chevron", "osapa", "osapa london", "agungi", "maroko", "oniru", "banana island",
    "yaba", "ebute metta", "surulere", "maryland", "anthony", "gbagada", "ogudu",
    "magodo", "magodo phase 1", "magodo phase 2", "omole", "omole phase 1", "omole phase 2",
    "allen", "opebi", "gra ikeja", "ikeja gra", "festac", "festac town", "isolo",
    "ejigbo", "igando", "ikotun", "egbeda", "ipaja", "ayobo", "meiran", "abule egba",
    "ojodu", "berger", "ojota", "ketu", "mile 12", "bariga", "akoka", "ilupeju",
    "palmgrove", "onipanu", "fadeyi", "ijora", "marine beach", "apapa gra"
  ],
  "Federal Capital Territory": [
    // 6 Area Councils
    "abuja municipal", "amac", "bwari", "gwagwalada", "kuje", "kwali", "abaji",
    // Cadastral Districts
    "central business district", "cbd", "maitama", "asokoro", "wuse", "wuse 2", "wuse ii",
    "garki", "garki 2", "garki ii", "jabi", "utako", "guzape", "katampe", "katampe extension",
    "gwarinpa", "mabushi", "dakibiyu", "kaura", "duboyi", "gaduwa", "durumi",
    "apo", "lokogoma", "lugbe", "airport road", "dawaki", "kubwa", "dei-dei", "karu",
    "nyanya", "mararaba", "kado", "lifecamp", "life camp", "mpape", "idyll"
  ],
  Ogun: [
    "abeokuta north", "abeokuta south", "ado-odo/ota", "ado odo ota", "ota", "ewekoro",
    "ifo", "ijebu east", "ijebu north", "ijebu north east", "ijebu ode", "ikenne",
    "ilugun-alaro", "imeko afon", "ipokia", "obafemi owode", "odeda", "odogbolu",
    "ogun waterside", "remo north", "shagamu", "sagamu",
    // Cadastral Corridor Districts
    "mowe", "ibafo", "arepo", "magboro", "asese", "opic", "sango", "sango ota", "agbara"
  ],
  Oyo: [
    "ibadan north", "ibadan north-east", "ibadan north-west", "ibadan south-east", "ibadan south-west",
    "akinyela", "akinyele", "egbeda", "ido", "lagelu", "oluyole", "ona ara", "afijio", "atiba",
    "atisbo", "ibarapa central", "ibarapa east", "ibarapa north", "irepo", "iseyin", "itesiwaju",
    "iwajowa", "kajola", "ogbomosho north", "ogbomosho south", "ogo oluwa", "olorunsogo",
    "orelope", "oriire", "oyo east", "oyo west", "saki east", "saki west", "surulere",
    "bodija", "agodi", "dugbe", "ring road", "samonda", "alakia", "olodo", "iwo road"
  ],
  Rivers: [
    "port harcourt", "obio/akpor", "obio akpor", "eleme", "ikwerre", "oyigbo", "okrika",
    "ogu/bolo", "bonny", "degema", "asari-toru", "akuku-toru", "ahoada east", "ahoada west",
    "abua/odual", "andoni", "emohua", "gokana", "khana", "omuma", "opobo/nkoro", "tai", "etche",
    "old gra", "new gra", "trans amadi", "d-line", "woji", "rumuola", "rumukrushi", "choba"
  ],
  Enugu: [
    "enugu east", "enugu north", "enugu south", "ezeagu", "igbo etiti", "igbo eze north",
    "igbo eze south", "isi uzo", "nkanu east", "nkanu west", "nsukka", "oji river",
    "udenu", "udi", "uzo uwani", "independence layout", "new haven", "trans ekulu", "gra enugu"
  ],
  Delta: [
    "asaba", "warri south", "warri north", "warri south west", "ughelli north", "ughelli south",
    "sapele", "okpe", "uvwie", "ika north east", "ika south", "oshimili south", "oshimili north",
    "isoko north", "isoko south", "ethiope east", "ethiope west", "ndokwa east", "ndokwa west"
  ],
  Edo: [
    "oredo", "ikpoba okha", "egor", "ovia north east", "ovia south west", "uhunmwonde",
    "esani central", "esan north east", "esan south east", "esan west", "etsako central",
    "etsako east", "etsako west", "akoko edo", "benin city", "gra benin"
  ],
  Anambra: [
    "awka north", "awka south", "onitsha north", "onitsha south", "nnewi north", "nnewi south",
    "ogbaru", "idemili north", "idemili south", "aguata", "anambr north", "anambr south",
    "ihiala", "njikoka", "dunukofia", "oyi", "orumba north", "orumba south"
  ],
  Kano: [
    "kano municipal", "fagge", "dala", "gwale", "tarauni", "nassarawa", "kumbotso", "ungogo",
    "dawakin kudu", "dawakin tofa", "bichi", "gezawa", "wudil"
  ],
  Kaduna: [
    "kaduna north", "kaduna south", "chikun", "igabi", "zaria", "sabongari", "kauru",
    "kajuru", "jama'a", "kachia", "kagarko", "sanga"
  ],
  Osun: [
    "osogbo", "ife central", "ife east", "ife north", "ife south", "ilesa east", "ilesa west",
    "ede north", "ede south", "aiyedaade", "aiyedire", "boluwaduro", "boripe", "egbedore",
    "ejigbo", "ifedayo", "ifelodun", "ila", "irepodun", "irewole", "isokan", "iwo",
    "obokun", "odo otin", "ola oluwa", "olorunda", "oriade", "orolu", "atakunmosa east", "atakunmosa west"
  ]
};

/**
 * Checks if a string contains keyboard mashes, consonant clusters, or test words
 */
export function isGibberishOrTestString(str?: string | null): boolean {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  if (s.length < 3) return true;

  // Exact or prefix test patterns
  const testPattern = /^(fake|dummy|test|sample|placeholder|mock|qwerty|asdf|zxcv|1234|wer|weere|werey|were|xyz|abc|null|none|nil|na|n\/a|unspecified)/i;
  if (testPattern.test(s)) return true;

  // Substring match for common keyboard walks
  if (s.includes("qwerty") || s.includes("asdfgh") || s.includes("zxcvb") || s.includes("12345")) {
    return true;
  }

  // Single character repeats anywhere like "aaaaa", "mmmmmm", "||||||"
  if (/(.)\1{3,}/.test(s)) return true;

  // Repetitive pipe or symbol patterns
  if (/^[|\s\-_.,/\\#~=+*!@$%^&()]+$/.test(s)) return true;

  // Consonant clusters: 4 or more consonants in a row (e.g. "gsjdkdjdbe", "qwrtyp", "sdfgh")
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(s)) {
    return true;
  }

  // Tokens analysis
  const tokens = s.split(/[\s,.-]+/);
  for (const t of tokens) {
    if (!t) continue;
    // Any single token made entirely of symbols or repetitive chars
    if (/(.)\1{3,}/.test(t)) return true;
    if (t.length >= 4 && !/[aeiouy0-9]/i.test(t)) return true;
    if (t.length >= 6) {
      const vowelCount = (t.match(/[aeiouy]/gi) || []).length;
      if (vowelCount <= 1 && /[bcdfghjklmnpqrstvwxz]{4,}/i.test(t)) {
        return true;
      }
    }
  }

  return false;
}

export interface LocationValidationResult {
  isValid: boolean;
  isRecognizedState: boolean;
  isRecognizedLga: boolean;
  isGibberish: boolean;
  reasons: string[];
}

/**
 * Validates Nigerian State, LGA, and Address authenticity
 */
export function validateNigerianLocation(params: {
  state?: string | null;
  lga?: string | null;
  address?: string | null;
  title?: string | null;
}): LocationValidationResult {
  const reasons: string[] = [];
  const stateRaw = params.state?.trim() || "";
  const lgaRaw = params.lga?.trim() || "";
  const addressRaw = params.address?.trim() || "";
  const titleRaw = params.title?.trim() || "";

  // 1. Check for gibberish/test inputs
  const isAddressGibberish = isGibberishOrTestString(addressRaw);
  const isLgaGibberish = isGibberishOrTestString(lgaRaw);
  const isTitleGibberish = isGibberishOrTestString(titleRaw);
  const isGibberish = isAddressGibberish || isLgaGibberish || isTitleGibberish;

  if (isAddressGibberish) {
    reasons.push(`The submitted address "${addressRaw}" is synthetic or unverified keyboard input`);
  }
  if (isLgaGibberish) {
    reasons.push(`The submitted LGA/District "${lgaRaw}" is synthetic or unverified keyboard input`);
  }
  if (isTitleGibberish) {
    reasons.push(`The property title "${titleRaw}" contains placeholder or test markers`);
  }

  // 2. Validate State
  const normalizedState = normalizeStateName(stateRaw);
  const isRecognizedState = NIGERIAN_STATES.some(
    (st) => st.toLowerCase() === normalizedState.toLowerCase()
  );

  if (!isRecognizedState && stateRaw.length > 0) {
    reasons.push(`"${stateRaw}" is not a recognized Nigerian State or Federal Territory`);
  }

  // 3. Validate LGA within State
  let isRecognizedLga = false;
  if (isRecognizedState && lgaRaw.length > 0) {
    const knownLgas = CADASTRAL_LGAS_BY_STATE[normalizedState];
    const lgaLower = lgaRaw.toLowerCase();

    if (knownLgas && knownLgas.length > 0) {
      isRecognizedLga = knownLgas.some(
        (known) => lgaLower === known || lgaLower.includes(known) || known.includes(lgaLower)
      );

      if (!isRecognizedLga) {
        reasons.push(
          `"${lgaRaw}" is not a recognized Local Government Area (LGA) or statutory district in ${normalizedState}`
        );
      }
    } else {
      // For states without full dictionary yet, accept non-gibberish LGA
      isRecognizedLga = !isLgaGibberish && lgaRaw.length >= 3;
    }
  }

  const isValid = reasons.length === 0;

  return {
    isValid,
    isRecognizedState,
    isRecognizedLga,
    isGibberish,
    reasons,
  };
}
