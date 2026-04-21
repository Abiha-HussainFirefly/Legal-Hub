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
  users:      { bg: 'rgba(16,32,51,0.08)',   color: '#102033' },
  cases:      { bg: 'rgba(32,58,88,0.10)',   color: '#203A58' },
  discussion: { bg: 'rgba(27,122,90,0.10)',  color: '#1B7A5A' },
  pending:    { bg: 'rgba(176,140,84,0.12)', color: '#B08C54' },
};

const changeColors: Record<string, string> = {
  users:      '#102033',
  cases:      '#203A58',
  discussion: '#1B7A5A',
  pending:    '#B08C54',
};

export default function StatCard({ title, value, change, icon, changeType }: StatCardProps) {
  const Icon          = icons[icon];
  const { bg, color } = iconStyles[icon];
  const changeColor   = changeType === 'negative' ? '#ef4444' : changeColors[icon];

  return (
    <div className="legal-panel p-4 sm:p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="min-w-0 flex-1 pr-2">
          
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-1 truncate">
            {title}
          </p>

          <h3 className="text-lg sm:text-2xl font-semibold tracking-[-0.03em] text-[#102033] leading-tight">
            {value}
          </h3>
        </div>

        {/* Icon container */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: bg }}
        >
          <Icon style={{ color }} className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <p className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full inline-block" 
           style={{ color: changeColor, backgroundColor: `${changeColor}15` }}>
          {change}
        </p>
      </div>
    </div>
  );
}
