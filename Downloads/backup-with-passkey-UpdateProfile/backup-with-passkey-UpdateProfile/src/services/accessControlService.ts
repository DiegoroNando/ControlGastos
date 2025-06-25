import { AdminUser, AdminPermission, UserRole } from '../types';
import { getAllAdminUsers, hasPermission, canAccessSection } from './adminManagementService';

export interface AccessControlResult {
  hasAccess: boolean;
  accessLevel: 'none' | 'read' | 'write';
  message?: string;
}

/**
 * Verifica si un usuario tiene acceso a una sección específica
 */
export const checkSectionAccess = async (
  userCurp: string, 
  userRole: UserRole, 
  section: string, 
  requiredLevel: 'read' | 'write' = 'read'
): Promise<AccessControlResult> => {
  // SuperAdmin siempre tiene acceso completo
  if (userRole === UserRole.SUPERADMIN) {
    return {
      hasAccess: true,
      accessLevel: 'write'
    };
  }

  // Solo admins y superadmins pueden acceder a secciones administrativas
  if (userRole !== UserRole.ADMIN) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      message: 'Acceso denegado: Se requieren permisos de administrador'
    };
  }

  try {
    // Buscar el admin en la base de datos
    const admins = await getAllAdminUsers();
    const admin = admins.find(a => a.curp === userCurp);

    if (!admin) {
      return {
        hasAccess: false,
        accessLevel: 'none',
        message: 'Administrador no encontrado'
      };
    }

    if (!admin.isActive) {
      return {
        hasAccess: false,
        accessLevel: 'none',
        message: 'Cuenta de administrador desactivada'
      };
    }

    const accessLevel = canAccessSection(admin, section);

    // Verificar si el nivel de acceso es suficiente
    const hasRequiredAccess = 
      (requiredLevel === 'read' && (accessLevel === 'read' || accessLevel === 'write')) ||
      (requiredLevel === 'write' && accessLevel === 'write');

    return {
      hasAccess: hasRequiredAccess,
      accessLevel,
      message: hasRequiredAccess ? undefined : `Acceso insuficiente: se requiere ${requiredLevel}, disponible ${accessLevel}`
    };
  } catch (error) {
    console.error('Error checking section access:', error);
    return {
      hasAccess: false,
      accessLevel: 'none',
      message: 'Error al verificar permisos'
    };
  }
};

/**
 * Verifica si un administrador tiene un permiso específico
 */
export const checkPermission = async (
  userCurp: string, 
  userRole: UserRole, 
  permission: AdminPermission
): Promise<AccessControlResult> => {
  // SuperAdmin siempre tiene todos los permisos
  if (userRole === UserRole.SUPERADMIN) {
    return {
      hasAccess: true,
      accessLevel: 'write'
    };
  }

  if (userRole !== UserRole.ADMIN) {
    return {
      hasAccess: false,
      accessLevel: 'none',
      message: 'Acceso denegado: Se requieren permisos de administrador'
    };
  }

  try {
    const admins = await getAllAdminUsers();
    const admin = admins.find(a => a.curp === userCurp);

    if (!admin) {
      return {
        hasAccess: false,
        accessLevel: 'none',
        message: 'Administrador no encontrado'
      };
    }

    if (!admin.isActive) {
      return {
        hasAccess: false,
        accessLevel: 'none',
        message: 'Cuenta de administrador desactivada'
      };
    }

    const hasAccess = hasPermission(admin, permission);

    return {
      hasAccess,
      accessLevel: hasAccess ? 'write' : 'none',
      message: hasAccess ? undefined : `Permiso denegado: ${permission}`
    };
  } catch (error) {
    console.error('Error checking permission:', error);
    return {
      hasAccess: false,
      accessLevel: 'none',
      message: 'Error al verificar permisos'
    };
  }
};

/**
 * Obtiene todas las secciones disponibles para un usuario
 */
export const getUserAvailableSections = async (
  userCurp: string, 
  userRole: UserRole
): Promise<Record<string, 'read' | 'write' | 'none'>> => {
  const sections = ['statistics', 'users', 'blocks', 'calendar', 'whitelist', 'emails', 'settings'];
  const result: Record<string, 'read' | 'write' | 'none'> = {};

  // SuperAdmin tiene acceso completo a todo
  if (userRole === UserRole.SUPERADMIN) {
    sections.forEach(section => {
      result[section] = 'write';
    });
    return result;
  }

  if (userRole !== UserRole.ADMIN) {
    sections.forEach(section => {
      result[section] = 'none';
    });
    return result;
  }

  try {
    const admins = await getAllAdminUsers();
    const admin = admins.find(a => a.curp === userCurp);

    if (!admin || !admin.isActive) {
      sections.forEach(section => {
        result[section] = 'none';
      });
      return result;
    }

    sections.forEach(section => {
      result[section] = canAccessSection(admin, section);
    });

    return result;
  } catch (error) {
    console.error('Error getting user available sections:', error);
    sections.forEach(section => {
      result[section] = 'none';
    });
    return result;
  }
};

/**
 * Filtra elementos de una lista según los permisos del usuario (versión síncrona para UI)
 */
export const filterUsersByAccessSync = (
  users: any[], 
  currentUserRole: UserRole
): any[] => {
  // SuperAdmin ve todos los usuarios
  if (currentUserRole === UserRole.SUPERADMIN) {
    return users;
  }

  // Los admins regulares no ven al superadmin ni a otros admins en las listas
  if (currentUserRole === UserRole.ADMIN) {
    return users.filter(user => 
      user.role !== UserRole.SUPERADMIN && 
      user.role !== UserRole.ADMIN
    );
  }

  // Usuarios regulares no deberían acceder a estas listas
  return [];
};

/**
 * Filtra elementos de una lista según los permisos del usuario (versión asíncrona para verificación completa)
 */
export const filterUsersByAccess = async (
  users: any[], 
  currentUserCurp: string, 
  currentUserRole: UserRole
): Promise<any[]> => {
  // SuperAdmin ve todos los usuarios
  if (currentUserRole === UserRole.SUPERADMIN) {
    return users;
  }

  // Verificar si el admin tiene acceso a gestión de usuarios
  const accessResult = await checkSectionAccess(currentUserCurp, currentUserRole, 'users');
  
  if (!accessResult.hasAccess) {
    return [];
  }

  // Filtrar: los admins no ven al superadmin ni a otros admins en las listas
  return users.filter(user => 
    user.role !== UserRole.SUPERADMIN && 
    user.role !== UserRole.ADMIN
  );
};

/**
 * Hook personalizado para verificación de acceso en componentes React
 */
export const useAccessControl = () => {
  return {
    checkSectionAccess,
    checkPermission,
    getUserAvailableSections,
    filterUsersByAccess,
    filterUsersByAccessSync
  };
};

export default {
  checkSectionAccess,
  checkPermission,
  getUserAvailableSections,
  filterUsersByAccess,
  filterUsersByAccessSync,
  useAccessControl
};
