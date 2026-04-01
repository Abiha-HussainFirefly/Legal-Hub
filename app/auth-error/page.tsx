'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthError() {
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
