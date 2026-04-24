'use client';

import { Building2, MapPin, Scale, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface ProfileHoverLinkProps {
  href?: string | null;
  displayName: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isLawyer?: boolean;
  headline?: string | null;
  practiceArea?: string | null;
  firmName?: string | null;
  barCouncil?: string | null;
  region?: string | null;
  children: ReactNode;
  className?: string;
  panelPosition?: 'top' | 'bottom';
  panelAlign?: 'left' | 'right';
}

function initials(name: string | null) {
  if (!name) return 'LH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function ProfileHoverLink({
  href,
  displayName,
  username,
  avatarUrl,
  isVerified = false,
  isLawyer = false,
  headline,
  practiceArea,
  firmName,
  barCouncil,
  region,
  children,
  className,
  panelPosition = 'bottom',
  panelAlign = 'left',
}: ProfileHoverLinkProps) {
  const summary = headline || practiceArea || (isLawyer ? 'Legal Hub lawyer profile' : 'Legal Hub member profile');
  const panelPositionClass = panelPosition === 'top' ? 'bottom-full mb-3' : 'top-full mt-3';
  const panelAlignClass = panelAlign === 'right' ? 'right-0' : 'left-0';
  const triggerClassName = className ?? 'inline-flex';
  const content = (
    <>
      {children}
      <div
        className={`pointer-events-none absolute ${panelPositionClass} ${panelAlignClass} z-40 w-[280px] max-w-[calc(100vw-2rem)] rounded-[22px] border border-[#4C2F5E]/12 bg-white p-4 text-left opacity-0 shadow-[0_20px_45px_rgba(26,14,33,0.16)] transition duration-150 group-hover/profile:opacity-100`}
      >
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName ?? 'Profile'}
              className="h-12 w-12 rounded-full border border-[#4C2F5E]/10 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
              {initials(displayName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[#2F1D3B]">
                {displayName ?? 'Anonymous'}
              </p>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EAF6] px-2 py-0.5 text-[10px] font-semibold text-[#4C2F5E]">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              ) : null}
            </div>
            {username ? (
              <p className="mt-1 text-xs font-medium text-[#7A6C88]">@{username}</p>
            ) : null}
            <p className="mt-1.5 text-xs leading-5 text-[#6E607D]">{summary}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs text-[#6E607D]">
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 text-[#8B7D99]" />
            <span>{isLawyer ? 'Lawyer profile' : 'Community member'}</span>
          </div>
          {firmName ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[#8B7D99]" />
              <span className="truncate">{firmName}</span>
            </div>
          ) : null}
          {barCouncil ? (
            <div className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-[#8B7D99]" />
              <span className="truncate">{barCouncil}</span>
            </div>
          ) : null}
          {region ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#8B7D99]" />
              <span className="truncate">{region}</span>
            </div>
          ) : null}
        </div>

        {href ? (
          <div className="mt-4 border-t border-[#4C2F5E]/8 pt-3">
            <span className="text-xs font-semibold text-[#4C2F5E]">Open profile</span>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="group/profile relative max-w-full">
      {href ? (
        <Link href={href} className={triggerClassName}>
          {content}
        </Link>
      ) : (
        <div className={triggerClassName}>
          {content}
        </div>
      )}
    </div>
  );
}
