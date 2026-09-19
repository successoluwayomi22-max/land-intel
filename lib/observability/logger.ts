import fs from "fs/promises";
import path from "path";
import { LogLevel, LogCategory, StructuredLog } from "./types";

const LOGS_FILE = path.join(process.cwd(), "storage", "app_logs.json");

const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "refreshtoken",
  "accesstoken",
  "apikey",
  "cardnumber",
  "cvv",
  "pin",
  "privatekey",
  "webhooksecret",
];

export function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = redactSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

class StructuredLogger {
  private inMemoryLogs: StructuredLog[] = [];
  private saveTimeout: NodeJS.Timeout | null = null;
  private isLoaded = false;

  private async load() {
    if (this.isLoaded) return;
    try {
      const raw = await fs.readFile(LOGS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.inMemoryLogs = parsed;
      }
    } catch {
      this.inMemoryLogs = [];
    }
    this.isLoaded = true;
  }

  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        await fs.mkdir(path.dirname(LOGS_FILE), { recursive: true });
        await fs.writeFile(LOGS_FILE, JSON.stringify(this.inMemoryLogs.slice(0, 5000), null, 2), "utf-8");
      } catch (e) {
        console.error("[LOGGER_PERSIST_ERROR]", e);
      }
    }, 1000);
  }

  public async log(params: {
    level: LogLevel;
    category: LogCategory;
    service?: string;
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
  }): Promise<StructuredLog> {
    await this.load();
    const entry: StructuredLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level: params.level,
      category: params.category,
      service: params.service || "diasporaland-api",
      message: params.message,
      requestId: params.requestId,
      traceId: params.traceId,
      spanId: params.spanId,
      userId: params.userId,
      organizationId: params.organizationId,
      endpoint: params.endpoint,
      method: params.method,
      durationMs: params.durationMs,
      status: params.status,
      details: params.details ? redactSensitiveData(params.details) : undefined,
    };

    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > 5000) {
      this.inMemoryLogs = this.inMemoryLogs.slice(0, 5000);
    }
    this.scheduleSave();

    // Standard console output in structured JSON format
    const outStr = `[${entry.level}][${entry.category}] ${entry.message} (reqId=${entry.requestId || "none"})`;
    if (entry.level === "ERROR" || entry.level === "CRITICAL") {
      console.error(outStr, entry.details || "");
    } else if (entry.level === "WARNING") {
      console.warn(outStr);
    } else {
      console.log(outStr);
    }

    return entry;
  }

  public async getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    search?: string;
    requestId?: string;
    traceId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: StructuredLog[]; total: number }> {
    await this.load();
    let list = this.inMemoryLogs;

    if (filter?.level) {
      list = list.filter((l) => l.level === filter.level);
    }
    if (filter?.category) {
      list = list.filter((l) => l.category === filter.category);
    }
    if (filter?.requestId) {
      list = list.filter((l) => l.requestId === filter.requestId);
    }
    if (filter?.traceId) {
      list = list.filter((l) => l.traceId === filter.traceId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          (l.endpoint && l.endpoint.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;
    return { logs: list.slice(offset, offset + limit), total };
  }
}

export const logger = new StructuredLogger();
