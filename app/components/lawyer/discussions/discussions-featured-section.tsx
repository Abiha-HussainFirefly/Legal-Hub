'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import AnimatedLink from '@/app/components/ui/animated-link';
import { MessageSquareText } from 'lucide-react';

interface FeaturedDiscussion {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  kind?: string;
  answerCount: number;
  reactionCount?: number;
  viewCount: number;
  categoryName: string;
  regionName: string | null;
  gradient?: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorUsername: string | null;
  authorHeadline: string | null;
  authorIsLawyer: boolean;
  authorRegionName: string | null;
  isVerified: boolean;
  isAiSummaryReady?: boolean;
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

const fallbackGradients = [
  'linear-gradient(135deg, rgba(74,111,214,0.96) 0%, rgba(92,187,188,0.92) 100%)',
  'linear-gradient(135deg, rgba(177,78,160,0.95) 0%, rgba(81,118,240,0.92) 100%)',
  'linear-gradient(135deg, rgba(152,95,214,0.94) 0%, rgba(235,99,114,0.9) 100%)',
];

export default function DiscussionsFeaturedSection({
  featuredDiscussions,
}: {
  featuredDiscussions: FeaturedDiscussion[];
}) {
  const cards = featuredDiscussions.slice(0, 3);

  if (!cards.length) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Featured discussions</h2>
        <p className="text-sm text-[#8B7D99]">Important conversations worth reading first</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((discussion, index) => (
          <article
            key={discussion.id}
            className="relative min-h-[212px] overflow-hidden rounded-[22px] border border-[#4C2F5E]/10 p-5 text-white shadow-[0_18px_36px_rgba(76,47,94,0.10)]"
            style={{
              background: discussion.gradient ?? fallbackGradients[index % fallbackGradients.length],
            }}
          >
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.24)_1.4px,transparent_1.4px)] [background-position:0_0] [background-size:38px_38px]" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/88">{discussion.categoryName}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                    {discussion.kind ? discussion.kind.replaceAll('_', ' ') : 'Discussion'}
                  </p>
                </div>
                {discussion.isAiSummaryReady ? (
                  <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/82">
                    AI summary
                  </span>
                ) : null}
              </div>

              <AnimatedLink href={`/discussions/${discussion.slug}`} className="mt-7 block">
                <h3 className="max-w-[18ch] text-[1.05rem] font-semibold leading-[1.28] tracking-[-0.03em] text-white sm:text-[1.18rem]">
                  {discussion.title}
                </h3>
              </AnimatedLink>

              <div className="mt-auto pt-8">
                <div className="flex items-center justify-between gap-3">
                  <ProfileHoverLink
                    href={`/profile/user/${discussion.authorId}`}
                    displayName={discussion.authorName}
                    username={discussion.authorUsername}
                    avatarUrl={discussion.authorAvatarUrl}
                    isVerified={discussion.isVerified}
                    isLawyer={discussion.authorIsLawyer}
                    headline={discussion.authorHeadline}
                    region={discussion.authorRegionName}
                    className="inline-flex min-w-0 items-center gap-3"
                    panelAlign="left"
                  >
                    {discussion.authorAvatarUrl ? (
                      <img
                        src={discussion.authorAvatarUrl}
                        alt={discussion.authorName}
                        className="h-9 w-9 rounded-full border border-white/20 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/16 text-xs font-semibold text-white">
                        {initials(discussion.authorName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{discussion.authorName}</p>
                      <p className="truncate text-xs text-white/72">{discussion.authorHeadline || discussion.authorRegionName || 'Legal Hub member'}</p>
                    </div>
                  </ProfileHoverLink>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/88">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    {discussion.answerCount}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
