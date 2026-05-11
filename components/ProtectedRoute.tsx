import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
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
  children?: ReactNode;
};

const resolveAccess = ({ permission, allOf, anyOf, can, canAll, canAny }: AccessResolverArgs): boolean => {
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
  const { can, canAll, canAny } = usePermissions();
  const isAllowed = resolveAccess({
    permission,
    allOf,
    anyOf,
    can,
    canAll,
    canAny,
  });

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
