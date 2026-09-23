import fs from "fs/promises";
import path from "path";
import os from "os";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

// Use /tmp in serverless environments (Vercel Lambda) or fallback to local cwd
const STORAGE_DIR = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join(os.tmpdir(), "storage", "uploads")
  : path.join(process.cwd(), "storage", "uploads");

const DOWNLOAD_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "diasporaland-super-secure-production-jwt-secret-key-32chars"
);

// Ensure private storage directory exists
export async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch {
    // Already exists or created
  }
}

export async function savePrivateFile(key: string, buffer: Buffer, mimeType?: string): Promise<string> {
  // 1. Save to local disk/tmp cache
  try {
    await ensureStorageDir();
    const filePath = path.join(STORAGE_DIR, key);
    await fs.writeFile(filePath, buffer);
  } catch (err) {
    console.warn("[STORAGE] Local disk cache write notice:", err);
  }

  // 2. Persist to Neon PostgreSQL StoredFile (persists across all Vercel Lambdas)
  try {
    await db.storedFile.upsert({
      where: { key },
      create: {
        key,
        data: buffer.toString("base64"),
        mimeType: mimeType || "application/octet-stream",
        sizeBytes: buffer.length,
      },
      update: {
        data: buffer.toString("base64"),
        mimeType: mimeType || "application/octet-stream",
        sizeBytes: buffer.length,
      },
    });
  } catch (dbErr) {
    console.error("[STORAGE] DB persist error:", dbErr);
  }

  return key;
}

export async function readPrivateFile(key: string): Promise<Buffer> {
  // 1. Try reading from primary storage dir (/tmp or local cwd)
  try {
    const filePath = path.join(STORAGE_DIR, key);
    return await fs.readFile(filePath);
  } catch {
    // Not in primary storage dir
  }

  // 2. Try reading from project cwd storage
  try {
    const fallbackPath = path.join(process.cwd(), "storage", "uploads", key);
    return await fs.readFile(fallbackPath);
  } catch {
    // Not in fallback cwd
  }

  // 3. Fallback: Retrieve from Neon PostgreSQL StoredFile
  try {
    const fileRecord = await db.storedFile.findUnique({
      where: { key },
    });
    if (fileRecord?.data) {
      const buffer = Buffer.from(fileRecord.data, "base64");
      // Populate local /tmp cache for fast subsequent reads
      try {
        await ensureStorageDir();
        await fs.writeFile(path.join(STORAGE_DIR, key), buffer);
      } catch {}
      return buffer;
    }
  } catch (dbErr) {
    console.error("[STORAGE] DB read error:", dbErr);
  }

  throw new Error(`File ${key} not found in storage or database.`);
}

export async function deletePrivateFile(key: string): Promise<void> {
  try {
    const filePath = path.join(STORAGE_DIR, key);
    await fs.unlink(filePath);
  } catch {
    // File might already be deleted
  }
  try {
    await db.storedFile.delete({ where: { key } });
  } catch {
    // DB record might already be deleted
  }
}

/**
 * Generate a short-lived cryptographically signed token for document download
 */
export async function generateSignedDownloadToken(documentId: string, userId: string, expiresInMinutes = 15): Promise<string> {
  return new SignJWT({ documentId, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInMinutes}m`)
    .sign(DOWNLOAD_SECRET);
}

export async function verifySignedDownloadToken(token: string): Promise<{ documentId: string; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, DOWNLOAD_SECRET);
    if (typeof payload.documentId === "string" && typeof payload.userId === "string") {
      return { documentId: payload.documentId, userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}
