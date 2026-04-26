'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import { Flame, Sparkles } from 'lucide-react';

interface TrendingTopic {
  id: string;
  name: string;
  trend: string;
  thisWeek: number;
}

interface TopLawyer {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  headline: string | null;
  practiceArea: string;
  firmName: string | null;
  region: string | null;
  score: number;
  monthlyCount: number;
  isVerified: boolean;
}

interface FocusCategory {
  id: string;
  name: string;
  discussionCount: number;
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'LH'
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="lh-skeleton h-11 rounded-[12px]" />
      ))}
    </div>
  );
}

export default function DiscussionsDiscoverySidebar({
  sidebarLoading,
  trendingTopics,
  topLawyers,
  focusCategories,
  selectedCategory,
  onSelectCategory,
}: {
  sidebarLoading: boolean;
  trendingTopics: TrendingTopic[];
  topLawyers: TopLawyer[];
  focusCategories: FocusCategory[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <div className="workspace-sidebar overflow-hidden p-0">
        <div className="border-b border-[#2F1D3B]/8 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Categories</h2>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-sm font-semibold transition ${
              !selectedCategory
                ? 'bg-[#2F74D0] text-white shadow-[0_12px_24px_rgba(47,116,208,0.18)]'
                : 'text-[#4A3C58] hover:bg-[#F8F6FB]'
            }`}
          >
            <span>View all</span>
            <span className={`${!selectedCategory ? 'text-white/80' : 'text-[#8B7D99]'}`}>∞</span>
          </button>

          <div className="mt-2 space-y-1">
            {sidebarLoading ? (
              <LoadingRows />
            ) : (
              focusCategories.slice(0, 6).map((category) => {
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.id)}
                    className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]'
                        : 'font-medium text-[#5E516B] hover:bg-[#F8F6FB]'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-[#8B7D99]">{category.discussionCount}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="workspace-sidebar overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[#2F1D3B]/8 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Most helpful</h3>
          <span className="text-sm text-[#8B7D99]">Last 30 days</span>
        </div>

        <div className="p-3">
          {sidebarLoading ? (
            <LoadingRows />
          ) : topLawyers.length === 0 ? (
            <p className="px-2 py-2 text-sm text-[#736683]">Contributor highlights will appear as helpful activity grows.</p>
          ) : (
            <div className="space-y-1">
              {topLawyers.slice(0, 4).map((lawyer) => (
                <ProfileHoverLink
                  key={lawyer.id}
                  href={`/profile/user/${lawyer.id}`}
                  displayName={lawyer.name}
                  username={lawyer.username}
                  avatarUrl={lawyer.avatarUrl}
                  isVerified={lawyer.isVerified}
                  isLawyer
                  headline={lawyer.headline}
                  practiceArea={lawyer.practiceArea}
                  firmName={lawyer.firmName}
                  region={lawyer.region}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-3 transition hover:bg-[#F8F6FB]"
                >
                  {lawyer.avatarUrl ? (
                    <img src={lawyer.avatarUrl} alt={lawyer.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                      {initials(lawyer.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#2F1D3B]">{lawyer.name}</p>
                    <p className="truncate text-xs text-[#8B7D99]">{lawyer.practiceArea}</p>
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full border border-[#4C2F5E]/10 bg-[#F8F6FB] px-2.5 py-1 text-xs font-semibold text-[#5E516B]">
                    <Sparkles className="h-3 w-3 text-[#4C2F5E]" />
                    {lawyer.monthlyCount}
                  </div>
                </ProfileHoverLink>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="workspace-sidebar overflow-hidden p-0">
        <div className="border-b border-[#2F1D3B]/8 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Trending now</h3>
        </div>

        <div className="p-3">
          {sidebarLoading ? (
            <LoadingRows />
          ) : trendingTopics.length === 0 ? (
            <p className="px-2 py-2 text-sm text-[#736683]">Trending topics will appear here as discussion activity increases.</p>
          ) : (
            <div className="space-y-2">
              {trendingTopics.slice(0, 4).map((topic) => (
                <div key={topic.id} className="rounded-[12px] bg-[#FBF9FD] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[#2F1D3B]">{topic.name}</p>
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#F1EAF6] px-2 py-1 text-[11px] font-semibold text-[#4C2F5E]">
                      <Flame className="h-3 w-3" />
                      {topic.trend}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-[#8B7D99]">{topic.thisWeek} discussions this week</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
