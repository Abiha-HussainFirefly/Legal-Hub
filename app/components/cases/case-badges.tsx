import type { CaseRepositoryRecord, CaseSourceType, CaseVisibility } from '@/types/case';
import { CheckCircle2, Eye, FileSearch, Globe, Landmark, Lock, ShieldCheck, Sparkles, Users } from 'lucide-react';

export function CaseStatusBadge({ status }: { status: CaseRepositoryRecord['status'] }) {
  const map = {
    DRAFT: 'border-[#4C2F5E]/12 bg-[#F6F1FA] text-[#4C2F5E]',
    PENDING_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
    PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
    ARCHIVED: 'border-slate-200 bg-slate-50 text-slate-700',
    REMOVED: 'border-red-200 bg-red-50 text-red-700',
  } as const;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-[0_4px_14px_rgba(76,47,94,0.04)] ${map[status]}`}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {status.replace('_', ' ')}
    </span>
  );
}

export function CaseVisibilityBadge({ visibility }: { visibility: CaseVisibility }) {
  const icon = visibility === 'PUBLIC' ? Globe : visibility === 'ORGANIZATION' ? Users : visibility === 'UNLISTED' ? Eye : Lock;

  const Icon = icon;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-[#F7F3FA] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5F506D]">
      <Icon className="h-3.5 w-3.5" />
      {visibility.toLowerCase()}
    </span>
  );
}

export function CaseSourceBadge({ sourceType }: { sourceType: CaseSourceType }) {
  const icon = sourceType === 'OFFICIAL_COURT'
    ? Landmark
    : sourceType === 'USER_SUBMITTED'
      ? ShieldCheck
      : sourceType === 'IMPORTED_EDITORIAL'
        ? FileSearch
        : Sparkles;
  const Icon = icon;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E5C80] shadow-[0_4px_14px_rgba(76,47,94,0.03)]">
      <Icon className="h-3.5 w-3.5 text-[#4C2F5E]" />
      {sourceType.replaceAll('_', ' ').toLowerCase()}
    </span>
  );
}
