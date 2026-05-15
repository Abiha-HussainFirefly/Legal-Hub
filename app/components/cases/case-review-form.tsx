"use client";

import { adminCaseReviewAction, type ActionResult } from "@/app/actions/admin-review";
import {
  CheckCheck,
  Flag,
  MessageSquareText,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useActionState } from "react";


export type CaseStatus = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED" | "REMOVED";

interface CaseReviewFormProps {
  slug: string;
  status: CaseStatus;
  lastReviewerNote?: string | null;
  trustLabel: string;
}

export function CaseReviewForm({ slug, status, lastReviewerNote, trustLabel }: CaseReviewFormProps) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    adminCaseReviewAction,
    null,
  );

  const isError = state && !state.success;
  const isSuccess = state?.success === true;

  return (
    <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
          <MessageSquareText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">
            Reviewer notes
          </p>
          <h2 className="text-lg font-semibold text-[#2F1D3B]">Decision rationale</h2>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm leading-6 text-red-700">
            {(state as { success: false; error: string }).error}
          </p>
        </div>
      )}

      {/* Success banner */}
      {isSuccess && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <CheckCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-sm leading-6 text-emerald-700">Action completed successfully.</p>
        </div>
      )}

      <form action={formAction} className="mt-4">
        <input type="hidden" name="slug" value={slug} />

        <textarea
          className="legal-field h-40 resize-none"
          name="reviewNote"
          defaultValue={lastReviewerNote ?? ""}
          placeholder="Document the review rationale, rejection reason, or reviewer note."
          disabled={isPending}
          aria-label="Reviewer note"
        />

        <div className="mt-4 grid gap-3">
          {status === "PENDING_REVIEW" && (
            <>
              <button
                className="legal-button-primary w-full text-sm"
                type="submit"
                name="intent"
                value="publish"
                disabled={isPending}
              >
                <CheckCheck className="h-4 w-4" />
                {isPending ? "Processing…" : "Publish case"}
              </button>
              <button
                className="legal-button-secondary w-full text-sm"
                type="submit"
                name="intent"
                value="reject"
                disabled={isPending}
              >
                <XCircle className="h-4 w-4" />
                {isPending ? "Processing…" : "Reject and request changes"}
              </button>
            </>
          )}

          {(status === "PUBLISHED" || status === "REJECTED") && (
            <button
              className="legal-button-secondary w-full text-sm"
              type="submit"
              name="intent"
              value="archive"
              disabled={isPending}
            >
              <Flag className="h-4 w-4" />
              {isPending ? "Processing…" : "Archive case"}
            </button>
          )}

          {(status === "ARCHIVED" || status === "REMOVED") && (
            <button
              className="legal-button-secondary w-full text-sm"
              type="submit"
              name="intent"
              value="restore"
              disabled={isPending}
            >
              <ShieldCheck className="h-4 w-4" />
              {isPending ? "Processing…" : "Restore case"}
            </button>
          )}

          <button
            className="legal-button-secondary w-full text-sm"
            type="submit"
            name="intent"
            value="save_note"
            disabled={isPending}
          >
            <Send className="h-4 w-4" />
            {isPending ? "Saving…" : "Save reviewer note"}
          </button>
        </div>
      </form>

      <p className="mt-3 text-xs text-[#706181]">
        Publish and reject update authoritative case workflow state, audit logs, notifications, and
        reviewer notes.
      </p>
    </div>
  );
}