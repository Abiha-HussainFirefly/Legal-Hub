import { CaseSourceBadge, CaseStatusBadge, CaseVisibilityBadge } from "@/app/components/cases/case-badges";
import CaseCitationList from "@/app/components/cases/case-citation-list";
import CaseEmptyState from "@/app/components/cases/case-empty-state";
import CasePageHero from "@/app/components/cases/case-page-hero";
import { adminCaseReviewAction } from "@/app/actions/admin-review";
import { findCaseRecordBySlug } from "@/lib/services/case-repository.server";
import {
  CheckCheck,
  FileSearch,
  Flag,
  GitCompareArrows,
  Landmark,
  MessageSquareText,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "Undated";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function CaseReviewDetailContent({ record }: { record: NonNullable<Awaited<ReturnType<typeof findCaseRecordBySlug>>> }) {
  return (
    <div className="space-y-6">
      <CasePageHero
        kicker="Review detail"
        title={record.title}
        description={record.summary}
        badges={
          <>
            <CaseStatusBadge status={record.status} />
            <CaseVisibilityBadge visibility={record.visibility} />
            <CaseSourceBadge sourceType={record.sourceType} />
          </>
        }
        aside={
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/68">{record.canonicalCitation}</p>
            <p className="text-lg font-semibold text-white">{record.trustLabel}</p>
            <p className="text-sm leading-7 text-white/80">
              Contributor: {record.author.displayName}
              {record.organization?.name ? ` / ${record.organization.name}` : ""}
            </p>
            <div className="grid gap-3">
              {[
                ["Court", record.court?.name ?? "Repository"],
                ["Region", record.region?.name ?? "Cross-jurisdictional"],
                ["Decision date", formatDate(record.decisionDate)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62">{label}</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        }
        metrics={[
          { label: "Open reports", value: `${record.moderation.openReports}`, icon: Flag },
          { label: "AI alerts", value: `${record.moderation.aiAlerts}`, icon: FileSearch },
          { label: "Revision count", value: `${record.revisions.length}`, icon: GitCompareArrows },
          { label: "Source links", value: `${record.sourceLinks.length}`, icon: ShieldCheck },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">
                  Structured content review
                </p>
                <h2 className="text-xl font-semibold text-[#2F1D3B]">Legal narrative</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Facts", record.facts],
                ["Issues", record.issues],
                ["Holding", record.holding],
                ["Outcome", record.outcome],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
                  <p className="text-sm font-semibold text-[#2F1D3B]">{label}</p>
                  <p className="mt-3 text-sm leading-8 text-[#706181]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <GitCompareArrows className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Revision comparison</p>
                <h2 className="text-xl font-semibold text-[#2F1D3B]">Latest revision trail</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {record.revisions.map((revision) => (
                <div key={revision.id} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#2F1D3B]">Version {revision.version}</p>
                    <CaseStatusBadge status={revision.status} />
                  </div>
                  <p className="mt-3 text-sm leading-8 text-[#706181]">{revision.changeSummary}</p>
                  <p className="mt-2 text-xs text-[#8C7A9B]">
                    {revision.editor.displayName} / {formatDate(revision.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <CaseCitationList
            title="Citation network"
            kicker="Reviewer verification"
            citations={[...record.citationsMade, ...record.citationsReceived]}
          />
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <FileSearch className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Source audit</p>
                <h2 className="text-lg font-semibold text-[#2F1D3B]">{record.trustLabel}</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {record.sourceLinks.map((source) => (
                <div key={source.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <p className="text-sm font-semibold text-[#2F1D3B]">{source.label}</p>
                  <p className="mt-2 text-xs text-[#706181]">{source.sourceName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Reviewer notes</p>
                <h2 className="text-lg font-semibold text-[#2F1D3B]">Decision rationale</h2>
              </div>
            </div>
            <form action={adminCaseReviewAction} className="mt-4">
              <input type="hidden" name="slug" value={record.slug} />
              <textarea
                className="legal-field h-40 resize-none"
                name="reviewNote"
                defaultValue={record.moderation.lastReviewerNote ?? ""}
                placeholder="Document the review rationale, rejection reason, or reviewer note."
              />
              <div className="mt-4 grid gap-3">
                {record.status === "PENDING_REVIEW" ? (
                  <>
                    <button className="legal-button-primary w-full text-sm" type="submit" name="intent" value="publish">
                      <CheckCheck className="h-4 w-4" />
                      Publish case
                    </button>
                    <button className="legal-button-secondary w-full text-sm" type="submit" name="intent" value="reject">
                      <XCircle className="h-4 w-4" />
                      Reject and request changes
                    </button>
                  </>
                ) : null}

                {(record.status === "PUBLISHED" || record.status === "REJECTED") ? (
                  <button className="legal-button-secondary w-full text-sm" type="submit" name="intent" value="archive">
                    <Flag className="h-4 w-4" />
                    Archive case
                  </button>
                ) : null}

                {(record.status === "ARCHIVED" || record.status === "REMOVED") ? (
                  <button className="legal-button-secondary w-full text-sm" type="submit" name="intent" value="restore">
                    <ShieldCheck className="h-4 w-4" />
                    Restore case
                  </button>
                ) : null}

                <button className="legal-button-secondary w-full text-sm" type="submit" name="intent" value="save_note">
                  <Send className="h-4 w-4" />
                  Save reviewer note
                </button>
              </div>
            </form>
            <p className="mt-3 text-xs text-[#706181]">
              Publish and reject now update authoritative case workflow state, audit logs, notifications, and reviewer notes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default async function CaseReviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await findCaseRecordBySlug(slug);

  if (!record) {
    return (
      <CaseEmptyState
        icon={FileSearch}
        title="Review record not found"
        description="The requested repository item is not available in the reviewer workspace."
      />
    );
  }

  return <CaseReviewDetailContent record={record} />;
}
