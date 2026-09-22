"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Globe, DollarSign, Search, X, Sparkles, MapPin } from "lucide-react";
import {
  useLocale,
  CURRENCIES,
  LANGUAGES,
  SupportedCurrency,
  SupportedLanguage,
  LanguageConfig,
} from "@/components/providers/LocaleProvider";
import { CountryFlag } from "@/components/ui/CountryFlags";

export const LocaleSelector: React.FC<{
  variant?: "light" | "dark";
  compact?: boolean;
}> = ({ variant = "light", compact = false }) => {
  const { currency, setCurrency, language, setLanguage, detectedCountry, liveRates, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"languages" | "currency">("languages");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("All");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      // slight delay for auto-focus
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [open, activeTab]);

  const activeCurrency = CURRENCIES[currency] || CURRENCIES.NGN;
  const activeLanguage = LANGUAGES[language] || LANGUAGES.en;
  const isDark = variant === "dark";

  // Filter languages
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (Object.keys(LANGUAGES) as SupportedLanguage[]).filter((lKey) => {
      const lang = LANGUAGES[lKey];
      const matchesRegion =
        regionFilter === "All"
          ? true
          : regionFilter === "Global"
          ? lang.region === "Global"
          : regionFilter === "Africa"
          ? lang.region === "Africa"
          : regionFilter === "Europe"
          ? lang.region === "Europe"
          : regionFilter === "Asia"
          ? lang.region === "Asia" || lang.region === "Middle East"
          : lang.region === "Americas";

      if (!matchesRegion) return false;
      if (!q) return true;

      return (
        lang.nativeName.toLowerCase().includes(q) ||
        lang.label.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.countryCode.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, regionFilter]);

  // Filter currencies
  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (Object.keys(CURRENCIES) as SupportedCurrency[]).filter((cKey) => {
      const cur = CURRENCIES[cKey];
      if (!q) return true;
      return (
        cur.code.toLowerCase().includes(q) ||
        cur.name.toLowerCase().includes(q) ||
        cur.symbol.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const allLangCount = Object.keys(LANGUAGES).length;
  const allCurCount = Object.keys(CURRENCIES).length;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Modern High-End Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`notranslate group relative inline-flex items-center ${compact ? "gap-1.5 px-2.5 py-1 text-[11px]" : "gap-2 px-3 py-1.5 text-xs"} rounded-full font-semibold transition-all duration-200 border shadow-xs cursor-pointer select-none shrink-0 ${
          isDark
            ? "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700/80 hover:border-slate-600 focus:ring-2 focus:ring-emerald-500/40"
            : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-brand-blue/30"
        } ${open ? (isDark ? "ring-2 ring-emerald-500/50 border-emerald-500/60" : "ring-2 ring-blue-500/30 border-blue-400") : ""}`}
        title={`Active: ${currency} (${activeCurrency.symbol}) | Language: ${activeLanguage.nativeName} (${activeLanguage.label})`}
        aria-label="Currency and Language Selector"
      >
        {compact ? (
          <>
            <span className="flex items-center gap-1 font-bold tracking-tight">
              <CountryFlag countryCode={activeCurrency.countryCode} size={13} />
              <span className={isDark ? "text-white" : "text-slate-900"}>{currency}</span>
            </span>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>•</span>
            <span className="flex items-center gap-1">
              <CountryFlag countryCode={activeLanguage.countryCode} size={13} />
              <span className={`font-mono text-[10px] font-bold uppercase ${isDark ? "text-emerald-400" : "text-blue-700"}`}>
                {activeLanguage.code}
              </span>
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"}`}
            />
          </>
        ) : (
          <>
            {/* Currency Pill */}
            <span className="flex items-center gap-1.5 font-bold tracking-tight">
              <CountryFlag countryCode={activeCurrency.countryCode} size={15} />
              <span className={isDark ? "text-white" : "text-slate-900"}>{currency}</span>
              <span className="opacity-70 font-normal">({activeCurrency.symbol})</span>
            </span>

            {/* Divider */}
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>•</span>

            {/* Language Badge */}
            <span className="flex items-center gap-1.5">
              <CountryFlag countryCode={activeLanguage.countryCode} size={15} />
              <span className={`font-mono text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-emerald-400" : "text-blue-700"}`}>
                {activeLanguage.code}
              </span>
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"}`}
            />
          </>
        )}
      </button>

      {/* Floating Modal Popover */}
      {open && (
        <div
          className={`fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[410px] max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl z-[99999] border isolate overflow-hidden ${
            isDark
              ? "bg-[#0B1120] border-slate-700 text-white shadow-black/90 ring-1 ring-slate-700"
              : "bg-white border-slate-200 text-slate-900 shadow-2xl ring-1 ring-slate-200"
          } animate-in fade-in zoom-in-95 duration-150`}
          style={{ backgroundColor: isDark ? "#0B1120" : "#ffffff" }}
        >
          {/* Popover Header */}
          <div className="p-3.5 pb-2.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider font-heading flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>{t("currencyAndLanguage") || "Language & Currency"}</span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {activeLanguage.nativeName} • {activeCurrency.code} ({activeCurrency.symbol})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close selector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Switcher Tabs */}
          <div className="p-2.5 pb-2">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("languages")}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === "languages"
                    ? "bg-white dark:bg-slate-800 text-brand-blue dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t("languagesTab") || "Languages"}</span>
                <span className="text-[10px] py-0.2 px-1.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono">
                  {allLangCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("currency")}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === "currency"
                    ? "bg-white dark:bg-slate-800 text-brand-blue dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t("currencyTab") || "Currencies"}</span>
                <span className="text-[10px] py-0.2 px-1.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono">
                  {allCurCount}
                </span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "languages"
                    ? (t("searchLanguages") || "Search languages, countries...")
                    : (t("searchCurrencies") || "Search currency name or code...")
                }
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-emerald-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Region Chips (Languages View) */}
          {activeTab === "languages" && (
            <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              {["All", "Global", "Africa", "Asia", "Europe", "Americas"].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors font-medium cursor-pointer ${
                    regionFilter === reg
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {reg === "All"
                    ? (t("allRegions") || "All")
                    : reg === "Global"
                    ? (t("popularGlobal") || "Global")
                    : reg === "Africa"
                    ? (t("africanLanguages") || "Africa")
                    : reg}
                </button>
              ))}
            </div>
          )}

          {/* List Content */}
          <div className="px-3 pb-3 max-h-[300px] overflow-y-auto space-y-1">
            {activeTab === "languages" ? (
              filteredLanguages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No languages match &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {filteredLanguages.map((lKey) => {
                    const l = LANGUAGES[lKey];
                    const isSelected = language === lKey;
                    return (
                      <button
                        key={lKey}
                        type="button"
                        onClick={() => {
                          setLanguage(lKey);
                          setOpen(false);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40"
                              : "bg-blue-50/80 border-blue-300 text-blue-900 ring-1 ring-blue-400/40 shadow-xs"
                            : isDark
                            ? "bg-slate-900/40 hover:bg-slate-800 border-slate-800 text-slate-200"
                            : "bg-slate-50/60 hover:bg-slate-100 border-slate-200/70 text-slate-700"
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <CountryFlag countryCode={l.countryCode} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs truncate leading-tight">
                              {l.nativeName}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 ml-1" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {l.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : filteredCurrencies.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No currencies match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                {filteredCurrencies.map((cKey) => {
                  const c = CURRENCIES[cKey];
                  const isSelected = currency === cKey;
                  const rateToNgn = liveRates[cKey] || c.rateToNgn || 1;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => {
                        setCurrency(cKey);
                        setOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40"
                            : "bg-blue-50/80 border-blue-300 text-blue-900 ring-1 ring-blue-400/40 shadow-xs"
                          : isDark
                          ? "bg-slate-900/40 hover:bg-slate-800 border-slate-800 text-slate-200"
                          : "bg-slate-50/60 hover:bg-slate-100 border-slate-200/70 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CountryFlag countryCode={c.countryCode} size={22} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs">{c.code}</span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              ({c.symbol})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {c.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isSelected ? "Selected" : "Instant Settle"}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {t("detectedRegion") || "Region"}: <strong>{detectedCountry}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Instant Translation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
