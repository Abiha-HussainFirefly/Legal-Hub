'use client';

import {
  Eye, EyeOff, CheckSquare,
  XCircle, AlertTriangle, CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Zod Schema //
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .refine(
      val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: 'Please enter a valid email address' }
    ),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type FieldErrors   = Partial<Record<keyof LoginFormData, string>>;
type LoginStep     = 'form' | 'processing' | 'account_issue' | 'success' | 'error';

const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[a-z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;

  if (score <= 1) return { label: 'Very Weak',   color: '#ef4444', width: '20%'  };
  if (score === 2) return { label: 'Weak',        color: '#f97316', width: '40%'  };
  if (score === 3) return { label: 'Fair',        color: '#eab308', width: '60%'  };
  if (score === 4) return { label: 'Strong',      color: '#22c55e', width: '80%'  };
  return                  { label: 'Very Strong', color: '#16a34a', width: '100%' };
};

export default function LawyerLogin() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep]                 = useState<LoginStep>('form');
  const [errorMsg, setErrorMsg]         = useState('');
  const [errorCode, setErrorCode]       = useState('');
  const [formData, setFormData]         = useState<LoginFormData>(() => ({
    email:    typeof window !== 'undefined' ? localStorage.getItem('lawyer_remembered_email') ?? '' : '',
    password: '',
  }));

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched]         = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [rememberMe, setRememberMe]   = useState(
    typeof window !== 'undefined' && !!localStorage.getItem('lawyer_remembered_email')
  );

  const pwStrength = formData.password ? getPasswordStrength(formData.password) : null;

  // Helpers 
  const validateField = (field: keyof LoginFormData, value: string): string | undefined => {
    const result = loginSchema.shape[field].safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  };

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') {
      const err = validateField('password', value);
      setFieldErrors(prev => ({ ...prev, password: err }));
    } else if (touched[field]) {
      const err = validateField(field, value);
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  // Submit 
  const runLoginPipeline = async () => {
    setTouched({ email: true, password: true });

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach(err => {
        const field = err.path[0] as keyof LoginFormData;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return; 
    }

    setFieldErrors({});
    setStep('processing');
    setErrorMsg('');

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:     formData.email,
          password:  formData.password,
          loginType: 'LAWYER',
        }),
      });
      const data = await res.json();

      await new Promise(r => setTimeout(r, 1000));

      if (!res.ok) {
        if (['ACCOUNT_SUSPENDED', 'ACCOUNT_DISABLED', 'OAUTH_ONLY', 'UNAUTHORIZED'].includes(data.error)) {
          setErrorMsg(data.message);
          setErrorCode(data.error);
          setStep('account_issue');
          return;
        }
        setErrorMsg(data.message ?? 'Invalid email or password.');
        setErrorCode(data.error ?? 'LOGIN_FAILED');
        setStep('error');
        return;
      }

      localStorage.setItem('user_name', data.user.displayName);
      localStorage.setItem('user_role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem('lawyer_remembered_email', formData.email);
      } else {
        localStorage.removeItem('lawyer_remembered_email');
      }

      setStep('success');
      setTimeout(() => router.push('/discussions'), 1800);

    } catch {
      setErrorMsg('Network error. Please check your internet connection.');
      setErrorCode('NETWORK_ERROR');
      setStep('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runLoginPipeline();
  };

  //  Styles
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${hasError ? '#ef4444' : '#e5e7eb'}`,
    borderRadius: '10px', fontSize: '15px',
    fontFamily: 'inherit', color: '#1a1a2e',
    background: hasError ? '#fff5f5' : '#fafafa',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '15px', fontWeight: 600,
    color: '#374151', marginBottom: '6px',
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: '12px', color: '#ef4444',
    marginTop: '4px', display: 'flex',
    alignItems: 'center', gap: '4px',
  };

  return (
    
    <div
      className="flex flex-col lg:flex-row lg:p-[14px] lg:gap-[14px] lg:h-screen lg:overflow-hidden"
      style={{ width: '100%', minHeight: '100vh', backgroundColor: '#FFFFFF', alignItems: 'stretch', boxSizing: 'border-box' }}
    >

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-[62%] lg:h-full lg:p-[58px_46px]"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          height: '100%',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          color: 'white',
        }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }} />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(76,47,94,0.91) 0%, rgba(130,81,160,0.97) 65%, rgba(159,99,196,1) 100%)',
          zIndex: 1,
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '100%' }}>


          <div style={{ marginBottom: '38px' }}>
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={220}
              height={65}
              style={{ margin: '0 auto', filter: 'brightness(0) invert(1)' }}
            />
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', lineHeight: 1.3 }}>
            Join the Legal Community
          </h1>

          <p 
            style={{ 
              fontSize: '18px', 
              color: '#ffffff', 
              lineHeight: 1.5, 
              marginBottom: '40px', 
              textAlign: 'center'
            }} 
            className="w-full"
          >
            Connect with verified lawyers, get legal advice, and manage your case all one place
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                <CheckSquare
                  size={16}
                  fill="#4C2F5E"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 500 }}>AI-Powered Matching</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                <CheckSquare
                  size={16}
                  fill="#4C2F5E"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 500 }}>Regional Expertise</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
              <CheckSquare
                size={16}
                fill="#4C2F5E"
                stroke="#FFFFFF"
                strokeWidth={2}
                style={{ flexShrink: 0 }}
              />
              <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 500 }}>
                Verified Professionals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="w-full min-h-screen lg:min-h-0 lg:w-[calc(38%-14px)] lg:h-full px-6 py-10 lg:px-[40px] lg:py-[32px]"
        style={{ borderRadius: '24px', backgroundColor: '#FCFCFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflowY: 'auto' }}
      >
        <div style={{ width: '100%', maxWidth: '340px' }}>

          {step === 'form' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '14px',paddingTop: '20px' }}>
                <Image src="/logo-legal-hub.png" alt="Legal Hub" width={155} height={44} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#9F63C4', marginBottom: '20px' }}>Login</h2>

              {/* Social Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button
  type="button"
  onClick={() => signIn('google', { callbackUrl: '/discussions' })}
  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: 'white', cursor: 'pointer' }}
>
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
</button>
                <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: 'white', cursor: 'pointer' }}>
                  <svg width="24" height="24" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ borderTop: '1px solid #e5e7eb', position: 'absolute', top: '50%', width: '100%' }} />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <span style={{ background: 'white', padding: '0 12px', color: '#9ca3af', fontSize: '15px' }}>or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* Email */}
                <div style={{ marginBottom: '14px', marginTop: '16px' }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    style={inputStyle(!!fieldErrors.email)}
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                  />
                  {fieldErrors.email && (
                    <p style={errorTextStyle}>
                      <XCircle size={12} /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '8px', marginTop: '16px' }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      style={{ ...inputStyle(!!fieldErrors.password), paddingRight: '44px' }}
                      value={formData.password}
                      onChange={e => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {formData.password && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: pwStrength!.width,
                          background: pwStrength!.color,
                          borderRadius: '4px',
                          transition: 'width 0.3s ease, background 0.3s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                        <p style={{ fontSize: '11px', color: pwStrength!.color, margin: 0, fontWeight: 600 }}>
                          {pwStrength!.label}
                        </p>
                        <p style={{ fontSize: '11px', margin: 0, fontWeight: 600, color: formData.password.length > 16 ? '#ef4444' : formData.password.length >= 8 ? '#9ca3af' : '#f97316' }}>
                          {formData.password.length} / 16
                        </p>
                      </div>
                    </div>
                  )}

                  {fieldErrors.password && (
                    <p style={errorTextStyle}>
                      <XCircle size={12} /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', marginTop: '16px', color: '#6b7280' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#9333ea' }}
                    />
                    Remember me
                  </label>
                  <Link href="/forgot-password?portal=lawyer" style={{ fontSize: '16px', color: '#9F63C4', fontWeight: 600, marginTop: '16px', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" style={{ width: '100%', padding: '14px', background: '#9F63C4', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Login
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '16px', color: '#000', marginTop: '16px' }}>
                Don&apos;t have an account?{' '}
                <Link href="/lawyerregister" style={{ color: '#9F63C4', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
              </p>
            </>
          )}

          {step === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid rgba(159,99,196,0.20)', borderTopColor: '#9F63C4', animation: 'lh-spin 0.8s linear infinite', marginBottom: 20 }} />
              <style>{`@keyframes lh-spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#4C2F5E' }}>Verifying Credentials</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>Securing your legal session...</p>
            </div>
          )}

          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircle2 size={40} color="#22c55e" />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#15803d', marginBottom: 8 }}>Access Granted</p>
              <p style={{ fontSize: '14px', color: '#777' }}>Redirecting to your dashboard...</p>
            </div>
          )}

          {(step === 'error' || step === 'account_issue') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {errorCode === 'OAUTH_ONLY'
                ? <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: 16 }} />
                : <XCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
              }
              <p style={{ fontSize: '18px', fontWeight: 700, color: step === 'error' ? '#b91c1c' : '#4C2F5E', marginBottom: 8 }}>
                {step === 'error' ? 'Login Failed' : 'Account Notice'}
              </p>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: 24 }}>{errorMsg}</p>
              <button type="button" onClick={() => setStep('form')} style={{ width: '100%', padding: '13px', background: '#9F63C4', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', fontWeight: 600, fontFamily: 'inherit' }}>
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
