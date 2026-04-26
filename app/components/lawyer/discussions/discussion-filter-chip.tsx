'use client';

import { X } from 'lucide-react';

export default function DiscussionFilterChip({
  label,
  onRemove,
  prefix,
}: {
  label: string;
  onRemove?: () => void;
  prefix?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-2 text-xs font-semibold text-[#4C2F5E] transition hover:bg-[#F1EAF6]"
      aria-label={`Remove filter ${prefix ? `${prefix}: ` : ''}${label}`}
    >
      {prefix ? <span className="text-[#8B7D99]">{prefix}</span> : null}
      <span className="truncate">{label}</span>
      {onRemove ? <X className="h-3.5 w-3.5 shrink-0" /> : null}
    </button>
  );
}
