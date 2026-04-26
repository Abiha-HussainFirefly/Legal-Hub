"use client";

import {
  CheckSquare,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/app/components/ui/button";
import Tooltip from "@/app/components/ui/tooltip";
import { useToast } from "@/app/components/ui/toast/toast-context";
import { commonInputClass, commonLabelClass } from "@/utils/custom-styling/input-label";

type ResetStep = "form" | "loading" | "success" | "invalid";

function ResetPasswordForm() {
  const router = useRouter();
  const { addToast } = useToast();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const portal = searchParams.get("portal") || "lawyer";
  const loginPath =
    portal === "admin"
      ? "/adminlogin"
      : portal === "client"
        ? "/clientlogin"
        : "/lawyerlogin";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<ResetStep>(token ? "form" : "invalid");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      addToast("error", "Validation Error", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      addToast(
        "error",
        "Validation Error",
        "Password must be at least 8 characters.",
      );
      return;
    }

    setStep("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast(
          "error",
          "Reset Failed",
          data.message || "Something went wrong.",
        );
        setStep("form");
        return;
      }

      setStep("success");
      addToast("success", "Password Updated", "Redirecting to login...");
      setTimeout(() => router.push(loginPath), 3000);
    } catch {
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
      <div className="w-full lg:w-[calc(38%-14px)] h-full p-10 lg:p-[58px_46px] rounded-[24px] bg-[#FCFCFF] flex items-center justify-center overflow-y-auto no-scrollbar box-border shrink-0">
        <div className="w-full max-w-[340px]">
          <div className="text-center mb-[18px] mt-[50px] lg:mt-0">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={155}
              height={44}
              className="mx-auto"
            />
          </div>

          {/* INVALID TOKEN */}
          {step === "invalid" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h2 className="text-[22px] font-bold text-red-700 mb-2">
                Invalid Link
              </h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                This reset link is missing or invalid. Please request a new one.
              </p>
              <Link href="/forgot-password" className="w-full">
                <button className="w-full py-3.5 bg-[#9F63C4] text-white rounded-[10px] text-lg font-semibold hover:bg-[#8e54b3] transition-colors">
                  Request New Link
                </button>
              </Link>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-[22px] font-bold text-[#16a34a] mb-2">
                Password Reset ✅
              </h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Your password has been updated successfully. Redirecting you to
                login...
              </p>
              <Link href={loginPath} className="w-full">
                <button className="w-full py-3.5 bg-[#9F63C4] text-white rounded-[10px] text-lg font-semibold">
                  Go to Login
                </button>
              </Link>
            </div>
          )}

          {/* FORM */}
          {(step === "form" || step === "loading") && (
            <>
              <h2 className="text-center text-[22px] font-bold text-[#4C2F5E] mb-2">
                Set New Password
              </h2>
              <p className="text-center text-sm text-[#9F63C4] mb-8">
                Enter your new password below
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className={commonLabelClass}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${commonInputClass(false)} pr-11`}
                      required
                    />
                    <Tooltip content={showPass ? "Hide password" : "Show password"}>
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={commonLabelClass}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={`${commonInputClass(false)} pr-11`}
                      required
                    />
                    <Tooltip content={showConfirm ? "Hide password" : "Show password"}>
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={step === "loading"}
                  className="w-full mt-2"
                >
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-lg text-[#9F63C4]">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
