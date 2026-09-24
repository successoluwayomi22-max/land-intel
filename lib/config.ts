export const APP_CONFIG = {
  name: "LandIntel",
  tagline: "Global Property Intelligence — Institutional Cadastral Verification & Title Protection",
  description: "LandIntel provides verified land due-diligence, cadastral boundary intelligence, and title search certification for global real estate and diaspora property investors.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app",
  supportEmail: "support@landintel.ai",
  supportEmailDestination: "successoluwayomi22@gmail.com",
  legalEmail: "support@landintel.ai",
  
  // Centralized Administrative & Support Contact Channels
  platformContact: {
    email: "successoluwayomi22@gmail.com",
    displayEmail: "support@landintel.ai",
    whatsappNumbers: [
      "+2349033084408",
      "+2348077426824"
    ],
    primaryWhatsapp: "+2349033084408",
    secondaryWhatsapp: "+2348077426824",
    facebook: "Oluwayomi Succe",
    facebookUrl: "https://facebook.com/oluwayomi.succe",
    instagram: "oluwayomi_success",
    instagramUrl: "https://instagram.com/oluwayomi_success",
    supportAvailability: "24/7 Dedicated Investor Due-Diligence & Emergency Verification",
    supportMessage: "Have questions about a property document, cadastral boundary, or urgent title search? Contact our senior due-diligence analysts directly.",
  },

  // Primary market
  primaryMarket: "Global Cadastral Systems",
  
  // Pricing & Monetization
  pricing: {
    reportPriceNgn: 45000, // ₦45,000 NGN single certified report
    investorBundleNgn: 95000, // ₦95,000 NGN for 3 properties
    fullTitleVerificationNgn: 175000, // ₦175,000 NGN matching DLS full legal search
    reportPriceUsd: 37,
    currency: "NGN",
    supportedCurrencies: ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "CAD"],
  },

  // Free Tier vs Paid Tier limits
  limits: {
    free: {
      maxCases: 1,
      maxDocumentsPerCase: 2,
      maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedAiQuestionsPerCase: 3,
      canViewDetailedEvidence: false,
      canGenerateFullReport: false,
      canDownloadPdf: false,
    },
    paid: {
      maxCases: 25,
      maxDocumentsPerCase: 30,
      maxFileSizeBytes: 25 * 1024 * 1024, // 25MB
      allowedAiQuestionsPerCase: 100,
      canViewDetailedEvidence: true,
      canGenerateFullReport: true,
      canDownloadPdf: true,
    },
  },

  // Document categories
  documentCategories: [
    { id: "SURVEY_PLAN", label: "Survey Plan", description: "Official cadastral survey showing property boundaries and beacon numbers" },
    { id: "DEED_OF_ASSIGNMENT", label: "Deed of Assignment", description: "Legal document transferring ownership interest from assignor to assignee" },
    { id: "CERTIFICATE_OF_OCCUPANCY", label: "Certificate of Occupancy (C of O)", description: "State government title document granting 99-year leasehold interest" },
    { id: "GOVERNORS_CONSENT", label: "Governor's Consent", description: "Mandatory statutory consent for subsequent transfer of titled land" },
    { id: "GAZETTE", label: "Government Gazette", description: "Official publication detailing government acquisition, excision, or revocation" },
    { id: "ALLOCATION_LETTER", label: "Allocation Letter", description: "Letter from government or developer allocating specific parcel or plot" },
    { id: "EXCISION_DOCUMENT", label: "Excision Document", description: "Government release of gazetted ancestral/community land from state acquisition" },
    { id: "CONTRACT_OF_SALE", label: "Contract of Sale", description: "Agreement specifying terms, purchase consideration, and delivery schedule" },
    { id: "PURCHASE_RECEIPT", label: "Purchase Receipt", description: "Evidence of financial consideration paid to seller or traditional family" },
    { id: "POWER_OF_ATTORNEY", label: "Power of Attorney", description: "Instrument delegating authority to act, sell, or manage on behalf of owner" },
    { id: "OTHER", label: "Other Document", description: "Supporting identification, tax clearance, or layout sketch" },
    { id: "UNKNOWN", label: "Unknown / Unclassified", description: "Document requires classification" },
  ] as const,

  // Nigerian Property Types
  propertyTypes: [
    { id: "LAND", label: "Bare Land / Plot" },
    { id: "RESIDENTIAL", label: "Residential (House / Apartment / Duplex)" },
    { id: "COMMERCIAL", label: "Commercial (Office / Plaza / Retail)" },
    { id: "AGRICULTURAL", label: "Agricultural / Farmland" },
    { id: "MIXED_USE", label: "Mixed-Use" },
    { id: "OTHER", label: "Other" },
  ] as const,

  // Nigerian States
  states: [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
    "Taraba", "Yobe", "Zamfara"
  ] as const,

  // Risk Indicator Scales
  riskTiers: {
    LOW: { min: 0, max: 20, label: "LOW RISK", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    MODERATE: { min: 21, max: 40, label: "MODERATE RISK", color: "text-blue-700 bg-blue-50 border-blue-200" },
    ELEVATED: { min: 41, max: 60, label: "ELEVATED RISK", color: "text-amber-700 bg-amber-50 border-amber-200" },
    HIGH: { min: 61, max: 80, label: "HIGH RISK", color: "text-orange-700 bg-orange-50 border-orange-200" },
    CRITICAL: { min: 81, max: 100, label: "CRITICAL RISK", color: "text-rose-700 bg-rose-50 border-rose-200" },
  },

  // Standard 11-point Verification Checklist for Nigerian Property
  verificationChecklistItems: [
    { key: "location_reviewed", title: "Property Location Reviewed", description: "Address, landmarks, and geographic description cross-checked across documents", requiresProfessional: false },
    { key: "plot_number_consistent", title: "Plot & Beacon Numbers Consistent", description: "Plot number, survey beacons, and cadastral reference verified between survey and deed", requiresProfessional: false },
    { key: "property_area_consistent", title: "Property Area & Dimensions Consistent", description: "Total land area (square meters or hectares) matches across deed, contract, and survey", requiresProfessional: false },
    { key: "seller_owner_reviewed", title: "Seller & Owner Lineage Reviewed", description: "Root of title matches identity of current seller and prior registered proprietors", requiresProfessional: false },
    { key: "survey_reviewed", title: "Survey Plan Verification", description: "Independent verification of surveyor registration and cadastral coordinates against Lagos/State Surveyor General records", requiresProfessional: true },
    { key: "title_documentation_reviewed", title: "Title Documentation Search", description: "Official registry search at Lands Bureau / Alausa / AGIS to confirm root of title and encumbrances", requiresProfessional: true },
    { key: "coordinates_reviewed", title: "Cadastral Coordinates Verification", description: "Physical boundary beacons confirmed with GPS coordinates on ground", requiresProfessional: true },
    { key: "document_inconsistencies_reviewed", title: "Document Discrepancies Clarified", description: "All identified typographical, naming, or date variances addressed by vendor", requiresProfessional: false },
    { key: "legal_review", title: "Professional Legal Due Diligence", description: "Independent property lawyer retained to review contract terms, covenants, and deed execution", requiresProfessional: true },
    { key: "physical_site_inspection", title: "Physical Inspection & Traditional Inquiries", description: "Site visit to confirm no trespass, active litigation notices, or conflicting family claims", requiresProfessional: true },
    { key: "official_government_verification", title: "Official Charting / Status Confirmation", description: "Formal land charting report verifying excision status, committed acquisition, or agricultural zone", requiresProfessional: true },
  ],

  // Legal Disclaimer
  legalDisclaimer: "LandIntel provides document intelligence and cadastral land-risk indicators. It does NOT establish legal ownership, certify title, confirm government approval, replace a registered surveyor, or replace legal representation. All real-estate acquisitions require independent professional verification.",
};
