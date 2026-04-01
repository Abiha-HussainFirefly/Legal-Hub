'use client';

import { ArrowLeft, Eye, Menu, X, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const saved = [
  {
    id: 1,
    title: 'Legal Framework for Digital Assets in Pakistan - Need Clarification',
    excerpt: '43  I am trying to understand the legal status of cryptocurrency and NFTs under pakistani law.Recent amendments seem contradictory.. ',
    author: 'Muhammad Tariq',
    category: 'Corporate Law',
    tags: ['Islamabad', 'AI Summary', 'Answered'],
    views: 14,
    likes: 342,
    timeAgo: '3 hours ago',
  },
  {
    id: 2,
    title: "Inheritance Rights: Father's Property Distribution Among Sons and Daughters",
    excerpt: '67  My father recently passed away without a will.According to Islamic law and Pakistani civil law,how should the property be distributed?',
    author: 'Ayesha Siddiqui',
    category: 'Family Law',
    tags: ['Lahore', 'AI Summary', 'Answered'],
    views: 23,
    likes: 521,
    timeAgo: '2 hours ago',
  },
  {
    id: 3,
    title: 'Employer Refusing to Pay Dues After Termination - Legal Options?',
    excerpt: '43  I was terminated from my job after 3 years without proper notice. The company is refusing to pay my pending salary and dues. What are my legal options under labor law?',
    author: 'Rehan Zaidi',
    category: 'Labor Law',
    tags: ['Karachi', 'AI Summary','Answered'],
    views: 14,
    likes: 352,
    timeAgo: '2 hours ago',
  },
];

export default function SavedPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('user_name') || 'Legal Expert';
    const role = localStorage.getItem('user_role') || 'LAWYER';
    setUser({ name, role });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/lawyerlogin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-[linear-gradient(135deg,#4C2F5E_0%,#9E63C4_100%)] text-white px-4 md:px-8 py-4">
        <div className="container mx-auto flex items-center justify-between relative">

          <div className="hidden lg:flex flex-1">
            <Image 
              src="/logo-legal-hub.png" 
              alt="Legal Hub" 
              width={120}
              height={30}
              className="brightness-0 invert"
              unoptimized
            />
          </div>

          <div className="flex lg:hidden items-center justify-between w-full">
      
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center text-white hover:opacity-80 transition"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="absolute left-1/2 -translate-x-1/2">
              <Image 
                src="/logo-legal-hub.png" 
                alt="Legal Hub" 
                width={120}
                height={30}
                className="brightness-0 invert"
                unoptimized
              />
            </div>

            <div className="w-9 h-9" />
          </div>

          <div className="hidden lg:flex gap-8 text-sm font-medium absolute left-1/2 -translate-x-1/2">
            <Link href="/discussions" className="opacity-80 hover:opacity-100 transition">
              Discussions
            </Link>
            <Link href="/topics" className="opacity-80 hover:opacity-100 transition">
              My Topics
            </Link>
            <Link href="/saved" className="opacity-80 hover:opacity-100 transition">
              Saved
            </Link>
          </div>

          <div className="hidden lg:flex items-center justify-end gap-4 text-sm flex-1">
            
            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="relative w-9 h-9 bg-transparent flex items-center justify-center transition-all active:scale-95 hover:opacity-80 outline-none border-none cursor-pointer"
              >
                <Image 
                  src="/icons/user.png" 
                  alt="User Profile" 
                  width={36} 
                  height={36} 
                  className="object-contain"
                  priority
                  unoptimized
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800 z-50">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-transparent flex items-center justify-center">
                        <Image src="/icons/user.png" alt="User" width={35} height={35} unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#4C2F5E] truncate">{user?.name}</p>
                        <p className="text-[10px] font-bold text-[#9E63C4] uppercase tracking-wider">{user?.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3 text-sm font-medium px-1 pb-2">
            <Link href="/discussions" className="opacity-80 hover:opacity-100 transition py-1" onClick={() => setIsMobileMenuOpen(false)}>
              Discussions
            </Link>
            <Link href="/topics" className="opacity-80 hover:opacity-100 transition py-1" onClick={() => setIsMobileMenuOpen(false)}>
              My Topics
            </Link>
            <Link href="/saved" className="opacity-80 hover:opacity-100 transition py-1" onClick={() => setIsMobileMenuOpen(false)}>
              Saved
            </Link>
            <div className="flex items-center gap-4 pt-1 border-t border-white/20">
              <Link href="/lawyerlogin" className="opacity-80 hover:opacity-100 transition">
                Sign In
              </Link>
              <Link 
                href="/lawyerregister"
                className="px-4 py-1.5 border border-white/30 rounded text-sm hover:bg-white/10 transition font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Header Section */}
      <div className="bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          
          <Link 
            href="/discussions"
            className="inline-flex items-center gap-2 text-m text-[#9E62C4] hover:text-[#9E62C4] mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#4C2F5E]">Saved Discussions</h1>
              <p className="text-sm text-[#6E7D7D]">Legal discussions you've bookmarked for later reference</p>
            </div>

            <Link
              href="/discussion/new"
              className="px-4 md:px-6 py-2 md:py-2.5 bg-[linear-gradient(90deg,#9F63C4_0%,#4C2F5E_100%)] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 md:gap-3 shadow-md flex-shrink-0"
            >
              <div className="w-5 h-5 md:w-6 md:h-6 border-[2px] border-white rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm md:text-base font-bold leading-none translate-y-[-1px]">+</span>
              </div>
              <span className="text-[15px] md:text-[18px] font-medium tracking-wide">
                New Discussion
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Discussion List */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="space-y-3">
          {saved.map((saved) => (
            <div key={saved.id} className="bg-white rounded-lg p-4 md:p-5 border border-gray-50 shadow-sm hover:shadow-md transition group">
              
              <div className="flex items-start gap-2 mb-2">
                <Image 
                  src="/icons/vector.png" 
                  alt="Up" 
                  width={18} 
                  height={18} 
                  className="mt-1 shrink-0 opacity-100"
                  style={{ 
                    filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' 
                  }}
                  unoptimized
                />
                <h3 className="font-semibold text-black leading-tight hover:text-[#4C2F5E] cursor-pointer text-[14px] md:text-[16px]">
                  {saved.title}
                </h3>
              </div>
                        
              <p className="text-[#6E7D7D] text-sm mb-3 line-clamp-2">
                {saved.excerpt}
              </p>
      
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-50 text-black rounded-full text-xs md:text-sm border border-gray-200">
                    {saved.category}
                  </span>
                
                  {saved.tags.map((tag) => {
                    if (tag === 'Islamabad' || tag === 'Karachi' || tag === 'Punjab' || tag === 'Lahore' || tag === 'Multan') {
                      return (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 text-gray-600 rounded-full text-xs md:text-sm bg-white">
                          <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0 opacity-70" unoptimized />
                          {tag}
                        </span>
                      );
                    }
                
                    if (tag === 'AI Summary') {
                      return (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-[#9F63C4] text-white rounded-full text-xs md:text-sm font-medium shadow-sm">
                          <Image src="/icons/ai.png" alt="AI" width={12} height={12} className="brightness-0 invert shrink-0" unoptimized />
                          {tag}
                        </span>
                      );
                    }

                    if (tag === 'Answered') {
                      return (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 text-[#4C2F5E] text-xs md:text-sm font-medium">
                          <div className="w-3.5 h-3.5 border border-[#4C2F5E] rounded-full flex items-center justify-center shrink-0">
                            <svg 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="#4C2F5E" 
                              strokeWidth="4" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="w-2 h-2"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          {tag}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              <hr className="border-gray-100 mb-4" />
              
              <div className="flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#9F63C4] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {saved.author.charAt(0)}
                  </div>
                  <span className="text-xs md:text-sm text-[#6E7D7D] font-medium">{saved.author}</span>
                </div>
                
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="flex items-center gap-1">
                    <Image src="/icons/message.png" alt="Mes" width={10} height={10} unoptimized />
                    {saved.likes}
                  </span>
                  <span className="flex items-center gap-1 text-[#4C2F5E]">
                    <Eye className="w-3 h-3" />
                    {saved.views}
                  </span>
                  <span className="hidden sm:inline">{saved.timeAgo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
