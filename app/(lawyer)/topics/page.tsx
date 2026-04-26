'use client';

import AnimatedLink, { navigateWithTransition } from '@/app/components/ui/animated-link';
import LawyerTopbar from '@/app/components/lawyer/lawyer-topbar';
import { ArrowLeft, Eye, Hash, MessagesSquare, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DiscussionRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: string;
  answerCount: number;
  viewCount: number;
  isAiSummaryReady: boolean;
  createdAt: string;
  author: { id: string; displayName: string | null; avatarUrl: string | null };
  category: { name: string };
  region: { name: string } | null;
  tags: { tag: { id: string; name: string } }[];
}

interface CurrentUser {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
}

function timeAgo(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string | null) {
  if (!name) return 'LH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#4C2F5E]/10 bg-white p-6">
      <div className="flex gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-[#F1EAF6]" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-[#F5F1F8]" />
          </div>
          <div className="h-5 w-3/4 animate-pulse rounded-lg bg-[#F5F1F8]" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-[#F5F1F8]" />
          <div className="h-4 w-2/3 animate-pulse rounded-lg bg-[#F5F1F8]" />
        </div>
        <div className="hidden w-56 animate-pulse rounded-[18px] bg-[#F1EAF6] lg:block" />
      </div>
    </div>
  );
}

export default function MyTopicsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) { router.replace('/lawyerlogin'); return; }
        setUser(data.user);
        fetch(`/api/discussions?authorId=${data.user.id}&limit=50&sort=latest`)
          .then((r) => r.json())
          .then((payload) => setDiscussions(payload.data ?? []))
          .catch(() => setDiscussions([]))
          .finally(() => setLoading(false));
      })
      .catch(() => router.replace('/lawyerlogin'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/lawyerlogin');
  }

  const totalViews = discussions.reduce((s, d) => s + d.viewCount, 0);
  const totalAnswers = discussions.reduce((s, d) => s + d.answerCount, 0);
  const resolvedCount = discussions.filter((d) => d.status === 'RESOLVED').length;

  return (
    <div className="legal-workspace-shell">
      <LawyerTopbar activeTab="topics" user={user} onLogout={handleLogout} />

      <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 lg:px-8 lh-page-enter">

        {/* ── Header ── */}
        <div className="mb-8 rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6 shadow-[0_12px_32px_rgba(76,47,94,0.06)] lh-page-enter lh-delay-1">
          <AnimatedLink
            href="/discussions"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] shadow-sm transition hover:bg-[#F7F3FA]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to discussions
          </AnimatedLink>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#4C2F5E]">
                  <Hash className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Owned threads</p>
                  <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B] md:text-3xl">
                    My Discussions
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#736683]">
                Revisit questions you started, track community engagement, and follow up on unanswered legal topics.
              </p>
            </div>

            <button
              onClick={() => navigateWithTransition(router, '/discussions')}
              className="inline-flex shrink-0 items-center gap-2 rounded-[16px] bg-[#4C2F5E] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(76,47,94,0.22)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New discussion
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!loading && discussions.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Topics started', value: discussions.length, gradient: true },
              { label: 'Total answers', value: totalAnswers, gradient: false },
              { label: 'Total views', value: totalViews.toLocaleString(), gradient: false },
              { label: 'Resolved', value: resolvedCount, gradient: false },
            ].map(({ label, value, gradient }) => (
              <div
                key={label}
                className={`rounded-[20px] border p-5 ${
                  gradient
                    ? 'border-[#4C2F5E]/20 bg-[linear-gradient(135deg,#4C2F5E_0%,#7B58A0_100%)] text-white'
                    : 'border-[#4C2F5E]/10 bg-white text-[#2F1D3B]'
                }`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${gradient ? 'text-white/70' : 'text-[#8B7D99]'}`}>
                  {label}
                </p>
                <p className={`mt-2 text-2xl font-semibold ${gradient ? 'text-white' : 'text-[#4C2F5E]'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── List ── */}
        <section className="lh-page-enter lh-delay-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : discussions.length === 0 ? (
            <div className="flex flex-col items-center rounded-[28px] border border-[#4C2F5E]/10 bg-white px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1EAF6]">
                <MessagesSquare className="h-7 w-7 text-[#4C2F5E]" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[#2F1D3B]">No discussions started yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#736683]">
                Start a new topic to gather perspectives from verified lawyers and the broader legal community.
              </p>
              <button
                onClick={() => navigateWithTransition(router, '/discussions')}
                className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-[#4C2F5E] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Start your first topic
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {discussions.map((d, index) => (
                <article
                  key={d.id}
                  className="group overflow-hidden rounded-[24px] border border-[#4C2F5E]/10 bg-white transition hover:border-[#4C2F5E]/20 hover:shadow-[0_12px_36px_rgba(76,47,94,0.10)]"
                >
                  <div className="flex flex-col gap-0 lg:flex-row">
                    {/* Left: rank accent */}
                    <div className="flex w-full items-stretch lg:w-auto">
                      <div
                        className="flex w-12 shrink-0 items-center justify-center rounded-l-[24px] text-sm font-semibold text-white lg:rounded-r-none"
                        style={{
                          background: index === 0
                            ? 'linear-gradient(180deg,#4C2F5E 0%,#7B58A0 100%)'
                            : 'linear-gradient(180deg,#6F5484 0%,#9B7FC0 100%)',
                        }}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 p-5 lg:p-6">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#4C2F5E] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                            {d.category.name}
                          </span>
                          {d.region && (
                            <span className="rounded-full border border-[#4C2F5E]/12 bg-[#F7F3FA] px-3 py-1 text-[11px] font-semibold text-[#6B5C79]">
                              {d.region.name}
                            </span>
                          )}
                          {d.isAiSummaryReady && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#4C2F5E]/15 bg-[#F1EAF6] px-3 py-1 text-[11px] font-semibold text-[#4C2F5E]">
                              <Sparkles className="h-3 w-3" />
                              AI summary
                            </span>
                          )}
                          {d.status === 'RESOLVED' && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                              Resolved
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <AnimatedLink href={`/discussions/${d.slug}`} className="mt-3 block">
                          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B] transition group-hover:text-[#4C2F5E]">
                            {d.title}
                          </h2>
                        </AnimatedLink>

                        {d.excerpt && (
                          <p className="mt-2 line-clamp-2 text-sm leading-7 text-[#736683]">{d.excerpt}</p>
                        )}

                        {/* Tags */}
                        {d.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {d.tags.slice(0, 4).map((t) => (
                              <span
                                key={t.tag.id}
                                className="rounded-full border border-[#4C2F5E]/8 bg-[#F8F6FB] px-2.5 py-1 text-[11px] font-medium text-[#6B5C79]"
                              >
                                {t.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: meta panel */}
                    <div className="flex shrink-0 flex-col gap-4 border-t border-[#4C2F5E]/8 p-5 lg:w-56 lg:border-l lg:border-t-0">
                      {/* Author */}
                      <div className="flex items-center gap-3">
                        {d.author.avatarUrl ? (
                          <img src={d.author.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover border border-[#4C2F5E]/10" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                            {initials(d.author.displayName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#4C2F5E]">
                            {d.author.displayName ?? 'Anonymous'}
                          </p>
                          <p className="text-[11px] text-[#8B7D99]">{timeAgo(d.createdAt)}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[14px] border border-[#4C2F5E]/8 bg-[#F8F6FB] px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B7D99]">Answers</p>
                          <p className="mt-1 text-lg font-semibold text-[#4C2F5E]">{d.answerCount}</p>
                        </div>
                        <div className="rounded-[14px] border border-[#4C2F5E]/8 bg-[#F8F6FB] px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B7D99]">Views</p>
                          <div className="mt-1 flex items-center gap-1 text-lg font-semibold text-[#4C2F5E]">
                            <Eye className="h-3.5 w-3.5 text-[#8B7D99]" />
                            {d.viewCount}
                          </div>
                        </div>
                      </div>

                      <AnimatedLink
                        href={`/discussions/${d.slug}`}
                        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#4C2F5E]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
                      >
                        Open discussion
                      </AnimatedLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Footer CTA ── */}
        {!loading && discussions.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[24px] border border-[#4C2F5E]/15 bg-[linear-gradient(135deg,#4C2F5E_0%,#6F5484_100%)] px-6 py-5 text-white sm:flex-row lh-page-enter lh-delay-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-white/70" />
              <p className="text-sm leading-6 text-white/80">
                Consistent contributions improve your visibility in the community leaderboard.
              </p>
            </div>
            <AnimatedLink
              href="/saved"
              className="shrink-0 rounded-[14px] border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Review saved items
            </AnimatedLink>
          </div>
        )}
      </div>
    </div>
  );
}
