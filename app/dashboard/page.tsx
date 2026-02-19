import AIAlerts from '@/app/components/AIAlerts';
import CaseDistributionChart from '@/app/components/CaseDistributionChart';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import StatCard from '@/app/components/StatCard';
import UserGrowthChart from '@/app/components/UserGrowthChart';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-20 p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total User"
            value="12,451"
            change="+29%"
            icon="users"
            changeType="positive"
          />
          <StatCard 
            title="Total Case"
            value="312"
            change="+6%"
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
        <div className="mb-8">
          <AIAlerts />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserGrowthChart />
          <CaseDistributionChart />
        </div>
      </main>
    </div>
  );
}