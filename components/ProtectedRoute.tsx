'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import usePermissions from '../hooks/usePermissions';
import type { Permission } from '../utils/permissions';

type AccessResolverArgs = {
  permission?: Permission;
  allOf?: Permission[];
  anyOf?: Permission[];
  can: (permission: Permission) => boolean;
  canAll: (requiredPermissions: Permission[]) => boolean;
  canAny: (requiredPermissions: Permission[]) => boolean;
};

type ProtectedRouteProps = {
  permission?: Permission;
  allOf?: Permission[];
  anyOf?: Permission[];
  children: ReactNode; // Required in Next.js as there is no Outlet
};

const resolveAccess = ({
  permission,
  allOf,
  anyOf,
  can,
  canAll,
  canAny,
}: AccessResolverArgs): boolean => {
  if (permission) {
    return can(permission);
  }

  if (Array.isArray(allOf) && allOf.length > 0) {
    return canAll(allOf);
  }

  if (Array.isArray(anyOf) && anyOf.length > 0) {
    return canAny(anyOf);
  }

  return true;
};

const ProtectedRoute = ({
  permission,
  allOf,
  anyOf,
  children,
}: ProtectedRouteProps) => {
  const { can, canAll, canAny, isLoading } = usePermissions();
  const router = useRouter();

  const isAllowed = resolveAccess({
    permission,
    allOf,
    anyOf,
    can,
    canAll,
    canAny,
  });

  useEffect(() => {
    // Only redirect if loading is finished and the user is not allowed
    if (!isLoading && !isAllowed) {
      router.replace('/unauthorized');
    }
  }, [isAllowed, isLoading, router]);

  // Prevent "flickering" content while permissions are being fetched
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  // If allowed, render the children; otherwise render nothing while redirecting
  return isAllowed ? <>{children}</> : null;
};

export default ProtectedRoute;