"use client";

import LawyerVerificationModal from '@/app/components/LawyerVerificationModal';
import { FileTextIcon, Search } from 'lucide-react';
import { useState } from 'react';

const lawyers = [
  { id: 1,  name: 'Mohsin Khan',    barNumber: 'BAR-12345', region: 'Islamabad', status: 'pending',  submitted: '2024-01-19' },
  { id: 2,  name: 'Sana Ali',       barNumber: 'BAR-23456', region: 'Karachi',   status: 'pending',  submitted: '2024-01-14' },
  { id: 3,  name: 'Hassan Raza',    barNumber: 'BAR-34567', region: 'Lahore',    status: 'verified', submitted: '2024-01-10' },
  { id: 4,  name: 'Ayesha Tariq',   barNumber: 'BAR-45678', region: 'Peshawar',  status: 'pending',  submitted: '2024-01-22' },
  { id: 5,  name: 'Bilal Ahmed',    barNumber: 'BAR-56789', region: 'Quetta',    status: 'verified', submitted: '2024-01-18' },
  { id: 6,  name: 'Zara Sheikh',    barNumber: 'BAR-67890', region: 'Islamabad', status: 'pending',  submitted: '2024-01-25' },
  { id: 7,  name: 'Omar Farooq',    barNumber: 'BAR-78901', region: 'Karachi',   status: 'verified', submitted: '2024-01-12' },
  { id: 8,  name: 'Nida Malik',     barNumber: 'BAR-89012', region: 'Lahore',    status: 'pending',  submitted: '2024-01-27' },
  { id: 9,  name: 'Farrukh Baig',   barNumber: 'BAR-90123', region: 'Multan',    status: 'verified', submitted: '2024-01-09' },
  
];

const ITEMS_PER_PAGE = 3;

export default function Verification() {
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [currentPage, setCurrentPage]     = useState(1);

  const openModal = (lawyer: any) => {
    setSelectedLawyer(lawyer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLawyer(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filtered = lawyers.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.barNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const start      = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end        = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    
    <div className="bg-[#FFFFFF] rounded-2xl p-4 md:p-6">

      {/* Page Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Lawyer Verification</h1>
        <p className="text-xs sm:text-sm text-gray-500">Manage verification workflow</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name or bar number..."
              className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white">
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Name</th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Bar Number</th>
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Region</th>
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Status</th>
                <th className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Submitted</th>
                <th className="px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length > 0 ? paginated.map((lawyer) => (
                <tr key={lawyer.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 md:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{lawyer.name}</span>
                      <span className="sm:hidden text-[10px] text-gray-400">{lawyer.barNumber}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {lawyer.barNumber}
                  </td>
                  <td className="px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {lawyer.region}
                  </td>
                  <td className="px-4 md:px-6 py-3 sm:py-4">
                    <span
                      className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium ${
                        lawyer.status === 'pending'
                          ? 'bg-[#EEA62B] text-white' 
                          : 'bg-[#008B62] text-white'
                      }`}
                    >
                      {lawyer.status === 'pending' ? 'Pending' : 'Verified'}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-3 sm:py-4 text-sm text-gray-600">
                    {lawyer.submitted}
                  </td>
                  <td className="px-4 md:px-6 py-3 sm:py-4">
                    <button 
                      onClick={() => openModal(lawyer)}
                      className="inline-flex items-center gap-1.5 text-sm text-black-600 hover:text-black-700 font-medium"
                    >
                      <FileTextIcon className="w-4 h-4 text-[#4C2F5E] flex-shrink-0" />
                      <span className="hidden sm:inline">Review</span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No results found for &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing {start} to {end} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 md:px-4 py-1.5 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-8 h-7 md:w-9 md:h-8 flex items-center justify-center text-xs md:text-sm rounded-xl shadow-sm transition ${
                  n === currentPage
                    ? 'bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 md:px-4 py-1.5 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded-full border border-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Verification Modal */}
      <LawyerVerificationModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        lawyerData={selectedLawyer}
      />
    </div>
  );
}
