"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  CreditCard,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Unlock,
  Key,
  Database,
  Cpu,
  FileText,
  FileCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  Eye,
  UserCheck,
  MessageSquare,
  PhoneCall,
  Mail,
  Send,
  HardDrive,
  Globe,
  Coins,
  Server,
  Copy,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { APP_CONFIG } from "@/lib/config";
import { usePlatformContact } from "@/components/providers/PlatformContactProvider";

type AdminTab = "overview" | "users" | "cases" | "payments" | "audit" | "system" | "support";

export default function AdminProDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<any | null>(null);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selectedCaseModal, setSelectedCaseModal] = useState<any | null>(null);
  const [selectedAuditModal, setSelectedAuditModal] = useState<any | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual payment verify state
  const [manualRef, setManualRef] = useState("");
  const [manualRefResult, setManualRefResult] = useState<any | null>(null);

  // Dynamic Platform Contact Management State
  const { contact: dynamicContact, updateContact, isSaving: contactSaving } = usePlatformContact();
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    email: "",
    primaryWhatsapp: "",
    secondaryWhatsapp: "",
    facebook: "",
    facebookUrl: "",
    instagram: "",
    instagramUrl: "",
    supportAvailability: "",
    supportMessage: "",
  });
  const [contactModalError, setContactModalError] = useState<string | null>(null);
  const [contactModalSuccess, setContactModalSuccess] = useState<string | null>(null);

  const handleOpenContactModal = () => {
    setContactFormData({
      email: dynamicContact.email || "",
      primaryWhatsapp: dynamicContact.primaryWhatsapp || "",
      secondaryWhatsapp: dynamicContact.secondaryWhatsapp || "",
      facebook: dynamicContact.facebook || "",
      facebookUrl: dynamicContact.facebookUrl || "",
      instagram: dynamicContact.instagram || "",
      instagramUrl: dynamicContact.instagramUrl || "",
      supportAvailability: dynamicContact.supportAvailability || "",
      supportMessage: dynamicContact.supportMessage || "",
    });
    setContactModalError(null);
    setContactModalSuccess(null);
    setIsEditContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactModalError(null);
    setContactModalSuccess(null);
    const res = await updateContact(contactFormData);
    if (res.success) {
      setContactModalSuccess("Contact channels successfully updated across the entire platform!");
      setTimeout(() => {
        setIsEditContactModalOpen(false);
        setContactModalSuccess(null);
      }, 1200);
    } else {
      setContactModalError(res.error || "Failed to update contact settings");
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/metrics");
      const d = await res.json();
      if (d.success) {
        setData(d);
      }
      // Fetch support tickets
      try {
        const supRes = await fetch("/api/v1/support/requests");
        const supData = await supRes.json();
        if (supData.data) {
          setSupportTickets(supData.data);
        }
      } catch (e) {
        console.error("Could not fetch support tickets:", e);
      }
    } catch (err) {
      console.error("Failed to load admin telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Change user role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`User role successfully changed to ${newRole}`);
        fetchData();
      } else {
        showToast(`Failed: ${result.error || "Could not change role"}`);
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Force unlock case report
  const handleForceUnlock = async (caseId: string, title: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, action: "FORCE_UNLOCK" }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(`Due-Diligence Report force-unlocked for "${title}"!`);
        fetchData();
      } else {
        showToast(`Unlock failed: ${result.error || "Unknown error"}`);
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Purge Account under NDPR/GDPR Article 17
  const handlePurgeAccount = async (targetUserId: string, email: string) => {
    if (!confirm(`CRITICAL NDPR / GDPR ACTION:\nAre you sure you want to permanently PURGE all account records for ${email}?\n\nThis will permanently erase all properties, survey plan documents, cadastral risk assessments, and user PII. This action cannot be undone.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: "APPROVE_AND_PURGE" }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showToast(`Account for ${email} permanently purged in compliance with NDPR.`);
        fetchData();
      } else {
        showToast(`Failed to purge account: ${d.error || "Unknown error"}`);
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeletion = async (targetUserId: string, email: string) => {
    const reason = prompt(`Enter compliance/legal hold reason for declining deletion for ${email}:`, "Active regulatory or financial verification in progress");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: "REJECT", reason }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showToast(`Deletion request for ${email} rejected.`);
        fetchData();
      } else {
        showToast(`Failed: ${d.error || "Unknown error"}`);
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Safe defaults
  const metrics = data?.metrics || {
    totalUsers: 0,
    totalCases: 0,
    totalDocuments: 0,
    totalReports: 0,
    totalPaidReports: 0,
    totalRevenueNgn: 0,
    conversionRate: "0",
    systemStatus: "OPERATIONAL",
    uptimeSeconds: 0,
  };

  const riskBreakdown = data?.riskBreakdown || {
    CRITICAL: 0,
    HIGH: 0,
    ELEVATED: 0,
    MODERATE: 0,
    LOW: 0,
  };

  const allUsers = data?.allUsers || [];
  const recentCases = data?.recentCases || [];
  const payments = data?.payments || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  // Filtered cases
  const filteredCases = recentCases.filter((c: any) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk =
      riskFilter === "ALL" || (c.riskScore && c.riskScore.level === riskFilter);
    return matchesSearch && matchesRisk;
  });

  // Filtered users
  const filteredUsers = allUsers.filter((u: any) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 rounded-xl border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-amber-400/80">Loading LandIntel Operations Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-amber-400/60 hover:text-amber-400">
            ×
          </button>
        </div>
      )}

      {/* NDPR / GDPR Account Deletion Alert Banner */}
      {data?.pendingDeletionRequests && data.pendingDeletionRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-rose-900/50 to-slate-900 border border-rose-500/50 shadow-xl shadow-rose-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                  NDPR / GDPR Statutory Alert
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-mono font-bold">
                  {data.pendingDeletionRequests.length} Pending Account Erasure{data.pendingDeletionRequests.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Customer(s) have formally submitted an account & data erasure request. Under statutory privacy standards (GDPR / NDPR), review their records before the statutory grace period expires.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("users")}
            className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>Review Deletion Queue ({data.pendingDeletionRequests.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <span>Platform Command Center</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
              LIVE TELEMETRY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management for cadastral AI analysis, user entitlements, property risk scores, and platform revenues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/80 pb-3">
        {[
          { id: "overview", label: "Overview & Telemetry", icon: Activity, badge: null },
          { id: "cases", label: `Cases Monitor (${recentCases.length})`, icon: Building2, badge: null },
          {
            id: "users",
            label: `User Management (${allUsers.length})`,
            icon: Users,
            badge: data?.pendingDeletionRequests?.length > 0 ? `${data.pendingDeletionRequests.length} DEL` : null,
          },
          { id: "payments", label: `Paystack Transactions (${payments.length})`, icon: CreditCard, badge: null },
          { id: "support", label: `Support Desk (${supportTickets.length})`, icon: MessageSquare, badge: null },
          { id: "audit", label: `Audit Trail (${recentAuditLogs.length})`, icon: ShieldCheck, badge: null },
          { id: "system", label: "System Architecture", icon: Cpu, badge: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Gross Settlements</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  ₦{metrics.totalRevenueNgn.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>100% Paystack verified</span>
                </div>
              </div>
            </div>

            {/* Total Cases */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] border border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Investigated Cases</span>
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  {metrics.totalCases}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  {metrics.totalDocuments} total title documents parsed
                </span>
              </div>
            </div>

            {/* Paid Reports & Conversion */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] border border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Report Conversion</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  {metrics.conversionRate}%
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono block mt-1">
                  {metrics.totalPaidReports} of {metrics.totalReports} unlocked
                </span>
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] border border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Registered Accounts</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                  {metrics.totalUsers}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  Diaspora buyers & remote investors
                </span>
              </div>
            </div>
          </div>

          {/* Runtime Telemetry & Financial Compliance Banner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* V8 Heap Memory Tile */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>V8 Runtime Heap Memory</span>
                </span>
                <Link
                  href="/admin/telemetry"
                  className="text-[10px] font-mono text-amber-400/80 hover:text-amber-400 flex items-center gap-0.5"
                >
                  <span>Profiler</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">
                    Used: <strong className="text-white">{data?.heap?.heapUsedMb || 142} MB</strong> /{" "}
                    <span className="text-slate-400">{data?.heap?.heapTotalMb || 256} MB</span>
                  </span>
                  <span
                    className={`font-bold ${
                      (data?.heap?.utilizationPercent || 55) > 85
                        ? "text-rose-400"
                        : (data?.heap?.utilizationPercent || 55) > 70
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {data?.heap?.utilizationPercent || 55}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, data?.heap?.utilizationPercent || 55))}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      (data?.heap?.utilizationPercent || 55) > 85
                        ? "bg-rose-500"
                        : (data?.heap?.utilizationPercent || 55) > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                <span>RSS: {data?.heap?.rssMb || 215} MB</span>
                <span className="text-emerald-400">Node {process.version}</span>
              </div>
            </div>

            {/* Statutory 7.5% VAT Revenue Tile */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Statutory 7.5% VAT & Net</span>
                </span>
                <Link
                  href="/admin/revenue"
                  className="text-[10px] font-mono text-emerald-400/80 hover:text-emerald-400 flex items-center gap-0.5"
                >
                  <span>Ledger</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">7.5% VAT (FIRS)</span>
                  <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                    ₦{(metrics.vatCollectedNgn || Math.round(metrics.totalRevenueNgn * (7.5 / 107.5))).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">NET PLATFORM</span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                    ₦{(metrics.netRevenueNgn || (metrics.totalRevenueNgn - Math.round(metrics.totalRevenueNgn * (7.5 / 107.5)))).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                <span>AOV: ₦{(metrics.avgTransactionNgn || 35000).toLocaleString()}</span>
                <span className="text-blue-400">Paystack Live Webhook</span>
              </div>
            </div>

            {/* Storage Vault & AI Quota Tile */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>Vault Storage & AI Quotas</span>
                </span>
                <Link
                  href="/admin/usage"
                  className="text-[10px] font-mono text-blue-400/80 hover:text-blue-400 flex items-center gap-0.5"
                >
                  <span>Usage</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">STORAGE USED</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {metrics.totalStorageMb || 1} MB / 10 GB
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">AI INQUIRIES</span>
                  <span className="text-sm font-bold text-blue-300 mt-0.5 block">
                    {metrics.totalAiInquiries || 0} Runs
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                <span>{metrics.totalDocuments} Title Documents</span>
                <span className="text-emerald-400">Gemini 1.5 Vision OCR</span>
              </div>
            </div>
          </div>

          {/* Executive Direct Modules Launchpad */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Executive Command Deck Modules</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Direct Subsystem Access</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                href="/admin/analytics"
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-amber-400 transition-colors">Analytics</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Cadastral Radar</span>
              </Link>

              <Link
                href="/admin/telemetry"
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-400 transition-colors">Heap & Telemetry</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">V8 RAM & Process</span>
              </Link>

              <Link
                href="/admin/reports"
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-blue-400 transition-colors">Certified Reports</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">15-Section Archive</span>
              </Link>

              <Link
                href="/admin/revenue"
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">Revenue Ledger</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">FIRS 7.5% VAT</span>
              </Link>

              <Link
                href="/admin/usage"
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-purple-400 transition-colors">Resource Usage</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Storage & AI Quotas</span>
              </Link>

              <Link
                href="/admin/settings"
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-500/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Sliders className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white block group-hover:text-white transition-colors">Platform Settings</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Global Parameters</span>
              </Link>
            </div>
          </div>

          {/* Cadastral Risk Distribution Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cadastral Risk Breakdown (All Property Cases)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Distribution of evaluated properties by AI risk indicator rating.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Critical: {riskBreakdown.CRITICAL}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  High: {riskBreakdown.HIGH}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Low: {riskBreakdown.LOW}
                </span>
              </div>
            </div>

            {/* Progress Segment Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.max(5, (riskBreakdown.CRITICAL / (metrics.totalCases || 1)) * 100)}%` }}
                className="bg-rose-600 h-full"
                title={`Critical: ${riskBreakdown.CRITICAL}`}
              />
              <div
                style={{ width: `${Math.max(5, (riskBreakdown.HIGH / (metrics.totalCases || 1)) * 100)}%` }}
                className="bg-rose-500 h-full"
                title={`High: ${riskBreakdown.HIGH}`}
              />
              <div
                style={{ width: `${Math.max(5, (riskBreakdown.ELEVATED / (metrics.totalCases || 1)) * 100)}%` }}
                className="bg-amber-500 h-full"
                title={`Elevated: ${riskBreakdown.ELEVATED}`}
              />
              <div
                style={{ width: `${Math.max(5, (riskBreakdown.MODERATE / (metrics.totalCases || 1)) * 100)}%` }}
                className="bg-blue-500 h-full"
                title={`Moderate: ${riskBreakdown.MODERATE}`}
              />
              <div
                style={{ width: `${Math.max(5, (riskBreakdown.LOW / (metrics.totalCases || 1)) * 100)}%` }}
                className="bg-emerald-500 h-full"
                title={`Low: ${riskBreakdown.LOW}`}
              />
            </div>
          </div>

          {/* Quick Grids: Recent Cases & Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Cases */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Recent Property Due-Diligence Cases</span>
                </h3>
                <button
                  onClick={() => setActiveTab("cases")}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {recentCases.slice(0, 5).map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseModal(c)}
                    className="p-3.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 text-xs transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <strong className="text-white block font-semibold hover:text-amber-400 transition-colors">
                        {c.title}
                      </strong>
                      <span className="text-[11px] text-slate-400 block">
                        {c.state} • {c.documents?.length || 0} documents • Buyer: {c.user?.name || c.user?.email}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      {c.riskScore ? (
                        <RiskBadge level={c.riskScore.level} />
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Unscored
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500 block">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Live Security & Audit Stream</span>
                </h3>
                <button
                  onClick={() => setActiveTab("audit")}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {recentAuditLogs.slice(0, 6).map((log: any) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedAuditModal(log)}
                    className="p-3 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-slate-800/60 hover:border-slate-700 text-[11px] flex justify-between items-center transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-amber-400 block">{log.action}</span>
                      <span className="text-slate-400">
                        {log.user ? `${log.user.name} (${log.user.email})` : "System / Unauthenticated"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTY CASES MONITOR */}
      {activeTab === "cases" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases by title, state, or user email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Risk Filter:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="ELEVATED">Elevated</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Property Title</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Owner / Buyer</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Paid Report</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCases.map((c: any) => {
                    const isUnlocked = c.reports?.some((r: any) => r.isPaidUnlocked);
                    return (
                      <tr key={c.id} className="hover:bg-slate-950/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <button
                            onClick={() => setSelectedCaseModal(c)}
                            className="hover:text-amber-400 text-left transition-colors cursor-pointer"
                          >
                            {c.title}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {c.state}, {c.lga}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div>{c.user?.name || "Anonymous"}</div>
                          <div className="text-[10px] text-slate-500">{c.user?.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          {c.riskScore ? (
                            <RiskBadge level={c.riskScore.level} />
                          ) : (
                            <span className="text-[10px] text-slate-500">Uncalculated</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {c.riskScore ? `${c.riskScore.score}/100` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4">
                          {isUnlocked ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                              UNLOCKED
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              LOCKED (FREE)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {!isUnlocked && (
                            <button
                              onClick={() => handleForceUnlock(c.id, c.title)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                              title="Override and grant full report entitlement"
                            >
                              Force Unlock
                            </button>
                          )}
                          <Link
                            href={`/properties/${c.id}`}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-all inline-block"
                          >
                            Hub
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* NDPR / GDPR Account Deletion & Erasure Queue */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                    <span>NDPR / GDPR Customer Account Deletion & Erasure Queue</span>
                    {data?.pendingDeletionRequests?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold animate-pulse">
                        {data.pendingDeletionRequests.length} ACTIVE
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Statutory right to erasure under NDPR 2019 / GDPR Art. 17. Requests have a 14-day cooling-off period before permanent PII purge.
                  </p>
                </div>
              </div>
            </div>

            {data?.pendingDeletionRequests && data.pendingDeletionRequests.length > 0 ? (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Reason & Feedback</th>
                      <th className="py-2.5 px-3">Requested Date</th>
                      <th className="py-2.5 px-3">Statutory Countdown</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Compliance Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {data.pendingDeletionRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-950/80 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-white block font-semibold">{req.userName}</strong>
                          <span className="text-[11px] text-slate-400 font-mono block">{req.userEmail}</span>
                          <span className="text-[10px] text-amber-400/80 font-mono">Role: {req.userRole}</span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <span className="font-semibold text-slate-200 block text-[11px]">
                            {req.reason}
                          </span>
                          {req.feedback && (
                            <span className="text-[10px] text-slate-400 italic block mt-0.5">
                              "{req.feedback}"
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(req.requestedAt).toLocaleDateString()}
                          <span className="block text-[10px] text-slate-500">
                            {new Date(req.requestedAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {req.isOverdue ? (
                            <span className="text-rose-400 font-bold text-[11px] block">
                              0 days (Overdue)
                            </span>
                          ) : (
                            <span className="text-amber-300 font-bold text-[11px] block">
                              {req.daysRemaining} days left
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 block">
                            Purge: {new Date(req.scheduledPurgeDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {req.isOverdue ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">
                              READY FOR PURGE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                              GRACE PERIOD ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <a
                            href={`mailto:${req.userEmail}?subject=LandIntel Account Deletion Inquiry`}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors inline-block"
                          >
                            Contact
                          </a>
                          <button
                            onClick={() => handleRejectDeletion(req.userId, req.userEmail)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Decline Hold
                          </button>
                          <button
                            onClick={() => handlePurgeAccount(req.userId, req.userEmail)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            Approve & Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-center bg-slate-950/60 rounded-lg border border-dashed border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                <span>Zero pending deletion requests. All user accounts comply with NDPR & GDPR standards.</span>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, or role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Accounts: {allUsers.length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role / Plan</th>
                    <th className="py-3 px-4">Verified</th>
                    <th className="py-3 px-4">Cases Created</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Modify Access Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="text-white block font-semibold">{u.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            u.role === "ADMIN"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : u.role === "PAID"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.isVerified ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {u._count?.propertyCases || 0} cases
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleRoleChange(u.id, "FREE")}
                          disabled={actionLoading || u.role === "FREE"}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                            u.role === "FREE"
                              ? "bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          }`}
                        >
                          Set Free
                        </button>
                        <button
                          onClick={() => handleRoleChange(u.id, "PAID")}
                          disabled={actionLoading || u.role === "PAID"}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                            u.role === "PAID"
                              ? "bg-purple-900/40 text-purple-400 opacity-40 cursor-not-allowed"
                              : "bg-purple-900/60 hover:bg-purple-900 text-purple-200 cursor-pointer"
                          }`}
                        >
                          Grant Paid
                        </button>
                        <button
                          onClick={() => handleRoleChange(u.id, "ADMIN")}
                          disabled={actionLoading || u.role === "ADMIN"}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                            u.role === "ADMIN"
                              ? "bg-amber-900/40 text-amber-400 opacity-40 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                          }`}
                        >
                          Promote Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & SETTLEMENTS */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Settled</span>
              <span className="text-2xl font-black font-heading text-white block mt-1">
                ₦{metrics.totalRevenueNgn.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-1 font-mono">
                Verified via Paystack Secret HMAC
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Successful Charges</span>
              <span className="text-2xl font-black font-heading text-white block mt-1">
                {payments.filter((p: any) => p.status === "SUCCESSFUL").length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Average ticket: $30 USD eq.
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Gateway Provider</span>
              <span className="text-2xl font-black font-heading text-amber-400 block mt-1">
                PAYSTACK
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Supports Cards, Bank USSD, Transfer
              </span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Settlement Ledger & Transactions
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Paystack Reference</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-400">
                        {p.reference}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        <div>{p.user?.name || "N/A"}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        ₦{p.amount.toLocaleString()} {p.currency}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                        {p.provider}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Immutable System Audit Log Stream</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Events Logged: {recentAuditLogs.length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-800/80">
              {recentAuditLogs.map((log: any) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedAuditModal(log)}
                  className="p-4 hover:bg-slate-950 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold">
                        {log.action}
                      </span>
                      {log.resourceType && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Target: {log.resourceType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">
                      Operator: <span className="font-semibold text-white">{log.user?.name || log.user?.email || "System"}</span>
                    </p>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-500 space-y-0.5">
                    <div>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}</div>
                    <span className="text-[10px] text-slate-600 block">Click to inspect payload</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM ARCHITECTURE & HEALTH */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {/* V8 Runtime Heap Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>V8 Node.js Runtime Heap & Memory Profiling</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Process memory limits, heap allocation, and garbage collection metrics.
                </p>
              </div>
              <Link
                href="/admin/telemetry"
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>Deep Profiler</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">
                  Heap Used: <strong className="text-white">{data?.heap?.heapUsedMb || 142} MB</strong> / Allocated:{" "}
                  <span className="text-slate-400">{data?.heap?.heapTotalMb || 256} MB</span>
                </span>
                <span className="text-emerald-400 font-bold">{data?.heap?.utilizationPercent || 55}% Utilization</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
                <div
                  style={{ width: `${Math.min(100, Math.max(5, data?.heap?.utilizationPercent || 55))}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">HEAP USED</span>
                <span className="text-base font-bold text-white mt-0.5 block">{data?.heap?.heapUsedMb || 142} MB</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">HEAP ALLOCATED</span>
                <span className="text-base font-bold text-amber-300 mt-0.5 block">{data?.heap?.heapTotalMb || 256} MB</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">RSS RESIDENT SET</span>
                <span className="text-base font-bold text-blue-400 mt-0.5 block">{data?.heap?.rssMb || 215} MB</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">EXTERNAL BUFFERS</span>
                <span className="text-base font-bold text-purple-400 mt-0.5 block">{data?.heap?.externalMb || 34} MB</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Engine Telemetry */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Runtime Engine Telemetry</span>
              </h3>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Next.js Engine:</span>
                  <span className="text-emerald-400 font-bold">14.2.23 (App Router + SWC WASM)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Node.js Version:</span>
                  <span className="text-emerald-400 font-bold">{data?.telemetry?.nodeVersion || process.version}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Database Layer:</span>
                  <span className="text-emerald-400 font-bold">Prisma ORM (SQLite zero-config)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">AI Intelligence Pipeline:</span>
                  <span className="text-amber-300 font-bold">Cadastral Heuristic v2.4 + Gemini OCR</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">PDF Generation Engine:</span>
                  <span className="text-emerald-400 font-bold">pdf-lib (Server-Side 15-Section)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Payment Gateway:</span>
                  <span className="text-emerald-400 font-bold">Paystack (HMAC-SHA512 Signed)</span>
                </div>
              </div>
            </div>

            {/* Platform Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Platform Operational Controls</span>
                </h3>
                <Link
                  href="/admin/settings"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>All Settings</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Statutory FIRS VAT Rate</span>
                    <span className="font-mono text-amber-400">7.5% (Enforced by Law)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Statutory VAT compliance automatically calculated on transactions.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Due-Diligence Report Unlock</span>
                    <span className="font-mono text-amber-400">$30 USD eq.</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Standard unlocking fee for 15-section publication-grade PDF reports.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Security Redaction Policy</span>
                    <span className="font-mono text-emerald-400">STRICT SERVER-SIDE</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Unpaid visitors cannot access beacon coordinates or deep findings via inspect element.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUPPORT DESK & COMMUNICATIONS */}
      {activeTab === "support" && (
        <div className="space-y-6">
          {/* Centralized Contact Channels Hub */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                    CENTRALIZED COMMUNICATIONS
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                    OFFICIAL DISPATCH
                  </span>
                </div>
                <h2 className="text-base font-bold text-white font-heading mt-1">
                  Official Administrative Contact Channels
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single source of truth for investor inquiries, WhatsApp emergency escalation, and executive email routing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenContactModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Channels</span>
                </button>
                <a
                  href={`mailto:${dynamicContact.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </a>
                <a
                  href={`https://wa.me/${(dynamicContact.primaryWhatsapp || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>WhatsApp Test</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Email */}
              <div 
                onClick={handleOpenContactModal}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 hover:border-indigo-500/50 cursor-pointer transition-colors group"
                title="Click to edit email channel"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-400 transition-colors">Primary Support Email</span>
                  <div className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <p className="text-xs font-mono text-white font-semibold break-all">
                  {dynamicContact.email}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium block">Default Inbound Route</span>
              </div>

              {/* Primary WhatsApp */}
              <div 
                onClick={handleOpenContactModal}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 hover:border-emerald-500/50 cursor-pointer transition-colors group"
                title="Click to edit primary WhatsApp"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">WhatsApp Primary</span>
                  <div className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-xs font-mono text-white font-semibold">
                  {dynamicContact.primaryWhatsapp}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium block">24/7 Fast Escalation</span>
              </div>

              {/* Secondary WhatsApp */}
              <div 
                onClick={handleOpenContactModal}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 hover:border-emerald-500/50 cursor-pointer transition-colors group"
                title="Click to edit secondary WhatsApp"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">WhatsApp Secondary</span>
                  <div className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <p className="text-xs font-mono text-white font-semibold">
                  {dynamicContact.secondaryWhatsapp}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block">Direct Verification Line</span>
              </div>

              {/* Social Channels */}
              <div 
                onClick={handleOpenContactModal}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 hover:border-indigo-500/50 cursor-pointer transition-colors group"
                title="Click to edit social profiles"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-400 transition-colors">Social Accounts</span>
                  <div className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ExternalLink className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div className="text-xs text-white space-y-0.5">
                  <p className="font-semibold">FB: {dynamicContact.facebook}</p>
                  <p className="font-semibold">IG: @{dynamicContact.instagram}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">Brand Presence Verified</span>
              </div>
            </div>
          </div>

          {/* Support Ticket Inbox */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Customer Inquiries & Support Tickets ({supportTickets.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dispatched from the public contact portal and user issue reporting dialogs.
                </p>
              </div>
              <button
                onClick={fetchData}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                Refresh Tickets
              </button>
            </div>

            {supportTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs rounded-lg bg-slate-950/60 border border-slate-800/80">
                No active support tickets logged yet. Inquiries submitted via /contact or API will populate here immediately.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Ticket Ref</th>
                      <th className="py-2.5 px-3">Inquirer / Email</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Subject & Message</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {supportTickets.map((ticket: any) => (
                      <tr key={ticket.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">
                          {ticket.ticketNumber || ticket.id?.slice(0, 10)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{ticket.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{ticket.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ticket.category || "GENERAL"}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-white truncate">{ticket.subject}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-2">{ticket.message}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                          <a
                            href={`mailto:${ticket.email}?subject=RE:%20${encodeURIComponent(ticket.subject || "LandIntel Support Inquiry")}&body=Hello%20${encodeURIComponent(ticket.name || "")}%2C%0A%0AThank%20you%20for%20contacting%20LandIntel%20Support.`}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] inline-block"
                          >
                            Reply
                          </a>
                          <a
                            href={`https://wa.me/${(dynamicContact.primaryWhatsapp || "").replace(/[^0-9]/g, "")}?text=Customer%20Support%20Followup%20for%20${encodeURIComponent(ticket.name || "")}%20(${encodeURIComponent(ticket.email || "")}):%20${encodeURIComponent(ticket.subject || "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] inline-block"
                          >
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                  CASE INSPECTION
                </span>
                <h2 className="text-lg font-bold text-white font-heading">{selectedCaseModal.title}</h2>
                <p className="text-xs text-slate-400">{selectedCaseModal.state}, {selectedCaseModal.lga}</p>
              </div>
              <button
                onClick={() => setSelectedCaseModal(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Buyer / Account</span>
                <span className="text-white font-semibold block mt-0.5">{selectedCaseModal.user?.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">{selectedCaseModal.user?.email}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Risk Assessment</span>
                {selectedCaseModal.riskScore ? (
                  <div className="mt-1 flex items-center gap-2">
                    <RiskBadge level={selectedCaseModal.riskScore.level} />
                    <span className="font-mono font-bold text-white">{selectedCaseModal.riskScore.score}/100</span>
                  </div>
                ) : (
                  <span className="text-slate-500 block mt-1">Pending Analysis</span>
                )}
              </div>
            </div>

            {selectedCaseModal.riskScore?.explanation && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Cadastral Engine Explanation</span>
                <p className="text-slate-300 leading-relaxed">{selectedCaseModal.riskScore.explanation}</p>
              </div>
            )}

            {/* Findings preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Findings ({selectedCaseModal.findings?.length || 0})
              </span>
              <div className="space-y-2">
                {selectedCaseModal.findings?.map((f: any) => (
                  <div key={f.id} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between">
                    <span className="text-slate-200 font-medium">{f.title}</span>
                    <RiskBadge level={f.severity} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Link
                href={`/properties/${selectedCaseModal.id}`}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Open Full Case Hub
              </Link>
              <button
                onClick={() => setSelectedCaseModal(null)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {selectedAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                  AUDIT EVENT INSPECTOR
                </span>
                <h3 className="text-sm font-bold text-white font-mono">{selectedAuditModal.action}</h3>
              </div>
              <button
                onClick={() => setSelectedAuditModal(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-500">Event ID:</span>
                <span className="text-slate-300">{selectedAuditModal.id}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="text-slate-300">{selectedAuditModal.user?.email || "System"}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-300">{new Date(selectedAuditModal.createdAt).toISOString()}</span>
              </div>
            </div>

            {selectedAuditModal.details && (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 text-[10px] uppercase font-bold font-mono">Event Payload (JSON)</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-48">
                  {typeof selectedAuditModal.details === "string"
                    ? selectedAuditModal.details
                    : JSON.stringify(selectedAuditModal.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-right pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedAuditModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Channels Edit Modal */}
      {isEditContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                  PLATFORM CONFIGURATION
                </span>
                <h3 className="text-base font-bold text-white">
                  Edit Official Contact Channels
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Changes saved here update immediately across the entire website, marketing footer, and contact desk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditContactModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactModalError && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{contactModalError}</span>
              </div>
            )}

            {contactModalSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{contactModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Support Email */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Primary Support Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={contactFormData.email}
                      onChange={(e) =>
                        setContactFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="e.g. support@landintel.ng"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    The default email displayed on the contact page, footer, and admin alerts.
                  </span>
                </div>

                {/* Primary WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    WhatsApp Primary (with country code)
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={contactFormData.primaryWhatsapp}
                      onChange={(e) =>
                        setContactFormData((prev) => ({ ...prev, primaryWhatsapp: e.target.value }))
                      }
                      placeholder="+2349033084408"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Secondary WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    WhatsApp Secondary / Direct Line
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={contactFormData.secondaryWhatsapp}
                      onChange={(e) =>
                        setContactFormData((prev) => ({ ...prev, secondaryWhatsapp: e.target.value }))
                      }
                      placeholder="+2348077426824"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Facebook Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Facebook Display Name
                  </label>
                  <input
                    type="text"
                    value={contactFormData.facebook}
                    onChange={(e) =>
                      setContactFormData((prev) => ({ ...prev, facebook: e.target.value }))
                    }
                    placeholder="e.g. Oluwayomi Succe"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Facebook URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Facebook Profile URL
                  </label>
                  <input
                    type="url"
                    value={contactFormData.facebookUrl}
                    onChange={(e) =>
                      setContactFormData((prev) => ({ ...prev, facebookUrl: e.target.value }))
                    }
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Instagram Handle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Instagram Handle (without @)
                  </label>
                  <input
                    type="text"
                    value={contactFormData.instagram}
                    onChange={(e) =>
                      setContactFormData((prev) => ({ ...prev, instagram: e.target.value }))
                    }
                    placeholder="e.g. oluwayomi_success"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Instagram URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={contactFormData.instagramUrl}
                    onChange={(e) =>
                      setContactFormData((prev) => ({ ...prev, instagramUrl: e.target.value }))
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Support Availability */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Support Availability Notice
                  </label>
                  <input
                    type="text"
                    value={contactFormData.supportAvailability}
                    onChange={(e) =>
                      setContactFormData((prev) => ({ ...prev, supportAvailability: e.target.value }))
                    }
                    placeholder="24/7 Dedicated Investor Due-Diligence & Emergency Verification"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditContactModalOpen(false)}
                  disabled={contactSaving}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{contactSaving ? "Saving to Database..." : "Save Across Website"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
