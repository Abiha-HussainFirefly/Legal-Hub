'use client';

import { CheckSquare, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

type ResetStep = 'form' | 'loading' | 'success' | 'error' | 'invalid';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');
  const portal       = searchParams.get('portal') || 'lawyer';
  const loginPath    = portal === 'admin' ? '/adminlogin' : '/lawyerlogin';

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step,        setStep]        = useState<ResetStep>(token ? 'form' : 'invalid');
  const [errorMsg,    setErrorMsg]    = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 44px 13px 16px',
    border: '1.5px solid #e5e7eb', borderRadius: '10px',
    fontSize: '16px', outline: 'none', fontFamily: 'inherit',
    color: '#374151', background: '#fafafa', boxSizing: 'border-box',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      setStep('error');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      setStep('error');
      return;
    }

    setStep('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Something went wrong.');
        setStep('error');
        return;
      }

      setStep('success');
      setTimeout(() => router.push(loginPath), 3000);

    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setStep('error');
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#FFFFFF',
      display: 'flex', flexDirection: 'row', alignItems: 'stretch',
      padding: '14px', gap: '14px', boxSizing: 'border-box', overflow: 'hidden',
    }}>

      {/* LEFT PANEL */}
      <div style={{
        width: '62%', height: '100%', borderRadius: '24px', overflow: 'hidden',
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '58px 46px', boxSizing: 'border-box', color: 'white',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(76,47,94,0.91) 0%,rgba(130,81,160,0.97) 65%,rgba(159,99,196,1) 100%)', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '100%' }}>
          <div style={{ marginBottom: '38px' }}>
            <Image src="/logo-legal-hub.png" alt="Legal Hub" width={220} height={65}
              style={{ margin: '0 auto', filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>
            Join the Legal Community
          </h1>
          <p style={{ fontSize: '18px', color: '#ffffff', lineHeight: 1.5, marginBottom: '40px' }}>
            Connect with verified lawyers, get legal advice, and manage your case all in one place
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              {['AI-Powered Matching', 'Regional Expertise'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                  <CheckSquare size={16} fill="#4C2F5E" stroke="#FFFFFF" strokeWidth={2} />
                  <span style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
              <CheckSquare size={16} fill="#4C2F5E" stroke="#FFFFFF" strokeWidth={2} />
              <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 500 }}>Verified Professionals</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: 'calc(38% - 14px)', height: '100%', borderRadius: '24px',
        backgroundColor: '#FCFCFF', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '58px 46px',
        boxSizing: 'border-box', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>

          <div style={{ textAlign: 'center', marginBottom: '18px', marginTop: '50px' }}>
            <Image src="/logo-legal-hub.png" alt="Legal Hub" width={155} height={44} style={{ margin: '0 auto' }} />
          </div>

          {/* INVALID TOKEN */}
          {step === 'invalid' && (
            <>
              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#b91c1c', marginBottom: '8px' }}>
                Invalid Link
              </h2>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                This reset link is missing or invalid. Please request a new one.
              </p>
              <Link href="/forgot-password" style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '14px', background: '#9F63C4', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 600, cursor: 'pointer' }}>
                  Request New Link
                </button>
              </Link>
            </>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <>
              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>
                Password Reset ✅
              </h2>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                Your password has been updated successfully. Redirecting you to login...
              </p>
              <Link href={loginPath} style={{ textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '14px', background: '#9F63C4', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 600, cursor: 'pointer' }}>
                  Go to Login
                </button>
              </Link>
            </>
          )}

          {/* FORM */}
          {(step === 'form' || step === 'loading' || step === 'error') && (
            <>
              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#4C2F5E', marginBottom: '8px' }}>
                Set New Password
              </h2>
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#9F63C4', marginBottom: '28px' }}>
                Enter your new password below
              </p>

              {step === 'error' && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px', padding: '11px 14px', fontSize: '13px',
                  color: '#b91c1c', marginBottom: '16px', textAlign: 'center'
                }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter your new password here"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={inputStyle}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      style={inputStyle}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={step === 'loading'}
                  style={{
                    width: '100%', padding: '14px',
                    background: step === 'loading' ? '#c4a0dc' : '#9F63C4',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontSize: '18px', fontWeight: 600,
                    cursor: step === 'loading' ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {step === 'loading' && <Loader2 className="animate-spin w-5 h-5" />}
                  {step === 'loading' ? 'Resetting...' : 'Reset Password'}
                </button>
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
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '18px', color: '#9F63C4' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
