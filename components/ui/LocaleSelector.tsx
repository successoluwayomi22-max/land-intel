"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Globe, DollarSign, Search, X, MapPin } from "lucide-react";
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

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock background scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Reset search and auto-focus input on open
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
    <div
      className="relative inline-block text-left notranslate"
      translate="no"
      ref={dropdownRef}
    >
      {/* Modern High-End Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            (window as any).__landintel_load_translate?.();
          }
          setOpen(!open);
        }}
        onMouseEnter={() => {
          if (typeof window !== "undefined") {
            (window as any).__landintel_load_translate?.();
          }
        }}
        onFocus={() => {
          if (typeof window !== "undefined") {
            (window as any).__landintel_load_translate?.();
          }
        }}
        className={`notranslate group relative inline-flex items-center ${
          compact ? "gap-1.5 px-2.5 py-1 text-[11px]" : "gap-2 px-3 py-1.5 text-xs"
        } rounded-full font-semibold transition-all duration-200 border shadow-xs cursor-pointer select-none shrink-0 ${
          isDark
            ? "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700/80 hover:border-slate-600 focus:ring-2 focus:ring-emerald-500/40"
            : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-emerald-500/30"
        } ${
          open
            ? isDark
              ? "ring-2 ring-emerald-500/50 border-emerald-500/60"
              : "ring-2 ring-emerald-500/40 border-emerald-500/50 shadow-sm"
            : ""
        }`}
        title={`Active: ${currency} (${activeCurrency.symbol}) | Language: ${activeLanguage.nativeName} (${activeLanguage.label})`}
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
              <span
                className={`font-mono text-[10px] font-bold uppercase ${
                  isDark ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {activeLanguage.code}
              </span>
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                open ? "rotate-180 text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"
              }`}
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
              <span
                className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {activeLanguage.code}
              </span>
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                open ? "rotate-180 text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"
              }`}
            />
          </>
        )}
      </button>

      {/* Centered Modal Dialog & Backdrop Overlay (Fits any screen height/width) */}
      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("currencyAndLanguage") || "Currency & Language Selector"}
        >
          {/* Modal Card Container */}
          <div
            translate="no"
            onClick={(e) => e.stopPropagation()}
            className={`notranslate w-full max-w-[460px] max-h-[85vh] max-h-[85dvh] sm:max-h-[80vh] sm:max-h-[80dvh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
              isDark
                ? "bg-[#0B1120] border-slate-700/80 text-white shadow-black/90 ring-1 ring-slate-700/60"
                : "bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-950/25 ring-1 ring-slate-200/80"
            } animate-in fade-in zoom-in-95 duration-150`}
            style={{ backgroundColor: isDark ? "#0B1120" : "#ffffff" }}
          >
            {/* Popover Header */}
            <div className="shrink-0 p-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider font-heading flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <span>{t("currencyAndLanguage") || "Currency & Language"}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
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
            <div className="shrink-0 px-4 pt-3 pb-2.5">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("languages")}
                  className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    activeTab === "languages"
                      ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xs border border-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("languagesTab") || "Languages"}</span>
                  <span
                    className={`text-[10px] py-0.5 px-1.5 rounded-full font-mono font-bold ${
                      activeTab === "languages"
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {allLangCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("currency")}
                  className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    activeTab === "currency"
                      ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-xs border border-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("currencyTab") || "Currencies"}</span>
                  <span
                    className={`text-[10px] py-0.5 px-1.5 rounded-full font-mono font-bold ${
                      activeTab === "currency"
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {allCurCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="shrink-0 px-4 pb-2.5">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "languages"
                      ? t("searchLanguages") || "Search languages, countries..."
                      : t("searchCurrencies") || "Search currency name or code..."
                  }
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Region Filter Chips (Languages View) */}
            {activeTab === "languages" && (
              <div className="shrink-0 px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                {["All", "Global", "Africa", "Asia", "Europe", "Americas"].map((reg) => {
                  const isSelected = regionFilter === reg;
                  return (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setRegionFilter(reg)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-semibold text-xs cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold shadow-xs scale-[1.02]"
                          : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {reg === "All"
                        ? t("allRegions") || "All"
                        : reg === "Global"
                        ? t("popularGlobal") || "Global"
                        : reg === "Africa"
                        ? t("africanLanguages") || "African & Diaspora"
                        : reg}
                    </button>
                  );
                })}
              </div>
            )}

            {/* List Content (Dynamically sized to fill remaining vertical height) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 space-y-1.5 custom-scrollbar">
              {activeTab === "languages" ? (
                filteredLanguages.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                    <p>No languages match &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setRegionFilter("All");
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold underline text-xs"
                    >
                      Clear search filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
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
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                            isSelected
                              ? isDark
                                ? "bg-emerald-950/40 border-emerald-500/60 text-white ring-1 ring-emerald-500/50 shadow-xs"
                                : "bg-emerald-50/90 border-emerald-500/50 text-emerald-950 ring-1 ring-emerald-500/30 shadow-xs"
                              : isDark
                              ? "bg-slate-900/50 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-200"
                              : "bg-slate-50/70 hover:bg-white hover:border-emerald-500/40 hover:shadow-xs border-slate-200/80 text-slate-800"
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
                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-1 shadow-2xs">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5 font-medium">
                              {l.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : filteredCurrencies.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                  <p>No currencies match &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold underline text-xs"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredCurrencies.map((cKey) => {
                    const c = CURRENCIES[cKey];
                    const isSelected = currency === cKey;
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => {
                          setCurrency(cKey);
                          setOpen(false);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl text-left transition-all border cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-emerald-950/40 border-emerald-500/60 text-white ring-1 ring-emerald-500/50 shadow-xs"
                              : "bg-emerald-50/90 border-emerald-500/50 text-emerald-950 ring-1 ring-emerald-500/30 shadow-xs"
                            : isDark
                            ? "bg-slate-900/50 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-200"
                            : "bg-slate-50/70 hover:bg-white hover:border-emerald-500/40 hover:shadow-xs border-slate-200/80 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CountryFlag countryCode={c.countryCode} size={22} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-slate-900 dark:text-white">
                                {c.code}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                ({c.symbol})
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                              {c.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold"
                                : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                            }`}
                          >
                            {isSelected ? "Active" : "Instant Settle"}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="shrink-0 px-4 py-2.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t("detectedRegion") || "Region"}:{" "}
                  <strong className="text-slate-900 dark:text-white">{detectedCountry}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{allLangCount} Languages • Live FX</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocaleSelector;
