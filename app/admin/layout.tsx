"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowLeft,
  KeyRound,
  Activity,
  LogOut,
  AlertTriangle,
  Users,
  Building2,
  CreditCard,
  Database,
  FileCheck2,
  Radio,
  Terminal,
  Server,
  Layers,
  Home,
  CheckCircle2,
  FolderOpen,
  FileText,
  PieChart,
  Sliders,
  Globe,
  Coins,
  Languages,
  FileEdit,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LocaleSelector } from "@/components/ui/LocaleSelector";

const ADMIN_NAV_GROUPS = [
  {
    title: "Operations & Intelligence",
    items: [
      { href: "/admin", label: "Command Deck", icon: Terminal },
      { href: "/admin/analytics", label: "Analytics & Radar", icon: Activity },
      { href: "/admin/cases", label: "Property Cases", icon: FolderOpen },
      { href: "/admin/reports", label: "Certified Reports", icon: FileCheck2 },
      { href: "/admin/documents", label: "Document Vault", icon: FileText },
      { href: "/admin/analysis", label: "Cadastral Analysis", icon: PieChart },
    ],
  },
  {
    title: "Revenue & Finance",
    items: [
      { href: "/admin/revenue", label: "Revenue Ledger", icon: Coins },
      { href: "/admin/payments", label: "Paystack Payments", icon: CreditCard },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Layers },
      { href: "/admin/plans", label: "Plans & Quotas", icon: Sliders },
    ],
  },
  {
    title: "Runtime, Heap & Usage",
    items: [
      { href: "/admin/telemetry", label: "Heap & Telemetry", icon: Cpu },
      { href: "/admin/usage", label: "Resource Usage", icon: Database },
      { href: "/admin/ai", label: "AI & Inquiry Ledger", icon: Terminal },
      { href: "/admin/jobs", label: "Background Jobs", icon: Server },
      { href: "/admin/errors", label: "Error Diagnostics", icon: ShieldAlert },
    ],
  },
  {
    title: "Governance & Security",
    items: [
      { href: "/admin/users", label: "User Governance", icon: Users },
      { href: "/admin/organizations", label: "Organizations", icon: Building2 },
      { href: "/admin/security", label: "Security & MFA", icon: Shield },
      { href: "/admin/audit", label: "Audit Trail", icon: Terminal },
    ],
  },
  {
    title: "Global Configuration",
    items: [
      { href: "/admin/jurisdictions", label: "Jurisdictions", icon: Globe },
      { href: "/admin/currencies", label: "Currency Registry", icon: Coins },
      { href: "/admin/languages", label: "Languages & RTL", icon: Languages },
      { href: "/admin/settings", label: "Platform Settings", icon: Sliders },
      { href: "/admin/system", label: "System Architecture", icon: Server },
    ],
  },
];

interface AdminUserInfo {
  email: string;
  name: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(null);
  const [nonAdminUser, setNonAdminUser] = useState<AdminUserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async (): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("landintel_token") : null;

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/auth/me", { headers, credentials: "include" });
      const data = await res.json();
      if (res.ok && data.user && (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN")) {
        setAdminUser(data.user);
        setNonAdminUser(null);
        if (typeof window !== "undefined") {
          localStorage.setItem("landintel_user", JSON.stringify(data.user));
        }
      } else {
        setAdminUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("landintel_user");
        }
        if (data?.user) {
          setNonAdminUser(data.user);
        } else {
          setNonAdminUser(null);
        }
      }
    } catch {
      setAdminUser(null);
      setNonAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Automatic redirect if unauthorized
  useEffect(() => {
    if (!loading) {
      if (!adminUser && !nonAdminUser) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (nonAdminUser && !adminUser) {
        router.replace("/dashboard");
      }
    }
  }, [loading, adminUser, nonAdminUser, pathname, router]);

  const handleLogout = async (): Promise<void> => {
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
    } catch (err: unknown) {
      console.error(err);
    } finally {
      window.location.replace("/login?logged_out=true");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xs font-mono text-amber-400/80 uppercase tracking-wider">
            Loading LandIntel Operations Cockpit...
          </p>
        </div>
      </div>
    );
  }

  // 1. If logged in as a non-admin user, deny access explicitly (403 Forbidden)
  if (nonAdminUser && !adminUser) {
    return (
      <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0B101E] border border-rose-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono tracking-wider font-bold uppercase">
              ACCESS FORBIDDEN (403)
            </div>
            <h1 className="text-xl font-extrabold text-white">Elevated Privileges Required</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your active account (<span className="text-amber-400 font-mono">{nonAdminUser.email}</span>) does not have administrative permissions.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>Return to Customer Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg transition-colors cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If not logged in as Admin, show clean loading and redirect to login
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#050811] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-amber-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">
            Verifying security credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* ============================================================ */}
      {/* 1. DEDICATED FIXED ADMIN OPERATIONS SIDEBAR (Dark Obsidian)  */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-[#070B16] border-r border-amber-500/20 text-slate-200 z-30 select-none">
        {/* Operations Brand Header */}
        <div className="p-4 border-b border-amber-500/20 bg-[#0A1020]">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 shadow-md shadow-amber-500/20 text-sm">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm tracking-tight text-white block">
                LandIntel
              </span>
              <span className="text-[9px] tracking-widest text-amber-400 font-mono font-bold uppercase block">
                OPS COCKPIT v2.4
              </span>
            </div>
          </Link>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>NODE: CADASTRAL-CENTRAL [ONLINE]</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 px-3 block mb-1 font-bold">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const NavIcon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                      }`}
                    >
                      <NavIcon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

          {/* Quick Context Switchers */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 block font-bold">
              Switch Viewport
            </span>
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/40 text-blue-300 text-xs font-semibold transition-all group"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Investor Workspace</span>
              </span>
              <span className="text-[9px] px-1 bg-blue-500/20 text-blue-200 rounded font-mono">CLIENT</span>
            </Link>

            <Link
              href="/"
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all"
            >
              <span className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Public Website</span>
              </span>
              <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded font-mono">EXT</span>
            </Link>
          </div>

        {/* Sidebar Footer: Admin Identity */}
        <div className="p-3 border-t border-amber-500/20 bg-[#0A1020] flex items-center justify-between">
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-white block truncate">{adminUser.name || "Administrator"}</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/80 block truncate">{adminUser.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
            title="Terminate Admin Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. ADMIN MAIN VIEWPORT (Offset by 64 (16rem) on desktop)     */}
      {/* ============================================================ */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Operations Telemetry Header */}
        <header className="bg-[#0A1020]/95 backdrop-blur-md border-b border-amber-500/20 sticky top-0 z-20 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xs">
                L
              </div>
              <span className="font-heading font-extrabold text-sm text-white">LandIntel OPS</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase text-[10px]">
                TACTICAL COMMAND DECK
              </span>
              <span>•</span>
              <span className="text-slate-300">CLUSTER: GRID-01</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">DB: SQLITE (HEALTHY)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LocaleSelector variant="dark" />

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-700/50 text-xs font-bold text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Admin Children */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
