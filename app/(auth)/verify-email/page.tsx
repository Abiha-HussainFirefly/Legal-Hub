"use client";

import { CheckSquare, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AuthShell from "@/app/components/ui/auth/auth-shell";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/toast/toast-context";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const email = searchParams.get("email") || "";
  const [code, setCode] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState<"verify" | "success">("verify");
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    
    // Focus last input or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      addToast("error", "Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast("error", "Verification Failed", data.message || "Invalid or expired code.");
        setLoading(false);
        return;
      }

      setStep("success");
      addToast("success", "Email Verified", "Redirecting to your dashboard...");
      setTimeout(() => router.push("/lawyerlogin"), 2000);
    } catch {
      addToast("error", "Network Error", "Please check your connection.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/email/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        addToast("success", "Code Sent", "A new 6-digit code has been sent to your email.");
      } else {
        addToast("error", "Error", "Could not resend code. Please try again later.");
      }
    } catch {
      addToast("error", "Network Error", "Please check your connection.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title="Verify Email" description="Enter the 6-digit code sent to your email to verify your account.">
          {step === "verify" ? (
            <>
              <div className="text-center mb-[18px] mt-[50px]">
                <Image src="/logo-legal-hub.png" alt="Legal Hub" width={155} height={44} className="mx-auto lg:hidden" />
              </div>

              <h2 className="text-center text-[22px] font-bold text-[#9F63C4] mb-2">
                Verify Your Email
              </h2>
              <p className="text-center text-sm text-[#4C2F5E] mb-7 leading-relaxed">
                Enter the 6-digit code sent to<br/>
                <span className="font-semibold text-[#9F63C4]">{email}</span>
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex justify-between gap-2">
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-[#9F63C4] focus:outline-none transition-all bg-white text-[#4C2F5E]"
                    />
                  ))}
                </div>

                <Button type="submit" isLoading={loading}>
                  Verify Now
                </Button>
              </form>

              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the code?</p>
                <button 
                  onClick={handleResend}
                  disabled={resending}
                  className="text-[#9F63C4] font-bold hover:underline disabled:opacity-50"
                >
                  {resending ? "Resending..." : "Resend Code"}
                </button>
              </div>
              
              <div className="text-center mt-6">
                <Link href="/lawyerlogin" className="text-base text-gray-400 font-semibold">
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-[22px] font-bold text-[#9F63C4] mb-2">
                Successfully Verified!
              </h2>
              <p className="text-[#4C2F5E] mb-8 leading-relaxed">
                Your email has been confirmed. You can now login to your dashboard.
              </p>

              <Link href="/lawyerlogin" className="w-full">
                <Button className="w-full">
                  Login Now
                </Button>
              </Link>
            </div>
          )}
        </AuthShell>);
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
