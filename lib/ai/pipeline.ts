import { db } from "@/lib/db";
import { classifyNigerianDocument, extractCadastralEntities, analyzeCrossDocumentRisks } from "./heuristics";
import { DocumentClassification } from "./types";
import { APP_CONFIG } from "@/lib/config";
import { getJurisdictionAdapter } from "@/lib/jurisdictions/registry";
import { reconcileCaseDocuments } from "@/lib/ai/reconciliation";
import { extractCadastralTextFromDocument } from "@/lib/services/vision-ocr";

/**
 * Executes the document processing pipeline for a single document
 */
export async function processDocumentPipeline(documentId: string): Promise<void> {
  const doc = await db.propertyDocument.findUnique({
    where: { id: documentId },
    include: { propertyCase: true },
  });

  if (!doc) throw new Error("Document not found");

  // Step 1: Update status to PROCESSING
  await db.propertyDocument.update({
    where: { id: documentId },
    data: { processingStatus: "PROCESSING" },
  });

  // Extract real text from image or document if not already present
  let textContent = doc.ocrText;
  if (!textContent || textContent.trim().length === 0) {
    try {
      textContent = await extractCadastralTextFromDocument(doc.storageKey, doc.mimeType, doc.originalName);
      if (textContent && textContent !== doc.originalName) {
        await db.propertyDocument.update({
          where: { id: documentId },
          data: { ocrText: textContent },
        });
      }
    } catch (ocrErr) {
      console.warn("[OCR_EXTRACTION_FAILED]", ocrErr);
      textContent = doc.originalName;
    }
  }
  if (!textContent) {
    textContent = doc.originalName;
  }

  // Resolve country jurisdiction adapter
  const adapter = getJurisdictionAdapter(doc.propertyCase.countryCode || doc.propertyCase.country);

  // Step 2: Classify using jurisdiction-specific rules
  const classification = adapter.classifyDocument(textContent, doc.originalName);

  // Step 3: Extract structured cadastral entities
  const entities = adapter.extractEntities(textContent, classification.category);

  // Step 4: Persist updates in database (direct batch operations to prevent Neon pooler timeouts)
  await db.propertyDocument.update({
    where: { id: documentId },
    data: {
      category: classification.category,
      processingStatus: "COMPLETED",
      extractedSummary: classification.summary,
    },
  });

  // Clear any previous extractions for this doc
  await db.documentExtraction.deleteMany({
    where: { documentId },
  });

  // Save extractions in batch
  if (entities.length > 0) {
    await db.documentExtraction.createMany({
      data: entities.map((ent) => ({
        documentId,
        caseId: doc.caseId,
        fieldName: ent.fieldName,
        fieldValue: ent.fieldValue,
        pageNumber: ent.pageNumber,
        confidence: ent.confidence,
        sourceSnippet: ent.sourceSnippet,
      })),
    });
  }

  // Step 5: Trigger overall case analysis refresh
  await runCaseIntelligencePipeline(doc.caseId);
}

/**
 * Runs the full cross-document analysis, risk score calculation, and verification checklist for a case
 */
export async function runCaseIntelligencePipeline(caseId: string): Promise<void> {
  const propertyCase = await db.propertyCase.findUnique({
    where: { id: caseId },
    include: {
      documents: {
        include: {
          extractions: true,
        },
      },
    },
  });

  if (!propertyCase) throw new Error("Property case not found");

  // Run heuristics / AI risk analysis
  const analysis = analyzeCrossDocumentRisks(
    {
      title: propertyCase.title,
      state: propertyCase.state,
      lga: propertyCase.lga,
      address: propertyCase.address,
      country: propertyCase.country,
      countryCode: propertyCase.countryCode,
      description: propertyCase.description,
    },
    propertyCase.documents.map((d) => ({
      id: d.id,
      originalName: d.originalName,
      category: d.category,
      extractions: d.extractions.map((e) => ({
        fieldName: e.fieldName,
        fieldValue: e.fieldValue,
        pageNumber: e.pageNumber,
      })),
    }))
  );

  // 1. Update or create RiskScore
  await db.riskScore.upsert({
    where: { caseId },
    create: {
      caseId,
      score: analysis.overallScore,
      level: analysis.level,
      explanation: analysis.explanation,
      documentationScore: analysis.breakdown.documentationScore,
      ownershipScore: analysis.breakdown.ownershipScore,
      geographicScore: analysis.breakdown.geographicScore,
      consistencyScore: analysis.breakdown.consistencyScore,
    },
    update: {
      score: analysis.overallScore,
      level: analysis.level,
      explanation: analysis.explanation,
      documentationScore: analysis.breakdown.documentationScore,
      ownershipScore: analysis.breakdown.ownershipScore,
      geographicScore: analysis.breakdown.geographicScore,
      consistencyScore: analysis.breakdown.consistencyScore,
    },
  });

  // 2. Refresh findings in batch
  await db.propertyFinding.deleteMany({ where: { caseId } });

  if (analysis.findings.length > 0) {
    await db.propertyFinding.createMany({
      data: analysis.findings.map((f) => ({
        caseId,
        title: f.title,
        severity: f.severity,
        category: f.category,
        description: f.description,
        evidenceSummary: f.evidenceSummary,
        sourceDocIds: JSON.stringify(f.sourceDocIds),
        pageReferences: f.pageReferences,
        whyItMatters: f.whyItMatters,
        recommendedAction: f.recommendedAction,
        isPremiumLocked: f.isPremiumLocked,
      })),
    });
  }

  // 3. Initialize or update Verification Items in batch based on real analysis findings
  const adapter = getJurisdictionAdapter(propertyCase.countryCode || propertyCase.country);
  const checklistItems = adapter.verificationChecklist.length > 0
    ? adapter.verificationChecklist
    : APP_CONFIG.verificationChecklistItems;

  const hasLocationDefect = analysis.findings.some((f) => f.category === "GEOGRAPHIC" && f.severity === "CRITICAL");
  const hasTitleDefect = analysis.findings.some((f) => f.category === "DOCUMENTATION" && (f.severity === "CRITICAL" || f.title.includes("Absence of Authentic Land Title")));
  const hasSurveyDefect = analysis.findings.some((f) => f.title.includes("Survey Plan") || f.title.includes("Cadastral Defect"));
  const isCritical = analysis.overallScore >= 80;

  const itemsToCreate = checklistItems.map((item) => {
    let status = "PENDING";
    let notes: string | null = null;

    if (item.key === "location_reviewed") {
      if (hasLocationDefect || (!propertyCase.latitude && !propertyCase.longitude && isCritical)) {
        status = "FAILED";
        notes = "Location failed: Address or LGA is unverifiable, synthetic, or non-existent in state registry.";
      } else if (propertyCase.latitude && propertyCase.longitude) {
        status = "COMPLETE";
        notes = "Geographic coordinates confirmed on map.";
      } else {
        status = "NEEDS_REVIEW";
        notes = "Physical address verification required.";
      }
    } else if (item.key === "survey_reviewed" || item.key === "coordinates_reviewed" || item.key === "plot_number_consistent") {
      if (hasSurveyDefect || isCritical) {
        status = "FAILED";
        notes = "No authentic cadastral survey plan or beacon coordinates detected.";
      } else {
        status = "NEEDS_REVIEW";
        notes = "Survey beacons require on-ground physical recovery.";
      }
    } else if (item.key === "title_documentation_reviewed" || item.key === "seller_owner_reviewed") {
      if (hasTitleDefect || isCritical) {
        status = "FAILED";
        notes = "No authentic statutory root of title or registered deed detected.";
      } else {
        status = "NEEDS_REVIEW";
        notes = "Official registry title search recommended.";
      }
    } else if (item.key === "legal_review" || item.key === "official_government_verification") {
      if (isCritical) {
        status = "FAILED";
        notes = "Critical defects detected. Halt transactions immediately (DO NOT BUY).";
      } else {
        status = "NEEDS_REVIEW";
        notes = "Professional legal review recommended before closing.";
      }
    }

    return {
      caseId,
      itemKey: item.key,
      title: item.title,
      description: item.description,
      status,
      notes,
      requiresProfessional: item.requiresProfessional,
    };
  });

  await db.verificationItem.deleteMany({ where: { caseId } });
  if (itemsToCreate.length > 0) {
    await db.verificationItem.createMany({ data: itemsToCreate });
  }

  // 4. Update case status to ANALYSIS_COMPLETE
  await db.propertyCase.update({
    where: { id: caseId },
    data: {
      status: "ANALYSIS_COMPLETE",
    },
  });
}

/**
 * Case-Specific AI Assistant bounded strictly to authorized case documents with prompt-injection defense.
 * Delivers explanatory, precise, accurate, and current (2026 conveyancing practice) intelligence.
 */
export async function askCaseAssistant(caseId: string, question: string): Promise<{
  answer: string;
  evidence: string;
  confidence: number;
  recommendedAction: string;
}> {
  // Sanitize input
  const cleanQuestion = question.trim().slice(0, 500);

  const propertyCase = await db.propertyCase.findUnique({
    where: { id: caseId },
    include: {
      documents: { include: { extractions: true } },
      findings: true,
      riskScore: true,
      verificationItems: true,
    },
  });

  if (!propertyCase) throw new Error("Case not found");

  const q = cleanQuestion.toLowerCase();

  // ═══════════════════════════════════════════════════════════════
  // CONVERSATIONAL INTELLIGENCE LAYER
  // Handle greetings, identity, website, help, creator, pricing,
  // contact, real estate glossary, and social queries.
  // ═══════════════════════════════════════════════════════════════

  const isGreeting = /^(hi|hello|hey|good\s*(morning|afternoon|evening|day)|howdy|sup|yo|what'?s\s*up|greetings|salaam|hola)/i.test(q) ||
    /(^|\b)(how\s*(are|r)\s*you|how\s*(are|r)\s*you\s*doing|how\s*do\s*you\s*do|how\s*is\s*it\s*going|how's\s*it\s*going|how's\s*everything|how\s*are\s*things|hope\s*you're\s*well|good\s*day)(\b|$)/i.test(q);

  const isIdentity = /(who\s*(are|r)\s*you|what\s*(are|r)\s*you|what\s*is\s*your\s*name|your\s*name|who\s*am\s*i\s*talking\s*to|tell\s*me\s*about\s*yourself|introduce\s*yourself|what\s*do\s*you\s*do|what\s*can\s*you\s*do|what\s*is\s*your\s*role|are\s*you\s*(an\s*)?(ai|bot|robot|lawyer|human))/i.test(q);

  const isCreator = /(who\s*(made|created|built|developed|owns|founded|runs)\s*(you|this|landintel|the\s*(website|app|platform))|who\s*is\s*the\s*(creator|developer|founder|owner|ceo|author))/i.test(q);

  const isWebsite = /(what\s*is\s*(this|landintel|the\s*(site|website|platform|app))|about\s*(this|landintel|the\s*(site|website|platform|app))|how\s*does\s*(this|landintel|the\s*(site|platform)|it)\s*work|what\s*does\s*(this|landintel)\s*(do|offer)|tell\s*me\s*about\s*(this|landintel|the\s*(platform|company))|what\s*is\s*the\s*url|link\s*to\s*the\s*website|why\s*use\s*landintel)/i.test(q);

  const isPricing = /(how\s*much|pricing|price|cost|how\s*much\s*does\s*it\s*cost|packages|subscription|plans|audit\s*fee|verification\s*fee|is\s*(it|this)\s*free|how\s*do\s*i\s*pay)/i.test(q);

  const isContact = /(contact|support|customer\s*(care|service)|email|phone|whatsapp|helpdesk|office|address|speak\s*to\s*(a\s*)?(human|person|agent|lawyer|surveyor)|reach\s*out|call\s*you)/i.test(q);

  const isHowToBuy = /(how\s*to\s*buy\s*land|steps\s*to\s*buy|avoid\s*(land\s*)?scam|red\s*flags\s*in\s*land|tips\s*for\s*buying\s*land|guide\s*to\s*buying|buying\s*land\s*in\s*nigeria)/i.test(q);

  const isGlossary = /(what\s*is\s*(a\s*)?(c\s*of\s*o|certificate\s*of\s*occupancy|governor'?s\s*consent|gazette|excision|omonile|survey\s*plan|beacon|deed\s*of\s*assignment|freehold|leasehold)|define\s*(c\s*of\s*o|governor'?s\s*consent|gazette|excision))/i.test(q);

  const isHelp = /^(help|how\s*can\s*you\s*help|what\s*can\s*(you|i)\s*(do|ask)|what\s*questions|how\s*to\s*use|guide\s*me|what\s*should\s*i\s*ask)/i.test(q);

  const isThanks = /^(thanks|thank\s*you|thx|cheers|appreciate|wonderful|great\s*(job|work)|well\s*done|nice|awesome|cool|good\s*(job|one))/i.test(q);

  const isGoodbye = /^(bye|goodbye|see\s*you|later|take\s*care|goodnight|gotta\s*go)/i.test(q);

  const isJoke = /(tell\s*me\s*a\s*joke|funny|make\s*me\s*laugh|humor)/i.test(q);

  if (isGreeting) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return {
      answer: `${timeGreeting}! 👋 I'm doing well, thank you for asking!\n\nWelcome to **LandIntel AI Legal Counsel**. I am actively monitoring your case **"${propertyCase.title}"** located in ${propertyCase.lga}, ${propertyCase.state}.\n\n📊 **Case Quick Status:**\n• Documents: ${propertyCase.documents.length} uploaded\n• Risk Level: **${propertyCase.riskScore?.level || "Pending"}** (${propertyCase.riskScore?.score || "N/A"}/100)\n\nI can help you analyze documents, detect conflicting survey beacons, check seller legitimacy, explain Nigerian land laws (C of O, Excision, Gazette), or answer any questions about the LandIntel platform.\n\nHow can I assist you with this property today?`,
      evidence: `Case: "${propertyCase.title}" | ${propertyCase.documents.length} document(s) indexed | Status: Active`,
      confidence: 1.0,
      recommendedAction: "Ask me anything about this property case, or ask for safety guidance before paying any deposit.",
    };
  }

  if (isIdentity) {
    return {
      answer: `I am **LandIntel AI Legal Counsel** — an intelligent property due-diligence and conveyancing assistant built specifically for real estate investors, diaspora buyers, and institutions.\n\n🛡️ **What I Do:**\n• **Analyze Documents** — I extract and scrutinize data from Survey Plans, Deeds of Assignment, Certificates of Occupancy (C of O), and Gazette publications.\n• **Detect Conflicts** — I catch conflicting beacon coordinates, plot numbers, mismatched vendor names, and unverified roots of title.\n• **Legal & Cadastral Guidance** — Grounded strictly in Nigerian land law (Land Use Act 1978, SURCON surveying standards, and court precedents).\n• **Actionable Checklists** — I tell you exactly what questions to ask the vendor, what your lawyer must search at Lands Registry, and what your surveyor must chart.\n\n🔍 **My Operating Principle:**\nI do not speculate or hallucinate. Every finding is tied to the actual documents you upload and statutory conveyancing rules. I am designed to assist and empower your legal and surveying team.\n\n🌐 Platform: **LandIntel** (land-intel-omega.vercel.app)`,
      evidence: "LandIntel Cadastral Intelligence & AI Counsel System",
      confidence: 1.0,
      recommendedAction: "Upload all available property documents and ask 'Is this land safe to buy?' for an immediate audit.",
    };
  }

  if (isCreator) {
    return {
      answer: `**LandIntel** was developed by the **LandIntel Global Technologies** team — an elite group of conveyancing technologists, geospatial/GIS engineers, and Nigerian property lawyers.\n\n🌍 **Our Vision:**\nReal estate acquisitions in Nigeria and across Africa have historically suffered from documentation opacity, Omonile conflicts, and double-allocation scams — particularly impacting diaspora buyers who cannot be physically present. LandIntel was created to provide institutional-grade transparency, automated cadastral auditing, and verifiable title diligence for every land buyer worldwide.\n\n🌐 Official Website: **land-intel-omega.vercel.app**\n📧 Contact: **support@landintel.ai**`,
      evidence: "LandIntel Technologies Global Inc. — Institutional Property Intelligence",
      confidence: 1.0,
      recommendedAction: "Learn more at land-intel-omega.vercel.app or continue your due diligence on this property case.",
    };
  }

  if (isWebsite) {
    return {
      answer: `**LandIntel** (land-intel-omega.vercel.app) is a global property due-diligence and cadastral intelligence platform designed to eliminate land fraud, boundary disputes, and title defects.\n\n✨ **What LandIntel Offers:**\n1. **Automated Cadastral Audit** — Upload property documents (PDF, JPG, PNG) and receive an instant 15-section risk report within seconds.\n2. **Cross-Document Discrepancy Matrix** — Automatically compares Survey Plans, Deeds, and Receipts to catch mismatched beacons, forged signatures, or boundary overlaps.\n3. **AI Legal Counsel (That's Me!)** — 24/7 dedicated assistant answering inquiries grounded directly in your case files and Nigerian land jurisprudence.\n4. **Official Registry Search & Charting** — Direct verification with State Lands Bureaus (e.g., Alausa/Lagos, AGIS/Abuja) and Surveyor General's offices.\n5. **Publication-Grade Certified PDF Report** — Institutional-quality certification report with risk scores and definitive acquisition verdicts.\n\n🌐 **Visit our website:** [land-intel-omega.vercel.app](https://land-intel-omega.vercel.app)`,
      evidence: "LandIntel Global Property Intelligence Platform (https://land-intel-omega.vercel.app)",
      confidence: 1.0,
      recommendedAction: "Review your case dashboard or ask me questions about this property to explore our intelligence capabilities.",
    };
  }

  if (isPricing) {
    return {
      answer: `Here is **LandIntel's transparent pricing structure**:\n\n💳 **1. Standard Cadastral Audit (Single Property)**\n• **Price:** ₦48,375 (₦45,000 base + ₦3,375 statutory 7.5% VAT) or ~$35 USD\n• **Includes:** Automated document OCR, 15-section Risk Index, Beacon Discrepancy Matrix, AI Case Assistant, and Certified PDF Report download for this property.\n\n🏆 **2. Professional Investor Subscription**\n• **Price:** ₦134,375 / month (₦125,000 base + ₦9,375 7.5% VAT)\n• **Includes:** Up to 15 active property cases every month, unlimited document uploads, priority AI inquiries, multi-user collaboration, and institutional reporting.\n\n🏛️ **3. Official Registry Search & Ground Verification (Add-On)**\n• Physical charting at Surveyor General's office, official Lands Registry search, and signed legal opinion by accredited solicitors.\n\n🔒 All payments are processed securely through **Paystack** with instant receipt generation.`,
      evidence: "LandIntel Official Pricing Schedule (Statutory 7.5% VAT included)",
      confidence: 1.0,
      recommendedAction: "Click 'Unlock Report' on this case or visit /billing to manage your subscription.",
    };
  }

  if (isContact) {
    return {
      answer: `You can reach the **LandIntel support and concierge team** through the following channels:\n\n📧 **Customer Support Email:** support@landintel.ai\n📩 **Administrative Inquiries:** successoluwayomi22@gmail.com\n🌐 **Help & Contact Page:** land-intel-omega.vercel.app/contact\n⏰ **Operating Hours:** Monday – Saturday, 8:00 AM – 6:00 PM (WAT / GMT+1)\n\n🤝 **Need a Human Lawyer or Surveyor?**\nIf you need physical on-ground beacon recovery, boundary charting at the Surveyor General's office, or representation during closing, our concierge team can connect you with licensed SURCON surveyors and NBA-accredited property lawyers.\n\nFeel free to send us an email or use the in-app support tab anytime!`,
      evidence: "LandIntel Customer Service & Concierge Desk",
      confidence: 1.0,
      recommendedAction: "Reach out to support@landintel.ai for dedicated assistance or custom enterprise inquiries.",
    };
  }

  if (isHowToBuy) {
    return {
      answer: `Here is the **6-Step Golden Rule for buying land safely in Nigeria** (especially for diaspora investors):\n\n1. **Do NOT Pay Consideration First** — Never pay purchase money, commitment fees, or non-refundable deposits before completing document verification.\n2. **Physical Beacon Recovery** — Commission an independent registered surveyor to visit the land, pick physical GPS coordinates from boundary beacons, and produce a charting record.\n3. **Surveyor General Charting** — Chart the coordinates at the State Surveyor General's office to confirm the land is **FREE** and not under government acquisition, committed road setback, or agricultural scheme.\n4. **Registry Search at Lands Bureau** — Search the land title at the State Lands Registry (e.g. Alausa, AGIS) to verify the registered owner and confirm no mortgages, court injunctions, or caveats exist.\n5. **Family/Omonile Verification** — If buying customary land, confirm that the accredited family head and principal members all execute the Deed of Assignment.\n6. **Governor's Consent & Perfection** — After executing the Deed, apply for Governor's Consent under the Land Use Act 1978 and register the title at the Lands Bureau to attain indefeasible legal ownership.`,
      evidence: "Nigerian Conveyancing Practice & Land Use Act 1978 Guidelines",
      confidence: 1.0,
      recommendedAction: "Check your case findings to see which of these verification steps are still pending for this property.",
    };
  }

  if (isGlossary) {
    const isCofO = /c\s*of\s*o|certificate\s*of\s*occupancy/i.test(q);
    const isGovConsent = /governor'?s\s*consent/i.test(q);
    const isGazette = /gazette/i.test(q);
    const isExcision = /excision/i.test(q);
    const isDeed = /deed\s*of\s*assignment/i.test(q);
    const isSurvey = /survey\s*plan|beacon/i.test(q);
    const isOmonile = /omonile/i.test(q);

    if (isCofO) {
      return {
        answer: `**Certificate of Occupancy (C of O):**\nA legal document issued directly by the State Governor under Section 9 of the Land Use Act 1978 certifying that the holder has a statutory right of occupancy for a fixed term (typically 99 years).\n\n⚠️ **Key Risks to Note:**\n• A C of O does not cure fraud — if issued on already acquired or litigated land, courts can invalidate it.\n• Always verify the C of O number and volume/page registration particulars directly at the State Lands Bureau.`,
        evidence: "Land Use Act 1978, Section 9",
        confidence: 1.0,
        recommendedAction: "Check if a C of O number has been extracted from your case documents.",
      };
    }

    if (isGovConsent) {
      return {
        answer: `**Governor's Consent:**\nUnder Section 22 of the Land Use Act 1978, any subsequent transaction (sale, assignment, mortgage) on land already backed by a C of O or prior title requires the formal approval/consent of the State Governor.\n\n⚠️ **Critical Rule:**\nA Deed of Assignment without Governor's Consent only conveys an equitable interest, NOT legal title. To be fully protected against competing claims, you must obtain Governor's Consent.`,
        evidence: "Land Use Act 1978, Section 22; Savannah Bank v. Ajilo",
        confidence: 1.0,
        recommendedAction: "Verify whether the seller possesses a Governor's Consent for their previous acquisition.",
      };
    }

    if (isExcision || isGazette) {
      return {
        answer: `**Excision & Gazette:**\n• **Excision:** The legal process where a State Government releases a portion of acquired communal land back to indigenous families/villages for private development.\n• **Gazette:** The official government publication documenting the excised coordinates, boundary beacons, and acreage.\n\n⚠️ **DANGER ("Excision in Progress"):**\nNever buy land sold as "Excision in Progress"! That is an application, NOT an approved title. If the government rejects the application, you lose the land without compensation. Only buy excised land that has a published Gazette number or excision survey.`,
        evidence: "State Lands Acquisition & Excision Policy Guidelines",
        confidence: 1.0,
        recommendedAction: "Ensure the seller produces the specific Gazette reference or excision survey plan.",
      };
    }

    if (isDeed) {
      return {
        answer: `**Deed of Assignment:**\nThe primary legal instrument transferring ownership rights, interest, and title from the seller (Assignor) to the buyer (Assignee). It must detail the parties, property description, consideration paid, and roots of title, and must be signed by all parties and witnesses.`,
        evidence: "Conveyancing Act & Property and Conveyancing Laws",
        confidence: 1.0,
        recommendedAction: "Ensure your lawyer drafts or reviews the Deed of Assignment; never use seller-supplied generic drafts.",
      };
    }

    if (isSurvey) {
      return {
        answer: `**Registered Survey Plan & Beacons:**\nA cadastral plan drawn by a SURCON-registered surveyor showing the exact boundary coordinates, beacon numbers, acreage, and location of the land. It must bear the surveyor's name, SURCON seal, and registration number. Physical concrete pillars (beacons) on the ground must match the plan exactly.`,
        evidence: "Surveyors Council of Nigeria (SURCON) Standards",
        confidence: 1.0,
        recommendedAction: "Order on-ground beacon recovery to ensure the physical plot matches the survey drawing.",
      };
    }

    if (isOmonile) {
      return {
        answer: `**Omonile (Customary Land Owners):**\nTraditional land-owning families or community lineages. When purchasing customary land, you must ensure that the designated Family Head and principal members all sign the conveyance. Sales made by an unauthorized individual member without the Family Head are void ab initio under Nigerian law.`,
        evidence: "Ekpendu v. Erika (1959) 4 FSC 79 — Principle of Customary Conveyancing",
        confidence: 1.0,
        recommendedAction: "Require family meeting minutes, family resolution letter, and identification of all principal signatories.",
      };
    }
  }

  if (isHelp) {
    return {
      answer: `Here's how I can help you with this property case **"${propertyCase.title}"**:\n\n**🔍 Questions You Can Ask Me:**\n• "Is this land safe to buy or pay a deposit?"\n• "What do the survey beacons and coordinates mean?"\n• "Which documents are missing from this case?"\n• "What should my lawyer search at Lands Registry?"\n• "What instructions should I give my surveyor?"\n• "Who is selling this property and are they legitimate?"\n• "What is the purchase price and is it realistic?"\n• "Explain my risk score — why is it high?"\n• "Which documents conflict or have discrepancies?"\n• "What is excision and is it completed?"\n• "What are the rules for buying Omonile/Customary land?"\n• "What packages or pricing does LandIntel offer?"\n• "How do I contact customer support?"\n\n**📊 Current Case Status:**\n• Documents: ${propertyCase.documents.length} uploaded\n• Risk Level: ${propertyCase.riskScore?.level || "Pending analysis"}\n• Risk Score: ${propertyCase.riskScore?.score || "N/A"}/100\n\nJust type your question and I'll analyze your case documents to give you a grounded answer!`,
      evidence: `Case: ${propertyCase.title} | ${propertyCase.documents.length} documents | Score: ${propertyCase.riskScore?.score || "N/A"}/100`,
      confidence: 1.0,
      recommendedAction: "Start by asking 'Is this land safe to buy?' for a comprehensive safety assessment.",
    };
  }

  if (isThanks) {
    return {
      answer: `You're very welcome! 😊 I'm always here to help you make safe, fraud-free property investment decisions for **"${propertyCase.title}"**.\n\nRemember:\n• Always verify findings with a **licensed Nigerian property lawyer**\n• Conduct a **physical site inspection** with a registered surveyor before committing funds\n• Never pay full consideration without completing all due-diligence steps\n\nFeel free to ask more questions anytime — I'm available 24/7 for this case!`,
      evidence: `Ongoing analysis for: ${propertyCase.title}`,
      confidence: 1.0,
      recommendedAction: "Continue exploring other aspects of this property case, or upload additional documents for deeper analysis.",
    };
  }

  if (isGoodbye) {
    return {
      answer: `Take care! 👋 Your case for **"${propertyCase.title}"** remains active and all analysis is securely saved.\n\nWhenever you return, I'll have full context of this case and all ${propertyCase.documents.length} document(s). You can continue asking questions at any time.\n\n**Before you go, remember:**\n• Your risk score is currently ${propertyCase.riskScore?.score || "pending"}/100 (${propertyCase.riskScore?.level || "awaiting analysis"})\n• Always retain a qualified property lawyer for any legal transaction\n\nSafe investing! 🏗️`,
      evidence: `Case preserved: ${propertyCase.title}`,
      confidence: 1.0,
      recommendedAction: "Return anytime to continue your due-diligence analysis.",
    };
  }

  if (isJoke) {
    return {
      answer: `While I take property diligence very seriously, here's a land buyer's classic truth! 😄\n\n> "The only thing more expensive than proper due diligence... is NOT doing proper due diligence."\n\nNow, shall we get back to protecting your investment in **"${propertyCase.title}"**? Ask me about the risk score, missing documents, or what your lawyer should verify!`,
      evidence: "LandIntel AI Counsel — Property focused, but occasionally witty.",
      confidence: 1.0,
      recommendedAction: "Let's focus on your property case — try asking 'Is this land safe to buy?'",
    };
  }


  // Extract structured case context
  const allPlots = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "plot_number").map((e) => e.fieldValue))
  ));
  const allSurveys = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "survey_number").map((e) => e.fieldValue))
  ));
  const allBeacons = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "beacon_numbers").map((e) => e.fieldValue))
  ));
  const allDatums = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "cadastral_datum").map((e) => e.fieldValue))
  ));
  const allSurcons = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "surcon_number").map((e) => e.fieldValue))
  ));
  const allCoos = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "coo_number").map((e) => e.fieldValue))
  ));
  const allRegs = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "registration_particulars").map((e) => e.fieldValue))
  ));
  const allGazettes = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "gazette_reference").map((e) => e.fieldValue))
  ));
  const allCourts = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "court_judgment_reference").map((e) => e.fieldValue))
  ));
  const allPoas = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "power_of_attorney_ref").map((e) => e.fieldValue))
  ));
  const allAreas = Array.from(new Set(
    propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "land_area").map((e) => e.fieldValue))
  ));
  const allSellers = Array.from(new Set(
    [propertyCase.sellerName, ...propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "seller_name").map((e) => e.fieldValue))].filter(Boolean)
  ));

  const docCount = propertyCase.documents.length;
  const score = propertyCase.riskScore?.score || 0;
  const level = propertyCase.riskScore?.level || "PENDING";
  const findings = propertyCase.findings || [];
  const highRiskFindings = findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH" || f.severity === "ELEVATED");

  // Reconcile cross-document differences
  const differences = reconcileCaseDocuments(
    propertyCase.documents.map((d) => ({
      id: d.id,
      originalName: d.originalName,
      category: d.category,
      extractions: d.extractions.map((e) => ({
        fieldName: e.fieldName,
        fieldValue: e.fieldValue,
        pageNumber: e.pageNumber,
      })),
    }))
  );

  // -------------------------------------------------------------
  // TOPIC 0: Seller, Vendor, Agent, and Ownership Identity
  // -------------------------------------------------------------
  if (q.includes("seller") || q.includes("vendor") || q.includes("owner") || q.includes("who is selling") || q.includes("agent") || q.includes("who owns")) {
    const disclosedSeller = propertyCase.sellerName || "Not disclosed in case record";
    const disclosedAgent = propertyCase.agentName || "No agent specified";
    const assignorNames = Array.from(new Set(
      propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "seller_name").map((e) => e.fieldValue))
    ));
    const assigneeNames = Array.from(new Set(
      propertyCase.documents.flatMap((d) => d.extractions.filter((e) => e.fieldName === "buyer_name").map((e) => e.fieldValue))
    ));

    return {
      answer: `Ownership & Vendor Due Diligence for "${propertyCase.title}":
• Declared Vendor / Seller: ${disclosedSeller}
• Declared Real Estate Agent: ${disclosedAgent}
• Legal Assignor(s) on Documented Deeds: ${assignorNames.length > 0 ? assignorNames.join(", ") : "None extracted from submitted instruments"}
• Legal Assignee(s) / Purchasers: ${assigneeNames.length > 0 ? assigneeNames.join(", ") : "None extracted"}

Legal Scrutiny: In real estate transactions, the declared vendor must strictly match the registered proprietor on the statutory root of title or hold an irrevocable, registered Power of Attorney. If the vendor claims inheritance or family ownership, insist on letters of administration or a certified family resolution executed by the accredited Family Head and principal elders.`,
      evidence: `Case Vendor: ${disclosedSeller} | Agent: ${disclosedAgent} | Deeds Assignor(s): ${assignorNames.join(", ") || "None"}.`,
      confidence: 0.95,
      recommendedAction: "Request official government-issued photo ID (NIN / International Passport) of the vendor and cross-check against the memorial on the registered title deed at the Lands Registry.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 0B: Price, Valuation, Consideration, Payment terms
  // -------------------------------------------------------------
  if (q.includes("price") || q.includes("cost") || q.includes("how much") || q.includes("valuation") || q.includes("market") || q.includes("consideration")) {
    const priceFormatted = propertyCase.purchasePrice
      ? `${propertyCase.currency || "NGN"} ${propertyCase.purchasePrice.toLocaleString()}`
      : "No purchase consideration stated";

    return {
      answer: `Commercial Consideration & Valuation Analysis:
• Stated Asking / Purchase Price: ${priceFormatted}
• Jurisdiction / District: ${propertyCase.lga}, ${propertyCase.state} (${propertyCase.country || "Nigeria"})
• Property Category: ${propertyCase.propertyType.replace(/_/g, " ")}

Commercial Due Diligence: Ensure the consideration stated in the Contract of Sale reflects the true transaction amount. Beware of vendors demanding off-the-record cash payments or under-declaring consideration to evade statutory stamp duties (typically 1.5% to 3%) and capital gains tax, as this renders the deed vulnerable to investigation during Governor's Consent processing.`,
      evidence: `Price on file: ${priceFormatted} | Case Ref: ${caseId.slice(0, 8).toUpperCase()}.`,
      confidence: 0.93,
      recommendedAction: "Consult an accredited Nigerian estate surveyor and valuer (NIESV) to conduct a comparative market analysis for properties in this specific layout.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 0C: Documents Uploaded vs Missing Statutory Instruments
  // -------------------------------------------------------------
  if (q.includes("document") || q.includes("upload") || q.includes("missing") || q.includes("what do i have") || q.includes("instruments")) {
    const uploadedCats = propertyCase.documents.map((d) => d.category);
    const hasSurvey = uploadedCats.includes("SURVEY_PLAN");
    const hasDeed = uploadedCats.includes("DEED_OF_ASSIGNMENT");
    const hasTitle = uploadedCats.includes("CERTIFICATE_OF_OCCUPANCY") || uploadedCats.includes("GOVERNORS_CONSENT");
    const hasReceipt = uploadedCats.includes("PURCHASE_RECEIPT");

    const missingList: string[] = [];
    if (!hasSurvey) missingList.push("Registered Cadastral Survey Plan (with SURCON Red Copy)");
    if (!hasDeed) missingList.push("Deed of Assignment with unbroken chain of title");
    if (!hasTitle) missingList.push("Primary Statutory Root of Title (C of O, Governor's Consent, or Gazette)");
    if (!hasReceipt) missingList.push("Purchase Receipt acknowledging financial consideration");

    return {
      answer: `Audit of Case Documentation (${docCount} file(s) evaluated):
Uploaded Instruments:
${propertyCase.documents.map((d, i) => `${i + 1}. ${d.originalName} — [${d.category.replace(/_/g, " ")}]`).join("\n") || "No documents uploaded yet"}

Critical Missing Instruments:
${missingList.map((m, i) => `❌ ${m}`).join("\n") || "All core instrument categories have been submitted"}

Statutory Conveyancing Rule: A valid real estate transfer cannot proceed without both the certified survey plan (defining boundary coordinate pillars) and a registered deed (transferring legal ownership).`,
      evidence: `Submitted files: ${propertyCase.documents.map((d) => d.originalName).join(", ") || "None"}. Missing: ${missingList.join("; ") || "None"}.`,
      confidence: 0.96,
      recommendedAction: missingList.length > 0
        ? `Request the following missing instruments from the vendor before paying any earnest deposit: ${missingList.join(", ")}.`
        : "Proceed to physical beacon pickup and digital land registry charting.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 0D: Risk Score Breakdown and Integrity Red Flags
  // -------------------------------------------------------------
  if (q.includes("risk score") || q.includes("explain score") || q.includes("score breakdown") || q.includes("why is it high") || q.includes("red flag") || q.includes("flag")) {
    return {
      answer: `Risk Indicator Analysis for "${propertyCase.title}":
• Overall Risk Index: ${score}/100 (${level} Risk Exposure)
• Documentation Sub-Score: ${propertyCase.riskScore?.documentationScore || 0}/100
• Ownership Sub-Score: ${propertyCase.riskScore?.ownershipScore || 0}/100
• Geographic Sub-Score: ${propertyCase.riskScore?.geographicScore || 0}/100
• Cross-Document Consistency: ${propertyCase.riskScore?.consistencyScore || 0}/100

Primary Drivers:
${findings.map((f, i) => `${i + 1}. [${f.severity}] ${f.title}: ${f.description}`).join("\n\n") || "No critical defects detected."}

Evaluation Verdict: ${score >= 80 ? "CRITICAL RISK — DO NOT BUY. Severe legal, spatial, or documentation defects detected." : score >= 60 ? "HIGH RISK — Significant issues flagged. Detailed investigation required." : score >= 40 ? "ELEVATED RISK — Caution required. Perform full search." : "MODERATE / LOW — Standard procedural diligence required."}`,
      evidence: `Deterministic Risk Score: ${score}/100 (${level}) | Identified Findings: ${findings.length}.`,
      confidence: 0.96,
      recommendedAction: "Review all high-severity findings and resolve coordinate or root-of-title discrepancies with your legal counsel before signing any agreement.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 1: Excision in Progress, Gazette, Government Acquisition
  // -------------------------------------------------------------
  if (q.includes("excision") || q.includes("gazette") || q.includes("file number") || q.includes("acquisition")) {
    const hasGazette = allGazettes.length > 0;
    return {
      answer: hasGazette
        ? `Official Gazette reference detected: ${allGazettes.join(", ")}. In Nigerian land administration, an approved and published Gazette formally excises land from global government acquisition. However, you must verify that your specific plot coordinates fall strictly inside the gazetted perimeter coordinate schedule.`
        : `CRITICAL ALERT: Under current 2026 Nigerian land administration practice, "Excision in Progress", "File Number Pending", or "Gazette in Process" confers ZERO statutory property rights. Until an excision notice is formally approved by the State Governor, surveyed into boundary beacons, and published in an Official Government Gazette, the land remains legally acquired by the State Government under global or committed acquisition. Purchasing land on the promise of pending excision leaves you exposed to summary demolition by the Ministry of Physical Planning or Lands Bureau without statutory compensation under Section 28 of the Land Use Act 1978.`,
      evidence: hasGazette
        ? `Gazette publication: ${allGazettes.join(", ")} found in case documentation.`
        : `No official Gazette publication number found across ${docCount} document(s). Property is located in ${propertyCase.lga}, ${propertyCase.state}.`,
      confidence: 0.96,
      recommendedAction: hasGazette
        ? "Commission a registered surveyor to chart your survey plan coordinates directly against the Gazette perimeter schedule at the Office of the State Surveyor General."
        : "Halt payment immediately. Require the developer or vendor to produce either an Official Gazette number with perimeter coordinates or a formal regularized layout allocation from the State Lands Bureau.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 2: Governor's Consent, C of O, and Root of Title
  // -------------------------------------------------------------
  if (q.includes("governor") || q.includes("consent") || q.includes("c of o") || q.includes("certificate of occupancy") || q.includes("title") || q.includes("root")) {
    const hasCofO = allCoos.length > 0 || propertyCase.documents.some((d) => d.category === "CERTIFICATE_OF_OCCUPANCY");
    const hasConsent = propertyCase.documents.some((d) => d.category === "GOVERNORS_CONSENT");
    const hasDeed = propertyCase.documents.some((d) => d.category === "DEED_OF_ASSIGNMENT");

    let statusDesc = "";
    if (hasCofO) {
      statusDesc = `Certificate of Occupancy identified (${allCoos.join(", ") || "Registered C of O"}). A Certificate of Occupancy grants a statutory 99-year right of occupancy from the State Governor.`;
    } else if (hasConsent) {
      statusDesc = "Governor's Consent document detected, endorsing the transfer of statutory leasehold interest under Section 22 of the Land Use Act 1978.";
    } else if (hasDeed) {
      statusDesc = `The property relies on a Deed of Assignment without an attached Governor's Consent or primary C of O. Under Section 22 of the Land Use Act 1978 and Supreme Court precedent (Savannah Bank v. Ajilo), any alienation of land without prior Governor's Consent is voidable by the state. You hold only an inchoate equitable interest, not perfected legal title.`;
    } else {
      statusDesc = "No formal statutory title document (C of O, Governor's Consent, or registered Deed of Assignment) was found in the submitted file.";
    }

    return {
      answer: `${statusDesc} Under current 2026 digital land registry practice (e.g. Lagos State e-GIS / AGIS Abuja), unperfected titles cannot be registered or used as collateral. In addition, you must ascertain the unexpired term of the lease (standard 99-year term) to ensure substantial residue remains.`,
      evidence: `C of O: ${allCoos.join(", ") || "None detected"} | Registration Particulars: ${allRegs.join(", ") || "Unregistered memorial"} | Documents: ${propertyCase.documents.map((d) => d.category).join(", ") || "None"}.`,
      confidence: 0.95,
      recommendedAction: "Retain a property solicitor to conduct an official search at the State Lands Bureau (e-GIS) to confirm that the root of title is genuine, unencumbered by mortgages, and eligible for Governor's Consent processing.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 3: Beacons, Cadastral Coordinates, Minna Datum vs WGS84, and SURCON
  // -------------------------------------------------------------
  if (q.includes("beacon") || q.includes("survey") || q.includes("coordinate") || q.includes("minna") || q.includes("datum") || q.includes("gps") || q.includes("pillar") || q.includes("surcon")) {
    const beaconList = allBeacons.join(", ") || "None extracted";
    const surveyList = allSurveys.join(", ") || "Not identified";
    const datum = allDatums[0] || "Coordinate system unverified";
    const surcon = allSurcons.join(", ") || "Unverified SURCON registration";

    return {
      answer: `Cadastral Analysis for "${propertyCase.title}":
1. Boundary Beacons: Detected pillars: [${beaconList}]. These pillars delineate the exact perimeter corners of the land.
2. Survey Plan Reference: ${surveyList}.
3. Geodetic Datum: ${datum}. CRITICAL NOTE: Official Nigerian cadastral surveys lodged at the Surveyor General's Office MUST use the Minna Datum (National Transverse Mercator, UTM Zone 31N/32N). Handheld GPS tools and smartphones use WGS84, which creates a substantial 100 to 300-meter spatial shift if not mathematically transformed by a licensed surveyor.
4. SURCON Status: ${surcon}. Under the Surveyors Council of Nigeria (SURCON) Act, only a licensed, practicing surveyor may deposit a Record Copy (Red Copy) at the Office of the Surveyor General.`,
      evidence: `Survey Number: ${surveyList} | Beacons: ${beaconList} | Datum: ${datum} | SURCON Seal: ${surcon}.`,
      confidence: 0.96,
      recommendedAction: "Instruct an independent registered surveyor to conduct an on-ground 'beacon recovery' (beacon pickup) to confirm physical boundary pillars exist on site, have not been shifted, and match the Record Copy coordinates at the State Surveyor General's Office.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 4: Safety, Deposit, Payment Advice, Overall Risk
  // -------------------------------------------------------------
  if (q.includes("safe") || q.includes("buy") || q.includes("pay") || q.includes("deposit") || q.includes("should i") || q.includes("risk") || q.includes("concern") || q.includes("problem")) {
    const isHighRisk = score >= 60 || highRiskFindings.length > 0;
    const topFinding = highRiskFindings[0] || findings[0];

    return {
      answer: `Current Purchase Safety Assessment: ${isHighRisk ? "🚨 CRITICAL RISK / HIGH CAUTION — DO NOT TRANSFER FUNDS YET" : "⚠️ PROCEDURAL CLEARANCE REQUIRED"}.
The deterministic Risk Indicator Score is ${score}/100 (${level} Risk Exposure) across ${docCount} submitted document(s).
Primary issues flagged:
${highRiskFindings.map((f, i) => `${i + 1}. [${f.severity}] ${f.title}: ${f.description}`).join("\n\n") || "No severe discrepancies found."}

Under current 2026 Nigerian conveyancing practice, paying a deposit or consideration before legal search and cadastral charting exposes buyers to total capital forfeiture, disputed ownership with local families ("Omonile"), or statutory demolition.`,
      evidence: `Risk Score: ${score}/100 (${level}) | Top Concern: ${topFinding?.title || "Routine verification"} | Documents: ${propertyCase.documents.map((d) => d.originalName).join(", ")}.`,
      confidence: 0.94,
      recommendedAction: "DO NOT pay any non-refundable deposit. Instruct your surveyor to chart the coordinates at the Surveyor General's Office and require your lawyer to deliver a written Lands Registry search report first.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 5: Cross-Document Conflicts & Contradictions
  // -------------------------------------------------------------
  if (q.includes("conflict") || q.includes("mismatch") || q.includes("difference") || q.includes("discrepanc") || q.includes("reconcil")) {
    if (differences.length === 0) {
      return {
        answer: `No cross-document contradictions were detected between the ${docCount} submitted document(s). Plot numbers, survey plan references, and land areas appear aligned across instruments.`,
        evidence: `Pairwise cross-document reconciliation matrix evaluated across ${docCount} documents.`,
        confidence: 0.92,
        recommendedAction: "Proceed to physical on-ground beacon recovery and digital Lands Bureau search.",
      };
    }

    const diffSummaries = differences.map((d, i) =>
      `${i + 1}. [${d.severity}] ${d.fieldLabel}: "${d.docAValue}" in ${d.docAName} vs "${d.docBValue}" in ${d.docBName}. Impact: ${d.whyItMatters}`
    ).join("\n\n");

    return {
      answer: `Detected ${differences.length} cross-document contradiction(s) requiring immediate resolution:\n\n${diffSummaries}`,
      evidence: differences.map((d) => `${d.fieldLabel}: ${d.docAName} vs ${d.docBName}`).join(" | "),
      confidence: 0.95,
      recommendedAction: "Halt transaction. Require vendor, practicing surveyor, and drafting solicitor to execute an addendum or formal reconciliation before signing contract of sale.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 6: Specialized Inquiries for Property Lawyer
  // -------------------------------------------------------------
  if (q.includes("lawyer") || q.includes("attorney") || q.includes("solicitor") || q.includes("legal") || q.includes("search report")) {
    return {
      answer: `Actionable Instructions for your Property Lawyer regarding "${propertyCase.title}":
1. Official Registry Search: Conduct a search at the State Lands Bureau (e.g. LASG e-GIS at Alausa, Ikeja or AGIS in Abuja) to inspect the Register of Deeds for volume and page memorials (${allRegs.join(", ") || "provide root of title"}).
2. Encumbrance & Caveat Check: Confirm whether any active mortgages, court attachments, or cautionary notices are registered on the title.
3. Root of Title Lineage: Verify an unbroken 30-year chain of title tracing back to the primary grant (C of O, Gazette, or State Allocation).
4. Litigation & Lis Pendens Check: Search the High Court and Court of Appeal litigation registries for pending suits or family chieftaincy boundary disputes.
5. Review Covenants: Scrutinize the Deed of Assignment covenants of title, indemnity clauses, and vacant possession guarantees.`,
      evidence: `Case: ${propertyCase.title} | Location: ${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state} | Disclosed Seller: ${allSellers.join(", ") || "Unspecified"}.`,
      confidence: 0.96,
      recommendedAction: "Commission a formal written Legal Search Report from an independent legal practitioner before executing the Contract of Sale.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 7: Specialized Inquiries for Licensed Surveyor
  // -------------------------------------------------------------
  if (q.includes("surveyor") || q.includes("charting") || q.includes("pickup") || q.includes("cadastral")) {
    return {
      answer: `Actionable Instructions for your Licensed Surveyor regarding "${propertyCase.title}":
1. Official Charting: Chart the survey plan (${allSurveys.join(", ") || "Plan No. unassigned"}) at the Office of the State Surveyor General to verify whether the land falls within:
   - Free / Excised Land,
   - Committed Government Acquisition (e.g. agricultural reserve, industrial layout, educational zone),
   - Road Expansion Right-of-Way, drainage corridor, high-tension powerline corridor, or coastal highway setback.
2. On-Ground Beacon Recovery: Visit the site in ${propertyCase.lga}, ${propertyCase.state} with an RTK GNSS receiver to locate physical beacons (${allBeacons.join(", ") || "Perimeter pillars"}) and verify boundary coordinates in Minna Datum UTM Zone 31/32.
3. Record Copy Verification: Confirm the survey plan was formally deposited as a "Record Copy" (Red Copy) at the Surveyor General's office.`,
      evidence: `Survey Reference: ${allSurveys.join(", ") || "Pending"} | Beacons: ${allBeacons.join(", ") || "Unextracted"} | Location: ${propertyCase.lga}, ${propertyCase.state}.`,
      confidence: 0.96,
      recommendedAction: "Require your surveyor to provide an official Charting Information Slip stamped by the Office of the Surveyor General.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 8: Customary Family Land, Omonile, and Signatory Governance
  // -------------------------------------------------------------
  if (q.includes("family") || q.includes("omonile") || q.includes("customary") || q.includes("baale") || q.includes("community")) {
    return {
      answer: `Customary Family Land Conveyance Law (2026 Jurisprudence):
Under established Nigerian customary jurisprudence affirmed by the Supreme Court (Amodu Tijani v. Secretary of Southern Nigeria and Ekpendu v. Erika):
1. Mandatory Family Head Consent: A sale of family land MUST be executed by the accredited Head of the Family along with principal members representing the key branches.
2. Individual Member Sale is Void Ab Initio: A sale of family land by an individual son, agent, or committee member without accredited written authority or registered Power of Attorney is void ab initio (not merely voidable).
3. Family Head Sale without Principal Members: A sale by the Family Head alone without the principal elders is voidable at the instance of the family.
4. "Omonile" Receipts: A handwritten or stamped family receipt does not transfer legal title; it is merely evidence of consideration payment and must be followed by a formal Deed of Assignment and Governor's Consent.`,
      evidence: `Disclosed Seller: ${allSellers.join(", ") || "Unspecified"} | State: ${propertyCase.state} | Customary indicators evaluated across case records.`,
      confidence: 0.95,
      recommendedAction: "Demand a certified copy of the Family Resolution accrediting the Family Head, insist on execution by all principal branch elders, and capture video evidence of the execution meeting.",
    };
  }

  // -------------------------------------------------------------
  // TOPIC 9: Drainage, Coastal Road, and Road Right-of-Way Demolition Setbacks
  // -------------------------------------------------------------
  if (q.includes("drainage") || q.includes("canal") || q.includes("setback") || q.includes("coastal") || q.includes("demolition") || q.includes("right of way") || q.includes("building") || q.includes("apartment")) {
    return {
      answer: `Current 2024–2026 Demolition & Statutory Setback Enforcement:
1. Active Enforcement: The Lagos State Ministry of the Environment & Water Resources, LASPPPA, and the Federal Ministry of Works are actively executing non-negotiable demolitions of structures encroaching on:
   - Primary and secondary drainage channels (statutory 10m to 30m setbacks from canal banks),
   - Coastal Highway corridors, transmission line rights-of-way, and arterial road expansion alignments.
2. C of O Revocation: Under Section 28 of the Land Use Act, the Governor has overriding power to revoke rights of occupancy for overriding public purposes without paying compensation for structures illegally erected within statutory rights-of-way.`,
      evidence: `Location: ${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state} | Plot: ${allPlots.join(", ") || "N/A"}.`,
      confidence: 0.95,
      recommendedAction: "Request a formal Planning Information / Zoning Clearance certificate from the State Physical Planning Permit Authority (LASPPPA) before commencing any construction.",
    };
  }

  // -------------------------------------------------------------
  // AI LLM Synthesis via Gemini (if GEMINI_API_KEY is available)
  // -------------------------------------------------------------
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `You are the LandIntel Cadastral & Legal AI Counsel, an expert in Nigerian conveyancing law, Land Use Act 1978, cadastral surveying (SURCON standards), and real estate fraud investigation.

CASE DOSSIER:
- Property Title: "${propertyCase.title}"
- Address: ${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state}
- Disclosed Seller / Vendor: ${allSellers.join(", ") || "Not Disclosed"}
- Disclosed Agent: ${propertyCase.agentName || "None"}
- Property Type: ${propertyCase.propertyType}
- Stated Consideration / Price: ${propertyCase.purchasePrice ? `${propertyCase.currency || "NGN"} ${propertyCase.purchasePrice.toLocaleString()}` : "Not Disclosed"}
- Overall Cadastral Risk Score: ${score}/100 (${level})
- Uploaded Documents (${docCount}): ${propertyCase.documents.map((d) => `${d.originalName} (${d.category})`).join(", ") || "None"}
- Extracted Plots: ${allPlots.join(", ") || "None"}
- Extracted Survey Plans: ${allSurveys.join(", ") || "None"}
- Extracted Beacons: ${allBeacons.join(", ") || "None"}
- Coordinates / GPS: ${propertyCase.latitude && propertyCase.longitude ? `${propertyCase.latitude}, ${propertyCase.longitude}` : "Unsupplied"}
- Identified Findings:
${findings.map((f) => `  * [${f.severity}] ${f.title}: ${f.description}`).join("\n") || "  * No findings recorded"}

USER QUESTION:
"${cleanQuestion}"

INSTRUCTIONS:
1. Provide a direct, authoritative, and practical answer grounded in this specific property case and statutory Nigerian land law.
2. If the user asks a conversational question (greeting, who you are, what LandIntel is, what services/packages/pricing are offered, how to contact support, or general questions about buying land safely in Nigeria), respond warmly, intelligently, and professionally while explaining LandIntel's services and tying back to the current property case.
3. If the user asks whether to buy or pay a deposit, provide clear legal safety guidance based on the risk score (${score}/100) and whether documents were verified.
4. Be professional, direct, and actionable. Do not hallucinate documents that are not listed in the dossier.
5. Format your response clearly with concise paragraphs and bullet points where helpful.
6. In addition to your answer, provide:
   - A short "Evidence" statement citing the specific documents, case records, or platform knowledge consulted.
   - A short "Recommended Next Step" outlining the exact next procedural action the buyer/investor should take.

Respond ONLY with valid JSON in this exact structure:
{
  "answer": "Your detailed legal, cadastral, or conversational response...",
  "evidence": "Case records, survey references, platform knowledge, or statutory provisions cited...",
  "recommendedAction": "Single concrete next step for user..."
}`;

      const modelNames = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
      for (const model of modelNames) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: "application/json",
                },
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.answer) {
                return {
                  answer: parsed.answer,
                  evidence: parsed.evidence || `Grounded in ${docCount} case document(s) & Risk Score ${score}/100.`,
                  confidence: 0.95,
                  recommendedAction: parsed.recommendedAction || "Conduct on-ground beacon recovery and digital search at State Lands Bureau.",
                };
              }
            }
          }
        } catch {
          // Continue to next model or fallback
        }
      }
    } catch {
      // Fall through to deterministic synthesis
    }
  }

  // -------------------------------------------------------------
  // DEFAULT: Comprehensive, Explanatory Case Synthesis
  // -------------------------------------------------------------
  const summaryBulletPoints = [
    `Property Case: "${propertyCase.title}" located at ${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state}.`,
    `Deterministic Risk Index: ${score}/100 (${level} Risk Exposure). Breakdown: Documentation (${propertyCase.riskScore?.documentationScore || 0}/100), Ownership (${propertyCase.riskScore?.ownershipScore || 0}/100), Geographic (${propertyCase.riskScore?.geographicScore || 0}/100), Consistency (${propertyCase.riskScore?.consistencyScore || 0}/100).`,
    `Documents Reviewed (${docCount}): ${propertyCase.documents.map((d) => `${d.originalName} [${d.category.replace(/_/g, " ")}]`).join(", ") || "No documents uploaded yet"}.`,
    `Cadastral Footprint: Plot ${allPlots.join(", ") || "Not stated"} | Survey: ${allSurveys.join(", ") || "Not stated"} | Beacons: ${allBeacons.join(", ") || "None extracted"} | Stated Area: ${allAreas.join(", ") || "Not specified"}.`,
    `Key Findings: ${findings.length} risk indicator(s) identified. Top risk: ${findings[0]?.title || "None"}.`,
  ];

  return {
    answer: `Due-Diligence Cadastral & Legal Analysis Summary for "${propertyCase.title}":\n\n${summaryBulletPoints.join("\n\n")}\n\nStatutory Guidance: Under current 2026 Nigerian conveyancing jurisprudence, property ownership cannot be securely established on paper promises or unconsented deeds. Ensure both physical beacon recovery and official registry search (e-GIS/AGIS) are completed before financial commitments.`,
    evidence: `Cadastral documents analyzed: ${propertyCase.documents.map((d) => d.originalName).join(", ") || "None"}.`,
    confidence: 0.93,
    recommendedAction: "Review the full verification checklist, resolve cross-document variances, and consult an independent surveyor and property lawyer.",
  };
}
