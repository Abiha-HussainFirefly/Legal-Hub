'use client';

import { ChevronDown, Eye, Search } from 'lucide-react';
import { useState } from 'react';

const users = [
  { id: 1,  name: 'Ali Hassan',     email: 'ali@example.com',     role: 'client', region: 'Islamabad',  cases: 3,  lastActive: '2024-01-20' },
  { id: 2,  name: 'Fatima Khan',    email: 'fatima@example.com',  role: 'lawyer', region: 'Karachi',    cases: 15, lastActive: '2024-01-21' },
  { id: 3,  name: 'Mohsin Khan',    email: 'mohsin@example.com',  role: 'admin',  region: 'Lahore',     cases: 0,  lastActive: '2024-01-21' },
  { id: 4,  name: 'Sana Mirza',     email: 'sana@example.com',    role: 'client', region: 'Peshawar',   cases: 5,  lastActive: '2024-01-22' },
  { id: 5,  name: 'Bilal Akhtar',   email: 'bilal@example.com',   role: 'lawyer', region: 'Multan',     cases: 9,  lastActive: '2024-01-23' },
  { id: 6,  name: 'Zara Hussain',   email: 'zara@example.com',    role: 'client', region: 'Quetta',     cases: 2,  lastActive: '2024-01-24' },
  { id: 7,  name: 'Omar Farooq',    email: 'omar@example.com',    role: 'lawyer', region: 'Islamabad',  cases: 20, lastActive: '2024-01-25' },
  { id: 8,  name: 'Nida Malik',     email: 'nida@example.com',    role: 'admin',  region: 'Karachi',    cases: 0,  lastActive: '2024-01-26' },
  { id: 9,  name: 'Tariq Siddiqui', email: 'tariq@example.com',   role: 'client', region: 'Lahore',     cases: 7,  lastActive: '2024-01-27' },
  
];

const ITEMS_PER_PAGE = 3;

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'client':
    case 'lawyer':
    case 'admin':
      return 'bg-[#EBDEF0] text-black';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function UserPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('All Roles');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === 'All Roles' || u.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const start      = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end        = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    <div className="space-y-6">

      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">User management</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">Review users with less clutter.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Search, filter, and inspect user records inside a denser but calmer admin table designed for legal platform operations.
        </p>
      </section>

      <div className="legal-panel p-4 md:p-6">

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or email..."
              className="legal-field w-full pl-9 sm:pl-10 pr-4 py-3 text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className="legal-field appearance-none w-full sm:w-auto px-4 py-3 pr-10 cursor-pointer text-sm"
            >
              <option>All Roles</option>
              <option>Client</option>
              <option>Lawyer</option>
              <option>Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        
          <div className="legal-table-wrap p-0 overflow-x-auto">
          <table className="legal-table w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Name</th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Email</th>
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Role</th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Region</th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Cases</th>
                <th className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Last Active</th>
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length > 0 ? paginated.map((user) => (
                <tr key={user.id} className="transition">
                  <td className="px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                    <div className="flex flex-col gap-0.5">
                      <span>{user.name}</span>
                      <span className="sm:hidden text-[10px] text-gray-400">{user.email}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-4 md:px-6 py-3 sm:py-4">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {user.region}
                  </td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {user.cases}
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {user.lastActive}
                  </td>
                  <td className="px-4 md:px-6 py-3 sm:py-4">
                    <button className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-black hover:text-[#8A6C3F] hover:border-[#8A6C3F]/30 font-medium rounded-full border border-gray-200 transition-all bg-white">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#102033]" />
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-500">
            Showing {start} to {end} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="legal-button-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-8 h-7 md:w-10 md:h-10 flex items-center justify-center text-xs md:text-sm rounded-full shadow-sm transition ${
                  n === currentPage
                    ? 'bg-[#102033] text-white'
                    : 'text-gray-600 hover:bg-[#F8F4EE]'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="legal-button-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
