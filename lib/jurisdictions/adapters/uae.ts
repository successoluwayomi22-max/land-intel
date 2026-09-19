import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const UAEAdapter: JurisdictionAdapter = {
  countryCode: "AE",
  name: "United Arab Emirates (Dubai / Abu Dhabi)",
  legalSystem: "Civil Law / Sharia Principles (Dubai Law No. 7 of 2006)",
  landRegistrationSystem: "Dubai Land Department (DLD) / Abu Dhabi Real Estate Centre (ADREC)",
  primaryCurrency: "AED",
  timezone: "Asia/Dubai",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "DLD Title Deed validation, Oqood off-plan contract review, and Ejari registration checks supported.",

  officialRegistries: [
    {
      name: "Dubai Land Department (DLD / Rest App)",
      description: "Custodian of real estate titles, mortgages, and ownership certificates in Dubai.",
      level: "STATE_PROVINCIAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Real Estate Regulatory Agency (RERA)",
      description: "Regulates developer escrow accounts, broker licenses, and tenancy contracts (Ejari).",
      level: "STATE_PROVINCIAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "TITLE_DEED_DLD",
      label: "DLD Electronic Title Deed Certificate",
      description: "Official title deed issued by Dubai Land Department with digital QR code verification.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "OQOOD_CERTIFICATE",
      label: "Oqood Initial Contract of Sale",
      description: "Pre-registration of off-plan property units in the interim real estate register.",
      isStatutoryTitle: true,
      requiresCadastralCheck: false,
    },
    {
      id: "MOU_FORM_F",
      label: "Form F (Unified Contract of Sale)",
      description: "Standard real estate purchase contract executed between buyer and seller through licensed brokers.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
  ],

  verificationChecklist: [
    {
      key: "dld_qr_title_verification",
      title: "Dubai Land Department Digital QR Title Search",
      description: "Scan title deed QR code on the Dubai REST app to verify genuine registration, owner, and active mortgages.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "noc_developer_verification",
      title: "Developer No Objection Certificate (NOC)",
      description: "Confirm all service charges are paid and developer approves title transfer without pending disputes.",
      requiresProfessional: false,
      category: "TRANSACTION" as any,
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("dubai land department") || lower.includes("title deed certificate") || lower.includes("dld")) {
      return {
        category: "TITLE_DEED_DLD",
        categoryLabel: "DLD Title Deed Certificate",
        confidence: 0.96,
        summary: "Official Dubai Land Department Title Deed Certificate with QR authentication.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("oqood") || lower.includes("interim real estate register")) {
      return {
        category: "OQOOD_CERTIFICATE",
        categoryLabel: "Oqood Initial Contract",
        confidence: 0.94,
        summary: "Oqood off-plan pre-registration certificate issued by DLD.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting UAE real estate document.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const munMatch = text.match(/(?:municipality\s+number|plot\s+number|unit\s+number)\s*[:.]?\s*([A-Za-z0-9\/-]+)/i);
    if (munMatch) {
      fields.push({
        fieldName: "unit_plot_number",
        fieldValue: munMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.93,
        sourceSnippet: munMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    return [];
  },
};
