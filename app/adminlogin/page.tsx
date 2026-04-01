'use client';

import { CheckSquare, Eye, EyeOff, XCircle } from 'lucide-react';
import Image     from 'next/image';
import Link      from 'next/link';
import { useRouter } from 'next/navigation';
import { useState }  from 'react';
import { z }         from 'zod';
import { signIn }    from 'next-auth/react';

// Zod validation schema

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .refine(
      (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: 'Please enter a valid email address' },
    ),
  password: z
    .string()
    .min(1,  'Password is required')
    .min(8,  'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .regex(/[A-Z]/,       'Password must contain at least one uppercase letter')
    .regex(/[a-z]/,       'Password must contain at least one lowercase letter')
    .regex(/[0-9]/,       'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type FieldErrors   = Partial<Record<keyof LoginFormData, string>>;

const getPasswordStrength = (
  pwd: string,
): { label: string; color: string; width: string } => {
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

export default function AdminLogin() {
  const router = useRouter();

  const [showPassword,  setShowPassword]  = useState(false);
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors,   setFieldErrors]   = useState<FieldErrors>({});
  const [touched,       setTouched]       = useState<Partial<Record<keyof LoginFormData, boolean>>>({});

  const [rememberMe, setRememberMe] = useState(
    typeof window !== 'undefined' && !!localStorage.getItem('admin_remembered_email'),
  );

  const [formData, setFormData] = useState<LoginFormData>(() => ({
    email:    typeof window !== 'undefined'
                ? (localStorage.getItem('admin_remembered_email') ?? '')
                : '',
    password: '',
  }));

  const pwStrength = formData.password ? getPasswordStrength(formData.password) : null;

  const validateField = (
    field: keyof LoginFormData,
    value: string,
  ): string | undefined => {
    const result = loginSchema.shape[field].safeParse(value);
    return result.success ? undefined : result.error.issues[0].message;
  };

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (field === 'password' || touched[field]) {
      const err = validateField(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

 
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      await signIn('google', { callbackUrl: '/dashboard' });
      
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:     formData.email,
          password:  formData.password,
          loginType: 'ADMIN',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

     
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem('admin_remembered_email', formData.email);
      } else {
        localStorage.removeItem('admin_remembered_email');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize:   '12px',
    color:      '#ef4444',
    marginTop:  '4px',
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
  };

  
  return (
    <div className="flex flex-col lg:flex-row lg:p-[14px] lg:gap-[14px] lg:h-screen lg:overflow-hidden w-full min-h-screen bg-white box-border">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[62%] lg:h-full flex-col items-center justify-center rounded-3xl overflow-hidden relative box-border px-8 py-10 xl:px-[46px] xl:py-[58px] text-white">

        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/bg.jpg")' }}
        />
        
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(135deg, rgba(76,47,94,0.91) 0%, rgba(130,81,160,0.97) 65%, rgba(159,99,196,1) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-20 text-center w-full">
          <div className="mb-8 xl:mb-[38px]">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={220}
              height={65}
              className="mx-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
              unoptimized
            />
          </div>

          <h1 className="text-2xl xl:text-[32px] font-bold mb-4 leading-tight">
            Join the Legal Community
          </h1>
          <p className="text-base xl:text-[18px] text-white leading-relaxed mb-8 xl:mb-10 text-center w-full">
            Connect with verified lawyers, get legal advice, and manage your case all in one place
          </p>

          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-5 flex-wrap">
              <div className="flex items-center gap-3">
                <CheckSquare size={16} fill="#4C2F5E" stroke="#FFFFFF" strokeWidth={2} className="shrink-0" />
                <span className="text-base xl:text-[18px] text-white font-medium">AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckSquare size={16} fill="#4C2F5E" stroke="#FFFFFF" strokeWidth={2} className="shrink-0" />
                <span className="text-base xl:text-[18px] text-white font-medium">Regional Expertise</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckSquare size={16} fill="#4C2F5E" stroke="#FFFFFF" strokeWidth={2} className="shrink-0" />
              <span className="text-base xl:text-[18px] text-white font-medium">Verified Professionals</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="w-full lg:w-[38%] lg:h-full min-h-screen lg:min-h-0 rounded-none lg:rounded-3xl flex items-start lg:items-center justify-center px-6 py-10 md:px-10 md:py-12 xl:px-[46px] xl:py-[58px] box-border overflow-y-auto"
        style={{ backgroundColor: '#FCFCFF', flexGrow: 0, flexShrink: 0 }}
      >
        <div className="w-full max-w-[340px]">

          <div className="text-center mt-12 mb-8 lg:mt-0">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={155}
              height={44}
              className="mx-auto"
              unoptimized
            />
          </div>

          <h2
            className="text-center text-xl xl:text-[22px] font-bold mb-6"
            style={{ color: '#9F63C4' }}
          >
            Login
          </h2>

          {error && (
            <div
              style={{
                padding:         '10px',
                marginBottom:    '15px',
                backgroundColor: '#fee2e2',
                border:          '1px solid #ef4444',
                borderRadius:    '8px',
                color:           '#b91c1c',
                fontSize:        '14px',
                textAlign:       'center',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-5">

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </button>

            {/* Facebook */}
            <button
              type="button"
              className="flex-1 flex items-center justify-center p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <svg width="24" height="24" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>

          <div className="relative mb-5">
            <div className="border-t border-gray-200 absolute top-1/2 w-full" />
            <div className="relative flex justify-center">
              <span className="bg-[#FCFCFF] px-3 text-gray-400 text-[15px]">or</span>
            </div>
          </div>
         
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            <div>
              <label className="block text-base xl:text-[18px] font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                autoComplete="off"
                placeholder="Enter your email address here"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                style={{
                  width:       '100%',
                  padding:     '13px 16px',
                  border:      `1.5px solid ${fieldErrors.email ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  fontSize:    '16px',
                  outline:     'none',
                  fontFamily:  'inherit',
                  boxSizing:   'border-box',
                  color:       '#374151',
                  background:  fieldErrors.email ? '#fff5f5' : undefined,
                  transition:  'border-color 0.2s, background 0.2s',
                }}
              />
              {fieldErrors.email && (
                <p style={errorTextStyle}>
                  <XCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-base xl:text-[18px] font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password here"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  style={{
                    width:       '100%',
                    padding:     '13px 44px 13px 16px',
                    border:      `1.5px solid ${fieldErrors.password ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    fontSize:    '16px',
                    outline:     'none',
                    fontFamily:  'inherit',
                    boxSizing:   'border-box',
                    color:       '#374151',
                    background:  fieldErrors.password ? '#fff5f5' : undefined,
                    transition:  'border-color 0.2s, background 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-0 flex"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div
                      style={{
                        height:     '100%',
                        width:      pwStrength!.width,
                        background: pwStrength!.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p style={{ fontSize: '11px', color: pwStrength!.color, margin: 0, fontWeight: 600 }}>
                      {pwStrength!.label}
                    </p>
                    <p
                      style={{
                        fontSize:   '11px',
                        margin:     0,
                        fontWeight: 600,
                        color:
                          formData.password.length > 16
                            ? '#ef4444'
                            : formData.password.length >= 8
                            ? '#9ca3af'
                            : '#f97316',
                      }}
                    >
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-base text-gray-500">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#9333ea' }}
                />
                Remember me
              </label>
              <Link
                href="/forgot-password?portal=admin"
                className="text-base font-medium no-underline"
                style={{ color: '#9F63C4' }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white border-none rounded-xl text-lg font-semibold flex items-center justify-center gap-2.5 transition-colors"
              style={{
                background:  loading ? '#c4a0dc' : '#9F63C4',
                cursor:      loading ? 'not-allowed' : 'pointer',
                fontFamily:  'inherit',
              }}
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
