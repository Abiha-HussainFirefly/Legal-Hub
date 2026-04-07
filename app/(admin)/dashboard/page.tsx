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
    <div className="bg-[#FFFFFF] rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
        Dashboard Overview
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
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

      {/* AI Alerts */}
      <div className="mb-4 md:mb-6">
        <AIAlerts />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <UserGrowthChart />
        <CaseDistributionChart />
      </div>
    </div>
  );
}