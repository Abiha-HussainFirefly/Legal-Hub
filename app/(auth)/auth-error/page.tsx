'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function AuthErrorRedirect() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const error        = searchParams.get('error');
  const callbackUrl  = searchParams.get('callbackUrl') ?? '';

  useEffect(() => {
    
    if (callbackUrl.includes('dashboard')) {
      router.replace(`/adminlogin?error=${error}`);
    } else {
      
      router.replace(`/lawyerlogin?error=${error}`);
    }
  }, [error, callbackUrl, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#9F63C4', fontWeight: 600 }}>Redirecting...</p>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Redirecting...</div>}>
      <AuthErrorRedirect />
    </Suspense>
  );
}
