"use client";

import { CheckSquare, Eye, EyeOff, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { EmailSchema, PasswordSchema } from "@/utils/validation";
import { Button } from "@/app/components/ui/button";
import Tooltip from "@/app/components/ui/tooltip";
import { useToast } from "@/app/components/ui/toast/toast-context";
import { FacebookIcon, GoogleIcon } from "@/public/icons/google-facebook-icon";
import { commonInputClass, commonLabelClass } from "@/utils/custom-styling/input-label";

// Zod Schema for Validation
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
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1)
    return {
      label: "Weak",
      color: "bg-red-500",
      textColor: "text-red-500",
      width: "w-1/3",
    };
  if (score === 2)
    return {
      label: "Fair",
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
      width: "w-2/3",
    };
  return {
    label: "Strong",
    color: "bg-green-500",
    textColor: "text-green-500",
    width: "w-full",
  };
};

export default function ClientLogin() {
  const router = useRouter();
  const { addToast, addLoadingWithSuccess } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof LoginFormData, boolean>>
  >({});

  const pwStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null;

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

    setLoading(true);

    try {
      // Replace with your actual API call
      setTimeout(() => {
        setLoading(false);
        addLoadingWithSuccess(
          "Authenticating",
          "Verifying your credentials...",
          "Login Successful",
          "Welcome back! Redirecting to dashboard...",
        );
        router.push("/dashboard");
      }, 1500);
    } catch {
      setLoading(false);
      addToast("error", "Login Failed", "Invalid email or password.");
    }
  };

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
          <p className="text-lg leading-relaxed mb-10 text-center text-white/90 w-full whitespace-nowrap">
            Connect with verified lawyers, get legal advice, and manage your
            case all one place
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-5">
              <div className="flex items-center gap-3">
                <CheckSquare
                  size={16}
                  className="fill-[#4C2F5E] stroke-white stroke-[2px] shrink-0"
                />
                <span className="text-lg font-medium">AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckSquare
                  size={16}
                  className="fill-[#4C2F5E] stroke-white stroke-[2px] shrink-0"
                />
                <span className="text-lg font-medium">Regional Expertise</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckSquare
                size={16}
                className="fill-[#4C2F5E] stroke-white stroke-[2px] shrink-0"
              />
              <span className="text-lg font-medium">
                Verified Professionals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[calc(38%-14px)] h-full p-10 lg:p-[58px_46px] rounded-[24px] bg-[#FCFCFF] flex items-center justify-center overflow-y-auto no-scrollbar shrink-0">
        <div className="w-full max-w-[340px]">
          <div className="text-center mb-[18px]">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={155}
              height={44}
              className="mx-auto"
            />
          </div>
          <h2 className="text-center text-[22px] font-bold text-[#9F63C4] mb-6">
            Login
          </h2>

          <div className="flex gap-3 mb-5">
            <Tooltip content="Continue with Google">
              <button className="flex-1 flex items-center justify-center p-3 border-[1.5px] border-gray-200 rounded-[10px] bg-white cursor-pointer hover:bg-gray-50 transition-colors" aria-label="Continue with Google">
                <GoogleIcon />
              </button>
            </Tooltip>
            <Tooltip content="Continue with Facebook">
              <button className="flex-1 flex items-center justify-center p-3 border-[1.5px] border-gray-200 rounded-[10px] bg-white cursor-pointer hover:bg-gray-50 transition-colors" aria-label="Continue with Facebook">
                <FacebookIcon />
              </button>
            </Tooltip>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-[15px]">
              <span className="bg-[#FCFCFF] px-3 text-gray-400">or</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            <div>
              <label className={commonLabelClass}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
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

            <div>
              <label className={commonLabelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className={`${commonInputClass(!!fieldErrors.password)} pr-11`}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                />
                <Tooltip content={showPassword ? "Hide password" : "Show password"}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </Tooltip>
              </div>
              {formData.password && pwStrength && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pwStrength.color} ${pwStrength.width} transition-all duration-300`}
                    />
                  </div>
                  <p
                    className={`text-[11px] font-semibold mt-1 ${pwStrength.textColor}`}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-500">
                <input type="checkbox" className="w-4 h-4 accent-purple-600" />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-[14px] text-[#9F63C4] font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" isLoading={loading}>
              Login
            </Button>
          </form>

          <p className="text-center text-base text-black mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/lawyerregister" className="text-[#9F63C4] font-bold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
