import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkSectionAccess } from '../../services/accessControlService';
import { Alert, LoadingSpinner } from '../common/CommonComponents';

interface PermissionGuardProps {
  children: React.ReactNode;
  section: string; // Section name (statistics, users, blocks, etc.)
  requiredLevel?: 'read' | 'write'; // Required access level
  fallbackMessage?: string;
  showAccessLevel?: boolean; // Show current access level
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  section,
  requiredLevel = 'read',
  fallbackMessage,
  showAccessLevel = false
}) => {
  const { currentUser } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<'none' | 'read' | 'write'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setHasAccess(false);
        setAccessLevel('none');
        setErrorMessage('Usuario no autenticado');
        setIsLoading(false);
        return;
      }

      try {
        // Check access using the service
        const accessResult = await checkSectionAccess(
          currentUser.curp, 
          currentUser.role, 
          section, 
          requiredLevel
        );

        setHasAccess(accessResult.hasAccess);
        setAccessLevel(accessResult.accessLevel);
        
        if (!accessResult.hasAccess) {
          setErrorMessage(
            accessResult.message || 
            `Acceso insuficiente. Se requiere: ${requiredLevel}, disponible: ${accessResult.accessLevel}`
          );
        }

      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasAccess(false);
        setAccessLevel('none');
        setErrorMessage('Error al verificar permisos');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [currentUser, section, requiredLevel]);

  // Helper function to get access level description
  const getAccessLevelDescription = (level: 'none' | 'read' | 'write'): string => {
    switch (level) {
      case 'none': return 'Sin acceso';
      case 'read': return 'Solo lectura';
      case 'write': return 'Lectura y escritura';
      default: return 'Sin acceso';
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <Alert 
          type="error" 
          title="Acceso Denegado" 
          message={fallbackMessage || errorMessage} 
        />
        {showAccessLevel && accessLevel !== 'none' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tu nivel de acceso actual:</strong> {getAccessLevelDescription(accessLevel)}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {showAccessLevel && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Nivel de acceso:</strong> {getAccessLevelDescription(accessLevel)}
          </p>
        </div>
      )}
      {children}
    </>
  );
};

export default PermissionGuard;
