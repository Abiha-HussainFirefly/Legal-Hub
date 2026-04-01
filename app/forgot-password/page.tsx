'use client';

import { CheckSquare, Loader2, Mail, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; 

type ForgotStep = 'form' | 'loading' | 'sent' | 'error';

function ForgotPasswordForm() {
  const searchParams = useSearchParams(); 
  const portal       = searchParams.get('portal') || 'lawyer'; 
  const loginPath    = portal === 'admin' ? '/adminlogin' : '/lawyerlogin'; 

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<ForgotStep>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        
        body: JSON.stringify({ email: email.trim(), portal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Something went wrong. Please try again.');
        setStep('error');
        return;
      }

      setStep('sent');
    } catch (err) {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStep('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #e5e7eb', borderRadius: '10px',
    fontSize: '16px', outline: 'none', fontFamily: 'inherit',
    color: '#374151', background: '#fafafa', boxSizing: 'border-box',
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#FFFFFF',
      display: 'flex', flexDirection: 'row', alignItems: 'stretch',
      padding: '14px', gap: '14px', boxSizing: 'border-box', overflow: 'hidden',
    }}>

      {/* LEFT PANEL */}
      <div style={{
        width: '62%', flexBasis: '62%', flexGrow: 0, flexShrink: 0,
        height: '100%', borderRadius: '24px', overflow: 'hidden',
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '58px 46px', boxSizing: 'border-box', color: 'white',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(76,47,94,0.91) 0%, rgba(130,81,160,0.97) 65%, rgba(159,99,196,1) 100%)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '100%' }}>
          <div style={{ marginBottom: '38px' }}>
            <Image src="/logo-legal-hub.png" alt="Legal Hub" width={220} height={65}
              style={{ margin: '0 auto', filter: 'brightness(0) invert(1)' }} />
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', lineHeight: 1.3 }}>
            Join the Legal Community
          </h1>

          <p style={{ fontSize: '18px', color: '#ffffff', lineHeight: 1.5, marginBottom: '40px', textAlign: 'center' }}>
            Connect with verified lawyers, get legal advice, and manage your case all one place
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
              <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 500 }}>
                Verified Professionals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: 'calc(38% - 14px)', flexBasis: 'calc(38% - 14px)',
        height: '100%', borderRadius: '24px',
        backgroundColor: '#FCFCFF', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '58px 46px',
        boxSizing: 'border-box', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>

          {(step === 'form' || step === 'loading' || step === 'error') && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '18px', marginTop: '50px' }}>
                <Image src="/logo-legal-hub.png" alt="Legal Hub" width={155} height={44} />
              </div>

              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#4C2F5E', marginBottom: '8px' }}>
                Forgot Password?
              </h2>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#9F63C4', marginBottom: '28px' }}>
                Kindly enter your email address
              </p>

              {step === 'error' && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  fontSize: '13px',
                  color: '#b91c1c',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />

                <button
                  type="submit"
                  disabled={step === 'loading'}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: step === 'loading' ? '#c4a0dc' : '#9F63C4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: 600,
                    cursor: step === 'loading' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {step === 'loading' && <Loader2 className="animate-spin w-5 h-5" />}
                  {step === 'loading' ? 'Sending…' : 'Send'}
                </button>
              </form>
            </>
          )}

          {step === 'sent' && (
            <>
              <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#9F63C4' }}>
                Check Your Email
              </h2>

              <p className="text-[#4C2F5E] mb-6 text-center">
                We've processed your request. If <strong>{email.toLowerCase()}</strong> is registered, you'll receive a link shortly.
              </p>

              <Link href={loginPath}>
                <button style={{
                  width: '100%',
                  padding: '14px',
                  background: '#9F63C4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Back to Login
                </button>
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}