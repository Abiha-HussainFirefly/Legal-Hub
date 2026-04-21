"use client";

import {
  persistTheme,
  readStoredTheme,
  resolveTheme,
  THEME_EVENT_NAME,
  type ThemeMode,
} from "@/lib/theme";
import { ArrowLeft, Eye, EyeOff, Monitor, Moon, Pencil, ShieldCheck, SunMedium } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ProfileSaveResult {
  success: boolean;
}

interface ProfilePageProps {
  user: {
    name: string;
    email: string;
    occupation?: string;
    avatarUrl?: string;
  };
  variant?: "lawyer" | "admin";
  onSave?: (
    data: { name: string } | { currentPassword: string; newPassword: string }
  ) => Promise<ProfileSaveResult>;
}

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";
const OCCUPATION_OPTIONS = [
  "Other",
  "Lawyer",
  "Advocate",
  "Legal Consultant",
  "Paralegal",
  "Law Student",
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function ThemeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-[var(--primary)] text-white shadow-[0_14px_28px_rgba(76,47,94,0.18)]"
          : "bg-transparent text-[var(--foreground)] hover:bg-[var(--background-surface)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function ProfilePage({
  user,
  variant = "lawyer",
  onSave,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const [showPasswords, setShowPasswords] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [formData, setFormData] = useState({
    name: user.name,
    occupation: user.occupation ?? "Other",
  });
  const [displayData, setDisplayData] = useState({
    name: user.name,
    occupation: user.occupation ?? "Other",
  });
  const [passwordForm, setPasswordForm] = useState<Record<PasswordField, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const occupation = user.occupation ?? "Other";
    setFormData({ name: user.name, occupation });
    setDisplayData({ name: user.name, occupation });
  }, [user]);

  useEffect(() => {
    const syncThemeState = () => {
      const stored = readStoredTheme();
      setThemePreference(stored);
      setResolvedTheme(resolveTheme(stored));
    };

    syncThemeState();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (readStoredTheme() === "system") syncThemeState();
    };
    const handleThemeChange = () => syncThemeState();

    mediaQuery.addEventListener("change", handleSystemChange);
    window.addEventListener(THEME_EVENT_NAME, handleThemeChange as EventListener);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener(THEME_EVENT_NAME, handleThemeChange as EventListener);
    };
  }, []);

  const passwordFields: Array<{ label: string; field: PasswordField }> = [
    { label: "Current Password", field: "currentPassword" },
    { label: "New Password", field: "newPassword" },
    { label: "Confirm Password", field: "confirmPassword" },
  ];

  const roleLabel = variant === "admin" ? "Administrator" : "Lawyer";
  const themeSummary =
    themePreference === "system"
      ? `System mode is active and currently using ${resolvedTheme}.`
      : `${themePreference[0].toUpperCase()}${themePreference.slice(1)} mode is active.`;

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false });
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemePreference(mode);
    setResolvedTheme(resolveTheme(mode));
    persistTheme(mode);
  };

  const togglePasswordVisibility = (field: PasswordField) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) { alert("Name cannot be empty"); return; }
    setIsSaving(true);
    try {
      if (onSave) await onSave({ name: formData.name.trim() });
      setDisplayData({ name: formData.name.trim(), occupation: formData.occupation });
      setIsEditing(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to update profile. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordForm.currentPassword) return alert("Please enter your current password");
    if (!passwordForm.newPassword) return alert("Please enter a new password");
    if (passwordForm.newPassword.length < 8) return alert("New password must be at least 8 characters");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert("New passwords do not match");
    setIsSaving(true);
    try {
      if (onSave) await onSave({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (error: unknown) {
      alert(getErrorMessage(error, "Failed to update password. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const resetEditState = () => {
    setIsEditing(false);
    setFormData({ name: displayData.name, occupation: displayData.occupation });
  };

  return (
    <div className="min-h-screen bg-[var(--background-page)]">
      <div className="mx-auto max-w-[1180px] px-6 pb-2 pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {variant === "lawyer" ? (
              <Link
                href="/discussions"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] text-[var(--foreground)] shadow-[var(--shadow-card)] transition hover:bg-[var(--background-card-nested)]"
                aria-label="Back to discussions"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : null}
            <h1 className="text-[20px] font-semibold text-[var(--heading)]">Profile Settings</h1>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2 text-sm text-[var(--foreground)] shadow-[var(--shadow-card)]">
            <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
            {roleLabel}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-6">
        <div className="rounded-[40px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-6 shadow-[var(--shadow-card)] md:p-8">
          <section>
            <div className="flex flex-col gap-5 border-b border-[var(--border-subtle)] pb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,var(--gradient-start),var(--gradient-end))] text-lg font-semibold text-white">
                  {displayData.name.trim().slice(0, 1).toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-[22px] font-semibold text-[var(--heading)]">Personal Information</h2>
                </div>
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={resetEditState}
                    className="min-w-[140px] rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-card-nested)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="min-w-[140px] rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="mt-6 space-y-0">
              <ProfileRow
                label="Name"
                content={
                  isEditing ? (
                    <div className="flex max-w-[380px] items-center gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-3">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        className="w-full border-0 bg-transparent p-0 text-[15px] text-[var(--heading)] outline-none"
                      />
                      <Pencil className="h-4 w-4 shrink-0 text-[var(--icon-muted)]" />
                    </div>
                  ) : (
                    <span className="text-[15px] font-medium text-[var(--heading)]">{displayData.name}</span>
                  )
                }
              />

              <ProfileRow
                label="Email"
                content={<span className="text-[15px] text-[var(--foreground)]">{user.email}</span>}
              />

              <ProfileRow
                label="Role"
                content={<span className="text-[15px] text-[var(--heading)]">{roleLabel}</span>}
              />

              <ProfileRow
                label="Occupation"
                content={
                  isEditing ? (
                    <select
                      value={formData.occupation}
                      onChange={(e) => setFormData((p) => ({ ...p, occupation: e.target.value }))}
                      className="w-full max-w-[340px] rounded-[16px] border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-3 text-[15px] text-[var(--heading)] outline-none focus:border-[var(--primary)]"
                    >
                      {OCCUPATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[15px] text-[var(--heading)]">{displayData.occupation}</span>
                  )
                }
              />

              <ProfileRow
                label="Password"
                content={
                  isEditing ? (
                    <button
                      type="button"
                      onClick={() => { resetPasswordForm(); setShowPasswordModal(true); }}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-[15px] font-medium text-[var(--primary)] transition hover:bg-[var(--background-card-nested)]"
                    >
                      <Pencil className="h-4 w-4" />
                      Change Password
                    </button>
                  ) : (
                    <span className="text-[15px] tracking-[0.24em] text-[var(--foreground)]">**********</span>
                  )
                }
                last
              />
            </div>
          </section>

          <section className="mt-10 border-t border-[var(--border-subtle)] pt-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-[20px] font-semibold text-[var(--heading)]">Appearance</h2>
              </div>
              <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                {themeSummary}
              </div>
            </div>

            <div className="mt-5 rounded-[18px] bg-[var(--background-card-nested)] p-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <ThemeButton active={themePreference === "light"} icon={<SunMedium className="h-4 w-4" />} label="Light" onClick={() => handleThemeSelect("light")} />
                <ThemeButton active={themePreference === "dark"} icon={<Moon className="h-4 w-4" />} label="Dark" onClick={() => handleThemeSelect("dark")} />
                <ThemeButton active={themePreference === "system"} icon={<Monitor className="h-4 w-4" />} label="System" onClick={() => handleThemeSelect("system")} />
              </div>
            </div>
          </section>
        </div>
      </div>

      {showPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[30px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-7 shadow-[var(--shadow-elevated)]">
            <h3 className="text-[20px] font-semibold text-[var(--heading)]">Change Password</h3>

            <div className="mt-6 space-y-5">
              {passwordFields.map(({ label, field }) => {
                const isVisible = showPasswords[field];
                return (
                  <div key={field}>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">{label}</label>
                    <div className="relative">
                      <input
                        type={isVisible ? "text" : "password"}
                        value={passwordForm[field]}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, [field]: e.target.value }))}
                        autoComplete="new-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--background-surface)] pl-4 pr-12 py-3 text-[15px] text-[var(--heading)] outline-none transition focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(field)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--icon-muted)] hover:text-[var(--primary)] transition"
                      >
                        {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
                className="flex-1 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-card-nested)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isSaving}
                className="flex-1 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileRow({
  label,
  content,
  last = false,
}: {
  label: string;
  content: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`grid gap-4 py-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center ${
        last ? "" : "border-b border-[var(--border-subtle)]"
      }`}
    >
      <div className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</div>
      <div className="min-w-0">{content}</div>
    </div>
  );
}
