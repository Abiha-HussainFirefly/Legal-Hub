'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Eye, MessageSquare, Users } from 'lucide-react';

const myTopics = [
  {
    id: 1,
    number: 42,
    title: 'Legal Framework for Digital Assets in Pakistan - Need Clarification',
    excerpt: "I'm trying to understand the legal status of cryptocurrency and NFTs under Pakistani law. Recent amendments seem contradictory...",
    category: 'Corporate Law',
    tags: ['Islamabad', 'AI Summary', 'Answered'],
    author: {
      name: 'Muhammad Tariq',
      avatar: 'MT',
    },
    views: 14,
    replies: 342,
    timeAgo: '2 hours ago',
  },
  {
    id: 2,
    number: 87,
    title: "Inheritance Rights: Father's Property Distribution Among Sons and Daughters",
    excerpt: "My father recently passed away without a will. According to Islamic law and Pakistani civil law, how should the property be distributed?",
    category: 'Family Law',
    tags: ['Lahore', 'AI Summary', 'Answered'],
    author: {
      name: 'Ayesha Siddiqui',
      avatar: 'AS',
    },
    views: 23,
    replies: 521,
    timeAgo: '2 hours ago',
  },
  {
    id: 3,
    number: 43,
    title: 'Employer Refusing to Pay Dues After Termination - Legal Options?',
    excerpt: "I was terminated from my job after 3 years without proper notice. The company is refusing to pay my pending salary and dues. What are my legal options under labor law?",
    category: 'Labor Law',
    tags: ['Karachi', 'AI Summary', 'Answered'],
    author: {
      name: 'Rehan Zaidi',
      avatar: 'RZ',
    },
    views: 14,
    replies: 342,
    timeAgo: '2 hours ago',
  },
];

export default function MyTopicsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Image 
                  src="/logo-legal-hub.png" 
                  alt="Legal Hub" 
                  width={100}
                  height={25}
                  className="brightness-0 invert"
                />
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="/discussions" className="hover:text-purple-200 transition">
                  Discussions
                </Link>
                <Link href="/topics" className="hover:text-purple-200 transition font-medium border-b-2 border-white pb-3">
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

      {/* Main Content */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          {/* Back Button */}
          <Link 
            href="/discussions"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">My Topics</h1>
              <p className="text-sm text-gray-600">Discussions you've started and are following</p>
            </div>
            <Link
  href="/discussion/1"
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm flex items-center gap-2"
>
  <span className="text-lg">+</span>
  New Discussion
</Link>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl space-y-4">
          {myTopics.map((topic) => (
            <div key={topic.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
              {/* Topic Number & Title */}
              <div className="mb-3">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-sm flex-shrink-0">Q</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 hover:text-purple-600 cursor-pointer mb-2">
                      {topic.title}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      <span className="font-medium">{topic.number}</span> {topic.excerpt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {topic.category}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  <Users className="w-3 h-3" />
                  {topic.tags[0]}
                </span>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {topic.tags[1]}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {topic.tags[2]}
                </span>
              </div>

              {/* Author & Stats Row */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {topic.author.avatar}
                  </div>
                  <span className="text-sm text-gray-700">{topic.author.name}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {topic.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {topic.replies}
                  </span>
                  <span>{topic.timeAgo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
