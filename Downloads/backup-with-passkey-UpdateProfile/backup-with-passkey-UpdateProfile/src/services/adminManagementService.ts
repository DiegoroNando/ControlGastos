// services/adminManagementService.ts
import { AdminUser, AdminPermissions, AdminPermission, UserRole } from '../types';
import { generatePasswordDigest } from './passwordService';
import { sendAdminRegistrationEmail } from './emailService';

const COLLECTIONS = {
  ADMINS: 'admins'
};

// Database helper functions
const dbCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  const config: RequestInit = { method };
  
  if (body) {
    config.headers = { 'Content-Type': 'application/json' };
    if (method === 'GET') {
      // For GET requests, convert body to query parameters
      const params = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        params.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      endpoint += `?${params.toString()}`;
    } else {
      config.body = JSON.stringify(body);
    }
  }
  
  const response = await fetch(`/api/db${endpoint}`, config);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Database operation failed');
  }
  
  return result;
};

const getFromCollection = async <T>(collectionName: string, query: Record<string, any> = {}): Promise<T[]> => {
  try {
    const result = await dbCall('/read', 'GET', { collectionName, query: JSON.stringify(query) });
    return result.data?.documents || [];
  } catch (error) {
    console.error('Error fetching from collection:', error);
    return [];
  }
};

const insertToCollection = async <T>(collectionName: string, data: T): Promise<boolean> => {
  try {
    await dbCall('/create', 'POST', { collectionName, data });
    return true;
  } catch (error) {
    console.error('Error inserting to collection:', error);
    return false;
  }
};

const updateInCollection = async (
  collectionName: string, 
  query: Record<string, any>, 
  update: Record<string, any>
): Promise<boolean> => {
  try {
    await dbCall('/update', 'PUT', { collectionName, query, update });
    return true;
  } catch (error) {
    console.error('Error updating collection:', error);
    return false;
  }
};

const deleteFromCollection = async (
  collectionName: string, 
  query: Record<string, any>
): Promise<boolean> => {
  try {
    await dbCall('/delete', 'DELETE', { collectionName, query });
    return true;
  } catch (error) {
    console.error('Error deleting from collection:', error);
    return false;
  }
};

/**
 * Niveles de acceso para cada sección
 */
export type SectionAccessLevel = 'none' | 'read' | 'readwrite' | 'full';

/**
 * Configuración de permisos por sección para diferentes niveles de administrador
 */
export const ADMIN_PERMISSION_LEVELS = {
  /**
   * SOLO LECTURA - Acceso de consulta únicamente
   * Puede ver todas las secciones pero no puede modificar nada
   */
  SOLO_LECTURA: {
    statistics: 'read' as SectionAccessLevel,
    users: 'read' as SectionAccessLevel,
    blocks: 'read' as SectionAccessLevel,
    calendar: 'read' as SectionAccessLevel,
    whitelist: 'read' as SectionAccessLevel,
    emails: 'read' as SectionAccessLevel,
    settings: 'none' as SectionAccessLevel, // Sin acceso a configuración SMTP
  },
  
  /**
   * LECTURA Y ESCRITURA - Gestión completa de operaciones
   * Puede ver y modificar la mayoría de secciones excepto configuración crítica
   */
  LECTURA_ESCRITURA: {
    statistics: 'readwrite' as SectionAccessLevel,
    users: 'readwrite' as SectionAccessLevel,
    blocks: 'readwrite' as SectionAccessLevel,
    calendar: 'readwrite' as SectionAccessLevel,
    whitelist: 'readwrite' as SectionAccessLevel,
    emails: 'readwrite' as SectionAccessLevel,
    settings: 'read' as SectionAccessLevel, // Solo puede ver configuración SMTP
  },
  
  /**
   * COMPLETO - Acceso total incluyendo configuración crítica
   * Acceso completo a todas las funcionalidades del sistema
   */
  COMPLETO: {
    statistics: 'full' as SectionAccessLevel,
    users: 'full' as SectionAccessLevel,
    blocks: 'full' as SectionAccessLevel,
    calendar: 'full' as SectionAccessLevel,
    whitelist: 'full' as SectionAccessLevel,
    emails: 'full' as SectionAccessLevel,
    settings: 'full' as SectionAccessLevel, // Acceso completo incluyendo SMTP
  }
};

/**
 * Convierte los niveles de sección a permisos específicos
 */
const convertSectionLevelToPermissions = (sectionLevel: SectionAccessLevel, section: string): Partial<AdminPermissions> => {
  const readPerm = `${section}_read` as AdminPermission;
  const writePerm = `${section}_write` as AdminPermission;
  
  switch (sectionLevel) {
    case 'none':
      return { [readPerm]: false, [writePerm]: false };
    case 'read':
      return { [readPerm]: true, [writePerm]: false };
    case 'readwrite':
    case 'full':
      return { [readPerm]: true, [writePerm]: true };
    default:
      return { [readPerm]: false, [writePerm]: false };
  }
};

/**
 * Plantillas de permisos basadas en los niveles definidos
 */
export const DEFAULT_ADMIN_PERMISSIONS = {
  SOLO_LECTURA: (() => {
    let permissions: AdminPermissions = {};
    Object.entries(ADMIN_PERMISSION_LEVELS.SOLO_LECTURA).forEach(([section, level]) => {
      permissions = { ...permissions, ...convertSectionLevelToPermissions(level, section) };
    });
    return permissions;
  })(),
  
  LECTURA_ESCRITURA: (() => {
    let permissions: AdminPermissions = {};
    Object.entries(ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA).forEach(([section, level]) => {
      permissions = { ...permissions, ...convertSectionLevelToPermissions(level, section) };
    });
    return permissions;
  })(),
  
  COMPLETO: (() => {
    let permissions: AdminPermissions = {};
    Object.entries(ADMIN_PERMISSION_LEVELS.COMPLETO).forEach(([section, level]) => {
      permissions = { ...permissions, ...convertSectionLevelToPermissions(level, section) };
    });
    return permissions;
  })()
};

// Alias para compatibilidad con el código existente
export const DEFAULT_PERMISSION_TEMPLATES = DEFAULT_ADMIN_PERMISSIONS;

/**
 * Obtiene todos los administradores (excepto superadmin)
 */
export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const admins = await getFromCollection<AdminUser>(COLLECTIONS.ADMINS, {});
    return admins.filter(admin => admin.role === UserRole.ADMIN);
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
};

/**
 * Obtiene todos los administradores (alias para compatibilidad)
 */
export const getAdminUsers = getAllAdminUsers;

/**
 * Obtiene un administrador por CURP
 */
export const getAdminByCurp = async (curp: string): Promise<AdminUser | null> => {
  try {
    const admins = await getFromCollection<AdminUser>(COLLECTIONS.ADMINS, { curp });
    return admins.length > 0 ? admins[0] : null;
  } catch (error) {
    console.error('Error getting admin by CURP:', error);
    return null;
  }
};

/**
 * Crea un nuevo administrador
 */
export const createAdminUser = async (adminData: {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  email: string;
  permissions: AdminPermissions;
  createdBy: string;
}): Promise<{ success: boolean; message: string; admin?: AdminUser }> => {
  try {
    // Verificar si ya existe
    const existingAdmin = await getAdminByCurp(adminData.curp);
    if (existingAdmin) {
      return { success: false, message: 'Ya existe un administrador con este CURP' };
    }

    // Generar token de registro
    const registrationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    const registrationTokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 horas

    // Crear administrador
    const newAdmin: AdminUser = {
      id: adminData.curp,
      nombre: adminData.nombre,
      apellidoPaterno: adminData.apellidoPaterno,
      apellidoMaterno: adminData.apellidoMaterno,
      curp: adminData.curp,
      email: adminData.email,
      passwordDigest: '', // Se establecerá cuando el admin defina su contraseña
      role: UserRole.ADMIN,
      permissions: adminData.permissions,
      createdBy: adminData.createdBy,
      createdAt: Date.now(),
      isActive: true,
      hasLoggedInOnce: false,
      registrationToken,
      registrationTokenExpiry
    };    // Guardar en base de datos
    const saved = await insertToCollection(COLLECTIONS.ADMINS, newAdmin);
    if (!saved) {
      return { success: false, message: 'Error al guardar administrador en base de datos' };
    }    // Enviar correo de registro
    try {
      const fullName = `${adminData.nombre} ${adminData.apellidoPaterno} ${adminData.apellidoMaterno}`.trim();
      const emailSent = await sendAdminRegistrationEmail(adminData.email, fullName, registrationToken);
      if (!emailSent) {
        console.warn('Admin created but email could not be sent');
      }
    } catch (emailError) {
      console.warn('Error sending registration email:', emailError);
      // No fallar la creación del admin si el email falla
    }

    return { 
      success: true, 
      message: 'Administrador creado exitosamente. Se ha enviado un correo para establecer la contraseña.',
      admin: newAdmin
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, message: 'Error al crear administrador' };
  }
};

export const updateAdminPermissions = async (
  curp: string, 
  permissions: AdminPermissions
): Promise<{ success: boolean; message: string }> => {
  try {
    const updated = await updateInCollection(
      COLLECTIONS.ADMINS, 
      { curp }, 
      { permissions, updatedAt: Date.now() }
    );

    if (updated) {
      return { success: true, message: 'Permisos actualizados exitosamente' };
    } else {
      return { success: false, message: 'Administrador no encontrado' };
    }
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    return { success: false, message: 'Error al actualizar permisos' };
  }
};

/**
 * Activa o desactiva un administrador
 */
export const toggleAdminStatus = async (
  curp: string, 
  isActive: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const updated = await updateInCollection(
      COLLECTIONS.ADMINS, 
      { curp }, 
      { isActive, updatedAt: Date.now() }
    );

    if (updated) {
      return { 
        success: true, 
        message: `Administrador ${isActive ? 'activado' : 'desactivado'} exitosamente` 
      };
    } else {
      return { success: false, message: 'Administrador no encontrado' };
    }
  } catch (error) {
    console.error('Error toggling admin status:', error);
    return { success: false, message: 'Error al cambiar estado del administrador' };
  }
};

/**
 * Elimina un administrador
 */
export const deleteAdminUser = async (curp: string): Promise<{ success: boolean; message: string }> => {
  try {
    const deleted = await deleteFromCollection(COLLECTIONS.ADMINS, { curp });
    
    if (deleted) {
      return { success: true, message: 'Administrador eliminado exitosamente' };
    } else {
      return { success: false, message: 'Administrador no encontrado' };
    }
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return { success: false, message: 'Error al eliminar administrador' };
  }
};

/**
 * Cambia la contraseña de un administrador (solo superadmin)
 */
export const changeAdminPassword = async (
  curp: string, 
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const passwordDigest = await generatePasswordDigest(newPassword);
    const updated = await updateInCollection(
      COLLECTIONS.ADMINS, 
      { curp }, 
      { passwordDigest, updatedAt: Date.now() }
    );

    if (updated) {
      return { success: true, message: 'Contraseña actualizada exitosamente' };
    } else {
      return { success: false, message: 'Administrador no encontrado' };
    }
  } catch (error) {
    console.error('Error changing admin password:', error);
    return { success: false, message: 'Error al cambiar contraseña' };
  }
};

/**
 * Verifica si un administrador tiene un permiso específico
 */
export const hasPermission = (admin: AdminUser, permission: AdminPermission): boolean => {
  return admin.permissions[permission] === true;
};

/**
 * Verifica si un administrador puede acceder a una sección (READ o WRITE)
 */
export const canAccessSection = (admin: AdminUser, section: string): 'none' | 'read' | 'write' => {
  const readPermission = `${section}_read` as AdminPermission;
  const writePermission = `${section}_write` as AdminPermission;
  
  const canRead = hasPermission(admin, readPermission);
  const canWrite = hasPermission(admin, writePermission);
  
  if (canWrite) return 'write';
  if (canRead) return 'read';
  return 'none';
};

/**
 * Obtiene las secciones disponibles para un administrador
 */
export const getAvailableSections = (admin: AdminUser): Record<string, 'read' | 'write' | 'none'> => {
  const sections = ['statistics', 'users', 'blocks', 'calendar', 'whitelist', 'emails', 'settings'];
  const result: Record<string, 'read' | 'write' | 'none'> = {};
  
  sections.forEach(section => {
    result[section] = canAccessSection(admin, section);
  });
  
  return result;
};
