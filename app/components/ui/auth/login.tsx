"use client";

import { Button } from "@/app/components/ui/button";
import Tooltip from "@/app/components/ui/tooltip";
import { useToast } from "@/app/components/ui/toast/toast-context";
import { GoogleIcon } from "@/public/icons/google-facebook-icon";
import { commonInputClass, commonLabelClass } from "@/utils/custom-styling/input-label";
import { EmailSchema, PasswordSchema } from "@/utils/validation";
import { CheckCircle2, CheckSquare, Eye, EyeOff, XCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

const loginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

type LoginFormData = z.infer<typeof loginSchema>;
type FieldErrors = Partial<Record<keyof LoginFormData, string>>;
type LoginStep = "form" | "processing" | "success";

interface LoginFormProps {
  loginType: "LAWYER" | "ADMIN";
  rememberMeKey: string;
  redirectPath: string;
  registerPath?: string;
  forgotPasswordPortal: string;
  showSocialLogin?: boolean;
}

export default function LoginForm({
  loginType,
  rememberMeKey,
  redirectPath,
  registerPath,
  forgotPasswordPortal,
  showSocialLogin = true,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>("form");
  const [formData, setFormData] = useState<LoginFormData>(() => ({
    email:
      typeof window !== "undefined"
        ? (localStorage.getItem(rememberMeKey) ?? "")
        : "",
    password: "",
  }));

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [rememberMe, setRememberMe] = useState(
    typeof window !== "undefined" && !!localStorage.getItem(rememberMeKey),
  );

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "ADMIN_SOCIAL_BLOCKED") {
      addToast(
        "error",
        "Security Restriction",
        "This is an Admin account. Please use the dedicated Admin Portal to log in securely using your email and password.",
      );
      router.replace(`/${loginType.toLowerCase()}login`);
    } else if (error === "ACCOUNT_SUSPENDED") {
      addToast("error", "Access Denied", "Your account has been suspended.");
      router.replace(`/${loginType.toLowerCase()}login`);
    }
  }, [searchParams, addToast, router, loginType]);

  const validateField = (field: keyof LoginFormData, value: string) => {
    const result = loginSchema.shape[field].safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  };

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
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

  const runLoginPipeline = async (values: LoginFormData) => {
    setTouched({ email: true, password: true });
    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof LoginFormData;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStep("processing");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, loginType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStep("form");
        addToast(
          res.status === 403 ? "warning" : "error",
          res.status === 403 ? "Account Notice" : "Login Failed",
          data.message || "An error occurred.",
        );
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (rememberMe) {
        localStorage.setItem(rememberMeKey, values.email);
      } else {
        localStorage.removeItem(rememberMeKey);
      }

      setStep("success");
      addToast("success", "Access Granted", "Welcome back! Redirecting...");
      setTimeout(() => router.push(redirectPath), 1800);
    } catch {
      setStep("form");
      addToast("error", "Network Error", "Please check your connection.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:p-3.5 lg:gap-3.5 h-screen w-full bg-white box-border overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[62%] h-full p-[58px_46px] rounded-[24px] relative flex-col items-center justify-center overflow-hidden text-white">
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
          <p className="text-lg leading-relaxed mb-10 text-center w-full">
            Connect with verified lawyers, get legal advice, and manage your
            case all one place
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-5">
              <div className="flex items-center gap-3">
                <CheckSquare size={16} className="fill-[#4C2F5E] stroke-white stroke-[2px]" />
                <span className="text-lg font-medium">AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckSquare size={16} className="fill-[#4C2F5E] stroke-white stroke-[2px]" />
                <span className="text-lg font-medium">Regional Expertise</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckSquare size={16} className="fill-[#4C2F5E] stroke-white stroke-[2px]" />
              <span className="text-lg font-medium">Verified Professionals</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[calc(38%-14px)] h-full overflow-y-auto no-scrollbar px-6 py-10 lg:px-10 lg:py-8 rounded-[24px] bg-[#FCFCFF] flex items-center justify-center">
        <div className="w-full max-w-[340px] my-auto">
          {(step === "form" || step === "processing") && (
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
                Login
              </h2>

              {/* Google button — only shown when showSocialLogin is true */}
              {showSocialLogin && (
                <>
                  <Tooltip content="Continue with Google">
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: redirectPath })}
                      className="w-full flex items-center justify-center p-3 border-[1.5px] border-gray-200 rounded-[10px] bg-white hover:bg-gray-50 transition-colors cursor-pointer mb-5"
                      aria-label="Continue with Google"
                    >
                      <GoogleIcon />
                    </button>
                  </Tooltip>

                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[15px]">
                      <span className="bg-[#FCFCFF] px-3 text-gray-400">or</span>
                    </div>
                  </div>
                </>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  const values = {
                    email: String(form.get("email") ?? ""),
                    password: String(form.get("password") ?? ""),
                  };
                  setFormData(values);
                  runLoginPipeline(values);
                }}
                noValidate
              >
                <div className="mb-3.5 mt-4">
                  <label className={commonLabelClass}>Email</label>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    className={commonInputClass(!!fieldErrors.email)}
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle size={12} /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="mb-2 mt-4">
                  <label className={commonLabelClass}>Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Password"
                      className={`${commonInputClass(!!fieldErrors.password)} pr-11`}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                    />
                    <Tooltip content={showPassword ? "Hide password" : "Show password"}>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </Tooltip>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle size={12} /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mb-7">
                  <label className="flex items-center gap-2 cursor-pointer text-base mt-4 text-gray-500">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    Remember me
                  </label>
                  <Link
                    href={`/forgot-password?portal=${forgotPasswordPortal}`}
                    className="text-base text-[#9F63C4] font-semibold mt-4"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  isLoading={step === "processing"}
                  className="w-full"
                >
                  Login
                </Button>
              </form>

              {registerPath && (
                <p className="text-center text-base text-black mt-4">
                  Don&apos;t have an account?{" "}
                  <Link href={registerPath} className="text-[#9F63C4] font-bold">
                    Sign up
                  </Link>
                </p>
              )}
            </>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <p className="text-xl font-bold text-green-700 mb-2">
                Access Granted
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
