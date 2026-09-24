import {
  DocumentClassification,
  DocumentAnalysisResult,
  ExtractedEntity,
  RiskAnalysisOutput,
  GeneratedFinding,
  getPurchaseRecommendation,
} from "./types";
import { getJurisdictionAdapter } from "@/lib/jurisdictions/registry";
import { validateNigerianLocation, isGibberishOrTestString } from "@/lib/geo/nigeria-data";

/**
 * Classifies Nigerian property documents based on textual markers and document metadata
 */
export function classifyNigerianDocument(text: string, filename: string): { category: DocumentClassification; confidence: number; summary: string } {
  const lower = (text + " " + filename).toLowerCase();

  // 0. Explicit check for non-cadastral images, screenshots, and social media files
  if (
    lower.includes("[non_cadastral") ||
    lower.includes("katana") ||
    lower.includes("facebook") ||
    lower.includes("screenshot") ||
    lower.includes("instagram") ||
    lower.includes("tiktok") ||
    lower.includes("whatsapp") ||
    lower.includes("[unverified_image")
  ) {
    return {
      category: "OTHER",
      confidence: 0.99,
      summary: "Non-cadastral or irrelevant image file. Lacks certified surveyor seals, coordinates, or statutory land title records.",
    };
  }

  if (lower.includes("survey plan") || lower.includes("beacon") || lower.includes("cadastral") || lower.includes("surveyor general") || lower.includes("boundary pillars")) {
    return {
      category: "SURVEY_PLAN",
      confidence: 0.95,
      summary: "Cadastral Survey Plan displaying boundary beacons, coordinates, and registered surveyor certification.",
    };
  }

  if (lower.includes("deed of assignment") || lower.includes("assignor") || lower.includes("assignee") || lower.includes("transfer of interest") || lower.includes("conveyance")) {
    return {
      category: "DEED_OF_ASSIGNMENT",
      confidence: 0.92,
      summary: "Deed of Assignment transferring legal interest, rights, and title in the described parcel.",
    };
  }

  if (lower.includes("certificate of occupancy") || lower.includes("c of o") || lower.includes("governor of lagos") || lower.includes("land use act 1978") || lower.includes("certificate of title")) {
    return {
      category: "CERTIFICATE_OF_OCCUPANCY",
      confidence: 0.96,
      summary: "State Government Certificate of Occupancy granting statutory right of occupancy.",
    };
  }

  if (lower.includes("governor's consent") || lower.includes("governors consent") || lower.includes("approval to assign") || lower.includes("honourable commissioner")) {
    return {
      category: "GOVERNORS_CONSENT",
      confidence: 0.94,
      summary: "Official Governor's Consent endorsing subsequent transaction over titled land.",
    };
  }

  if (lower.includes("gazette") || lower.includes("official gazette") || lower.includes("notice of acquisition") || lower.includes("excision notice")) {
    return {
      category: "GAZETTE",
      confidence: 0.91,
      summary: "Official Government Gazette publication detailing excision or legal land status.",
    };
  }

  if (lower.includes("allocation letter") || lower.includes("letter of allocation") || lower.includes("provisional allocation")) {
    return {
      category: "ALLOCATION_LETTER",
      confidence: 0.90,
      summary: "Formal allocation letter from public authority or accredited scheme developer.",
    };
  }

  if (lower.includes("contract of sale") || lower.includes("sales agreement") || lower.includes("memorandum of agreement")) {
    return {
      category: "CONTRACT_OF_SALE",
      confidence: 0.88,
      summary: "Contract of Sale specifying consideration amount, payment tranches, and vacant possession.",
    };
  }

  if (lower.includes("receipt") || lower.includes("acknowledgment of payment") || lower.includes("family receipt")) {
    return {
      category: "PURCHASE_RECEIPT",
      confidence: 0.85,
      summary: "Financial purchase receipt documenting consideration payment.",
    };
  }

  return {
    category: "OTHER",
    confidence: 0.70,
    summary: "Supporting land or identification document.",
  };
}

/**
 * Extracts structured cadastral & legal entities from document text
 */
export function extractCadastralEntities(text: string, category: DocumentClassification): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // 1. Plot number extraction
  const plotMatch = text.match(/plot\s+(?:no\.?|number)?\s*([A-Za-z0-9\/-]+)/i);
  if (plotMatch) {
    entities.push({
      fieldName: "plot_number",
      fieldValue: plotMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.94,
      sourceSnippet: plotMatch[0],
    });
  }

  // 2. Survey Plan number
  const surveyNoMatch = text.match(/(?:survey\s*plan\s*no\.?|plan\s*no\.?)\s*([A-Za-z0-9\/-]+)/i);
  if (surveyNoMatch) {
    entities.push({
      fieldName: "survey_number",
      fieldValue: surveyNoMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.95,
      sourceSnippet: surveyNoMatch[0],
    });
  }

  // 3. Land Area (sqm or hectares)
  const areaMatch = text.match(/([0-9,.]+)\s*(?:sq\.?\s*m(?:eters?)?|sqm|hectares?|acres?)/i);
  if (areaMatch) {
    entities.push({
      fieldName: "land_area",
      fieldValue: areaMatch[0].trim(),
      pageNumber: 1,
      confidence: 0.92,
      sourceSnippet: areaMatch[0],
    });
  }

  // 4. Parties (Assignor / Vendor / Owner)
  const assignorMatch = text.match(/(?:assignor|vendor|seller|grantor)\s*:\s*([A-Za-z\s.]+)(?:\n|,|;)/i);
  if (assignorMatch) {
    entities.push({
      fieldName: "seller_name",
      fieldValue: assignorMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.90,
      sourceSnippet: assignorMatch[0],
    });
  }

  // 5. Assignee / Purchaser / Buyer
  const assigneeMatch = text.match(/(?:assignee|purchaser|buyer|grantee)\s*:\s*([A-Za-z\s.]+)(?:\n|,|;)/i);
  if (assigneeMatch) {
    entities.push({
      fieldName: "buyer_name",
      fieldValue: assigneeMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.90,
      sourceSnippet: assigneeMatch[0],
    });
  }

  // 6. Surveyor details
  const surveyorMatch = text.match(/(?:surveyor|surveyed\s+by)\s*:\s*([A-Za-z\s.]+)/i);
  if (surveyorMatch) {
    entities.push({
      fieldName: "surveyor_name",
      fieldValue: surveyorMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.92,
      sourceSnippet: surveyorMatch[0],
    });
  }

  // 7. SURCON Accreditation Registration
  const surconMatch = text.match(/(?:surcon(?:\s*no\.?|\s*reg\.?|\s*seal)?)\s*[:#]?\s*([A-Za-z0-9\/-]+)/i);
  if (surconMatch) {
    entities.push({
      fieldName: "surcon_number",
      fieldValue: surconMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.93,
      sourceSnippet: surconMatch[0],
    });
  }

  // 8. Cadastral Boundary Beacons (PBN, SC, NIS, LA, OG pillar prefixes)
  const beaconMatches = text.match(/\b(?:pbn|sc|nis|la|og|oy|kd|ab)\s*[\/-]?\s*[0-9]{2,6}[A-Za-z0-9\/-]*\b/gi);
  if (beaconMatches && beaconMatches.length > 0) {
    const uniqueBeacons = Array.from(new Set(beaconMatches.map((b) => b.trim().toUpperCase()))).slice(0, 6);
    entities.push({
      fieldName: "beacon_numbers",
      fieldValue: uniqueBeacons.join(", "),
      pageNumber: 1,
      confidence: 0.95,
      sourceSnippet: `Identified boundary pillars: ${uniqueBeacons.join(", ")}`,
    });
  }

  // 9. Coordinate Grid Reference (Minna Datum UTM vs Geographic GPS)
  if (text.match(/minna\s+datum|utm\s+zone\s*3[12]|national\s+transverse\s+mercator/i)) {
    entities.push({
      fieldName: "cadastral_datum",
      fieldValue: "Minna Datum (Statutory Official Nigerian Grid)",
      pageNumber: 1,
      confidence: 0.95,
      sourceSnippet: "Official Minna Datum coordinate system identified.",
    });
  } else if (text.match(/wgs84|decimal\s+degrees|gps\s+coordinates/i)) {
    entities.push({
      fieldName: "cadastral_datum",
      fieldValue: "WGS84 (Global GPS Geographic Grid)",
      pageNumber: 1,
      confidence: 0.91,
      sourceSnippet: "WGS84 GPS coordinate representation identified.",
    });
  }

  // 10. Title Registration Particulars (Volume, Page, Register at State Lands Registry)
  const regMatch = text.match(/(?:no\.?|number)\s*([0-9]+)\s*(?:at\s+page|page|pg\.?)\s*([0-9]+)\s*(?:in\s+volume|volume|vol\.?)\s*([0-9]+)/i);
  if (regMatch) {
    entities.push({
      fieldName: "registration_particulars",
      fieldValue: `No. ${regMatch[1]} at Page ${regMatch[2]} in Volume ${regMatch[3]}`,
      pageNumber: 1,
      confidence: 0.96,
      sourceSnippet: regMatch[0],
    });
  }

  // 11. Government Gazette Reference
  const gazetteMatch = text.match(/(?:gazette\s*(?:no\.?|notice\s*no\.?))\s*([0-9]+)(?:\s*,?\s*vol\.?\s*([0-9]+))?/i);
  if (gazetteMatch) {
    entities.push({
      fieldName: "gazette_reference",
      fieldValue: `Gazette No. ${gazetteMatch[1]}${gazetteMatch[2] ? ` Vol. ${gazetteMatch[2]}` : ""}`,
      pageNumber: 1,
      confidence: 0.94,
      sourceSnippet: gazetteMatch[0],
    });
  }

  // 12. Certificate of Occupancy Number
  const cooMatch = text.match(/(?:certificate\s+of\s+occupancy|c\s+of\s+o)\s*(?:no\.?|number)?\s*[:#]?\s*([0-9A-Za-z\/-]+)/i);
  if (cooMatch) {
    entities.push({
      fieldName: "coo_number",
      fieldValue: cooMatch[1].trim(),
      pageNumber: 1,
      confidence: 0.95,
      sourceSnippet: cooMatch[0],
    });
  }

  // 13. Court Judgment / Lis Pendens Reference
  const courtMatch = text.match(/(?:suit\s*(?:no\.?|number)|judgment\s*in)\s*[:#]?\s*([A-Za-z0-9\/-]+)/i);
  if (courtMatch) {
    entities.push({
      fieldName: "court_judgment_reference",
      fieldValue: courtMatch[0].trim(),
      pageNumber: 1,
      confidence: 0.94,
      sourceSnippet: courtMatch[0],
    });
  }

  // 14. Power of Attorney Reference
  const poaMatch = text.match(/(?:power\s*of\s*attorney|irrevocable\s*power\s*of\s*attorney)\s*(?:dated|no\.?|registered)?\s*([A-Za-z0-9\/\s,-]+)?/i);
  if (poaMatch && (text.includes("donor") || text.includes("donee") || text.includes("attorney"))) {
    entities.push({
      fieldName: "power_of_attorney_ref",
      fieldValue: poaMatch[0].slice(0, 60).trim(),
      pageNumber: 1,
      confidence: 0.92,
      sourceSnippet: poaMatch[0],
    });
  }

  // 15. Physical Planning / Approved Layout Scheme Reference
  const layoutMatch = text.match(/(?:layout\s*approval|approved\s*layout|planning\s*permit|approval\s*no\.?)\s*[:#]?\s*([A-Za-z0-9\/-]+)/i);
  if (layoutMatch) {
    entities.push({
      fieldName: "layout_approval_ref",
      fieldValue: layoutMatch[0].trim(),
      pageNumber: 1,
      confidence: 0.91,
      sourceSnippet: layoutMatch[0],
    });
  }

  return entities;
}

/**
 * Detects synthetic, placeholder, test, or fabricated property details and instruments
 */
export function detectSyntheticOrPlaceholder(
  caseData: { title: string; state?: string; lga?: string; address?: string; country?: string; countryCode?: string; description?: string | null },
  documents: Array<{ id: string; originalName: string; category: string; extractions: Array<{ fieldName: string; fieldValue: string }> }>
): { isSynthetic: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const placeholderPattern = /(fake|dummy|test|sample|placeholder|lorem\s*ipsum|mock|asdf|qwerty|foo|bar|invalid|bogus|temp_doc|no_doc|unverified)/i;
  const screenshotPattern = /(screenshot|katana|facebook|whatsapp|instagram|tiktok|snapchat|twitter|meme|selfie|\bdcim\b|\bimg_\d+|\bphoto_\d+)/i;

  // 1. Check case inputs with generalized test string detector
  if (placeholderPattern.test(caseData.title) || isGibberishOrTestString(caseData.title)) {
    reasons.push(`Property title contains placeholder/test marker: "${caseData.title}"`);
  }
  if (caseData.address && (placeholderPattern.test(caseData.address) || isGibberishOrTestString(caseData.address))) {
    reasons.push(`Address contains placeholder marker or synthetic keyboard input: "${caseData.address}"`);
  }
  if (caseData.lga && (placeholderPattern.test(caseData.lga) || isGibberishOrTestString(caseData.lga))) {
    reasons.push(`District/LGA contains placeholder marker or synthetic keyboard input: "${caseData.lga}"`);
  }

  // 2. Validate Nigerian location authenticity
  const isNigeria = !caseData.countryCode || caseData.countryCode === "NG" || (caseData.country || "").toLowerCase().includes("nigeria");
  if (isNigeria) {
    const locValidation = validateNigerianLocation({
      state: caseData.state,
      lga: caseData.lga,
      address: caseData.address,
      title: caseData.title,
    });
    if (!locValidation.isValid) {
      for (const r of locValidation.reasons) {
        if (!reasons.includes(r)) {
          reasons.push(r);
        }
      }
    }
  }

  // 3. Check uploaded document filenames
  for (const doc of documents) {
    if (placeholderPattern.test(doc.originalName)) {
      reasons.push(`Document filename "${doc.originalName}" is marked as synthetic/dummy`);
    }
    if (screenshotPattern.test(doc.originalName)) {
      reasons.push(`Uploaded file "${doc.originalName}" is a social media screenshot or photo rather than a certified land instrument`);
    }
  }

  // 4. Check extractions for placeholder values
  for (const doc of documents) {
    for (const ext of doc.extractions) {
      if (placeholderPattern.test(ext.fieldValue) || isGibberishOrTestString(ext.fieldValue)) {
        reasons.push(`Extracted field "${ext.fieldName}" contains test value: "${ext.fieldValue}"`);
      }
    }
  }

  // 5. Check if documents were provided but yielded 0 valid cadastral records
  if (documents.length > 0) {
    const hasAnyRealCadastral = documents.some((d) =>
      d.category !== "OTHER" &&
      d.extractions.some((e) =>
        ["plot_number", "survey_number", "seller_name", "buyer_name", "land_area", "coo_number", "title_number", "beacon_numbers", "surcon_number"].includes(e.fieldName)
      )
    );

    if (!hasAnyRealCadastral) {
      reasons.push(
        `Submitted instrument(s) [${documents.map((d) => d.originalName).join(", ")}] lack authentic cadastral boundaries, licensed surveyor seals, or verifiable legal ownership records`
      );
    }
  }

  return {
    isSynthetic: reasons.length > 0,
    reasons,
  };
}

/**
 * Performs deep, explanatory, precise, and current cross-document due-diligence risk analysis
 * Fully internationalized across worldwide jurisdictions
 */
export function analyzeCrossDocumentRisks(
  caseData: {
    title: string;
    state: string;
    lga: string;
    address: string;
    country?: string;
    countryCode?: string;
    description?: string | null;
  },
  documents: Array<{ id: string; originalName: string; category: string; extractions: Array<{ fieldName: string; fieldValue: string; pageNumber: number }> }>
): RiskAnalysisOutput {
  const findings: GeneratedFinding[] = [];
  let documentationScore = 15;
  let ownershipScore = 10;
  let geographicScore = 10;
  let consistencyScore = 10;

  // Resolve jurisdiction adapter for worldwide accuracy
  const countryInput = caseData.countryCode || caseData.country || "NG";
  const jurisdiction = getJurisdictionAdapter(countryInput);
  const isNigeria = jurisdiction.countryCode === "NG";
  const primaryRegistry = jurisdiction.officialRegistries[0]?.name || "Statutory Land Registry";

  // Check for fake, dummy, or synthetic inputs/documents
  const syntheticCheck = detectSyntheticOrPlaceholder(caseData, documents);

  // Group valid recognized cadastral documents
  const validCadastralDocs = documents.filter((d) => {
    const isRecognizedCat = [
      "SURVEY_PLAN",
      "DEED_OF_ASSIGNMENT",
      "CERTIFICATE_OF_OCCUPANCY",
      "GOVERNORS_CONSENT",
      "GAZETTE",
      "ALLOCATION_LETTER",
      "CONTRACT_OF_SALE",
      "PURCHASE_RECEIPT",
    ].includes(d.category);
    const hasCadastralData = d.extractions.length > 0;
    const isScreenshotOrMeme = /(screenshot|katana|facebook|whatsapp|instagram|tiktok|snapchat)/i.test(d.originalName);
    return isRecognizedCat && hasCadastralData && !isScreenshotOrMeme;
  });

  const hasNoCadastralDocs = validCadastralDocs.length === 0;

  if (syntheticCheck.isSynthetic || hasNoCadastralDocs) {
    documentationScore = 95;
    ownershipScore = 95;
    geographicScore = 95;
    consistencyScore = 90;

    if (syntheticCheck.isSynthetic) {
      findings.push({
        title: "CRITICAL FRAUD ALERT: Synthetic, Placeholder, or Unverifiable Land Details",
        severity: "CRITICAL",
        category: "DOCUMENTATION",
        description: `The submitted property record or uploaded instrument(s) contain placeholder, test, or synthetic markers (${syntheticCheck.reasons.slice(0, 3).join("; ")}). No authentic cadastral identifiers, licensed surveyor credentials, or legal root of title could be validated.`,
        evidenceSummary: `Detected markers: ${syntheticCheck.reasons.join(". ")}`,
        sourceDocIds: documents.map((d) => d.id),
        pageReferences: "All submitted files & case metadata",
        whyItMatters:
          "Transacting on synthetic, placeholder, or fabricated land documents is the leading cause of total investment loss in real estate worldwide. Without an authentic, legally registered deed or certified boundary survey, there is no verifiable property right or legal parcel to acquire.",
        recommendedAction:
          "HALT ALL TRANSACTIONS IMMEDIATELY. DO NOT BUY. Do not transfer earnest deposits, sign binding purchase agreements, or release escrow funds. Demand original, certified true copies verified directly at the official statutory land registry.",
        isPremiumLocked: false,
      });

      // Location specific finding if address or LGA is fake / unresolvable
      const locationReasons = syntheticCheck.reasons.filter(
        (r) => r.toLowerCase().includes("address") || r.toLowerCase().includes("lga") || r.toLowerCase().includes("state")
      );
      if (locationReasons.length > 0) {
        findings.push({
          title: "CRITICAL LOCATION DEFECT: Unverifiable or Fabricated Property Address / District",
          severity: "CRITICAL",
          category: "GEOGRAPHIC",
          description: `The property address "${caseData.address}" or Local Government Area "${caseData.lga}" in ${caseData.state} could not be validated. ${locationReasons.join("; ")}.`,
          evidenceSummary: `Geographic validation failure: ${locationReasons.join(". ")}`,
          sourceDocIds: [],
          pageReferences: "Property Case Registration Data",
          whyItMatters:
            "Purchasing real estate at an unverified or fabricated address carries immediate risk of non-existent parcel fraud or fraudulent misrepresentation. Legitimate real estate must exist within a recognized statutory local government area with verifiable street or layout boundaries.",
          recommendedAction:
            "HALT TRANSACTIONS IMMEDIATELY. DO NOT BUY. Demand an exact approved layout plan, registered coordinates, and verifiable physical street address before proceeding.",
          isPremiumLocked: false,
        });
      }
    }

    if (hasNoCadastralDocs && !syntheticCheck.isSynthetic) {
      findings.push({
        title: "CRITICAL CADASTRAL DEFECT: Absence of Authentic Land Title or Survey Instruments",
        severity: "CRITICAL",
        category: "DOCUMENTATION",
        description: `None of the submitted instruments qualify as authentic legal land titles or cadastral survey plans. Transacting on unverified, non-cadastral documents carries extreme risk of total financial loss.`,
        evidenceSummary: `Evaluated documents: [${documents.map((d) => d.originalName).join(", ") || "None"}]. Zero survey beacon coordinates, surveyor accreditations, or registered deed memorials detected.`,
        sourceDocIds: documents.map((d) => d.id),
        pageReferences: "All submitted instruments",
        whyItMatters:
          "Real estate conveyancing requires certified proof of legal estate and defined cadastral boundary pillars. Attempting to purchase property without certified surveyor beacons and registered root of title guarantees immediate total loss of capital or dispute with rival claimants.",
        recommendedAction:
          "HALT ALL ENGAGEMENTS IMMEDIATELY. DO NOT BUY. Do not transfer funds or make deposits. Demand the registered survey plan bearing SURCON seal and the statutory root of title from the vendor.",
        isPremiumLocked: false,
      });
    }
  }

  // Group extractions by field
  const plotExtractions = documents.flatMap((d) =>
    d.extractions.filter((e) => e.fieldName === "plot_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id, category: d.category }))
  );

  const areaExtractions = documents.flatMap((d) =>
    d.extractions.filter((e) => e.fieldName === "land_area").map((e) => ({ ...e, docName: d.originalName, docId: d.id, category: d.category }))
  );

  const beaconExtractions = documents.flatMap((d) =>
    d.extractions.filter((e) => e.fieldName === "beacon_numbers").map((e) => ({ ...e, docName: d.originalName, docId: d.id, category: d.category }))
  );

  const surconExtractions = documents.flatMap((d) =>
    d.extractions.filter((e) => e.fieldName === "surcon_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id, category: d.category }))
  );

  const surveyPlans = documents.filter((d) => d.category === "SURVEY_PLAN");
  const deeds = documents.filter((d) => d.category === "DEED_OF_ASSIGNMENT");
  const cOfOs = documents.filter((d) => d.category === "CERTIFICATE_OF_OCCUPANCY");
  const consents = documents.filter((d) => d.category === "GOVERNORS_CONSENT");
  const gazettes = documents.filter((d) => d.category === "GAZETTE");
  const receipts = documents.filter((d) => d.category === "PURCHASE_RECEIPT");

  // Document Text Corpus
  const fullTextCorpus = documents
    .map((d) => d.originalName + " " + d.extractions.map((e) => e.fieldValue).join(" "))
    .join(" ")
    .toLowerCase();

  // -------------------------------------------------------------
  // CHECK 1: Plot Number & Cadastral Consistency
  // -------------------------------------------------------------
  if (plotExtractions.length >= 2) {
    const firstPlot = plotExtractions[0].fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "");
    const mismatch = plotExtractions.find((p) => p.fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "") !== firstPlot);

    if (mismatch) {
      consistencyScore += 35;
      findings.push({
        title: "Critical Cadastral Discrepancy: Conflicting Plot Reference Numbers",
        severity: "HIGH",
        category: "CONSISTENCY",
        description: `Different parcel identifiers were detected across submitted instruments: "${plotExtractions[0].fieldValue}" in ${plotExtractions[0].docName} versus "${mismatch.fieldValue}" in ${mismatch.docName}.`,
        evidenceSummary: `${plotExtractions[0].docName} (Page ${plotExtractions[0].pageNumber}) cites Plot ${plotExtractions[0].fieldValue}, while ${mismatch.docName} (Page ${mismatch.pageNumber}) conveys Plot ${mismatch.fieldValue}.`,
        sourceDocIds: [plotExtractions[0].docId, mismatch.docId],
        pageReferences: `${plotExtractions[0].docName} (Page ${plotExtractions[0].pageNumber}), ${mismatch.docName} (Page ${mismatch.pageNumber})`,
        whyItMatters: isNigeria
          ? "In Nigerian real estate conveyancing, conflicting plot numbers represent a primary cause of rival ownership claims, boundary encroachment litigation, and fraudulent double-allocation. The Deed of Assignment cannot legally transfer interest in a parcel not explicitly delineated by the accompanying registered survey plan."
          : `In ${jurisdiction.name} real estate conveyancing (${jurisdiction.legalSystem}), conflicting parcel reference numbers represent a primary cause of boundary encroachment litigation and rival ownership claims. The transfer instrument cannot legally convey interest in a parcel not explicitly delineated by the accompanying registered survey or plat.`,
        recommendedAction: isNigeria
          ? "Halt financial transactions immediately. Require the vendor and practicing surveyor to produce the approved layout plan from the State Ministry of Physical Planning / Lands Bureau to formally reconcile the parcel identity."
          : `Halt financial transactions immediately. Require the vendor and licensed surveyor to produce the approved cadastral plat from ${primaryRegistry} to formally reconcile the parcel identity.`,
        isPremiumLocked: true,
      });
    }
  }

  // -------------------------------------------------------------
  // CHECK 2: Statutory Root of Title & Registry Perfection
  // -------------------------------------------------------------
  if (deeds.length > 0 && cOfOs.length === 0 && consents.length === 0) {
    documentationScore += 30;
    ownershipScore += 25;
    findings.push({
      title: isNigeria
        ? "Statutory Root of Title Gap: Absence of Governor's Consent / C of O"
        : `Statutory Title Registration Gap: Absence of Endorsed Title Register in ${jurisdiction.name}`,
      severity: "ELEVATED",
      category: "DOCUMENTATION",
      description: isNigeria
        ? `The property documentation relies on a Deed of Assignment without a supporting Certificate of Occupancy (C of O) or statutory Governor's Consent endorsed under Section 22 of the Land Use Act 1978.`
        : `The property documentation relies on an unperfected or unrecorded transfer instrument without an official Title Certificate or registered deed memorials from ${primaryRegistry}.`,
      evidenceSummary: isNigeria
        ? `Deed of Assignment provided in ${deeds[0].originalName} without evidence of gubernatorial consent stamping or registration particulars at the State Lands Registry.`
        : `Transfer instrument provided in ${deeds[0].originalName} without statutory registration particulars or title endorsement from ${primaryRegistry}.`,
      sourceDocIds: deeds.map((d) => d.id),
      pageReferences: deeds.map((d) => `${d.originalName} (Execution & Covenants)`).join(", "),
      whyItMatters: isNigeria
        ? "Under Section 22 of the Land Use Act 1978 and Supreme Court authority (Savannah Bank v. Ajilo), any alienation of land without prior statutory Governor's Consent is voidable by the State Government. A buyer with only an unconsented deed holds an equitable interest rather than perfected legal title, leaving the acquisition vulnerable to revocation or conflicting prior registered deeds."
        : `Under ${jurisdiction.name} property law (${jurisdiction.legalSystem}), an unperfected or unrecorded conveyance leaves the purchaser holding an unverified equitable claim rather than indefeasible legal title. Prior recorded encumbrances, tax assessments, or third-party mortgages will take statutory precedence.`,
      recommendedAction: isNigeria
        ? "Retain a property attorney to conduct an official legal search at the State Lands Registry (e.g. Alausa Lands Bureau or Abuja AGIS) to verify the registered root of title, confirm unexpired leasehold residue (standard 99-year term), and draft formal requisitions on title."
        : `Retain a qualified real estate attorney or licensed conveyancer in ${jurisdiction.name} to conduct a formal search at ${primaryRegistry} to extract the official title folio and verify encumbrance clearance.`,
      isPremiumLocked: true,
    });
  }

  // -------------------------------------------------------------
  // CHECK 3: Unregularized Government Acquisition / Excision Status
  // -------------------------------------------------------------
  const hasExcisionInProgress =
    fullTextCorpus.includes("excision in progress") ||
    fullTextCorpus.includes("file number pending") ||
    fullTextCorpus.includes("gazette in process") ||
    fullTextCorpus.includes("under excision") ||
    fullTextCorpus.includes("pending acquisition release");

  if (hasExcisionInProgress && gazettes.length === 0) {
    documentationScore += 35;
    geographicScore += 35;
    findings.push({
      title: "Unregularized Government Acquisition: Pending Excision / Release Claim Detected",
      severity: "CRITICAL",
      category: "GEOGRAPHIC",
      description:
        "The vendor or marketing documentation describes the land title as 'Excision in Progress', 'File Number Pending', or awaiting statutory release. No official Government Gazette or statutory gazetted release was supplied.",
      evidenceSummary:
        "Documentation references administrative file tracking numbers rather than an official published Gazette Volume and Page or formal government conveyance.",
      sourceDocIds: documents.map((d) => d.id),
      pageReferences: "Title representation clause",
      whyItMatters:
        "Pending administrative regularization confers ZERO statutory property rights. Until an excision or release is formally approved by the competent authority, surveyed, and officially gazetted, the land remains legally owned or acquired by the Government. Any construction on such land is subject to summary demolition without legal compensation.",
      recommendedAction:
        "Do not transfer capital based on pending administrative promises. Require the vendor to provide the Official Gazette publication number or an accredited government allocation letter before making any financial commitment.",
      isPremiumLocked: true,
    });
  }

  // -------------------------------------------------------------
  // CHECK 4: Cadastral Survey Plan & Boundary Verification
  // -------------------------------------------------------------
  if (surveyPlans.length === 0) {
    geographicScore += 35;
    findings.push({
      title: "Absence of Cadastral Survey Plan with Boundary Coordinates",
      severity: "HIGH",
      category: "GEOGRAPHIC",
      description:
        "No dedicated cadastral survey plan or certified boundary plat containing boundary markers, traverse bearings, and geodetic coordinates was submitted for this property.",
      evidenceSummary: "Cadastral boundaries cannot be verified without an authentic survey plan bearing the official surveyor's charting record.",
      sourceDocIds: [],
      pageReferences: "N/A - Missing instrument",
      whyItMatters:
        "Without an authentic survey plan or boundary plat, it is impossible to chart coordinates against committed public acquisitions, road right-of-ways, environmental easements, or neighboring titled parcels.",
      recommendedAction: isNigeria
        ? "Demand an official registered Survey Plan bearing beacon pillar numbers and SURCON seal from the vendor, and commission a registered surveyor to chart it at the Office of the State Surveyor General."
        : `Demand a registered boundary survey plat bearing the surveyor's certification seal and verify coordinates with ${primaryRegistry}.`,
      isPremiumLocked: false,
    });
  } else {
    const hasSurcon = surconExtractions.length > 0 || fullTextCorpus.includes("surcon") || fullTextCorpus.includes("licensed surveyor");
    const hasBeacons = beaconExtractions.length > 0;

    findings.push({
      title: "Cadastral Survey Plan Verification & On-Ground Boundary Recovery",
      severity: hasSurcon ? "MODERATE" : "HIGH",
      category: "GEOGRAPHIC",
      description: hasSurcon
        ? `Survey plan detected with professional surveyor credentials (${surconExtractions[0]?.fieldValue || "Registered/Licensed"}). On-ground boundary verification is required.`
        : "Survey plan detected, but specific professional registration credentials or pillar schedules require physical registry verification.",
      evidenceSummary: `${surveyPlans[0].originalName} ${
        hasBeacons ? `cites boundary markers: ${beaconExtractions[0]?.fieldValue}` : "contains coordinates requiring ground recovery"
      }.`,
      sourceDocIds: [surveyPlans[0].id],
      pageReferences: `${surveyPlans[0].originalName} (Boundary & Surveyor Seal Clause)`,
      whyItMatters: isNigeria
        ? "Boundary pillars on ground are frequently shifted, vandalized, or falsely erected by unscrupulous developers or unauthorized actors ('Omonile'). Real estate fraud frequently involves producing genuine-looking survey copies for entirely different parcels on ground."
        : `Boundary markers on ground are frequently mislocated, shifted, or unrecorded. Real estate fraud and boundary disputes frequently involve producing non-certified sketches or plans representing parcels different from ground reality in ${jurisdiction.name}.`,
      recommendedAction: isNigeria
        ? "Retain an independent registered surveyor to perform an on-site 'beacon pickup' (recovery survey) and verify coordinates against the Record Copy lodged at the State Surveyor General's Office."
        : `Retain an independent licensed land surveyor to perform an on-site boundary recovery and verify coordinates against official records at ${primaryRegistry}.`,
      isPremiumLocked: false,
    });
  }

  // -------------------------------------------------------------
  // CHECK 5: Customary Title, Community & Signatory Governance
  // -------------------------------------------------------------
  const isFamilyOrCustomary =
    fullTextCorpus.includes("family land") ||
    fullTextCorpus.includes("omo-onile") ||
    fullTextCorpus.includes("customary") ||
    receipts.length > 0 ||
    fullTextCorpus.includes("baale") ||
    fullTextCorpus.includes("stool land") ||
    fullTextCorpus.includes("clan land") ||
    fullTextCorpus.includes("ancestral");

  if (isFamilyOrCustomary && cOfOs.length === 0 && consents.length === 0) {
    ownershipScore += 25;
    findings.push({
      title: "Customary / Community Land Conveyance: Signatory Authority Review Required",
      severity: "ELEVATED",
      category: "OWNERSHIP",
      description:
        "The property transaction involves customary family, stool, or community land ownership without an existing individual statutory title.",
      evidenceSummary:
        "Family receipts, traditional vendor representations, or customary lineage references detected in conveyance chain.",
      sourceDocIds: documents.map((d) => d.id),
      pageReferences: "Vendor representation & signatory clauses",
      whyItMatters: isNigeria
        ? "Under settled Nigerian customary jurisprudence (Amodu Tijani v. Secretary of Southern Nigeria), a valid sale of family land requires the active consent of the accredited Head of the Family along with principal branch elders. A conveyance signed by an individual member without accredited family resolution or registered Power of Attorney is void ab initio."
        : `Under customary and communal land rules applicable in ${jurisdiction.name}, alienation of community, stool, or family property requires the verified, unanimous authorization of all accredited custodians. Unauthorized private transfers are legally voidable.`,
      recommendedAction:
        "Ensure the Deed of Conveyance is executed by all accredited communal heads and principal trustees, verified with formal minutes, accredited statutory declarations, and photographic/video proof of authority.",
      isPremiumLocked: true,
    });
  }

  // -------------------------------------------------------------
  // CHECK 6: Area Dimension Consistency
  // -------------------------------------------------------------
  if (areaExtractions.length >= 2) {
    const firstArea = areaExtractions[0].fieldValue.replace(/[^0-9.]/g, "");
    const areaMismatch = areaExtractions.find((a) => a.fieldValue.replace(/[^0-9.]/g, "") !== firstArea);

    if (areaMismatch) {
      consistencyScore += 20;
      findings.push({
        title: "Land Area & Parcel Dimension Discrepancy",
        severity: "MODERATE",
        category: "CONSISTENCY",
        description: `Discrepancy in stated parcel surface area: "${areaExtractions[0].fieldValue}" in ${areaExtractions[0].docName} versus "${areaMismatch.fieldValue}" in ${areaMismatch.docName}.`,
        evidenceSummary: `Comparative area divergence between ${areaExtractions[0].docName} and ${areaMismatch.docName}.`,
        sourceDocIds: [areaExtractions[0].docId, areaMismatch.docId],
        pageReferences: `${areaExtractions[0].docName}, ${areaMismatch.docName}`,
        whyItMatters:
          "Area discrepancies between survey plans and transfer deeds frequently result in buyers receiving fewer square meters or square feet on ground than paid for, or overlapping with layout access roads and setback corridors.",
        recommendedAction:
          "Have a licensed surveyor perform boundary closure calculations from the coordinate schedule to establish the true mathematical ground area.",
        isPremiumLocked: true,
      });
    }
  }

  // -------------------------------------------------------------
  // CHECK 7: Official Land Registry Lodgement
  // -------------------------------------------------------------
  const regParticulars = documents.flatMap((d) =>
    d.extractions.filter((e) => e.fieldName === "registration_particulars" || e.fieldName === "title_number").map((e) => ({ ...e, docName: d.originalName }))
  );
  const cooExtractions = documents.flatMap((d) =>
    d.extractions.filter((e) => e.fieldName === "coo_number").map((e) => ({ ...e, docName: d.originalName }))
  );

  const hasRegistryParticulars = regParticulars.length > 0 || cooExtractions.length > 0;
  if (!hasRegistryParticulars && cOfOs.length === 0) {
    documentationScore += 20;
    findings.push({
      title: `Absence of Official Land Registry Particulars (Volume / Page / Title No.) in ${jurisdiction.name}`,
      severity: "MODERATE",
      category: "DOCUMENTATION",
      description:
        `The submitted instruments lack identifiable Land Registry registration particulars (e.g. Registered Number, Page, Volume, or Digital Folio at ${primaryRegistry}).`,
      evidenceSummary:
        `No volume, page, or statutory registration index detected across submitted instruments for verification on official digital land portals (${jurisdiction.officialRegistries.map((r) => r.name).join(", ")}).`,
      sourceDocIds: documents.map((d) => d.id),
      pageReferences: "Deed Memorials and Endorsement Backpage",
      whyItMatters:
        `Under contemporary land registry operations in ${jurisdiction.name}, an unregistered land instrument cannot be legally enforced against a competing registered purchaser in good faith. Without registration particulars, it is impossible to verify whether the seller has already mortgaged, pledged, or conveyed the land to a third party.`,
      recommendedAction:
        `Instruct your property solicitor or conveyancer to conduct a formal search at ${primaryRegistry} using the vendor's root of title or cadastral survey coordinates to verify that no caveats, equitable mortgages, or registered charges exist.`,
      isPremiumLocked: true,
    });
  }

  // -------------------------------------------------------------
  // CHECK 8: Right-of-Way, Drainage & Environmental Setback Compliance
  // -------------------------------------------------------------
  const hasDrainageOrCorridorRisk =
    fullTextCorpus.includes("canal") ||
    fullTextCorpus.includes("drainage") ||
    fullTextCorpus.includes("setback") ||
    fullTextCorpus.includes("right of way") ||
    fullTextCorpus.includes("high tension") ||
    fullTextCorpus.includes("coastal road") ||
    fullTextCorpus.includes("easement") ||
    fullTextCorpus.includes("flood zone") ||
    fullTextCorpus.includes("waterfront");

  if (hasDrainageOrCorridorRisk) {
    geographicScore += 25;
    findings.push({
      title: "Statutory Setback & Infrastructure Corridor Exposure (Drainage / Coastal / Utility)",
      severity: "HIGH",
      category: "GEOGRAPHIC",
      description:
        "Documentation flags proximity to major infrastructure corridors, drainage channels, coastal easements, or utility rights-of-way subject to active statutory building line enforcement.",
      evidenceSummary:
        "Instrument text or survey layout notes indicate proximity to drainage easements, road expansion corridors, or public utility setbacks.",
      sourceDocIds: documents.map((d) => d.id),
      pageReferences: "Survey beacon descriptions and layout notes",
      whyItMatters:
        "Under heightened urban planning enforcement worldwide, structures erected within mandatory drainage setbacks, flood retention plains, or highway alignment corridors face summary demolition without statutory compensation, irrespective of underlying deed status.",
      recommendedAction:
        "Commission a physical site inspection and planning permit clearance with the municipal planning authority before committing funds. Verify that the survey beacons fall strictly outside the statutory Right-of-Way and environmental reserve lines.",
      isPremiumLocked: true,
    });
  }

  // -------------------------------------------------------------
  // CHECK 9: Power of Attorney Conveyance Limitation
  // -------------------------------------------------------------
  const isPoAOnly =
    (fullTextCorpus.includes("power of attorney") || fullTextCorpus.includes("irrevocable power of attorney")) &&
    deeds.length === 0 &&
    cOfOs.length === 0;

  if (isPoAOnly) {
    ownershipScore += 30;
    findings.push({
      title: "Conveyance Reliance on Power of Attorney Alone: Root of Title Vulnerability",
      severity: "HIGH",
      category: "OWNERSHIP",
      description:
        "The proposed acquisition relies on a Power of Attorney as the primary transfer instrument without an executed Deed of Assignment transferring legal estate.",
      evidenceSummary:
        "Power of Attorney instrument detected as the sole dispositive document transferring interest.",
      sourceDocIds: documents.map((d) => d.id),
      pageReferences: "Power of Attorney Instrument",
      whyItMatters: isNigeria
        ? "The Supreme Court of Nigeria established in Ude v. Nwara (1993) 2 NWLR (Pt. 278) 638 that a Power of Attorney is merely an instrument of delegation and agency; it does NOT by itself transfer proprietary title or ownership of land. A purchaser relying solely on a Power of Attorney acquires only an agency mandate that may terminate upon the donor's death, insolvency, or prior revocation."
        : `Under established common and civil property law in ${jurisdiction.name}, a Power of Attorney creates agency representation; it does NOT by itself transfer legal ownership or convey title to real property. The agency mandate lapses upon donor incapacity or death.`,
      recommendedAction:
        "Require the donor/vendor to execute a formal Deed of Assignment / Conveyance conveying full legal interest, accompanied by certified true copies of the donor's underlying registered title.",
      isPremiumLocked: true,
    });
  }

  // -------------------------------------------------------------
  // CHECK 10: Court Litigation & Lis Pendens Doctrine Exposure
  // -------------------------------------------------------------
  const hasLitigationFlags =
    fullTextCorpus.includes("suit no") ||
    fullTextCorpus.includes("court judgment") ||
    fullTextCorpus.includes("consent judgment") ||
    fullTextCorpus.includes("injunction") ||
    fullTextCorpus.includes("disputed") ||
    fullTextCorpus.includes("litigation");

  if (hasLitigationFlags) {
    ownershipScore += 30;
    findings.push({
      title: "Active or Historical Judicial Proceedings: Lis Pendens Risk Alert",
      severity: "CRITICAL",
      category: "OWNERSHIP",
      description:
        "References to High Court suit numbers, judicial judgments, or litigated estates were detected in the property history.",
      evidenceSummary:
        "Judicial suit references or court judgments cited in recital clauses.",
      sourceDocIds: documents.map((d) => d.id),
      pageReferences: "Recital clauses and title memorials",
      whyItMatters:
        "Under the equitable doctrine of lis pendens, any alienation or disposition of real property that is the subject of pending court litigation is voidable and bound by the ultimate judicial outcome. A purchaser during the pendency of a suit acquires nothing if their grantor loses.",
      recommendedAction:
        `Retain litigation counsel to conduct a search of the Court Registry in ${jurisdiction.name} to verify that any cited judgment is enrolled, final, unappealed, and that no motion for stay of execution or setting aside is pending.`,
      isPremiumLocked: true,
    });
  }

  // Calculate overall score (0 to 100)
  const rawScore = Math.round(
    documentationScore * 0.3 +
    ownershipScore * 0.3 +
    geographicScore * 0.2 +
    consistencyScore * 0.2
  );
  const isCriticalFailure = syntheticCheck.isSynthetic || hasNoCadastralDocs;
  const overallScore = Math.min(100, Math.max(isCriticalFailure ? 95 : 12, rawScore));

  let level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL" = "LOW";
  if (overallScore > 80) level = "CRITICAL";
  else if (overallScore > 60) level = "HIGH";
  else if (overallScore > 40) level = "ELEVATED";
  else if (overallScore > 20) level = "MODERATE";

  // Derive unambiguous acquisition recommendation
  const recommendation = getPurchaseRecommendation(overallScore, level, {
    isSynthetic: isCriticalFailure,
    criticalFindingsCount: findings.filter((f) => f.severity === "CRITICAL").length,
  });

  const docSummaryList =
    documents.map((d) => `${d.originalName} (${d.category.replace(/_/g, " ")})`).join(", ") || "No uploaded documents";

  const primaryDrivers: string[] = [];
  if (isCriticalFailure) {
    if (syntheticCheck.isSynthetic) {
      primaryDrivers.push("synthetic, placeholder, or unverified documentation detected with zero cadastral lineage");
    }
    if (hasNoCadastralDocs) {
      primaryDrivers.push("total absence of authentic cadastral survey plan or statutory root of title");
    }
    if (syntheticCheck.reasons.some((r) => r.toLowerCase().includes("address") || r.toLowerCase().includes("lga") || r.toLowerCase().includes("state"))) {
      primaryDrivers.push("unverifiable or non-existent geographic address and district alignment");
    }
  }
  if (consistencyScore > 25 && !isCriticalFailure) primaryDrivers.push("cadastral and plot identifier divergence across instruments");
  if (documentationScore > 25 && !isCriticalFailure) primaryDrivers.push(`unperfected statutory root of title / absence of registered deed at ${primaryRegistry}`);
  if (geographicScore > 25 && !isCriticalFailure) primaryDrivers.push("unverified cadastral survey boundary markers and potential setback/acquisition exposure");
  if (ownershipScore > 25 && !isCriticalFailure) primaryDrivers.push("unverified grantor conveyancing authority / customary lineage review required");
  if (primaryDrivers.length === 0) primaryDrivers.push("routine physical boundary recovery and official registry charting prerequisites");
  if (primaryDrivers.length === 0) primaryDrivers.push("routine physical boundary recovery and official registry charting prerequisites");

  const explanation = `${recommendation.headline}

DUE-DILIGENCE AUDIT ASSESSMENT:
• Risk Indicator Score: ${overallScore} / 100 (${level} Risk Exposure)
• Target Property: "${caseData.title}" (${caseData.lga || "District"}, ${caseData.state || "Region"}, ${jurisdiction.name})
• Evaluated Instruments: ${documents.length} document(s) [${docSummaryList}]

PURCHASE RECOMMENDATION: ${recommendation.shortVerdict}
${recommendation.actionGuidance}

PRIMARY RISK DRIVERS IDENTIFIED:
${primaryDrivers.map((d, i) => `${i + 1}. ${d}`).join("\n")}

STATUTORY COMPLIANCE DIRECTIVE:
Under contemporary ${jurisdiction.name} conveyancing jurisprudence (${jurisdiction.legalSystem}), valid perfection of title requires verified registration with ${primaryRegistry} and independent on-ground boundary recovery prior to capital disbursement.`;

  return {
    overallScore,
    level,
    explanation,
    breakdown: {
      documentationScore: Math.min(100, documentationScore),
      ownershipScore: Math.min(100, ownershipScore),
      geographicScore: Math.min(100, geographicScore),
      consistencyScore: Math.min(100, consistencyScore),
    },
    findings,
  };
}
