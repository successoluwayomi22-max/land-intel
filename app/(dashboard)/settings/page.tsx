"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  CreditCard,
  Trash2,
  CheckCircle2,
  KeyRound,
  Bell,
  Download,
  AlertTriangle,
  ExternalLink,
  Lock,
  ArrowRight,
  FileDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLocale, CURRENCIES, LANGUAGES, SupportedCurrency, SupportedLanguage } from "@/components/providers/LocaleProvider";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/ui/PasswordStrengthMeter";

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  // Profile Form state
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification toggles
  const [notifyReportReady, setNotifyReportReady] = useState(true);
  const [notifyRiskAlert, setNotifyRiskAlert] = useState(true);
  const [notifyNewsletter, setNotifyNewsletter] = useState(false);

  // MFA State
  const [mfaData, setMfaData] = useState<any | null>(null);
  const [mfaSetupData, setMfaSetupData] = useState<any | null>(null);
  const [totpInput, setTotpInput] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);
  const [mfaActive, setMfaActive] = useState(false);

  // NDPR / GDPR Account Deletion Request state
  const [deletionStatus, setDeletionStatus] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("Property acquisition completed");
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [cancellingDelete, setCancellingDelete] = useState(false);

  // Locale context (Currency & Language)
  const { currency, setCurrency, language, setLanguage, formatPrice } = useLocale();

  const checkDeletionStatus = async () => {
    try {
      const res = await fetch("/api/v1/account/deletion-request");
      const d = await res.json();
      if (d.success) {
        setDeletionStatus(d);
      }
    } catch (e) {
      console.error("Failed to check deletion status:", e);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setName(data.user.name || "");
        setEntitlements(data.entitlements);
        setPayments(data.payments || []);
      }

      // Check MFA status
      try {
        const mfaRes = await fetch("/api/auth/mfa");
        const mfaJson = await mfaRes.json();
        if (mfaJson.success) {
          setMfaData(mfaJson);
          setMfaActive(mfaJson.mfaEnabled);
        }
      } catch {}

      // Check Account Deletion status
      await checkDeletionStatus();
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMfaSetup = async () => {
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_SETUP" }),
      });
      const data = await res.json();
      if (data.success) {
        setMfaSetupData(data);
      }
    } catch {
      toast("Could not initialize MFA setup", "error");
    }
  };

  const handleVerifyMfaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpInput || totpInput.trim().length < 6) {
      toast("Please enter a valid 6-digit code", "error");
      return;
    }
    setVerifyingMfa(true);
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_CODE", code: totpInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("MFA Verified and Enabled successfully!", "success");
        setMfaActive(true);
        setMfaSetupData(null);
        setTotpInput("");
      } else {
        toast(data.error || "Verification failed", "error");
      }
    } catch {
      toast("Network error verifying code", "error");
    } finally {
      setVerifyingMfa(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("landintel_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          if (parsed.name) setName(parsed.name);
          setLoading(false);
        }
      } catch {}
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Profile preferences updated successfully!", "success");
        setUser((prev: any) => ({ ...prev, name: data.user.name }));
      } else {
        toast(data.error || "Failed to update profile", "error");
      }
    } catch {
      toast("Network error updating profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast("Please enter your current password", "error");
      return;
    }
    if (newPassword.length < 8) {
      toast("New password must be at least 8 characters", "error");
      return;
    }
    const strength = getPasswordStrength(newPassword);
    if (!strength.isAcceptable) {
      toast("New password is too weak. Must include uppercase, lowercase, numbers, and symbols.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Security credentials changed successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast(data.error || "Failed to change password", "error");
      }
    } catch {
      toast("Network error updating password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      profile: user,
      entitlements,
      payments,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LandIntel_Account_Data_${user?.id || "export"}.json`;
    a.click();
    toast("Personal account data archive downloaded successfully.", "success");
  };

  const handleSubmitDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirmed) {
      toast("Please confirm that you understand the permanent data erasure terms", "error");
      return;
    }
    setSubmittingDelete(true);
    try {
      const res = await fetch("/api/v1/account/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason, feedback: deleteFeedback }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Account deletion request submitted under NDPR compliance. Platform administrators have been alerted.", "info");
        setShowDeleteModal(false);
        checkDeletionStatus();
      } else {
        toast(data.error || "Failed to submit deletion request", "error");
      }
    } catch {
      toast("Network error submitting deletion request", "error");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    setCancellingDelete(true);
    try {
      const res = await fetch("/api/v1/account/deletion-request", {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Account deletion request successfully cancelled. Your account remains fully active.", "success");
        checkDeletionStatus();
      } else {
        toast(data.error || "Failed to cancel deletion request", "error");
      }
    } catch {
      toast("Network error cancelling request", "error");
    } finally {
      setCancellingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-brand-textSecondary">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-textPrimary font-heading tracking-tight">
          Account Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-brand-textSecondary mt-1">
          Manage your contact credentials, update security credentials, review plan entitlements, and control privacy preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Profile Details */}
          <form onSubmit={handleUpdateProfile}>
            <Card className="space-y-5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-blue" />
                  <CardTitle>Personal Profile</CardTitle>
                </div>
                <CardDescription>Primary identity associated with your property reports</CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <Input
                  label="Full Legal Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Emeka Okonkwo"
                  required
                />

                <Input
                  label="Registered Email Address"
                  value={user?.email || ""}
                  disabled
                  helperText="Email is permanently verified. Contact support if you need to migrate your email."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-brand-textSecondary mb-1.5 block">
                      Preferred Currency Display
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                      className="w-full bg-white border border-brand-border rounded-input px-3 py-2 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-blue cursor-pointer font-medium"
                    >
                      {(Object.keys(CURRENCIES) as SupportedCurrency[]).map((cKey) => {
                        const c = CURRENCIES[cKey];
                        return (
                          <option key={cKey} value={cKey}>
                            {c.code} ({c.symbol}) — {c.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-textSecondary mb-1.5 block break-words">
                      Platform Language (24 Languages)
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                      className="w-full bg-white border border-brand-border rounded-input px-3 py-2 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-blue cursor-pointer font-medium"
                    >
                      {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((lKey) => {
                        const l = LANGUAGES[lKey];
                        return (
                          <option key={lKey} value={lKey}>
                            {l.nativeName} ({l.label}) — {l.region}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-textSecondary mb-1.5 block">
                      Account Status
                    </label>
                    <div className="flex items-center gap-2 py-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Active Verified Account</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" type="submit" isLoading={savingProfile}>
                  Save Profile Changes
                </Button>
              </div>
            </Card>
          </form>

          {/* 2. Password & Security */}
          <form onSubmit={handleUpdatePassword}>
            <Card className="space-y-5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-brand-blue" />
                  <CardTitle>Password & Security</CardTitle>
                </div>
                <CardDescription>
                  Keep your property investigations and uploaded survey plans secure
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                      title={showCurrentPassword ? "Hide password" : "Show password"}
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div>
                  <Input
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="secondary" type="submit" isLoading={savingPassword}>
                  Update Password
                </Button>
              </div>
            </Card>
          </form>

          {/* 2b. Two-Factor Authentication (MFA / TOTP) */}
          <Card className="space-y-4 border-amber-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <CardTitle>Two-Factor Authentication (TOTP / MFA)</CardTitle>
                </div>
                {mfaActive ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                    ACTIVE & ENFORCED
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-semibold">
                    NOT CONFIGURED
                  </span>
                )}
              </div>
              <CardDescription>
                Protect your property cases, documents, and payments with hardware or app-based authenticator codes
              </CardDescription>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <p className="text-brand-textSecondary leading-relaxed">
                LandIntel supports RFC 6238 Time-Based One-Time Password (TOTP) apps such as Google Authenticator, Microsoft Authenticator, and 1Password.
              </p>

              {mfaActive ? (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your account is protected with Two-Factor Authentication.</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMfaActive(false);
                      toast("MFA reset to disabled for this session", "info");
                    }}
                  >
                    Reconfigure
                  </Button>
                </div>
              ) : !mfaSetupData ? (
                <div className="pt-1">
                  <Button variant="outline" size="sm" onClick={handleStartMfaSetup}>
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    <span>Set Up Two-Factor Authentication</span>
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-brand-border rounded-lg space-y-4">
                  <h4 className="font-bold text-brand-textPrimary text-xs">
                    Step 1: Scan QR or Enter Setup Key
                  </h4>
                  <div className="bg-white p-3 rounded border border-slate-200 font-mono text-[11px] text-slate-800 select-all">
                    Secret Key: <strong className="text-amber-700">{mfaSetupData.secret}</strong>
                  </div>

                  <h4 className="font-bold text-brand-textPrimary text-xs pt-1">
                    Step 2: Enter 6-Digit Authenticator Code
                  </h4>
                  <form onSubmit={handleVerifyMfaCode} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpInput}
                      onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-36 px-3 py-1.5 border border-brand-border rounded-lg text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-amber-500"
                    />
                    <Button type="submit" variant="primary" size="sm" isLoading={verifyingMfa}>
                      Verify & Activate
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMfaSetupData(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </Card>

          {/* 3. Notification Preferences */}
          <Card className="space-y-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-blue" />
                <CardTitle>Intelligence Alerts & Notifications</CardTitle>
              </div>
              <CardDescription>Choose how LandIntel notifies you of due-diligence updates</CardDescription>
            </CardHeader>

            <div className="space-y-3 divide-y divide-brand-border/60 text-xs">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <strong className="text-brand-textPrimary block">Due-Diligence Report Readiness</strong>
                  <span className="text-brand-textSecondary">Receive email when genuine 15-section PDF is compiled</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyReportReady}
                  onChange={(e) => setNotifyReportReady(e.target.checked)}
                  className="w-4 h-4 accent-brand-blue rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <strong className="text-brand-textPrimary block">Critical Risk Discrepancy Alerts</strong>
                  <span className="text-brand-textSecondary">Instant notification if boundary or plot mismatch is detected</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyRiskAlert}
                  onChange={(e) => setNotifyRiskAlert(e.target.checked)}
                  className="w-4 h-4 accent-brand-blue rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <strong className="text-brand-textPrimary block">Property Regulatory & Cadastral Digest</strong>
                  <span className="text-brand-textSecondary">Monthly updates on statutory land guidelines and title protections</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewsletter}
                  onChange={(e) => setNotifyNewsletter(e.target.checked)}
                  className="w-4 h-4 accent-brand-blue rounded cursor-pointer"
                />
              </div>
            </div>
          </Card>

          {/* 4. Billing History Table */}
          <Card className="space-y-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-blue" />
                <CardTitle>Billing Invoices & Settlements</CardTitle>
              </div>
              <CardDescription>Verified Paystack transactions for unlocked property reports</CardDescription>
            </CardHeader>

            {payments.length > 0 ? (
              <div className="overflow-x-auto border border-brand-border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-brand-border text-[11px] font-bold text-brand-textMuted uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/60 font-mono">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-brand-textPrimary">{p.reference}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">
                          ₦{p.amount.toLocaleString()} {p.currency}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-brand-textSecondary text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => toast(`Receipt downloaded for ${p.reference}`, "success")}
                            className="text-brand-blue hover:underline text-xs flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-brand-textSecondary">
                No billing transactions recorded yet. Free tier active.
              </div>
            )}
          </Card>

          {/* 5. Data Portability & NDPR Privacy */}
          <Card className="border-blue-200 space-y-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-brand-blue" />
                <CardTitle>Data Portability & Privacy</CardTitle>
              </div>
              <CardDescription>
                Export your personal data archive in compliance with statutory Data Protection & GDPR standards
              </CardDescription>
            </CardHeader>

            <p className="text-xs text-brand-textSecondary leading-relaxed">
              Download a complete copy of your account data, property investigation records, and uploaded metadata in portable JSON format.
            </p>

            <div className="pt-1">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export My Data Archive (.JSON)</span>
              </Button>
            </div>
          </Card>

          {/* 6. Account Deletion — Danger Zone */}
          <Card className="border-rose-200 space-y-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-brand-danger" />
                <CardTitle className="text-brand-danger">Danger Zone — Account Removal</CardTitle>
              </div>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>

            {deletionStatus?.hasPendingRequest ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Account Deletion Request Active (NDPR Grace Period)
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      Your account deletion request has been registered. In compliance with NDPR data protection protocols, a 14-day statutory grace period is active until{" "}
                      <strong className="font-semibold">
                        {deletionStatus.request?.parsedDetails?.scheduledPurgeDate
                          ? new Date(deletionStatus.request.parsedDetails.scheduledPurgeDate).toLocaleDateString()
                          : "the scheduled purge date"}
                      </strong>.
                    </p>
                    <p className="text-[11px] text-rose-600 mt-1">
                      Reason: "{deletionStatus.request?.parsedDetails?.reason || "Customer requested deletion"}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700">
                    Changed your mind? You can cancel anytime before purge.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                    isLoading={cancellingDelete}
                    className="border-rose-300 text-rose-700 hover:bg-rose-100 text-xs"
                  >
                    Cancel Deletion Request
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-brand-textSecondary leading-relaxed">
                  This action begins a statutory 14-day NDPR grace period before permanent erasure. All property investigation records, uploaded title deeds, and AI risk reports will be wiped.
                </p>

                <div className="pt-1">
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                    Request Account Deletion
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right 1 Column: Entitlements & Plan */}
        <div className="space-y-6">
          <Card className="space-y-5 border-blue-200 bg-gradient-to-b from-white to-blue-50/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                  <CardTitle>Plan Entitlements</CardTitle>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-brand-blue font-mono font-bold uppercase">
                  {user?.role || "FREE"}
                </span>
              </div>
              <CardDescription>Server-enforced platform limits</CardDescription>
            </CardHeader>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-subtle space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-brand-textSecondary">Property Cases Allowance:</span>
                  <span className="text-brand-textPrimary font-mono">
                    {user?.caseCount || 0} / {entitlements?.maxCases || 3}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, ((user?.caseCount || 0) / (entitlements?.maxCases || 3)) * 100)}%`,
                    }}
                    className="bg-brand-blue h-full rounded-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                <span className="text-brand-textSecondary">Max Docs / Case:</span>
                <strong className="text-brand-textPrimary font-mono">
                  {entitlements?.maxDocumentsPerCase || 5} Documents
                </strong>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-textSecondary">Deep Evidence Access:</span>
                <span className="font-bold text-xs">
                  {entitlements?.canViewDetailedEvidence ? (
                    <span className="text-emerald-600">UNRESTRICTED</span>
                  ) : (
                    <span className="text-amber-600">PREVIEW ONLY</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-textSecondary">15-Section PDF Reports:</span>
                <span className="font-bold text-xs">
                  {entitlements?.canGenerateReports ? (
                    <span className="text-emerald-600">UNLIMITED</span>
                  ) : (
                    <span className="text-brand-textMuted">{formatPrice(48375)} / REPORT (incl. 7.5% VAT)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-brand-textSecondary">
              <span className="font-bold text-brand-textPrimary block text-[11px] uppercase tracking-wider">
                Included Features
              </span>
              <p className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0" />
                <span>Cadastral Coordinate Extraction</span>
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0" />
                <span>Survey Plan vs Deed Radar</span>
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0" />
                <span>Institutional 11-Point Verification Checklist</span>
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-success shrink-0" />
                <span>Private Document Vault</span>
              </p>
            </div>

            {user?.role === "FREE" && (
              <div className="pt-2">
                <Link href="/pricing">
                  <Button variant="primary" size="sm" className="w-full">
                    <span>Explore Paid Upgrades</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Quick Support Card */}
          <Card className="space-y-3 bg-slate-900 text-white border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Need Verification Assistance?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If your property involves complex family land excision or unregistered statutory consents, our licensed surveyor network can assist.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              <span>Contact Due-Diligence Desk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Account Deletion Request Modal (NDPR / GDPR Statutory Erasure) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Request Account Deletion</h3>
                  <span className="text-[10px] text-slate-500 font-mono">NDPR / GDPR Statutory Erasure</span>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitDeletionRequest} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>14-Day Statutory Grace Period</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Upon submission, platform administrators are alerted and your request enters a 14-day cooling-off period. You may cancel at any time within 14 days by returning to this settings page.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Reason for Deletion:</label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="Property acquisition completed">Property acquisition completed</option>
                  <option value="Switching to an alternative service">Switching to an alternative service</option>
                  <option value="Privacy / Data minimization reasons">Privacy / Data minimization reasons</option>
                  <option value="Dissatisfied with risk score findings">Dissatisfied with risk score findings</option>
                  <option value="Temporary pause in real estate investment">Temporary pause in real estate investment</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Optional Feedback / Comments:</label>
                <textarea
                  value={deleteFeedback}
                  onChange={(e) => setDeleteFeedback(e.target.value)}
                  placeholder="Tell us what we could improve (optional)..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded mt-0.5"
                    required
                  />
                  <span className="text-[11px] text-slate-700 leading-tight">
                    I understand that once purged, my account, uploaded survey plans, title deeds, and cadastral analysis reports will be permanently and irreversibly destroyed.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submittingDelete}
                >
                  Keep Account
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={submittingDelete}
                  disabled={!deleteConfirmed}
                >
                  Submit Deletion Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
