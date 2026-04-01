'use client';

import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const newUserData = [
  { month: 'Jan', users: 4000 },
  { month: 'Feb', users: 4000 },
  { month: 'Mar', users: 4300 },
  { month: 'Apr', users: 3500 },
  { month: 'May', users: 2500 },
  { month: 'Jun', users: 4900 },
];

const regionalData = [
  { region: 'Islamabad',  cases: 180 },
  { region: 'Karachi',    cases: 120 },
  { region: 'Lahore',     cases: 160 },
  { region: 'Peshawar',   cases: 80  },
  { region: 'Quetta',     cases: 110 },
];

export default function ReportsPage() {
  const handleDownload = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Header banner //
    doc.setFillColor(76, 47, 94);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Legal Hub — Reports & Insights', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${dateStr}`, 14, 22);

    //  AI Summary section //
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Summary', 14, 40);

    doc.setDrawColor(159, 99, 196);
    doc.setLineWidth(0.5);
    doc.line(14, 43, pageW - 14, 43);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('• Increased cases in family law sector, Islamabad region', 16, 51);
    doc.text('• User growth +18%, case resolutions +12% this month', 16, 59);

    // New Users Over Time table //
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('New Users Over Time', 14, 74);
    doc.setDrawColor(159, 99, 196);
    doc.line(14, 77, pageW - 14, 77);

    autoTable(doc, {
      startY: 81,
      head: [['Month', 'New Users']],
      body: newUserData.map(d => [d.month, d.users.toLocaleString()]),
      headStyles: { fillColor: [76, 47, 94], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 245, 252] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
    });

    // Regional Legal Trends table //
    const afterFirstTable = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Regional Legal Trends', 14, afterFirstTable);
    doc.setDrawColor(159, 99, 196);
    doc.line(14, afterFirstTable + 3, pageW - 14, afterFirstTable + 3);

    autoTable(doc, {
      startY: afterFirstTable + 7,
      head: [['Region', 'Cases']],
      body: regionalData.map(d => [d.region, d.cases.toLocaleString()]),
      headStyles: { fillColor: [76, 47, 94], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 245, 252] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
    });

    //  Footer //
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(76, 47, 94);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Legal Hub — Confidential Report', 14, pageH - 4);
    doc.text(`Page 1`, pageW - 20, pageH - 4);

    doc.save(`LegalHub_Report_${now.toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="bg-[#F9FAFB] rounded-2xl shadow-sm p-4 md:p-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Reports & Insights</h1>
          <p className="text-xs sm:text-sm text-gray-500">Analytics and trend data</p>
        </div>
        
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition w-full sm:w-auto hover:opacity-90 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #4C2F5E 10%, #9F63C4 100%)' }}
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          Download Report
        </button>
      </div>

      {/* AI Summary Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-5 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">AI Summary</h2>
        <div className="space-y-2 sm:space-y-3">
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-black">
            Increased cases in family law sector, Islamabad region
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-black">
            User growth +18%, case resolutions +12% this month
          </div>
        </div>
      </div>

      {/* Charts Grid - Optimized for Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

        {/* New User Over Time Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">New User Over Time</h3>
          
          <div className="h-48 sm:h-60 lg:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newUserData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(159,99,196,0.05)' }}
                />
                <Bar 
                  dataKey="users" 
                  fill="#9F63C4" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                  label={{ position: 'top', fill: '#000', fontSize: 11, fontWeight: 600 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Legal Trends Chart */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Regional legal Trends</h3>
          <div className="h-48 sm:h-60 lg:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="cases" 
                  fill="#9F63C4" 
                  radius={[0, 4, 4, 0]} 
                  barSize={24}
                  label={{ position: 'right', fill: '#000', fontSize: 13, fontWeight: 600 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
