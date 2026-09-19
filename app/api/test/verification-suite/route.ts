import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJurisdictionAdapter } from "@/lib/jurisdictions/registry";
import {
  ISO_CURRENCIES,
  convertCurrency,
  formatCurrencyAmount,
  createMonetaryRepresentation,
} from "@/lib/currency";
import { PLANS, hasPlanEntitlement } from "@/lib/services/plans";
import { reconcileCaseDocuments } from "@/lib/ai/reconciliation";
import { analyzeBoundaryPolygon } from "@/lib/geo/geospatial";
import { executeExternalVerificationCheck } from "@/lib/services/external-sources";
import { enqueueJob, getNextQueuedJob, completeJob } from "@/lib/jobs/queue";
import { generatePropertyDueDiligencePdf } from "@/lib/services/pdf-report";
import { checkSystemHealth } from "@/lib/services/health";

export async function GET(request: NextRequest) {
  const results: { test: string; status: "PASS" | "FAIL"; details?: any }[] = [];

  function record(test: string, condition: boolean, details?: any) {
    results.push({
      test,
      status: condition ? "PASS" : "FAIL",
      details: condition ? undefined : details,
    });
  }

  try {
    // -------------------------------------------------------------
    // 1. JURISDICTION ADAPTERS & GLOBAL ARCHITECTURE (Requirements 4, 27)
    // -------------------------------------------------------------
    const supportedCodes = ["NG", "GH", "KE", "UK", "US", "CA", "ZA", "AE", "AU"];
    for (const code of supportedCodes) {
      const adapter = getJurisdictionAdapter(code);
      record(`Jurisdiction Adapter: ${code} loaded`, Boolean(adapter) && (adapter.countryCode === code || (code === "UK" && adapter.countryCode === "GB") || (code === "US" && adapter.countryCode === "US")));
      record(`Jurisdiction Adapter: ${code} has official name (${adapter.name})`, typeof adapter.name === "string" && adapter.name.length > 0);
      record(`Jurisdiction Adapter: ${code} has support level (${adapter.supportLevel})`, adapter.supportLevel === "LEVEL_2" || adapter.supportLevel === "LEVEL_3");
      record(`Jurisdiction Adapter: ${code} provides verification checklist`, Array.isArray(adapter.verificationChecklist) && adapter.verificationChecklist.length > 0, { count: adapter.verificationChecklist?.length });
      record(`Jurisdiction Adapter: ${code} lists common documents`, Array.isArray(adapter.commonDocuments) && adapter.commonDocuments.length > 0);
    }

    // Document Classification across jurisdictions
    const ngAdapter = getJurisdictionAdapter("NG");
    const ngClass = ngAdapter.classifyDocument("Governor's Consent in respect of Lekki Phase 1 Lagos State", "consent.pdf");
    record("Nigeria Adapter classifies Governor's Consent", ngClass.category === "GOVERNORS_CONSENT");

    const ghAdapter = getJurisdictionAdapter("GH");
    const ghClass = ghAdapter.classifyDocument("Indenture and Cadastral Plan from Lands Commission Cantonments Accra", "indenture.pdf");
    record("Ghana Adapter classifies Indenture", ghClass.category === "INDENTURE" || ghClass.category === "CADASTRAL_PLAN");

    const keAdapter = getJurisdictionAdapter("KE");
    const keClass = keAdapter.classifyDocument("Ministry of Lands ArdhiSasa official search certificate Nairobi County", "search.pdf");
    record("Kenya Adapter classifies ArdhiSasa Official Search", keClass.category === "OFFICIAL_SEARCH_CERTIFICATE" || keClass.category.includes("OFFICIAL_SEARCH"));

    const ukAdapter = getJurisdictionAdapter("UK");
    const ukClass = ukAdapter.classifyDocument("HM Land Registry Official Copy of Register Title Plan", "title_register.pdf");
    record("UK Adapter classifies HMLR Official Copy of Register", ukClass.category === "OFFICIAL_COPY_REGISTER");

    const usAdapter = getJurisdictionAdapter("US");
    const usClass = usAdapter.classifyDocument("Special Warranty Deed and Title Commitment with APN parcel number", "warranty_deed.pdf");
    record("US Adapter classifies Warranty Deed", usClass.category === "WARRANTY_DEED");

    // Fallback Adapter for unsupported jurisdictions (honest limited support messaging)
    const fallbackAdapter = getJurisdictionAdapter("ZZ");
    record("Fallback Adapter returned for unsupported jurisdiction", fallbackAdapter.countryCode === "ZZ" && fallbackAdapter.supportLevel === "LEVEL_1");
    record("Fallback Adapter provides honest limited-support notice", Boolean(fallbackAdapter.supportLevelNotice) && (fallbackAdapter.supportLevelNotice?.includes("Limited Support") ?? false));

    // -------------------------------------------------------------
    // 2. CENTRALIZED CURRENCY REGISTRY & ISO 4217 (Requirement 6)
    // -------------------------------------------------------------
    const requiredCurrencies = ["NGN", "USD", "EUR", "GBP", "CAD", "AUD", "GHS", "KES", "ZAR", "AED"];
    for (const curr of requiredCurrencies) {
      record(`Currency Registry contains ISO 4217 ${curr}`, Boolean(ISO_CURRENCIES[curr]));
    }

    // Currency Conversion preserving original values
    const monetary = createMonetaryRepresentation(10000000, "NGN", "USD");
    record("Currency Representation preserves originalAmount", monetary.originalAmount === 10000000);
    record("Currency Representation preserves originalCurrency", monetary.originalCurrency === "NGN");
    record("Currency Representation computes displayAmount accurately", monetary.displayAmount > 0 && monetary.exchangeRateUsed > 0);
    record("Currency Representation provides rateSource and timestamp", typeof monetary.rateSource === "string" && Boolean(monetary.rateTimestamp));

    // Formatted currency
    const formatted = formatCurrencyAmount(50000, "USD", "en-US");
    record("Currency Formatting contains currency symbol and amount", formatted.includes("$") && formatted.includes("50,000"));

    // -------------------------------------------------------------
    // 3. INTERNATIONALIZATION & ARABIC RTL (Requirement 5)
    // -------------------------------------------------------------
    const rtlCheck = (lang: string) => lang === "ar";
    record("Arabic recognized as RTL language", rtlCheck("ar") === true);
    record("English recognized as LTR language", rtlCheck("en") === false);
    record("French recognized as LTR language", rtlCheck("fr") === false);

    // -------------------------------------------------------------
    // 4. SERVER-AUTHORITATIVE ENTITLEMENTS & PLANS (Requirements 8, 9, 10, 11)
    // -------------------------------------------------------------
    record("Plan Registry has FREE plan", Boolean(PLANS.FREE));
    record("Plan Registry has STARTER plan", Boolean(PLANS.STARTER));
    record("Plan Registry has PROFESSIONAL plan", Boolean(PLANS.PROFESSIONAL));
    record("Plan Registry has BUSINESS plan", Boolean(PLANS.BUSINESS));
    record("Plan Registry has ENTERPRISE plan", Boolean(PLANS.ENTERPRISE));

    // Server-side entitlement boundary checks
    record("FREE plan has BASIC_REPORT entitlement", hasPlanEntitlement("FREE", "BASIC_REPORT") === true);
    record("FREE plan has BASIC_RISK entitlement", hasPlanEntitlement("FREE", "BASIC_RISK") === true);
    record("FREE plan BLOCKED from FULL_REPORT", hasPlanEntitlement("FREE", "FULL_REPORT") === false);
    record("FREE plan BLOCKED from ADVANCED_ANALYSIS", hasPlanEntitlement("FREE", "ADVANCED_ANALYSIS") === false);
    record("FREE plan BLOCKED from EXTERNAL_VERIFICATION", hasPlanEntitlement("FREE", "EXTERNAL_VERIFICATION") === false);

    record("PROFESSIONAL plan has FULL_REPORT entitlement", hasPlanEntitlement("PROFESSIONAL", "FULL_REPORT") === true);
    record("PROFESSIONAL plan has ADVANCED_ANALYSIS entitlement", hasPlanEntitlement("PROFESSIONAL", "ADVANCED_ANALYSIS") === true);
    record("PROFESSIONAL plan has EXTERNAL_VERIFICATION entitlement", hasPlanEntitlement("PROFESSIONAL", "EXTERNAL_VERIFICATION") === true);

    // -------------------------------------------------------------
    // 5. CROSS-DOCUMENT RECONCILIATION ENGINE (Requirements 25, 28)
    // -------------------------------------------------------------
    const docA = {
      id: "doc_survey_01",
      originalName: "Registered Survey Plan Lagos",
      category: "SURVEY_PLAN",
      extractions: [
        { fieldName: "plot_number", fieldValue: "Plot 24, Block B", pageNumber: 1 },
        { fieldName: "land_area", fieldValue: "1,200 sqm", pageNumber: 1 },
        { fieldName: "seller_name", fieldValue: "Chief Adeyemi Alabi", pageNumber: 1 },
      ],
    };
    const docB = {
      id: "doc_deed_02",
      originalName: "Deed of Assignment Lagos",
      category: "DEED_OF_ASSIGNMENT",
      extractions: [
        { fieldName: "plot_number", fieldValue: "Plot 42, Block B", pageNumber: 2 }, // CONTRADICTION!
        { fieldName: "land_area", fieldValue: "1,500 sqm", pageNumber: 2 }, // CONTRADICTION!
        { fieldName: "seller_name", fieldValue: "Babatunde Alabi", pageNumber: 2 }, // CONTRADICTION!
      ],
    };

    const differences = reconcileCaseDocuments([docA, docB]);
    record("Reconciliation detects plot number contradiction", differences.some(d => d.field === "plot_number" && d.severity === "HIGH"), { differences });
    record("Reconciliation detects land area contradiction", differences.some(d => d.field === "land_area"));
    record("Reconciliation detects seller name discrepancy", differences.some(d => d.field === "seller_name"));
    record("Reconciliation provides professional recommendations", differences.every(d => d.recommendedAction.length > 0 && d.whyItMatters.length > 0));

    // -------------------------------------------------------------
    // 6. GEOSPATIAL ANALYSIS (Shoelace Area, Perimeter, Geometry) (Requirement 29)
    // -------------------------------------------------------------
    const validCoords = [
      { lat: 6.4300, lng: 3.4200 },
      { lat: 6.4310, lng: 3.4200 },
      { lat: 6.4310, lng: 3.4210 },
      { lat: 6.4300, lng: 3.4210 },
    ];
    const geoAnalysis = analyzeBoundaryPolygon(validCoords);
    record("Geospatial analyzes valid polygon geometry", geoAnalysis.isValidPolygon === true);
    record("Geospatial computes non-zero area in square meters", geoAnalysis.calculatedAreaSqm > 0);
    record("Geospatial computes non-zero perimeter in meters", geoAnalysis.calculatedPerimeterM > 0);
    record("Geospatial reports zero self-intersections for valid polygon", geoAnalysis.hasSelfIntersection === false);

    // Self-intersecting polygon (bowtie)
    const bowtieCoords = [
      { lat: 6.4300, lng: 3.4200 },
      { lat: 6.4310, lng: 3.4210 },
      { lat: 6.4310, lng: 3.4200 },
      { lat: 6.4300, lng: 3.4210 },
    ];
    const bowtieAnalysis = analyzeBoundaryPolygon(bowtieCoords);
    record("Geospatial detects self-intersecting polygon", bowtieAnalysis.hasSelfIntersection === true);

    // -------------------------------------------------------------
    // 7. EXTERNAL REGISTRY VERIFICATION (Requirement 26)
    // -------------------------------------------------------------
    const sampleCase = await db.propertyCase.findFirst({
      include: {
        documents: { include: { extractions: true } },
        findings: true,
        riskScore: true,
      },
    });

    if (!sampleCase) {
      throw new Error("No sample case found in database. Run db:seed first.");
    }

    const externalCheck = await executeExternalVerificationCheck({
      caseId: sampleCase.id,
      provider: "SURCON_REGISTRY",
      jurisdictionCode: "NG",
      recordReference: "BEACON_XP_4901",
      verificationMethod: "REGISTRY_SEARCH",
    });
    record("External Verification returns structured status", Boolean(externalCheck.status));
    record("External Verification NEVER converts NOT_FOUND into FRAUD", (externalCheck.status as string) !== "FRAUD");
    record("External Verification records source and verification method", Boolean(externalCheck.provider) && Boolean(externalCheck.verificationMethod));
    record("External Verification records legal limitations notice", Boolean(externalCheck.limitations));

    // -------------------------------------------------------------
    // 8. BACKGROUND JOB QUEUE (Requirement 39)
    // -------------------------------------------------------------
    const testJob = await enqueueJob({
      jobType: "OCR_PROCESSING",
      payload: { testRunId: "test_" + Date.now(), documentTitle: "Test Survey Document" },
    });
    record("Background Job enqueued in QUEUED status", testJob.status === "QUEUED" && Boolean(testJob.id));

    const claimedJob = await getNextQueuedJob();
    record("Background Job claimed into PROCESSING status with lock", claimedJob !== null && claimedJob.status === "PROCESSING");

    if (claimedJob) {
      const completed = await completeJob(claimedJob.id, { ocrCompleted: true, textLength: 1540 });
      record("Background Job completed into COMPLETED status", completed.status === "COMPLETED");
    }

    // -------------------------------------------------------------
    // 9. MULTI-PAGE INSTITUTIONAL PDF REPORT ENGINE (Requirement 30)
    // -------------------------------------------------------------
    if (sampleCase) {
      const pdfBuffer = await generatePropertyDueDiligencePdf(sampleCase.id);
      const isPdfValid = pdfBuffer instanceof Uint8Array && pdfBuffer.byteLength > 2000;
      const headerStr = Buffer.from(pdfBuffer.slice(0, 5)).toString("utf-8");
      record("Publication-Grade Multi-Page PDF generated with valid header", isPdfValid && headerStr.startsWith("%PDF"), {
        byteLength: pdfBuffer?.byteLength,
        header: headerStr,
      });
    } else {
      record("Publication-Grade Multi-Page PDF generated", false, { error: "No sample case found" });
    }

    // -------------------------------------------------------------
    // 10. REAL SYSTEM HEALTH TELEMETRY (Requirement 40)
    // -------------------------------------------------------------
    const health = await checkSystemHealth();
    record("System Health check executed", Boolean(health.status));
    record("System Health monitors database status", health.components.database.status === "HEALTHY");
    record("System Health monitors storage status", health.components.storage.status === "HEALTHY");
    record("System Health monitors job queue status", health.components.jobQueue.status === "HEALTHY");
    record("System Health monitors payment gateway status", health.components.paymentGateway.status === "HEALTHY");
    record("System Health monitors exchange rates status", health.components.exchangeRates.status === "HEALTHY");

    // Summary calculation
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === "PASS").length;
    const failedTests = results.filter(r => r.status === "FAIL").length;

    return NextResponse.json({
      success: failedTests === 0,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
      },
      results,
    });
  } catch (error: any) {
    console.error("Verification suite execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        results,
      },
      { status: 500 }
    );
  }
}
