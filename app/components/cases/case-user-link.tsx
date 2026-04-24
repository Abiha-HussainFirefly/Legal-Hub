'use client';

import type { CaseUserSummary } from '@/types/case';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface CaseUserLinkProps {
  user: Pick<CaseUserSummary, 'id' | 'displayName'>;
  children: ReactNode;
  className?: string;
}

export default function CaseUserLink({ user, children, className }: CaseUserLinkProps) {
  if (!user.id) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link
      href={`/profile/user/${user.id}`}
      className={className}
      title={`Open ${user.displayName}'s profile`}
    >
      {children}
    </Link>
  );
}
