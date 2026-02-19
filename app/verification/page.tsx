import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Search, Eye } from 'lucide-react';

const lawyers = [
  {
    id: 1,
    name: 'Mohsin Khan',
    barNumber: 'BAR-12345',
    region: 'Islamabad',
    status: 'pending',
    submitted: '2024-01-19',
  },
  {
    id: 2,
    name: 'Sana Ali',
    barNumber: 'BAR-23456',
    region: 'Karachi',
    status: 'pending',
    submitted: '2024-01-14',
  },
  {
    id: 3,
    name: 'Hassan Raza',
    barNumber: 'BAR-34567',
    region: 'Lahore',
    status: 'verified',
    submitted: '2024-01-10',
  },
];

export default function Verification() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-20 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Lawyer Verification</h1>
          <p className="text-sm text-gray-500">Manage verification workflow</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or bar number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Bar Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Region</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Submitted</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lawyers.map((lawyer) => (
                  <tr key={lawyer.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {lawyer.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lawyer.barNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lawyer.region}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          lawyer.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {lawyer.status === 'pending' ? 'Pending' : 'Verified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lawyer.submitted}
                    </td>
                    <td className="px-6 py-4">
                      <button className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium">
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
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