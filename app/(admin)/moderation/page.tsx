'use client';

import { Eye, Flag, Trash2 } from 'lucide-react';
import { useState } from 'react';

const aiFlaggedContent = [
  { id: 1,  postId: '1',  type: 'discussion', user: 'user_123', reason: 'Contains sensitive PII',    confidence: '97%' },
  { id: 2,  postId: '2',  type: 'case',       user: 'user_123', reason: 'Potential spam',            confidence: '85%' },
  { id: 3,  postId: '3',  type: 'review',     user: 'user_789', reason: 'Inappropriate language',    confidence: '92%' },
  { id: 4,  postId: '4',  type: 'discussion', user: 'user_456', reason: 'Hate speech detected',      confidence: '88%' },
  { id: 5,  postId: '5',  type: 'case',       user: 'user_321', reason: 'Misleading information',    confidence: '76%' },
  { id: 6,  postId: '6',  type: 'review',     user: 'user_654', reason: 'Spam links',                confidence: '94%' },
  { id: 7,  postId: '7',  type: 'discussion', user: 'user_987', reason: 'Contains sensitive PII',    confidence: '89%' },
  { id: 8,  postId: '8',  type: 'case',       user: 'user_111', reason: 'Abusive content',           confidence: '91%' },
  { id: 9,  postId: '9',  type: 'review',     user: 'user_222', reason: 'Duplicate post',            confidence: '78%' },
             
];

const userReports = [
  { id: 1,  reportId: 'UR-001', reportedBy: 'lawyer_mohsin', reportedUser: 'user_255',    postId: 'POST-4421', reason: 'Harassment',       date: '2025-01-16 11:20' },
  { id: 2,  reportId: 'UR-002', reportedBy: 'client_sara',   reportedUser: 'lawyer_fake', postId: 'CASE-8892', reason: 'Impersonation',    date: '2025-01-16 13:45' },
  { id: 3,  reportId: 'UR-003', reportedBy: 'client_sara',   reportedUser: 'lawyer_fake', postId: 'CASE-8892', reason: 'Impersonation',    date: '2025-01-16 13:45' },
  { id: 4,  reportId: 'UR-004', reportedBy: 'lawyer_ali',    reportedUser: 'user_410',    postId: 'POST-5530', reason: 'Spam',             date: '2025-01-17 09:10' },
  { id: 5,  reportId: 'UR-005', reportedBy: 'client_omar',   reportedUser: 'user_622',    postId: 'CASE-1023', reason: 'False information', date: '2025-01-17 10:30' },
  { id: 6,  reportId: 'UR-006', reportedBy: 'lawyer_zara',   reportedUser: 'user_733',    postId: 'POST-6641', reason: 'Harassment',       date: '2025-01-17 12:00' },
  { id: 7,  reportId: 'UR-007', reportedBy: 'client_nida',   reportedUser: 'lawyer_x',    postId: 'CASE-7754', reason: 'Impersonation',    date: '2025-01-17 14:20' },
  { id: 8,  reportId: 'UR-008', reportedBy: 'lawyer_hassan', reportedUser: 'user_844',    postId: 'POST-8812', reason: 'Abusive language', date: '2025-01-18 08:45' },
  { id: 9,  reportId: 'UR-009', reportedBy: 'client_bilal',  reportedUser: 'user_955',    postId: 'CASE-9923', reason: 'Spam',             date: '2025-01-18 11:15' },
  
];

const resolvedCases = [
  { id: 1,  caseId: '1',  type: 'discussion', user: 'user_321', reason: 'Spam content',          actiontaken: 'removed',  resolvedBy: 'admin_zahid', date: '2025-01-15 10:30' },
  { id: 2,  caseId: '2',  type: 'case',       user: 'user_654', reason: 'False information',     actiontaken: 'warned',   resolvedBy: 'admin_ali',   date: '2025-01-15 10:30' },
  { id: 3,  caseId: '3',  type: 'review',     user: 'user_987', reason: 'Inappropriate content', actiontaken: 'approved', resolvedBy: 'admin_zahid', date: '2025-01-15 10:30' },
  { id: 4,  caseId: '4',  type: 'discussion', user: 'user_112', reason: 'Hate speech',           actiontaken: 'removed',  resolvedBy: 'admin_ali',   date: '2025-01-16 09:00' },
  { id: 5,  caseId: '5',  type: 'case',       user: 'user_223', reason: 'Spam content',          actiontaken: 'warned',   resolvedBy: 'admin_zahid', date: '2025-01-16 11:30' },
  { id: 6,  caseId: '6',  type: 'review',     user: 'user_334', reason: 'Misleading info',       actiontaken: 'approved', resolvedBy: 'admin_ali',   date: '2025-01-16 14:00' },
  { id: 7,  caseId: '7',  type: 'discussion', user: 'user_445', reason: 'Abusive language',      actiontaken: 'removed',  resolvedBy: 'admin_zahid', date: '2025-01-17 08:30' },
  { id: 8,  caseId: '8',  type: 'case',       user: 'user_556', reason: 'Impersonation',         actiontaken: 'warned',   resolvedBy: 'admin_ali',   date: '2025-01-17 10:45' },
  { id: 9,  caseId: '9',  type: 'review',     user: 'user_667', reason: 'Spam links',            actiontaken: 'removed',  resolvedBy: 'admin_zahid', date: '2025-01-17 13:15' },
  
];

const ITEMS_PER_PAGE = 3;

function Pagination({ total, currentPage, onPageChange }: { total: number; currentPage: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

  return (
    <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs sm:text-sm text-gray-500">Showing {start} to {end} of {total} results</p>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 md:px-4 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-8 h-7 sm:w-9 sm:h-8 flex items-center justify-center text-xs sm:text-sm rounded-xl shadow-sm transition ${n === currentPage ? 'bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 md:px-4 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<'ai-flagged' | 'user-reports' | 'resolved'>('user-reports');
  const [currentPage, setCurrentPage] = useState(1);

  const handleTabChange = (tab: 'ai-flagged' | 'user-reports' | 'resolved') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const pendingAI      = aiFlaggedContent.length;
  const pendingReports = userReports.length;
  const resolvedCount  = resolvedCases.length;

  const paginate = <T,>(data: T[]) =>
    data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">

      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Moderation</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">Resolve risk signals with cleaner triage views.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          AI flags, user reports, and resolved items now read as one deliberate workflow rather than disconnected tables.
        </p>
      </section>

      <div className="legal-panel flex gap-4 sm:gap-6 px-6 pt-5 border-b border-gray-200 overflow-x-auto scrollbar-none">
        {([
          { key: 'ai-flagged',   label: 'Flagged by AI' },
          { key: 'user-reports', label: 'User Reports'  },
          { key: 'resolved',     label: 'Resolved'      },
        ] as const).map(({ key, label }) => (
          <button
  key={key}
  onClick={() => handleTabChange(key)}
  className={`pb-3 px-1 text-sm sm:text-base font-semibold cursor-pointer whitespace-nowrap transition flex-shrink-0 ${
    activeTab === key
      ? 'text-[#9F63C4] border-b-2 border-[#9F63C4]'
      : 'text-[#4C2F5E] ' 
  }`}
>
  {label}
</button>
        ))}
      </div>

      <div className="legal-panel p-4 shadow-sm md:p-6">

        {/* AI-Flagged Content Tab */}
        {activeTab === 'ai-flagged' && (
          <>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">AI-Flagged Content</h2>
              <span className="px-3 py-1 text-[#EEA62B] border border-[#EEA62B] text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                {pendingAI} Pending
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white">
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Post ID</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Type</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">User</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Reason</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">AI Confidence</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginate(aiFlaggedContent).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{item.postId}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-[#E5E7EB] text-black">{item.type}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.user}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.reason}</td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{item.confidence}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button className="p-1 hover:bg-gray-100 rounded transition" title="View"><Eye className="w-4 h-4 text-gray-600" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded transition" title="Flag"><Flag className="w-4 h-4 text-gray-600" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded transition" title="Delete"><Trash2 className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={aiFlaggedContent.length} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}

        {/* User Reports Tab */}
        {activeTab === 'user-reports' && (
          <>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">User Reports</h2>
              <span className="px-3 py-1 text-[#EEA62B] border border-[#EEA62B] text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                {pendingReports} Pending
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white">
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Report ID</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Reported By</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Reported User</th>
                    <th className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Post ID</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Reason</th>
                    <th className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Date</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginate(userReports).map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{report.reportId}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{report.reportedBy}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{report.reportedUser}</td>
                      <td className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{report.postId}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{report.reason}</td>
                      <td className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{report.date}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button className="p-1 hover:bg-gray-100 rounded transition" title="View"><Eye className="w-4 h-4 text-gray-600" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded transition" title="Flag"><Flag className="w-4 h-4 text-gray-600" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded transition" title="Delete"><Trash2 className="w-4 h-4 text-gray-600" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={userReports.length} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}

        {/* Resolved Tab */}
        {activeTab === 'resolved' && (
          <>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Resolved Items</h2>
              <span className="px-3 py-1 text-[#008B62] border border-[#008B62] text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                {resolvedCount} Resolved
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white">
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Case ID</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Type</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">User</th>
                    <th className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Reason</th>
                    <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Action Taken</th>
                    <th className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Resolved By</th>
                    <th className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginate(resolvedCases).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{item.caseId}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.type}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.user}</td>
                      <td className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.reason}</td>
                      <td className="px-4 md:px-6 py-3 sm:py-4">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          item.actiontaken === 'approved' ? 'bg-[#008B62] text-white'
                          : item.actiontaken === 'warned' ? 'bg-[#EEA62B] text-white'
                          : item.actiontaken === 'removed' ? 'bg-[#EEA62B] text-white'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.actiontaken}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.resolvedBy}</td>
                      <td className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={resolvedCases.length} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}

      </div>
    </div>
  );
}
