"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MapPin, ArrowRight, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function PropertiesListPage() {
  const [cases, setCases] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("landintel_cases_cache");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("landintel_cases_cache");
    }
    return false;
  });
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: any) => {
        if (data.cases) {
          setCases(data.cases);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("landintel_cases_cache", JSON.stringify(data.cases));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase()) ||
      c.lga.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase());

    const matchesRisk =
      filterLevel === "ALL" ||
      (c.riskScore && c.riskScore.level.toUpperCase() === filterLevel.toUpperCase());

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-textPrimary font-heading tracking-tight">
            Property Investigations
          </h1>
          <p className="text-xs sm:text-sm text-brand-textSecondary mt-1">
            Manage your due-diligence property cases, check risk indicators, and review documents.
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 border border-brand-border rounded-card shadow-subtle">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, state, LGA, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-brand-border rounded-input focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 text-xs border border-brand-border rounded-input bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-blue w-full sm:w-auto"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="ELEVATED">Elevated Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredCases.length === 0 ? (
        <EmptyState
          title={cases.length === 0 ? "No property cases created yet" : "No matching properties found"}
          description={
            cases.length === 0
              ? "Create your first property case to analyze Survey Plans, Deeds, and Title Documents."
              : "Try adjusting your search query or risk filter."
          }
          actionLabel={cases.length === 0 ? "Analyze a Property" : undefined}
          actionHref={cases.length === 0 ? "/properties/new" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((c) => {
            const isPaid = c.reports && c.reports.some((r: any) => r.isPaidUnlocked);
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
  );
}
