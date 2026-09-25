"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, PlusCircle, UserCheck, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LandIntelLogo } from "@/components/ui/LandIntelLogo";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const Navbar: React.FC = () => {
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    // 1. Instant hydration from localStorage
    const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("landintel_user") : null;
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      } catch {}
    }

    // 2. Cross-verify with session endpoint
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("landintel_user", JSON.stringify(data.user));
          }
        } else if (!savedUserStr) {
          setUser(null);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("landintel_token");
      localStorage.removeItem("landintel_user");
      try {
        document.cookie = "landintel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "diasporaland_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch {}
    }
    setUser(null);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const links = [
    { label: t("howItWorks") || "How It Works", href: "/how-it-works" },
    { label: t("whatWeAnalyze") || "What We Analyze", href: "/#what-we-analyze" },
    { label: t("pricing") || t("pricingPlans") || "Pricing & Plans", href: "/pricing" },
    { label: t("security") || "Security & NDPR", href: "/security" },
    { label: t("faq") || "FAQ", href: "/faq" },
  ];

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const userInitial = user?.name
    ? user.name.trim()[0].toUpperCase()
    : user?.email
    ? user.email.trim()[0].toUpperCase()
    : "U";

  return (
    <header dir="ltr" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 min-h-[64px] max-h-[64px] flex items-center justify-between flex-nowrap min-w-0">
        {/* Brand */}
        <LandIntelLogo href="/" size="md" variant="light" className="mr-3 lg:mr-6 notranslate" />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-[13px] font-semibold text-slate-700 shrink-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition-all whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          <LocaleSelector variant="light" compact />

          {user ? (
            <div className="flex items-center gap-2 xl:gap-2.5">
              {/* New Property Case Action Button */}
              <Link
                href="/properties/new"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t("newCase") || "New Property Case"}</span>
              </Link>

              {/* User Avatar Dropdown - First Letter of User */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={userMenuOpen}
                  aria-label="User Account Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-emerald-500/20 transition-all">
                    {userInitial}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${userMenuOpen ? "rotate-180 text-emerald-700" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{isAdmin ? "Administrator" : "Verified Investor"}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href={dashboardHref}
                        prefetch={true}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        <span>{isAdmin ? (t("adminConsole") || "Admin Cockpit") : (t("dashboard") || "Investor Workspace")}</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        prefetch={true}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <span>{t("myProperties") || "My Property Cases"}</span>
                      </Link>

                      <Link
                        href="/security"
                        prefetch={true}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-slate-500" />
                        <span>Security &amp; Audit</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/60 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>{t("signOut") || "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                prefetch={true}
                className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3 py-2 transition-colors whitespace-nowrap"
              >
                {t("logIn") || "Sign In"}
              </Link>
              <Link
                href="/register"
                prefetch={true}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all whitespace-nowrap"
              >
                <span>{t("analyzeProperty") || "Analyze a Property"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0 min-w-0">
          <LocaleSelector variant="light" compact />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-brand-textPrimary rounded-md hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-brand-border bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-brand-textPrimary">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className="py-1.5 hover:text-brand-blue transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-brand-border flex flex-col gap-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold text-slate-500">Currency &amp; Language</span>
              <LocaleSelector variant="light" />
            </div>

            {user ? (
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-brand-darkNavy truncate">
                      {user.name || user.email}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                    {user.email} ({user.role})
                  </span>
                </div>

                <Link
                  href={dashboardHref}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-2 text-xs font-bold text-white bg-brand-darkNavy rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {isAdmin ? (t("adminConsole") || "Admin Cockpit") : (t("dashboard") || "Investor Dashboard")}
                </Link>

                <Link href="/properties/new" prefetch={true} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    <span>{t("newCase") || "New Property Case"}</span>
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  {t("signOut") || "Sign Out"}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2 text-xs font-bold text-brand-textPrimary"
                >
                  {t("logIn") || "Sign In"}
                </Link>
                <Link href="/register" prefetch={true} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    {t("analyzeProperty") || "Analyze a Property"}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
