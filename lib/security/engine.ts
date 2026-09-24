import { securityStore } from "./store";
import {
  SecuritySeverity,
  SecurityEventType,
  IPSecurityState,
  SecurityEvent,
} from "./types";

interface RequestEvaluationContext {
  ip: string;
  method?: string;
  endpoint?: string;
  userAgent?: string;
  actorId?: string;
  actorEmail?: string;
  organizationId?: string;
  requestId?: string;
}

// In-memory sliding window counters for rapid real-time threshold detection
interface SlidingCounter {
  count: number;
  resetAt: number;
  accounts: Set<string>;
}

const eventCounters = new Map<string, SlidingCounter>();

// Cleanup stale counters periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    eventCounters.forEach((v, k) => {
      if (v.resetAt <= now) eventCounters.delete(k);
    });
  }, 2 * 60 * 1000);
}

export class ThreatDetectionEngine {
  /**
   * Helper to check if IP is within CIDR or matches an IP exactly
   */
  private matchesIpOrCidr(ip: string, pattern: string): boolean {
    if (pattern === ip) return true;
    if (pattern.includes("/")) {
      try {
        const [range, bitsStr] = pattern.split("/");
        const bits = parseInt(bitsStr, 10);
        const ipNum = this.ipToNumber(ip);
        const rangeNum = this.ipToNumber(range);
        const mask = ~((1 << (32 - bits)) - 1);
        return (ipNum & mask) === (rangeNum & mask);
      } catch {
        return false;
      }
    }
    return false;
  }

  private ipToNumber(ip: string): number {
    return (
      ip
        .split(".")
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    );
  }

  /**
   * Evaluates whether an incoming IP is currently blocked or restricted.
   */
  public async evaluateIpAccess(
    ip: string,
    endpoint?: string
  ): Promise<{
    allowed: boolean;
    state: IPSecurityState;
    reason?: string;
    blockExpiresAt?: string;
  }> {
    try {
      // 1. Check if IP is localhost/loopback
      if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
        // Loopback is monitored but protected from accidental lockout
        return { allowed: true, state: "ALLOW" };
      }

      const record = await securityStore.getIPRecord(ip);
      if (!record) {
        return { allowed: true, state: "MONITOR" };
      }

      // 2. Check Allowlist
      if (record.isAllowlisted || record.status === "ALLOW") {
        return { allowed: true, state: "ALLOW", reason: record.allowlistReason };
      }

      // 3. Check Permanent Denylist
      if (record.isDenylisted || record.status === "PERMANENTLY_BLOCKED") {
        return {
          allowed: false,
          state: "PERMANENTLY_BLOCKED",
          reason: record.blockReason || "IP permanently blocked due to security violations",
        };
      }

      // 4. Check Temporary Block
      if (record.status === "TEMPORARILY_BLOCKED") {
        if (record.expiresAt && new Date(record.expiresAt).getTime() > Date.now()) {
          return {
            allowed: false,
            state: "TEMPORARILY_BLOCKED",
            reason: record.blockReason || "IP is temporarily restricted due to suspicious behavior",
            blockExpiresAt: record.expiresAt,
          };
        } else {
          // Expired
          record.status = "MONITOR";
        }
      }

      // 5. Rate limit state
      if (record.status === "RATE_LIMIT") {
        return { allowed: true, state: "RATE_LIMIT", reason: record.blockReason };
      }

      return { allowed: true, state: record.status };
    } catch (err) {
      console.warn("[THREAT_ENGINE_EVAL_WARN]", (err as Error)?.message || err);
      return { allowed: true, state: "ALLOW" };
    }
  }

  /**
   * Reports a security threat occurrence and applies progressive automated enforcement.
   */
  public async reportThreat(
    eventType: SecurityEventType,
    ctx: RequestEvaluationContext,
    meta?: Record<string, unknown>
  ): Promise<{
    actionTaken: string;
    isBlocked: boolean;
    event?: SecurityEvent;
  }> {
    try {
      const rules = await securityStore.getRules();
      const matchingRule = rules.find((r) => r.enabled && r.eventType === eventType);

      const now = Date.now();
      const windowSec = matchingRule ? matchingRule.timeWindowSeconds : 300;
      const threshold = matchingRule ? matchingRule.threshold : 5;
      const severity = matchingRule ? matchingRule.severity : "HIGH";

      // Update sliding counter
      const counterKey = `${eventType}:${ctx.ip}`;
      let counter = eventCounters.get(counterKey);
      if (!counter || counter.resetAt <= now) {
        counter = { count: 1, resetAt: now + windowSec * 1000, accounts: new Set() };
      } else {
        counter.count += 1;
      }
      if (ctx.actorEmail) counter.accounts.add(ctx.actorEmail);
      eventCounters.set(counterKey, counter);

      // Record activity in IP store
      await securityStore.recordIPActivity({
        ip: ctx.ip,
        failedAuth: eventType === "BRUTE_FORCE" || eventType === "CREDENTIAL_STUFFING",
        failedRequest: true,
        accountEmail: ctx.actorEmail,
        organizationId: ctx.organizationId,
        threatDelta: severity === "CRITICAL" ? 25 : severity === "HIGH" ? 15 : 5,
      });

      let actionTaken = "LOGGED";
      let isBlocked = false;

      // Check if threshold exceeded
      if (counter.count >= threshold) {
        const targetAction = matchingRule ? matchingRule.action : "TEMP_BLOCK";

        if (targetAction === "TEMP_BLOCK" || targetAction === "RATE_LIMIT") {
          // Protect loopback from permanent damage
          if (ctx.ip !== "127.0.0.1" && ctx.ip !== "::1") {
            const durationMinutes = severity === "CRITICAL" ? 60 : 30;
            const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
            const reason = `Automated enforcement: ${matchingRule?.name || eventType} triggered (${counter.count} occurrences in ${windowSec}s)`;

            await securityStore.setIPStatus(
              ctx.ip,
              "TEMPORARILY_BLOCKED",
              reason,
              expiresAt,
              "SECURITY_ENGINE"
            );

            actionTaken = `TEMPORARY_BLOCK_${durationMinutes}M`;
            isBlocked = true;

            // Open incident if high or critical
            if (severity === "HIGH" || severity === "CRITICAL") {
              await securityStore.createIncident({
                title: `${eventType.replace(/_/g, " ")} detected from ${ctx.ip}`,
                description: `Automated detection triggered by ${matchingRule?.name || eventType}. Affected accounts: ${Array.from(counter.accounts).join(", ") || "N/A"}.`,
                severity,
                status: "OPEN",
                affectedUsers: Array.from(counter.accounts),
                affectedOrganizations: ctx.organizationId ? [ctx.organizationId] : [],
                affectedIps: [ctx.ip],
                affectedResources: ctx.endpoint ? [ctx.endpoint] : [],
                detectionSource: matchingRule?.id || "SECURITY_ENGINE",
                timeline: [
                  {
                    timestamp: new Date().toISOString(),
                    description: `Threshold exceeded: ${counter.count}/${threshold} events. Applied temporary block for ${durationMinutes}m.`,
                    actor: "SECURITY_ENGINE",
                  },
                ],
                actionsTaken: [actionTaken],
              });
            }
          } else {
            actionTaken = "DEV_LOOPBACK_BYPASS_LOGGED";
          }
        } else {
          actionTaken = `${targetAction}_APPLIED`;
        }
      }

      // Persist security event
      const event = await securityStore.addEvent({
        eventType,
        severity,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        endpoint: ctx.endpoint,
        method: ctx.method,
        actorEmail: ctx.actorEmail,
        actorId: ctx.actorId,
        organizationId: ctx.organizationId,
        detectionRule: matchingRule?.id || "DEFAULT_DETECTION_POLICY",
        actionTaken,
        metadata: {
          ...meta,
          counterCount: counter.count,
          threshold,
          windowSeconds: windowSec,
        },
      });

      return { actionTaken, isBlocked, event };
    } catch (err) {
      console.warn("[THREAT_ENGINE_REPORT_WARN]", (err as Error)?.message || err);
      return { actionTaken: "LOGGED_SAFE", isBlocked: false };
    }
  }

  /**
   * Manual admin action to block or unblock an IP
   */
  public async updateIpEnforcement(params: {
    ip: string;
    state: IPSecurityState;
    reason: string;
    durationMinutes?: number;
    adminEmail: string;
  }) {
    let expiresAt: string | undefined;
    if (params.state === "TEMPORARILY_BLOCKED" && params.durationMinutes) {
      expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000).toISOString();
    }

    const record = await securityStore.setIPStatus(
      params.ip,
      params.state,
      params.reason,
      expiresAt,
      params.adminEmail
    );

    // Record audit event
    await securityStore.addEvent({
      eventType: "SUSPICIOUS_ADMIN_ACTIVITY",
      severity: "INFO",
      ip: params.ip,
      detectionRule: "MANUAL_IP_ENFORCEMENT",
      actionTaken: `MANUAL_STATE_${params.state}`,
      actorEmail: params.adminEmail,
      metadata: { reason: params.reason, expiresAt },
    });

    return record;
  }
}

export const threatEngine = new ThreatDetectionEngine();
