'use client';

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', users: 200  },
  { month: 'Feb', users: 600  },
  { month: 'Mar', users: 450  },
  { month: 'Apr', users: 800  },
  { month: 'May', users: 1200 },
  { month: 'Jun', users: 1800 },
];

export default function UserGrowthChart() {
  return (
    <div className="legal-panel p-4 sm:p-6">

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        User Growth over Time
      </h3>

      <div className="h-48 sm:h-64 lg:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#102033" stopOpacity={0.82} />
                <stop offset="95%" stopColor="#B08C54" stopOpacity={0.14} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border:          '1px solid #e5e7eb',
                borderRadius:    '8px',
                boxShadow:       '0 4px 6px rgba(0,0,0,0.1)',
                fontSize:        '12px',
              }}
            />

            <Area
              type="monotone"
              dataKey="users"
              stroke="#102033"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsers)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
