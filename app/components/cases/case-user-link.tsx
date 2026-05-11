'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import type { CaseUserSummary } from '@/types/case';
import type { ReactNode } from 'react';

interface CaseUserLinkProps {
  user: CaseUserSummary;
  children: ReactNode;
  className?: string;
  href?: string | null;
}

export default function CaseUserLink({ user, children, className, href }: CaseUserLinkProps) {
  const profileHref = href === undefined ? (user.id ? `/profile/user/${user.id}` : null) : href;

  if (!profileHref) {
    return <div className={className}>{children}</div>;
  }

  return (
    <ProfileHoverLink
      href={profileHref}
      displayName={user.displayName}
      username={user.username}
      avatarUrl={user.avatarUrl}
      isVerified={user.isVerifiedLawyer}
      isLawyer={user.isLawyer ?? Boolean(user.isVerifiedLawyer)}
      headline={user.headline ?? user.roleLabel ?? user.organizationName ?? null}
      firmName={user.firmName ?? user.organizationName ?? null}
      barCouncil={user.barCouncil ?? null}
      region={user.regionName ?? null}
      className={className}
    >
      {children}
    </ProfileHoverLink>
  );
}
