"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { APP_CONFIG } from "@/lib/config";
import type { PlatformContactSettings } from "@/lib/settings";

interface PlatformContactContextValue {
  contact: PlatformContactSettings;
  isLoading: boolean;
  isSaving: boolean;
  updateContact: (data: Partial<PlatformContactSettings>) => Promise<{ success: boolean; error?: string }>;
  refreshContact: () => Promise<void>;
}

const defaultContactValue: PlatformContactSettings = {
  email: APP_CONFIG.platformContact.email,
  displayEmail: APP_CONFIG.platformContact.displayEmail,
  whatsappNumbers: [...APP_CONFIG.platformContact.whatsappNumbers],
  primaryWhatsapp: APP_CONFIG.platformContact.primaryWhatsapp,
  secondaryWhatsapp: APP_CONFIG.platformContact.secondaryWhatsapp,
  facebook: APP_CONFIG.platformContact.facebook,
  facebookUrl: APP_CONFIG.platformContact.facebookUrl,
  instagram: APP_CONFIG.platformContact.instagram,
  instagramUrl: APP_CONFIG.platformContact.instagramUrl,
  supportAvailability: APP_CONFIG.platformContact.supportAvailability,
  supportMessage: APP_CONFIG.platformContact.supportMessage,
};

const PlatformContactContext = createContext<PlatformContactContextValue>({
  contact: defaultContactValue,
  isLoading: false,
  isSaving: false,
  updateContact: async () => ({ success: false, error: "Provider not mounted" }),
  refreshContact: async () => {},
});

export function PlatformContactProvider({ children }: { children: React.ReactNode }) {
  const [contact, setContact] = useState<PlatformContactSettings>(defaultContactValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContact = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/contact", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          setContact((prev) => ({
            ...prev,
            ...json.data,
          }));
        }
      }
    } catch (err) {
      console.warn("[PlatformContactProvider] Could not load dynamic contact config:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContact();

    const handleUpdate = (e: CustomEvent<PlatformContactSettings>) => {
      if (e.detail) {
        setContact((prev) => ({ ...prev, ...e.detail }));
      }
    };

    window.addEventListener("landintel:contact-updated" as any, handleUpdate as any);
    return () => {
      window.removeEventListener("landintel:contact-updated" as any, handleUpdate as any);
    };
  }, [fetchContact]);

  const updateContact = useCallback(
    async (data: Partial<PlatformContactSettings>): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsSaving(true);
        const res = await fetch("/api/v1/contact", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: json?.error?.message || "Failed to update contact channels",
          };
        }

        if (json?.data?.contact) {
          const updated = json.data.contact;
          setContact((prev) => ({ ...prev, ...updated }));
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("landintel:contact-updated", { detail: updated })
            );
          }
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network communication failed" };
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return (
    <PlatformContactContext.Provider
      value={{
        contact,
        isLoading,
        isSaving,
        updateContact,
        refreshContact: fetchContact,
      }}
    >
      {children}
    </PlatformContactContext.Provider>
  );
}

export function usePlatformContact() {
  const ctx = useContext(PlatformContactContext);
  return ctx;
}
