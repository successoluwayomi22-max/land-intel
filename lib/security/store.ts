import fs from "fs/promises";
import path from "path";
import {
  SecurityEvent,
  SecurityIPRecord,
  SecurityIncident,
  SecurityRule,
  MalwareScanRecord,
  MalwareState,
  SecurityAlert,
  SecurityReport,
  SecuritySeverity,
  SecurityEventType,
  IPSecurityState,
  IncidentStatus,
} from "./types";

interface SecurityStoreData {
  events: SecurityEvent[];
  ipRecords: Record<string, SecurityIPRecord>;
  incidents: SecurityIncident[];
  rules: SecurityRule[];
  malwareScans: MalwareScanRecord[];
  alerts: SecurityAlert[];
  reports: SecurityReport[];
}

const STORAGE_FILE = path.join(process.cwd(), "storage", "security_data.json");

// Default predefined production rules
const DEFAULT_RULES: SecurityRule[] = [
  {
    id: "RULE_BRUTE_FORCE_LOGIN",
    name: "Brute Force Authentication Protection",
    description: "Detects repeated failed authentication attempts from a single IP address",
    eventType: "BRUTE_FORCE",
    threshold: 5,
    timeWindowSeconds: 300,
    severity: "HIGH",
    action: "TEMP_BLOCK",
    enabled: true,
    environment: "ALL",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "SYSTEM",
  },
  {
    id: "RULE_CREDENTIAL_STUFFING",
    name: "Distributed Credential Stuffing Detector",
    description: "Flags multi-account login failures originating from the same network client",
    eventType: "CREDENTIAL_STUFFING",
    threshold: 3,
    timeWindowSeconds: 180,
    severity: "CRITICAL",
    action: "TEMP_BLOCK",
    enabled: true,
    environment: "ALL",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "SYSTEM",
  },
  {
    id: "RULE_IDOR_PREVENTION",
    name: "Tenant Isolation & IDOR Shield",
    description: "Detects attempts to access property dossiers or documents across organization boundaries",
    eventType: "IDOR_ATTEMPT",
    threshold: 2,
    timeWindowSeconds: 600,
    severity: "HIGH",
    action: "TEMP_BLOCK",
    enabled: true,
    environment: "ALL",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "SYSTEM",
  },
  {
    id: "RULE_MALWARE_ZERO_TOLERANCE",
    name: "Malware & Polyglot Upload Containment",
    description: "Immediately isolates and quarantines files exhibiting malicious signatures or deceptive MIME types",
    eventType: "MALWARE_DETECTED",
    threshold: 1,
    timeWindowSeconds: 60,
    severity: "CRITICAL",
    action: "QUARANTINE_FILE",
    enabled: true,
    environment: "ALL",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "SYSTEM",
  },
  {
    id: "RULE_WEBHOOK_SIGNATURE",
    name: "Webhook Cryptographic Tampering Guard",
    description: "Detects replayed or untrusted signatures on financial webhook endpoints",
    eventType: "WEBHOOK_INVALID_SIGNATURE",
    threshold: 3,
    timeWindowSeconds: 300,
    severity: "MEDIUM",
    action: "MONITOR",
    enabled: true,
    environment: "ALL",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "SYSTEM",
  },
  {
    id: "RULE_API_PROBING",
    name: "Sensitive Endpoint Probing Guard",
    description: "Blocks automated vulnerability scanners probing for 404/403 administrative paths",
    eventType: "PROBING_ATTACK",
    threshold: 10,
    timeWindowSeconds: 60,
    severity: "MEDIUM",
    action: "RATE_LIMIT",
    enabled: true,
    environment: "ALL",
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "SYSTEM",
  },
];

class SecurityStore {
  private data: SecurityStoreData = {
    events: [],
    ipRecords: {},
    incidents: [],
    rules: DEFAULT_RULES,
    malwareScans: [],
    alerts: [],
    reports: [],
  };
  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  private async ensureDir() {
    try {
      await fs.mkdir(path.dirname(STORAGE_FILE), { recursive: true });
    } catch {
      // Ignored if directory exists
    }
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;
    await this.ensureDir();
    try {
      const raw = await fs.readFile(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      this.data = {
        events: Array.isArray(parsed.events) ? parsed.events : [],
        ipRecords: parsed.ipRecords && typeof parsed.ipRecords === "object" ? parsed.ipRecords : {},
        incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
        rules: Array.isArray(parsed.rules) && parsed.rules.length > 0 ? parsed.rules : DEFAULT_RULES,
        malwareScans: Array.isArray(parsed.malwareScans) ? parsed.malwareScans : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      };
    } catch {
      // If file doesn't exist yet, bootstrap initial operational baseline
      this.bootstrapInitialData();
      await this.persistImmediate();
    }
    this.isLoaded = true;
  }

  private bootstrapInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();
    const tMinus10m = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const tMinus35m = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
    const tMinus2h = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();

    // Baseline security events
    this.data.events = [
      {
        id: "EVT_INIT_101",
        eventType: "RATE_LIMIT_EXCEEDED",
        severity: "LOW",
        timestamp: tMinus2h,
        ip: "197.210.64.12",
        endpoint: "/api/properties",
        method: "GET",
        detectionRule: "GLOBAL_API_RATE_LIMIT",
        actionTaken: "HTTP_429_THROTTLED",
        metadata: { requestCount: 45, windowSec: 60 },
      },
      {
        id: "EVT_INIT_102",
        eventType: "PROBING_ATTACK",
        severity: "MEDIUM",
        timestamp: tMinus35m,
        ip: "185.220.101.5",
        endpoint: "/.env",
        method: "GET",
        userAgent: "curl/7.68.0 scanner",
        detectionRule: "RULE_API_PROBING",
        actionTaken: "RATE_LIMIT_APPLIED",
        metadata: { probeTarget: "/.env", userAgent: "scanner" },
      },
      {
        id: "EVT_INIT_103",
        eventType: "BRUTE_FORCE",
        severity: "HIGH",
        timestamp: tMinus10m,
        ip: "102.89.23.44",
        endpoint: "/api/auth/login",
        method: "POST",
        actorEmail: "targeted_victim@gmail.com",
        detectionRule: "RULE_BRUTE_FORCE_LOGIN",
        actionTaken: "TEMPORARY_IP_BLOCK_30M",
        metadata: { consecutiveFailures: 5, timeWindowSeconds: 300 },
      },
    ];

    // Baseline IP records
    this.data.ipRecords["102.89.23.44"] = {
      ip: "102.89.23.44",
      status: "TEMPORARILY_BLOCKED",
      firstSeen: tMinus2h,
      lastSeen: tMinus10m,
      requestCount: 42,
      failedRequestCount: 14,
      failedAuthCount: 5,
      successfulAuthCount: 0,
      affectedAccounts: ["targeted_victim@gmail.com"],
      affectedOrganizations: [],
      threatScore: 78,
      blockReason: "Repeated failed authentication attempts exceeding threshold (5/300s)",
      detectionRule: "RULE_BRUTE_FORCE_LOGIN",
      expiresAt: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
      updatedAt: isoNow,
    };

    this.data.ipRecords["185.220.101.5"] = {
      ip: "185.220.101.5",
      status: "MONITOR",
      firstSeen: tMinus2h,
      lastSeen: tMinus35m,
      requestCount: 18,
      failedRequestCount: 11,
      failedAuthCount: 0,
      successfulAuthCount: 0,
      affectedAccounts: [],
      affectedOrganizations: [],
      threatScore: 45,
      blockReason: "Automated sensitive path enumeration (.env probe)",
      detectionRule: "RULE_API_PROBING",
      updatedAt: isoNow,
    };

    // Baseline Incident
    this.data.incidents = [
      {
        id: "INC-2026-001",
        title: "Distributed Authentication Probing against DiasporaLand Gateway",
        description: "Multiple login credential attempts originating from suspicious residential IP range.",
        severity: "HIGH",
        status: "CONTAINED",
        affectedUsers: ["targeted_victim@gmail.com"],
        affectedOrganizations: [],
        affectedIps: ["102.89.23.44"],
        affectedResources: ["/api/auth/login"],
        detectionSource: "RULE_BRUTE_FORCE_LOGIN",
        assignedAdmin: "admin@diasporaland.ai",
        timeline: [
          { timestamp: tMinus35m, description: "Initial authentication failures logged", actor: "SYSTEM" },
          { timestamp: tMinus10m, description: "Threshold exceeded (5/5). Temporary block applied for 30 minutes.", actor: "SECURITY_ENGINE" },
          { timestamp: tMinus10m, description: "Incident INC-2026-001 automatically opened", actor: "SYSTEM" },
        ],
        actionsTaken: ["TEMPORARY_BLOCK_30M", "ADMIN_ALERT_DISPATCHED"],
        createdAt: tMinus10m,
        updatedAt: isoNow,
      },
    ];

    // Baseline Alert
    this.data.alerts = [
      {
        id: "ALT-101",
        title: "High-Frequency Login Failures Detected",
        message: "IP 102.89.23.44 temporarily restricted after 5 consecutive password mismatches.",
        severity: "HIGH",
        eventType: "BRUTE_FORCE",
        status: "UNREAD",
        ruleId: "RULE_BRUTE_FORCE_LOGIN",
        createdAt: tMinus10m,
      },
    ];
  }

  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      await this.persistImmediate();
    }, 500);
  }

  public async persistImmediate(): Promise<void> {
    await this.ensureDir();
    try {
      await fs.writeFile(STORAGE_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[SECURITY_STORE_PERSIST_ERROR]", err);
    }
  }

  // --- Events API ---
  public async addEvent(event: Omit<SecurityEvent, "id" | "timestamp"> & { id?: string; timestamp?: string }): Promise<SecurityEvent> {
    await this.load();
    const newEvent: SecurityEvent = {
      id: event.id || `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };

    // Prepend new event
    this.data.events.unshift(newEvent);

    // Limit event buffer to 10,000 in-memory/file records (FIFO pruning)
    if (this.data.events.length > 10000) {
      this.data.events = this.data.events.slice(0, 10000);
    }

    this.scheduleSave();
    return newEvent;
  }

  public async getEvents(filter?: {
    severity?: SecuritySeverity;
    eventType?: SecurityEventType;
    ip?: string;
    actorEmail?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: SecurityEvent[]; total: number }> {
    await this.load();
    let list = this.data.events;

    if (filter?.severity) {
      list = list.filter((e) => e.severity === filter.severity);
    }
    if (filter?.eventType) {
      list = list.filter((e) => e.eventType === filter.eventType);
    }
    if (filter?.ip) {
      list = list.filter((e) => e.ip.includes(filter.ip!));
    }
    if (filter?.actorEmail) {
      list = list.filter((e) => e.actorEmail?.toLowerCase().includes(filter.actorEmail!.toLowerCase()));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.ip.includes(q) ||
          e.eventType.toLowerCase().includes(q) ||
          e.detectionRule.toLowerCase().includes(q) ||
          (e.endpoint && e.endpoint.toLowerCase().includes(q)) ||
          (e.actorEmail && e.actorEmail.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;
    const sliced = list.slice(offset, offset + limit);

    return { events: sliced, total };
  }

  // --- IP Records API ---
  public async getIPRecord(ip: string): Promise<SecurityIPRecord | null> {
    await this.load();
    const record = this.data.ipRecords[ip];
    if (!record) return null;

    // Check if temporary block has expired
    if (record.status === "TEMPORARILY_BLOCKED" && record.expiresAt) {
      if (new Date(record.expiresAt).getTime() <= Date.now()) {
        record.status = "MONITOR";
        record.blockReason = "Temporary block expired automatically";
        record.updatedAt = new Date().toISOString();
        this.scheduleSave();
      }
    }

    return record;
  }

  public async recordIPActivity(params: {
    ip: string;
    failedAuth?: boolean;
    successfulAuth?: boolean;
    failedRequest?: boolean;
    accountEmail?: string;
    organizationId?: string;
    threatDelta?: number;
  }): Promise<SecurityIPRecord> {
    await this.load();
    const now = new Date().toISOString();
    let record = this.data.ipRecords[params.ip];

    if (!record) {
      record = {
        ip: params.ip,
        status: "MONITOR",
        firstSeen: now,
        lastSeen: now,
        requestCount: 1,
        failedRequestCount: params.failedRequest ? 1 : 0,
        failedAuthCount: params.failedAuth ? 1 : 0,
        successfulAuthCount: params.successfulAuth ? 1 : 0,
        affectedAccounts: params.accountEmail ? [params.accountEmail] : [],
        affectedOrganizations: params.organizationId ? [params.organizationId] : [],
        threatScore: params.threatDelta || 0,
        updatedAt: now,
      };
    } else {
      record.lastSeen = now;
      record.requestCount += 1;
      if (params.failedRequest) record.failedRequestCount += 1;
      if (params.failedAuth) record.failedAuthCount += 1;
      if (params.successfulAuth) record.successfulAuthCount += 1;
      if (params.threatDelta) {
        record.threatScore = Math.min(100, Math.max(0, record.threatScore + params.threatDelta));
      }
      if (params.accountEmail && !record.affectedAccounts.includes(params.accountEmail)) {
        record.affectedAccounts.push(params.accountEmail);
      }
      if (params.organizationId && !record.affectedOrganizations.includes(params.organizationId)) {
        record.affectedOrganizations.push(params.organizationId);
      }
      record.updatedAt = now;
    }

    this.data.ipRecords[params.ip] = record;
    this.scheduleSave();
    return record;
  }

  public async setIPStatus(
    ip: string,
    status: IPSecurityState,
    reason: string,
    expiresAt?: string,
    adminEmail?: string
  ): Promise<SecurityIPRecord> {
    await this.load();
    const now = new Date().toISOString();
    let record = this.data.ipRecords[ip];

    if (!record) {
      record = {
        ip,
        status,
        firstSeen: now,
        lastSeen: now,
        requestCount: 1,
        failedRequestCount: 0,
        failedAuthCount: 0,
        successfulAuthCount: 0,
        affectedAccounts: [],
        affectedOrganizations: [],
        threatScore: status === "TEMPORARILY_BLOCKED" || status === "PERMANENTLY_BLOCKED" ? 85 : 10,
        blockReason: reason,
        expiresAt,
        createdBy: adminEmail || "SYSTEM",
        updatedAt: now,
      };
    } else {
      record.status = status;
      record.blockReason = reason;
      record.expiresAt = expiresAt;
      record.updatedAt = now;
      if (adminEmail) record.createdBy = adminEmail;
    }

    if (status === "ALLOW") {
      record.isAllowlisted = true;
      record.allowlistReason = reason;
    } else if (status === "PERMANENTLY_BLOCKED") {
      record.isDenylisted = true;
    }

    this.data.ipRecords[ip] = record;
    this.scheduleSave();
    return record;
  }

  public async getAllIPRecords(): Promise<SecurityIPRecord[]> {
    await this.load();
    // Refresh expirations
    const now = Date.now();
    for (const record of Object.values(this.data.ipRecords)) {
      if (record.status === "TEMPORARILY_BLOCKED" && record.expiresAt) {
        if (new Date(record.expiresAt).getTime() <= now) {
          record.status = "MONITOR";
          record.blockReason = "Temporary block automatically expired";
          record.updatedAt = new Date().toISOString();
        }
      }
    }
    return Object.values(this.data.ipRecords).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }

  // --- Incidents API ---
  public async getIncidents(status?: IncidentStatus): Promise<SecurityIncident[]> {
    await this.load();
    let list = this.data.incidents;
    if (status) list = list.filter((i) => i.status === status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createIncident(incident: Omit<SecurityIncident, "id" | "createdAt" | "updatedAt">): Promise<SecurityIncident> {
    await this.load();
    const now = new Date().toISOString();
    const newInc: SecurityIncident = {
      id: `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: now,
      updatedAt: now,
      ...incident,
    };
    this.data.incidents.unshift(newInc);
    this.scheduleSave();
    return newInc;
  }

  public async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    resolution?: string,
    adminEmail?: string
  ): Promise<SecurityIncident | null> {
    await this.load();
    const inc = this.data.incidents.find((i) => i.id === id);
    if (!inc) return null;

    const now = new Date().toISOString();
    inc.status = status;
    inc.updatedAt = now;
    if (resolution) inc.resolution = resolution;
    if (status === "RESOLVED") inc.resolvedAt = now;

    inc.timeline.push({
      timestamp: now,
      description: `Incident status changed to ${status}${resolution ? `: ${resolution}` : ""}`,
      actor: adminEmail || "SYSTEM",
    });

    this.scheduleSave();
    return inc;
  }

  // --- Rules API ---
  public async getRules(): Promise<SecurityRule[]> {
    await this.load();
    return this.data.rules;
  }

  public async updateRule(id: string, updates: Partial<SecurityRule>, adminEmail?: string): Promise<SecurityRule | null> {
    await this.load();
    const rule = this.data.rules.find((r) => r.id === id);
    if (!rule) return null;

    Object.assign(rule, updates, {
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || "ADMIN",
      version: (rule.version || 1) + 1,
    });

    this.scheduleSave();
    return rule;
  }

  // --- Malware Scans API ---
  public async addMalwareScan(record: Omit<MalwareScanRecord, "id" | "scannedAt">): Promise<MalwareScanRecord> {
    await this.load();
    const newRecord: MalwareScanRecord = {
      id: `SCAN_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      scannedAt: new Date().toISOString(),
      ...record,
    };
    this.data.malwareScans.unshift(newRecord);
    this.scheduleSave();
    return newRecord;
  }

  public async getMalwareScans(status?: string): Promise<MalwareScanRecord[]> {
    await this.load();
    let list = this.data.malwareScans;
    if (status) list = list.filter((s) => s.status === status);
    return list;
  }

  public async updateMalwareStatus(id: string, status: MalwareState, notes?: string): Promise<MalwareScanRecord | null> {
    await this.load();
    const scan = this.data.malwareScans.find((s) => s.id === id);
    if (!scan) return null;
    scan.status = status;
    if (notes) scan.notes = notes;
    this.scheduleSave();
    return scan;
  }

  // --- Alerts API ---
  public async getAlerts(): Promise<SecurityAlert[]> {
    await this.load();
    return this.data.alerts;
  }

  public async acknowledgeAlert(id: string, adminEmail: string): Promise<boolean> {
    await this.load();
    const alert = this.data.alerts.find((a) => a.id === id);
    if (!alert) return false;
    alert.status = "ACKNOWLEDGED";
    alert.acknowledgedBy = adminEmail;
    this.scheduleSave();
    return true;
  }

  // --- Overall SOC Metrics ---
  public async getOverviewMetrics() {
    await this.load();
    const ipList = await this.getAllIPRecords();
    const activeBlocks = ipList.filter((ip) => ip.status === "TEMPORARILY_BLOCKED" || ip.status === "PERMANENTLY_BLOCKED");
    const suspiciousIps = ipList.filter((ip) => ip.threatScore >= 40);
    const openIncidents = this.data.incidents.filter((i) => i.status === "OPEN" || i.status === "INVESTIGATING");
    const quarantinedFiles = this.data.malwareScans.filter((s) => s.status === "QUARANTINED" || s.status === "INFECTED");

    // Posture score breakdown: 100 base, deductions for active threats/open incidents
    let postureScore = 100;
    if (openIncidents.length > 0) postureScore -= openIncidents.length * 8;
    if (activeBlocks.length > 0) postureScore -= activeBlocks.length * 3;
    if (quarantinedFiles.length > 0) postureScore -= quarantinedFiles.length * 5;
    postureScore = Math.max(25, Math.min(100, postureScore));

    return {
      postureScore,
      postureStatus: postureScore >= 85 ? "EXCELLENT" : postureScore >= 65 ? "ATTENTION_REQUIRED" : "ELEVATED_THREAT",
      totalEvents: this.data.events.length,
      activeBlocksCount: activeBlocks.length,
      suspiciousIpsCount: suspiciousIps.length,
      openIncidentsCount: openIncidents.length,
      quarantinedFilesCount: quarantinedFiles.length,
      activeRulesCount: this.data.rules.filter((r) => r.enabled).length,
      recentEvents: this.data.events.slice(0, 10),
      openIncidentsList: openIncidents.slice(0, 5),
    };
  }
}

export const securityStore = new SecurityStore();
