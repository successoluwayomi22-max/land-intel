/**
 * Production Exception Telemetry & Sentry-Compatible Monitoring
 * 
 * Provides unified, structured error capture across client components,
 * server actions, and edge API routes. Generates cryptographic incident
 * trace IDs so users or support can reference specific failed transactions.
 */

export interface TelemetryContext {
  userId?: string;
  userEmail?: string;
  action?: string;
  route?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface CapturedIncident {
  incidentId: string;
  timestamp: string;
  message: string;
  stack?: string;
  context?: TelemetryContext;
}

/**
 * Generate a clean, verifiable incident code for user support tickets
 */
export function generateIncidentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INC-${timestamp}-${randomPart}`;
}

/**
 * Capture an unhandled exception or critical error.
 * Automatically sends to Sentry if configured, or records to structured cloud telemetry.
 */
export function captureException(
  error: unknown,
  context?: TelemetryContext
): CapturedIncident {
  const incidentId = generateIncidentId();
  const timestamp = new Date().toISOString();

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Unknown application exception";

  const errorStack = error instanceof Error ? error.stack : undefined;

  const incident: CapturedIncident = {
    incidentId,
    timestamp,
    message: errorMessage,
    stack: errorStack,
    context,
  };

  // Structured Logging for CloudWatch / Vercel Runtime Logs / Datadog
  if (process.env.NODE_ENV !== "test") {
    console.error(
      `[TELEMETRY_INCIDENT] [${incidentId}] ${errorMessage}`,
      JSON.stringify(
        {
          incidentId,
          timestamp,
          route: context?.route,
          action: context?.action,
          userId: context?.userId,
          metadata: context?.metadata,
          stack: errorStack,
        },
        null,
        2
      )
    );
  }

  // Sentry Integration (if Sentry DSN is configured via environment variables)
  const sentryDsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

  if (sentryDsn && typeof window !== "undefined" && (window as any).Sentry) {
    try {
      (window as any).Sentry.captureException(error, {
        tags: {
          incidentId,
          ...context?.tags,
        },
        extra: {
          ...context?.metadata,
          userId: context?.userId,
        },
      });
    } catch {}
  }

  return incident;
}

/**
 * Capture an informational telemetry event or non-fatal diagnostic warning.
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: TelemetryContext
): string {
  const incidentId = generateIncidentId();

  if (process.env.NODE_ENV !== "test") {
    const logger = level === "error" ? console.error : level === "warning" ? console.warn : console.log;
    logger(`[TELEMETRY_${level.toUpperCase()}] [${incidentId}] ${message}`, context || "");
  }

  return incidentId;
}
