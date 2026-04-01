"use client";

import { CheckSquare, Eye, EyeOff, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { EmailSchema, PasswordSchema } from "@/utils/validation";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/toast/toast-context";
import { FacebookIcon, GoogleIcon } from "@/public/icons/google-facebook-icon";
import {
  commonInputClass,
  commonLabelClass,
} from "@/utils/custom-styling/input-label";

const loginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

type LoginFormData = z.infer<typeof loginSchema>;
type FieldErrors = Partial<Record<keyof LoginFormData, string>>;

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

export default function AdminLogin() {
  const router = useRouter();
  const { addToast, addLoadingWithSuccess } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof LoginFormData, boolean>>
  >({});

  const [rememberMe, setRememberMe] = useState(
    typeof window !== "undefined" &&
      !!localStorage.getItem("admin_remembered_email"),
  );

  const [formData, setFormData] = useState<LoginFormData>(() => ({
    email:
      typeof window !== "undefined"
        ? (localStorage.getItem("admin_remembered_email") ?? "")
        : "",
    password: "",
  }));

  const pwStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null;

  const validateField = (field: keyof LoginFormData, value: string) => {
    const result = loginSchema.shape[field].safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  };

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password" || touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formData[field]),
    }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      addToast(
        "error",
        "Login Failed",
        "Google sign-in failed. Please try again.",
      );
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          loginType: "ADMIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      addLoadingWithSuccess(
        "Verifying",
        "Checking administrative privileges...",
        "Access Granted",
        "Welcome back, Administrator.",
      );

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem("admin_remembered_email", formData.email);
      } else {
        localStorage.removeItem("admin_remembered_email");
      }

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      addToast("error", "Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:p-3.5 lg:gap-3.5 h-screen w-full bg-white box-border overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[62%] h-full p-[58px_46px] rounded-[24px] relative flex-col items-center justify-center overflow-hidden text-white shrink-0">
        <div className="absolute inset-0 z-0 bg-[url('/bg.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(135deg,rgba(76,47,94,0.91)_0%,rgba(130,81,160,0.97)_65%,rgba(159,99,196,1)_100%)]" />

        <div className="relative z-20 text-center w-full">
          <div className="mb-8 xl:mb-[38px]">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={220}
              height={65}
              className="mx-auto brightness-0 invert"
              unoptimized
            />
          </div>
          <h1 className="text-2xl xl:text-[32px] font-bold mb-4 leading-tight">
            Join the Legal Community
          </h1>
          <p className="text-base xl:text-[18px] text-white leading-relaxed mb-8 xl:mb-10 text-center w-full">
            Connect with verified lawyers, get legal advice, and manage your
            case all in one place
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-5 flex-wrap">
              <div className="flex items-center gap-3">
                <CheckSquare
                  size={16}
                  className="fill-[#4C2F5E] stroke-white stroke-[2px] shrink-0"
                />
                <span className="text-base xl:text-[18px] font-medium">
                  AI-Powered Matching
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckSquare
                  size={16}
                  className="fill-[#4C2F5E] stroke-white stroke-[2px] shrink-0"
                />
                <span className="text-base xl:text-[18px] font-medium">
                  Regional Expertise
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckSquare
                size={16}
                className="fill-[#4C2F5E] stroke-white stroke-[2px] shrink-0"
              />
              <span className="text-base xl:text-[18px] font-medium">
                Verified Professionals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - CENTERED */}
      <div className="w-full lg:w-[calc(38%-14px)] h-full px-6 py-10 lg:px-10 lg:py-8 rounded-[24px] bg-[#FCFCFF] flex items-center justify-center overflow-y-auto no-scrollbar shrink-0">
        <div className="w-full max-w-[340px] my-auto">
          <div className="text-center mb-8">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={155}
              height={44}
              className="mx-auto"
              unoptimized
            />
          </div>
          <h2 className="text-center text-xl xl:text-[22px] font-bold mb-6 text-[#9F63C4]">
            Login
          </h2>

          <div className="flex gap-3 mb-5">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
            </button>
            <button className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors cursor-pointer">
              <FacebookIcon />
            </button>
          </div>

          <div className="relative mb-5">
            <div className="border-t border-gray-200 absolute top-1/2 w-full" />
            <div className="relative flex justify-center text-[15px]">
              <span className="bg-[#FCFCFF] px-3 text-gray-400">or</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div>
              <label className={commonLabelClass}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
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

            <div>
              <label className={commonLabelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={`${commonInputClass(!!fieldErrors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {formData.password && pwStrength && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${pwStrength.color} ${pwStrength.width}`}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px] font-semibold">
                    <p className={pwStrength.textColor}>{pwStrength.label}</p>
                    <p
                      className={
                        formData.password.length >= 8
                          ? "text-gray-400"
                          : "text-orange-500"
                      }
                    >
                      {formData.password.length} / 16
                    </p>
                  </div>
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <XCircle size={12} /> {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-500">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-purple-600"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password?portal=admin"
                className="text-[14px] font-medium text-[#9F63C4] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" isLoading={loading} className="w-full">
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
