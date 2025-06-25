export enum UserRole {
  USER = 'USER',
  CANDIDATE = 'CANDIDATE',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export const ALL_USER_ROLES: UserRole[] = Object.values(UserRole);

// Permisos específicos para administradores
export enum AdminPermission {
  STATISTICS_READ = 'statistics_read',
  STATISTICS_WRITE = 'statistics_write',
  USERS_READ = 'users_read',
  USERS_WRITE = 'users_write',
  BLOCKS_READ = 'blocks_read',
  BLOCKS_WRITE = 'blocks_write',
  CALENDAR_READ = 'calendar_read',
  CALENDAR_WRITE = 'calendar_write',
  WHITELIST_READ = 'whitelist_read',
  WHITELIST_WRITE = 'whitelist_write',
  EMAILS_READ = 'emails_read',
  EMAILS_WRITE = 'emails_write',
  SETTINGS_READ = 'settings_read',
  SETTINGS_WRITE = 'settings_write',
}

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = Object.values(AdminPermission);

export type AdminPermissions = Partial<Record<AdminPermission, boolean>>;

// Estructura para administrador
export interface AdminUser {
  id: string; // CURP
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  email: string;
  passwordDigest: string;
  role: UserRole.ADMIN;
  permissions: AdminPermissions;
  createdBy: string; // CURP del superadmin que lo creó
  createdAt: number; // timestamp
  lastLogin?: number; // timestamp
  isActive: boolean;
  hasLoggedInOnce?: boolean;
  registrationToken?: string;
  registrationTokenExpiry?: number;
}

export enum CandidateBlock {
  B1 = 'B1 - Directores Generales',
  B2 = 'B2 - Directores',
  B3 = 'B3 - Subdirectores',
  B4 = 'B4 - Jefes de Departamento',
  B5 = 'B5 - Personal Operativo',
}
export const ALL_CANDIDATE_BLOCKS: CandidateBlock[] = Object.values(CandidateBlock);

export enum AreaDepartamentoDireccion {
  CDAJN = "Coordinación de Asuntos Jurídicos y Normatividad",
  CDT = "Coordinación de Tecnologías",
  CTIC = "Coordinación Técnica de Instrumentación y Calificación",
  DGA = "Dirección General de Administración",
  DGADM = "Dirección General de Admisión",
  DGP = "Dirección General de Promoción",
  DGR = "Dirección General de Reconocimiento",
  SDATV = "Subdirección de Análisis y Tratamiento de Variables",
  SDCVJ = "Subdirección de Consulta y Vinculación Jurídica",
  SDDSA = "Subdirección de Desarrollo del Sistema de Admisión",
  SDNAJ = "Subdirección de Normatividad y Asesoría Jurídica",
  SDOPA = "Subdirección de Operación de los Procesos de Admisión",
  SDPCIA = "Subdirección de Perfiles, Criterios e Indicadores para Admisión",
  SDPGPR = "Subdirección de Procesamiento y Gestión para el Reconocimiento",
  SDPPHA = "Subdirección de Procesos de Promoción de Horas Adicionales",
  SDPPH = "Subdirección de Procesos de Promoción Horizontal",
  SDPPV = "Subdirección de Procesos de Promoción Vertical",
  SDSAVM = "Subdirección de Sistemas de Apoyo para la Valoración de Multifactores",
  SDVS = "Subdirección de Vinculación y Seguimiento",
  USCM = "Unidad del Sistema para la Carrera de las Maestras y los Maestros",
  NO_ESPECIFICADO = "No Especificado",
}

export const ALL_AREA_DEPARTAMENTO_DIRECCION: AreaDepartamentoDireccion[] = Object.values(AreaDepartamentoDireccion);

export enum UserSex {
  MASCULINO = "Masculino",
  FEMENINO = "Femenino",
}
export const ALL_USER_SEX: UserSex[] = Object.values(UserSex);

export enum EducationalLevel {
  BASICA = "Educación Básica",
  MEDIA_SUPERIOR = "Educación Media Superior",
}
export const ALL_EDUCATIONAL_LEVELS: EducationalLevel[] = Object.values(EducationalLevel);


export interface PeerNomination {
  nominatorId: string; // CURP of the user who made the nomination
  timestamp: number;
}

// Passkey credential structure
export interface PasskeyCredential {
  credentialID: string; // Base64URL-encoded credential ID
  publicKey: string; // Base64URL-encoded public key
  counter: number; // Signature counter to prevent replay attacks
  transports?: string[]; // Optional transport methods
  createdAt: number; // Timestamp when the passkey was registered
}

// New types for candidate eligibility
export enum EligibilityCriterionKey {
  HAS_MINIMUM_SENIORITY = 'hasMinimumSeniority', // User must answer YES (meaning they have >= 12 months)
  IS_NOT_COUNCILLOR_OR_ADVISOR = 'isNotCouncillorOrAdvisor', // User must answer YES (meaning they are NOT)
  HAS_NO_SANCTIONS = 'hasNoSanctions', // User must answer YES (meaning they have NO sanctions)
}

export type EligibilityAnswers = Partial<Record<EligibilityCriterionKey, boolean | null>>;

export interface User {
  id: string; // CURP
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  email: string; 
  fechaNacimiento: string; // YYYY-MM-DD
  sexo: UserSex; 
  antiguedad?: number; // Now represents months of seniority. Stored as number of months.
  educationalLevel: EducationalLevel; 
  passwordDigest: string; 
  profilePicUrl?: string;
  role: UserRole;
  assignedBlock: CandidateBlock;
  isRegisteredAsCandidate: boolean;
  canChangeBlock?: boolean;

  areaDepartamentoDireccion: AreaDepartamentoDireccion;
  puesto: string;

  votesCast: Partial<Record<CandidateBlock, string>>; 

  peerNominations: PeerNomination[]; 
  hasPendingPeerNominationDecision: boolean; 
  nominationsMade: Partial<Record<CandidateBlock, string>>; 

  registrationToken?: string;
  registrationTokenExpiry?: number; 

  hasLoggedInOnce?: boolean;

  // New eligibility fields
  eligibilitySelfDeclaration?: EligibilityAnswers; // User's self-declared answers
  adminEligibilityVerification?: EligibilityAnswers; // Admin's verification answers
  isEligibleForVoting?: boolean; // Final flag set by admin if all criteria (inc. seniority in months) are met
  hasRevokedCandidacyPreviously?: boolean; // New flag: True if user once revoked their candidacy

  // Face authentication fields
  faceId?: string; // Azure Face API person ID
  hasFaceRegistered?: boolean; // Whether user has registered their face
  faceRegistrationDate?: number; // Timestamp of face registration

  // Passkey authentication fields
  passkeys?: PasskeyCredential[]; // Array of passkey credentials
  hasPasskeyRegistered?: boolean; // Whether user has registered a passkey

  // Additional profile fields
  celular?: string;
  telefonoExtension?: string;
  consideracionesParticulares?: string;
  descripcionAdicional?: string; // New field for candidate description
  
  doctoradoTitulo?: string;
  maestriaTitulo?: string;
  licenciaturaTitulo?: string;
  diplomadoTitulo?: string;
  
  claveCentroTrabajo?: string;
  nombreCentroTrabajo?: string;
  entidadCentroTrabajo?: string;
  municipioCentroTrabajo?: string;
  localidadCentroTrabajo?: string;
  tipoCentroTrabajo?: string;
  servicioEducativoCentroTrabajo?: string;
  sostenimientoCentroTrabajo?: string;
  subcontrolCentroTrabajo?: string;
  turnoCentroTrabajo?: string;
}

export interface Post {
  id: string; // uuid
  authorId: string; // User CURP (must be a candidate)
  content: string;
  timestamp: number;
  mediaUrl?: string; // For images: Base64 Data URI. For videos: Base64 Data URI of the first frame (thumbnail).
  mediaType?: 'image' | 'video';
  videoFileName?: string; // Original name of the video file
  videoDuration?: number; // Duration in seconds
  videoDataUrl?: string; // For videos: Base64 Data URI of the complete video file for persistent storage
  likes: string[]; // Array of user CURPs who liked
  dislikes: string[]; // Array of user CURPs who disliked
  transientVideoFile?: File; // For in-memory video file, not persisted
}

export interface VoteRecord {
  id: string; // uuid
  voterId: string; // User CURP
  candidateId: string; // User CURP (of the candidate)
  blockOfCandidacy: CandidateBlock; 
  timestamp: number;
}

export interface AuthenticatedUser extends User {
  // Potentially add session-specific info here if needed
}

export interface ElectionPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ElectionSettings {
  nominationPeriod: ElectionPeriod | null;
  votingPeriod: ElectionPeriod | null;
  allowOverlap?: boolean; 
}

export interface BlockStatus {
  isActive: boolean;
  candidateCountAtNominationEnd?: number; 
}

export type AllBlockSettings = Record<CandidateBlock, BlockStatus>;

// Configuración SMTP para base de datos
export interface SmtpConfiguration {
  id: string;
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // Encriptado
  fromName: string;
  fromAddress: string;
  isActive: boolean;
  customSettings?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  createdBy: string; // CURP del superadmin
}
