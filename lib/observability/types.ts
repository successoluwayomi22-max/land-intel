export type LogLevel = "DEBUG" | "INFO" | "NOTICE" | "WARNING" | "ERROR" | "CRITICAL";

export type LogCategory =
  | "APPLICATION"
  | "API"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "DATABASE"
  | "SECURITY"
  | "BILLING"
  | "PAYMENT"
  | "WEBHOOK"
  | "AI"
  | "OCR"
  | "DOCUMENT_PROCESSING"
  | "QUEUE"
  | "WORKER"
  | "STORAGE"
  | "SYSTEM";

export interface StructuredLog {
  id: string;
  timestamp: string; // ISO-8601
  level: LogLevel;
  category: LogCategory;
  service: string;
  message: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  organizationId?: string;
  endpoint?: string;
  method?: string;
  durationMs?: number;
  status?: number;
  details?: Record<string, unknown>;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "OK" | "ERROR" | "ACTIVE";
  tags: Record<string, string | number | boolean>;
}

export type ProviderStatus = "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "NOT_CONFIGURED";

export interface ProviderHealth {
  name: string;
  category: "MALWARE_SCANNER" | "IP_REPUTATION" | "AI_ENGINE" | "PAYMENT_GATEWAY" | "STORAGE_VAULT" | "DATABASE" | "TELEMETRY";
  status: ProviderStatus;
  latencyMs: number;
  lastChecked: string;
  message?: string;
}

export interface PerformanceTelemetry {
  timestamp: string;
  p50LatencyMs: number;
  p75LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  errorRatePercent: number;
  memoryHeapUsedMb: number;
  memoryRssMb: number;
  activeRequests: number;
  queueDepth: number;
}
