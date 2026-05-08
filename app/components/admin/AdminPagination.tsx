'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminPagination({
  start,
  end,
  total,
  currentPage,
  pageLinks,
  previousHref,
  nextHref,
  isFirstPage,
  isLastPage,
}: {
  start: number;
  end: number;
  total: number;
  currentPage: number;
  pageLinks: Array<{ pageNumber: number; href: string }>;
  previousHref: string;
  nextHref: string;
  isFirstPage: boolean;
  isLastPage: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Results</p>
        <p className="mt-1 text-sm text-slate-600">
          Showing {start} to {end} of {new Intl.NumberFormat('en-US').format(total)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={previousHref}
          aria-disabled={isFirstPage}
          className={`inline-flex h-11 items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#FBF9FD] ${
            isFirstPage ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>

        {pageLinks.map((link) => (
          <Link
            key={link.pageNumber}
            href={link.href}
            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${
              link.pageNumber === currentPage
                ? 'bg-[#4C2F5E] text-white shadow-sm'
                : 'border border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#FBF9FD]'
            }`}
          >
            {link.pageNumber}
          </Link>
        ))}

        <Link
          href={nextHref}
          aria-disabled={isLastPage}
          className={`inline-flex h-11 items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#FBF9FD] ${
            isLastPage ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
