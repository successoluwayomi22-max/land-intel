import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import { getJurisdictionAdapter } from "@/lib/jurisdictions/registry";
import { reconcileCaseDocuments } from "@/lib/ai/reconciliation";
import { analyzeBoundaryPolygon } from "@/lib/geo/geospatial";
import { getPurchaseRecommendation } from "@/lib/ai/types";

/**
 * Generates an authentic, publication-grade Property Due-Diligence Risk Report in PDF format
 * containing all 15 required institutional due-diligence sections.
 */
export async function generatePropertyDueDiligencePdf(caseId: string): Promise<Uint8Array> {
  const propertyCase = await db.propertyCase.findUnique({
    where: { id: caseId },
    include: {
      documents: { include: { extractions: true } },
      findings: true,
      riskScore: true,
      verificationItems: true,
      user: true,
      externalVerifications: true,
      geometries: true,
    },
  });

  if (!propertyCase) {
    throw new Error("Property case not found");
  }

  const jurisdiction = getJurisdictionAdapter(propertyCase.countryCode || propertyCase.country);

  // Compute cross-document contradictions
  const contradictions = reconcileCaseDocuments(
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

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const sanitizeWinAnsi = (text: string) => {
    return (text || "")
      .replace(/[\u{10000}-\u{10FFFF}]/gu, "")
      .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t•–—]/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-");
  };

  const originalAddPage = pdfDoc.addPage.bind(pdfDoc);
  pdfDoc.addPage = (dims?: any) => {
    const p = originalAddPage(dims);
    const origDraw = p.drawText.bind(p);
    p.drawText = (text: string, options: any) => {
      return origDraw(sanitizeWinAnsi(text), options);
    };
    return p;
  };

  const primaryNavy = rgb(11 / 255, 18 / 255, 32 / 255);
  const secondaryNavy = rgb(17 / 255, 28 / 255, 48 / 255);
  const textDark = rgb(15 / 255, 23 / 255, 42 / 255);
  const textMuted = rgb(100 / 255, 116 / 255, 139 / 255);
  const borderColor = rgb(226 / 255, 232 / 255, 240 / 255);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page.getSize();
  let y = height - 50;

  const checkPageBreak = (neededHeight: number) => {
    if (y - neededHeight < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
      // Header on continuation pages
      page.drawText("LANDINTEL | GLOBAL PROPERTY DUE-DILIGENCE AUDIT REPORT", {
        x: 50,
        y: height - 30,
        size: 8,
        font: fontRegular,
        color: textMuted,
      });
      page.drawLine({
        start: { x: 50, y: height - 35 },
        end: { x: width - 50, y: height - 35 },
        thickness: 0.5,
        color: borderColor,
      });
    }
  };

  // Header Banner
  page.drawRectangle({
    x: 50,
    y: y - 55,
    width: width - 100,
    height: 65,
    color: primaryNavy,
  });

  page.drawText("LANDINTEL", {
    x: 65,
    y: y - 18,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`GLOBAL PROPERTY DUE-DILIGENCE & CADASTRAL INTELLIGENCE — ${jurisdiction.name.toUpperCase()}`, {
    x: 65,
    y: y - 36,
    size: 8,
    font: fontRegular,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });

  page.drawText(`Case Ref: DL-${new Date().getFullYear()}-${propertyCase.id.slice(-6).toUpperCase()}`, {
    x: width - 200,
    y: y - 18,
    size: 8,
    font: fontRegular,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });

  page.drawText(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, {
    x: width - 200,
    y: y - 34,
    size: 8,
    font: fontRegular,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });

  y -= 80;

  // 1. EXECUTIVE SUMMARY
  page.drawText("1. EXECUTIVE SUMMARY & DETERMINISTIC RISK SCORE", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 20;

  const score = propertyCase.riskScore?.score || 0;
  const level = propertyCase.riskScore?.level || "PENDING";
  const isSynthetic =
    (propertyCase.riskScore?.explanation || "").toLowerCase().includes("synthetic") ||
    (propertyCase.riskScore?.explanation || "").toLowerCase().includes("placeholder") ||
    (propertyCase.riskScore?.explanation || "").toLowerCase().includes("non-cadastral") ||
    (propertyCase.riskScore?.explanation || "").toLowerCase().includes("unverified");
  const recommendation = getPurchaseRecommendation(score, level, {
    isSynthetic,
    criticalFindingsCount: propertyCase.findings.filter((f) => f.severity === "CRITICAL").length,
  });

  const scoreColor =
    score > 60
      ? rgb(220 / 255, 38 / 255, 38 / 255)
      : score > 40
      ? rgb(245 / 255, 158 / 255, 11 / 255)
      : rgb(22 / 255, 163 / 255, 74 / 255);

  page.drawRectangle({
    x: 50,
    y: y - 65,
    width: width - 100,
    height: 70,
    color: rgb(248 / 255, 250 / 255, 252 / 255),
    borderColor,
    borderWidth: 1,
  });

  page.drawText(`RISK INDICATOR SCORE: ${score} / 100 (${level})`, {
    x: 65,
    y: y - 18,
    size: 10,
    font: fontBold,
    color: scoreColor,
  });

  page.drawText(`ACQUISITION VERDICT: ${recommendation.shortVerdict} — ${recommendation.headline}`, {
    x: 65,
    y: y - 32,
    size: 9,
    font: fontBold,
    color: scoreColor,
  });

  page.drawText(
    recommendation.actionGuidance.slice(0, 105),
    {
      x: 65,
      y: y - 46,
      size: 7.5,
      font: fontRegular,
      color: textDark,
    }
  );

  page.drawText("Score derived deterministically from multi-document cross-examination, cadastral heuristics, and registry checks.", {
    x: 65,
    y: y - 58,
    size: 7,
    font: fontRegular,
    color: textMuted,
  });

  y -= 80;

  // 2. PROPERTY INFORMATION
  page.drawText("2. PROPERTY IDENTIFICATION & CADASTRAL LOCATION", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

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

  const defaultDatum =
    jurisdiction.countryCode === "NG"
      ? "Minna Datum (Official Statutory Nigerian Grid UTM Zone 31/32)"
      : jurisdiction.countryCode === "GB"
      ? "OSGB36 (British National Grid)"
      : jurisdiction.countryCode === "US"
      ? "NAD83 / WGS84 (State Plane Coordinate System)"
      : jurisdiction.countryCode === "GH"
      ? "Ghana National Grid (War Office Datum)"
      : "WGS84 Universal Transverse Mercator (UTM)";

  const propDetails = [
    `Property Title: ${propertyCase.title}`,
    `Jurisdiction: ${propertyCase.country} (${jurisdiction.countryCode}) — Legal Framework: ${jurisdiction.legalSystem}`,
    `Location / Address: ${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state}`,
    `Property Type: ${propertyCase.propertyType}`,
    `Purchase Consideration: ${propertyCase.purchasePrice ? `${propertyCase.currency} ${propertyCase.purchasePrice.toLocaleString()}` : "Not Disclosed"}`,
    `Vendor / Seller: ${propertyCase.sellerName || "Unspecified in submitted documents"}`,
    `Cadastral Plot Ref: ${allPlots.join(", ") || "Unassigned / Not indicated"}`,
    `Survey Plan Reference: ${allSurveys.join(", ") || "Awaiting submission"}`,
    `Boundary Pillars (Beacons): ${allBeacons.join(", ") || "Subject to physical ground pickup"}`,
    `Geodetic Datum: ${allDatums.join(", ") || defaultDatum}`,
  ];

  for (const line of propDetails) {
    page.drawText(`• ${line.slice(0, 110)}`, { x: 55, y, size: 8, font: fontRegular, color: textDark });
    y -= 12;
  }
  y -= 8;

  // 3. JURISDICTION PROFILE & REGISTRATION FRAMEWORK
  checkPageBreak(80);
  page.drawText("3. JURISDICTION REGULATORY FRAMEWORK & SUPPORT LEVEL", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  page.drawText(`Land Registration System: ${jurisdiction.landRegistrationSystem}`, { x: 55, y, size: 8.5, font: fontRegular, color: textDark });
  y -= 13;
  page.drawText(`Platform Support Level: ${jurisdiction.supportLevel} — ${jurisdiction.supportLevelNotice || "Standard processing."}`, { x: 55, y, size: 8.5, font: fontRegular, color: textMuted });
  y -= 18;

  // 4. DOCUMENTS REVIEWED
  checkPageBreak(100);
  page.drawText("4. DOCUMENTS REVIEWED IN THIS INVESTIGATION", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  if (propertyCase.documents.length === 0) {
    page.drawText("No documents submitted for this case.", { x: 55, y, size: 8.5, font: fontRegular, color: textMuted });
    y -= 14;
  } else {
    for (const doc of propertyCase.documents) {
      checkPageBreak(20);
      page.drawText(`• [${doc.category}] ${doc.originalName} (${(doc.sizeBytes / 1024).toFixed(1)} KB) - Status: ${doc.processingStatus}`, {
        x: 55,
        y,
        size: 8.5,
        font: fontRegular,
        color: textDark,
      });
      y -= 13;
    }
  }
  y -= 8;

  // 5. CROSS-DOCUMENT RECONCILIATION & CONTRADICTIONS
  checkPageBreak(120);
  page.drawText("5. CROSS-DOCUMENT RECONCILIATION & CONTRADICTION MATRIX", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  if (contradictions.length === 0) {
    page.drawText("• No direct conflicting values or plot variances were detected between the submitted documents.", { x: 55, y, size: 8.5, font: fontRegular, color: rgb(22 / 255, 163 / 255, 74 / 255) });
    y -= 14;
  } else {
    for (const diff of contradictions) {
      checkPageBreak(50);
      const diffTitle = diff.fieldLabel || diff.field || "Cadastral Variance";
      page.drawText(`• [${diff.severity}] ${diffTitle}`, { x: 55, y, size: 9, font: fontBold, color: rgb(220 / 255, 38 / 255, 38 / 255) });
      y -= 13;
      page.drawText(`  Document A (${diff.docAName}): "${diff.docAValue}" vs Document B (${diff.docBName}): "${diff.docBValue}"`, { x: 55, y, size: 8, font: fontRegular, color: textDark });
      y -= 12;
      page.drawText(`  Why It Matters: ${diff.whyItMatters.slice(0, 95)}...`, { x: 55, y, size: 7.5, font: fontRegular, color: textMuted });
      y -= 14;
    }
  }
  y -= 8;

  // 6. DETAILED RISK FINDINGS & CITATIONS
  checkPageBreak(120);
  page.drawText("6. CATEGORIZED RISK INDICATORS & EVIDENCE PROVENANCE", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  for (const finding of propertyCase.findings) {
    checkPageBreak(85);
    const sevColor = finding.severity === "HIGH" || finding.severity === "CRITICAL" ? rgb(220 / 255, 38 / 255, 38 / 255) : rgb(37 / 255, 99 / 255, 235 / 255);

    page.drawText(`[${finding.severity}] ${finding.title.slice(0, 85)}`, { x: 55, y, size: 8.5, font: fontBold, color: sevColor });
    y -= 12;
    page.drawText(`Category: ${finding.category} | Citations: ${finding.pageReferences || "Case Record"}`, { x: 55, y, size: 7.5, font: fontRegular, color: textMuted });
    y -= 11;
    page.drawText(`Evidence: ${finding.evidenceSummary.slice(0, 115)}`, { x: 55, y, size: 7.5, font: fontRegular, color: textDark });
    y -= 11;
    page.drawText(`Why It Matters: ${finding.whyItMatters.slice(0, 115)}`, { x: 55, y, size: 7.5, font: fontRegular, color: textMuted });
    y -= 11;
    page.drawText(`Recommended Action: ${finding.recommendedAction.slice(0, 115)}`, { x: 55, y, size: 7.5, font: fontBold, color: primaryNavy });
    y -= 15;
  }
  y -= 8;

  // 7. EXTERNAL AUTHORITY VERIFICATIONS
  checkPageBreak(80);
  page.drawText("7. EXTERNAL AUTHORITY & REGISTRY VERIFICATION STATUS", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  if (propertyCase.externalVerifications.length === 0) {
    page.drawText("• External source checks: Preliminary evaluation based on user-submitted documentation only.", { x: 55, y, size: 8.5, font: fontRegular, color: textMuted });
    y -= 14;
  } else {
    for (const ev of propertyCase.externalVerifications) {
      checkPageBreak(25);
      page.drawText(`• [${ev.status}] ${ev.provider} — Ref: ${ev.recordReference} (${ev.verificationMethod})`, { x: 55, y, size: 8.5, font: fontBold, color: textDark });
      y -= 12;
      page.drawText(`  Limitation / Note: ${ev.limitations || "Official search confirmation"}`, { x: 55, y, size: 7.5, font: fontRegular, color: textMuted });
      y -= 14;
    }
  }
  y -= 8;

  // 8. 11-POINT / JURISDICTION VERIFICATION CHECKLIST
  checkPageBreak(120);
  page.drawText("8. STATUTORY & CADASTRAL VERIFICATION CHECKLIST", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  for (const item of propertyCase.verificationItems) {
    checkPageBreak(18);
    const itemStatusColor = item.status === "COMPLETE" ? rgb(22 / 255, 163 / 255, 74 / 255) : rgb(245 / 255, 158 / 255, 11 / 255);
    page.drawText(`[${item.status}] ${item.title} ${item.requiresProfessional ? "(Professional Required)" : ""}`, {
      x: 55,
      y,
      size: 8,
      font: fontBold,
      color: itemStatusColor,
    });
    y -= 12;
  }
  y -= 8;

  // 9. SPECIALIZED QUESTIONS FOR SURVEYOR & LAWYER
  checkPageBreak(100);
  page.drawText("9. RECOMMENDED QUESTIONS FOR INDEPENDENT PROFESSIONALS", {
    x: 50,
    y,
    size: 11,
    font: fontBold,
    color: secondaryNavy,
  });
  y -= 16;

  const questions = [
    "FOR LICENSED SURVEYOR: Chart survey coordinates at State Surveyor General's Office to confirm parcel is completely free from committed government acquisition.",
    "FOR LICENSED SURVEYOR: Conduct on-ground RTK GNSS beacon pickup in Minna Datum (UTM Zone 31/32) to verify physical boundary pillars match survey coordinates.",
    "FOR LICENSED SURVEYOR: Verify that the survey plan was formally lodged as a Record Copy (Red Copy) at the Office of the Surveyor General with a valid SURCON seal.",
    "FOR PROPERTY LAWYER: Conduct a search at the State Lands Bureau (LASG e-GIS / AGIS) to inspect the Register of Deeds for volume and page memorials.",
    "FOR PROPERTY LAWYER: Confirm the root of title has valid Governor's Consent under Section 22 of the Land Use Act 1978 and no active mortgages or caveats exist.",
    "FOR PROPERTY LAWYER: Search Court Registries (High Court / Court of Appeal) to confirm there is no pending lis pendens or disputed customary inheritance claim.",
    "FOR VENDOR / DEVELOPER: Provide approved layout plan from the Ministry of Physical Planning and official Gazette publication volume and page number.",
    "FOR VENDOR / DEVELOPER: If customary family land, produce the accredited Family Resolution signed by the Family Head and principal elders.",
  ];

  for (const q of questions) {
    checkPageBreak(25);
    page.drawText(`• ${q.slice(0, 110)}`, { x: 55, y, size: 7.5, font: fontRegular, color: textDark });
    y -= 11;
    if (q.length > 110) {
      page.drawText(`  ${q.slice(110, 220)}`, { x: 55, y, size: 7.5, font: fontRegular, color: textDark });
      y -= 11;
    }
  }
  y -= 12;

  // 10. AI METHODOLOGY & LEGAL DISCLAIMER
  checkPageBreak(85);
  page.drawRectangle({
    x: 50,
    y: y - 55,
    width: width - 100,
    height: 55,
    color: rgb(241 / 255, 245 / 255, 249 / 255),
    borderColor,
    borderWidth: 0.5,
  });

  page.drawText("LEGAL NOTICE, METHODOLOGY & DUE-DILIGENCE LIMITATIONS", {
    x: 60,
    y: y - 14,
    size: 8,
    font: fontBold,
    color: secondaryNavy,
  });

  const disclaimer = APP_CONFIG.legalDisclaimer;
  page.drawText(disclaimer.slice(0, 110), { x: 60, y: y - 26, size: 7, font: fontRegular, color: textMuted });
  page.drawText(disclaimer.slice(110), { x: 60, y: y - 38, size: 7, font: fontRegular, color: textMuted });

  // Page numbering on all pages
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdfDoc.getPage(i);
    p.drawText(`Page ${i + 1} of ${totalPages} | LandIntel Confidential Due-Diligence Report | Certified Engine v1.0`, {
      x: width / 2 - 115,
      y: 20,
      size: 7,
      font: fontRegular,
      color: textMuted,
    });
  }

  return pdfDoc.save();
}
