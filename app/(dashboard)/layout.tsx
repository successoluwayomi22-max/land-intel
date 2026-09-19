"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Plus,
  Home,
  ExternalLink,
  HelpCircle,
  CreditCard,
  PlusCircle,
  ChevronRight,
  Shield,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { useLocale } from "@/components/providers/LocaleProvider";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("landintel_user") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("landintel_token") : null;

    if (savedUserStr && !user) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id) {
          setUser(parsed);
          setLoading(false);
        }
      } catch {}
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("/api/auth/me", {
      headers,
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("landintel_user", JSON.stringify(data.user));
          }
        } else if (!savedUserStr) {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!savedUserStr) {
          router.push("/login");
        }
        setLoading(false);
      });
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("landintel_token");
        localStorage.removeItem("landintel_user");
        localStorage.removeItem("diasporaland_token");
        localStorage.removeItem("diasporaland_user");
        sessionStorage.clear();
        try {
          document.cookie = "landintel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "diasporaland_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        } catch {}
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    } finally {
      window.location.replace("/login?logged_out=true");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
          <span className="text-xs font-medium text-brand-textMuted">Loading Customer Dashboard...</span>
        </div>
      </div>
    );
  }

  const workspaceNav = [
    { label: t("dashboardOverview"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("dueDiligenceCases"), href: "/properties", icon: Building2 },
    { label: t("newInvestigation"), href: "/properties/new", icon: PlusCircle },
  ];

  const accountNav = [
    { label: t("settingsProfile"), href: "/settings", icon: Settings },
    { label: "Billing & Plans", href: "/billing", icon: CreditCard },
    { label: t("pricingPlans"), href: "/pricing", icon: Sparkles },
    { label: t("dueDiligenceFaq"), href: "/faq", icon: HelpCircle },
  ];

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. FIXED DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-[#0B1220] text-white z-30 border-r border-slate-800 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform text-sm">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm tracking-tight text-white block">
                LandIntel
              </span>
              <span className="text-[10px] tracking-wider text-blue-400 font-bold uppercase block -mt-0.5">
                {t("dashboard")}
              </span>
            </div>
          </Link>
        </div>

        {/* Primary CTA: New Property Investigation */}
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/properties/new"
            prefetch={true}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("analyzeProperty")}</span>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-3 space-y-6 overflow-y-auto">
          {/* Section: Workspace */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
              {t("dueDiligence") || "INVESTIGATIONS"}
            </span>
            <div className="space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/properties" && pathname.startsWith("/properties") && pathname !== "/properties/new");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600/15 text-blue-400 font-bold border border-blue-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Account & Platform */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
              {t("accountSupport") || "ACCOUNT & SUPPORT"}
            </span>
            <div className="space-y-1">
              {accountNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600/15 text-blue-400 font-bold border border-blue-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Return to Main Website */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
              {t("navigation") || "NAVIGATION"}
            </span>
            <div className="space-y-1">
              <Link
                href="/"
                prefetch={true}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/60 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-slate-200 group-hover:text-white">{t("returnToMainSite") || "Return to Main Site"}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
              </Link>
            </div>
          </div>

          {/* Section: Admin Clearance Switcher (Only if Admin) */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-800/80">
              <span className="px-3 text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1.5 font-mono">
                {t("adminAccess") || "ADMIN ACCESS"}
              </span>
              <Link
                href="/admin"
                prefetch={true}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Ops Control Center</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400/70" />
              </Link>
            </div>
          )}
        </div>

        {/* User Account Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate" suppressHydrationWarning>
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0" suppressHydrationWarning>
              {mounted && user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="truncate" suppressHydrationWarning>
              <span className="text-xs font-semibold text-white block truncate" suppressHydrationWarning>
                {mounted && user?.name ? user.name : "User"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block" suppressHydrationWarning>
                {mounted && user?.role === "PAID" ? (
                  <span className="text-emerald-400 font-bold">{t("paidSubscriber") || "PAID SUBSCRIBER"}</span>
                ) : (
                  <span>{t("freeTier") || "FREE TIER"}</span>
                )}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & DRAWER */}
      <div dir="ltr" className="md:hidden sticky top-0 z-40 bg-[#0B1220] border-b border-slate-800 text-white px-3 sm:px-4 h-14 min-h-[56px] max-h-[56px] flex items-center justify-between flex-nowrap min-w-0">
        <Link href="/dashboard" prefetch={true} className="flex items-center gap-2 shrink-0 notranslate">
          <div className="w-7 h-7 rounded bg-brand-blue flex items-center justify-center font-black text-white text-xs">
            L
          </div>
          <span className="font-heading font-bold text-sm tracking-tight text-white">LandIntel</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LocaleSelector variant="dark" compact />
          <Link
            href="/"
            prefetch={true}
            className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1"
          >
            <Home className="w-3 h-3 text-emerald-400" />
            <span className="hidden xs:inline">{t("returnHome") || "Main Site"}</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slideout Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex">
          <div className="w-72 bg-[#0B1220] text-white p-5 flex flex-col h-full border-r border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="font-heading font-bold text-sm text-white">{t("navigation") || "Navigation"}</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-4 overflow-y-auto">
              <Link
                href="/properties/new"
                prefetch={true}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-blue text-white text-xs font-bold rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>{t("newCase") || "New Property Case"}</span>
              </Link>

              <div className="space-y-1">
                {workspaceNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                {accountNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <Link
                  href="/"
                  prefetch={true}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-800/40"
                >
                  <Home className="w-4 h-4" />
                  <span>{t("returnToMainSite") || "Return to Main Site"}</span>
                </Link>
              </div>

              {isAdmin && (
                <div className="pt-2">
                  <Link
                    href="/admin"
                    prefetch={true}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Admin Operations Portal</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between" suppressHydrationWarning>
              <div className="truncate" suppressHydrationWarning>
                <span className="text-xs font-semibold text-white block truncate" suppressHydrationWarning>{mounted && user?.name ? user.name : "User"}</span>
                <span className="text-[10px] text-slate-400 block" suppressHydrationWarning>{mounted && user?.email ? user.email : ""}</span>
              </div>
              <button onClick={handleLogout} className="text-rose-400 p-2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* 3. MAIN CONTENT AREA (Offset by 64 (16rem) on desktop) */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Desktop Navigation Ribbon */}
        <header dir="ltr" className="hidden md:flex items-center justify-between flex-nowrap min-w-0 bg-white border-b border-brand-border px-8 py-3.5 sticky top-0 z-20 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-medium text-brand-textSecondary">
            <span className="text-brand-textMuted font-bold">LandIntel</span>
            <span>/</span>
            <span className="text-brand-textPrimary font-semibold capitalize">
              {pathname === "/dashboard"
                ? (t("investorWorkspace") || "Investor Workspace")
                : pathname.replace("/dashboard/", "").replace("/properties/", "Property / ").replace("/", "")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LocaleSelector variant="light" />

            {isAdmin && (
              <Link
                href="/admin"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-800 transition-colors"
                title="Switch to Executive Operations Command Center"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Executive Admin Cockpit</span>
              </Link>
            )}

            <Link
              href="/"
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
              title="Navigate back to public marketing website"
            >
              <Home className="w-3.5 h-3.5 text-brand-blue" />
              <span>{t("returnToMainSite") || "Return to Main Site"}</span>
            </Link>

            <Link
              href="/properties/new"
              prefetch={true}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold shadow-subtle transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("newCase") || "New Case"}</span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
