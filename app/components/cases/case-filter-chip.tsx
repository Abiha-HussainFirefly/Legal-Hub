'use client';

import { X } from 'lucide-react';

export default function CaseFilterChip({
  label,
  onRemove,
  tone = 'default',
  prefix,
}: {
  label: string;
  onRemove?: () => void;
  tone?: 'default' | 'strong';
  prefix?: string;
}) {
  const toneClass =
    tone === 'strong'
      ? 'border-[#4C2F5E]/16 bg-[#F1EAF6] text-[#4C2F5E] hover:bg-[#E9DDF3]'
      : 'border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#F1EAF6]';

  const content = (
    <>
      {prefix ? <span className="text-[#8B7D99]">{prefix}</span> : null}
      <span className="truncate">{label}</span>
      {onRemove ? <X className="h-3.5 w-3.5 shrink-0" /> : null}
    </>
  );

  if (!onRemove) {
    return (
      <span
        className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${toneClass}`}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${toneClass}`}
      aria-label={`Remove filter ${prefix ? `${prefix}: ` : ''}${label}`}
    >
      {content}
    </button>
  );
}
