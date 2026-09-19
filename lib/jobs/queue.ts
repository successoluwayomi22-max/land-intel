import { db } from "@/lib/db";

export type JobType =
  | "OCR_PROCESSING"
  | "DOCUMENT_CLASSIFICATION"
  | "CROSS_DOC_RECONCILIATION"
  | "AI_ANALYSIS"
  | "GEOSPATIAL_ANALYSIS"
  | "EXTERNAL_VERIFICATION"
  | "REPORT_GENERATION"
  | "NOTIFICATION_DISPATCH";

export type JobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING"
  | "CANCELLED";

export interface EnqueueJobParams {
  caseId?: string;
  jobType: JobType;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
}

export async function enqueueJob(params: EnqueueJobParams) {
  return db.backgroundJob.create({
    data: {
      caseId: params.caseId,
      jobType: params.jobType,
      status: "QUEUED",
      payload: params.payload ? JSON.stringify(params.payload) : null,
      maxAttempts: params.maxAttempts || 3,
      attempts: 0,
    },
  });
}

export async function getNextQueuedJob() {
  // Atomically select and lock the oldest queued or retrying job
  const job = await db.backgroundJob.findFirst({
    where: {
      status: { in: ["QUEUED", "RETRYING"] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!job) return null;

  return db.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: "PROCESSING",
      lockedAt: new Date(),
      attempts: { increment: 1 },
    },
  });
}

export async function completeJob(jobId: string, result?: Record<string, unknown>) {
  return db.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      result: result ? JSON.stringify(result) : null,
    },
  });
}

export async function failJob(jobId: string, error: string) {
  const job = await db.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const shouldRetry = job.attempts < job.maxAttempts;

  return db.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? "RETRYING" : "FAILED",
      error,
      lockedAt: null,
    },
  });
}

export async function getJobStatus(jobId: string) {
  const job = await db.backgroundJob.findUnique({ where: { id: jobId } });
  if (!job) return null;

  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status as JobStatus,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() || null,
  };
}
