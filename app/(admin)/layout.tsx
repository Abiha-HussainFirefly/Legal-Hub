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
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <Header userData={userData} />
      <main
        className="pt-24 px-3 py-6 transition-all duration-300 md:px-5"
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
