'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import type { CaseUserSummary } from '@/types/case';
import type { ReactNode } from 'react';

interface CaseUserLinkProps {
  user: CaseUserSummary;
  children: ReactNode;
  className?: string;
}

export default function CaseUserLink({ user, children, className }: CaseUserLinkProps) {
  if (!user.id) {
    return <div className={className}>{children}</div>;
  }

  return (
    <ProfileHoverLink
      href={`/profile/user/${user.id}`}
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
