"use client";

import { CheckSquare, XCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { z } from "zod";
import { EmailSchema } from "@/utils/validation";
import { useToast } from "@/app/components/ui/toast/toast-context";
import { commonInputClass, commonLabelClass } from "@/utils/custom-styling/input-label";

const forgotSchema = z.object({
  email: EmailSchema,
});

type ForgotFormData = z.infer<typeof forgotSchema>;
type FieldErrors = Partial<Record<keyof ForgotFormData, string>>;
type ForgotStep = "form" | "loading" | "sent";

function ForgotPasswordForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const portal = searchParams.get("portal") || "lawyer";
  const loginPath =
    portal === "admin"
      ? "/adminlogin"
      : portal === "client"
        ? "/clientlogin"
        : "/lawyerlogin";

  const [formData, setFormData] = useState<ForgotFormData>({ email: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ForgotFormData, boolean>>
  >({});
  const [step, setStep] = useState<ForgotStep>("form");

  const validateField = (field: keyof ForgotFormData, value: string) => {
    const result = forgotSchema.shape[field].safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  };

  const handleChange = (field: keyof ForgotFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleBlur = (field: keyof ForgotFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true });

    const result = forgotSchema.safeParse(formData);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof ForgotFormData;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStep("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim(), portal }),
      });

      const data = await res.json();
      console.log("Forgot Password API Response:", data);

      if (!res.ok) {
        addToast(
          "error",
          "Request Failed",
          data.message || "An unexpected error occurred.",
        );
        setStep("form");
        return;
      }

      setStep("sent");
      addToast(
        "success",
        "Success",
        data.message || "A password reset link has been sent to your email.",
      );

      // Optional: Auto-redirect after a few seconds like your login page
      setTimeout(() => router.push(loginPath), 3000);
    } catch (err) {
      addToast("error", "Network Error", "Please check your connection.");
      setStep("form");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:p-3.5 lg:gap-3.5 h-screen w-screen bg-white box-border overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[62%] h-full p-[58px_46px] rounded-[24px] relative flex-col items-center justify-center overflow-hidden text-white shrink-0">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(76,47,94,0.91)_0%,rgba(130,81,160,0.97)_65%,rgba(159,99,196,1)_100%)] z-10" />

        <div className="relative z-30 text-center w-full">
          <div className="mb-[38px]">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={220}
              height={65}
              className="mx-auto brightness-0 invert"
            />
          </div>
          <h1 className="text-[32px] font-bold mb-4 leading-tight">
            Join the Legal Community
          </h1>
          <p className="text-lg leading-relaxed mb-10 text-center text-white/90">
            Connect with verified lawyers, get legal advice, and manage your
            case all one place
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-5">
              {["AI-Powered Matching", "Regional Expertise"].map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <CheckSquare
                    size={16}
                    className="fill-[#4C2F5E] stroke-white stroke-[2px]"
                  />
                  <span className="text-lg font-medium">{t}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <CheckSquare
                size={16}
                className="fill-[#4C2F5E] stroke-white stroke-[2px]"
              />
              <span className="text-lg font-medium">
                Verified Professionals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[calc(38%-14px)] h-full p-10 lg:p-[58px_46px] rounded-[24px] bg-[#FCFCFF] flex items-center justify-center overflow-y-auto no-scrollbar box-border">
        <div className="w-full max-w-[340px]">
          {(step === "form" || step === "loading") && (
            <>
              <div className="text-center mb-[18px] mt-[50px]">
                <Image
                  src="/logo-legal-hub.png"
                  alt="Legal Hub"
                  width={155}
                  height={44}
                  className="mx-auto"
                />
              </div>

              <h2 className="text-center text-[22px] font-bold text-[#9F63C4] mb-2">
                Forgot Password?
              </h2>
              <p className="text-center text-sm text-[#9F63C4] mb-7">
                Kindly enter your email address
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className={commonLabelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={commonInputClass(!!fieldErrors.email)}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle size={12} /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                <Button type="submit" isLoading={step === "loading"}>
                  Send
                </Button>
              </form>

              <div className="text-center mt-4">
                <Link
                  href={loginPath}
                  className="text-base text-[#9F63C4] font-semibold"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}

          {step === "sent" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-[22px] font-bold text-[#9F63C4] mb-2">
                Check Your Email
              </h2>
              <p className="text-[#4C2F5E] mb-8 leading-relaxed">
                We have sent a password reset link to <br />
                <strong className="lowercase text-[#9F63C4]">{formData.email}</strong>. <br />
                Please check your inbox and follow the instructions.
              </p>

              <Link href={loginPath} className="w-full">
                <button className="w-full py-3.5 bg-[#9F63C4] text-white border-none rounded-[10px] text-lg font-semibold cursor-pointer transition-colors hover:bg-[#8e54b3]">
                  Back to Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-gray-500">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
