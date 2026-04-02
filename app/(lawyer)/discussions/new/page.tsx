'use client';

import { ArrowLeft, Bookmark, Eye, Flag, Menu, Share2, X } from 'lucide-react';
import AISummaryModal from '@/app/components/lawyer/discussions/ai-summary-modal';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const answers = [
  {
    id: 1,
    author: 'Adv. Luqman Hashim',
    badge: 'Best Answer',
    timeAgo: '1 hour ago',
    upvotes: 17,
    tags: ['Criminal Law'],
    views: '3400 view',
    content: `Great question! The legal landscape for digital assets in Pakistan is indeed evolving rapidly.

**Key Points:**

1. **Cryptocurrencies:** Currently NOT recognized as legal tender. The SBP's 2018 circular prohibited banks from facilitating cryptocurrency transactions.

2. **Tax Implications:** Capital gains from crypto trading fall under regular income tax provisions (15-35% depending on income bracket). However, enforcement remains challenging.

3. **NFTs:** These fall under existing IP laws. The Copyright Ordinance 1962 and Patents Ordinance 2000 can apply, but there's no specific NFT legislation yet.

4. **Licensing:** The SECP is developing a regulatory framework. No licensing currently required, but this may change soon.

I recommend consulting with a financial law specialist for your specific case. The regulatory landscape is changing rapidly, and you'll want current advice.`
  },
  {
    id: 2,
    author: 'Ahmed Hassan',
    timeAgo: '45 minutes ago',
    upvotes: 23,
    content: `I was in a similar situation last year. Sarah's answer is spot on. Just want to add that the FBR has been increasingly scrutinizing crypto transactions. Make sure to maintain detailed records of all your transactions.`
  },
  {
    id: 3,
    author: 'Adv. Bilal Raza',
    badge: 'Verified',
    timeAgo: '30 minutes ago',
    upvotes: 8,
    tags: ['Corporate Law'],
    views: '1820 view',
    content: `To add to Sarah's excellent response, the 2024 amendments you mentioned introduce a "regulatory sandbox" approach. This allows fintech companies to test innovative products under SECP supervision.

If you're planning to operate a crypto-related business, I'd strongly recommend applying for sandbox participation. It provides legal clarity during the development phase.

Also worth noting: Provincial laws may add another layer. Pi`
  }
];

export default function DiscussionDetailPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

          <div className="hidden lg:flex items-center justify-end gap-6 text-sm flex-1">
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
              <Link href="/lawyerlogin" className="opacity-80 hover:opacity-100 transition">Sign In</Link>
              <Link href="/lawyerregister" className="px-4 py-1.5 border border-white/30 rounded text-sm hover:bg-white/10 transition font-medium">
                Sign up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 bg-gray-50">
        <Link 
          href="/discussions"
          className="inline-flex items-center gap-2 text-m text-[#9E62C4] hover:text-[#9E62C4] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        {/* Discussion Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 justify-center">
          
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Image 
                src="/icons/vector.png" 
                alt="Up" 
                width={20} 
                height={20} 
                className="mt-1 shrink-0"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' 
                }}
                unoptimized
              />
              <h1 className="text-[14px] md:text-[16px] font-bold text-gray-900 leading-tight">
                Legal Framework for Digital Assets in Pakistan - Need Clarification
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* AI Summary Button */}
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center gap-1.5 bg-[#9E63C4] text-white px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium shadow-sm hover:bg-[#8a54b0] transition-colors whitespace-nowrap"
              >
                <Image src="/icons/ai.png" alt="ai" width={14} height={14} className="brightness-0 invert" unoptimized />
                AI Summary
              </button>
              <button className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition">
                <Share2 className="w-4 h-4 md:w-5 md:h-5 text-[#4C2F5E]" />
              </button>
              <button className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition">
                <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-[#4C2F5E]" />
              </button>
              <button className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition">
                <Flag className="w-4 h-4 md:w-5 md:h-5 text-[#4C2F5E]" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-black rounded-full text-xs md:text-sm font-medium border border-gray-200">
              Corporate Law
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 text-gray-600 rounded-full text-xs md:text-sm bg-white">
              <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0 opacity-70" unoptimized />
              Islamabad
            </span>
            <span className="px-3 py-1 bg-[#9F63C4] text-white rounded-full text-xs md:text-sm font-medium">
              <Image src="/icons/ai.png" alt="AI" width={12} height={12} className="brightness-0 invert inline mr-1" unoptimized />
              AI Summary Available
            </span>
          </div>

          {/* Author Info */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9F63C4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                LH
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Luqman Hashim</div>
                <div className="text-xs text-gray-500">Posted 3 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Eye className="w-4 h-4 text-[#4C2F5E]" />
              <span>342</span>
            </div>
          </div>

          {/* Question Content */}
          <div className="prose max-w-none">
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              I'm trying to understand the legal status of cryptocurrency and NFTs under Pakistani law. Recent amendments seem contradictory to earlier stances.
            </p>

            <h3 className="text-sm font-bold text-gray-700 mb-3">**Specific Questions:**</h3>

            <ol className="space-y-2 mb-4 text-sm text-gray-700">
              <li>1. Are cryptocurrencies considered legal tender or securities in Pakistan?</li>
              <li>2. What are the tax implications of cryptocurrency trading?</li>
              <li>3. How do NFTs fit into existing intellectual property laws?</li>
              <li>4. Are there any licensing requirements for cryptocurrency exchanges?</li>
            </ol>

            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              I've reviewed the State Bank of Pakistan's circulars from 2018 and 2021, but the recent 2024 amendments introduced by the Securities and Exchange Commission seem to create some ambiguity.
            </p>

            <p className="text-gray-700 text-sm leading-relaxed">
              Any insights from legal experts familiar with financial technology regulations would be greatly appreciated. Thank you!
            </p>
          </div>
        </div>

        {/* ANSWERS SECTION */}
        <div className="flex items-center gap-2 text-[#4C2F5E] mb-6 mt-10">
          <Image 
            src="/icons/message.png" 
            alt="msg" 
            width={22} 
            height={22}
            unoptimized
          />
          <h2 className="text-xl font-bold">3 Answers</h2>
        </div>   
         
        {/* Answer 1 — Best Answer */}
        <div className="bg-white rounded-2xl border-2 border-[#F4EBF9] p-4 md:p-8 shadow-sm relative mb-6 overflow-hidden">
          
          <div className="absolute top-4 left-4 flex items-center gap-1.5">
            <Image src="/icons/circletick.png" alt="best" width={14} height={14} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
            <span className="text-[11px] font-bold text-[#9E63C4]">Best Answer</span>
          </div>

          <div className="flex items-start gap-4 md:gap-6 mt-6">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Image src="/icons/vector.png" alt="up" width={16} height={16} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
              <span className="text-sm font-bold text-[#9E63C4]">43</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-1 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-[#9F63C4] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      AL
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <span className="font-semibold text-black text-sm">Adv. Luqman Hashim</span>
                        <Image 
                          src="/icons/circletick.png" 
                          alt="verified" 
                          width={14} 
                          height={14} 
                          style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} 
                          unoptimized
                        />
                        <span className="px-3 py-0.5 bg-white border border-gray-100 rounded-full text-[10px] text-gray-400 font-bold tracking-tight">
                          Criminal Law
                        </span>
                        <span className="text-[11px] font-bold text-[#9E63C4]">
                          2450 rep
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        1 hour ago
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none mt-3">
                    <p className="text-[#6E7D7D] text-sm leading-relaxed mb-4">
                      Great question! The legal landscape for digital assets in Pakistan is indeed evolving rapidly.
                    </p>
                    <p className="space-y-2 mb-4 text-sm text-[#6E7D7D]">
                      **Key Points:**
                    </p>
                    <ol className="space-y-2 mb-4 text-sm text-[#6E7D7D]">
                      <li>1. **Cryptocurrencies**: Currently NOT recognized as legal tender. The SBP's 2018 circular prohibited banks from facilitating cryptocurrency transactions</li>
                      <li>2. **Tax Implications**: Capital gains from crypto trading fall under regular income tax provisions (15-35% depending on income bracket). However, enforcement remains challenging.</li>
                      <li>3. **NFTs**: These fall under existing IP laws. The Copyright Ordinance 1962 and Patents Ordinance 2000 can apply, but there's no specific NFT legislation yet.</li>
                      <li>4. **Licensing**: The SECP is developing a regulatory framework. No licensing currently required, but this may change soon.</li>
                    </ol>
                    <p className="text-[#6E7D7D] text-sm leading-relaxed mb-4">
                      I recommend consulting with a financial law specialist for your specific case. The regulatory landscape is changing rapidly, and you'll want current advice..
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer 2 */}
        <div className="bg-white rounded-2xl border-2 border-[#F4EBF9] p-4 md:p-8 shadow-sm relative mb-6 overflow-hidden">
          <div className="border-gray-200 pb-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button className="hover:bg-gray-100 p-1 rounded transition">
                  <Image 
                    src="/icons/vector.png" 
                    alt="Up" 
                    width={16} 
                    height={16} 
                    style={{ 
                      filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' 
                    }}
                    unoptimized
                  />
                </button>
                <span className="text-sm font-bold text-[#4C2F5E]">23</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#9F63C4] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    AH
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Ahmed Hassan</div>
                    <div className="text-xs text-gray-500">45 minutes ago</div>
                  </div>
                </div>

                <div className="text-sm text-[#6E7D7D] leading-relaxed">
                  <p>I was in a similar situation last year. Sarah's answer is spot on. Just want to add that the FBR has been increasingly scrutinizing crypto transactions. Make sure to maintain detailed records of all your transactions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer 3 */}
        <div className="bg-white rounded-2xl border-2 border-[#F4EBF9] p-4 md:p-8 shadow-sm relative mb-6 overflow-hidden">
          <div className="flex items-start gap-4 md:gap-6 mt-6">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Image src="/icons/vector.png" alt="up" width={16} height={16} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
              <span className="text-sm font-bold text-[#9E63C4]">43</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-1 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-[#9F63C4] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      AL
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <span className="font-semibold text-black text-sm">Adv. Luqman Hashim</span>
                        <Image 
                          src="/icons/circletick.png" 
                          alt="verified" 
                          width={14} 
                          height={14} 
                          style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} 
                          unoptimized
                        />
                        <span className="px-3 py-0.5 bg-white border border-gray-100 rounded-full text-[10px] text-gray-400 font-bold tracking-tight">
                          Corporate Law
                        </span>
                        <span className="text-[11px] font-bold text-[#9E63C4]">
                          1820 rep
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        1 hour ago
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-[#6E7D7D] leading-relaxed space-y-3 mt-3">
                    <p>
                      To add Sarah's excellent response, the 2024 amendments you mentioned introduce a "regulatory sandbox" approach. This allows fintech companies to test innovative products under SECP supervision.
                    </p>
                    <p>
                      If you're planning to operate a crypto-related business, I'd strongly recommend applying for sandbox participation. It provides legal clarity during the development phase.
                    </p>
                    <p>
                      Also worth noting: Provincial laws may add another layer. Punjab has been more progressive with fintech regulation compared to other provinces.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ANSWER SECTION */}
        <div className="bg-white rounded-2xl border-2 border-[#F4EBF9] p-4 md:p-8 shadow-sm relative mb-6 overflow-hidden">
          <h2 className="text-[16px] font-bold text-[#4C2F5E] mb-6">Your Answer</h2>

          <div className="relative">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Search your legal expertise or experience..."
              className="w-full h-36 md:h-44 p-4 md:p-6 border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#9E63C4] outline-none resize-none text-[14px] text-[#6E7D7D] placeholder:text-gray-300 transition-all"
            />
          </div>
          
          <div className="flex items-start md:items-center justify-between mt-6 flex-col md:flex-row gap-4">
            <p className="text-[12px] text-[#6E7D7D] font-medium">
              Please ensure your answer is accurate and helpful
            </p>
            
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              <button 
                onClick={() => setAnswerText('')}
                className="flex-1 md:flex-none px-6 md:px-8 py-2.5 bg-[#F9FAFB] border border-gray-100 text-[#6E7D7D] rounded-lg text-sm shadow-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="flex-1 md:flex-none px-6 md:px-8 py-2.5 bg-[#9E63C4] text-white rounded-lg text-sm shadow-md hover:opacity-95 transition">
                Post Answer
              </button>
            </div>
          </div>
        </div>
      </div>

      <AISummaryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
