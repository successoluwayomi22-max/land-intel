import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getOptimizedDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (url.hostname.includes("-pooler")) {
      if (!url.searchParams.has("pgbouncer")) {
        url.searchParams.set("pgbouncer", "true");
      }
      if (!url.searchParams.has("connection_limit")) {
        url.searchParams.set("connection_limit", "10");
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const rawDatabaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_gpHsS6Jzky3b@ep-curly-queen-avyd1jx2-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const databaseUrl = getOptimizedDatabaseUrl(rawDatabaseUrl);

// Guarantee DATABASE_URL is defined on process.env for Prisma Client runtime
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
