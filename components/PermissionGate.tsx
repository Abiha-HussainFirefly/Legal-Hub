import type { ReactNode } from 'react';
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

type PermissionGateProps = {
  permission?: Permission;
  allOf?: Permission[];
  anyOf?: Permission[];
  fallback?: ReactNode;
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

const PermissionGate = ({
  permission,
  allOf,
  anyOf,
  fallback = null,
  children,
}: PermissionGateProps) => {
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
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGate;
