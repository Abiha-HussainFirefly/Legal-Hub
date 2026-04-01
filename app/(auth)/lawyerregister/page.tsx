"use client";

import { CheckSquare, Eye, EyeOff, XCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { EmailSchema, NameSchema, PasswordSchema } from "@/utils/validation";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/toast/toast-context";
import { FacebookIcon, GoogleIcon } from "@/public/icons/google-facebook-icon";
import { commonInputClass, commonLabelClass } from "@/utils/custom-styling/input-label";

const registerSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
});

type RegisterFormData = z.infer<typeof registerSchema>;
type FieldErrors = Partial<Record<keyof RegisterFormData, string>>;
type WorkflowStep = "form" | "loading";

export default function LawyerRegister() {
  const router = useRouter();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<WorkflowStep>("form");
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterFormData, boolean>>
  >({});

  const validateField = (field: keyof RegisterFormData, value: string) => {
    const result = registerSchema.shape[field].safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  };

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof RegisterFormData;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStep("loading");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          barCouncilNo: "N/A",
          jurisdiction: "N/A",
          expertise: "N/A",
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setStep("form");
        addToast(
          "error",
          "Email Already Registered",
          "This email is already in use. Please use a different email or login.",
        );
        return;
      }

      if (!res.ok) {
        setStep("form");
        addToast(
          "error",
          "Registration Failed",
          data.message ?? "Please try again.",
        );
        return;
      }

      // Success - show success toast and stay on page
      addToast(
        "success",
        "Registration Successful!",
        "Your account has been created. Redirecting to login...",
      );

      // Send welcome email in background
      try {
        await fetch("/api/email/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, name: formData.name }),
        });
      } catch {
        // Suppress errors for welcome email
      }

      // Reset form state
      setFormData({ name: "", email: "", password: "" });
      setStep("form");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/lawyerlogin");
      }, 3000);
    } catch {
      setStep("form");
      addToast("error", "Network Error", "Please check your connection.");
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1)
      return {
        label: "Very Weak",
        color: "bg-red-500",
        textColor: "text-red-500",
        width: "w-[20%]",
      };
    if (score === 2)
      return {
        label: "Weak",
        color: "bg-orange-500",
        textColor: "text-orange-500",
        width: "w-[40%]",
      };
    if (score === 3)
      return {
        label: "Fair",
        color: "bg-yellow-500",
        textColor: "text-yellow-500",
        width: "w-[60%]",
      };
    if (score === 4)
      return {
        label: "Strong",
        color: "bg-green-500",
        textColor: "text-green-500",
        width: "w-[80%]",
      };
    return {
      label: "Very Strong",
      color: "bg-green-600",
      textColor: "text-green-600",
      width: "w-full",
    };
  };

  const pwStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null;


  return (
    <div className="flex flex-col lg:flex-row lg:p-3.5 lg:gap-3.5 h-screen w-full bg-white box-border overflow-hidden">
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
              <div className="flex items-center gap-3">
                <CheckSquare
                  size={16}
                  className="fill-[#4C2F5E] stroke-white stroke-[2px]"
                />
                <span className="text-lg font-medium">AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckSquare
                  size={16}
                  className="fill-[#4C2F5E] stroke-white stroke-[2px]"
                />
                <span className="text-lg font-medium">Regional Expertise</span>
              </div>
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
      <div className="w-full lg:w-[calc(38%-14px)] h-full overflow-y-auto no-scrollbar px-6 py-10 lg:px-10 lg:py-8 rounded-[24px] bg-[#FCFCFF] flex items-center justify-center shrink-0">
        <div className="w-full max-w-[340px] my-auto">
          <>
            <div className="text-center mb-3.5">
              <Image
                src="/logo-legal-hub.png"
                alt="Legal Hub"
                width={155}
                height={44}
                className="mx-auto"
              />
            </div>
            <h2 className="text-center text-[22px] font-bold text-[#9F63C4] mb-5">
              Sign up
            </h2>

            <div className="flex gap-3 mb-4.5">
              <button
                type="button"
                onClick={() =>
                  signIn("google", { callbackUrl: "/discussions" })
                }
                className="flex-1 flex items-center justify-center p-3 border-[1.5px] border-gray-200 rounded-[10px] bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center p-3 border-[1.5px] border-gray-200 rounded-[10px] bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <FacebookIcon />
              </button>
            </div>

            <div className="relative mb-4.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-[15px]">
                <span className="bg-[#FCFCFF] px-3 text-gray-400">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3.5">
                <label className={commonLabelClass}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name here"
                  className={commonInputClass(!!fieldErrors.name)}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircle size={12} /> {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="mb-3.5">
                <label className={commonLabelClass}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address here"
                  className={commonInputClass(!!fieldErrors.email)}
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircle size={12} /> {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="mb-1.5">
                <label className={commonLabelClass}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password here"
                    className={`${commonInputClass(!!fieldErrors.password)} pr-11`}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {formData.password && pwStrength && (
                  <div className="mt-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pwStrength.color} ${pwStrength.width} transition-all duration-300`}
                      />
                    </div>
                    <p
                      className={`text-[11px] font-semibold mt-0.5 ${pwStrength.textColor}`}
                    >
                      {pwStrength.label}
                    </p>
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircle size={12} /> {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="mb-5" />
              <Button type="submit" isLoading={step === "loading"}>
                Submit
              </Button>
            </form>

            <p className="text-center text-base text-black mt-4">
              Already have an account?{" "}
              <Link href="/lawyerlogin" className="text-[#9F63C4] font-bold">
                Login
              </Link>
            </p>
          </>
        </div>
      </div>
    </div>
  );
}
