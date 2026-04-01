'use client';

import { useEffect, useState } from 'react';
import { useSession }          from 'next-auth/react';
import { useRouter }           from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/app/components/SidebarContext';
import Sidebar from '@/app/components/Sidebar';
import Header  from '@/app/components/Header';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      const roles = (session.user as any).roles ?? [];
      const isAdmin = Array.isArray(roles)
        ? roles.includes('ADMIN')
        : roles === 'ADMIN';

      if (!isAdmin) {
        router.replace('/lawyerlogin');
        return;
      }

      // Persist for other uses
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify({
        id:    (session.user as any).id    ?? '',
        name:  session.user.name           ?? '',
        email: session.user.email          ?? '',
        image: session.user.image          ?? '',
        roles,
      }));

      setUserData({
        id:    (session.user as any).id,
        name:  session.user.name,
        email: session.user.email,
        image: session.user.image,
        roles,
      });
      return;
    }

    if (status === 'unauthenticated') {
      // Fallback: check localStorage for credentials-based users
      try {
        const loggedIn   = localStorage.getItem('isLoggedIn');
        const storedUser = localStorage.getItem('user');

        if (loggedIn === 'true' && storedUser) {
          const user = JSON.parse(storedUser);
          const isAdmin = Array.isArray(user.roles)
            ? user.roles.includes('ADMIN')
            : user.role === 'ADMIN';

          if (!isAdmin) {
            router.replace('/lawyerlogin');
            return;
          }
          setUserData(user);
        } else {
          router.replace('/adminlogin');
        }
      } catch {
        router.replace('/adminlogin');
      }
    }
  }, [status, session, router]);

  
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