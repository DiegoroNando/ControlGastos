
import { CandidateBlock, UserRole, AreaDepartamentoDireccion, UserSex, EducationalLevel, EligibilityCriterionKey } from './types';

export const APP_NAME = "Sistema de Votaciones para Comité de Ética."; // Updated title

export const DEFAULT_PROFILE_PIC_BASE_URL = "https://ui-avatars.com/api/?background=random&size=128&name=";

export const SUPERADMIN_CURP = "ADMIN0000000000";
export const SUPERADMIN_PASSWORD = "adminpassword";

export const SUPERADMIN_INITIAL_DATA = {
  id: SUPERADMIN_CURP,
  curp: SUPERADMIN_CURP,
  nombre: "Super",
  apellidoPaterno: "Admin",
  apellidoMaterno: "User",
  email: "superadmin@example.com", 
  fechaNacimiento: "1970-01-01",
  sexo: UserSex.MASCULINO, 
  antiguedad: 0, 
  educationalLevel: EducationalLevel.BASICA, 
  passwordDigest: SUPERADMIN_PASSWORD, 
  role: UserRole.SUPERADMIN,
  assignedBlock: CandidateBlock.B1, 
  isRegisteredAsCandidate: false,
  votesCast: {}, 
  canChangeBlock: false,
  peerNominations: [],
  hasPendingPeerNominationDecision: false,
  areaDepartamentoDireccion: AreaDepartamentoDireccion.USCM, 
  puesto: "Administrador del Sistema",
  registrationToken: undefined,
  registrationTokenExpiry: undefined,
  hasLoggedInOnce: true, 
  eligibilitySelfDeclaration: {},
  adminEligibilityVerification: {},
  isEligibleForVoting: false,
  hasRevokedCandidacyPreviously: false,
  // Initialize new additional profile fields
  celular: undefined,
  telefonoExtension: undefined,
  consideracionesParticulares: undefined,
  descripcionAdicional: undefined,
  doctoradoTitulo: undefined,
  maestriaTitulo: undefined,
  licenciaturaTitulo: undefined,
  diplomadoTitulo: undefined,
  claveCentroTrabajo: undefined,
  nombreCentroTrabajo: undefined,
  entidadCentroTrabajo: undefined,
  municipioCentroTrabajo: undefined,
  localidadCentroTrabajo: undefined,
  tipoCentroTrabajo: undefined,
  servicioEducativoCentroTrabajo: undefined,
  sostenimientoCentroTrabajo: undefined,
  subcontrolCentroTrabajo: undefined,
  turnoCentroTrabajo: undefined,
};

// ===========================================================================================
// ENHANCED ROUTE OBFUSCATION SYSTEM v2.0
// ===========================================================================================
// This system provides comprehensive URL obfuscation for the voting system.
// Routes are generated using secure obfuscation to prevent URL manipulation.
// 
// SECURITY NOTICE: These routes are intentionally obfuscated to prevent:
// - URL guessing attacks
// - Unauthorized access attempts  
// - Route enumeration
// - Direct URL manipulation
//
// WARNING: DO NOT modify these values without updating ALL references in the codebase!
// ===========================================================================================

// Enhanced route obfuscation mapping with secure random segments
const ROUTE_OBFUSCATION_MAP = {
  // ===== MAIN APPLICATION ROUTES =====
  // Authentication and public access
  AUTH: "/x7k9p2m8", // Login/Register page
  
  // Core user areas  
  DASHBOARD: "/m4n8q7z2", // Main dashboard (role-based content)
  VIEW_CANDIDATES: "/z3v7w9k4", // Public candidate viewing
  
  // Dynamic candidate routes with obfuscated parameters
  CANDIDATE_PROFILE: "/u6r2t5x8/:candidateId/d5f8h3w7", // Individual candidate profile
  CANDIDATE_POSTS: "/u6r2t5x8/:candidateId/p9l3k6m2", // Candidate posts/content
  
  // ===== ADMIN SPECIAL ROUTES =====
  // These routes are not nested under dashboard for security
  ADMIN_PASSWORD_SETUP: "/a2d3m1n8k7/s3tup9p4ssw0rd6z1", // Admin password setup (token-based)
  
  // ===== ADMIN DASHBOARD SUB-ROUTES =====
  // These are relative to DASHBOARD for nested routing
  ADMIN_STATS: "", // Empty path = index route (Statistics dashboard)
  ADMIN_USERS: "j2h5n9x8", // User management section
  ADMIN_BLOCKS: "q8w4e7r2", // Block/group management
  ADMIN_CALENDAR: "y7u1i5t9", // Electoral calendar management
  ADMIN_WHITELIST: "a9s6d3f8", // Whitelist and data import
  ADMIN_EMAILS: "f3g8j7k4", // Email management and configuration
  ADMIN_SETTINGS: "v5b9n2m6", // System settings and configuration
  
  // ===== SECURITY FEATURES =====
  // Additional obfuscated routes for security endpoints (future use)
  SECURITY_CHECK: "/sec9k3m7", // Security validation endpoint
  ACCESS_DENIED: "/acc2d8n5", // Access denied page
  SESSION_EXPIRED: "/ses7x4m9", // Session timeout page
};

// Route validation patterns (for additional security)
const ROUTE_PATTERNS = {
  ADMIN_ROUTES: /^\/m4n8q7z2\/(j2h5n9x8|q8w4e7r2|y7u1i5t9|a9s6d3f8|f3g8j7k4|v5b9n2m6)/,
  CANDIDATE_ROUTES: /^\/u6r2t5x8\/[a-zA-Z0-9]+\/(d5f8h3w7|p9l3k6m2)/,
  PUBLIC_ROUTES: /^(\/x7k9p2m8|\/z3v7w9k4)/,
};

// Route security metadata
const ROUTE_SECURITY = {
  // Routes that require authentication
  PROTECTED: [
    ROUTE_OBFUSCATION_MAP.DASHBOARD,
    ROUTE_OBFUSCATION_MAP.VIEW_CANDIDATES,
    ROUTE_OBFUSCATION_MAP.CANDIDATE_PROFILE,
    ROUTE_OBFUSCATION_MAP.CANDIDATE_POSTS,
  ],
  
  // Routes that require admin privileges
  ADMIN_ONLY: [
    ROUTE_OBFUSCATION_MAP.ADMIN_USERS,
    ROUTE_OBFUSCATION_MAP.ADMIN_BLOCKS,
    ROUTE_OBFUSCATION_MAP.ADMIN_CALENDAR,
    ROUTE_OBFUSCATION_MAP.ADMIN_WHITELIST,
    ROUTE_OBFUSCATION_MAP.ADMIN_EMAILS,
    ROUTE_OBFUSCATION_MAP.ADMIN_SETTINGS,
  ],
  
  // Public routes (no authentication required)
  PUBLIC: [
    ROUTE_OBFUSCATION_MAP.AUTH,
    ROUTE_OBFUSCATION_MAP.ADMIN_PASSWORD_SETUP,
  ],
};

// Helper function to check if a route requires admin access
export const isAdminRoute = (pathname: string): boolean => {
  return ROUTE_SECURITY.ADMIN_ONLY.some(route => pathname.includes(route));
};

// Helper function to check if a route is public
export const isPublicRoute = (pathname: string): boolean => {
  return ROUTE_SECURITY.PUBLIC.some(route => pathname.startsWith(route));
};

// Helper function to validate route patterns
export const validateRoutePattern = (pathname: string): boolean => {
  return Object.values(ROUTE_PATTERNS).some(pattern => pattern.test(pathname));
};

export const ROUTES = ROUTE_OBFUSCATION_MAP;

export const LOCAL_STORAGE_KEYS = {
  // Enhanced obfuscated local storage keys for security
  USERS: "vta_usr_db_9k7x", // User data storage
  WHITELIST: "vta_whtlst_curp_3m8z", // Whitelist CURP data
  POSTS: "vta_psts_cnt_5j2w", // Posts content storage
  VOTES: "vta_vts_rec_7n4q", // Vote records storage
  LOGGED_IN_USER_CURP: "vta_lgn_usr_curp_8x5k", // Legacy logged user CURP (being phased out)
  SESSION_ID: "vta_ssn_id_4m9p", // Client-side session tracking
  ELECTION_SETTINGS: "vta_elct_cfg_6h3z", // Election configuration
  BLOCK_SETTINGS: "vta_blk_cfg_2w8j", // Block settings configuration
  LAST_SNAPSHOT_NOM_END_DATE: "vta_lst_snp_nom_dt_9p5x", // Last nomination snapshot date
  LAST_ACTIVITY_TIMESTAMP: "vta_lst_act_ts_7k2m", // Last activity timestamp for session management
};

export const CURP_REGEX = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const generateToken = (length: number = 6): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Session Management Constants
export const SESSION_TIMEOUT_MINUTES = 30; // Auto-logout after 30 minutes of inactivity
export const MAX_SESSION_DURATION_HOURS = 8; // Max overall session length

export const TOKEN_EXPIRY_MINUTES = 15;

export const DOF_LINK_ELIGIBILITY = "https://www.dof.gob.mx/nota_detalle.php?codigo=5608925&fecha=28/12/2020#gsc.tab=0";

export const ELIGIBILITY_QUESTIONS: Record<EligibilityCriterionKey, { question: string, expectedAnswer?: boolean, explanation?: string }> = {
  [EligibilityCriterionKey.HAS_MINIMUM_SENIORITY]: {
    question: "¿Cuenta con antigüedad mínima de doce meses en el servicio público?",
    expectedAnswer: true,
    explanation: "Se requiere al menos 12 meses de antigüedad en el servicio público."
  },
  [EligibilityCriterionKey.IS_NOT_COUNCILLOR_OR_ADVISOR]: {
    question: "¿Es actualmente consejera o asesora de un comité especializado, o pertenece al órgano de control?",
    expectedAnswer: false, 
    explanation: "Para ser elegible, NO debe ser consejero/asesor de comité especializado ni pertenecer al órgano de control."
  },
  [EligibilityCriterionKey.HAS_NO_SANCTIONS]: {
    question: "¿Ha sido sancionada(o) por falta administrativa grave o por delitos?",
    expectedAnswer: false, 
    explanation: "Para ser elegible, NO debe haber sido sancionado por falta administrativa grave o delitos."
  },
};
