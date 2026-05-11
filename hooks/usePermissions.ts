import { useCallback, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type Permission,
} from '../utils/permissions';

type RootState = {
  auth?: {
    user?: {
      permissions?: Permission[];
    };
  };
};

type UsePermissionsResult = {
  can: (permission: Permission) => boolean;
  canAll: (requiredPermissions: Permission[]) => boolean;
  canAny: (requiredPermissions: Permission[]) => boolean;
  permissions: Permission[];
};

const selectPermissions = (state: RootState): Permission[] =>
  state?.auth?.user?.permissions ?? [];

export const usePermissions = (): UsePermissionsResult => {
  const permissions = useSelector(selectPermissions, shallowEqual);

  const can = useCallback(
    (permission: Permission) => hasPermission(permissions, permission),
    [permissions],
  );

  const canAll = useCallback(
    (requiredPermissions: Permission[]) => hasAllPermissions(permissions, requiredPermissions),
    [permissions],
  );

  const canAny = useCallback(
    (requiredPermissions: Permission[]) => hasAnyPermission(permissions, requiredPermissions),
    [permissions],
  );

  return useMemo(
    () => ({
      can,
      canAll,
      canAny,
      permissions,
    }),
    [can, canAll, canAny, permissions],
  );
};

export default usePermissions;
