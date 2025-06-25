// services/databaseService.ts
// Database service that replaces storageService.ts - Migrates from localStorage to MongoDB

import { 
  User, Post, VoteRecord, CandidateBlock, UserRole, PeerNomination, 
  ElectionSettings, AreaDepartamentoDireccion, ALL_AREA_DEPARTAMENTO_DIRECCION, 
  UserSex, ALL_USER_SEX, ALL_CANDIDATE_BLOCKS, AllBlockSettings, 
  EducationalLevel, ALL_EDUCATIONAL_LEVELS, EligibilityAnswers
} from '../types';
import { SUPERADMIN_INITIAL_DATA, SUPERADMIN_CURP, generateId } from '../constants';
import { isoToDateUTC } from '../utils/dateUtils';
import { sendCandidacyWithdrawalNotification } from './emailService';
import { curpValidationService, type UserDataFromCurp } from './curpValidationService';

// Database API configuration
const API_BASE_URL = '/api/db'; // Using the existing backend API

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts', 
  VOTES: 'votes',
  WHITELIST: 'whitelist',
  ELECTION_SETTINGS: 'election_settings',
  BLOCK_SETTINGS: 'block_settings',
  AUTH_SESSIONS: 'auth_sessions'
} as const;

// API response interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthSession {
  curp: string;
  sessionId: string;
  active: boolean;
  timestamp: number; // Used for session start or last activity
}

// Helper function to make API calls
const apiCall = async <T = any>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  try {
    const config: RequestInit = {
      method,
      headers: { 
        'Content-Type': 'application/json',
        // Conceptual: Add Authorization header if a token is available
        // 'Authorization': `Bearer ${localStorage.getItem('api_token') || ''}` 
      }
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    let url = `${API_BASE_URL}${endpoint}`;
    if (method === 'GET' && body) {
      // For GET requests, add query parameters
      const params = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        params.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'API call failed');
    }
    
    return result.data || result as T;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Helper function to get documents from a collection
const getFromCollection = async <T>(collectionName: string, query: Record<string, any> = {}): Promise<T[]> => {
  try {
    const result = await apiCall<{ documents: T[] }>('/read', 'GET', {
      collectionName,
      query: JSON.stringify(query)
    });
    return result.documents || [];
  } catch (error) {
    console.error(`Error fetching from ${collectionName}:`, error);
    return [];
  }
};

// Helper function to insert a document
const insertToCollection = async <T extends { _id?: string }>(collectionName: string, data: Omit<T, '_id'>): Promise<T> => {
  const result = await apiCall<{ document: T }>('/create', 'POST', {
    collectionName,
    data
  });
  return result.document;
};

// Helper function to update documents
const updateInCollection = async (
  collectionName: string, 
  query: Record<string, any>, 
  update: Record<string, any>
): Promise<void> => {
  // Backend should handle $set logic
  await apiCall('/update', 'PUT', {
    collectionName,
    query,
    update 
  });
};

// Helper function to delete documents
const deleteFromCollection = async (
  collectionName: string, 
  query: Record<string, any>
): Promise<void> => {
  await apiCall('/delete', 'DELETE', {
    collectionName,
    query
  });
};

// Export the utility functions for use by other services
export { getFromCollection, updateInCollection };
export const insertIntoCollection = insertToCollection;

// Data migration and field ensurance helpers (same logic as storageService)
const ensureUserFields = (user: any): User => {
  const updatedUser = { ...user };

  // Migrate old voting fields to new votesCast structure
  if (typeof updatedUser.votesCast === 'undefined') {
    if (updatedUser.hasVoted && updatedUser.votedForCandidateId && updatedUser.votedInBlock) {
      updatedUser.votesCast = { [updatedUser.votedInBlock]: updatedUser.votedForCandidateId };
    } else {
      updatedUser.votesCast = {};
    }
  }
  delete updatedUser.hasVoted;
  delete updatedUser.votedForCandidateId;
  delete updatedUser.votedInBlock;

  // Ensure other fields exist
  updatedUser.canChangeBlock = typeof updatedUser.canChangeBlock === 'boolean' ? updatedUser.canChangeBlock : false;
  updatedUser.peerNominations = updatedUser.peerNominations || [];
  updatedUser.hasPendingPeerNominationDecision = typeof updatedUser.hasPendingPeerNominationDecision === 'boolean' ? updatedUser.hasPendingPeerNominationDecision : false;
  updatedUser.nominationsMade = updatedUser.nominationsMade || {}; 
  
  updatedUser.areaDepartamentoDireccion = updatedUser.areaDepartamentoDireccion && ALL_AREA_DEPARTAMENTO_DIRECCION.includes(updatedUser.areaDepartamentoDireccion) 
                                            ? updatedUser.areaDepartamentoDireccion 
                                            : AreaDepartamentoDireccion.NO_ESPECIFICADO;
  updatedUser.puesto = typeof updatedUser.puesto === 'string' ? updatedUser.puesto.trim() : 'No especificado';
  if (updatedUser.puesto === '') updatedUser.puesto = 'No especificado';

  if ('claveElector' in updatedUser) {
    delete updatedUser.claveElector;
  }
  
  updatedUser.email = typeof updatedUser.email === 'string' ? updatedUser.email.trim() : '';
  updatedUser.registrationToken = updatedUser.registrationToken || undefined;
  updatedUser.registrationTokenExpiry = updatedUser.registrationTokenExpiry || undefined;
  
  updatedUser.hasLoggedInOnce = typeof updatedUser.hasLoggedInOnce === 'boolean' ? updatedUser.hasLoggedInOnce : false;

  updatedUser.sexo = updatedUser.sexo && ALL_USER_SEX.includes(updatedUser.sexo as UserSex)
                     ? updatedUser.sexo
                     : UserSex.MASCULINO; 

  if (updatedUser.antiguedad !== undefined && typeof updatedUser.antiguedad !== 'number') {
    const parsedAntiguedad = parseInt(String(updatedUser.antiguedad), 10);
    updatedUser.antiguedad = isNaN(parsedAntiguedad) || parsedAntiguedad < 0 ? undefined : parsedAntiguedad;
  } else if (typeof updatedUser.antiguedad === 'number' && updatedUser.antiguedad < 0) {
    updatedUser.antiguedad = undefined;
  }

  if (updatedUser.educationalLevel && ALL_EDUCATIONAL_LEVELS.includes(updatedUser.educationalLevel as EducationalLevel)) {
    // Value is already valid, do nothing
  } else {
    updatedUser.educationalLevel = EducationalLevel.BASICA;
  }

  // Ensure new eligibility fields
  updatedUser.eligibilitySelfDeclaration = updatedUser.eligibilitySelfDeclaration || {};
  updatedUser.adminEligibilityVerification = updatedUser.adminEligibilityVerification || {};
  updatedUser.isEligibleForVoting = typeof updatedUser.isEligibleForVoting === 'boolean' ? updatedUser.isEligibleForVoting : false;
  
  updatedUser.hasRevokedCandidacyPreviously = typeof updatedUser.hasRevokedCandidacyPreviously === 'boolean' ? updatedUser.hasRevokedCandidacyPreviously : false;

  // Ensure new additional profile fields
  updatedUser.celular = updatedUser.celular || undefined;
  updatedUser.telefonoExtension = updatedUser.telefonoExtension || undefined;
  updatedUser.consideracionesParticulares = updatedUser.consideracionesParticulares || undefined;
  updatedUser.descripcionAdicional = updatedUser.descripcionAdicional || undefined;
  updatedUser.doctoradoTitulo = updatedUser.doctoradoTitulo || undefined;
  updatedUser.maestriaTitulo = updatedUser.maestriaTitulo || undefined;
  updatedUser.licenciaturaTitulo = updatedUser.licenciaturaTitulo || undefined;
  updatedUser.diplomadoTitulo = updatedUser.diplomadoTitulo || undefined;
  updatedUser.claveCentroTrabajo = updatedUser.claveCentroTrabajo || undefined;
  updatedUser.nombreCentroTrabajo = updatedUser.nombreCentroTrabajo || undefined;
  updatedUser.entidadCentroTrabajo = updatedUser.entidadCentroTrabajo || undefined;
  updatedUser.municipioCentroTrabajo = updatedUser.municipioCentroTrabajo || undefined;
  updatedUser.localidadCentroTrabajo = updatedUser.localidadCentroTrabajo || undefined;
  updatedUser.tipoCentroTrabajo = updatedUser.tipoCentroTrabajo || undefined;
  updatedUser.servicioEducativoCentroTrabajo = updatedUser.servicioEducativoCentroTrabajo || undefined;
  updatedUser.sostenimientoCentroTrabajo = updatedUser.sostenimientoCentroTrabajo || undefined;
  updatedUser.subcontrolCentroTrabajo = updatedUser.subcontrolCentroTrabajo || undefined;
  updatedUser.turnoCentroTrabajo = updatedUser.turnoCentroTrabajo || undefined;
  
  // Conceptual: Backend would handle hashing. Frontend stores passwordDigest as is for mock.
  // updatedUser.passwordDigest = updatedUser.passwordDigest || ''; 

  return updatedUser as User;
};

const ensureElectionSettingsFields = (settings: any): ElectionSettings => {
  const updatedSettings = { ...settings };
  updatedSettings.nominationPeriod = updatedSettings.nominationPeriod || null;
  updatedSettings.votingPeriod = updatedSettings.votingPeriod || null;
  updatedSettings.allowOverlap = typeof updatedSettings.allowOverlap === 'boolean' ? updatedSettings.allowOverlap : false;
  return updatedSettings as ElectionSettings;
};

const ensureBlockSettingsFields = (settings: any): AllBlockSettings => {
  const defaultBlockSettings: AllBlockSettings = {} as AllBlockSettings;
  ALL_CANDIDATE_BLOCKS.forEach(block => {
    defaultBlockSettings[block] = { 
      isActive: true, 
      candidateCountAtNominationEnd: undefined 
    };
  });

  if (!settings || typeof settings !== 'object') return defaultBlockSettings;

  const ensuredSettings: AllBlockSettings = { ...defaultBlockSettings };
  for (const block of ALL_CANDIDATE_BLOCKS) {
    if (settings[block] && typeof settings[block] === 'object') {
      ensuredSettings[block] = {
        isActive: typeof settings[block].isActive === 'boolean' ? settings[block].isActive : true,
        candidateCountAtNominationEnd: typeof settings[block].candidateCountAtNominationEnd === 'number' 
                                        ? settings[block].candidateCountAtNominationEnd 
                                        : undefined,
      };
    }
  }
  return ensuredSettings;
};

// Initialize Data (Seed) - Database version

export const initializeData = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing database...');
    
    // Check if users collection exists and has data
    let users = await getFromCollection<User>(COLLECTIONS.USERS);
    
    const defaultElectionSettings: ElectionSettings = { 
      nominationPeriod: null, 
      votingPeriod: null, 
      allowOverlap: false 
    };
    
    const defaultBlockSettings: AllBlockSettings = {} as AllBlockSettings;
    ALL_CANDIDATE_BLOCKS.forEach(block => {
      defaultBlockSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
    });

    if (users.length === 0) {
      console.log('📝 Creating initial superadmin user...');
      // Conceptual: SUPERADMIN_INITIAL_DATA.passwordDigest would be a HASH if backend handled it.
      // Here, it's stored as is for the mock environment.
      const superAdminUser: User = ensureUserFields({
        ...SUPERADMIN_INITIAL_DATA, 
        profilePicUrl: undefined, 
      });
      
      await insertToCollection(COLLECTIONS.USERS, superAdminUser);
      await insertToCollection(COLLECTIONS.WHITELIST, { curp: SUPERADMIN_CURP });
      await insertToCollection(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default', ...defaultElectionSettings });
      await insertToCollection(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default', ...defaultBlockSettings });
      
      console.log('✅ Database initialized with default data');
    } else {
      console.log('🔧 Ensuring data integrity...');
      
      // Ensure superadmin exists
      const superadminIndex = users.findIndex(u => u.curp === SUPERADMIN_INITIAL_DATA.curp);
      if (superadminIndex === -1) {
        const superAdminUserToAdd: User = ensureUserFields({
          ...SUPERADMIN_INITIAL_DATA,
          profilePicUrl: undefined,
        });
        await insertToCollection(COLLECTIONS.USERS, superAdminUserToAdd);
      } else {
        const existingSuperAdmin = users[superadminIndex];
        const updatedSuperAdmin = ensureUserFields({
          ...SUPERADMIN_INITIAL_DATA, // Ensures superadmin has the default password if somehow changed directly in DB
          ...existingSuperAdmin,
          ...Object.fromEntries(
            Object.entries(SUPERADMIN_INITIAL_DATA).filter(
              ([key, value]) => value === undefined && !(key in existingSuperAdmin)
            )
          )
        });
        await updateInCollection(COLLECTIONS.USERS, { curp: SUPERADMIN_INITIAL_DATA.curp }, updatedSuperAdmin);
      }
      
      // Ensure all users have proper field structure
      for (const user of users) {
        const ensuredUser = ensureUserFields(user);
        if (JSON.stringify(user) !== JSON.stringify(ensuredUser)) {
          await updateInCollection(COLLECTIONS.USERS, { curp: user.curp }, ensuredUser);
        }
      }

      // Ensure whitelist includes superadmin
      const whitelistDocs = await getFromCollection<{ curp: string }>(COLLECTIONS.WHITELIST);
      const whitelistCurps = whitelistDocs.map(doc => doc.curp);
      if (!whitelistCurps.includes(SUPERADMIN_CURP)) {
        await insertToCollection(COLLECTIONS.WHITELIST, { curp: SUPERADMIN_CURP });
      }

      // Ensure settings exist
      const electionSettings = await getFromCollection<ElectionSettings & { _id?: string }>(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default'});
      if (electionSettings.length === 0) {
        await insertToCollection(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default', ...defaultElectionSettings });
      } else {
        const currentSettings = electionSettings[0];
        const ensuredSettings = ensureElectionSettingsFields(currentSettings);
        if (JSON.stringify(currentSettings) !== JSON.stringify(ensuredSettings)) {
          const { _id, ...settingsToSave } = ensuredSettings as ElectionSettings & { _id?: string };
          await updateInCollection(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default' }, settingsToSave);
        }
      }

      const blockSettingsDocs = await getFromCollection<AllBlockSettings & { _id?: string }>(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default' });
      if (blockSettingsDocs.length === 0) {
        await insertToCollection(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default', ...defaultBlockSettings });
      } else {
        const currentBlockSettings = blockSettingsDocs[0];
        const ensuredBlockSettings = ensureBlockSettingsFields(currentBlockSettings);
        if (JSON.stringify(currentBlockSettings) !== JSON.stringify(ensuredBlockSettings)) {
           const { _id, ...settingsToSave } = ensuredBlockSettings as AllBlockSettings & { _id?: string };
          await updateInCollection(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default' }, settingsToSave);
        }
      }
    }
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// User Management
export const getUsers = async (): Promise<User[]> => {
  const users = await getFromCollection<User>(COLLECTIONS.USERS);
  return users.map(user => ensureUserFields(user));
};

export const getUserByCurp = async (curp: string): Promise<User | undefined> => {
  const users = await getFromCollection<User>(COLLECTIONS.USERS, { curp });
  return users.length > 0 ? ensureUserFields(users[0]) : undefined;
};

export const updateUser = async (updatedUserInput: User): Promise<void> => {
  const userPayload = ensureUserFields(updatedUserInput); 
  // Conceptual: If passwordDigest is being updated by an admin and it's plain text,
  // the backend would hash it before saving.
  await updateInCollection(COLLECTIONS.USERS, { curp: userPayload.curp }, userPayload);
};


export const addUser = async (
  // Expect plainPassword if adding a new user who needs a password set
  userData: Omit<User, 'id' | 'votesCast' | 'profilePicUrl' | 'canChangeBlock' | 'peerNominations' | 'hasPendingPeerNominationDecision' | 'registrationToken' | 'registrationTokenExpiry' | 'nominationsMade' | 'hasLoggedInOnce' | 'eligibilitySelfDeclaration' | 'adminEligibilityVerification' | 'isEligibleForVoting' | 'hasRevokedCandidacyPreviously' | 'celular' | 'telefonoExtension' | 'consideracionesParticulares' | 'descripcionAdicional' | 'doctoradoTitulo' | 'maestriaTitulo' | 'licenciaturaTitulo' | 'diplomadoTitulo' | 'claveCentroTrabajo' | 'nombreCentroTrabajo' | 'entidadCentroTrabajo' | 'municipioCentroTrabajo' | 'localidadCentroTrabajo' | 'tipoCentroTrabajo' | 'servicioEducativoCentroTrabajo' | 'sostenimientoCentroTrabajo' | 'subcontrolCentroTrabajo' | 'turnoCentroTrabajo' | 'passwordDigest'> 
  & { password?: string } // password is plain text for backend to hash
  & Partial<Pick<User, 'celular' | 'telefonoExtension' | 'consideracionesParticulares' | 'descripcionAdicional' | 'doctoradoTitulo' | 'maestriaTitulo' | 'licenciaturaTitulo' | 'diplomadoTitulo' | 'claveCentroTrabajo' | 'nombreCentroTrabajo' | 'entidadCentroTrabajo' | 'municipioCentroTrabajo' | 'localidadCentroTrabajo' | 'tipoCentroTrabajo' | 'servicioEducativoCentroTrabajo' | 'sostenimientoCentroTrabajo' | 'subcontrolCentroTrabajo' | 'turnoCentroTrabajo'>>
): Promise<User> => {  // Import password service functions using dynamic import (ES modules)
  const passwordService = await import('./passwordService');
  const { hashPassword } = passwordService;

  // Hash the password with bcrypt if provided, otherwise use empty string
  const hashedPassword = userData.password ? await hashPassword(userData.password) : "";
  
  const { password: _, ...restUserData } = userData;
  const newUserPreEnsured = {
    ...restUserData,
    id: userData.curp, // Use CURP as ID
    passwordDigest: hashedPassword, // Store the bcrypt-hashed password
    votesCast: {},
    profilePicUrl: undefined,
    canChangeBlock: false,
    peerNominations: [],
    hasPendingPeerNominationDecision: false,
    registrationToken: undefined,
    registrationTokenExpiry: undefined,
    nominationsMade: {},
    hasLoggedInOnce: false,
    eligibilitySelfDeclaration: {},
    adminEligibilityVerification: {},
    isEligibleForVoting: false,
    hasRevokedCandidacyPreviously: false,
    celular: userData.celular || undefined,
    telefonoExtension: userData.telefonoExtension || undefined,
    consideracionesParticulares: userData.consideracionesParticulares || undefined,
    descripcionAdicional: userData.descripcionAdicional || undefined,
    doctoradoTitulo: userData.doctoradoTitulo || undefined,
    maestriaTitulo: userData.maestriaTitulo || undefined,
    licenciaturaTitulo: userData.licenciaturaTitulo || undefined,
    diplomadoTitulo: userData.diplomadoTitulo || undefined,
    claveCentroTrabajo: userData.claveCentroTrabajo || undefined,
    nombreCentroTrabajo: userData.nombreCentroTrabajo || undefined,
    entidadCentroTrabajo: userData.entidadCentroTrabajo || undefined,
    municipioCentroTrabajo: userData.municipioCentroTrabajo || undefined,
    localidadCentroTrabajo: userData.localidadCentroTrabajo || undefined,
    tipoCentroTrabajo: userData.tipoCentroTrabajo || undefined,
    servicioEducativoCentroTrabajo: userData.servicioEducativoCentroTrabajo || undefined,
    sostenimientoCentroTrabajo: userData.sostenimientoCentroTrabajo || undefined,
    subcontrolCentroTrabajo: userData.subcontrolCentroTrabajo || undefined,
    turnoCentroTrabajo: userData.turnoCentroTrabajo || undefined,  };
  const newUserToSave: User = ensureUserFields(newUserPreEnsured);
  
  await insertToCollection<User & { _id?:string }>(
    COLLECTIONS.USERS, 
    newUserToSave
  );
  
  return newUserToSave;
};


export const deleteUser = async (userId: string): Promise<void> => {
  await deleteFromCollection(COLLECTIONS.USERS, { id: userId });
};

// Password Management
export const changePassword = async (curp: string, currentPasswordPlain: string, newPasswordPlain: string): Promise<{success: boolean, message: string}> => {
  try {
    const user = await getUserByCurp(curp);
    if (!user) {
      return { success: false, message: "Usuario no encontrado." };
    }

    // Importar servicios de contraseña
    const { comparePassword, hashPassword } = await import('./passwordService');

    // Verificar la contraseña actual
    const isPasswordCorrect = await comparePassword(currentPasswordPlain, user.passwordDigest);
    if (!isPasswordCorrect) {
      return { success: false, message: "La contraseña actual es incorrecta." };
    }
    
    // Cifrar la nueva contraseña con bcrypt
    const hashedPassword = await hashPassword(newPasswordPlain);
    
    // Actualizar usuario con la nueva contraseña cifrada
    const updatedUser = {
      ...user,
      passwordDigest: hashedPassword
    };
    await updateUser(updatedUser);
    return { success: true, message: "Contraseña actualizada exitosamente." };
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    return { success: false, message: "Error al cambiar la contraseña. Intenta de nuevo." };
  }
};


// Password Recovery Functions
export const getUserEmailsByCurp = async (curp: string): Promise<string[]> => {
  const users = await getFromCollection<User>(COLLECTIONS.USERS, { curp });
  const userEmails = users
    .filter(u => u.email && u.email.trim() !== '')
    .map(u => u.email);
  
  // Remove duplicates
  return [...new Set(userEmails)];
};

export const setPasswordResetToken = async (curp: string, token: string, expiryMinutes: number = 30): Promise<boolean> => {
  const user = await getUserByCurp(curp);
  if (!user) return false;
  
  const expiry = Date.now() + expiryMinutes * 60 * 1000;
  const updatedUser = {
    ...user,
    registrationToken: token,
    registrationTokenExpiry: expiry
  };
  
  await updateUser(updatedUser);
  return true;
};

export const validatePasswordResetToken = async (curp: string, token: string): Promise<{ valid: boolean; expired?: boolean; user?: User }> => {
  const user = await getUserByCurp(curp);
  
  if (!user || !user.registrationToken || !user.registrationTokenExpiry) {
    return { valid: false };
  }
  
  if (user.registrationToken !== token) {
    return { valid: false };
  }
  
  if (Date.now() > user.registrationTokenExpiry) {
    return { valid: false, expired: true };
  }
  
  return { valid: true, user };
};

export const resetPassword = async (curp: string, token: string, newPasswordPlain: string): Promise<{ success: boolean; message: string }> => {
  try {
    const validation = await validatePasswordResetToken(curp, token);
    
    if (!validation.valid) {
      if (validation.expired) {
        return { success: false, message: 'El código de verificación ha expirado. Solicita uno nuevo.' };
      }
      return { success: false, message: 'Código de verificación inválido.' };
    }
    
    if (!validation.user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    
    // Importar servicio de hash
    const { hashPassword } = await import('./passwordService');
    
    // Cifrar la nueva contraseña con bcrypt
    const hashedPassword = await hashPassword(newPasswordPlain);
    
    // Actualizar usuario con la nueva contraseña cifrada
    const updatedUser = {
      ...validation.user,
      passwordDigest: hashedPassword,
      registrationToken: undefined,
      registrationTokenExpiry: undefined
    };
    
    await updateUser(updatedUser);
    return { success: true, message: 'Contraseña actualizada exitosamente.' };
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return { success: false, message: `Error al restablecer la contraseña: ${error instanceof Error ? error.message : String(error)}` };
  }
};

// Whitelist Management (CURP-based)
export const getWhitelist = async (): Promise<string[]> => {
  const whitelistDocs = await getFromCollection<{ curp: string }>(COLLECTIONS.WHITELIST);
  return whitelistDocs.map(doc => doc.curp);
};

export const addToWhitelist = async (curp: string): Promise<void> => {
  try {
    const upperCurp = curp.toUpperCase();
    const existingDocs = await getFromCollection<{ curp: string }>(COLLECTIONS.WHITELIST, { curp: upperCurp });
    
    if (existingDocs.length === 0) {
      await insertToCollection(COLLECTIONS.WHITELIST, { curp: upperCurp });
    }
  } catch (error) {
    console.error('Error al añadir a la lista blanca:', error);
    throw new Error(`No se pudo añadir a la lista blanca: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const removeFromWhitelist = async (curp: string): Promise<void> => {
  const upperCurp = curp.toUpperCase();
  await deleteFromCollection(COLLECTIONS.WHITELIST, { curp: upperCurp });
};

export const isWhitelisted = async (curp: string): Promise<boolean> => {
  const whitelist = await getWhitelist();
  return whitelist.includes(curp.toUpperCase());
};

/**
 * Validates a CURP using the external RENAPO API
 * This replaces the whitelist-based validation system
 * @param curp The CURP to validate
 * @returns Promise<boolean> true if CURP is valid
 */
export const validateCurpWithApi = async (curp: string): Promise<{
  isValid: boolean;
  userData?: UserDataFromCurp;
  error?: string;
}> => {
  try {
    console.log('[DATABASE_SERVICE] Validating CURP with API:', curp);
    
    // Use the CURP validation service
    const validationResult = await curpValidationService.validateCurp(curp);
    
    if (validationResult.success && validationResult.data) {
      // Extract user data from validation result
      const userData = curpValidationService.extractUserDataFromValidation(
        validationResult, 
        '' // Email will be provided separately during registration
      );
      
      console.log('[DATABASE_SERVICE] CURP validation successful:', {
        curp,
        hasUserData: !!userData
      });
      
      return {
        isValid: true,
        userData: userData || undefined
      };
    } else {
      console.log('[DATABASE_SERVICE] CURP validation failed:', {
        curp,
        error: validationResult.error,
        message: validationResult.message
      });
      
      return {
        isValid: false,
        error: validationResult.message || validationResult.error || 'CURP no válido'
      };
    }
  } catch (error) {
    console.error('[DATABASE_SERVICE] Error validating CURP:', error);
    return {
      isValid: false,
      error: 'Error al validar CURP. Intente más tarde.'
    };
  }
};

/**
 * Checks if a CURP is eligible for registration
 * This function can be used to maintain existing API compatibility
 * while switching from whitelist to CURP validation
 * @param curp The CURP to check
 * @returns Promise<boolean>
 */
export const isCurpEligibleForRegistration = async (curp: string): Promise<boolean> => {
  // For superadmin, always allow (maintain existing functionality)
  if (curp.toUpperCase() === SUPERADMIN_CURP) {
    return true;
  }
  
  // For all other users, validate using the CURP API
  const validation = await validateCurpWithApi(curp);
  return validation.isValid;
};

// Post Management
export const getPosts = async (): Promise<Post[]> => {
  const posts = await getFromCollection<Post>(COLLECTIONS.POSTS);
  return posts.map(post => ({
    ...post,
    likes: post.likes || [],
    dislikes: post.dislikes || [],
    videoFileName: post.videoFileName || undefined,
    videoDuration: post.videoDuration || undefined,
    videoDataUrl: post.videoDataUrl || undefined,
    // transientVideoFile will be undefined here, which is correct
  }));
};

export const getPostsByCandidate = async (candidateId: string): Promise<Post[]> => {
  const posts = await getFromCollection<Post>(COLLECTIONS.POSTS, { authorId: candidateId });
  return posts
    .map(post => ({
      ...post,
      likes: post.likes || [],
      dislikes: post.dislikes || [],
      videoFileName: post.videoFileName || undefined,
      videoDuration: post.videoDuration || undefined,
      videoDataUrl: post.videoDataUrl || undefined,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const addPost = async (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'transientVideoFile'> & { transientVideoFile?: File }): Promise<Post> => {
  // Create a new object for storage, excluding transientVideoFile
  const { transientVideoFile, ...storablePostData } = postData;
  const newPostForStorage: Omit<Post, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'transientVideoFile'> = {
    ...storablePostData,
    videoFileName: storablePostData.videoFileName || undefined,
    videoDuration: storablePostData.videoDuration || undefined,
    videoDataUrl: storablePostData.videoDataUrl || undefined,
  };

  const newPostWithTimestamp: Post = {
    ...newPostForStorage,
    id: generateId(),
    timestamp: Date.now(),
    likes: [],
    dislikes: [],
    transientVideoFile: transientVideoFile, // Keep it for the in-memory object
  };
  
  // Add the version *without* transientVideoFile to database
  const postForDatabase = { ...newPostWithTimestamp };
  delete postForDatabase.transientVideoFile;
  
  await insertToCollection<Post & { _id?:string }>(COLLECTIONS.POSTS, postForDatabase);
  
  return newPostWithTimestamp; // Return the full object for immediate use in UI
};

export const updatePostReactions = async (postId: string, userId: string, reactionType: 'like' | 'dislike'): Promise<Post | undefined> => {
  const posts = await getFromCollection<Post>(COLLECTIONS.POSTS, { id: postId });
  if (posts.length === 0) return undefined;

  const post = posts[0];
  
  // Remove user from both arrays first
  post.likes = (post.likes || []).filter(uid => uid !== userId);
  post.dislikes = (post.dislikes || []).filter(uid => uid !== userId);

  // Add to appropriate array
  if (reactionType === 'like') {
    post.likes.push(userId);
  } else {
    post.dislikes.push(userId);
  }
  
  // Update in database
  const updateData = { 
    likes: post.likes, 
    dislikes: post.dislikes 
  };
  await updateInCollection(COLLECTIONS.POSTS, { id: postId }, updateData);
  
  return post;
};

export const deletePost = async (postId: string): Promise<void> => {
  await deleteFromCollection(COLLECTIONS.POSTS, { id: postId });
};

// Vote Management
export const getVotes = async (): Promise<VoteRecord[]> => {
  return await getFromCollection<VoteRecord>(COLLECTIONS.VOTES);
};

export const addVote = async (voterId: string, candidateId: string, blockOfCandidacy: CandidateBlock): Promise<VoteRecord | null> => {
  const voter = await getUserByCurp(voterId);
  if (!voter || (voter.votesCast && voter.votesCast[blockOfCandidacy])) {
    return null;
  }

  const newVote: VoteRecord = {
    id: generateId(),
    voterId,
    candidateId,
    blockOfCandidacy,
    timestamp: Date.now(),
  };
  
  await insertToCollection<VoteRecord & { _id?:string }>(COLLECTIONS.VOTES, newVote);

  // Update voter's votesCast
  if (!voter.votesCast) {
    voter.votesCast = {};
  }
  voter.votesCast[blockOfCandidacy] = candidateId;
  await updateUser(voter);
  
  return newVote;
};

export const getVotesForCandidate = async (candidateId: string): Promise<VoteRecord[]> => {
  return await getFromCollection<VoteRecord>(COLLECTIONS.VOTES, { candidateId });
};

// Auth Session Management
export const getAuthSession = async (curp: string): Promise<AuthSession | null> => {
  const sessions = await getFromCollection<AuthSession>(COLLECTIONS.AUTH_SESSIONS, { curp, active: true });
  return sessions.length > 0 ? sessions[0] : null;
};

export const setAuthSession = async (curp: string, sessionId: string): Promise<void> => {
  // Invalidate previous sessions for this user
  await updateInCollection(COLLECTIONS.AUTH_SESSIONS, { curp, active: true }, { active: false });
  
  // Create new active session
  const newSession: Omit<AuthSession, '_id'> = {
    curp,
    sessionId,
    active: true,
    timestamp: Date.now()
  };
  await insertToCollection(COLLECTIONS.AUTH_SESSIONS, newSession);
};

export const clearAuthSession = async (curp: string, sessionId?: string): Promise<void> => {
  const query: any = { curp, active: true };
  if (sessionId) {
    query.sessionId = sessionId;
  }
  await updateInCollection(COLLECTIONS.AUTH_SESSIONS, query, { active: false });
};


// --- Nomination System Functions ---
const isVotingPeriodActiveNow = async (): Promise<boolean> => {
  const settings = await getElectionSettings();
  if (!settings.votingPeriod?.startDate || !settings.votingPeriod?.endDate) return false;
  
  // Obtener la fecha actual en UTC de manera más robusta
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));  const startDateObj = isoToDateUTC(settings.votingPeriod.startDate);
  const endDateObj = isoToDateUTC(settings.votingPeriod.endDate);
  
  // Usamos comparaciones más robustas con timestamps para evitar problemas de precisión
  const currentDayStart = todayUTC.getTime();
  const periodStart = startDateObj.getTime();
  const periodEnd = endDateObj.getTime();
  
  // La fecha actual debe estar dentro del rango de fechas del período
  const isActive = currentDayStart >= periodStart && currentDayStart <= periodEnd;
  
  // Debug para períodos de un solo día
  if (process.env.NODE_ENV === 'development' && settings.votingPeriod.startDate === settings.votingPeriod.endDate) {
    console.log(`[DEBUG databaseService] Período de votación de un día (${settings.votingPeriod.startDate}):`);
    console.log(`  isActive: ${isActive}`);
    console.log(`  currentDayStart: ${currentDayStart}, periodStart: ${periodStart}, periodEnd: ${periodEnd}`);
  }
  
  return isActive;
};

export const selfNominateAsCandidate = async (userCurp: string, selfDeclarationAnswers: EligibilityAnswers): Promise<{ success: boolean; message: string; user?: User }> => {
  const user = await getUserByCurp(userCurp);
  if (!user) return { success: false, message: "Usuario no encontrado." };

  if (user.hasRevokedCandidacyPreviously) {
    return { success: false, message: "Ya no puedes postularte como candidato después de haber retirado tu candidatura previamente en este proceso electoral." };
  }
  if (!(await isWhitelisted(userCurp))) return { success: false, message: "Tu CURP no está en la lista blanca. No puedes postularte." };
  if (user.role === UserRole.SUPERADMIN) return { success: false, message: "Un Superadministrador no puede postularse." };
  
  if ((user.antiguedad === undefined || user.antiguedad < 1)) { 
    return { success: false, message: "Debes tener al menos 1 año de antigüedad en el servicio público para postularte." };
  }

  user.eligibilitySelfDeclaration = selfDeclarationAnswers;
  user.isRegisteredAsCandidate = true;
  if (user.role === UserRole.USER) {
    user.role = UserRole.CANDIDATE;
  }
  user.peerNominations = []; 
  user.hasPendingPeerNominationDecision = false;
  user.isEligibleForVoting = false; 
  await updateUser(user);
  return { success: true, message: "¡Te has postulado como candidato! Un administrador revisará tu elegibilidad.", user };
};

export const revokeCandidacy = async (userCurp: string): Promise<{ success: boolean; message: string; user?: User }> => {
  const user = await getUserByCurp(userCurp);
  if (!user || user.role === UserRole.SUPERADMIN) {
      return { success: false, message: "Usuario no encontrado o no aplicable." };
  }

  if (await isVotingPeriodActiveNow()) {
    return { success: false, message: "No se puede retirar la candidatura. El periodo de votación está actualmente activo." };
  }

  user.isRegisteredAsCandidate = false;
  if (user.role === UserRole.CANDIDATE) {
    user.role = UserRole.USER;
  }
  user.peerNominations = []; 
  user.hasPendingPeerNominationDecision = false;
  user.eligibilitySelfDeclaration = {}; 
  user.adminEligibilityVerification = {};
  user.isEligibleForVoting = false;
  user.hasRevokedCandidacyPreviously = true; 
  await updateUser(user);

  // Send notification to superadministrator about candidacy withdrawal
  try {
    await sendCandidacyWithdrawalNotification(user);
  } catch (error) {
    console.error('Error sending candidacy withdrawal notification:', error);
    // Don't fail the withdrawal if email fails
  }
  return { 
    success: true, 
    message: "Candidatura retirada con éxito. Se ha enviado una notificación al superadministrador. IMPORTANTE: Debes enviar un oficio formal solicitando tu declinación a la presidencia dentro de los próximos 3 días hábiles para completar el proceso.", 
    user 
  };
};

export const addPeerNomination = async (nominatorCurp: string, nomineeCurp: string): Promise<{ success: boolean; message: string; nominee?: User }> => {
  let nominator = await getUserByCurp(nominatorCurp);
  const nominee = await getUserByCurp(nomineeCurp);

  if (!nominator || !nominee) return { success: false, message: "Nominador o nominado no encontrado." };

  if (nominee.hasRevokedCandidacyPreviously) {
    return { success: false, message: `El usuario ${nominee.nombre} ${nominee.apellidoPaterno} retiró su candidatura previamente y ya no puede ser nominado en este proceso electoral.`, nominee };
  }
  if (nominator.curp === nominee.curp) return { success: false, message: "No puedes nominarte a ti mismo de esta forma." };
  if (nominator.assignedBlock !== nominee.assignedBlock) return { success: false, message: "Solo puedes nominar a colegas de tu mismo bloque." };
  if (!(await isWhitelisted(nominee.curp))) return { success: false, message: "El usuario nominado no está en la lista blanca." };
  if (!nominee.hasLoggedInOnce) return { success: false, message: "El usuario nominado aún no ha iniciado sesión y no puede ser nominado." };
  if (nominee.isRegisteredAsCandidate) return { success: false, message: "Este usuario ya es un candidato." };
  if (nominee.role === UserRole.SUPERADMIN) return { success: false, message: "No se puede nominar a un Superadministrador." };
  
  if ((nominee.antiguedad === undefined || nominee.antiguedad < 12)) { 
    return { success: false, message: `El usuario ${nominee.nombre} ${nominee.apellidoPaterno} necesita tener al menos 12 meses de antigüedad en el servicio público (registrado en su perfil) para poder ser nominado.`, nominee };
  }

  if (nominator.nominationsMade && nominator.nominationsMade[nominee.assignedBlock]) {
    const alreadyNominatedUserCurp = nominator.nominationsMade[nominee.assignedBlock];
    if (alreadyNominatedUserCurp === nomineeCurp) {
        return { success: false, message: `Ya has nominado a ${nominee.nombre} ${nominee.apellidoPaterno} para el bloque ${nominee.assignedBlock}.`, nominee };
    }
    const previouslyNominatedUser = alreadyNominatedUserCurp ? await getUserByCurp(alreadyNominatedUserCurp) : undefined;
    const prevNomineeName = previouslyNominatedUser ? `${previouslyNominatedUser.nombre} ${previouslyNominatedUser.apellidoPaterno}` : `CURP ${alreadyNominatedUserCurp}`;
    return { success: false, message: `Ya has utilizado tu nominación para el bloque ${nominee.assignedBlock} (nominaste a ${prevNomineeName}). Solo puedes nominar a una persona por bloque.`, nominee };
  }

  if (nominee.peerNominations.some(pn => pn.nominatorId === nominatorCurp)) {
      return { success: false, message: `Ya has enviado una nominación a ${nominee.nombre} ${nominee.apellidoPaterno}.`, nominee };
  }
  const newNomination: PeerNomination = { nominatorId: nominatorCurp, timestamp: Date.now() };
  nominee.peerNominations.push(newNomination);
  
  // AUTO-ELIGIBILITY: Automatically register whitelisted users as candidates
  // No need for pending decision since they're automatically eligible
  nominee.hasPendingPeerNominationDecision = false;
  nominee.isRegisteredAsCandidate = true;
  if (nominee.role === UserRole.USER) {
    nominee.role = UserRole.CANDIDATE;
  }
  // Set as eligible for voting since they're whitelisted and meet requirements
  nominee.isEligibleForVoting = true;
  
  await updateUser(nominee);

  if (!nominator.nominationsMade) {
    nominator.nominationsMade = {};
  }
  nominator.nominationsMade[nominee.assignedBlock] = nominee.curp;
  await updateUser(nominator);
  
  return { success: true, message: `${nominee.nombre} ${nominee.apellidoPaterno} ha sido nominado y automáticamente registrado como candidato elegible. Has utilizado tu nominación para el bloque ${nominee.assignedBlock}.`, nominee };
};

export const acceptPeerNomination = async (nomineeCurp: string, selfDeclarationAnswers: EligibilityAnswers): Promise<{ success: boolean; message: string; user?: User }> => {
  const nominee = await getUserByCurp(nomineeCurp);
  if (!nominee) return { success: false, message: "Nominado no encontrado." };

  if (nominee.hasRevokedCandidacyPreviously) {
    nominee.hasPendingPeerNominationDecision = false; 
    nominee.peerNominations = [];
    await updateUser(nominee);
    return { success: false, message: "No puedes aceptar la postulación porque retiraste tu candidatura previamente en este proceso electoral." };
  }
  if (!nominee.hasPendingPeerNominationDecision || nominee.peerNominations.length === 0) return { success: false, message: "No tienes nominaciones pendientes o ya has tomado una decisión." };
  if (!(await isWhitelisted(nomineeCurp))) { 
      nominee.hasPendingPeerNominationDecision = false; 
      nominee.peerNominations = [];
      await updateUser(nominee);
      return { success: false, message: "Tu CURP no está en la lista blanca. No puedes aceptar la postulación." }; 
  }
  if (nominee.role !== UserRole.SUPERADMIN && (nominee.antiguedad === undefined || nominee.antiguedad < 1)) { 
    return { success: false, message: "Debes tener al menos 1 año de antigüedad en el servicio público (registrado en tu perfil) para aceptar la postulación." };
  }

  nominee.eligibilitySelfDeclaration = selfDeclarationAnswers;
  nominee.isRegisteredAsCandidate = true;
  if (nominee.role === UserRole.USER) {
    nominee.role = UserRole.CANDIDATE;
  }
  nominee.hasPendingPeerNominationDecision = false;
  nominee.isEligibleForVoting = false; 
  await updateUser(nominee);
  return { success: true, message: "¡Has aceptado la postulación y ahora eres candidato! Un administrador revisará tu elegibilidad.", user: nominee };
};

export const rejectPeerNomination = async (nomineeCurp: string): Promise<User | null> => {
  const nominee = await getUserByCurp(nomineeCurp);
  if (!nominee) return null;

  const blockOfNomination = nominee.assignedBlock; 

  // Update nominators
  for (const pn of nominee.peerNominations) {
    const nominator = await getUserByCurp(pn.nominatorId);
    if (nominator && nominator.nominationsMade && nominator.nominationsMade[blockOfNomination] === nomineeCurp) {
      delete nominator.nominationsMade[blockOfNomination];
      await updateUser(nominator);
    }
  }

  nominee.peerNominations = []; 
  nominee.hasPendingPeerNominationDecision = false;
  nominee.eligibilitySelfDeclaration = {}; 
  await updateUser(nominee);
  return nominee;
};

export const getNominatableUsersInBlock = async (block: CandidateBlock, currentUserCurp: string): Promise<User[]> => {
  const allUsers = await getUsers();
  const currentUser = await getUserByCurp(currentUserCurp);

  if (currentUser && currentUser.nominationsMade && currentUser.nominationsMade[block]) {
    return []; 
  }

  const filteredUsers = [];
  for (const user of allUsers) {
    if (user.curp !== currentUserCurp &&
        user.assignedBlock === block &&
        await isWhitelisted(user.curp) &&
        user.hasLoggedInOnce && 
        !user.isRegisteredAsCandidate && 
        user.role !== UserRole.SUPERADMIN && 
        !user.hasRevokedCandidacyPreviously && 
        !user.peerNominations.some(pn => pn.nominatorId === currentUserCurp) && 
        (user.antiguedad !== undefined && user.antiguedad >= 1)) {
      filteredUsers.push(user);
    }
  }
  
  return filteredUsers;
};

// --- Election Settings Functions ---
export const getElectionSettings = async (): Promise<ElectionSettings> => {
  const settings = await getFromCollection<ElectionSettings & { _id: string }>(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default' });
  if (settings.length === 0) {
    const defaultSettings = { nominationPeriod: null, votingPeriod: null, allowOverlap: false };
    await insertToCollection(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default', ...defaultSettings });
    return defaultSettings;
  }
  return ensureElectionSettingsFields(settings[0]);
};

export const saveElectionSettings = async (settingsData: ElectionSettings): Promise<void> => {
  const settings = ensureElectionSettingsFields(settingsData);
  // Ensure _id is not part of the update payload itself for $set operations
  const { _id, ...settingsToSave } = settings as ElectionSettings & { _id?: string };
  await updateInCollection(COLLECTIONS.ELECTION_SETTINGS, { _id: 'default' }, settingsToSave);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('electionSettingsChanged'));
  }
};

// --- Block Settings Functions ---
export const getBlockSettings = async (): Promise<AllBlockSettings> => {
  const settings = await getFromCollection<AllBlockSettings & { _id: string }>(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default' });
  
  if (settings.length === 0) {
    const defaultBlockSettings: AllBlockSettings = {} as AllBlockSettings;
    ALL_CANDIDATE_BLOCKS.forEach(block => {
      defaultBlockSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
    });
    await insertToCollection(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default', ...defaultBlockSettings });
    return defaultBlockSettings;
  }
  
  return ensureBlockSettingsFields(settings[0]);
};

export const saveBlockSettings = async (settingsData: AllBlockSettings): Promise<void> => {
  const settings = ensureBlockSettingsFields(settingsData);
  const { _id, ...settingsToSave } = settings as AllBlockSettings & { _id?: string };
  await updateInCollection(COLLECTIONS.BLOCK_SETTINGS, { _id: 'default' }, settingsToSave);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blockSettingsChanged'));
  }
};

export const updateCandidateCountsAtNominationEnd = async (): Promise<void> => {
  const currentBlockSettings = await getBlockSettings();
  const registeredCandidates = (await getUsers()).filter(u => u.isRegisteredAsCandidate && u.role === UserRole.CANDIDATE);
  
  const candidateCounts: Partial<Record<CandidateBlock, number>> = {};
  ALL_CANDIDATE_BLOCKS.forEach(block => {
    candidateCounts[block] = 0;
  });

  registeredCandidates.forEach(candidate => {
    if (candidateCounts[candidate.assignedBlock] !== undefined) {
      candidateCounts[candidate.assignedBlock]!++;
    }
  });

  const updatedBlockSettings: AllBlockSettings = { ...currentBlockSettings };
  for (const block of ALL_CANDIDATE_BLOCKS) {
    updatedBlockSettings[block] = {
      ...currentBlockSettings[block],
      candidateCountAtNominationEnd: candidateCounts[block] ?? 0,
    };
  }
  await saveBlockSettings(updatedBlockSettings);
  console.log("Candidate counts updated after nomination period.", updatedBlockSettings);
};

// Function to get users who haven't voted
export const getUsersWhoHaveNotVoted = async (): Promise<User[]> => {
  const allUsers = await getUsers();
  const blockSettings = await getBlockSettings();
  
  // Get users who have voting rights (not superadmin and either USER or eligible CANDIDATE)
  const usersWithVotingRights = allUsers.filter(user => 
    user.role !== UserRole.SUPERADMIN && 
    (user.role === UserRole.USER || (user.role === UserRole.CANDIDATE && user.isEligibleForVoting))
  );
  
  // Get active blocks
  const activeBlocks = ALL_CANDIDATE_BLOCKS.filter(block => blockSettings[block]?.isActive);
  
  // Filter users who haven't voted in all active blocks they should vote in
  return usersWithVotingRights.filter(user => {
    const userVotes = user.votesCast || {};
    const votedBlocks = Object.keys(userVotes);
    
    // User hasn't voted if they haven't voted in any active block
    return activeBlocks.some(block => !votedBlocks.includes(block));
  });
};

// Function to automatically make whitelisted users eligible for candidacy
export const autoEligibilityForWhitelistedUsers = async (): Promise<void> => {
  const allUsers = await getUsers();
  const whitelistedUsers = [];
  
  for (const user of allUsers) {
    if (await isWhitelisted(user.curp) && !user.isRegisteredAsCandidate && user.role !== UserRole.SUPERADMIN) {
      whitelistedUsers.push(user);
    }
  }
  
  // Auto-register whitelisted users as candidates if they meet basic requirements
  for (const user of whitelistedUsers) {
    if (user.hasLoggedInOnce && user.antiguedad !== undefined && user.antiguedad >= 12) {
      user.isRegisteredAsCandidate = true;
      if (user.role === UserRole.USER) {
        user.role = UserRole.CANDIDATE;
      }
      // Set basic eligibility - admin can still review and modify
      user.isEligibleForVoting = true;
      await updateUser(user);
    }
  }
  
  console.log(`Auto-registered ${whitelistedUsers.length} whitelisted users as candidates`);
};

// Storage management utilities (adapted for database)
export const getStorageInfo = () => {
  // For database, we don't have the same quota concerns as localStorage
  // But we can provide some basic info
  return {
    used: 0,
    available: Number.MAX_SAFE_INTEGER,
    percentage: 0,
    warning: false
  };
};

// Function to clear old video data to free up storage space
export const clearOldVideoData = async (): Promise<number> => {
  try {
    const posts = await getPosts();
    let clearedCount = 0;
    
    // Sort posts by timestamp (oldest first)
    const postsWithVideos = posts
      .filter(post => post.mediaType === 'video' && (post.mediaUrl || post.videoFileName))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Clear video data from older posts (keep only the 10 most recent video posts)
    const postsToKeep = 10;
    const postsToClean = postsWithVideos.slice(0, Math.max(0, postsWithVideos.length - postsToKeep));
    
    for (const post of postsToClean) {
      // Clear video-related fields but keep the post structure
      const updatedPost = {
        ...post,
        mediaUrl: undefined,
        videoFileName: undefined,
        videoDuration: undefined,
        transientVideoFile: undefined
      };
        // Update the post in storage
      const { id, ...postUpdateData } = updatedPost;
      await updateInCollection(COLLECTIONS.POSTS, { id: updatedPost.id }, postUpdateData);
      clearedCount++;
    }
    
    return clearedCount;
  } catch (error) {
    console.error('Error clearing old video data:', error);
    return 0;
  }
};

// Function to add a passkey credential to a user
export const addPasskeyToUser = async (curp: string, passkeyCredential: {
  credentialID: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}) => {
  try {
    const user = await getUserByCurp(curp);
    if (!user) {
      throw new Error(`No se encontró el usuario con CURP: ${curp}`);
    }

    const updatedUser: User = {
      ...user,
      passkeys: [
        ...(user.passkeys || []),
        {
          ...passkeyCredential,
          createdAt: Date.now()
        }
      ],
      hasPasskeyRegistered: true
    };

    return await updateUser(updatedUser);
  } catch (error) {
    console.error('Error al agregar passkey al usuario:', error);
    throw error;
  }
};

// Function to get a user's passkey by credentialID
export const getUserByPasskeyCredentialId = async (credentialID: string) => {
  try {
    const endpoint = `${API_BASE_URL}/query/${COLLECTIONS.USERS}?query=passkeys.credentialID:${encodeURIComponent(credentialID)}`;
    const users = await apiCall<User[]>(endpoint);
    
    if (users && users.length > 0) {
      return users[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error al buscar usuario por credentialID de passkey:', error);
    throw error;
  }
};

// Function to update a passkey's counter (after successful authentication)
export const updatePasskeyCounter = async (curp: string, credentialID: string, newCounter: number) => {
  try {
    const user = await getUserByCurp(curp);
    if (!user || !user.passkeys) {
      throw new Error(`No se encontró el usuario o sus passkeys con CURP: ${curp}`);
    }

    const updatedPasskeys = user.passkeys.map(passkey => 
      passkey.credentialID === credentialID 
        ? { ...passkey, counter: newCounter }
        : passkey
    );

    const updatedUser: User = {
      ...user,
      passkeys: updatedPasskeys
    };

    return await updateUser(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el contador de passkey:', error);
    throw error;
  }
};

/**
 * Creates or updates a user from CURP validation data
 * This function handles both existing users and new users from CURP validation
 * @param userData User data from CURP validation
 * @returns Promise<User> The created or updated user
 */
export const createOrUpdateUserFromCurpValidation = async (userData: UserDataFromCurp): Promise<User> => {
  try {
    console.log('[DATABASE_SERVICE] Creating/updating user from CURP validation:', userData);
    
    // Check if user already exists
    let existingUser = await getUserByCurp(userData.curp);
    console.log('[DATABASE_SERVICE] Existing user found:', !!existingUser);
    
    if (existingUser) {
      // User exists, update with new information if needed
      const updatedUser: User = {
        ...existingUser,
        nombre: userData.nombre,
        apellidoPaterno: userData.apellidoPaterno,
        apellidoMaterno: userData.apellidoMaterno,
        email: userData.email || existingUser.email,
        fechaNacimiento: userData.fechaNacimiento || existingUser.fechaNacimiento,
        sexo: userData.sexo === 'HOMBRE' ? UserSex.MASCULINO : UserSex.FEMENINO
      };
      
      console.log('[DATABASE_SERVICE] Updating existing user');
      await updateUser(updatedUser);
      return updatedUser;
    } else {
      // Create new user
      console.log('[DATABASE_SERVICE] Creating new user');
      const newUser: User = {
        id: userData.curp, // Use CURP as ID
        curp: userData.curp,
        nombre: userData.nombre,
        apellidoPaterno: userData.apellidoPaterno,
        apellidoMaterno: userData.apellidoMaterno,
        email: userData.email,
        fechaNacimiento: userData.fechaNacimiento,
        sexo: userData.sexo === 'HOMBRE' ? UserSex.MASCULINO : UserSex.FEMENINO,
        educationalLevel: EducationalLevel.BASICA, // Default
        passwordDigest: '', // Will be set during registration
        role: UserRole.USER,
        assignedBlock: CandidateBlock.B1, // Default assignment
        isRegisteredAsCandidate: false,
        canChangeBlock: true,
        areaDepartamentoDireccion: AreaDepartamentoDireccion.NO_ESPECIFICADO,
        puesto: '',
        votesCast: {},
        peerNominations: [],
        hasPendingPeerNominationDecision: false,
        nominationsMade: {},
        hasLoggedInOnce: false
      };
      
      console.log('[DATABASE_SERVICE] Inserting user to database:', newUser.curp);
      await insertToCollection<User & { _id?: string }>(COLLECTIONS.USERS, newUser);
      console.log('[DATABASE_SERVICE] Successfully created new user from CURP validation:', userData.curp);
      
      return newUser;
    }
  } catch (error) {
    console.error('[DATABASE_SERVICE] Error creating/updating user from CURP validation:', error);
    throw error;
  }
};
