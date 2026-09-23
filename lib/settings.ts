import { APP_CONFIG } from "./config";
import { db } from "./db";

export interface PlatformContactSettings {
  email: string;
  displayEmail?: string;
  whatsappNumbers: string[];
  primaryWhatsapp: string;
  secondaryWhatsapp: string;
  facebook: string;
  facebookUrl: string;
  instagram: string;
  instagramUrl: string;
  supportAvailability: string;
  supportMessage: string;
}

// In-memory cache for ultra-fast serverless resolution
let cachedContact: { data: PlatformContactSettings; timestamp: number } | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

export async function getPlatformContact(): Promise<PlatformContactSettings> {
  const now = Date.now();
  if (cachedContact && now - cachedContact.timestamp < CACHE_TTL_MS) {
    return cachedContact.data;
  }

  const defaultContact: PlatformContactSettings = {
    email: APP_CONFIG.platformContact.email,
    displayEmail: APP_CONFIG.platformContact.displayEmail,
    whatsappNumbers: [...APP_CONFIG.platformContact.whatsappNumbers],
    primaryWhatsapp: APP_CONFIG.platformContact.primaryWhatsapp,
    secondaryWhatsapp: APP_CONFIG.platformContact.secondaryWhatsapp,
    facebook: APP_CONFIG.platformContact.facebook,
    facebookUrl: APP_CONFIG.platformContact.facebookUrl,
    instagram: APP_CONFIG.platformContact.instagram,
    instagramUrl: APP_CONFIG.platformContact.instagramUrl,
    supportAvailability: APP_CONFIG.platformContact.supportAvailability,
    supportMessage: APP_CONFIG.platformContact.supportMessage,
  };

  try {
    const rows = await db.$queryRawUnsafe<Array<{ value: string }>>(
      "SELECT value FROM system_settings WHERE key = 'platform_contact' LIMIT 1"
    );

    if (rows && rows.length > 0 && rows[0].value) {
      const parsed = JSON.parse(rows[0].value);
      const merged: PlatformContactSettings = {
        ...defaultContact,
        ...parsed,
        whatsappNumbers: Array.isArray(parsed.whatsappNumbers)
          ? parsed.whatsappNumbers
          : [parsed.primaryWhatsapp || defaultContact.primaryWhatsapp, parsed.secondaryWhatsapp || defaultContact.secondaryWhatsapp].filter(Boolean),
      };

      cachedContact = { data: merged, timestamp: now };
      return merged;
    }
  } catch (error) {
    console.warn("[lib/settings] Falling back to default contact config:", error);
  }

  cachedContact = { data: defaultContact, timestamp: now };
  return defaultContact;
}

export async function updatePlatformContact(
  updates: Partial<PlatformContactSettings>
): Promise<PlatformContactSettings> {
  const current = await getPlatformContact();

  const primaryWhatsapp = updates.primaryWhatsapp?.trim() || current.primaryWhatsapp;
  const secondaryWhatsapp = updates.secondaryWhatsapp?.trim() || current.secondaryWhatsapp;
  const whatsappNumbers = [primaryWhatsapp, secondaryWhatsapp].filter(Boolean);

  const merged: PlatformContactSettings = {
    ...current,
    ...updates,
    primaryWhatsapp,
    secondaryWhatsapp,
    whatsappNumbers,
  };

  const serialized = JSON.stringify(merged);

  try {
    // Upsert into PostgreSQL system_settings
    await db.$executeRawUnsafe(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('platform_contact', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      serialized
    );
  } catch (err) {
    console.error("[lib/settings] Error persisting contact to PostgreSQL:", err);
    throw err;
  }

  cachedContact = { data: merged, timestamp: Date.now() };
  return merged;
}
