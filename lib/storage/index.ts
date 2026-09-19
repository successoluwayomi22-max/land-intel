import fs from "fs/promises";
import path from "path";
import { SignJWT, jwtVerify } from "jose";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");
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

export async function savePrivateFile(key: string, buffer: Buffer): Promise<string> {
  await ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, key);
  await fs.writeFile(filePath, buffer);
  return key;
}

export async function readPrivateFile(key: string): Promise<Buffer> {
  const filePath = path.join(STORAGE_DIR, key);
  return fs.readFile(filePath);
}

export async function deletePrivateFile(key: string): Promise<void> {
  try {
    const filePath = path.join(STORAGE_DIR, key);
    await fs.unlink(filePath);
  } catch {
    // File might already be deleted
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
