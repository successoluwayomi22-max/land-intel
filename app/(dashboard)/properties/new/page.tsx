"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, CheckCircle2, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { APP_CONFIG } from "@/lib/config";
import { useLocale, CURRENCIES } from "@/components/providers/LocaleProvider";

const COUNTRIES = [
  { code: "NG", name: "Nigeria 🇳🇬", regionLabel: "State", districtLabel: "Local Government Area (LGA)", defaultRegion: "Lagos", placeholderDistrict: "e.g. Eti-Osa, Lekki, Ikeja, Abuja Municipal" },
  { code: "GB", name: "United Kingdom 🇬🇧", regionLabel: "Country / Region", districtLabel: "Borough / District", defaultRegion: "Greater London", placeholderDistrict: "e.g. Westminster, Camden, Manchester" },
  { code: "US", name: "United States 🇺🇸", regionLabel: "State", districtLabel: "County / Municipality", defaultRegion: "Texas", placeholderDistrict: "e.g. Harris County, Travis County" },
  { code: "CA", name: "Canada 🇨🇦", regionLabel: "Province", districtLabel: "Municipality / District", defaultRegion: "Ontario", placeholderDistrict: "e.g. City of Toronto, Peel Region" },
  { code: "GH", name: "Ghana 🇬🇭", regionLabel: "Region", districtLabel: "District / Municipality", defaultRegion: "Greater Accra", placeholderDistrict: "e.g. Accra Metropolitan, Tema" },
  { code: "KE", name: "Kenya 🇰🇪", regionLabel: "County", districtLabel: "Sub-County / Ward", defaultRegion: "Nairobi", placeholderDistrict: "e.g. Westlands, Kilimani, Lang'ata" },
  { code: "ZA", name: "South Africa 🇿🇦", regionLabel: "Province", districtLabel: "Municipality / District", defaultRegion: "Gauteng", placeholderDistrict: "e.g. City of Johannesburg, Cape Town" },
  { code: "AE", name: "United Arab Emirates 🇦🇪", regionLabel: "Emirate", districtLabel: "Sector / Community", defaultRegion: "Dubai", placeholderDistrict: "e.g. Downtown Dubai, Business Bay" },
  { code: "AU", name: "Australia 🇦🇺", regionLabel: "State / Territory", districtLabel: "LGA / Council", defaultRegion: "New South Wales", placeholderDistrict: "e.g. City of Sydney, Parramatta" },
  { code: "DE", name: "Germany 🇩🇪", regionLabel: "Federal State (Bundesland)", districtLabel: "District (Landkreis / Stadt)", defaultRegion: "Berlin", placeholderDistrict: "e.g. Mitte, Charlottenburg" },
  { code: "FR", name: "France 🇫🇷", regionLabel: "Region / Department", districtLabel: "Commune / Arrondissement", defaultRegion: "Île-de-France", placeholderDistrict: "e.g. Paris 8e, Nice" },
  { code: "ES", name: "Spain 🇪🇸", regionLabel: "Autonomous Community", districtLabel: "Province / Municipality", defaultRegion: "Madrid", placeholderDistrict: "e.g. Madrid, Barcelona, Malaga" },
  { code: "OTHER", name: "Other / International 🌐", regionLabel: "State / Province / Region", districtLabel: "County / District / City", defaultRegion: "", placeholderDistrict: "e.g. Central District" },
];

export default function NewPropertyCasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState("NG");

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const [formData, setFormData] = useState({
    title: "",
    state: "Lagos",
    lga: "",
    address: "",
    propertyType: "LAND",
    purchasePrice: "",
    sellerName: "",
    agentName: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCountryCode(code);
    const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    setFormData((prev) => ({
      ...prev,
      state: country.defaultRegion || "",
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.length < 3) {
      newErrors.title = "Enter a valid property title (at least 3 characters)";
    }
    if (!formData.state.trim()) {
      newErrors.state = `Enter or select a valid ${selectedCountry.regionLabel}`;
    }
    if (!formData.lga.trim()) {
      newErrors.lga = `Enter the ${selectedCountry.districtLabel}`;
    }
    if (!formData.address.trim() || formData.address.length < 5) {
      newErrors.address = "Enter a specific street address or landmark location";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { currency } = useLocale();
  const activeCurrConfig = CURRENCIES[currency] || CURRENCIES.NGN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const rawPrice = formData.purchasePrice ? parseFloat(formData.purchasePrice) : null;
      // Convert to NGN standard baseline for backend risk engine if entered in foreign currency
      const priceInNgn = rawPrice ? (currency === "NGN" ? rawPrice : rawPrice * activeCurrConfig.rateToNgn) : null;

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          purchasePrice: priceInNgn,
          currency,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to create property case", "error");
        setSubmitting(false);
        return;
      }

      toast("Property case created successfully! Upload documents to begin analysis.", "success");
      router.push(`/properties/${data.case.id}`);
    } catch (err) {
      console.error(err);
      toast("A network error occurred. Please try again.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-brand-textPrimary font-heading tracking-tight">
          Create Property Due-Diligence Case
        </h1>
        <p className="text-xs sm:text-sm text-brand-textSecondary mt-1">
          Provide the baseline property details. In the next step, you will upload Survey Plans, Deeds, and Title Documents for automated cross-document intelligence.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>1. Property Information</CardTitle>
            <CardDescription>Primary cadastral location and transaction details</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Property Identifier / Name"
                placeholder="e.g. Cadastral Sector 4 Residential Parcel 24B"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary mb-1.5">
                  Country / Jurisdiction <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  <select
                    value={countryCode}
                    onChange={handleCountryChange}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-input text-sm font-medium text-brand-darkNavy focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-all cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary mb-1.5">
                  {selectedCountry.regionLabel} <span className="text-brand-danger">*</span>
                </label>
                {countryCode === "NG" ? (
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-input text-sm font-medium text-brand-darkNavy focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-all cursor-pointer"
                    >
                      {APP_CONFIG.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <Input
                    placeholder={`e.g. ${selectedCountry.defaultRegion || "Enter region"}`}
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                  />
                )}
              </div>

              <Input
                label={selectedCountry.districtLabel}
                placeholder={selectedCountry.placeholderDistrict}
                name="lga"
                value={formData.lga}
                onChange={handleChange}
                error={errors.lga}
                required
              />
            </div>

            <Input
              label="Full Address / Location Description"
              placeholder="e.g. Parcel 42, Block 8, Outer Perimeter Way"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary mb-1.5">
                  Property Category
                </label>
                <div className="relative">
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-input text-sm font-medium text-brand-darkNavy focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs transition-all cursor-pointer"
                  >
                    {APP_CONFIG.propertyTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <Input
                label={`Target Purchase Price (${currency} ${activeCurrConfig.symbol})`}
                placeholder={currency === "NGN" ? "e.g. 120000000" : "e.g. 80000"}
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                helperText="Used to calibrate financial risk magnitude and transaction limits"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary mb-3">
              2. Known Vendor / Intermediary Information (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Vendor / Seller Disclosed Name"
                placeholder="e.g. Chief Adewale Balogun"
                name="sellerName"
                value={formData.sellerName}
                onChange={handleChange}
              />
              <Input
                label="Real Estate Agent / Broker"
                placeholder="e.g. Prime Realty Partners Ltd"
                name="agentName"
                value={formData.agentName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-textSecondary mb-3">
              3. GPS Cadastral Coordinates (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Latitude (e.g. 40.7128)"
                placeholder="40.7128"
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
              />
              <Input
                label="Longitude (e.g. -74.0060)"
                placeholder="-74.0060"
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary mb-1.5">
              Additional Notes / Background Information
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Include any known history (e.g. vendor claims land is excised, formal deed offered, statutory certificate in progress)..."
              className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-input text-sm text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div className="pt-4 border-t border-brand-border flex items-center justify-end gap-3">
            <Link href="/dashboard">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Create Property Case & Proceed
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
