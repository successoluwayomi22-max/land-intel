"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, PlusCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HeroCta() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("landintel_user")) {
        setIsLoggedIn(true);
      }
    } catch {}
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
      {isLoggedIn ? (
        <>
          <Link href="/properties/new" prefetch={false} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md py-3 sm:py-3.5 px-6 font-bold text-xs sm:text-sm min-h-[48px]">
              <PlusCircle className="w-4 h-4 mr-2" />
              <span>Start Property Verification</span>
            </Button>
          </Link>
          <Link href="/dashboard" prefetch={false} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white border-slate-300 text-brand-darkNavy hover:bg-slate-50 py-3 sm:py-3.5 px-6 font-bold text-xs sm:text-sm shadow-xs min-h-[48px]">
              <LayoutDashboard className="w-4 h-4 mr-2 text-brand-blue" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </>
      ) : (
        <>
          <Link href="/register" prefetch={false} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md py-3 sm:py-3.5 px-6 sm:px-7 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[48px]">
              <span>Start Property Verification</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/how-it-works" prefetch={false} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white border-slate-300 text-slate-800 hover:text-brand-darkNavy hover:bg-slate-50 py-3 sm:py-3.5 px-6 font-bold text-xs sm:text-sm shadow-xs min-h-[48px]">
              <span>See How It Works</span>
            </Button>
          </Link>
          <a href="/sample-diligence-report.pdf" download className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-slate-50 border-slate-300 text-slate-800 hover:text-brand-darkNavy hover:bg-white py-3 sm:py-3.5 px-6 font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 min-h-[48px]">
              <Download className="w-3.5 h-3.5" />
              <span>Preview Sample Dossier (.PDF)</span>
            </Button>
          </a>
        </>
      )}
    </div>
  );
}
