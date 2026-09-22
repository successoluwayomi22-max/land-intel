"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, FileText, ShieldAlert, Plus, ArrowRight, Clock, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface PropertyCaseItem {
  id: string;
  title: string;
  state: string;
  lga: string;
  address: string;
  propertyType: string;
  purchasePrice?: number;
  status: string;
  updatedAt: string;
  documents: Array<{ id: string; category: string }>;
  riskScore?: { score: number; level: string; explanation: string };
  reports: Array<{ id: string; isPaidUnlocked: boolean }>;
}

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [cases, setCases] = useState<PropertyCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("landintel_user");
        if (savedUser) setUser(JSON.parse(savedUser));
        const cachedCases = sessionStorage.getItem("landintel_cases_cache");
        if (cachedCases) {
          setCases(JSON.parse(cachedCases));
          setLoading(false);
        }
      } catch {}
    }
    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : {})) as Promise<any>,
      fetch("/api/properties").then((r) => (r.ok ? r.json() : {})) as Promise<any>,
    ])
      .then(([userData, casesData]: [any, any]) => {
        if (userData?.user) {
          setUser(userData.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("landintel_user", JSON.stringify(userData.user));
          }
        }
        if (casesData?.cases) {
          setCases(casesData.cases);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("landintel_cases_cache", JSON.stringify(casesData.cases));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Investor";

  const totalDocuments = cases.reduce((sum, c) => sum + (c.documents?.length || 0), 0);
  const totalReportsUnlocked = cases.filter((c) => c.reports && c.reports.some((r) => r.isPaidUnlocked)).length;

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-textPrimary font-heading tracking-tight" suppressHydrationWarning>
            {getGreeting()}, {mounted && user?.name ? user.name.split(" ")[0] : "Investor"}
          </h1>
          <p className="text-xs sm:text-sm text-brand-textSecondary mt-1">
            Track and examine property due-diligence investigations, boundary covenants, and title risk indicators.
          </p>
        </div>
        <Link
          href="/properties/new"
          prefetch={true}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-button shadow-subtle transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Property Case</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-border rounded-card p-4 shadow-subtle">
          <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider block">
            Active Properties
          </span>
          <span className="text-2xl font-bold font-heading text-brand-textPrimary mt-1 block" suppressHydrationWarning>
            {loading ? "..." : cases.length}
          </span>
          <span className="text-[11px] text-brand-textSecondary block mt-1">Ongoing investigations</span>
        </div>

        <div className="bg-white border border-brand-border rounded-card p-4 shadow-subtle">
          <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider block">
            Documents Analyzed
          </span>
          <span className="text-2xl font-bold font-heading text-brand-textPrimary mt-1 block" suppressHydrationWarning>
            {loading ? "..." : totalDocuments}
          </span>
          <span className="text-[11px] text-brand-textSecondary block mt-1">Surveys, Deeds & Title Certificates</span>
        </div>

        <div className="bg-white border border-brand-border rounded-card p-4 shadow-subtle">
          <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider block">
            Reports Unlocked
          </span>
          <span className="text-2xl font-bold font-heading text-brand-textPrimary mt-1 block" suppressHydrationWarning>
            {loading ? "..." : totalReportsUnlocked}
          </span>
          <span className="text-[11px] text-brand-textSecondary block mt-1">Full due-diligence certs</span>
        </div>

        <div className="bg-white border border-brand-border rounded-card p-4 shadow-subtle">
          <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider block">
            Account Status
          </span>
          <span className="text-sm font-bold font-heading text-brand-blue mt-2 block uppercase" suppressHydrationWarning>
            {loading ? "..." : `${user?.role || "FREE"} TIER`}
          </span>
          <span className="text-[11px] text-brand-textSecondary block mt-1">Server-verified entitlement</span>
        </div>
      </div>

      {/* Cases Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-brand-textPrimary font-heading">
            My Property Cases
          </h2>
          <Link
            href="/properties"
            prefetch={true}
            className="text-xs font-semibold text-brand-blue hover:text-brand-blueHover flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : cases.length === 0 ? (
          <EmptyState
            title="Your property investigations will appear here"
            description="Start by creating a property case to upload and cross-examine Survey Plans, Deeds of Assignment, and Title Documents."
            actionLabel="Analyze Your First Property"
            actionHref="/properties/new"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((c) => {
              const isPaid = c.reports && c.reports.some((r) => r.isPaidUnlocked);
              return (
                <Link key={c.id} href={`/properties/${c.id}`} prefetch={true} className="block group">
                  <div className="h-full bg-white border border-brand-border rounded-card p-5 shadow-subtle group-hover:shadow-card group-hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <StatusBadge status={c.status} />
                        {c.riskScore && <RiskBadge level={c.riskScore.level} />}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-brand-textPrimary font-heading group-hover:text-brand-blue transition-colors line-clamp-1">
                          {c.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-brand-textSecondary mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.address}, {c.lga}, {c.state}</span>
                        </div>
                      </div>

                      {c.riskScore && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-brand-textMuted font-medium">Risk Score</span>
                            <span className="font-bold text-brand-textPrimary">{c.riskScore.score} / 100</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-pill h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                c.riskScore.score > 60
                                  ? "bg-rose-600"
                                  : c.riskScore.score > 40
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                              } rounded-pill`}
                              style={{ width: `${c.riskScore.score}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-brand-border flex items-center justify-between text-xs text-brand-textMuted">
                      <span>{c.documents.length} document(s)</span>
                      <span className="flex items-center gap-1 font-semibold text-brand-blue group-hover:translate-x-0.5 transition-transform">
                        <span>{isPaid ? "View Report" : "Inspect Case"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
