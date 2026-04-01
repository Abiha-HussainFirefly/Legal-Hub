import { Users, FileText, MessageSquare, Clock } from 'lucide-react';

interface StatCardProps {
  title:      string;
  value:      string | number;
  change:     string;
  icon:       'users' | 'cases' | 'discussion' | 'pending';
  changeType: 'positive' | 'negative' | 'neutral';
}

const icons = {
  users:      Users,
  cases:      FileText,
  discussion: MessageSquare,
  pending:    Clock,
};

const iconStyles: Record<string, { bg: string; color: string }> = {
  users:      { bg: 'rgba(76,47,94,0.10)',   color: '#4C2F5E' },
  cases:      { bg: 'rgba(66,133,244,0.10)', color: '#4285F4' },
  discussion: { bg: 'rgba(0,139,98,0.10)',   color: '#008B62' },
  pending:    { bg: 'rgba(238,166,43,0.10)', color: '#EEA62B' },
};

const changeColors: Record<string, string> = {
  users:      '#4C2F5E',
  cases:      '#4285F4',
  discussion: '#008B62',
  pending:    '#EEA62B',
};

export default function StatCard({ title, value, change, icon, changeType }: StatCardProps) {
  const Icon          = icons[icon];
  const { bg, color } = iconStyles[icon];
  const changeColor   = changeType === 'negative' ? '#ef4444' : changeColors[icon];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1 pr-2">
          
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 truncate">
            {title}
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
            {value}
          </h3>
        </div>

        {/* Icon container */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: bg }}
        >
          <Icon style={{ color }} className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <p className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md inline-block" 
           style={{ color: changeColor, backgroundColor: `${changeColor}15` }}>
          {change}
        </p>
      </div>
    </div>
  );
}