const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DiasporaLand AI database...");

  // 1. Seed Plans
  await prisma.plan.upsert({
    where: { name: "FREE" },
    update: {},
    create: {
      name: "FREE",
      priceNgn: 0,
      caseLimit: 3,
      docLimit: 5,
      aiAllowance: 10,
    },
  });

  await prisma.plan.upsert({
    where: { name: "PAID_REPORT" },
    update: {},
    create: {
      name: "PAID_REPORT",
      priceNgn: 35000,
      caseLimit: 10,
      docLimit: 20,
      aiAllowance: 100,
    },
  });

  // 2. Seed Admin User
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@diasporaland.ai" },
    update: {},
    create: {
      email: "admin@diasporaland.ai",
      name: "DiasporaLand Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  // 3. Seed Normal User
  const userPasswordHash = await bcrypt.hash("UserPass123!", 10);
  const testUser = await prisma.user.upsert({
    where: { email: "investor@diasporaland.ai" },
    update: {},
    create: {
      email: "investor@diasporaland.ai",
      name: "Emeka Okonkwo (UK Diaspora)",
      passwordHash: userPasswordHash,
      role: "FREE",
      isVerified: true,
    },
  });

  // 4. Seed Paid User
  const paidUser = await prisma.user.upsert({
    where: { email: "paid.investor@diasporaland.ai" },
    update: {},
    create: {
      email: "paid.investor@diasporaland.ai",
      name: "Dr. Funke Adeyemi (Canada)",
      passwordHash: userPasswordHash,
      role: "PAID",
      isVerified: true,
    },
  });

  // 5. Seed Demonstration Property Case 1: Lekki Phase 1 (Plot Mismatch)
  const case1 = await prisma.propertyCase.create({
    data: {
      userId: testUser.id,
      title: "Lekki Phase 1 Residential Plot 24",
      country: "Nigeria",
      state: "Lagos",
      lga: "Eti-Osa",
      address: "Plot 24, Block 8, Off Admiralty Way, Lekki Phase 1",
      propertyType: "RESIDENTIAL",
      purchasePrice: 120000000,
      currency: "NGN",
      sellerName: "Chief Adewale Balogun",
      agentName: "Lekki Prime Realtors Ltd",
      latitude: 6.4474,
      longitude: 3.4842,
      description: "Dry residential plot offered with deed of assignment and family receipt. Vendor claims survey plan is registered.",
      status: "ANALYSIS_COMPLETE",
    },
  });

  // Case 1 Documents
  const doc1A = await prisma.propertyDocument.create({
    data: {
      caseId: case1.id,
      originalName: "Survey_Plan_LAG_1842_2019.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024 * 450,
      storageKey: "demo_survey_lekki.pdf",
      category: "SURVEY_PLAN",
      processingStatus: "COMPLETED",
      pageCount: 2,
      ocrText: "OFFICE OF THE SURVEYOR GENERAL LAGOS STATE. Cadastral Survey Plan No: LAG/1842/2019. Surveyed by: Surv. Babatunde Alabi, mnis. Property: Plot No. 24, Block 8, Admiralty Layout. Area: 680.45 sq. meters. Boundary Beacons: BK4101, BK4102, BK4103, BK4104.",
      extractedSummary: "Cadastral Survey Plan showing Plot No. 24 with 4 verified boundary pillars and 680.45 sq. meters area.",
    },
  });

  const doc1B = await prisma.propertyDocument.create({
    data: {
      caseId: case1.id,
      originalName: "Deed_of_Assignment_Balogun_2022.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024 * 820,
      storageKey: "demo_deed_lekki.pdf",
      category: "DEED_OF_ASSIGNMENT",
      processingStatus: "COMPLETED",
      pageCount: 5,
      ocrText: "THIS DEED OF ASSIGNMENT is made between Chief Adewale Balogun (Assignor) and Emeka Okonkwo (Assignee). Consideration: NGN 120,000,000. ALL THAT PIECE OR PARCEL of land known as Plot No. 42, Block 8, Admiralty Scheme, Eti-Osa LGA, Lagos State.",
      extractedSummary: "Deed of Assignment purporting to transfer Plot No. 42 without Governor's consent clause.",
    },
  });

  // Extractions for Case 1
  await prisma.documentExtraction.createMany({
    data: [
      { documentId: doc1A.id, caseId: case1.id, fieldName: "plot_number", fieldValue: "24", pageNumber: 1, confidence: 0.96, sourceSnippet: "Plot No. 24, Block 8" },
      { documentId: doc1A.id, caseId: case1.id, fieldName: "survey_number", fieldValue: "LAG/1842/2019", pageNumber: 1, confidence: 0.95, sourceSnippet: "Survey Plan No: LAG/1842/2019" },
      { documentId: doc1A.id, caseId: case1.id, fieldName: "land_area", fieldValue: "680.45 sq. meters", pageNumber: 1, confidence: 0.94, sourceSnippet: "Area: 680.45 sq. meters" },
      { documentId: doc1B.id, caseId: case1.id, fieldName: "plot_number", fieldValue: "42", pageNumber: 1, confidence: 0.94, sourceSnippet: "Plot No. 42, Block 8" },
      { documentId: doc1B.id, caseId: case1.id, fieldName: "seller_name", fieldValue: "Chief Adewale Balogun", pageNumber: 1, confidence: 0.92, sourceSnippet: "Assignor: Chief Adewale Balogun" },
    ],
  });

  // Risk Score for Case 1
  await prisma.riskScore.create({
    data: {
      caseId: case1.id,
      score: 68,
      level: "HIGH",
      explanation: "Risk indicator score of 68/100 (HIGH RISK). Discrepancy identified between Plot 24 in Survey Plan and Plot 42 in Deed of Assignment. No Governor's Consent or Certificate of Occupancy found.",
      documentationScore: 65,
      ownershipScore: 50,
      geographicScore: 40,
      consistencyScore: 85,
    },
  });

  // Findings for Case 1
  await prisma.propertyFinding.createMany({
    data: [
      {
        caseId: case1.id,
        title: "Plot Number Mismatch Between Survey Plan and Deed",
        severity: "HIGH",
        category: "CONSISTENCY",
        description: "The submitted Survey Plan describes Plot 24, whereas the Deed of Assignment designates the subject property as Plot 42.",
        evidenceSummary: "Survey Plan (Page 1) cites Plot 24; Deed of Assignment (Page 1) cites Plot 42.",
        pageReferences: "Survey_Plan_LAG_1842_2019.pdf (Page 1), Deed_of_Assignment_Balogun_2022.pdf (Page 1)",
        whyItMatters: "A plot reference divergence creates substantial legal vulnerability: the buyer may pay for Plot 24 while receiving title paperwork that legally conveys Plot 42, creating rival ownership conflicts.",
        recommendedAction: "Halt transaction immediately. Demand that vendor and registered surveyor reconcile beacon numbers against the approved master layout at Lands Bureau, Alausa.",
        isPremiumLocked: true,
      },
      {
        caseId: case1.id,
        title: "Unconsented Deed of Assignment (Section 22 Land Use Act)",
        severity: "ELEVATED",
        category: "DOCUMENTATION",
        description: "Deed of assignment lacks governor's consent endorsement required for alienating designated state land.",
        evidenceSummary: "Deed dated 2022 contains no endorsement stamp from the Lagos State Honourable Commissioner for Lands.",
        pageReferences: "Deed_of_Assignment_Balogun_2022.pdf (Page 5)",
        whyItMatters: "Under Nigerian law, any deed executed without Governor's consent confers only an equitable interest rather than absolute legal title.",
        recommendedAction: "Require vendor to provide root of title or submit formal application for Governor's Consent through a certified real estate attorney.",
        isPremiumLocked: true,
      },
      {
        caseId: case1.id,
        title: "On-Site Beacon Pickup Required",
        severity: "MODERATE",
        category: "GEOGRAPHIC",
        description: "Boundary pillars BK4101-BK4104 must be physically verified on the ground.",
        evidenceSummary: "Survey coordinates provide beacon numbers requiring field verification.",
        pageReferences: "Survey_Plan_LAG_1842_2019.pdf (Page 2)",
        whyItMatters: "Boundary pillars in high-density Lekki schemes are occasionally moved during neighborhood wall construction.",
        recommendedAction: "Commission an independent registered surveyor to locate all 4 boundary pillars on site.",
        isPremiumLocked: false,
      },
    ],
  });

  // Verification items for Case 1
  const checklist = [
    { key: "location_reviewed", title: "Property Location Reviewed", description: "Address, landmarks, and geographic description cross-checked across documents", status: "COMPLETE", requiresProfessional: false },
    { key: "plot_number_consistent", title: "Plot & Beacon Numbers Consistent", description: "Plot number, survey beacons, and cadastral reference verified between survey and deed", status: "NEEDS_REVIEW", requiresProfessional: false },
    { key: "property_area_consistent", title: "Property Area & Dimensions Consistent", description: "Total land area (square meters or hectares) matches across deed, contract, and survey", status: "COMPLETE", requiresProfessional: false },
    { key: "seller_owner_reviewed", title: "Seller & Owner Lineage Reviewed", description: "Root of title matches identity of current seller and prior registered proprietors", status: "NEEDS_REVIEW", requiresProfessional: false },
    { key: "survey_reviewed", title: "Survey Plan Verification", description: "Independent verification of surveyor registration and cadastral coordinates against Lagos Surveyor General records", status: "PENDING", requiresProfessional: true },
    { key: "title_documentation_reviewed", title: "Title Documentation Search", description: "Official registry search at Lands Bureau / Alausa to confirm root of title and encumbrances", status: "PENDING", requiresProfessional: true },
    { key: "coordinates_reviewed", title: "Cadastral Coordinates Verification", description: "Physical boundary beacons confirmed with GPS coordinates on ground", status: "PENDING", requiresProfessional: true },
    { key: "document_inconsistencies_reviewed", title: "Document Discrepancies Clarified", description: "All identified typographical, naming, or date variances addressed by vendor", status: "NEEDS_REVIEW", requiresProfessional: false },
    { key: "legal_review", title: "Professional Legal Due Diligence", description: "Independent property lawyer retained to review contract terms, covenants, and deed execution", status: "PENDING", requiresProfessional: true },
    { key: "physical_site_inspection", title: "Physical Inspection & Traditional Inquiries", description: "Site visit to confirm no trespass, active litigation notices, or conflicting family claims", status: "PENDING", requiresProfessional: true },
    { key: "official_government_verification", title: "Official Charting / Status Confirmation", description: "Formal land charting report verifying excision status, committed acquisition, or agricultural zone", status: "PENDING", requiresProfessional: true },
  ];

  for (const item of checklist) {
    await prisma.verificationItem.create({
      data: {
        caseId: case1.id,
        itemKey: item.key,
        title: item.title,
        description: item.description,
        status: item.status,
        requiresProfessional: item.requiresProfessional,
      },
    });
  }

  // Report for Case 1 (Free user preview state: isPaidUnlocked = false)
  await prisma.propertyReport.create({
    data: {
      caseId: case1.id,
      userId: testUser.id,
      reportVersion: 1,
      status: "READY",
      summary: "Preliminary due-diligence report generated. Detailed evidence references and full PDF download locked pending unlock.",
      isPaidUnlocked: false,
    },
  });

  // 6. Seed Demonstration Property Case 2: Clean Paid Case for Dr. Adeyemi
  const case2 = await prisma.propertyCase.create({
    data: {
      userId: paidUser.id,
      title: "Epe Agricultural Scheme Parcel 12A",
      country: "Nigeria",
      state: "Lagos",
      lga: "Epe",
      address: "Kilometer 14, Ketu-Epe Expressway, Epe",
      propertyType: "AGRICULTURAL",
      purchasePrice: 18500000,
      currency: "NGN",
      sellerName: "Epe Greenfields Agribusiness Cooperative",
      latitude: 6.5841,
      longitude: 3.9834,
      description: "Farmland scheme with verified community excision and registered layout survey.",
      status: "REPORT_GENERATED",
    },
  });

  const doc2 = await prisma.propertyDocument.create({
    data: {
      caseId: case2.id,
      originalName: "Registered_Excision_Gazette_Epe.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024 * 610,
      storageKey: "demo_gazette_epe.pdf",
      category: "GAZETTE",
      processingStatus: "COMPLETED",
      pageCount: 3,
      ocrText: "LAGOS STATE OFFICIAL GAZETTE No. 44 Vol. 102. Notice of Excision under Section 19 of the Land Use Act. Ketu-Epe Community Agricultural Excision covering 150 Hectares.",
      extractedSummary: "Official Government Gazette confirming excision release of community land.",
    },
  });

  await prisma.riskScore.create({
    data: {
      caseId: case2.id,
      score: 18,
      level: "LOW",
      explanation: "Risk indicator score of 18/100 (LOW RISK). Land is backed by published Government Gazette excision. Standard surveyor boundary confirmation recommended.",
      documentationScore: 10,
      ownershipScore: 15,
      geographicScore: 20,
      consistencyScore: 10,
    },
  });

  await prisma.propertyFinding.create({
    data: {
      caseId: case2.id,
      title: "Published Gazette Excision Verified",
      severity: "LOW",
      category: "DOCUMENTATION",
      description: "The land is covered under Lagos State Official Gazette No. 44 Vol. 102.",
      evidenceSummary: "Gazette publication confirms land excision from committed government acquisition.",
      pageReferences: "Registered_Excision_Gazette_Epe.pdf (Page 2)",
      whyItMatters: "Excision removes the land from government committed acquisition, granting recognized customary root of title.",
      recommendedAction: "Request copy of approved layout plan from the cooperative.",
      isPremiumLocked: false,
    },
  });

  // Report unlocked for Paid User Case
  const report2 = await prisma.propertyReport.create({
    data: {
      caseId: case2.id,
      userId: paidUser.id,
      reportVersion: 1,
      status: "READY",
      summary: "Full property due-diligence report unlocked and certified.",
      isPaidUnlocked: true,
    },
  });

  // Record successful payment for Case 2
  await prisma.payment.create({
    data: {
      userId: paidUser.id,
      caseId: case2.id,
      reportId: report2.id,
      amount: 35000,
      currency: "NGN",
      reference: "DLA_DEMO_PAID_001",
      provider: "PAYSTACK",
      status: "SUCCESSFUL",
      verifiedAt: new Date(),
      metadata: JSON.stringify({ description: "Full Property Due-Diligence Report" }),
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
