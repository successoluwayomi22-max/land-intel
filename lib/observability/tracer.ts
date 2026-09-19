import crypto from "crypto";
import { TraceSpan } from "./types";

const activeSpans = new Map<string, TraceSpan[]>();

export class DistributedTracer {
  public generateTraceId(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  public generateSpanId(): string {
    return crypto.randomBytes(8).toString("hex");
  }

  public startSpan(params: {
    name: string;
    service?: string;
    traceId?: string;
    parentSpanId?: string;
    tags?: Record<string, string | number | boolean>;
  }): {
    traceId: string;
    spanId: string;
    end: (status?: "OK" | "ERROR", additionalTags?: Record<string, string | number | boolean>) => TraceSpan;
  } {
    const traceId = params.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const startTime = Date.now();

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId: params.parentSpanId,
      name: params.name,
      service: params.service || "diasporaland-api",
      startTime,
      status: "ACTIVE",
      tags: params.tags || {},
    };

    const list = activeSpans.get(traceId) || [];
    list.push(span);
    activeSpans.set(traceId, list);

    // Limit stored traces
    if (activeSpans.size > 1000) {
      const firstKey = activeSpans.keys().next().value;
      if (firstKey) activeSpans.delete(firstKey);
    }

    return {
      traceId,
      spanId,
      end: (status = "OK", additionalTags) => {
        span.endTime = Date.now();
        span.durationMs = span.endTime - span.startTime;
        span.status = status;
        if (additionalTags) {
          Object.assign(span.tags, additionalTags);
        }
        return span;
      },
    };
  }

  public getTrace(traceId: string): TraceSpan[] | null {
    return activeSpans.get(traceId) || null;
  }

  public getAllRecentTraces(): Array<{ traceId: string; rootSpan: string; durationMs: number; spansCount: number }> {
    const results: Array<{ traceId: string; rootSpan: string; durationMs: number; spansCount: number }> = [];
    for (const [traceId, spans] of activeSpans.entries()) {
      if (spans.length > 0) {
        const root = spans[0];
        const totalDuration = spans.reduce((max, s) => Math.max(max, s.durationMs || 0), 0);
        results.push({
          traceId,
          rootSpan: root.name,
          durationMs: totalDuration,
          spansCount: spans.length,
        });
      }
    }
    return results.slice(-50).reverse();
  }
}

export const tracer = new DistributedTracer();
