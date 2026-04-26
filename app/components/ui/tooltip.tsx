'use client';

import * as React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

export default function Tooltip({
  content,
  children,
  side = 'top',
  className = '',
}: TooltipProps) {
  const placementClass =
    side === 'bottom'
      ? 'top-full mt-2 origin-top'
      : 'bottom-full mb-2 origin-bottom';

  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1F1728] px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-[0_12px_24px_rgba(31,23,40,0.18)] transition duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${placementClass}`}
      >
        {content}
      </span>
    </span>
  );
}
