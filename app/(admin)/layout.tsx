'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import Sidebar from '@/app/components/admin/sidebar/Sidebar';
import Header  from '@/app/components/lawyer/navbar/header';

function AdminShell({
  children,
  userData,
}: {
  children: React.ReactNode;
  userData: any;
}) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-[#F3F0F4]">
      <Sidebar />
      <Header userData={userData} />
      <main
        className="pt-20 px-3 py-4 transition-all duration-300"
        style={{ marginLeft: isOpen ? '256px' : '72px' }}
      >
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.authenticated && data.user) {
          const roles = data.user.roles ?? [];
          const isAdmin = Array.isArray(roles)
            ? roles.some((r: string) => r.toUpperCase() === 'ADMIN')
            : roles.toUpperCase() === 'ADMIN';

          if (!isAdmin) {
            setStatus('unauthenticated');
            router.replace('/lawyerlogin');
            return;
          }

          setUserData(data.user);
          setStatus('authenticated');
          
          // Sync legacy storage
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          setStatus('unauthenticated');
          router.replace('/adminlogin');
        }
      } catch (err) {
        console.error('Admin Auth Check Failed:', err);
        setStatus('unauthenticated');
        router.replace('/adminlogin');
      }
    }

    checkAdminAuth();
  }, [router]);

  if (status === 'loading' || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
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
