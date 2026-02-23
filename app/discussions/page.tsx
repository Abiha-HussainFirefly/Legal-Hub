'use client';

import StartDiscussionModal from '@/app/components/StartDiscussionModal';
import { useState } from 'react';

import { ChevronDown, Eye, Filter, MapPin, MessageSquare, Search, ThumbsUp, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const discussions = [
  {
    id: 1,
    title: 'Legal Framework for Digital Arrests in Pakistan - Need Clarification',
    excerpt: 'I need information and advice regarding digital arrests proceedings. The civil courts can have jurisdiction...',
    author: 'Muhammad Raza',
    category: 'Constitutional',
    tags: ['Constitutional', 'Lawyer'],
    views: 31,
    likes: 132,
    timeAgo: '3 hours ago',
  },
  {
    id: 2,
    title: 'Inheritance Rights: Father\'s Property Distribution Among Sons and Daughters',
    excerpt: 'Under Islamic law and Pakistani inheritance laws, how should a father\'s property be divided...',
    author: 'Ayesha Saleem',
    category: 'Family Law',
    tags: ['Family Law', 'Lawyer'],
    views: 23,
    likes: 45,
    timeAgo: '5 hours ago',
  },
  {
    id: 3,
    title: 'Employer Refusing to Pay Dues After Termination - Legal Options?',
    excerpt: 'I was terminated from my job 2 months ago and my employer is refusing to pay final settlement...',
    author: 'Ali Khan',
    category: 'Labor Law',
    tags: ['Labor Law', 'Unanswered'],
    views: 12,
    likes: 23,
    timeAgo: '1 day ago',
  },
  {
    id: 4,
    title: 'Property Dispute: Builder Not Delivering Possession as Per Agreement',
    excerpt: 'I booked a property 3 years ago and the builder is now refusing to hand over possession...',
    author: 'Sarah Ahmed',
    category: 'Property Law',
    tags: ['Property Law', 'Unanswered'],
    views: 8,
    likes: 14,
    timeAgo: '2 days ago',
  },
  {
    id: 5,
    title: 'Tax Notice from FBR: Understanding Section 114 Implications',
    excerpt: 'I received a notice under Section 114 regarding my tax filing. Do I need a tax lawyer or can I...',
    author: 'Imran Shah',
    category: 'Tax Law',
    tags: ['Tax Law', 'Unanswered'],
    views: 4,
    likes: 8,
    timeAgo: '3 days ago',
  },
  {
    id: 6,
    title: 'Defamation Case: Social Media Posts About Business - Legal Standing?',
    excerpt: 'Someone is making false accusations about my business on social media. Can I file a defamation...',
    author: 'Bilal Khan',
    category: 'Cyber Law',
    tags: ['Cyber Law', 'Unanswered'],
    views: 11,
    likes: 27,
    timeAgo: '4 days ago',
  },
];

const topLawyers = [
  { name: 'Adv. Hassan Ali', cases: 'Family Law', count: 234 },
  { name: 'Adv. Fatima Khan', cases: 'Property Law', count: 189 },
  { name: 'Adv. Ahmed Raza', cases: 'Corporate Law', count: 156 },
  { name: 'Adv. Sara Malik', cases: 'Criminal Law', count: 143 },
  { name: 'Adv. Ali Zafar', cases: 'Tax Law', count: 128 },
];

const trendingTopics = [
  { name: 'Contract Law', trend: '↑ 234' },
  { name: 'Property Rights', trend: '↑ 189' },
  { name: 'Tax Filing', trend: '↑ 156' },
  { name: 'Cybercrime', trend: '↑ 143' },
  { name: 'Family Law', trend: '↑ 128' },
  { name: 'Business Law', trend: '↑ 98' },
];

const registeredTopics = [
  { name: 'Family', count: 'Family Law' },
  { name: 'Criminal', count: 'Criminal Law' },
  { name: 'Property', count: 'Property Law' },
  { name: 'Corporate', count: 'Corporate Law' },
  { name: 'Tax', count: 'Tax Law' },
  { name: 'Cyber', count: 'Cyber Law' },
  { name: 'Business', count: 'Business Law' },
];

export default function LegalDiscussionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Latest Activity');
  const [isModalOpen, setIsModalOpen] = useState(false); 

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 flex items-center justify-between">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
               
              <Image 
                src="/logo-legal-hub.png" 
                alt="Legal Hub" 
                width={120}
                height={30}
                className="brightness-0 invert"
              />
              <div className="flex gap-6 text-sm">
                <Link href="/discussions" className="hover:text-purple-200 transition font-medium">
                  Discussions
                </Link>
                <Link href="/topics" className="hover:text-purple-200 transition">
                  My Topics
                </Link>
                <Link href="/saved" className="hover:text-purple-200 transition">
                  Saved
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/lawyerlogin" className="text-sm hover:text-purple-200 transition">
                Sign In
              </Link>
              <Link 
                href="/lawyerregister"
                className="px-4 py-1.5 bg-white text-purple-600 rounded text-sm hover:bg-gray-100 transition font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Legal Discussions</h1>
          <p className="text-sm text-gray-600 mb-5">Ask, learn and connect with legal experts and community members across Pakistan</p>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-900 to-red-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs mb-1">Criminal Law</div>
                  <div className="text-sm font-bold">Criminal Law Amendments 2025</div>
                </div>
                <MessageSquare className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs mt-2 opacity-90">by Adv. Nimra Khan</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 to-cyan-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs mb-1">Contract Law</div>
                  <div className="text-sm font-bold">Digital Contract Validity in Pakistani Courts</div>
                </div>
                <MessageSquare className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs mt-2 opacity-90">by Adv. Shahid Khan</div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-purple-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs mb-1">Tax Law</div>
                  <div className="text-sm font-bold">Property Tax reforms 2025: What You Need to</div>
                </div>
                <MessageSquare className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs mt-2 opacity-90">by Adv. Sara Khan</div>
            </div>

            <div className="bg-gradient-to-br from-teal-800 to-teal-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs mb-1">Labor Law</div>
                  <div className="text-sm font-bold">Labor Rights in Remote Work Arrangements</div>
                </div>
                <MessageSquare className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs mt-2 opacity-90">by Adv. Ahmed Shah</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search legal topics, keywords, or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-48 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
            >
              + Start Discussion
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm">
                <Filter className="w-4 h-4" />
                Latest Activity
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm">
                All Categories
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition text-sm">
                <MapPin className="w-4 h-4" />
                All Regions
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
              AI Summarized only
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Discussion Area */}
          <main className="flex-1">
            {/* Quick Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition">
                  Latest Posts
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition">
                  Popular Posts
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition">
                  Unanswered
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition">
                  Criminal Law
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition">
                  Constitutional
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition">
                  Family Law
                </button>
              </div>
            </div>

            {/* Discussion Posts */}
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <div key={discussion.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer text-sm">
                    {discussion.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                    {discussion.excerpt}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {discussion.category}
                    </span>
                    {discussion.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 bg-purple-200 rounded-full" />
                      <span>{discussion.author}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {discussion.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {discussion.likes}
                      </span>
                      <span>{discussion.timeAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            {/* Top Lawyers */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">🏆 Top Lawyers This Month</h3>
              <div className="space-y-2">
                {topLawyers.map((lawyer, index) => (
                  <div key={lawyer.name} className="flex items-center gap-2 text-xs">
                    <span className="text-purple-600 font-bold">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{lawyer.name}</div>
                      <div className="text-gray-500 text-xs">{lawyer.cases}</div>
                    </div>
                    <span className="text-gray-400 text-xs">{lawyer.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Trending This Week
              </h3>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{index + 1}. {topic.name}</span>
                    <span className="text-gray-400">{topic.trend}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Hot Topics */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Regional Hot Topics</h3>
              <div className="space-y-2">
                {registeredTopics.map((topic) => (
                  <div key={topic.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{topic.name}</span>
                    <span className="text-gray-500">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Start Discussion Modal */}
      <StartDiscussionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}