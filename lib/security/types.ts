export type SecuritySeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityEventType =
  | "BRUTE_FORCE"
  | "CREDENTIAL_STUFFING"
  | "MFA_ABUSE"
  | "IDOR_ATTEMPT"
  | "TOKEN_REPLAY"
  | "MALWARE_DETECTED"
  | "MALICIOUS_UPLOAD"
  | "RATE_LIMIT_EXCEEDED"
  | "ENUMERATION_ATTACK"
  | "WEBHOOK_INVALID_SIGNATURE"
  | "PAYMENT_FRAUD_SIGNAL"
  | "SUSPICIOUS_ADMIN_ACTIVITY"
  | "PRIVILEGE_ESCALATION"
  | "PROBING_ATTACK"
  | "CSRF_VIOLATION";

export type IPSecurityState =
  | "ALLOW"
  | "MONITOR"
  | "RATE_LIMIT"
  | "CHALLENGE"
  | "TEMPORARILY_BLOCKED"
  | "QUARANTINED"
  | "PERMANENTLY_BLOCKED";

export type MalwareState =
  | "UPLOADED"
  | "SCANNING"
  | "CLEAN"
  | "INFECTED"
  | "SUSPICIOUS"
  | "SCAN_FAILED"
  | "QUARANTINED"
  | "RELEASED"
  | "DELETED";

export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "CONTAINED"
  | "RESOLVED"
  | "FALSE_POSITIVE";

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: string; // ISO-8601
  requestId?: string;
  traceId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  actorId?: string;
  actorEmail?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  detectionRule: string;
  actionTaken: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityIPRecord {
  ip: string;
  status: IPSecurityState;
  firstSeen: string;
  lastSeen: string;
  requestCount: number;
  failedRequestCount: number;
  failedAuthCount: number;
  successfulAuthCount: number;
  affectedAccounts: string[];
  affectedOrganizations: string[];
  threatScore: number; // 0 to 100
  blockReason?: string;
  detectionRule?: string;
  expiresAt?: string; // ISO-8601 for temporary blocks
  isAllowlisted?: boolean;
  isDenylisted?: boolean;
  allowlistReason?: string;
  createdBy?: string;
  updatedAt: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  status: IncidentStatus;
  affectedUsers: string[];
  affectedOrganizations: string[];
  affectedIps: string[];
  affectedResources: string[];
  detectionSource: string;
  assignedAdmin?: string;
  timeline: Array<{
    timestamp: string;
    description: string;
    actor?: string;
  }>;
  actionsTaken: string[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  eventType: SecurityEventType;
  threshold: number;
  timeWindowSeconds: number;
  severity: SecuritySeverity;
  action: "LOG" | "MONITOR" | "RATE_LIMIT" | "CHALLENGE" | "TEMP_BLOCK" | "QUARANTINE_FILE" | "REVOKE_SESSION" | "NOTIFY_ADMIN";
  enabled: boolean;
  environment: "ALL" | "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface MalwareScanRecord {
  id: string;
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: MalwareState;
  scanner: string;
  scannerResult: string;
  threatSignature?: string;
  quarantineStorageKey?: string;
  userId: string;
  organizationId?: string;
  caseId?: string;
  uploadTime: string;
  scannedAt: string;
  notes?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: SecuritySeverity;
  eventType: SecurityEventType;
  status: "UNREAD" | "ACKNOWLEDGED" | "RESOLVED" | "MUTED";
  ruleId?: string;
  createdAt: string;
  acknowledgedBy?: string;
}

export interface SecurityReport {
  id: string;
  title: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  startDate: string;
  endDate: string;
  generatedAt: string;
  generatedBy: string;
  metrics: {
    threatsDetected: number;
    threatsBlocked: number;
    malwareDetections: number;
    quarantinedFiles: number;
    blockedIPs: number;
    failedAuthAttempts: number;
    idorAttempts: number;
    incidentsResolved: number;
    openIncidents: number;
  };
  summary: string;
}
