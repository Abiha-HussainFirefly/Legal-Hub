"use client";
/* eslint-disable @next/next/no-img-element */

import { saveProfileAction } from "@/app/actions/profile";
import { updateUserDetails } from "@/app/actions/user";
import type {
  ProfileEditMeta,
  ProfileFormInput,
  ProfileVisibility,
  ProfessionalProfile,
} from "@/types/profile";
import {
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  ExternalLink,
  LockKeyhole,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useRef, useState, useTransition } from "react";

const visibilityOptions: Array<{ value: ProfileVisibility; label: string }> = [
  { value: "PUBLIC", label: "Public" },
  { value: "MEMBERS_ONLY", label: "Members only" },
  { value: "LAWYERS_ONLY", label: "Lawyers only" },
  { value: "PRIVATE", label: "Private" },
];

const consultationOptions = [
  { value: "", label: "Not specified" },
  { value: "AVAILABLE", label: "Available" },
  { value: "LIMITED", label: "Limited availability" },
  { value: "UNAVAILABLE", label: "Unavailable" },
] as const;

function createEmptyExperience() {
  return {
    title: "",
    organization: "",
    location: "",
    employmentType: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  };
}

function createEmptyEducation() {
  return {
    institution: "",
    degree: "",
    fieldOfStudy: "",
    description: "",
    startDate: "",
    endDate: "",
  };
}

function createEmptyCertification() {
  return {
    name: "",
    issuer: "",
    credentialId: "",
    credentialUrl: "",
    issuedAt: "",
    expiresAt: "",
    description: "",
  };
}

function createEmptySkill() {
  return { name: "", yearsExperience: null as number | null };
}

function createEmptyLanguage() {
  return { name: "", proficiency: "" };
}

function createEmptyAward() {
  return {
    title: "",
    issuer: "",
    description: "",
    awardUrl: "",
    awardedAt: "",
  };
}

function createEmptySocial() {
  return { platform: "", label: "", url: "" };
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function buildInitialFormData(profile: ProfessionalProfile): ProfileFormInput {
  return {
    displayName: profile.displayName,
    username: profile.username ?? slugifyUsername(profile.displayName),
    avatarUrl: profile.avatarUrl ?? "",
    coverImageUrl: profile.coverImageUrl ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    company: profile.company ?? "",
    roleTitle: profile.roleTitle ?? "",
    city: profile.city ?? "",
    countryCode: profile.countryCode ?? "PK",
    primaryRegionId: profile.primaryRegionId ?? "",
    officeAddress: profile.officeAddress ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    linkedInUrl: profile.linkedInUrl ?? "",
    yearsExperience: profile.yearsExperience ?? null,
    consultationStatus: profile.consultationStatus ?? null,
    practiceAreaCategoryIds: profile.practiceAreas.map((item) => item.id),
    skills:
      profile.skills.length > 0
        ? profile.skills.map((item) => ({
            id: item.id,
            name: item.name,
            yearsExperience: item.yearsExperience ?? null,
          }))
        : [createEmptySkill()],
    languages:
      profile.languages.length > 0
        ? profile.languages.map((item) => ({
            id: item.id,
            name: item.name,
            proficiency: item.proficiency ?? "",
          }))
        : [createEmptyLanguage()],
    experiences:
      profile.experiences.length > 0
        ? profile.experiences.map((item) => ({
            ...item,
            startDate: toDateInput(item.startDate),
            endDate: toDateInput(item.endDate),
          }))
        : [createEmptyExperience()],
    educations:
      profile.educations.length > 0
        ? profile.educations.map((item) => ({
            ...item,
            startDate: toDateInput(item.startDate),
            endDate: toDateInput(item.endDate),
          }))
        : [createEmptyEducation()],
    certifications:
      profile.certifications.length > 0
        ? profile.certifications.map((item) => ({
            ...item,
            issuedAt: toDateInput(item.issuedAt),
            expiresAt: toDateInput(item.expiresAt),
          }))
        : [createEmptyCertification()],
    awards:
      profile.awards.length > 0
        ? profile.awards.map((item) => ({
            ...item,
            awardedAt: toDateInput(item.awardedAt),
          }))
        : [createEmptyAward()],
    socialLinks:
      profile.socialLinks.length > 0 ? profile.socialLinks : [createEmptySocial()],
    visibility: profile.visibility,
  };
}

function completionPreview(form: ProfileFormInput) {
  const checks = [
    Boolean(form.displayName.trim()),
    Boolean(form.username.trim()),
    Boolean(form.avatarUrl?.trim()),
    Boolean(form.headline?.trim()),
    Boolean(form.bio?.trim()),
    Boolean(form.company?.trim()),
    Boolean(form.city?.trim() || form.primaryRegionId?.trim()),
    Boolean(form.linkedInUrl?.trim() || form.websiteUrl?.trim()),
    form.experiences.some((item) => item.title.trim() && item.organization.trim()),
    form.educations.some((item) => item.institution.trim()),
    form.skills.some((item) => item.name.trim()) || form.practiceAreaCategoryIds.length > 0,
    form.languages.some((item) => item.name.trim()),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Section({
  title,
  copy,
  children,
}: {
  title: string;
  copy?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-5 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="text-xl font-semibold text-[var(--heading)]">{title}</h2>
        {copy ? (
          <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{copy}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
      {children}
    </label>
  );
}

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export default function ProfileEditForm({
  profile,
  meta,
  mode,
}: {
  profile: ProfessionalProfile;
  meta: ProfileEditMeta;
  mode: "edit" | "setup";
}) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileFormInput>(() =>
    buildInitialFormData(profile),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [passwordForm, setPasswordForm] = useState<Record<PasswordField, string>>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const completion = useMemo(() => completionPreview(form), [form]);

  const practiceAreaOptions = meta.practiceAreas;
  const regionOptions = meta.regions;

  const updateArrayItem = <T,>(
    key:
      | "experiences"
      | "educations"
      | "certifications"
      | "skills"
      | "languages"
      | "awards"
      | "socialLinks",
    index: number,
    value: T,
  ) => {
    setForm((current) => {
      const next = [...(current[key] as unknown as T[])];
      next[index] = value;
      return { ...current, [key]: next };
    });
  };

  const removeArrayItem = (
    key:
      | "experiences"
      | "educations"
      | "certifications"
      | "skills"
      | "languages"
      | "awards"
      | "socialLinks",
    index: number,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: (current[key] as unknown[]).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addArrayItem = (
    key:
      | "experiences"
      | "educations"
      | "certifications"
      | "skills"
      | "languages"
      | "awards"
      | "socialLinks",
  ) => {
    const factory =
      key === "experiences"
        ? createEmptyExperience
        : key === "educations"
          ? createEmptyEducation
          : key === "certifications"
            ? createEmptyCertification
            : key === "skills"
              ? createEmptySkill
              : key === "languages"
                ? createEmptyLanguage
                : key === "awards"
                  ? createEmptyAward
                  : createEmptySocial;

    setForm((current) => ({
      ...current,
      [key]: [...(current[key] as unknown[]), factory()],
    }));
  };

  const handleImageChange =
    (field: "avatarUrl" | "coverImageUrl") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image file.");
        event.target.value = "";
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setError("Please choose an image smaller than 4MB.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setForm((current) => ({ ...current, [field]: result }));
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    };

  const togglePracticeArea = (id: string) => {
    setForm((current) => ({
      ...current,
      practiceAreaCategoryIds: current.practiceAreaCategoryIds.includes(id)
        ? current.practiceAreaCategoryIds.filter((item) => item !== id)
        : [...current.practiceAreaCategoryIds, id],
    }));
  };

  const handleSubmit = () => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await saveProfileAction(form);
        setSuccess("Profile updated successfully.");
        router.push("/profile");
        if (mode === "setup" && result.username) {
          router.refresh();
        }
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to save your profile.",
        );
      }
    });
  };

  const handlePasswordSubmit = () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        await updateUserDetails({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
        setPasswordSuccess("Password updated successfully.");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswords({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false,
        });
      } catch (submissionError) {
        setPasswordError(
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to update password.",
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(76,47,94,0.12),transparent_28%),var(--background-page)]">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange("avatarUrl")}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange("coverImageUrl")}
      />

      <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-7 md:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-[var(--background-surface)] shadow-[var(--shadow-elevated)]">
          <div className="bg-[linear-gradient(135deg,#3A2348_0%,#5A356F_55%,#8F66AD_100%)] px-6 py-8 text-white md:px-8 md:py-9">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/14"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to profile
                </Link>
                <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                  {mode === "setup" ? "Complete your professional profile" : "Edit profile"}
                </h1>
                <p className="mt-4 text-sm leading-8 text-white/80 md:text-base">
                  Build a credible Legal Hub profile with public discovery fields, structured professional experience, and explicit privacy settings.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/14 bg-white/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    Completion preview
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{completion}%</p>
                </div>
                <div className="rounded-[18px] border border-white/14 bg-white/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    Public URL
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {form.username ? `/profile/${form.username}` : "Set a username"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-6 py-4 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="h-3 w-full max-w-xl overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-[linear-gradient(135deg,#4C2F5E_0%,#8D74A3_100%)]"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {form.username ? (
                  <Link href={`/profile/${form.username}`} className="legal-button-secondary text-sm">
                    <ExternalLink className="h-4 w-4" />
                    View public page
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="legal-button-primary text-sm disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save profile"}
                </button>
              </div>
            </div>
            {error ? (
              <div className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <Section title="Basic Info" copy="Set the public identity people will see first when they open your Legal Hub profile.">
            <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)]">
                  <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#4C2F5E_0%,#8D74A3_100%)]">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt={form.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-semibold text-white">
                        {form.displayName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("") || "LH"}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <Camera className="h-4 w-4" />
                      Upload headshot
                    </button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                  <FieldLabel>Cover image</FieldLabel>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]"
                  >
                    <Camera className="h-4 w-4" />
                    Upload cover
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Display name</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.displayName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        displayName: event.target.value,
                        username:
                          current.username === slugifyUsername(profile.displayName)
                            ? slugifyUsername(event.target.value)
                            : current.username,
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: slugifyUsername(event.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Headline</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.headline}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, headline: event.target.value }))
                    }
                    placeholder="Senior advocate focused on commercial litigation"
                  />
                </div>
                <div>
                  <FieldLabel>Role or designation</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.roleTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, roleTitle: event.target.value }))
                    }
                    placeholder="Partner, Associate, Legal Researcher"
                  />
                </div>
                <div>
                  <FieldLabel>Company or firm</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.company}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, company: event.target.value }))
                    }
                    placeholder="Apex Legal Associates"
                  />
                </div>
                <div>
                  <FieldLabel>Years of experience</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    className="legal-field"
                    value={form.yearsExperience ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        yearsExperience: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Primary region</FieldLabel>
                  <select
                    className="legal-field"
                    value={form.primaryRegionId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        primaryRegionId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a region</option>
                    {regionOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Country code</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.countryCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        countryCode: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="PK"
                  />
                </div>
                <div>
                  <FieldLabel>Consultation status</FieldLabel>
                  <select
                    className="legal-field"
                    value={form.consultationStatus ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        consultationStatus: event.target.value
                          ? (event.target.value as ProfileFormInput["consultationStatus"])
                          : null,
                      }))
                    }
                  >
                    {consultationOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Professional Summary" copy="Add a concise, credible summary and the public links that support your professional identity.">
            <div className="grid gap-4">
              <div>
                <FieldLabel>Professional summary</FieldLabel>
                <textarea
                  className="legal-field min-h-[150px]"
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bio: event.target.value }))
                  }
                  placeholder="Summarize your practice, advisory focus, jurisdictions, and the type of legal work you handle."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>LinkedIn</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.linkedInUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        linkedInUrl: event.target.value,
                      }))
                    }
                    placeholder="https://www.linkedin.com/in/username"
                  />
                </div>
                <div>
                  <FieldLabel>Website</FieldLabel>
                  <input
                    className="legal-field"
                    value={form.websiteUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        websiteUrl: event.target.value,
                      }))
                    }
                    placeholder="https://yourfirm.com"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Office address</FieldLabel>
                <input
                  className="legal-field"
                  value={form.officeAddress}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      officeAddress: event.target.value,
                    }))
                  }
                  placeholder="Office address or public contact location"
                />
              </div>
            </div>
          </Section>

          <Section title="Practice Areas and Skills" copy="Choose legal practice areas for discovery and add specific skills that refine your profile.">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
                <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                Practice areas
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {practiceAreaOptions.map((item) => {
                  const active = form.practiceAreaCategoryIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePracticeArea(item.id)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[var(--border-subtle)] bg-[var(--background-surface)] text-[var(--foreground)]"
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {form.skills.map((item, index) => (
                <div key={`skill-${index}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_44px]">
                  <input
                    className="legal-field"
                    value={item.name}
                    onChange={(event) =>
                      updateArrayItem("skills", index, {
                        ...item,
                        name: event.target.value,
                      })
                    }
                    placeholder="Arbitration, legal drafting, due diligence"
                  />
                  <input
                    type="number"
                    min={0}
                    className="legal-field"
                    value={item.yearsExperience ?? ""}
                    onChange={(event) =>
                      updateArrayItem("skills", index, {
                        ...item,
                        yearsExperience: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                    placeholder="Years"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem("skills", index)}
                    className="inline-flex items-center justify-center rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-surface)] text-[var(--foreground)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem("skills")}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]"
              >
                <Plus className="h-4 w-4" />
                Add skill
              </button>
            </div>
          </Section>

          <Section title="Experience">
            <div className="space-y-4">
              {form.experiences.map((item, index) => (
                <div key={`experience-${index}`} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="legal-field" value={item.title} onChange={(event) => updateArrayItem("experiences", index, { ...item, title: event.target.value })} placeholder="Title" />
                    <input className="legal-field" value={item.organization} onChange={(event) => updateArrayItem("experiences", index, { ...item, organization: event.target.value })} placeholder="Organization" />
                    <input className="legal-field" value={item.location} onChange={(event) => updateArrayItem("experiences", index, { ...item, location: event.target.value })} placeholder="Location" />
                    <input className="legal-field" value={item.employmentType} onChange={(event) => updateArrayItem("experiences", index, { ...item, employmentType: event.target.value })} placeholder="Employment type" />
                    <input type="date" className="legal-field" value={item.startDate} onChange={(event) => updateArrayItem("experiences", index, { ...item, startDate: event.target.value })} />
                    <input type="date" className="legal-field" value={item.endDate} onChange={(event) => updateArrayItem("experiences", index, { ...item, endDate: event.target.value })} disabled={item.isCurrent} />
                  </div>
                  <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <input type="checkbox" checked={item.isCurrent} onChange={(event) => updateArrayItem("experiences", index, { ...item, isCurrent: event.target.checked, endDate: event.target.checked ? "" : item.endDate })} />
                    I currently hold this role
                  </label>
                  <textarea className="legal-field mt-3 min-h-[110px]" value={item.description} onChange={(event) => updateArrayItem("experiences", index, { ...item, description: event.target.value })} placeholder="Summarize major responsibilities, legal work, industries, or client impact." />
                  <button type="button" onClick={() => removeArrayItem("experiences", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                    <Trash2 className="h-4 w-4" />
                    Remove experience
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("experiences")} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]">
                <Plus className="h-4 w-4" />
                Add experience
              </button>
            </div>
          </Section>

          <Section title="Education">
            <div className="space-y-4">
              {form.educations.map((item, index) => (
                <div key={`education-${index}`} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="legal-field" value={item.institution} onChange={(event) => updateArrayItem("educations", index, { ...item, institution: event.target.value })} placeholder="Institution" />
                    <input className="legal-field" value={item.degree} onChange={(event) => updateArrayItem("educations", index, { ...item, degree: event.target.value })} placeholder="Degree" />
                    <input className="legal-field" value={item.fieldOfStudy} onChange={(event) => updateArrayItem("educations", index, { ...item, fieldOfStudy: event.target.value })} placeholder="Field of study" />
                    <input type="date" className="legal-field" value={item.startDate} onChange={(event) => updateArrayItem("educations", index, { ...item, startDate: event.target.value })} />
                    <input type="date" className="legal-field" value={item.endDate} onChange={(event) => updateArrayItem("educations", index, { ...item, endDate: event.target.value })} />
                  </div>
                  <textarea className="legal-field mt-3 min-h-[110px]" value={item.description} onChange={(event) => updateArrayItem("educations", index, { ...item, description: event.target.value })} placeholder="Programs, research, honors, publications, or legal clinics." />
                  <button type="button" onClick={() => removeArrayItem("educations", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                    <Trash2 className="h-4 w-4" />
                    Remove education
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("educations")} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]">
                <Plus className="h-4 w-4" />
                Add education
              </button>
            </div>
          </Section>

          <Section title="Certifications and Awards">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                {form.certifications.map((item, index) => (
                  <div key={`cert-${index}`} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                    <input className="legal-field" value={item.name} onChange={(event) => updateArrayItem("certifications", index, { ...item, name: event.target.value })} placeholder="Certification or license" />
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input className="legal-field" value={item.issuer} onChange={(event) => updateArrayItem("certifications", index, { ...item, issuer: event.target.value })} placeholder="Issuer" />
                      <input className="legal-field" value={item.credentialId} onChange={(event) => updateArrayItem("certifications", index, { ...item, credentialId: event.target.value })} placeholder="Credential ID" />
                      <input type="date" className="legal-field" value={item.issuedAt} onChange={(event) => updateArrayItem("certifications", index, { ...item, issuedAt: event.target.value })} />
                      <input type="date" className="legal-field" value={item.expiresAt} onChange={(event) => updateArrayItem("certifications", index, { ...item, expiresAt: event.target.value })} />
                    </div>
                    <input className="legal-field mt-3" value={item.credentialUrl} onChange={(event) => updateArrayItem("certifications", index, { ...item, credentialUrl: event.target.value })} placeholder="Credential URL" />
                    <textarea className="legal-field mt-3 min-h-[100px]" value={item.description} onChange={(event) => updateArrayItem("certifications", index, { ...item, description: event.target.value })} placeholder="Scope, licensing body, or validity detail." />
                    <button type="button" onClick={() => removeArrayItem("certifications", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                      <Trash2 className="h-4 w-4" />
                      Remove certification
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("certifications")} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]">
                  <Plus className="h-4 w-4" />
                  Add certification
                </button>
              </div>

              <div className="space-y-4">
                {form.awards.map((item, index) => (
                  <div key={`award-${index}`} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                    <input className="legal-field" value={item.title} onChange={(event) => updateArrayItem("awards", index, { ...item, title: event.target.value })} placeholder="Award or recognition" />
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input className="legal-field" value={item.issuer} onChange={(event) => updateArrayItem("awards", index, { ...item, issuer: event.target.value })} placeholder="Issuer" />
                      <input type="date" className="legal-field" value={item.awardedAt} onChange={(event) => updateArrayItem("awards", index, { ...item, awardedAt: event.target.value })} />
                    </div>
                    <input className="legal-field mt-3" value={item.awardUrl} onChange={(event) => updateArrayItem("awards", index, { ...item, awardUrl: event.target.value })} placeholder="Source URL" />
                    <textarea className="legal-field mt-3 min-h-[100px]" value={item.description} onChange={(event) => updateArrayItem("awards", index, { ...item, description: event.target.value })} placeholder="Why this recognition matters for your public profile." />
                    <button type="button" onClick={() => removeArrayItem("awards", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                      <Trash2 className="h-4 w-4" />
                      Remove award
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("awards")} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]">
                  <Plus className="h-4 w-4" />
                  Add award
                </button>
              </div>
            </div>
          </Section>

          <Section title="Languages and Social Links">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                {form.languages.map((item, index) => (
                  <div key={`language-${index}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_44px]">
                    <input className="legal-field" value={item.name} onChange={(event) => updateArrayItem("languages", index, { ...item, name: event.target.value })} placeholder="Language" />
                    <input className="legal-field" value={item.proficiency} onChange={(event) => updateArrayItem("languages", index, { ...item, proficiency: event.target.value })} placeholder="Fluent, native, professional" />
                    <button type="button" onClick={() => removeArrayItem("languages", index)} className="inline-flex items-center justify-center rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-surface)] text-[var(--foreground)]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("languages")} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]">
                  <Plus className="h-4 w-4" />
                  Add language
                </button>
              </div>

              <div className="space-y-3">
                {form.socialLinks.map((item, index) => (
                  <div key={`social-${index}`} className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="legal-field" value={item.platform} onChange={(event) => updateArrayItem("socialLinks", index, { ...item, platform: event.target.value })} placeholder="Platform" />
                      <input className="legal-field" value={item.label} onChange={(event) => updateArrayItem("socialLinks", index, { ...item, label: event.target.value })} placeholder="Label (optional)" />
                    </div>
                    <input className="legal-field mt-3" value={item.url} onChange={(event) => updateArrayItem("socialLinks", index, { ...item, url: event.target.value })} placeholder="https://..." />
                    <button type="button" onClick={() => removeArrayItem("socialLinks", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                      <Trash2 className="h-4 w-4" />
                      Remove link
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem("socialLinks")} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)]">
                  <Plus className="h-4 w-4" />
                  Add social link
                </button>
              </div>
            </div>
          </Section>

          <Section title="Privacy and Visibility" copy="Choose who can see each part of your profile. Public settings are best for discovery.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(form.visibility).map(([key, value]) => (
                <div key={key}>
                  <FieldLabel>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</FieldLabel>
                  <select
                    className="legal-field"
                    value={value}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        visibility: {
                          ...current.visibility,
                          [key]: event.target.value as ProfileVisibility,
                        },
                      }))
                    }
                  >
                    {visibilityOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Password"
            copy="Change your password here instead of leaving the profile flow."
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                {[
                  {
                    key: "currentPassword" as const,
                    label: "Current password",
                    autoComplete: "current-password",
                  },
                  {
                    key: "newPassword" as const,
                    label: "New password",
                    autoComplete: "new-password",
                  },
                  {
                    key: "confirmPassword" as const,
                    label: "Confirm new password",
                    autoComplete: "new-password",
                  },
                ].map((field) => (
                  <div key={field.key}>
                    <FieldLabel>{field.label}</FieldLabel>
                    <div className="relative">
                      <input
                        type={showPasswords[field.key] ? "text" : "password"}
                        autoComplete={field.autoComplete}
                        className="legal-field pr-12"
                        value={passwordForm[field.key]}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((current) => ({
                            ...current,
                            [field.key]: !current[field.key],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--icon-muted)] transition hover:text-[var(--foreground)]"
                        aria-label={
                          showPasswords[field.key] ? "Hide password" : "Show password"
                        }
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {passwordError ? (
                  <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {passwordError}
                  </div>
                ) : null}
                {passwordSuccess ? (
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {passwordSuccess}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={isPasswordPending}
                  className="legal-button-primary text-sm disabled:opacity-60"
                >
                  <LockKeyhole className="h-4 w-4" />
                  {isPasswordPending ? "Updating..." : "Update password"}
                </button>
              </div>

              <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Security
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--heading)]">
                  Keep your account protected
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                  Use at least 8 characters and avoid reusing a password from another account.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
