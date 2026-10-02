import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { sendSecurityThreatAlertEmail } from "@/lib/email/send";

export interface ThreatEvent {
  type: string; // e.g. "REGISTRATION_SPAM", "PATH_TRAVERSAL", "EXPLOIT_PROBE", "BRUTE_FORCE", "SQLI_PROBE", "DISPOSABLE_EMAIL_ABUSE"
  score: number; // e.g. 5, 10, 25, 50
  reason: string;
  path?: string;
  payloadSnippet?: string;
  userAgent?: string;
}

export interface ThreatProfile {
  ip: string;
  threatScore: number;
  strikeCount: number;
  bannedUntil: number | null; // epoch ms (null = permanent ban)
  isPermanent: boolean;
  firstSeen: number;
  lastSeen: number;
  reasons: string[];
  attackEvents: Array<{
    timestamp: number;
    type: string;
    reason: string;
    path?: string;
  }>;
  lastAlertSentAt: number | null;
}

// In-memory threat memory store for high-speed sub-millisecond evaluation
const threatStore = new Map<string, ThreatProfile>();

// Known hostile probe patterns (automated vulnerability scanners)
const EXPLOIT_PATH_PATTERNS = [
  /wp-admin/i,
  /wp-login\.php/i,
  /xmlrpc\.php/i,
  /\.env($|\?)/i,
  /\.git\//i,
  /phpmyadmin/i,
  /pma/i,
  /actuator\//i,
  /telescope\//i,
  /cgi-bin/i,
  /shell\.php/i,
  /eval-stdin\.php/i,
  /\.aws\//i,
  /solr\//i,
  /\.vscode\//i,
  /boaform/i,
];

// Malicious payload patterns
const MALICIOUS_PAYLOAD_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /\bUNION\s+SELECT\b/gi,
  /\bINFORMATION_SCHEMA\b/gi,
  /'\s*OR\s*'1'\s*=\s*'1'/gi,
  /"\s*OR\s*"1"\s*=\s*"1"/gi,
  /\bexec\s*\(\s*xp_cmdshell\b/gi,
  /\.\.\/(\.\.\/)+/g, // Directory traversal
];

// Cache synchronization flag
let isDbSynced = false;

/**
 * Initializes and syncs active IP bans from PostgreSQL database on startup.
 */
async function syncFromDatabase(): Promise<void> {
  if (isDbSynced) return;
  try {
    const recentBans = await db.auditLog.findMany({
      where: {
        action: "SECURITY_IP_BANNED",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const now = Date.now();
    for (const record of recentBans) {
      if (!record.resourceId) continue;
      const ip = record.resourceId;
      let details: any = {};
      try {
        if (record.details) details = JSON.parse(record.details);
      } catch {}

      const bannedUntil = details.bannedUntil ? Number(details.bannedUntil) : null;
      const isPermanent = !!details.isPermanent;

      // Keep if permanent or ban has not yet expired
      if (isPermanent || (bannedUntil && bannedUntil > now)) {
        threatStore.set(ip, {
          ip,
          threatScore: details.threatScore || 30,
          strikeCount: details.strikeCount || 1,
          bannedUntil,
          isPermanent,
          firstSeen: details.firstSeen || new Date(record.createdAt).getTime(),
          lastSeen: details.lastSeen || new Date(record.createdAt).getTime(),
          reasons: details.reasons || ["Persistent malicious activity"],
          attackEvents: details.attackEvents || [],
          lastAlertSentAt: details.lastAlertSentAt || null,
        });
      }
    }
    isDbSynced = true;
  } catch (err) {
    console.warn("[THREAT_ENGINE] DB sync warning:", err);
  }
}

/**
 * Evaluates an incoming HTTP request for active IP bans and hostile exploit signatures.
 * Returns { allowed: true } or { allowed: false, status: 403, reason: string }.
 */
export async function evaluateRequest(
  request: Request
): Promise<{ allowed: boolean; status?: number; reason?: string; bannedUntil?: string }> {
  await syncFromDatabase();

  const ip = getClientIp(request);
  const now = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;
  const userAgent = request.headers.get("user-agent") || "";

  // 1. Check if IP is currently banned
  const profile = threatStore.get(ip);
  if (profile) {
    if (profile.isPermanent) {
      return {
        allowed: false,
        status: 403,
        reason: `IP ${ip} is permanently blacklisted for repeated cyber attacks.`,
        bannedUntil: "Permanent Blacklist",
      };
    }

    if (profile.bannedUntil && profile.bannedUntil > now) {
      const minutesRemaining = Math.max(1, Math.ceil((profile.bannedUntil - now) / 60000));
      return {
        allowed: false,
        status: 403,
        reason: `Your IP has been temporarily restricted due to suspicious activity. Try again in ${minutesRemaining} minutes.`,
        bannedUntil: `${minutesRemaining} minutes remaining`,
      };
    }

    // Ban expired -> Keep strike memory so repeat attacks get harsher multipliers!
    if (profile.bannedUntil && profile.bannedUntil <= now) {
      profile.bannedUntil = null;
      profile.threatScore = Math.floor(profile.threatScore / 2); // Cool off score partially
    }
  }

  // 2. Scan for Exploit Probes (vulnerability scanners hunting for .env, wp-admin, etc.)
  for (const pattern of EXPLOIT_PATH_PATTERNS) {
    if (pattern.test(path)) {
      await recordThreatEvent(ip, {
        type: "EXPLOIT_PROBE",
        score: 35, // Immediate strike
        reason: `Probing restricted system path: ${path}`,
        path,
        userAgent,
      });

      return {
        allowed: false,
        status: 403,
        reason: "Access denied by LandIntel Security Firewall.",
        bannedUntil: "Automated Threat Ban Active",
      };
    }
  }

  // 3. Scan for Injection Payloads in query parameters
  if (search) {
    for (const pattern of MALICIOUS_PAYLOAD_PATTERNS) {
      if (pattern.test(search)) {
        await recordThreatEvent(ip, {
          type: "SQLI_PROBE",
          score: 40,
          reason: `Detected malicious injection pattern in request query parameters`,
          path,
          payloadSnippet: search.slice(0, 100),
          userAgent,
        });

        return {
          allowed: false,
          status: 403,
          reason: "Request blocked due to malicious payload signature.",
          bannedUntil: "Automated Threat Ban Active",
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Records an attack or suspicious event against an IP, calculates threat score,
 * applies escalating progressive penalties, and notifies the platform owner via email.
 */
export async function recordThreatEvent(
  ip: string,
  event: ThreatEvent
): Promise<{ isBanned: boolean; threatScore: number; strikeCount: number; bannedUntil?: number | null }> {
  await syncFromDatabase();
  const now = Date.now();

  let profile = threatStore.get(ip);
  if (!profile) {
    profile = {
      ip,
      threatScore: 0,
      strikeCount: 0,
      bannedUntil: null,
      isPermanent: false,
      firstSeen: now,
      lastSeen: now,
      reasons: [],
      attackEvents: [],
      lastAlertSentAt: null,
    };
    threatStore.set(ip, profile);
  }

  profile.lastSeen = now;
  profile.threatScore += event.score;
  if (!profile.reasons.includes(event.reason)) {
    profile.reasons.push(event.reason);
  }

  profile.attackEvents.unshift({
    timestamp: now,
    type: event.type,
    reason: event.reason,
    path: event.path,
  });

  // Limit in-memory event trail per IP
  if (profile.attackEvents.length > 20) {
    profile.attackEvents = profile.attackEvents.slice(0, 20);
  }

  let newlyBanned = false;
  let banDurationHours = 0;

  // ADAPTIVE LEARNING & ESCALATION RULES:
  // As the attacker continues, ban time progressively escalates ("gets stronger")
  if (profile.threatScore >= 30 || profile.strikeCount >= 2) {
    profile.strikeCount += 1;
    newlyBanned = true;

    if (profile.strikeCount >= 5) {
      // Repeat offender after multiple bans: Permanent Blacklist
      profile.isPermanent = true;
      profile.bannedUntil = null;
    } else {
      // Escalating progressive multiplier:
      // Strike 1: 1 hour
      // Strike 2: 6 hours
      // Strike 3: 24 hours
      // Strike 4: 72 hours (3 days)
      const baseHours = [1, 6, 24, 72][Math.min(profile.strikeCount - 1, 3)];
      banDurationHours = baseHours;
      profile.bannedUntil = now + baseHours * 3600 * 1000;
    }
  } else if (profile.threatScore >= 15 && !profile.bannedUntil) {
    // Moderate threshold: 30-minute freeze
    profile.strikeCount = Math.max(1, profile.strikeCount);
    profile.bannedUntil = now + 30 * 60 * 1000;
    newlyBanned = true;
    banDurationHours = 0.5;
  }

  // Persist ban state to AuditLog in PostgreSQL
  if (newlyBanned) {
    try {
      await db.auditLog.create({
        data: {
          action: "SECURITY_IP_BANNED",
          resourceType: "Firewall",
          resourceId: ip,
          ipAddress: ip,
          userAgent: event.userAgent || "ThreatEngine Agent",
          details: JSON.stringify({
            threatScore: profile.threatScore,
            strikeCount: profile.strikeCount,
            bannedUntil: profile.bannedUntil,
            isPermanent: profile.isPermanent,
            banDurationHours,
            primaryReason: event.reason,
            reasons: profile.reasons,
            attackType: event.type,
            targetPath: event.path,
            firstSeen: profile.firstSeen,
            lastSeen: profile.lastSeen,
          }),
        },
      });
    } catch (auditErr) {
      console.warn("[THREAT_ENGINE] Failed to persist security audit record:", auditErr);
    }

    // Send immediate email alert to platform owner (throttled to at most 1 alert per IP per 30 minutes)
    const alertCooldown = 30 * 60 * 1000;
    if (!profile.lastAlertSentAt || now - profile.lastAlertSentAt > alertCooldown) {
      profile.lastAlertSentAt = now;

      // Dispatch alert in background so it doesn't block request latency
      const banText = profile.isPermanent
        ? "Permanent Blacklist"
        : `${banDurationHours >= 1 ? `${banDurationHours} Hours` : "30 Minutes"} (Escalation Active)`;

      sendSecurityThreatAlertEmail(
        {
          attackerIp: ip,
          attackType: event.type.replace(/_/g, " "),
          threatScore: profile.threatScore,
          strikeCount: profile.strikeCount,
          actionTaken: profile.isPermanent ? "PERMANENT FIREWALL BLACKLIST" : `AUTOMATIC IP BAN (${banText})`,
          bannedUntil: banText,
          details: `Trigger: ${event.reason}. The system automatically escalated defense parameters and blocked this client.`,
          targetEndpoint: event.path || "/api/auth/*",
          userAgent: event.userAgent || "Automated Bot / Unknown",
          timestamp: new Date().toUTCString(),
          adminDashboardUrl: "https://landintel.ai/admin",
        },
        "successoluwayomi22@gmail.com"
      ).catch((mailErr) => {
        console.error("[THREAT_ENGINE] Failed to dispatch security alert email:", mailErr);
      });
    }
  }

  return {
    isBanned: !!profile.bannedUntil || profile.isPermanent,
    threatScore: profile.threatScore,
    strikeCount: profile.strikeCount,
    bannedUntil: profile.bannedUntil,
  };
}

/**
 * Unbans an IP address and resets its immediate ban state.
 */
export async function unbanIp(ip: string): Promise<boolean> {
  const profile = threatStore.get(ip);
  if (profile) {
    profile.bannedUntil = null;
    profile.isPermanent = false;
    profile.threatScore = 0;
  }

  try {
    await db.auditLog.create({
      data: {
        action: "SECURITY_IP_UNBANNED",
        resourceType: "Firewall",
        resourceId: ip,
        ipAddress: ip,
        details: JSON.stringify({
          unbannedAt: new Date().toISOString(),
          unbannedBy: "ADMIN",
        }),
      },
    });
  } catch (err) {
    console.warn("[THREAT_ENGINE] Unban log error:", err);
  }

  return true;
}

/**
 * Manually blacklists an IP address with a custom reason and duration.
 */
export async function manualBanIp(
  ip: string,
  reason: string,
  durationHours: number = 24,
  isPermanent: boolean = false
): Promise<ThreatProfile> {
  const now = Date.now();
  const bannedUntil = isPermanent ? null : now + durationHours * 3600 * 1000;

  const profile: ThreatProfile = {
    ip,
    threatScore: 50,
    strikeCount: 3,
    bannedUntil,
    isPermanent,
    firstSeen: now,
    lastSeen: now,
    reasons: [reason || "Manually blacklisted by administrator"],
    attackEvents: [
      {
        timestamp: now,
        type: "MANUAL_ADMIN_BAN",
        reason: reason || "Manual block enforced from admin dashboard",
      },
    ],
    lastAlertSentAt: now,
  };

  threatStore.set(ip, profile);

  try {
    await db.auditLog.create({
      data: {
        action: "SECURITY_IP_BANNED",
        resourceType: "Firewall",
        resourceId: ip,
        ipAddress: ip,
        details: JSON.stringify({
          threatScore: profile.threatScore,
          strikeCount: profile.strikeCount,
          bannedUntil,
          isPermanent,
          banDurationHours: durationHours,
          primaryReason: reason,
          manual: true,
        }),
      },
    });
  } catch (err) {
    console.warn("[THREAT_ENGINE] Manual ban audit log error:", err);
  }

  return profile;
}

/**
 * Returns complete telemetry of active bans and neutralized attacks for the Admin Radar.
 */
export async function getThreatRadarTelemetry(): Promise<{
  activeBans: Array<{
    ip: string;
    threatScore: number;
    strikeCount: number;
    bannedUntil: string;
    isPermanent: boolean;
    remainingMinutes: number | null;
    reasons: string[];
    lastSeen: string;
    eventCount: number;
  }>;
  totalNeutralizedAttacks: number;
  criticalBansCount: number;
  permanentBansCount: number;
}> {
  await syncFromDatabase();
  const now = Date.now();

  const activeBans: any[] = [];
  let totalNeutralized = 0;
  let criticalBans = 0;
  let permanentBans = 0;

  threatStore.forEach((profile) => {
    totalNeutralized += profile.attackEvents.length;

    const isCurrentlyBanned = profile.isPermanent || (profile.bannedUntil && profile.bannedUntil > now);
    if (isCurrentlyBanned) {
      if (profile.isPermanent) permanentBans++;
      if (profile.threatScore >= 30) criticalBans++;

      const remainingMinutes = profile.bannedUntil
        ? Math.max(1, Math.ceil((profile.bannedUntil - now) / 60000))
        : null;

      activeBans.push({
        ip: profile.ip,
        threatScore: profile.threatScore,
        strikeCount: profile.strikeCount,
        bannedUntil: profile.isPermanent
          ? "Permanent Blacklist"
          : profile.bannedUntil
          ? new Date(profile.bannedUntil).toISOString()
          : "N/A",
        isPermanent: profile.isPermanent,
        remainingMinutes,
        reasons: profile.reasons,
        lastSeen: new Date(profile.lastSeen).toISOString(),
        eventCount: profile.attackEvents.length,
      });
    }
  });

  return {
    activeBans,
    totalNeutralizedAttacks: totalNeutralized,
    criticalBansCount: criticalBans,
    permanentBansCount: permanentBans,
  };
}
