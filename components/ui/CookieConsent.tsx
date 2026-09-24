"use client";

import React, { useState, useEffect } from "react";
import { Shield, Check, X, Settings } from "lucide-react";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    try {
      const consent = localStorage.getItem("landintel_cookie_consent");
      if (!consent) {
        // Delay showing banner slightly for smooth presentation
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem("landintel_cookie_consent", JSON.stringify(prefs));
      document.cookie = `landintel_consent=true; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  };

  const handleRejectNonessential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0B132B] text-white border border-slate-700/80 rounded-2xl shadow-2xl p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-blue/20 text-brand-blue shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>

          <div className="flex-1 text-xs">
            <h4 className="text-sm font-bold text-white mb-1">Privacy &amp; Cookie Preferences</h4>
            <p className="text-slate-300 leading-relaxed mb-3">
              We use essential cookies to maintain secure authentication and due-diligence sessions. Non-essential cookies help optimize cadastral verification performance under GDPR and applicable privacy regulations.
            </p>

            {showPreferences && (
              <div className="space-y-2 mb-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">Strictly Necessary</span>
                    <p className="text-[11px] text-slate-400">Required for session security and document access</p>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">ALWAYS ON</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-200">Analytics &amp; Cadastral Performance</span>
                    <p className="text-[11px] text-slate-400">Helps us monitor document OCR latency and telemetry</p>
                  </div>
                  <input
                    id="analytics-cookies"
                    aria-label="Analytics & Cadastral Performance telemetry"
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="rounded border-slate-700 text-brand-blue focus:ring-brand-blue h-4 w-4"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-xs"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleRejectNonessential}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700"
              >
                Reject Non-Essential
              </button>
              {showPreferences ? (
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Save Choices
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
