'use client';

import AIAlerts from '@/app/components/AIAlerts';
import CaseDistributionChart from '@/app/components/CaseDistributionChart';
import StatCard from '@/app/components/StatCard';
import UserGrowthChart from '@/app/components/UserGrowthChart';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id:    (session.user as any).id    ?? '',
          name:  session.user.name           ?? '',
          email: session.user.email          ?? '',
          image: session.user.image          ?? '',
          roles: (session.user as any).roles ?? [],
        }),
      );
      setIsReady(true);
      return;
    }

    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
      
      setIsReady(true);
    } else {
      
      router.replace('/adminlogin');
    }
  }, [status, session, router]);

  
  if (status === 'loading' || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Admin overview</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
          Platform control with clearer operational insight.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          The dashboard now uses stronger grouping, calmer spacing, and more legible data surfaces so moderation, trust, and growth signals are easier to prioritize.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total User"
          value="12,431"
          change="+22%"
          icon="users"
          changeType="positive"
        />
        <StatCard
          title="Total Case"
          value="312"
          change="+8%"
          icon="cases"
          changeType="positive"
        />
        <StatCard
          title="Active Discussion"
          value="1,247"
          change="+15%"
          icon="discussion"
          changeType="positive"
        />
        <StatCard
          title="Pending Verifications"
          value="54"
          change="-3%"
          icon="pending"
          changeType="negative"
        />
      </div>

      <div>
        <AIAlerts />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart />
        <CaseDistributionChart />
      </div>
    </div>
  );
}
