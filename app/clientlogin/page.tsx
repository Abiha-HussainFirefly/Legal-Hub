'use client';

import { CheckSquare, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function ClientLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login data:', formData);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      padding: '14px',
      gap: '14px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/*LEFT PANEL*/}
      <div style={{
        width: '62%',
        flexBasis: '62%',
        flexGrow: 0,
        flexShrink: 0,
        height: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '58px 46px',
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
      whiteSpace: 'nowrap',
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

      {/*RIGHT PANEL*/}
      <div style={{
        width: 'calc(38% - 14px)',
        flexBasis: 'calc(38% - 14px)',
        flexGrow: 0,
        flexShrink: 0,
        height: '100%',
        borderRadius: '24px',
        backgroundColor: '#FCFCFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '58px 46px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>

          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={155}
              height={44}
              style={{ margin: '0 auto' }}
            />
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#9F63C4', marginBottom: '24px' }}>
            Login
          </h2>

          {/* Social Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '13px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              background: 'white', cursor: 'pointer',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '13px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              background: 'white', cursor: 'pointer',
            }}>
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

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email address here"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%', padding: '13px 16px', border: '1.5px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '16px', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box', color: '#374151',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '18px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password here"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: '100%', padding: '13px 44px 13px 16px', border: '1.5px solid #e5e7eb',
                    borderRadius: '10px', fontSize: '16px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box', color: '#374151',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px', color: '#6b7280' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#9333ea' }} />
                Remember me
              </label>
              <Link href="/forgot-password" style={{ fontSize: '16px', color: '#9F63C4', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              style={{
                width: '100%', padding: '14px', background: '#9F63C4', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Login
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '16px', color: '#000000', marginTop: '20px' }}>
            Don&apos;t have an account?{' '}
            <Link href="/lawyerregister" style={{ color: '#9F63C4', fontWeight: 600, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
