import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_gpHsS6Jzky3b@ep-curly-queen-avyd1jx2-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

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
