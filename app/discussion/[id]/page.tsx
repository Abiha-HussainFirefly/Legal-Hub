'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Eye, Share2, Bookmark, ThumbsUp, MessageSquare, Sparkles } from 'lucide-react';
import AISummaryModal from '@/app/components/AISummaryModal';

export default function DiscussionDetailPage() {
  const [showAISummary, setShowAISummary] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Image 
                src="/logo-legal-hub.png" 
                alt="Legal Hub" 
                width={100}
                height={25}
                className="brightness-0 invert"
              />
              <div className="flex gap-6 text-sm">
                <Link href="/discussions" className="hover:text-purple-200 transition">
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

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            href="/topics"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Main Discussion Card */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            {/* Question Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-400 text-sm">Q</span>
                    <h1 className="text-xl font-bold text-gray-900">
                      Legal Framework for Digital Assets in Pakistan - Need Clarification
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      Corporate Law
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      Islamabad
                    </span>
                    <button 
                      onClick={() => setShowAISummary(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-medium hover:bg-purple-700 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Summary
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Bookmark className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  MT
                </div>
                <span className="text-sm text-gray-700">Muhammad Tariq</span>
                <span className="text-xs text-gray-400">• 2 hours ago</span>
              </div>

              {/* Question Content */}
              <div className="text-sm text-gray-700 leading-relaxed space-y-4">
                <p>I need assistance in understanding the legal status of digital assets (cryptocurrency and NFTs) under Pakistani law. Recent amendments seem contradictory in several areas.</p>
                
                <p className="font-medium">Specifically, I want to know:</p>
                
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>Are digital assets legally recognized as property in Pakistan under the Transfer of Property Act 1882?</li>
                  <li>Can I include cryptocurrency in my will as heritable property, and will it be recognized by Pakistani courts?</li>
                  <li>If I earn income from NFT sales or cryptocurrency trading, how should I declare this for tax purposes under the Income Tax Ordinance 2001?</li>
                  <li>Are there any court precedents or legal opinions from the Supreme Court or High Courts regarding digital asset ownership?</li>
                </ol>

                <p>The recent SBP circulars seem to ban cryptocurrency transactions, but some legal experts argue this only applies to financial institutions. I'm confused about where an individual citizen stands legally if they hold or trade digital assets.</p>
                
                <p>Any guidance from legal professionals or those with experience in this area would be greatly appreciated. Thank you!</p>
              </div>
            </div>
          </div>

          {/* Answers Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              3 Answers
            </h2>

            <div className="space-y-6">
              {/* Answer 1 */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ZH
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Adv. Zahid Hassan</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Verified Lawyer
                      </span>
                      <span className="text-xs text-gray-400">• 1 hour ago</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Constitutional Law</p>
                    <div className="text-sm text-gray-700 leading-relaxed space-y-3">
                      <p>Excellent question. Let me address each of your concerns:</p>
                      <p><strong>1. Legal Recognition:</strong> Currently, there is NO explicit legal framework in Pakistan that recognizes digital assets as "property" under traditional property laws. However, the absence of explicit recognition doesn't mean they are "illegal" to own - it's more of a legal grey area.</p>
                      <p><strong>2. Inheritance:</strong> While you CAN include cryptocurrency in your will, enforcement would be challenging. Pakistani courts haven't yet established clear precedents. I'd recommend consulting with a tech-savvy estate lawyer who can draft specific clauses.</p>
                      <p><strong>3. Tax Declaration:</strong> Under Section 111 of the Income Tax Ordinance 2001, any income from business or trade must be declared. The FBR has issued notices to some cryptocurrency traders, treating gains as taxable income under the "income from other sources" category.</p>
                      <p><strong>4. Court Precedents:</strong> There are currently no Supreme Court or High Court judgments specifically addressing cryptocurrency ownership or trading rights.</p>
                      <p>The SBP circular (dated 2018) does indeed primarily target financial institutions. However, individuals should be cautious as regulatory frameworks are evolving.</p>
                    </div>
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 mt-3">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-medium">23</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Answer 2 */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    AH
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Ahmed Hasan</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Legal Expert
                      </span>
                      <span className="text-xs text-gray-400">• 45 min ago</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Tax Law</p>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <p>I want to add to Adv. Zahid's comprehensive answer. On the tax side, the FBR has been increasingly active in this space. Here are some practical considerations:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                        <li>Keep detailed records of all transactions - dates, amounts, counterparties</li>
                        <li>Consider declaring gains under the "income from other sources" head</li>
                        <li>Be prepared to provide documentation if asked</li>
                      </ul>
                      <p className="mt-2">There's also the question of Zakat on digital assets, which remains unresolved in Pakistani Islamic jurisprudence.</p>
                    </div>
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 mt-3">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-medium">12</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Answer 3 */}
              <div className="pb-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    SK
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Dr. Sara Khan</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                        Contributor
                      </span>
                      <span className="text-xs text-gray-400">• 30 min ago</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Property Law</p>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <p>From a property law perspective, the challenge is that Pakistani law predates digital technology. The Transfer of Property Act 1882 and Succession Act 1925 were written for tangible assets.</p>
                      <p className="mt-2">However, there's an argument to be made that digital assets could fall under the definition of "goods" or "moveable property" in the Sale of Goods Act 1930. This hasn't been tested in court yet, but it's a potential legal avenue.</p>
                      <p className="mt-2">I'd strongly recommend getting proper legal documentation for any significant digital asset holdings, including detailed instructions for executors on how to access and transfer these assets.</p>
                    </div>
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 mt-3">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-medium">8</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Your Answer Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Your Answer</h3>
              <textarea
                placeholder="Share your legal expertise or experience..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-500">Make sure to follow a decent code of ethics</span>
                <div className="flex gap-3">
                  <button className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                    Cancel
                  </button>
                  <button className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                    Post Answer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Modal */}
      <AISummaryModal 
        isOpen={showAISummary} 
        onClose={() => setShowAISummary(false)} 
      />
    </div>
  );
}
