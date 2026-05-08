import {
  adminDiscussionAnswerAction,
  adminDiscussionCommentAction,
  adminDiscussionWorkflowAction,
} from "@/app/actions/admin-discussions";
import { getAdminDiscussionDetailData } from "@/lib/services/admin-discussions.server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bot, FileSearch, MessageSquareText, Pin, ShieldAlert, Sparkles } from "lucide-react";

function formatDateTime(value: Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function prettyText(value: string | null) {
  if (!value) return "Not available";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stateClasses(value: string) {
  if (value === "ACTIVE" || value === "OPEN" || value === "GENERATED") return "bg-[#E6F5EF] text-[#0E7A55]";
  if (value === "HIDDEN" || value === "REMOVED" || value === "FAILED" || value === "DELETED") {
    return "bg-[#FCE8E6] text-[#A33A31]";
  }
  return "bg-[#F6EBD6] text-[#8B642A]";
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-panel p-5 md:p-6">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function WorkflowForm({
  slug,
  discussionId,
  intent,
  label,
  placeholder,
  tone = "primary",
}: {
  slug: string;
  discussionId: string;
  intent: string;
  label: string;
  placeholder: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <form action={adminDiscussionWorkflowAction} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
      <input type="hidden" name="discussionId" value={discussionId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="intent" value={intent} />
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#2F1D3B]">{label}</p>
        <input name="reason" placeholder={placeholder} className="legal-field" required={intent !== "pin" && intent !== "unpin"} />
        <button type="submit" className={tone === "primary" ? "legal-button-primary w-full text-sm" : "legal-button-secondary w-full text-sm"}>
          {label}
        </button>
      </div>
    </form>
  );
}

export default async function DiscussionOpsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAdminDiscussionDetailData(slug);

  if (!data) {
    notFound();
  }

  const discussion = data.discussion;

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClasses(discussion.status)}`}>
                {prettyText(discussion.status)}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClasses(discussion.contentStatus)}`}>
                {prettyText(discussion.contentStatus)}
              </span>
              <span className="workspace-pill">{prettyText(discussion.kind)}</span>
              <span className="workspace-pill">{prettyText(discussion.visibility)}</span>
              {discussion.isPinned ? <span className="workspace-pill">Pinned</span> : null}
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">{discussion.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              {discussion.authorName} / {discussion.categoryName}
              {discussion.organizationName ? ` / ${discussion.organizationName}` : ""}
              {discussion.regionName ? ` / ${discussion.regionName}` : ""}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <div className="flex min-h-[104px] flex-col justify-between overflow-hidden rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Last Activity</p>
              <p className="mt-3 break-words text-sm font-semibold leading-6 text-[#2F1D3B]">
                {formatDateTime(discussion.lastActivityAt)}
              </p>
            </div>
            <div className="flex min-h-[104px] flex-col justify-between overflow-hidden rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Accepted Answer</p>
              <p className="mt-3 break-words text-sm font-semibold leading-6 text-[#2F1D3B]">
                {discussion.acceptedAnswerId ? "Accepted answer available" : "None"}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm leading-8 text-[#594a67]">{discussion.body}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel title="Thread Metadata">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Slug", value: discussion.slug },
                { label: "Created", value: formatDateTime(discussion.createdAt) },
                { label: "Updated", value: formatDateTime(discussion.updatedAt) },
                { label: "Resolved At", value: formatDateTime(discussion.resolvedAt) },
                { label: "Closed At", value: formatDateTime(discussion.closedAt) },
                { label: "Locked At", value: formatDateTime(discussion.lockedAt) },
                { label: "Related Case", value: discussion.relatedCaseTitle ?? "None" },
                { label: "Pinned Until", value: formatDateTime(discussion.pinnedUntil) },
                { label: "Score", value: `${discussion.score}` },
              ].map((item) => (
                <div key={item.label} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">{item.label}</p>
                  <p className="mt-2 text-sm text-[#2F1D3B]">{item.value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Engagement Panel">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              {[
                ["Answers", discussion.answerCount],
                ["Comments", discussion.commentCount],
                ["Followers", discussion.followerCount],
                ["Bookmarks", discussion.bookmarkCount],
                ["Views", discussion.viewCount],
                ["Reactions", discussion.reactionCount],
                ["Boosts", discussion.boostCount],
                ["Score", discussion.score],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">{label}</p>
                  <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Tags, Attachments, and AI Summaries">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-[#2F1D3B]">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.tags.length ? (
                    data.tags.map((tag) => (
                      <span key={tag.id} className="workspace-pill">
                        {tag.name} / {prettyText(tag.type)}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No tags linked.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#2F1D3B]">Attachments</p>
                <div className="mt-3 space-y-3">
                  {data.attachments.length ? (
                    data.attachments.map((attachment) => (
                      <div key={attachment.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClasses(attachment.scanStatus)}`}>
                            {prettyText(attachment.scanStatus)}
                          </span>
                          <span className="workspace-pill">{attachment.mimeType ?? "Unknown MIME"}</span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{attachment.fileName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {attachment.isPublic ? "Publicly reachable" : "Not publicly reachable"}
                        </p>
                        {attachment.caption ? <p className="mt-2 text-sm text-slate-600">{attachment.caption}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No attachments linked.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#4C2F5E]" />
                  <p className="text-sm font-semibold text-[#2F1D3B]">AI Summaries</p>
                </div>
                <div className="mt-3 space-y-3">
                  {data.summaries.length ? (
                    data.summaries.map((summary) => (
                      <div key={summary.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClasses(summary.status)}`}>
                            {prettyText(summary.status)}
                          </span>
                          {summary.isCurrent ? <span className="workspace-pill">Current</span> : null}
                          <span className="workspace-pill">Version {summary.version}</span>
                        </div>
                        {summary.mainIssue ? <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{summary.mainIssue}</p> : null}
                        <p className="mt-2 text-sm text-slate-600">{summary.summaryText ?? summary.errorMessage ?? "No summary body stored."}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {summary.modelName ?? "Unknown model"} / Generated {formatDateTime(summary.generatedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No AI summaries stored for this discussion.</p>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Answers">
            <div className="space-y-4">
              {data.answers.length ? (
                data.answers.map((answer) => (
                  <div key={answer.id} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClasses(answer.status)}`}>
                        {prettyText(answer.status)}
                      </span>
                      {answer.isAccepted ? <span className="workspace-pill">Accepted</span> : null}
                      {answer.isExpertAnswer ? <span className="workspace-pill">Expert</span> : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{answer.authorName}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{answer.body}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {answer.commentCount} comments / {answer.reactionCount} reactions / {answer.openReports} reports / {answer.openAlerts} alerts / {formatDateTime(answer.createdAt)}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <form action={adminDiscussionAnswerAction} className="space-y-2">
                        <input type="hidden" name="slug" value={discussion.slug} />
                        <input type="hidden" name="answerId" value={answer.id} />
                        <input type="hidden" name="intent" value="hide" />
                        <input name="reason" placeholder="Reason for hiding answer" className="legal-field" required />
                        <button type="submit" className="legal-button-secondary w-full text-sm">
                          Hide Answer
                        </button>
                      </form>

                      <form action={adminDiscussionAnswerAction} className="space-y-2">
                        <input type="hidden" name="slug" value={discussion.slug} />
                        <input type="hidden" name="answerId" value={answer.id} />
                        <input type="hidden" name="intent" value="restore" />
                        <input name="reason" placeholder="Reason for restoring answer" className="legal-field" required />
                        <button type="submit" className="legal-button-secondary w-full text-sm">
                          Restore Answer
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No answers linked to this discussion.</p>
              )}
            </div>
          </Panel>

          <Panel title="Comments">
            <div className="space-y-4">
              {data.comments.length ? (
                data.comments.map((comment) => (
                  <div key={comment.id} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateClasses(comment.status)}`}>
                        {prettyText(comment.status)}
                      </span>
                      <span className="workspace-pill">{prettyText(comment.parentType)}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{comment.authorName}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{comment.body}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {comment.reactionCount} reactions / {comment.openReports} reports / {comment.openAlerts} alerts / {formatDateTime(comment.createdAt)}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <form action={adminDiscussionCommentAction} className="space-y-2">
                        <input type="hidden" name="slug" value={discussion.slug} />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input type="hidden" name="intent" value="hide" />
                        <input name="reason" placeholder="Reason for hiding comment" className="legal-field" required />
                        <button type="submit" className="legal-button-secondary w-full text-sm">
                          Hide Comment
                        </button>
                      </form>

                      <form action={adminDiscussionCommentAction} className="space-y-2">
                        <input type="hidden" name="slug" value={discussion.slug} />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <input type="hidden" name="intent" value="restore" />
                        <input name="reason" placeholder="Reason for restoring comment" className="legal-field" required />
                        <button type="submit" className="legal-button-secondary w-full text-sm">
                          Restore Comment
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No comments linked to this discussion.</p>
              )}
            </div>
          </Panel>

          <Panel title="Revisions">
            <div className="space-y-3">
              {data.revisions.length ? (
                data.revisions.map((revision) => (
                  <div key={revision.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-sm font-semibold text-[#2F1D3B]">Version {revision.version}</p>
                    <p className="mt-2 text-sm text-slate-600">{revision.changeSummary ?? "No change summary stored."}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {revision.editor} / {formatDateTime(revision.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No revision history found.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Admin Controls" description="High-risk discussion actions stay reasoned and audited.">
            <div className="space-y-4">
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent="lock"
                label="Lock Thread"
                placeholder="Reason for locking"
              />
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent="close"
                label="Close Thread"
                placeholder="Reason for closing"
                tone="secondary"
              />
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent="resolve"
                label="Resolve Thread"
                placeholder="Reason for resolving"
                tone="secondary"
              />
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent="hide"
                label="Hide Thread"
                placeholder="Reason for hiding"
                tone="secondary"
              />
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent="remove"
                label="Remove Thread"
                placeholder="Reason for removal"
                tone="secondary"
              />
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent="restore"
                label="Restore Thread"
                placeholder="Reason for restore"
                tone="secondary"
              />
              <WorkflowForm
                slug={discussion.slug}
                discussionId={discussion.id}
                intent={discussion.isPinned ? "unpin" : "pin"}
                label={discussion.isPinned ? "Remove Pin" : "Pin Thread"}
                placeholder="Optional pin note"
                tone="secondary"
              />
            </div>
          </Panel>

          <Panel title="AI Summary Controls">
            <div className="space-y-4">
              <form action={adminDiscussionWorkflowAction} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <input type="hidden" name="discussionId" value={discussion.id} />
                <input type="hidden" name="slug" value={discussion.slug} />
                <input type="hidden" name="intent" value="mark_summary_stale" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#4C2F5E]" />
                    <p className="text-sm font-semibold text-[#2F1D3B]">Mark Current Summary Stale</p>
                  </div>
                  <input name="reason" placeholder="Why this summary should be regenerated" className="legal-field" required />
                  <button type="submit" className="legal-button-secondary w-full text-sm">
                    Mark Stale
                  </button>
                </div>
              </form>

              <form action={adminDiscussionWorkflowAction} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <input type="hidden" name="discussionId" value={discussion.id} />
                <input type="hidden" name="slug" value={discussion.slug} />
                <input type="hidden" name="intent" value="suppress_summaries" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#4C2F5E]" />
                    <p className="text-sm font-semibold text-[#2F1D3B]">Suppress Current Summaries</p>
                  </div>
                  <input name="reason" placeholder="Policy reason for suppression" className="legal-field" required />
                  <button type="submit" className="legal-button-secondary w-full text-sm">
                    Suppress
                  </button>
                </div>
              </form>
            </div>
          </Panel>

          <Panel title="Moderation Context">
            <div className="space-y-4">
              <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-[#4C2F5E]" />
                  <p className="text-sm font-semibold text-[#2F1D3B]">Reports</p>
                </div>
                <div className="mt-3 space-y-3">
                  {data.moderation.reports.length ? (
                    data.moderation.reports.map((report) => (
                      <div key={report.id} className="rounded-[16px] border border-[#4C2F5E]/10 bg-white p-3">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{report.reason}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {report.reporterName} / {prettyText(report.status)} / {formatDateTime(report.createdAt)}
                        </p>
                        {report.resolutionNote ? <p className="mt-2 text-sm text-slate-600">{report.resolutionNote}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No reports linked.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-[#4C2F5E]" />
                  <p className="text-sm font-semibold text-[#2F1D3B]">AI Alerts</p>
                </div>
                <div className="mt-3 space-y-3">
                  {data.moderation.alerts.length ? (
                    data.moderation.alerts.map((alert) => (
                      <div key={alert.id} className="rounded-[16px] border border-[#4C2F5E]/10 bg-white p-3">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{alert.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {alert.severity} / {prettyText(alert.status)} / {formatDateTime(alert.detectedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No AI alerts linked.</p>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Action & Notification Trail">
            <div className="space-y-4">
              <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-[#4C2F5E]" />
                  <p className="text-sm font-semibold text-[#2F1D3B]">Moderation Actions</p>
                </div>
                <div className="mt-3 space-y-3">
                  {data.moderation.actions.length ? (
                    data.moderation.actions.map((action) => (
                      <div key={action.id} className="rounded-[16px] border border-[#4C2F5E]/10 bg-white p-3">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{action.actionType}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {action.moderator} / {formatDateTime(action.createdAt)}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{action.reason ?? action.note ?? "No note stored."}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No moderation actions linked.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-[#4C2F5E]" />
                  <p className="text-sm font-semibold text-[#2F1D3B]">Notifications</p>
                </div>
                <div className="mt-3 space-y-3">
                  {data.notifications.length ? (
                    data.notifications.map((notification) => (
                      <div key={notification.id} className="rounded-[16px] border border-[#4C2F5E]/10 bg-white p-3">
                        <p className="text-sm font-semibold text-[#2F1D3B]">{notification.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {notification.type} / {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No notification fan-out captured.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/discussions/${discussion.slug}`} className="legal-button-secondary text-sm">
                  Open Public Thread
                </Link>
                {discussion.relatedCaseSlug ? (
                  <Link href={`/cases/${discussion.relatedCaseSlug}`} className="legal-button-secondary text-sm">
                    Open Related Case
                  </Link>
                ) : null}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
