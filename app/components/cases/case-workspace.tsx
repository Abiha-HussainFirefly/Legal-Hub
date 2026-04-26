'use client';

import LawyerTopbar from '@/app/components/lawyer/lawyer-topbar';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WorkspaceUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  roles?: string[];
}

interface CaseWorkspaceContextValue {
  user: WorkspaceUser | null;
  loading: boolean;
}

const CaseWorkspaceContext = createContext<CaseWorkspaceContextValue>({
  user: null,
  loading: true,
});

export function useCaseWorkspace() {
  return useContext(CaseWorkspaceContext);
}

export default function CaseWorkspace({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch('/api/auth/me')
      .then(async (response) => {
        if (!mounted) return;
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json();
        setUser(data.user ?? null);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/lawyerlogin');
  }

  return (
    <CaseWorkspaceContext.Provider value={value}>
      <div className="legal-workspace-shell">
        <LawyerTopbar activeTab="cases" user={user} onLogout={handleLogout} />
        {children}
      </div>
    </CaseWorkspaceContext.Provider>
  );
}

