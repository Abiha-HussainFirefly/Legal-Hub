import { Clock } from 'lucide-react';

interface Alert {
  id:      number;
  type:    'high' | 'medium' | 'low';
  message: string;
}

const alerts: Alert[] = [
  { id: 1, type: 'high',   message: 'AI Integrity Shield detected 2 flagged posts' },
  { id: 2, type: 'medium', message: '3 Lawyers awaiting ID verification'            },
  { id: 3, type: 'low',    message: 'Increased activity in Karachi region'          },
];

const alertStyles = {
  high:   'bg-[rgba(192,86,79,0.06)] text-black border-[rgba(192,86,79,0.14)]',
  medium: 'bg-[rgba(176,140,84,0.08)] text-black border-[rgba(176,140,84,0.16)]',
  low:    'bg-[rgba(16,32,51,0.04)] text-black border-[rgba(16,32,51,0.08)]',
};

const badgeStyles = {
  high:   'bg-[#C0564F] text-white',
  medium: 'bg-[#F1E4CB] text-[#8A6C3F]',
  low:    'bg-[#102033] text-white',
};

export default function AIAlerts() {
  return (
    <div className="legal-panel p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#B08C54] flex-shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-[#102033]">AI Alerts</h3>
      </div>

      {/* Alert rows */}
      <div className="space-y-2 sm:space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border ${alertStyles[alert.type]}`}
          >
            <span
              className={`
                px-2 py-1 rounded text-xs font-medium flex-shrink-0
                w-16 text-center
                ${badgeStyles[alert.type]}
              `}
            >
              {alert.type}
            </span>

            <p className="text-xs sm:text-sm font-medium flex-1 leading-6 text-slate-700">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
