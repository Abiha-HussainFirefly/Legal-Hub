'use client';

import { CaseSourceBadge, CaseStatusBadge, CaseVisibilityBadge } from '@/app/components/cases/case-badges';
import CaseUserLink from '@/app/components/cases/case-user-link';
import { useToast } from '@/app/components/ui/toast/toast-context';
import type { CaseRepositoryRecord } from '@/types/case';
import { ArrowUpRight, Bookmark, CalendarDays, Eye, MessageSquareText, Scale, Share2, Sparkles, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

function formatDate(value?: string | null) {
  if (!value) return 'Undated';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'LH';
}

export default function CaseResultCard({
  item,
  compact = false,
}: {
  item: CaseRepositoryRecord;
  compact?: boolean;
}) {
  const { addToast } = useToast();
  const [saved, setSaved] = useState(item.viewerState.saved);
  const [followed, setFollowed] = useState(item.viewerState.followed);
  const [reaction, setReaction] = useState(item.viewerState.reaction);
  const [saving, setSaving] = useState(false);

  const quickStats = useMemo(
    () => [
      { icon: Eye, label: 'Views', value: item.counts.views.toLocaleString() },
      { icon: MessageSquareText, label: 'Comments', value: `${item.counts.comments}` },
      { icon: Users, label: 'Follows', value: `${item.counts.follows}` },
    ],
    [item.counts.comments, item.counts.follows, item.counts.views],
  );

  async function handleToggleSave() {
    if (saving) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/cases/${item.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-save' }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update saved state.');
      }

      const nextSaved = Boolean(payload.data?.viewerState?.saved);
      setSaved(nextSaved);
      addToast('success', nextSaved ? 'Case saved' : 'Case removed', nextSaved ? 'The case was added to your saved collection.' : 'The case was removed from your saved collection.');
    } catch (error) {
      addToast('error', 'Save failed', error instanceof Error ? error.message : 'Unable to update the saved state.');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const url = typeof window === 'undefined' ? '' : `${window.location.origin}/cases/${item.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }

      addToast('success', 'Link ready', 'The case link is ready to share.');
    } catch (error) {
      addToast('error', 'Share failed', error instanceof Error ? error.message : 'Unable to share this case right now.');
    }
  }

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#4C2F5E]/10 bg-[linear-gradient(180deg,#ffffff_0%,#fdfbfe_100%)] shadow-[0_10px_26px_rgba(76,47,94,0.05)] transition hover:-translate-y-0.5 hover:border-[#4C2F5E]/18 hover:shadow-[0_18px_36px_rgba(76,47,94,0.08)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={item.status} />
            <CaseVisibilityBadge visibility={item.visibility} />
            <CaseSourceBadge sourceType={item.sourceType} />
            {item.author.isVerifiedLawyer ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Verified lawyer
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{item.canonicalCitation}</p>
              <Link href={`/cases/${item.slug}`} className="mt-2 block text-xl font-semibold tracking-[-0.04em] text-[#2F1D3B] transition hover:text-[#4C2F5E] md:text-[1.7rem]">
                {item.title}
              </Link>
            </div>

            <p className="max-w-3xl text-sm leading-7 text-[#6F5E7F]">{item.summary}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#4C2F5E] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
              {item.category.name}
            </span>
            {item.tags.map((tag) => (
              <span key={tag.id} className="rounded-full border border-[#4C2F5E]/10 bg-[#F7F3FA] px-3 py-1 text-[11px] font-semibold text-[#5F506D]">
                {tag.name}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 rounded-[22px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Court</p>
              <p className="text-sm font-semibold text-[#332043]">{item.court?.name ?? 'Not assigned'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Region</p>
              <p className="text-sm font-semibold text-[#332043]">{item.region?.name ?? 'Cross-jurisdictional'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Decision date</p>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#332043]">
                <CalendarDays className="h-4 w-4 text-[#7D6A8F]" />
                {formatDate(item.decisionDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Trust signal</p>
              <p className="text-sm font-semibold text-[#332043]">{item.trustLabel}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {quickStats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-[#FBF9FD] px-3 py-2 text-xs font-semibold text-[#5E4F6E]">
                <Icon className="h-3.5 w-3.5 text-[#4C2F5E]" />
                <span>{label}</span>
                <span className="text-[#2F1D3B]">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                saved
                  ? 'border-[#4C2F5E] bg-[#4C2F5E] text-white'
                  : 'border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#F7F3FA]'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setFollowed((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                followed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#F7F3FA]'
              }`}
            >
              <Users className="h-4 w-4" />
              {followed ? 'Following' : 'Follow'}
            </button>
            <button
              type="button"
              onClick={() => setReaction((value) => (value === 'HELPFUL' ? null : 'HELPFUL'))}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                reaction === 'HELPFUL'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#F7F3FA]'
              }`}
            >
              <Star className="h-4 w-4" />
              Helpful
            </button>
            <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        <aside className={`border-t border-[#4C2F5E]/10 bg-[linear-gradient(180deg,#fbf9fd_0%,#f7f2fa_100%)] p-5 lg:border-l lg:border-t-0 ${compact ? 'lg:w-[250px]' : ''}`}>
          <div className="rounded-[22px] border border-[#4C2F5E]/10 bg-[linear-gradient(135deg,#4C2F5E_0%,#72538f_100%)] p-4 text-white shadow-[0_14px_28px_rgba(76,47,94,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Provenance</p>
            <p className="mt-2 text-base font-semibold text-white">{item.provenanceLabel}</p>
            <CaseUserLink user={item.author} className="mt-3 flex items-center gap-3 rounded-[18px] border border-white/12 bg-white/10 p-3 transition hover:bg-white/14">
              {item.author.avatarUrl ? (
                <img
                  src={item.author.avatarUrl}
                  alt={item.author.displayName}
                  className="h-11 w-11 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-xs font-semibold text-white">
                  {initials(item.author.displayName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.author.displayName}</p>
                <p className="mt-1 text-xs text-white/75">
                  {item.organization?.name ?? item.author.organizationName ?? 'Legal Hub contributor'}
                </p>
              </div>
            </CaseUserLink>
          </div>

          <div className="mt-4 rounded-[22px] border border-[#4C2F5E]/10 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Repository links</p>
            <p className="mt-2 text-sm leading-6 text-[#6F5E7F]">
              {item.counts.outboundCitations + item.counts.inboundCitations} connected citations and discussion-aware repository context.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[#7E6F8D]">
              <Scale className="h-3.5 w-3.5 text-[#4C2F5E]" />
              {item.counts.outboundCitations + item.counts.inboundCitations} connected citations
            </p>
          </div>

          <Link
            href={`/cases/${item.slug}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4C2F5E] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open case record
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </article>
  );
}
