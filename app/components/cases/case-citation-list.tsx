import type { CaseCitationItem } from '@/types/case';
import { ArrowUpRight, Scale } from 'lucide-react';
import Link from 'next/link';

function formatDate(value?: string | null) {
  if (!value) return 'Undated';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function CaseCitationList({
  title,
  kicker,
  citations,
}: {
  title: string;
  kicker: string;
  citations: CaseCitationItem[];
}) {
  return (
    <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{kicker}</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {citations.length ? (
          citations.map((citation) => (
            <Link
              key={citation.id}
              href={`/cases/${citation.slug}`}
              className="flex flex-col gap-3 rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 transition hover:border-[#4C2F5E]/20 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{citation.canonicalCitation}</p>
                  <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{citation.title}</p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#4C2F5E]" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4C2F5E]">
                  {citation.relationshipLabel}
                </span>
                <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#6A5B7A]">
                  {citation.court ?? 'Case record'}
                </span>
                <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#6A5B7A]">
                  {formatDate(citation.decisionDate)}
                </span>
              </div>

              {citation.note ? <p className="text-sm leading-7 text-[#6E5D7F]">{citation.note}</p> : null}
            </Link>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-5 py-8 text-sm text-[#6E5D7F]">
            No linked cases yet.
          </div>
        )}
      </div>
    </section>
  );
}
