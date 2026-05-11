'use client';

import {
  canAccessLawyerPath,
  canAccessLawyerPortal,
  getFirstAccessibleLawyerPath,
} from '@/lib/auth/roles';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LawyerLayoutUser {
  roles?: string[];
  permissions?: string[];
}

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const payload = await response.json();

        if (!payload?.authenticated || !payload.user) {
          if (!cancelled) {
            setStatus('unauthorized');
            router.replace('/lawyerlogin');
          }
          return;
        }

        const user = payload.user as LawyerLayoutUser;
        const roles = user.roles ?? [];
        const permissions = user.permissions ?? [];

        if (!canAccessLawyerPortal(roles)) {
          if (!cancelled) {
            setStatus('unauthorized');
            router.replace('/lawyerlogin');
          }
          return;
        }

        if (!canAccessLawyerPath(roles, permissions, pathname || '')) {
          if (!cancelled) {
            setStatus('unauthorized');
            const fallbackPath = getFirstAccessibleLawyerPath(roles, permissions) ?? '/lawyerlogin';
            router.replace(fallbackPath === pathname ? '/lawyerlogin' : fallbackPath);
          }
          return;
        }

        if (!cancelled) {
          setStatus('authorized');
        }
      } catch {
        if (!cancelled) {
          setStatus('unauthorized');
          router.replace('/lawyerlogin');
        }
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (status !== 'authorized') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8f4ee_0%,#efe7dc_100%)]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d8c7a6] border-t-[#102033]" />
      </div>
    );
  }

  return <>{children}</>;
}
