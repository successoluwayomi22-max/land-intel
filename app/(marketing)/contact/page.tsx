"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Mail,
  MessageSquare,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePlatformContact } from "@/components/providers/PlatformContactProvider";

export default function ContactPage() {
  const { toast } = useToast();
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "PROPERTY_ANALYSIS",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSubmittedTicket(data.data.ticketNumber);
        toast(`Support request ${data.data.ticketNumber} registered successfully!`, "success");
        setFormData({
          name: "",
          email: "",
          category: "PROPERTY_ANALYSIS",
          subject: "",
          message: "",
        });
      } else {
        toast(data.error?.message || "Failed to submit request.", "error");
      }
    } catch (err: any) {
      toast("Error submitting support inquiry.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const { contact } = usePlatformContact();

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("contactDesk") || "Centralized Support & Verification Desk"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            {t("connectIntelligence") || "Connect with LandIntel Intelligence"}
          </h1>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            {t("contactSubtitle") ||
              "Direct access to our senior cadastral analysts, legal search directors, and investor support operations."}
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Primary Email */}
          <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">
                {t("supportEmailLabel") || "Official Email"}
              </h4>
              <p className="text-xs text-brand-textSecondary font-mono break-all">{contact.displayEmail || "support@landintel.ai"}</p>
            </div>
            <a
              href={`mailto:${contact.email || "successoluwayomi22@gmail.com"}?subject=LandIntel%20Property%20Due-Diligence%20Inquiry`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 pt-2 border-t border-slate-100"
            >
              Compose Email <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Primary WhatsApp */}
          <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">
                  {t("primaryWhatsapp") || "WhatsApp Primary"}
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {t("available247") || "24/7 Fast"}
                </span>
              </div>
              <p className="text-xs text-brand-textSecondary font-mono font-semibold">{contact.primaryWhatsapp}</p>
            </div>
            <a
              href={`https://wa.me/${contact.primaryWhatsapp.replace(/[^0-9]/g, "")}?text=Hello%20LandIntel%20Support%2C%20I%20need%20assistance%20with%20a%20property%20due-diligence%20case.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2 border-t border-slate-100"
            >
              Chat on WhatsApp <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Secondary WhatsApp */}
          <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">
                {t("secondaryWhatsapp") || "WhatsApp Secondary"}
              </h4>
              <p className="text-xs text-brand-textSecondary font-mono font-semibold">{contact.secondaryWhatsapp}</p>
            </div>
            <a
              href={`https://wa.me/${contact.secondaryWhatsapp.replace(/[^0-9]/g, "")}?text=Hello%20LandIntel%20Support%2C%20I%20need%20verification%20assistance.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-2 border-t border-slate-100"
            >
              Direct Message <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Social Channels */}
          <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-brand-textPrimary uppercase tracking-wider">
                {t("socialMediaChannels") || "Social Channels"}
              </h4>
              <div className="text-xs text-slate-700 space-y-0.5">
                <p><span className="font-semibold">FB:</span> {contact.facebook}</p>
                <p><span className="font-semibold">IG:</span> @{contact.instagram}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700 pt-2 border-t border-slate-100">
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Facebook</a>
              <span>•</span>
              <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a>
            </div>
          </div>
        </div>

        {/* Ticket Submission / Inquiry Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-5 lg:col-span-1">
            <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-brand-darkNavy font-heading">
                Support & Escalation Protocol
              </h3>
              <p className="text-xs text-brand-textSecondary leading-relaxed">
                {contact.supportMessage}
              </p>
              <div className="space-y-2.5 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Average response time: <strong>&lt; 30 minutes</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Certified Surveyors & Land Lawyers available</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Direct admin oversight on flagged properties</span>
                </div>
              </div>
            </div>

            {submittedTicket && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-card p-5 space-y-2 text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm">Ticket Dispatched to Admin</span>
                </div>
                <p className="text-xs">
                  Your ticket reference is <strong className="font-mono">{submittedTicket}</strong>. An email notification was routed to our central administrative desk at <span className="font-mono text-[11px]">{contact.email}</span>.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-brand-darkNavy font-heading">
                    {t("submitInquiry") || "Submit Property Support Inquiry"}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Reference: DL-SUP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t("fullName") || "Full Name"}
                    placeholder="e.g. Oluwayomi Succe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label={t("emailAddress") || "Email Address"}
                    type="email"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                      {t("inquiryCategory") || "Inquiry Category"}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-input text-xs font-medium text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="PROPERTY_ANALYSIS">{t("propertyAnalysisHelp") || "Property Due-Diligence & Cadastral Analysis"}</option>
                      <option value="VERIFICATION">{t("cadastralBeaconDiscrepancy") || "Title Search & Boundary Verification"}</option>
                      <option value="DOCUMENT">Document Upload or OCR Classification Issue</option>
                      <option value="PAYMENT">{t("paymentReportUnlock") || "Report Purchase & Invoice Payment"}</option>
                      <option value="PROFESSIONAL_REVIEW">Request Professional Surveyor Inspection</option>
                      <option value="ACCOUNT">Account & Organization Access</option>
                    </select>
                  </div>

                  <Input
                    label={t("subject") || "Subject"}
                    placeholder="e.g. Coordinate discrepancy in boundary survey plan"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                    {t("detailedMessage") || "Detailed Message"}
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide specific details, plot numbers, beacon coordinates, or any issues you are experiencing..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-input text-xs text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    required
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={submitting}
                  className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold"
                >
                  <Send className="w-4 h-4" />
                  {t("sendInquiry") || "Dispatch Support Request"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
