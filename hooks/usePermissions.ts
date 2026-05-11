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
    // Added loading state to match your Redux slice
    isLoading?: boolean; 
  };
};

type UsePermissionsResult = {
  can: (permission: Permission) => boolean;
  canAll: (requiredPermissions: Permission[]) => boolean;
  canAny: (requiredPermissions: Permission[]) => boolean;
  permissions: Permission[];
  isLoading: boolean; // Added for TypeScript compatibility
};

const selectPermissions = (state: RootState): Permission[] =>
  state?.auth?.user?.permissions ?? [];

// Added selector for loading state
const selectIsLoading = (state: RootState): boolean => 
  state?.auth?.isLoading ?? false;

export const usePermissions = (): UsePermissionsResult => {
  const permissions = useSelector(selectPermissions, shallowEqual);
  const isLoading = useSelector(selectIsLoading); // Fetching from Redux

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
      isLoading, 
    }),
    [can, canAll, canAny, permissions, isLoading],
  );
};

export default usePermissions;