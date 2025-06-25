import { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { getUserAvailableSections } from '../services/accessControlService';

interface UseAdminPermissionsResult {
  availableSections: Record<string, 'read' | 'write' | 'none'>;
  isLoading: boolean;
  canAccess: (section: string, level?: 'read' | 'write') => boolean;
}

export const useAdminPermissions = (
  userCurp: string | undefined,
  userRole: UserRole | undefined
): UseAdminPermissionsResult => {
  const [availableSections, setAvailableSections] = useState<Record<string, 'read' | 'write' | 'none'>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!userCurp || !userRole) {
        setAvailableSections({});
        setIsLoading(false);
        return;
      }

      try {
        const sections = await getUserAvailableSections(userCurp, userRole);
        setAvailableSections(sections);
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setAvailableSections({});
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [userCurp, userRole]);

  const canAccess = (section: string, level: 'read' | 'write' = 'read'): boolean => {
    const access = availableSections[section];
    if (!access || access === 'none') return false;
    if (level === 'read') return access === 'read' || access === 'write';
    if (level === 'write') return access === 'write';
    return false;
  };
  return {
    availableSections,
    isLoading,
    canAccess
  };
};

export default useAdminPermissions;
