import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Search, Eye, ChevronDown } from 'lucide-react';

const users = [
  {
    id: 1,
    name: 'Ali Hassan',
    email: 'ali@example.com',
    role: 'client',
    region: 'Islamabad',
    cases: 3,
    lastActive: '2024-01-20',
  },
  {
    id: 2,
    name: 'Fatima Khan',
    email: 'fatima@example.com',
    role: 'lawyer',
    region: 'Karachi',
    cases: 15,
    lastActive: '2024-01-21',
  },
  {
    id: 3,
    name: 'Mohsin Khan',
    email: 'mohsin@example.com',
    role: 'admin',
    region: 'Lahore',
    cases: 0,
    lastActive: '2024-01-21',
  },
];

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'client':
      return 'bg-purple-100 text-purple-700';
    case 'lawyer':
      return 'bg-blue-100 text-blue-700';
    case 'admin':
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function User() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-20 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
          <p className="text-sm text-gray-500">Manage registered users and roles</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <select className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer">
              <option>All Roles</option>
              <option>Client</option>
              <option>Lawyer</option>
              <option>Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Region</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Cases</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Last Active</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.region}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.cases}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4">
                      <button className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
