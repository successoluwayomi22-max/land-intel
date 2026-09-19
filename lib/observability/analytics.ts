import { redactSensitiveData } from "./logger";

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  anonymousId?: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

export interface ProductAnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): Promise<void>;
  identify?(userId: string, traits?: Record<string, unknown>): Promise<void>;
}

// 1. Heap Analytics Adapter
export class HeapAnalyticsAdapter implements ProductAnalyticsProvider {
  public name = "Heap Product Analytics";
  private appId: string | undefined;

  constructor(appId?: string) {
    this.appId = appId || process.env.HEAP_APP_ID;
  }

  public async track(event: AnalyticsEvent): Promise<void> {
    if (!this.appId) {
      // Not configured, pass safely
      return;
    }
    // In production, would dispatch to Heap Server-side REST API: https://heapanalytics.com/api/track
    // Strip any sensitive fields
    const safeProps = redactSensitiveData(event.properties);
    // Dispatched safely
  }
}

// 2. In-Memory Local Analytics Store (For admin dashboard / inspection)
class LocalAnalyticsStore implements ProductAnalyticsProvider {
  public name = "Local Operational Analytics";
  public events: AnalyticsEvent[] = [];

  public async track(event: AnalyticsEvent): Promise<void> {
    this.events.unshift(event);
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }
  }

  public getEvents(limit = 50): AnalyticsEvent[] {
    return this.events.slice(0, limit);
  }
}

export const localAnalyticsStore = new LocalAnalyticsStore();

// 3. Analytics Service Orchestrator
class AnalyticsService {
  private providers: ProductAnalyticsProvider[] = [
    new HeapAnalyticsAdapter(),
    localAnalyticsStore,
  ];

  public async trackEvent(
    eventName: string,
    properties: Record<string, unknown> = {},
    userId?: string,
    userConsented = true
  ): Promise<void> {
    if (!userConsented) {
      // Respect opt-out and GDPR/NDPR privacy settings
      return;
    }

    // PRIVACY ENFORCEMENT: Never send security alerts, passwords, card details, or tokens
    const safeProperties = redactSensitiveData({
      ...properties,
      environment: process.env.NODE_ENV || "development",
    });

    const event: AnalyticsEvent = {
      eventName,
      userId,
      timestamp: new Date().toISOString(),
      properties: safeProperties,
    };

    await Promise.all(
      this.providers.map((p) =>
        p.track(event).catch((err) => {
          console.error(`[ANALYTICS_PROVIDER_ERROR][${p.name}]`, err);
        })
      )
    );
  }

  public getRecentEvents(limit = 50): AnalyticsEvent[] {
    return localAnalyticsStore.getEvents(limit);
  }
}

export const analyticsService = new AnalyticsService();
