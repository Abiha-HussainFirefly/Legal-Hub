'use client';

import type { LucideIcon } from 'lucide-react';

export default function CaseEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1EAF6] text-[#4C2F5E]">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-[#2F1D3B]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-[#706181]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
