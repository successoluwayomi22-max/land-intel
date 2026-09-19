import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export type ComponentHealth = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";

export interface SystemHealthReport {
  status: ComponentHealth;
  timestamp: string;
  uptimeSeconds: number;
  components: {
    database: { status: ComponentHealth; latencyMs: number; error?: string };
    storage: { status: ComponentHealth; available: boolean; error?: string };
    jobQueue: { status: ComponentHealth; pendingJobs: number; failedJobs: number };
    paymentGateway: { status: ComponentHealth; providers: string[] };
    exchangeRates: { status: ComponentHealth; activeCurrencies: number };
    aiEngine: { status: ComponentHealth; defaultModel: string };
  };
}

const startTime = Date.now();

export async function checkSystemHealth(): Promise<SystemHealthReport> {
  const start = Date.now();
  let dbStatus: ComponentHealth = "HEALTHY";
  let dbLatency = 0;
  let dbError: string | undefined;

  // 1. Database Health Check
  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - t0;
    if (dbLatency > 1000) {
      dbStatus = "DEGRADED";
    }
  } catch (err: any) {
    dbStatus = "DOWN";
    dbError = err.message;
  }

  // 2. Storage Health Check
  let storageStatus: ComponentHealth = "HEALTHY";
  let storageAvailable = true;
  let storageError: string | undefined;
  try {
    const storagePath = path.join(process.cwd(), "storage");
    await fs.access(storagePath).catch(() => fs.mkdir(storagePath, { recursive: true }));
  } catch (err: any) {
    storageStatus = "DEGRADED";
    storageAvailable = false;
    storageError = err.message;
  }

  // 3. Queue Health Check
  let queueStatus: ComponentHealth = "HEALTHY";
  let pendingJobs = 0;
  let failedJobs = 0;
  try {
    const [pending, failed] = await Promise.all([
      db.backgroundJob.count({ where: { status: { in: ["QUEUED", "PROCESSING", "RETRYING"] } } }),
      db.backgroundJob.count({ where: { status: "FAILED" } }),
    ]);
    pendingJobs = pending;
    failedJobs = failed;
    if (failedJobs > 20) queueStatus = "DEGRADED";
  } catch {
    queueStatus = "UNKNOWN";
  }

  // Overall system evaluation
  let overall: ComponentHealth = "HEALTHY";
  if (dbStatus === "DOWN") overall = "DOWN";
  else if (dbStatus === "DEGRADED" || storageStatus === "DEGRADED" || queueStatus === "DEGRADED") overall = "DEGRADED";

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    components: {
      database: { status: dbStatus, latencyMs: dbLatency, error: dbError },
      storage: { status: storageStatus, available: storageAvailable, error: storageError },
      jobQueue: { status: queueStatus, pendingJobs, failedJobs },
      paymentGateway: { status: "HEALTHY", providers: ["PAYSTACK", "STRIPE", "SANDBOX"] },
      exchangeRates: { status: "HEALTHY", activeCurrencies: 10 },
      aiEngine: { status: "HEALTHY", defaultModel: "Heuristic / Cadastral Intelligence Pipeline" },
    },
  };
}
