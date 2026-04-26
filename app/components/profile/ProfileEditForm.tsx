"use client";
/* eslint-disable @next/next/no-img-element */

import { saveProfileAction } from "@/app/actions/profile";
import { updateUserDetails } from "@/app/actions/user";
import AnimatedLink from "@/app/components/ui/animated-link";
import Tooltip from "@/app/components/ui/tooltip";
import { optimizeProfileImage } from "@/lib/optimize-profile-image";
import type {
  ProfileEditMeta,
  ProfileFormInput,
  ProfileVisibility,
  ProfessionalProfile,
} from "@/types/profile";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  ExternalLink,
  GraduationCap,
  Languages,
  LockKeyhole,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";

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

const wizardSteps = [
  {
    id: "identity",
    title: "Identity",
    description: "Public name, photo, and core profile details.",
  },
  {
    id: "summary",
    title: "Summary",
    description: "Bio, links, location, and profile context.",
  },
  {
    id: "expertise",
    title: "Expertise",
    description: "Practice areas, skills, and languages.",
  },
  {
    id: "background",
    title: "Background",
    description: "Experience and education timeline.",
  },
  {
    id: "trust",
    title: "Trust",
    description: "Credentials, awards, links, and visibility.",
  },
  {
    id: "review",
    title: "Review",
    description: "Final check, password, and submit.",
  },
] as const;

type WizardStepId = (typeof wizardSteps)[number]["id"];

function resolveStepIndex(step?: string) {
  const index = wizardSteps.findIndex((item) => item.id === step);
  return index >= 0 ? index : 0;
}

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

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatVisibilityLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
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
    socialLinks: profile.socialLinks.length > 0 ? profile.socialLinks : [createEmptySocial()],
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
      {children}
    </label>
  );
}

function StepPanel({
  title,
  copy,
  children,
}: {
  title: string;
  copy?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace-sidebar p-5 md:p-6 lh-form-enter">
      <div className="border-b border-[#4C2F5E]/8 pb-4">
        <h2 className="text-xl font-semibold text-[#2F1D3B]">{title}</h2>
        {copy ? <p className="mt-2 text-sm leading-7 text-[#736683]">{copy}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#4C2F5E]/12 bg-[#FBF9FD] px-4 py-5 text-sm text-[#736683]">
      {label}
    </div>
  );
}

function StatusPill({
  active,
  complete,
}: {
  active: boolean;
  complete: boolean;
}) {
  if (complete) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#4C2F5E] text-white">
        <Check className="h-4 w-4" />
      </span>
    );
  }

  if (active) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]">
        <Circle className="h-3 w-3 fill-current" />
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#4C2F5E]/10 bg-white text-[#A294B1]">
      <Circle className="h-3 w-3" />
    </span>
  );
}

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export default function ProfileEditForm({
  profile,
  meta,
  mode,
  initialStep,
}: {
  profile: ProfessionalProfile;
  meta: ProfileEditMeta;
  mode: "edit" | "setup";
  initialStep?: string;
}) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(() => resolveStepIndex(initialStep));
  const [form, setForm] = useState<ProfileFormInput>(() => buildInitialFormData(profile));
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
  const progressPercent = Math.round(((currentStep + 1) / wizardSteps.length) * 100);

  const stepChecks = useMemo(
    () => [
      {
        complete:
          Boolean(form.displayName.trim()) &&
          Boolean(form.username.trim()) &&
          Boolean(form.headline?.trim()),
        notes: [
          !form.displayName.trim() ? "Add your display name." : null,
          !form.username.trim() ? "Set your public username." : null,
          !form.headline?.trim() ? "Write a clear professional headline." : null,
        ].filter(Boolean) as string[],
      },
      {
        complete:
          Boolean(form.bio?.trim()) &&
          Boolean(form.city?.trim() || form.primaryRegionId?.trim()) &&
          Boolean(form.linkedInUrl?.trim() || form.websiteUrl?.trim()),
        notes: [
          !form.bio?.trim() ? "Add a concise professional summary." : null,
          !(form.city?.trim() || form.primaryRegionId?.trim()) ? "Set your city or region." : null,
          !(form.linkedInUrl?.trim() || form.websiteUrl?.trim()) ? "Add at least one public link." : null,
        ].filter(Boolean) as string[],
      },
      {
        complete:
          (form.practiceAreaCategoryIds.length > 0 || form.skills.some((item) => item.name.trim())) &&
          form.languages.some((item) => item.name.trim()),
        notes: [
          !(form.practiceAreaCategoryIds.length > 0 || form.skills.some((item) => item.name.trim()))
            ? "Choose practice areas or add at least one skill."
            : null,
          !form.languages.some((item) => item.name.trim()) ? "Add at least one language." : null,
        ].filter(Boolean) as string[],
      },
      {
        complete:
          form.experiences.some((item) => item.title.trim() && item.organization.trim()) &&
          form.educations.some((item) => item.institution.trim()),
        notes: [
          !form.experiences.some((item) => item.title.trim() && item.organization.trim())
            ? "Add at least one experience entry."
            : null,
          !form.educations.some((item) => item.institution.trim())
            ? "Add at least one education entry."
            : null,
        ].filter(Boolean) as string[],
      },
      {
        complete: true,
        notes: [
          !form.certifications.some((item) => item.name.trim()) &&
          !form.awards.some((item) => item.title.trim())
            ? "Credentials are optional, but they improve trust."
            : null,
          !form.socialLinks.some((item) => item.url.trim())
            ? "Social links are optional if LinkedIn or website already cover your presence."
            : null,
        ].filter(Boolean) as string[],
      },
      {
        complete: completion >= 85,
        notes:
          completion >= 85
            ? ["Profile is ready to publish."]
            : ["Review the earlier steps before saving your profile."],
      },
    ],
    [completion, form],
  );

  const currentStepMeta = wizardSteps[currentStep];

  useEffect(() => {
    setCurrentStep(resolveStepIndex(initialStep));
  }, [initialStep]);

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
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;

      setError("");
      try {
        const result = await optimizeProfileImage(file, {
          maxWidth: field === "avatarUrl" ? 512 : 1600,
          maxHeight: field === "avatarUrl" ? 512 : 900,
          targetBytes: field === "avatarUrl" ? 300 * 1024 : 700 * 1024,
        });

        setForm((current) => ({ ...current, [field]: result }));
      } catch (imageError) {
        setError(
          imageError instanceof Error
            ? imageError.message
            : "Failed to process the selected image.",
        );
      } finally {
        input.value = "";
      }
    };

  const togglePracticeArea = (id: string) => {
    setForm((current) => ({
      ...current,
      practiceAreaCategoryIds: current.practiceAreaCategoryIds.includes(id)
        ? current.practiceAreaCategoryIds.filter((item) => item !== id)
        : [...current.practiceAreaCategoryIds, id],
    }));
  };

  const goToStep = (index: number) => {
    setCurrentStep(Math.min(Math.max(index, 0), wizardSteps.length - 1));
    setError("");
    setSuccess("");
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
          submissionError instanceof Error ? submissionError.message : "Failed to save your profile.",
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

  const renderStep = (stepId: WizardStepId) => {
    if (stepId === "identity") {
      return (
        <StepPanel
          title="Profile identity"
          copy="Start with the public identity people see first. Keep this step focused on recognition and trust."
        >
          <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)]">
                <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#4C2F5E_0%,#8D74A3_100%)]">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt={form.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-semibold text-white">
                      {getInitials(form.displayName || "Legal Hub") || "LH"}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="legal-button-primary w-full text-sm"
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
                  className="legal-button-secondary w-full text-sm"
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
                      yearsExperience: event.target.value ? Number(event.target.value) : null,
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
        </StepPanel>
      );
    }

    if (stepId === "summary") {
      return (
        <StepPanel
          title="Professional summary"
          copy="Explain what you do, where you practice, and how people should evaluate your profile at a glance."
        >
          <div className="space-y-5">
            <div>
              <FieldLabel>Professional summary</FieldLabel>
              <textarea
                className="legal-field min-h-[180px]"
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
                    setForm((current) => ({ ...current, linkedInUrl: event.target.value }))
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
                    setForm((current) => ({ ...current, websiteUrl: event.target.value }))
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
                  setForm((current) => ({ ...current, officeAddress: event.target.value }))
                }
                placeholder="Office address or public contact location"
              />
            </div>

            <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-4 text-sm text-[#736683]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                Public URL preview
              </p>
              <p className="mt-2 font-semibold text-[#2F1D3B]">
                {form.username ? `/profile/${form.username}` : "Set a username in the first step"}
              </p>
            </div>
          </div>
        </StepPanel>
      );
    }

    if (stepId === "expertise") {
      return (
        <StepPanel
          title="Practice areas and expertise"
          copy="These fields improve discoverability and help users understand what legal work you are suited for."
        >
          <div className="space-y-6">
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

            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#2F1D3B]">Skills</h3>
                    <p className="text-sm text-[#736683]">Add the specific expertise you want attached to your profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayItem("skills")}
                    className="legal-button-secondary text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add skill
                  </button>
                </div>
                <div className="space-y-3">
                  {form.skills.map((item, index) => (
                    <div
                      key={`skill-${index}`}
                      className="grid gap-3 rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4 md:grid-cols-[minmax(0,1fr)_180px_44px]"
                    >
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
                            yearsExperience: event.target.value ? Number(event.target.value) : null,
                          })
                        }
                        placeholder="Years"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("skills", index)}
                        className="inline-flex items-center justify-center rounded-[18px] border border-[var(--border-subtle)] bg-white text-[var(--foreground)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#2F1D3B]">Languages</h3>
                    <p className="text-sm text-[#736683]">Show the languages you can work in professionally.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addArrayItem("languages")}
                    className="legal-button-secondary text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add language
                  </button>
                </div>
                <div className="space-y-3">
                  {form.languages.map((item, index) => (
                    <div
                      key={`language-${index}`}
                      className="grid gap-3 rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4 md:grid-cols-[minmax(0,1fr)_220px_44px]"
                    >
                      <input
                        className="legal-field"
                        value={item.name}
                        onChange={(event) =>
                          updateArrayItem("languages", index, {
                            ...item,
                            name: event.target.value,
                          })
                        }
                        placeholder="Language"
                      />
                      <input
                        className="legal-field"
                        value={item.proficiency}
                        onChange={(event) =>
                          updateArrayItem("languages", index, {
                            ...item,
                            proficiency: event.target.value,
                          })
                        }
                        placeholder="Fluent, native, professional"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("languages", index)}
                        className="inline-flex items-center justify-center rounded-[18px] border border-[var(--border-subtle)] bg-white text-[var(--foreground)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StepPanel>
      );
    }

    if (stepId === "background") {
      return (
        <StepPanel
          title="Professional background"
          copy="Keep career history and education structured so the profile reads clearly and avoids a long unstructured wall of text."
        >
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#2F1D3B]">Experience</h3>
                  <p className="text-sm text-[#736683]">List the roles that define your legal background.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem("experiences")}
                  className="legal-button-secondary text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add experience
                </button>
              </div>
              <div className="space-y-4">
                {form.experiences.map((item, index) => (
                  <div
                    key={`experience-${index}`}
                    className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4"
                  >
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
                    <button type="button" onClick={() => removeArrayItem("experiences", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                      <Trash2 className="h-4 w-4" />
                      Remove experience
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#2F1D3B]">Education</h3>
                  <p className="text-sm text-[#736683]">Add academic background that supports credibility.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem("educations")}
                  className="legal-button-secondary text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add education
                </button>
              </div>
              <div className="space-y-4">
                {form.educations.map((item, index) => (
                  <div
                    key={`education-${index}`}
                    className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <input className="legal-field" value={item.institution} onChange={(event) => updateArrayItem("educations", index, { ...item, institution: event.target.value })} placeholder="Institution" />
                      <input className="legal-field" value={item.degree} onChange={(event) => updateArrayItem("educations", index, { ...item, degree: event.target.value })} placeholder="Degree" />
                      <input className="legal-field" value={item.fieldOfStudy} onChange={(event) => updateArrayItem("educations", index, { ...item, fieldOfStudy: event.target.value })} placeholder="Field of study" />
                      <input type="date" className="legal-field" value={item.startDate} onChange={(event) => updateArrayItem("educations", index, { ...item, startDate: event.target.value })} />
                      <input type="date" className="legal-field" value={item.endDate} onChange={(event) => updateArrayItem("educations", index, { ...item, endDate: event.target.value })} />
                    </div>
                    <textarea className="legal-field mt-3 min-h-[110px]" value={item.description} onChange={(event) => updateArrayItem("educations", index, { ...item, description: event.target.value })} placeholder="Programs, research, honors, publications, or legal clinics." />
                    <button type="button" onClick={() => removeArrayItem("educations", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                      <Trash2 className="h-4 w-4" />
                      Remove education
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StepPanel>
      );
    }

    if (stepId === "trust") {
      return (
        <StepPanel
          title="Credentials, links, and privacy"
          copy="Add trust signals and set clear visibility rules without mixing them into the rest of the onboarding flow."
        >
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#2F1D3B]">Certifications</h3>
                    <p className="text-sm text-[#736683]">Licenses, certificates, and credentials.</p>
                  </div>
                  <button type="button" onClick={() => addArrayItem("certifications")} className="legal-button-secondary text-sm">
                    <Plus className="h-4 w-4" />
                    Add certification
                  </button>
                </div>
                <div className="space-y-4">
                  {form.certifications.map((item, index) => (
                    <div key={`cert-${index}`} className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                      <input className="legal-field" value={item.name} onChange={(event) => updateArrayItem("certifications", index, { ...item, name: event.target.value })} placeholder="Certification or license" />
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input className="legal-field" value={item.issuer} onChange={(event) => updateArrayItem("certifications", index, { ...item, issuer: event.target.value })} placeholder="Issuer" />
                        <input className="legal-field" value={item.credentialId} onChange={(event) => updateArrayItem("certifications", index, { ...item, credentialId: event.target.value })} placeholder="Credential ID" />
                        <input type="date" className="legal-field" value={item.issuedAt} onChange={(event) => updateArrayItem("certifications", index, { ...item, issuedAt: event.target.value })} />
                        <input type="date" className="legal-field" value={item.expiresAt} onChange={(event) => updateArrayItem("certifications", index, { ...item, expiresAt: event.target.value })} />
                      </div>
                      <input className="legal-field mt-3" value={item.credentialUrl} onChange={(event) => updateArrayItem("certifications", index, { ...item, credentialUrl: event.target.value })} placeholder="Credential URL" />
                      <textarea className="legal-field mt-3 min-h-[100px]" value={item.description} onChange={(event) => updateArrayItem("certifications", index, { ...item, description: event.target.value })} placeholder="Scope, licensing body, or validity detail." />
                      <button type="button" onClick={() => removeArrayItem("certifications", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                        <Trash2 className="h-4 w-4" />
                        Remove certification
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#2F1D3B]">Awards and social links</h3>
                    <p className="text-sm text-[#736683]">Recognition and additional public identity links.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addArrayItem("awards")} className="legal-button-secondary text-sm">
                      <Plus className="h-4 w-4" />
                      Award
                    </button>
                    <button type="button" onClick={() => addArrayItem("socialLinks")} className="legal-button-secondary text-sm">
                      <Plus className="h-4 w-4" />
                      Link
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {form.awards.map((item, index) => (
                    <div key={`award-${index}`} className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                      <input className="legal-field" value={item.title} onChange={(event) => updateArrayItem("awards", index, { ...item, title: event.target.value })} placeholder="Award or recognition" />
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input className="legal-field" value={item.issuer} onChange={(event) => updateArrayItem("awards", index, { ...item, issuer: event.target.value })} placeholder="Issuer" />
                        <input type="date" className="legal-field" value={item.awardedAt} onChange={(event) => updateArrayItem("awards", index, { ...item, awardedAt: event.target.value })} />
                      </div>
                      <input className="legal-field mt-3" value={item.awardUrl} onChange={(event) => updateArrayItem("awards", index, { ...item, awardUrl: event.target.value })} placeholder="Source URL" />
                      <textarea className="legal-field mt-3 min-h-[100px]" value={item.description} onChange={(event) => updateArrayItem("awards", index, { ...item, description: event.target.value })} placeholder="Why this recognition matters for your public profile." />
                      <button type="button" onClick={() => removeArrayItem("awards", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                        <Trash2 className="h-4 w-4" />
                        Remove award
                      </button>
                    </div>
                  ))}

                  {form.socialLinks.map((item, index) => (
                    <div key={`social-${index}`} className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="legal-field" value={item.platform} onChange={(event) => updateArrayItem("socialLinks", index, { ...item, platform: event.target.value })} placeholder="Platform" />
                        <input className="legal-field" value={item.label} onChange={(event) => updateArrayItem("socialLinks", index, { ...item, label: event.target.value })} placeholder="Label (optional)" />
                      </div>
                      <input className="legal-field mt-3" value={item.url} onChange={(event) => updateArrayItem("socialLinks", index, { ...item, url: event.target.value })} placeholder="https://..." />
                      <button type="button" onClick={() => removeArrayItem("socialLinks", index)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                        <Trash2 className="h-4 w-4" />
                        Remove link
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-[#2F1D3B]">Visibility settings</h3>
                <p className="text-sm text-[#736683]">Choose who can see each part of your profile.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(form.visibility).map(([key, value]) => (
                  <div key={key}>
                    <FieldLabel>{formatVisibilityLabel(key)}</FieldLabel>
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
            </div>
          </div>
        </StepPanel>
      );
    }

    return (
      <StepPanel
        title="Review and security"
        copy="Finish with a final quality check. Save the profile only when the public story and privacy settings are aligned."
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Completion", value: `${completion}%`, helper: "Current readiness score" },
              { label: "Profile URL", value: form.username ? `/${form.username}` : "Missing", helper: "Public profile path" },
              { label: "Practice areas", value: String(form.practiceAreaCategoryIds.length), helper: "Selected areas" },
              { label: "Experience entries", value: String(form.experiences.filter((item) => item.title.trim()).length), helper: "Roles added" },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{item.value}</p>
                <p className="mt-2 text-sm text-[#736683]">{item.helper}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2F1D3B]">Final checklist</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {stepChecks.slice(0, 5).map((step, index) => (
                    <div key={wizardSteps[index].id} className="rounded-[18px] border border-[#4C2F5E]/8 bg-white px-4 py-4">
                      <div className="flex items-center gap-2">
                        {step.complete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-[#8D74A3]" />
                        )}
                        <p className="font-semibold text-[#2F1D3B]">{wizardSteps[index].title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#736683]">
                        {step.notes[0] || "This section is ready."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
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
                    <Tooltip content={showPasswords[field.key] ? "Hide password" : "Show password"}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((current) => ({
                            ...current,
                            [field.key]: !current[field.key],
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--icon-muted)] transition hover:text-[var(--foreground)]"
                        aria-label={showPasswords[field.key] ? "Hide password" : "Show password"}
                      >
                        {showPasswords[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </Tooltip>
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
                className="legal-button-secondary text-sm disabled:opacity-60"
              >
                <LockKeyhole className="h-4 w-4" />
                {isPasswordPending ? "Updating..." : "Update password"}
              </button>
            </div>

            <div className="rounded-[22px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                Security
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#2F1D3B]">Keep your account protected</h3>
              <p className="mt-3 text-sm leading-7 text-[#736683]">
                Use at least 8 characters and avoid reusing a password from another account.
              </p>
            </div>
          </div>
        </div>
      </StepPanel>
    );
  };

  return (
    <div className="legal-workspace-shell">
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

      <div className="mx-auto max-w-[1380px] px-4 pb-12 pt-7 md:px-6 lg:px-8 lh-page-enter">
        <section className="workspace-header p-6 md:p-7 lh-page-enter lh-delay-1">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <AnimatedLink
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to profile
              </AnimatedLink>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="legal-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  {mode === "setup" ? "Profile onboarding" : "Profile editor"}
                </span>
                <span className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#736683]">
                  Step {currentStep + 1} of {wizardSteps.length}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#2F1D3B] md:text-[2.8rem]">
                {mode === "setup" ? "Complete your professional profile" : "Edit your profile"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#736683] md:text-base">
                Move through the profile in focused steps instead of managing one long, awkward form.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Completion</p>
                <p className="mt-2 text-2xl font-semibold text-[#2F1D3B]">{completion}%</p>
              </div>
              <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Current step</p>
                <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{currentStepMeta.title}</p>
              </div>
              <div className="rounded-[20px] border border-[#4C2F5E]/8 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Public URL</p>
                <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">
                  {form.username ? `/profile/${form.username}` : "Set a username"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#E9E1F0]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4C2F5E_0%,#8D74A3_100%)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
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
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="workspace-sidebar p-4 lh-page-enter lh-delay-2">
              <div className="space-y-2">
                {wizardSteps.map((step, index) => {
                  const isActive = currentStep === index;
                  const isComplete = stepChecks[index]?.complete ?? false;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(index)}
                      className={`flex w-full items-start gap-3 rounded-[18px] px-3 py-3 text-left transition ${
                        isActive ? "bg-[#F7F1FB]" : "hover:bg-[#FBF9FD]"
                      }`}
                    >
                      <StatusPill active={isActive} complete={isComplete} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${isActive ? "text-[#2F1D3B]" : "text-[#5F506D]"}`}>
                          {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-[#8B7D99]">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="workspace-sidebar p-5 lh-page-enter lh-delay-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                  {currentStepMeta.id === "identity" ? <UserRound className="h-4 w-4" /> : null}
                  {currentStepMeta.id === "summary" ? <Sparkles className="h-4 w-4" /> : null}
                  {currentStepMeta.id === "expertise" ? <Languages className="h-4 w-4" /> : null}
                  {currentStepMeta.id === "background" ? <GraduationCap className="h-4 w-4" /> : null}
                  {currentStepMeta.id === "trust" ? <ShieldCheck className="h-4 w-4" /> : null}
                  {currentStepMeta.id === "review" ? <BriefcaseBusiness className="h-4 w-4" /> : null}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Step guidance</p>
                  <h3 className="text-base font-semibold text-[#2F1D3B]">{currentStepMeta.title}</h3>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {stepChecks[currentStep].notes.length > 0 ? (
                  stepChecks[currentStep].notes.map((note) => (
                    <div
                      key={note}
                      className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-3 py-3 text-sm text-[#736683]"
                    >
                      {note}
                    </div>
                  ))
                ) : (
                  <EmptyCard label="This step is already in good shape." />
                )}
              </div>

              {form.username ? (
                <AnimatedLink
                  href={`/profile/${form.username}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
                >
                  <ExternalLink className="h-4 w-4" />
                  View public page
                </AnimatedLink>
              ) : null}
            </div>
          </aside>

          <main className="min-w-0">
            {renderStep(currentStepMeta.id)}

            <div className="mt-6 flex flex-col gap-3 rounded-[22px] border border-[#4C2F5E]/10 bg-white p-4 shadow-[0_10px_22px_rgba(76,47,94,0.04)] sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#736683]">
                {currentStep === wizardSteps.length - 1
                  ? "Final step. Review everything, update password if needed, then save."
                  : `Next: ${wizardSteps[currentStep + 1].title}`}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  className="legal-button-secondary text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="legal-button-secondary text-sm disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save draft"}
                </button>

                {currentStep === wizardSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="legal-button-primary text-sm disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isPending ? "Saving..." : mode === "setup" ? "Finish profile" : "Save profile"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goToStep(currentStep + 1)}
                    className="legal-button-primary text-sm"
                  >
                    Next step
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
