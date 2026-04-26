'use client';

import { CaseSourceBadge, CaseStatusBadge, CaseVisibilityBadge } from '@/app/components/cases/case-badges';
import CaseUserLink from '@/app/components/cases/case-user-link';
import AnimatedLink from '@/app/components/ui/animated-link';
import { useToast } from '@/app/components/ui/toast/toast-context';
import { apiRequest } from '@/lib/api-client';
import type { CaseRepositoryRecord } from '@/types/case';
import { ArrowUpRight, Bookmark, CalendarDays, Eye, MessageSquareText, Scale, Share2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function formatDate(value?: string | null) {
  if (!value) return 'Undated';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
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

export default function CaseResultCard({
  item,
  compact = false,
}: {
  item: CaseRepositoryRecord;
  compact?: boolean;
}) {
  const { addToast } = useToast();
  const [saved, setSaved] = useState(item.viewerState.saved);
  const [saving, setSaving] = useState(false);
  const [actionPulse, setActionPulse] = useState<'save' | 'share' | null>(null);

  const stats = useMemo(
    () => [
      { icon: Eye, label: 'Views', value: item.counts.views.toLocaleString() },
      { icon: MessageSquareText, label: 'Comments', value: `${item.counts.comments}` },
      { icon: Users, label: 'Follows', value: `${item.counts.follows}` },
      { icon: Scale, label: 'Citations', value: `${item.counts.outboundCitations + item.counts.inboundCitations}` },
    ],
    [item.counts.comments, item.counts.follows, item.counts.inboundCitations, item.counts.outboundCitations, item.counts.views],
  );

  useEffect(() => {
    if (!actionPulse) return;
    const timeout = window.setTimeout(() => setActionPulse(null), 320);
    return () => window.clearTimeout(timeout);
  }, [actionPulse]);

  async function handleToggleSave() {
    if (saving) return;

    try {
      setSaving(true);

      const payload = await apiRequest<{ data?: { viewerState?: { saved?: boolean } } }>(`/api/cases/${item.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-save' }),
      });

      const nextSaved = Boolean(payload.data?.viewerState?.saved);
      setSaved(nextSaved);
      setActionPulse('save');
      addToast(
        'success',
        nextSaved ? 'Case saved' : 'Case removed',
        nextSaved ? 'The case was added to your saved list.' : 'The case was removed from your saved list.',
      );
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

      setActionPulse('share');
      addToast('success', 'Link ready', 'The case link is ready to share.');
    } catch (error) {
      addToast('error', 'Share failed', error instanceof Error ? error.message : 'Unable to share this case right now.');
    }
  }

  return (
    <article className={`workspace-list-card lh-surface-lift overflow-hidden ${compact ? 'h-full' : ''}`}>
      <div className="flex h-full flex-col gap-4 border-l-[3px] p-4 sm:p-5" style={{ borderLeftColor: '#4C2F5E' }}>
        <div className="flex flex-wrap items-center gap-2">
          <CaseStatusBadge status={item.status} />
          <CaseVisibilityBadge visibility={item.visibility} />
          <CaseSourceBadge sourceType={item.sourceType} />
          {item.author.isVerifiedLawyer ? (
            <span className="workspace-pill border-emerald-200 bg-emerald-50 text-emerald-700">Verified lawyer</span>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">{item.canonicalCitation}</p>
          <AnimatedLink
            href={`/cases/${item.slug}`}
            className="mt-2 block text-[1.08rem] font-semibold leading-7 tracking-[-0.03em] text-[#2F1D3B] transition hover:text-[#4C2F5E]"
          >
            {item.title}
          </AnimatedLink>
          <p className="mt-2 text-sm leading-6 text-[#736683]">{item.summary}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="workspace-pill bg-[#4C2F5E] text-white">{item.category.name}</span>
          {item.tags.slice(0, compact ? 2 : 4).map((tag) => (
            <span key={tag.id} className="rounded-full border border-[#4C2F5E]/8 bg-[#F8F6FB] px-2.5 py-1 text-[11px] font-medium text-[#6B5C79]">
              #{tag.name}
            </span>
          ))}
        </div>

        <div className="grid gap-3 rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Court</p>
            <p className="mt-1 text-sm font-semibold text-[#2F1D3B]">{item.court?.name ?? 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Region</p>
            <p className="mt-1 text-sm font-semibold text-[#2F1D3B]">{item.region?.name ?? 'Cross-jurisdictional'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Decision date</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#2F1D3B]">
              <CalendarDays className="h-4 w-4 text-[#8B7D99]" />
              {formatDate(item.decisionDate)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Trust signal</p>
            <p className="mt-1 text-sm font-semibold text-[#2F1D3B]">{item.trustLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="inline-flex items-center gap-1.5 rounded-full border border-[#4C2F5E]/8 bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5C79]">
              <Icon className="h-3.5 w-3.5 text-[#4C2F5E]" />
              <span>{label}</span>
              <span className="text-[#2F1D3B]">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-[#4C2F5E]/8 pt-4 md:flex-row md:items-center md:justify-between">
          <CaseUserLink user={item.author} className="flex min-w-0 items-center gap-3">
            {item.author.avatarUrl ? (
              <img
                src={item.author.avatarUrl}
                alt={item.author.displayName}
                className="h-10 w-10 rounded-full border border-[#4C2F5E]/8 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                {initials(item.author.displayName)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#2F1D3B]">{item.author.displayName}</p>
              <p className="truncate text-xs text-[#8B7D99]">
                {item.organization?.name ?? item.author.organizationName ?? item.provenanceLabel}
              </p>
            </div>
          </CaseUserLink>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                saved
                  ? 'border-[#4C2F5E]/14 bg-[#F1EAF6] text-[#4C2F5E]'
                  : 'border-[#4C2F5E]/8 bg-white text-[#6B5C79] hover:bg-[#F8F6FB]'
              } ${actionPulse === 'save' ? 'lh-action-bump lh-action-flash' : ''}`}
            >
              <Bookmark className="h-4 w-4" />
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={`inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/8 bg-white px-4 py-2 text-sm font-semibold text-[#6B5C79] transition hover:bg-[#F8F6FB] ${
                actionPulse === 'share' ? 'lh-action-bump lh-action-flash' : ''
              }`}
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <AnimatedLink
              href={`/cases/${item.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E] bg-[#4C2F5E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#432853]"
            >
              Open record
              <ArrowUpRight className="h-4 w-4" />
            </AnimatedLink>
          </div>
        </div>
      </div>
    </article>
  );
}
