import { AlertCircle } from 'lucide-react';

interface Alert {
  id: number;
  type: 'critical'| 'medium' | 'low';
  message: string;
}

const alerts: Alert[] = [
  { id: 1, type: 'critical', message: 'AI Integrity Shield detected 2 flagged posts' },
  { id: 2, type: 'medium', message: '3 Lawyers awaiting ID verification'},
  { id: 3, type: 'low', message: 'Increased activity in Karachi region' },
];

const alertStyles = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-purple-100 text-purple-700 border-purple-200',
  low: 'bg-gray-100 text-gray-700 border-gray-2Increased00',
};

const badgeStyles = {
  critical: 'bg-red-500 text-white',
  medium: 'bg-purple-500 text-white',
  low: 'bg-gray-500 text-white',
};

export default function AIAlerts() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">AI Alerts</h3>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${alertStyles[alert.type]}`}
          >
            <span className={`px-2 py-1 rounded text-xs font-medium ${badgeStyles[alert.type]}`}>
              {alert.type === 'critical' ? 'CRITICAL' : alert.type.toUpperCase()}
            </span>
            <p className="text-sm font-medium flex-1">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
