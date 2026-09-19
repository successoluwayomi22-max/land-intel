const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seeding Landintel Enterprise Database ===");

  // 1. Seed Comprehensive Plans
  const plans = [
    {
      name: "FREE",
      priceNgn: 0,
      priceUsd: 0,
      caseLimit: 1,
      docLimit: 5,
      aiAllowance: 20,
    },
    {
      name: "STARTER",
      priceNgn: 45000,
      priceUsd: 30,
      caseLimit: 5,
      docLimit: 15,
      aiAllowance: 150,
    },
    {
      name: "PROFESSIONAL",
      priceNgn: 125000,
      priceUsd: 85,
      caseLimit: 25,
      docLimit: 50,
      aiAllowance: 500,
    },
    {
      name: "BUSINESS",
      priceNgn: 350000,
      priceUsd: 240,
      caseLimit: 100,
      docLimit: 100,
      aiAllowance: 2000,
    },
    {
      name: "ENTERPRISE",
      priceNgn: 1500000,
      priceUsd: 1000,
      caseLimit: 10000,
      docLimit: 500,
      aiAllowance: 10000,
    },
    {
      // Legacy backward-compatibility name
      name: "PAID_REPORT",
      priceNgn: 35000,
      priceUsd: 25,
      caseLimit: 10,
      docLimit: 20,
      aiAllowance: 100,
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { name: p.name },
      update: {
        priceNgn: p.priceNgn,
        priceUsd: p.priceUsd,
        caseLimit: p.caseLimit,
        docLimit: p.docLimit,
        aiAllowance: p.aiAllowance,
      },
      create: p,
    });
  }
  console.log("[OK] Seeded 6 Subscription & Billing Plans.");

  // 2. Seed Primary Organization
  const org = await prisma.organization.upsert({
    where: { slug: "diaspora-holdings" },
    update: {},
    create: {
      name: "Diaspora Premier Real Estate Holdings Ltd",
      slug: "diaspora-holdings",
      country: "Nigeria",
      defaultCurrency: "NGN",
      defaultLanguage: "en",
    },
  });
  console.log(`[OK] Seeded Organization: ${org.name}`);

  // 3. Seed Users
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 10);
  const userPasswordHash = await bcrypt.hash("UserPass123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@diasporaland.ai" },
    update: { role: "ADMIN", isVerified: true },
    create: {
      email: "admin@diasporaland.ai",
      name: "Landintel Platform Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isVerified: true,
      preferredLanguage: "en",
      preferredCurrency: "NGN",
    },
  });

  const testUser = await prisma.user.upsert({
    where: { email: "investor@diasporaland.ai" },
    update: { role: "FREE", isVerified: true },
    create: {
      email: "investor@diasporaland.ai",
      name: "Emeka Okonkwo (London Diaspora)",
      passwordHash: userPasswordHash,
      role: "FREE",
      isVerified: true,
      preferredLanguage: "en",
      preferredCurrency: "GBP",
    },
  });

  const paidUser = await prisma.user.upsert({
    where: { email: "paid.investor@diasporaland.ai" },
    update: { role: "PAID", isVerified: true },
    create: {
      email: "paid.investor@diasporaland.ai",
      name: "Dr. Funke Adeyemi (Toronto Portfolio)",
      passwordHash: userPasswordHash,
      role: "PAID",
      isVerified: true,
      preferredLanguage: "en",
      preferredCurrency: "CAD",
    },
  });
  console.log("[OK] Seeded Users (Admin, Free Investor, Paid Portfolio Investor).");

  // 4. Seed Memberships
  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: paidUser.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      organizationId: org.id,
      userId: paidUser.id,
      role: "OWNER",
    },
  });

  // 5. Seed Subscription for Organization
  const proPlan = await prisma.plan.findUnique({ where: { name: "PROFESSIONAL" } });
  if (proPlan) {
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const existingSub = await prisma.subscription.findFirst({
      where: { organizationId: org.id },
    });

    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          organizationId: org.id,
          planId: proPlan.id,
          status: "ACTIVE",
          provider: "PAYSTACK",
          providerSubId: "SUB_DEMO_PRO_2026",
          currentPeriodEnd: periodEnd,
        },
      });
    }
  }

  // 6. Seed Case 1 (Nigeria - Lekki Plot Mismatch)
  let case1 = await prisma.propertyCase.findFirst({ where: { title: "Lekki Phase 1 Residential Plot 24" } });
  if (!case1) {
    case1 = await prisma.propertyCase.create({
      data: {
        userId: testUser.id,
        organizationId: org.id,
        title: "Lekki Phase 1 Residential Plot 24",
        country: "Nigeria",
        countryCode: "NG",
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

    await prisma.documentExtraction.createMany({
      data: [
        { documentId: doc1A.id, caseId: case1.id, fieldName: "plot_number", fieldValue: "24", pageNumber: 1, confidence: 0.96, sourceSnippet: "Plot No. 24, Block 8" },
        { documentId: doc1A.id, caseId: case1.id, fieldName: "survey_number", fieldValue: "LAG/1842/2019", pageNumber: 1, confidence: 0.95, sourceSnippet: "Survey Plan No: LAG/1842/2019" },
        { documentId: doc1A.id, caseId: case1.id, fieldName: "land_area", fieldValue: "680.45 sq. meters", pageNumber: 1, confidence: 0.94, sourceSnippet: "Area: 680.45 sq. meters" },
        { documentId: doc1B.id, caseId: case1.id, fieldName: "plot_number", fieldValue: "42", pageNumber: 1, confidence: 0.94, sourceSnippet: "Plot No. 42, Block 8" },
        { documentId: doc1B.id, caseId: case1.id, fieldName: "seller_name", fieldValue: "Chief Adewale Balogun", pageNumber: 1, confidence: 0.92, sourceSnippet: "Assignor: Chief Adewale Balogun" },
      ],
    });

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
      ],
    });

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

    // Add External Verification
    await prisma.externalVerification.create({
      data: {
        caseId: case1.id,
        provider: "SURCON_REGISTRY",
        jurisdictionCode: "NG",
        recordReference: "SURCON/MNIS/2019-ALABI",
        verificationMethod: "REGISTRY_SEARCH",
        status: "PARTIALLY_VERIFIED",
        limitations: "Surveyor registration active; physical on-ground beacon pickup remains required.",
      },
    });
  }

  // 7. Seed Case 2 (Ghana - Cantonments Accra)
  let case2 = await prisma.propertyCase.findFirst({ where: { title: "Cantonments Embassy Residential Plot" } });
  if (!case2) {
    case2 = await prisma.propertyCase.create({
      data: {
        userId: paidUser.id,
        organizationId: org.id,
        title: "Cantonments Embassy Residential Plot",
        country: "Ghana",
        countryCode: "GH",
        state: "Greater Accra",
        lga: "Accra Metropolitan",
        address: "14 Sixth Circular Road, Cantonments, Accra",
        propertyType: "RESIDENTIAL",
        purchasePrice: 450000,
        currency: "USD",
        sellerName: "Osu Stool Traditional Council / Kofi Mensah",
        agentName: "Gold Coast Prime Properties",
        latitude: 5.5824,
        longitude: -0.1743,
        description: "Prime embassy enclave plot held under 50-year stool indenture with barcoded Lands Commission cadastral plan.",
        status: "REPORT_GENERATED",
      },
    });

    await prisma.riskScore.create({
      data: {
        caseId: case2.id,
        score: 28,
        level: "MODERATE",
        explanation: "Risk indicator score of 28/100 (MODERATE RISK). Stool indenture requires Lands Commission concurrence under Section 9 of Land Act 2020.",
        documentationScore: 30,
        ownershipScore: 25,
        geographicScore: 20,
        consistencyScore: 15,
      },
    });

    await prisma.propertyReport.create({
      data: {
        caseId: case2.id,
        userId: paidUser.id,
        reportVersion: 1,
        status: "READY",
        summary: "Institutional due-diligence report certified for Ghanaian acquisition.",
        isPaidUnlocked: true,
      },
    });
  }

  console.log("=== Enterprise Seed Completed Successfully! ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
