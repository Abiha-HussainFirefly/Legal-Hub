'use client';

import { CaseSourceBadge, CaseStatusBadge, CaseVisibilityBadge } from '@/app/components/cases/case-badges';
import CaseCitationList from '@/app/components/cases/case-citation-list';
import CaseCommentThread from '@/app/components/cases/case-comment-thread';
import CaseEmptyState from '@/app/components/cases/case-empty-state';
import CasePageHero from '@/app/components/cases/case-page-hero';
import CaseUserLink from '@/app/components/cases/case-user-link';
import { useCaseWorkspace } from '@/app/components/cases/case-workspace';
import { useToast } from '@/app/components/ui/toast/toast-context';
import type { CaseRepositoryRecord } from '@/types/case';
import { BadgeCheck, Bookmark, ChevronRight, Eye, FileSearch, GitBranch, Landmark, Link2, MessageSquareText, PencilLine, Send, Share2, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function formatDate(value?: string | null) {
  if (!value) return 'Undated';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'LH';
}

function DetailSection({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#4C2F5E]/10 bg-white shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
      <div className="border-b border-[#4C2F5E]/8 bg-[#FBF9FD] px-5 py-4 md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{kicker}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
      </div>
      <div className="px-5 py-5 text-sm leading-8 text-[#655773] md:px-6 md:py-6">{children}</div>
    </section>
  );
}

export default function CaseDetailPage() {
  const { user } = useCaseWorkspace();
  const { addToast } = useToast();
  const params = useParams<{ slug: string }>();
  const [record, setRecord] = useState<CaseRepositoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [savePending, setSavePending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);

  const loadRecord = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cases/${params.slug}`);
      const payload = (await response.json()) as { data?: CaseRepositoryRecord; error?: string };

      if (!response.ok) {
        if (response.status === 404) {
          setRecord(null);
          return;
        }
        throw new Error(payload.error || 'Failed to load case.');
      }

      setRecord(payload.data ?? null);
    } catch (error) {
      setRecord(null);
      addToast('error', 'Case unavailable', error instanceof Error ? error.message : 'Unable to load this case.');
    } finally {
      setLoading(false);
    }
  }, [addToast, params.slug]);

  useEffect(() => {
    void loadRecord();
  }, [loadRecord]);

  async function handleToggleSave() {
    if (!record || savePending) return;

    try {
      setSavePending(true);
      const response = await fetch(`/api/cases/${record.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-save' }),
      });
      const payload = (await response.json()) as { data?: CaseRepositoryRecord; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update the saved state.');
      }

      setRecord(payload.data ?? record);
      const nextSaved = Boolean(payload.data?.viewerState.saved);
      addToast('success', nextSaved ? 'Case saved' : 'Case removed', nextSaved ? 'The case was added to your saved collection.' : 'The case was removed from your saved collection.');
    } catch (error) {
      addToast('error', 'Save failed', error instanceof Error ? error.message : 'Unable to update the saved state.');
    } finally {
      setSavePending(false);
    }
  }

  async function handleSubmitForReview() {
    if (!record || submitPending) return;

    try {
      setSubmitPending(true);
      const response = await fetch(`/api/cases/${record.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-for-review' }),
      });
      const payload = (await response.json()) as { data?: CaseRepositoryRecord; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to submit the case for review.');
      }

      setRecord(payload.data ?? record);
      addToast('success', 'Submitted for review', 'The case is now in the review queue.');
    } catch (error) {
      addToast('error', 'Submission failed', error instanceof Error ? error.message : 'Unable to submit the case for review.');
    } finally {
      setSubmitPending(false);
    }
  }

  async function handleShare() {
    if (!record) return;

    const url = typeof window === 'undefined' ? '' : `${window.location.origin}/cases/${record.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: record.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }

      addToast('success', 'Link ready', 'The case link is ready to share.');
    } catch (error) {
      addToast('error', 'Share failed', error instanceof Error ? error.message : 'Unable to share this case right now.');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[980px] px-4 py-12 md:px-6 lg:px-8">
        <CaseEmptyState
          icon={FileSearch}
          title="Loading case record..."
          description="Repository metadata, provenance, and commentary are being prepared."
        />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-[980px] px-4 py-12 md:px-6 lg:px-8">
        <CaseEmptyState
          icon={FileSearch}
          title="Case record not found"
          description="The repository entry may have been moved, archived, or is not available to the current viewer."
          action={<Link href="/cases" className="legal-button-primary text-sm">Back to repository</Link>}
        />
      </div>
    );
  }

  const isAuthor = user?.id === record.author.id;
  const isReviewer = user?.roles?.some((role) => ['ADMIN', 'REVIEWER'].includes(role)) ?? false;
  const canEdit = isAuthor || isReviewer;
  const canSubmitForReview = isAuthor && ['DRAFT', 'REJECTED'].includes(record.status);
  const breadcrumbItems = [
    { label: 'Cases', href: '/cases' },
    ...(record.category?.name ? [{ label: record.category.name, href: `/cases?category=${encodeURIComponent(record.category.name)}` }] : []),
    { label: record.title, href: null as string | null },
  ];

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 md:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => {
            const isCurrent = index === breadcrumbItems.length - 1;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <ChevronRight className="h-4 w-4 text-[#A294B1]" /> : null}
                {item.href && !isCurrent ? (
                  <Link
                    href={item.href}
                    className="font-medium text-[#7C6B8E] transition hover:text-[#4C2F5E]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isCurrent ? 'font-semibold text-[#2F1D3B]' : 'font-medium text-[#7C6B8E]'}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <CasePageHero
        kicker="Case record"
        title={record.title}
        description={record.summary}
        badges={
          <>
            <CaseStatusBadge status={record.status} />
            <CaseVisibilityBadge visibility={record.visibility} />
            <CaseSourceBadge sourceType={record.sourceType} />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/88">
              <Landmark className="h-3.5 w-3.5" />
              {record.court?.name ?? 'Repository record'}
            </span>
            {record.author.isVerifiedLawyer ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/88">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified lawyer
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={savePending}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                record.viewerState.saved ? 'bg-white text-[#4C2F5E]' : 'border border-white/15 bg-white/10 text-white hover:bg-white/14'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              {savePending ? 'Saving...' : record.viewerState.saved ? 'Saved' : 'Save case'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </>
        }
        aside={
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/68">{record.canonicalCitation}</p>
              <p className="mt-3 text-lg font-semibold text-white">{record.provenanceLabel}</p>
              <CaseUserLink user={record.author} className="mt-4 flex items-center gap-3 rounded-[20px] border border-white/12 bg-white/10 p-3 transition hover:bg-white/14">
                {record.author.avatarUrl ? (
                  <img
                    src={record.author.avatarUrl}
                    alt={record.author.displayName}
                    className="h-12 w-12 rounded-full border border-white/15 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white">
                    {initials(record.author.displayName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{record.author.displayName}</p>
                  <p className="mt-1 text-xs text-white/75">
                    {record.organization?.name ?? record.author.organizationName ?? 'Legal Hub contributor'}
                  </p>
                </div>
              </CaseUserLink>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                ['Decision date', formatDate(record.decisionDate)],
                ['Region', record.region?.name ?? 'Cross-jurisdictional'],
                ['Trust signal', record.trustLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62">{label}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-7 text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {canEdit ? (
                <Link href={`/cases/${record.slug}/edit`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#4C2F5E]">
                  <PencilLine className="h-4 w-4" />
                  Edit record
                </Link>
              ) : null}
              {canSubmitForReview ? (
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={submitPending}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Send className="h-4 w-4" />
                  {submitPending ? 'Submitting...' : 'Submit for review'}
                </button>
              ) : null}
            </div>
          </div>
        }
        metrics={[
          { label: 'Views', value: record.counts.views.toLocaleString(), icon: Eye, detail: 'Research traffic across repository views.' },
          { label: 'Comments', value: `${record.counts.comments}`, icon: MessageSquareText, detail: 'Structured commentary linked to the record.' },
          { label: 'Followers', value: `${record.counts.follows}`, icon: Users, detail: 'Members monitoring updates or review outcomes.' },
          { label: 'Connected citations', value: `${record.counts.outboundCitations + record.counts.inboundCitations}`, icon: GitBranch, detail: 'Inbound and outbound citation relationships.' },
        ]}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <DetailSection kicker="Overview" title="Repository summary">
            {record.summary}
          </DetailSection>
          <DetailSection kicker="Overview" title="Facts">
            {record.facts}
          </DetailSection>
          <div className="grid gap-6 xl:grid-cols-2">
            <DetailSection kicker="Core question" title="Issues">
              {record.issues}
            </DetailSection>
            <DetailSection kicker="Judicial answer" title="Holding">
              {record.holding}
            </DetailSection>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <DetailSection kicker="Disposition" title="Outcome">
              {record.outcome}
            </DetailSection>
            <DetailSection kicker="Court path" title="Procedural history">
              {record.proceduralHistory}
            </DetailSection>
          </div>
          <DetailSection kicker="Record timeline" title="Key filing and publication dates">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Filed date', formatDate(record.filedDate)],
                ['Decision date', formatDate(record.decisionDate)],
                ['Published at', formatDate(record.publishedAt)],
                ['Reviewed at', formatDate(record.reviewedAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{value}</p>
                </div>
              ))}
            </div>
          </DetailSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <CaseCitationList title="Cases cited by this record" kicker="Outbound citations" citations={record.citationsMade} />
            <CaseCitationList title="Cases citing this record" kicker="Inbound citations" citations={record.citationsReceived} />
          </div>

          <CaseCommentThread comments={record.comments} />
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <FileSearch className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Source provenance</p>
                <h2 className="text-lg font-semibold text-[#2F1D3B]">{record.trustLabel}</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {record.sourceLinks.length ? (
                record.sourceLinks.map((source) => (
                  <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{source.sourceName}</p>
                    <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{source.label}</p>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs text-[#706181]">
                      <Link2 className="h-3.5 w-3.5" />
                      Open source link
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-6 text-sm text-[#706181]">
                  No source links attached yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Record metadata</p>
            <div className="mt-4 grid gap-3">
              {[
                ['Category', record.category.name],
                ['Docket number', record.docketNumber ?? 'Not added'],
                ['Source type', record.sourceType.replaceAll('_', ' ')],
                ['Visibility', record.visibility],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Source files</p>
            <div className="mt-4 space-y-3">
              {record.sourceFiles.length ? (
                record.sourceFiles.map((file) => (
                  <div key={file.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-sm font-semibold text-[#2F1D3B]">{file.label}</p>
                    <p className="mt-2 text-xs text-[#706181]">{file.filename} / {file.fileSizeLabel}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-6 text-sm text-[#706181]">
                  No source files attached.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Revision history</p>
            <div className="mt-4 space-y-3">
              {record.revisions.length ? (
                record.revisions.map((revision) => (
                  <div key={revision.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#2F1D3B]">Version {revision.version}</p>
                      <CaseStatusBadge status={revision.status} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#6E5F7D]">{revision.changeSummary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#8C7A9B]">
                      <CaseUserLink user={revision.editor} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-white px-2.5 py-1 transition hover:bg-[#F7F3FA]">
                        {revision.editor.avatarUrl ? (
                          <img
                            src={revision.editor.avatarUrl}
                            alt={revision.editor.displayName}
                            className="h-6 w-6 rounded-full border border-[#4C2F5E]/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4C2F5E] text-[10px] font-semibold text-white">
                            {initials(revision.editor.displayName)}
                          </div>
                        )}
                        <span className="font-semibold text-[#4C2F5E]">{revision.editor.displayName}</span>
                      </CaseUserLink>
                      <span>{formatDate(revision.createdAt)}</span>
                      {revision.reviewedBy ? (
                        <CaseUserLink user={revision.reviewedBy} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-white px-2.5 py-1 transition hover:bg-[#F7F3FA]">
                          <span>Reviewed by {revision.reviewedBy.displayName}</span>
                        </CaseUserLink>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-6 text-sm text-[#706181]">
                  No revision history available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Related discussions</p>
            <div className="mt-4 space-y-3">
              {record.relatedDiscussions.length ? (
                record.relatedDiscussions.map((discussion) => (
                  <Link key={discussion.id} href={`/discussions/${discussion.slug}`} className="block rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 transition hover:bg-white">
                    <p className="text-sm font-semibold text-[#2F1D3B]">{discussion.title}</p>
                    <p className="mt-2 text-xs text-[#706181]">{discussion.answerCount} answers / Updated {formatDate(discussion.updatedAt)}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-6 text-sm text-[#706181]">
                  No discussion thread linked yet.
                </div>
              )}
            </div>
          </div>

          {(isReviewer || isAuthor) ? (
            <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Moderation & quality</p>
                  <h2 className="text-lg font-semibold text-[#2F1D3B]">Protected review signals</h2>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-white p-4">
                  <p className="text-sm font-semibold text-[#2F1D3B]">Open reports</p>
                  <p className="mt-2 text-2xl font-semibold text-[#2F1D3B]">{record.moderation.openReports}</p>
                </div>
                <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-white p-4">
                  <p className="text-sm font-semibold text-[#2F1D3B]">AI alerts</p>
                  <p className="mt-2 text-2xl font-semibold text-[#2F1D3B]">{record.moderation.aiAlerts}</p>
                  {record.moderation.lastReviewerNote ? (
                    <p className="mt-3 text-sm leading-7 text-[#706181]">{record.moderation.lastReviewerNote}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
