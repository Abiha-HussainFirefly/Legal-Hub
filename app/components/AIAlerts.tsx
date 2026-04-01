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
  high:   'bg-gray-50 text-black border-gray-200',
  medium: 'bg-gray-50 text-black border-gray-200',
  low:    'bg-gray-50 text-black border-gray-200',
};

const badgeStyles = {
  high:   'bg-red-400 text-white',
  medium: 'bg-purple-200 text-black',
  low:    'bg-purple-200 text-black',
};

export default function AIAlerts() {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#EEA62B] flex-shrink-0" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI Alerts</h3>
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

            <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
