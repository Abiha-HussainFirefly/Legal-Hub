import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Eye, Flag, Trash2 } from 'lucide-react';

const flaggedContent = [
  {
    id: 1,
    postId: '1',
    type: 'discussion',
    user: 'user_123',
    reason: 'Contains sensitive PII',
    confidence: '97%',
  },
  {
    id: 2,
    postId: '2',
    type: 'case',
    user: 'user_123',
    reason: 'Potential spam',
    confidence: '85%',
  },
  {
    id: 3,
    postId: '3',
    type: 'review',
    user: 'user_789',
    reason: 'Inappropriate language',
    confidence: '92%',
  },
];

export default function Moderation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-20 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Moderation</h1>
          <p className="text-sm text-gray-500">Review AI-flagged content and user reports</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button className="pb-3 px-1 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
            Flagged by AI
          </button>
          <button className="pb-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            User Reports
          </button>
          <button className="pb-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
            Resolved
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">AI-Flagged Content</h2>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
            1 Pending
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Post ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">AI Confidence</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flaggedContent.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.postId}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.user}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.confidence}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button className="p-1 hover:bg-gray-100 rounded transition" title="View">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition" title="Flag">
                          <Flag className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition" title="Delete">
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing 1 to 3 of 3 results</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded">
                1
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition">
                2
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition">
                3
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
