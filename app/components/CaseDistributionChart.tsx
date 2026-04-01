'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Family law', value: 33, color: '#008B62' },
  { name: 'Criminal',   value: 25, color: '#9F63C4' },
  { name: 'Tax Law',    value: 15, color: '#4285F4' },
  { name: 'Civil',      value: 20, color: '#EEA62B' },
  { name: 'Other',      value: 5,  color: '#9A9997' },
];

const renderLabel = ({ cx, cy, midAngle, outerRadius, value }: any) => {
  const RADIAN = Math.PI / 180;
  const ratio  = value < 8 ? 0.78 : 0.62;
  const x      = cx + outerRadius * ratio * Math.cos(-midAngle * RADIAN);
  const y      = cy + outerRadius * ratio * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={value < 8 ? 10 : 13}
      fontWeight={700}
    >
      {`${value}%`}
    </text>
  );
};

export default function CaseDistributionChart() {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        Case Distribution by Category
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">

        <div className="w-full sm:w-[60%] h-44 sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius="80%"  
                paddingAngle={0}
                dataKey="value"
                labelLine={false}
                label={renderLabel}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border:          '1px solid #e5e7eb',
                  borderRadius:    '8px',
                  boxShadow:       '0 4px 6px rgba(0,0,0,0.1)',
                  fontSize:        '12px',
                }}
                formatter={(value) => `${value}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-row flex-wrap sm:flex-col gap-x-4 gap-y-2 sm:gap-3">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
