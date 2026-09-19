import { JurisdictionAdapter } from "./types";
import { NigeriaAdapter } from "./adapters/nigeria";
import { GhanaAdapter } from "./adapters/ghana";
import { KenyaAdapter } from "./adapters/kenya";
import { UKAdapter } from "./adapters/uk";
import { USAdapter } from "./adapters/us";
import { CanadaAdapter } from "./adapters/canada";
import { SouthAfricaAdapter } from "./adapters/south-africa";
import { UAEAdapter } from "./adapters/uae";
import { AustraliaAdapter } from "./adapters/australia";
import { createFallbackAdapter } from "./adapters/fallback";

const REGISTERED_ADAPTERS: Record<string, JurisdictionAdapter> = {
  NG: NigeriaAdapter,
  GH: GhanaAdapter,
  KE: KenyaAdapter,
  GB: UKAdapter,
  UK: UKAdapter,
  US: USAdapter,
  CA: CanadaAdapter,
  ZA: SouthAfricaAdapter,
  AE: UAEAdapter,
  AU: AustraliaAdapter,
};

export function getJurisdictionAdapter(countryCodeOrName: string): JurisdictionAdapter {
  if (!countryCodeOrName) return NigeriaAdapter;

  const normalized = countryCodeOrName.trim().toUpperCase();

  // Direct code lookup
  if (REGISTERED_ADAPTERS[normalized]) {
    return REGISTERED_ADAPTERS[normalized];
  }

  // Country name lookup
  const nameMap: Record<string, string> = {
    NIGERIA: "NG",
    GHANA: "GH",
    KENYA: "KE",
    "UNITED KINGDOM": "GB",
    UK: "GB",
    "UNITED STATES": "US",
    USA: "US",
    CANADA: "CA",
    "SOUTH AFRICA": "ZA",
    "UNITED ARAB EMIRATES": "AE",
    UAE: "AE",
    DUBAI: "AE",
    AUSTRALIA: "AU",
  };

  const matchedCode = nameMap[normalized];
  if (matchedCode && REGISTERED_ADAPTERS[matchedCode]) {
    return REGISTERED_ADAPTERS[matchedCode];
  }

  // If not supported yet, return honest fallback adapter
  return createFallbackAdapter(normalized, countryCodeOrName);
}

export function listSupportedJurisdictions(): Array<{
  countryCode: string;
  name: string;
  supportLevel: string;
  supportLevelNotice?: string;
  legalSystem: string;
  currency: string;
  documentCount: number;
}> {
  return Object.values(REGISTERED_ADAPTERS).map((a) => ({
    countryCode: a.countryCode,
    name: a.name,
    supportLevel: a.supportLevel,
    supportLevelNotice: a.supportLevelNotice,
    legalSystem: a.legalSystem,
    currency: a.primaryCurrency,
    documentCount: a.commonDocuments.length,
  }));
}
