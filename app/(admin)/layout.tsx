'use client';

import {
  canAccessAdminPortal,
  canAccessAdminPermission,
  getAdminPermissionForPath,
  getFirstAccessibleAdminPath,
} from '@/lib/auth/roles';
import { clearClientAuthState } from '@/lib/auth/client-session';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import Sidebar from '@/app/components/admin/sidebar/Sidebar';
import Header  from '@/app/components/lawyer/navbar/header';

interface AdminLayoutUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  roles?: string[];
  permissions?: string[];
  displayName?: string;
  role?: string;
}

function AdminShell({
  children,
  userData,
}: {
  children: React.ReactNode;
  userData: AdminLayoutUser | null;
}) {
  const { isOpen } = useSidebar();

  return (
    <div className="legal-workspace-shell min-h-screen">
      <Sidebar />
      <Header userData={userData} />
      <main
        className="lh-page-enter px-3 py-6 pt-24 transition-all duration-300 md:px-5"
        style={{ marginLeft: isOpen ? '256px' : '72px' }}
      >
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<AdminLayoutUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();

        if (data.authenticated && data.user) {
          const roles = data.user.roles ?? [];
          const permissions = data.user.permissions ?? [];
          const normalizedRoles = Array.isArray(roles) ? roles : [roles];
          const isAdmin = canAccessAdminPortal(normalizedRoles);
          const requiredPermission = getAdminPermissionForPath(pathname ?? '');

          if (!isAdmin) {
            clearClientAuthState();
            setStatus('unauthenticated');
            router.replace('/lawyerlogin');
            return;
          }

          if (requiredPermission && !canAccessAdminPermission(normalizedRoles, permissions, requiredPermission)) {
            setStatus('unauthenticated');
            const fallbackPath = getFirstAccessibleAdminPath(normalizedRoles, permissions) ?? '/adminprofile';
            router.replace(fallbackPath === pathname ? '/adminprofile' : fallbackPath);
            return;
          }

          setUserData(data.user as AdminLayoutUser);
          setStatus('authenticated');
        } else {
          clearClientAuthState();
          setStatus('unauthenticated');
          router.replace('/adminlogin');
        }
      } catch (err) {
        console.error('Admin Auth Check Failed:', err);
        clearClientAuthState();
        setStatus('unauthenticated');
        router.replace('/adminlogin');
      }
    }

    checkAdminAuth();
  }, [pathname, router]);

  if (status === 'loading' || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[linear-gradient(180deg,#f8f4ee_0%,#efe7dc_100%)]">
        <div className="w-9 h-9 border-4 border-[#d8c7a6] border-t-[#102033] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminShell userData={userData}>
        {children}
      </AdminShell>
    </SidebarProvider>
  );
}
