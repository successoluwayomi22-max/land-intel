import { NextRequest, NextResponse } from "next/server";
import { getNextQueuedJob, completeJob, failJob } from "@/lib/jobs/queue";
import { db } from "@/lib/db";
import { getJurisdictionAdapter } from "@/lib/jurisdictions/registry";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution time for serverless job processing

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization verification (Vercel Cron Secret or System API Key)
    const authHeader = req.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    const adminToken = process.env.ADMIN_TOKEN || process.env.JWT_SECRET;

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const isAuthorized =
      !cronSecret ||
      token === cronSecret ||
      token === adminToken ||
      req.headers.get("x-vercel-cron") === "1";

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized worker invocation" }, { status: 401 });
    }

    // 2. Process batch of queued jobs (up to 5 per run)
    const results: Array<{ id: string; type: string; status: "COMPLETED" | "FAILED"; error?: string }> = [];
    const maxBatch = 5;

    for (let i = 0; i < maxBatch; i++) {
      const job = await getNextQueuedJob();
      if (!job) break; // Queue empty

      try {
        const payload = job.payload ? JSON.parse(job.payload) : {};
        let jobResult: Record<string, unknown> = { processedAt: new Date().toISOString() };

        switch (job.jobType) {
          case "GEOSPATIAL_ANALYSIS": {
            if (job.caseId) {
              const geometry = await db.propertyGeometry.findFirst({
                where: { caseId: job.caseId },
              });
              if (geometry) {
                jobResult.geometryId = geometry.id;
                jobResult.coordinateSystem = geometry.coordinateSystem;
                jobResult.polygonStatus = geometry.polygonStatus;
              }
            }
            break;
          }

          case "CROSS_DOC_RECONCILIATION": {
            if (job.caseId) {
              const propCase = await db.propertyCase.findUnique({
                where: { id: job.caseId },
                include: {
                  documents: {
                    include: { extractions: true },
                  },
                },
              });

              if (propCase) {
                const adapter = getJurisdictionAdapter(propCase.countryCode || "NG");
                const caseDocs = propCase.documents.map((d) => ({
                  id: d.id,
                  originalName: d.originalName,
                  category: d.category,
                  extractions: d.extractions.map((e) => ({
                    fieldName: e.fieldName,
                    fieldValue: e.fieldValue,
                    pageNumber: e.pageNumber,
                    confidence: e.confidence,
                    sourceSnippet: e.sourceSnippet || undefined,
                  })),
                }));

                const contradictions = adapter.reconcileDocuments(
                  {
                    title: propCase.title,
                    region: propCase.state,
                    district: propCase.lga,
                    address: propCase.address,
                  },
                  caseDocs
                );

                jobResult.contradictionsFound = contradictions.length;
              }
            }
            break;
          }

          case "NOTIFICATION_DISPATCH": {
            if (payload.userId && payload.title && payload.message) {
              await db.notification.create({
                data: {
                  userId: payload.userId,
                  title: payload.title,
                  message: payload.message,
                  type: payload.type || "INFO",
                  link: payload.link || null,
                },
              });
              jobResult.dispatched = true;
            }
            break;
          }

          default:
            jobResult.notice = `Job type ${job.jobType} acknowledged and marked complete.`;
            break;
        }

        await completeJob(job.id, jobResult);
        results.push({ id: job.id, type: job.jobType, status: "COMPLETED" });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await failJob(job.id, errorMsg);
        results.push({ id: job.id, type: job.jobType, status: "FAILED", error: errorMsg });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      jobs: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal queue processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Allow health/status check of the worker
  const queuedCount = await db.backgroundJob.count({
    where: { status: "QUEUED" },
  });
  const processingCount = await db.backgroundJob.count({
    where: { status: "PROCESSING" },
  });

  return NextResponse.json({
    status: "healthy",
    queue: {
      queued: queuedCount,
      processing: processingCount,
    },
    timestamp: new Date().toISOString(),
  });
}
