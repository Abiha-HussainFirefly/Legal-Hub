import { Users, FileText, MessageSquare, Clock } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: 'users' | 'cases' | 'discussion' | 'pending';
  changeType: 'positive' | 'negative' | 'neutral';
}

const icons = {
  users: Users,
  cases: FileText,
  discussion: MessageSquare,
  pending: Clock,
};

const iconColors = {
  users: 'bg-gray-100 text-gray-600',
  cases: 'bg-blue-50 text-blue-600',
  discussion: 'bg-green-50 text-green-600',
  pending: 'bg-orange-50 text-orange-600',
};

export default function StatCard({ title, value, change, icon, changeType }: StatCardProps) {
  const Icon = icons[icon];
  const changeColor = changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColors[icon]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className={`text-sm font-medium ${changeColor}`}>
        {change}
      </p>
    </div>
  );
}
