"use client";

import React from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY } from "@/lib/security/public-credentials";

interface MapProviderProps {
  children: React.ReactNode;
}

const apiKey = GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[300px] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
        <div className="text-center space-y-2 p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Maps Unavailable</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Set <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable interactive maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      {children}
    </APIProvider>
  );
};
