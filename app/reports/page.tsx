'use client';

import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const newUserData = [
  { month: 'Jan', users: 2000 },
  { month: 'Feb', users: 4000 },
  { month: 'Mar', users: 4500 },
  { month: 'Apr', users: 1400 },
  { month: 'May', users: 2000 },
  { month: 'Jun', users: 4100 },
];

const regionalData = [
  { region: 'Islamabad', cases: 180 },
  { region: 'Karachi', cases: 120 },
  { region: 'Lahore', cases: 160 },
  { region: 'Rawalpindi', cases: 80 },
  { region: 'Quetta', cases: 110 },
];

export default function Reports() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-20 p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports & Insights</h1>
            <p className="text-sm text-gray-500">Analytics and trend data</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {/* AI Summary Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Summary</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>Increased cases in family law sector: Islamabad region</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>User growth +18%, case resolutions +12% this month</span>
            </li>
          </ul>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New User Over Time Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">New User Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newUserData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  cursor={{ fill: 'rgba(147, 51, 234, 0.1)' }}
                />
                <Bar 
                  dataKey="users" 
                  fill="#9333ea" 
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', fill: '#6b7280', fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Legal Trends Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Regional legal Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="region" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  cursor={{ fill: 'rgba(147, 51, 234, 0.1)' }}
                />
                <Bar 
                  dataKey="cases" 
                  fill="#9333ea" 
                  radius={[0, 8, 8, 0]}
                  label={{ position: 'right', fill: '#6b7280', fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
