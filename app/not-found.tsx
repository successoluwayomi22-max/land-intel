import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0,transparent_65%)] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 bg-gradient-to-b from-slate-900/90 to-[#070B16] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
            HTTP 404 • CADASTRAL NOT FOUND
          </span>
          <h1 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
            Coordinates Not Found
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The page, property dossier, or cadastral record you requested does not exist on this network or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full border-slate-800 text-slate-300 hover:text-white text-xs bg-slate-900">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Platform Home</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
          Looking for a specific Nigerian property? Verify title references in{" "}
          <Link href="/properties" className="text-amber-400 hover:underline">
            Properties
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
