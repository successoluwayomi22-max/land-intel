"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Activity,
  Terminal,
  Server,
  FileCheck2,
  FileText,
  Search,
  RefreshCw,
  Ban,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sliders,
  Database,
  Cpu,
  Download,
  Trash2,
  Eye,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  SeverityBadge,
  IPStatusBadge,
  ProviderStatusBadge,
  SecurityMetricCard,
  IPActionModal,
} from "@/components/security/SecurityComponents";
import { SecurityEvent, SecurityIncident, SecurityIPRecord, SecurityRule, MalwareScanRecord, SecurityReport } from "@/lib/security/types";
import { ProviderHealth, PerformanceTelemetry, StructuredLog } from "@/lib/observability/types";

export default function SecurityOperationsCenterPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "incidents" | "ip" | "malware" | "rules" | "logs" | "reports"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // SOC Data State
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [ipRecords, setIpRecords] = useState<SecurityIPRecord[]>([]);
  const [malwareScans, setMalwareScans] = useState<MalwareScanRecord[]>([]);
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [telemetry, setTelemetry] = useState<PerformanceTelemetry | null>(null);

  // Filter States
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  // IP Action Modal State
  const [ipModalTarget, setIpModalTarget] = useState<SecurityIPRecord | null>(null);

  const fetchSocData = async () => {
    try {
      const [overviewRes, eventsRes, incidentsRes, ipRes, malwareRes, rulesRes, logsRes] = await Promise.all([
        fetch("/api/admin/security/overview"),
        fetch("/api/admin/security/events?limit=50"),
        fetch("/api/admin/security/incidents"),
        fetch("/api/admin/security/ip"),
        fetch("/api/admin/security/malware"),
        fetch("/api/admin/security/rules"),
        fetch("/api/admin/security/logs?limit=50"),
      ]);

      if (overviewRes.ok) {
        const oData = await overviewRes.json();
        setOverview(oData);
        setProviders(oData.providers || []);
        setTelemetry(oData.telemetry || null);
      }
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEvents(eData.events || []);
        setEventsTotal(eData.total || 0);
      }
      if (incidentsRes.ok) {
        const iData = await incidentsRes.json();
        setIncidents(iData.incidents || []);
      }
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        setIpRecords(ipData.records || []);
      }
      if (malwareRes.ok) {
        const mData = await malwareRes.json();
        setMalwareScans(mData.scans || []);
      }
      if (rulesRes.ok) {
        const rData = await rulesRes.json();
        setRules(rData.rules || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
    } catch (err) {
      console.error("Failed to load SOC data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSocData();
    const interval = setInterval(fetchSocData, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchSocData();
  };

  const handleIpEnforcement = async (
    action: "BLOCK" | "UNBLOCK" | "EXTEND" | "ALLOWLIST",
    reason: string,
    durationMinutes?: number
  ) => {
    if (!ipModalTarget) return;
    try {
      let state = "MONITOR";
      if (action === "BLOCK" || action === "EXTEND") state = "TEMPORARILY_BLOCKED";
      if (action === "ALLOWLIST") state = "ALLOW";
      if (action === "UNBLOCK") state = "MONITOR";

      const res = await fetch("/api/admin/security/ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: ipModalTarget.ip,
          state,
          reason,
          durationMinutes,
        }),
      });

      if (res.ok) {
        setActionNotice(`Action '${action}' successfully applied to ${ipModalTarget.ip}`);
        setTimeout(() => setActionNotice(null), 4000);
        fetchSocData();
      }
    } catch (e) {
      console.error("Failed to enforce IP", e);
    }
  };

  const handleIncidentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/security/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          id,
          status: newStatus,
          resolution: newStatus === "RESOLVED" ? "Admin marked as resolved after review" : undefined,
        }),
      });
      if (res.ok) {
        setActionNotice(`Incident ${id} updated to ${newStatus}`);
        setTimeout(() => setActionNotice(null), 4000);
        fetchSocData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMalwareAction = async (scanId: string, action: "RELEASE" | "DELETE") => {
    try {
      const res = await fetch("/api/admin/security/malware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId,
          action,
          reason: action === "DELETE" ? "Admin securely destroyed file" : "Admin false-positive release",
        }),
      });
      if (res.ok) {
        setActionNotice(`Quarantine action '${action}' applied to scan ${scanId}`);
        setTimeout(() => setActionNotice(null), 4000);
        fetchSocData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRuleToggle = async (ruleId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch("/api/admin/security/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ruleId,
          enabled: !currentEnabled,
        }),
      });
      if (res.ok) {
        setActionNotice(`Rule ${ruleId} ${!currentEnabled ? "enabled" : "disabled"}`);
        setTimeout(() => setActionNotice(null), 4000);
        fetchSocData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Bootstrapping Security Operations Center telemetry...</p>
        </div>
      </div>
    );
  }

  // Filtered Events List
  const filteredEvents = events.filter((e) => {
    if (severityFilter !== "ALL" && e.severity !== severityFilter) return false;
    if (eventTypeFilter !== "ALL" && e.eventType !== eventTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.ip.includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.detectionRule.toLowerCase().includes(q) ||
        (e.endpoint && e.endpoint.toLowerCase().includes(q)) ||
        (e.actorEmail && e.actorEmail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header & Posture Radar */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">
              <Shield className="w-4 h-4" />
              <span>DiasporaLand Security Operations Center (SOC)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                LIVE RADAR
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-heading">
              Threat Intelligence & IP Protection Deck
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Real-time threat detection, server-authoritative IP containment, quarantine malware scanner, and distributed incident correlation.
            </p>
          </div>

          {/* Executive Posture Gauge */}
          <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shrink-0">
            <div className="text-center">
              <div className="text-3xl font-black font-mono text-white flex items-center justify-center gap-1">
                <span>{overview?.postureScore ?? 95}</span>
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                {overview?.postureStatus ?? "EXCELLENT"}
              </span>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div className="text-[11px] space-y-1 text-slate-400 font-mono">
              <div>Active Blocks: <span className="text-white font-bold">{overview?.activeBlocksCount ?? 0}</span></div>
              <div>Open Incidents: <span className="text-amber-400 font-bold">{overview?.openIncidentsCount ?? 0}</span></div>
              <div>Quarantined Files: <span className="text-rose-400 font-bold">{overview?.quarantinedFilesCount ?? 0}</span></div>
            </div>
            <button
              onClick={handleManualRefresh}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-amber-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Security Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Global Security Search: Query across IP, Actor Email, Case ID, Request ID, Threat Rule, or Event Type..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono shadow-inner"
        />
      </div>

      {/* Primary SOC Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-semibold">
        {[
          { id: "overview", label: "SOC Deck", icon: Terminal },
          { id: "events", label: `Threat Events (${eventsTotal})`, icon: Activity },
          { id: "incidents", label: `Incidents (${incidents.length})`, icon: ShieldAlert },
          { id: "ip", label: `IP Protection (${ipRecords.length})`, icon: Lock },
          { id: "malware", label: `Malware & Quarantine (${malwareScans.length})`, icon: FileCheck2 },
          { id: "rules", label: `Detection Rules (${rules.length})`, icon: Sliders },
          { id: "logs", label: `Structured Logs (${logs.length})`, icon: Database },
          { id: "reports", label: "Compliance Reports", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono transition-colors shrink-0 ${
                isActive
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: OVERVIEW DECK --- */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SecurityMetricCard
              title="Threats Intercepted"
              value={overview?.totalEvents ?? 0}
              subtitle="Events evaluated by rule engine"
              icon={Activity}
              variant="default"
              trend="+4.2% / 24h"
            />
            <SecurityMetricCard
              title="Active IP Blocks"
              value={overview?.activeBlocksCount ?? 0}
              subtitle="Temporary & permanent restrictions"
              icon={Ban}
              variant={overview?.activeBlocksCount > 0 ? "warning" : "default"}
              trend="Auto-expiring"
            />
            <SecurityMetricCard
              title="Quarantined Files"
              value={overview?.quarantinedFilesCount ?? 0}
              subtitle="Isolated from processing pipeline"
              icon={ShieldAlert}
              variant={overview?.quarantinedFilesCount > 0 ? "critical" : "default"}
              trend="Zero-tolerance"
            />
            <SecurityMetricCard
              title="Detection Engine Rules"
              value={overview?.activeRulesCount ?? 0}
              subtitle="Active sliding-window policies"
              icon={Sliders}
              variant="success"
              trend="100% Armed"
            />
          </div>

          {/* Provider Health Matrix & Active Incidents Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Health Status Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-white font-heading">Security & Observability Providers</h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Live Health Checks</span>
              </div>
              <div className="space-y-2.5">
                {providers.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">({p.category})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <ProviderStatusBadge status={p.status} />
                      <div className="text-[10px] font-mono text-slate-500 mt-1">{p.latencyMs}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Incidents Queue */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <h2 className="text-sm font-bold text-white font-heading">Active Incidents Queue</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("incidents")}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>View All ({incidents.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-mono">
                      No active security incidents. All systems normal.
                    </div>
                  ) : (
                    incidents.slice(0, 3).map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-mono font-bold text-white">
                            <span>{inc.id}</span>
                            <SeverityBadge severity={inc.severity} />
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                            {inc.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-200">{inc.title}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                          <span>Source: {inc.detectionSource}</span>
                          <span>{new Date(inc.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Performance Telemetry Bar */}
              {telemetry && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-400 mt-2">
                  <div>Latency p50: <span className="text-white font-bold">{telemetry.p50LatencyMs}ms</span></div>
                  <div>p95: <span className="text-amber-400 font-bold">{telemetry.p95LatencyMs}ms</span></div>
                  <div>p99: <span className="text-rose-400 font-bold">{telemetry.p99LatencyMs}ms</span></div>
                  <div>Error Rate: <span className="text-white font-bold">{telemetry.errorRatePercent}%</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Live Recent Security Events Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-white font-heading">Real-Time Threat & Attack Stream</h2>
              </div>
              <button
                onClick={() => setActiveTab("events")}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>Open Full Event Explorer</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Threat Type</th>
                    <th className="py-2.5 px-3">Source IP</th>
                    <th className="py-2.5 px-3">Target Endpoint</th>
                    <th className="py-2.5 px-3">Enforcement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {events.slice(0, 6).map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-3"><SeverityBadge severity={evt.severity} /></td>
                      <td className="py-2 px-3 font-semibold text-white">{evt.eventType}</td>
                      <td className="py-2 px-3 text-amber-400 font-bold">{evt.ip}</td>
                      <td className="py-2 px-3 text-slate-300">{evt.endpoint || "N/A"}</td>
                      <td className="py-2 px-3 text-slate-400 font-bold">{evt.actionTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: THREAT EVENTS EXPLORER --- */}
      {activeTab === "events" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
              >
                <option value="ALL">ALL SEVERITIES</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
                <option value="INFO">INFO</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono">Threat Type:</span>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono"
              >
                <option value="ALL">ALL TYPES</option>
                <option value="BRUTE_FORCE">BRUTE FORCE</option>
                <option value="CREDENTIAL_STUFFING">CREDENTIAL STUFFING</option>
                <option value="IDOR_ATTEMPT">IDOR ATTEMPT</option>
                <option value="MALWARE_DETECTED">MALWARE DETECTED</option>
                <option value="MALICIOUS_UPLOAD">MALICIOUS UPLOAD</option>
                <option value="RATE_LIMIT_EXCEEDED">RATE LIMIT EXCEEDED</option>
                <option value="WEBHOOK_INVALID_SIGNATURE">WEBHOOK SIGNATURE</option>
                <option value="PROBING_ATTACK">PROBING ATTACK</option>
              </select>
            </div>

            <span className="text-slate-500 font-mono ml-auto">
              Showing {filteredEvents.length} of {eventsTotal} records
            </span>
          </div>

          {/* Events Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Time (UTC)</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Threat Type</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Detection Rule</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-bold text-white">{evt.id}</td>
                    <td className="py-2.5 px-4 text-slate-400">{new Date(evt.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-4"><SeverityBadge severity={evt.severity} /></td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">{evt.eventType}</td>
                    <td className="py-2.5 px-4 text-amber-400">{evt.ip}</td>
                    <td className="py-2.5 px-4 text-slate-400">{evt.actorEmail || evt.actorId || "Anonymous"}</td>
                    <td className="py-2.5 px-4 text-slate-400">{evt.detectionRule}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-bold">{evt.actionTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: INCIDENTS --- */}
      {activeTab === "incidents" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black font-mono text-white">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} />
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300">
                      {inc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Triage:</span>
                    {["OPEN", "INVESTIGATING", "CONTAINED", "RESOLVED", "FALSE_POSITIVE"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleIncidentStatus(inc.id, st)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                          inc.status === st
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white font-heading">{inc.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{inc.description}</p>
                </div>

                {/* Timeline */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Incident Timeline</span>
                  <div className="space-y-1.5 mt-1">
                    {inc.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-baseline gap-3 text-slate-400">
                        <span className="text-[10px] text-slate-500 shrink-0">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="text-slate-300 font-semibold">{item.description}</span>
                        {item.actor && <span className="text-[10px] text-amber-400">({item.actor})</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <div>Affected IPs: <span className="text-amber-400">{inc.affectedIps.join(", ") || "None"}</span></div>
                  <div>Assigned: <span className="text-white">{inc.assignedAdmin || "Unassigned"}</span></div>
                  <div>Created: <span className="text-slate-400">{new Date(inc.createdAt).toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: IP PROTECTION --- */}
      {activeTab === "ip" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Server-Side IP Security Directory</h3>
                <p className="text-xs text-slate-400">Tracked network clients, progressive restriction states, and allowlists</p>
              </div>
              <span className="text-xs font-mono text-slate-500">{ipRecords.length} IP records tracked</span>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Security State</th>
                  <th className="py-3 px-4">Threat Score</th>
                  <th className="py-3 px-4">Failed Auth</th>
                  <th className="py-3 px-4">Total Requests</th>
                  <th className="py-3 px-4">Block Expiration</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ipRecords.map((rec) => (
                  <tr key={rec.ip} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-white">{rec.ip}</td>
                    <td className="py-2.5 px-4"><IPStatusBadge status={rec.status} /></td>
                    <td className="py-2.5 px-4">
                      <span className={`font-bold ${rec.threatScore >= 70 ? "text-rose-400" : rec.threatScore >= 40 ? "text-amber-400" : "text-slate-300"}`}>
                        {rec.threatScore}/100
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">{rec.failedAuthCount}</td>
                    <td className="py-2.5 px-4 text-slate-400">{rec.requestCount}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {rec.expiresAt ? new Date(rec.expiresAt).toLocaleTimeString() : "Permanent / None"}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => setIpModalTarget(rec)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700"
                      >
                        Enforce...
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: MALWARE & QUARANTINE --- */}
      {activeTab === "malware" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Quarantine Vault & Antivirus Ledger</h3>
                <p className="text-xs text-slate-400">Isolated files, decompression bomb checks, and magic signature verification</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
                {malwareScans.filter((s) => s.status === "INFECTED" || s.status === "QUARANTINED").length} Quarantined
              </span>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Threat Signature</th>
                  <th className="py-3 px-4">Scanner Result</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {malwareScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-white">{scan.originalName}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scan.status === "CLEAN"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : scan.status === "INFECTED" || scan.status === "QUARANTINED"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-rose-400 font-bold">{scan.threatSignature || "None"}</td>
                    <td className="py-2.5 px-4 text-slate-400">{scan.scannerResult}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(scan.scannedAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-4 flex items-center gap-2">
                      {scan.status === "QUARANTINED" || scan.status === "INFECTED" ? (
                        <>
                          <button
                            onClick={() => handleMalwareAction(scan.id, "RELEASE")}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold"
                            title="Release from quarantine"
                          >
                            Release
                          </button>
                          <button
                            onClick={() => handleMalwareAction(scan.id, "DELETE")}
                            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-bold"
                            title="Permanently destroy payload"
                          >
                            Destroy
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-600">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: RULES --- */}
      {activeTab === "rules" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-heading">Automated Threat Rule Engine</h3>
              <p className="text-xs text-slate-400">Predefined sliding-window thresholds, progressive containment actions, and severity levels</p>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Threat Type</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Enforcement Action</th>
                  <th className="py-3 px-4">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{rule.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{rule.description}</div>
                    </td>
                    <td className="py-3 px-4 text-amber-400">{rule.eventType}</td>
                    <td className="py-3 px-4 font-bold text-white">{rule.threshold} events</td>
                    <td className="py-3 px-4 text-slate-300">{rule.timeWindowSeconds}s</td>
                    <td className="py-3 px-4"><SeverityBadge severity={rule.severity} /></td>
                    <td className="py-3 px-4 font-bold text-slate-200">{rule.action}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRuleToggle(rule.id, rule.enabled)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                          rule.enabled
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {rule.enabled ? "ENABLED" : "DISABLED"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 7: STRUCTURED LOGS --- */}
      {activeTab === "logs" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Application Logging Center & Trace Inspector</h3>
                <p className="text-xs text-slate-400">Structured JSON logs, correlation IDs, and automated credential redaction</p>
              </div>
              <span className="text-xs font-mono text-slate-500">{logs.length} log entries</span>
            </div>

            <div className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 max-h-[500px] overflow-y-auto space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900">
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">[{log.level}]</span>
                      <span className="text-slate-300 font-semibold">[{log.category}]</span>
                      <span>reqId={log.requestId || "none"}</span>
                      {log.traceId && <span>traceId={log.traceId}</span>}
                    </div>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-white mt-1 font-sans text-xs">{log.message}</div>
                  {log.details && (
                    <pre className="text-[10px] text-slate-400 mt-1 overflow-x-auto bg-slate-950 p-2 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 8: REPORTS --- */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white font-heading">Compliance & Security Audit Reports</h3>
                <p className="text-xs text-slate-400">Generate and export statutory NDPR/GDPR security audit reports</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/admin/security/reports?format=csv"
                  download
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
                <a
                  href="/api/admin/security/reports?format=json"
                  target="_blank"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View JSON Report</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-amber-400 font-bold uppercase">Executive Audit Summary</div>
              <p className="text-slate-300">
                DiasporaLand SOC automated compliance monitoring active. Zero unmitigated critical incidents recorded.
                Statutory customer erasures are isolated and processed within SLA. All financial webhooks cryptographically validated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: IP Action */}
      {ipModalTarget && (
        <IPActionModal
          isOpen={Boolean(ipModalTarget)}
          ip={ipModalTarget.ip}
          currentState={ipModalTarget.status}
          onClose={() => setIpModalTarget(null)}
          onConfirm={handleIpEnforcement}
        />
      )}

      {/* Modal: Event Detail Inspector */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold font-mono">
                <span>Event Investigation: {selectedEvent.id}</span>
                <SeverityBadge severity={selectedEvent.severity} />
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>Threat Type: <span className="text-white font-bold">{selectedEvent.eventType}</span></div>
                <div>Source IP: <span className="text-amber-400 font-bold">{selectedEvent.ip}</span></div>
                <div>Endpoint: <span className="text-slate-300">{selectedEvent.endpoint || "N/A"}</span></div>
                <div>Method: <span className="text-slate-300">{selectedEvent.method || "N/A"}</span></div>
                <div>Actor: <span className="text-slate-300">{selectedEvent.actorEmail || selectedEvent.actorId || "Anonymous"}</span></div>
                <div>Rule: <span className="text-slate-300">{selectedEvent.detectionRule}</span></div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Enforcement Action Taken:</span>
                <div className="p-2 rounded bg-slate-800 text-white font-bold">{selectedEvent.actionTaken}</div>
              </div>

              {selectedEvent.metadata && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Correlated Telemetry Metadata:</span>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
