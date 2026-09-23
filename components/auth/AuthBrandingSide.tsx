"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin, Users, TrendingUp } from "lucide-react";

interface AuthBrandingSideProps {
  quote?: {
    text: string;
    author: string;
    role: string;
  };
}

export const AuthBrandingSide: React.FC<AuthBrandingSideProps> = ({
  quote = {
    text: "When you are buying from abroad, you cannot rely on verbal assurances or WhatsApp videos. LandIntel plotted the survey coordinates against the official gazette and caught an unconsented 140-meter highway buffer. It saved our family £35,000.",
    author: "Dr. James & Folake Oduya",
    role: "Healthcare Director & Diaspora Buyers (London, UK)",
  },
}) => {
  return (
    <aside className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative overflow-hidden">
      {/* Full-bleed hero photograph */}
      <Image
        src="/auth-hero.jpg"
        alt="Premium residential estate at golden hour"
        fill
        priority
        className="object-cover"
        sizes="(min-width: 1280px) 42vw, 50vw"
      />

      {/* Layered gradient overlays for depth and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col justify-between w-full p-8 xl:p-12">
        {/* ── Top: Logo + Tagline ── */}
        <div className="space-y-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-white text-lg shadow-lg">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-white block drop-shadow-sm">
                LandIntel
              </span>
              <span className="text-[11px] text-white/60 font-medium block">
                Title Verification &amp; Due Diligence
              </span>
            </div>
          </Link>

          <div className="space-y-3 max-w-sm">
            <h1 className="text-[28px] xl:text-[32px] font-extrabold font-heading text-white leading-[1.15] tracking-tight drop-shadow-md">
              Verify the ground
              <br />
              before you wire
              <br />
              the funds.
            </h1>
            <p className="text-sm text-white/70 leading-relaxed font-normal">
              Independent cadastral survey and statutory title verification for diaspora buyers and conveyancing counsel.
            </p>
          </div>
        </div>

        {/* ── Middle: Floating stat cards ── */}
        <div className="flex flex-wrap gap-3 my-8">
          <StatCard
            icon={<MapPin className="w-4 h-4" />}
            value="2,400+"
            label="Parcels Verified"
          />
          <StatCard
            icon={<ShieldCheck className="w-4 h-4" />}
            value="99.8%"
            label="Title Accuracy"
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            value="6 Countries"
            label="Diaspora Reach"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            value="₦4.2B+"
            label="Investment Protected"
          />
        </div>

        {/* ── Bottom: Testimonial + trust bar ── */}
        <div className="space-y-5">
          {/* Quote */}
          <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/10 p-5 xl:p-6">
            <p className="text-[13px] text-white/90 leading-relaxed font-normal italic">
              &ldquo;{quote.text}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-blue/30 border border-brand-blue/40 flex items-center justify-center text-white font-bold text-sm">
                {quote.author.charAt(0)}
              </div>
              <div>
                <span className="text-xs text-white font-semibold block">
                  {quote.author}
                </span>
                <span className="text-[11px] text-white/50 block">
                  {quote.role}
                </span>
              </div>
            </div>
          </div>

          {/* Trust footer */}
          <div className="flex items-center gap-4 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              AES-256 Encrypted
            </span>
            <span className="w-px h-3 bg-white/15" />
            <span>100% Vendor-Independent</span>
            <span className="w-px h-3 bg-white/15" />
            <span>SOC 2 Compliant</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ── Glassmorphic stat card ── */
function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[140px]">
      <div className="w-8 h-8 rounded-lg bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue shrink-0">
        {icon}
      </div>
      <div>
        <span className="text-white font-bold text-sm block leading-tight">
          {value}
        </span>
        <span className="text-white/50 text-[10px] font-medium block">
          {label}
        </span>
      </div>
    </div>
  );
}
