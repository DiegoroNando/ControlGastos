import { User, Post, VoteRecord, CandidateBlock, UserRole, PeerNomination, ElectionSettings, AreaDepartamentoDireccion, ALL_AREA_DEPARTAMENTO_DIRECCION, UserSex, ALL_USER_SEX, ALL_CANDIDATE_BLOCKS, AllBlockSettings, BlockStatus, EducationalLevel, ALL_EDUCATIONAL_LEVELS, EligibilityAnswers, ElectionPeriod } from '../types';
import { LOCAL_STORAGE_KEYS, SUPERADMIN_INITIAL_DATA, SUPERADMIN_CURP, generateId } from '../constants';
import { isoToDateUTC } from '../utils/dateUtils'; // For calculating period info

// Helper to get item from localStorage
const getItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

// Helper to set item in localStorage with quota management
const setItem = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  const jsonString = JSON.stringify(value);
  
  try {
    localStorage.setItem(key, jsonString);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Attempting to free up space...');
      
      // Try to free up space by removing video data from older posts
      if (key === LOCAL_STORAGE_KEYS.POSTS) {
        const optimizedValue = optimizePostsForStorage(value as any);
        try {
          localStorage.setItem(key, JSON.stringify(optimizedValue));
          console.log('Successfully saved posts with optimized storage.');
          return;
        } catch (retryError) {
          console.error('Failed to save even with optimization:', retryError);
          throw new Error('Storage quota exceeded. Cannot save new content. Consider clearing old data.');
        }
      } else {
        throw new Error('Storage quota exceeded. Cannot save new content.');
      }
    } else {
      throw error;
    }
  }
};

// Helper function to optimize posts for storage by removing video data from older posts
const optimizePostsForStorage = (posts: Post[]): Post[] => {
  if (!Array.isArray(posts)) return [];
  
  // Sort posts by timestamp (newest first)
  const sortedPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp);
  
  // Keep video data only for the 5 most recent posts with videos
  let videoPostsKept = 0;
  const maxVideoPostsWithData = 5;
  
  return sortedPosts.map(post => {
    if (post.mediaType === 'video' && post.videoDataUrl) {
      if (videoPostsKept < maxVideoPostsWithData) {
        videoPostsKept++;
        return post; // Keep video data
      } else {
        // Remove video data but keep thumbnail and metadata
        const optimizedPost = { ...post };
        delete optimizedPost.videoDataUrl;
        console.log(`Removed video data from older post: ${post.videoFileName || 'Unknown'}`);
        return optimizedPost;
      }
    }
    return post;
  });
};

// Utility function to get storage usage information
export const getStorageInfo = () => {
  if (typeof window === 'undefined') return { used: 0, available: 0, percentage: 0 };
  
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  // Approximate localStorage limit (varies by browser, usually 5-10MB)
  const approximateLimit = 5 * 1024 * 1024; // 5MB
  const percentage = (used / approximateLimit) * 100;
  
  return {
    used: used,
    available: approximateLimit - used,
    percentage: Math.min(percentage, 100),
    usedMB: (used / (1024 * 1024)).toFixed(2),
    availableMB: ((approximateLimit - used) / (1024 * 1024)).toFixed(2)
  };
};

// Function to clear old video data to free up space
export const clearOldVideoData = (): number => {
  const posts = getPosts();
  let clearedCount = 0;
  
  const updatedPosts = posts.map(post => {
    if (post.mediaType === 'video' && post.videoDataUrl) {
      // Keep only the 3 most recent video posts with full data
      const recentVideoPosts = posts
        .filter(p => p.mediaType === 'video' && p.videoDataUrl)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
      
      if (!recentVideoPosts.includes(post)) {
        const optimizedPost = { ...post };
        delete optimizedPost.videoDataUrl;
        clearedCount++;
        return optimizedPost;
      }
    }
    return post;
  });
  
  if (clearedCount > 0) {
    setItem(LOCAL_STORAGE_KEYS.POSTS, updatedPosts);
    console.log(`Cleared video data from ${clearedCount} older posts to free up storage space.`);
  }
  
  return clearedCount;
};

// Data migration and field ensurence helper
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


// Initialize Data (Seed)
export const initializeData = (): void => {
  let users = getItem<any[]>(LOCAL_STORAGE_KEYS.USERS, []);
  const defaultElectionSettings: ElectionSettings = { nominationPeriod: null, votingPeriod: null, allowOverlap: false };
  
  const defaultBlockSettings: AllBlockSettings = {} as AllBlockSettings;
  ALL_CANDIDATE_BLOCKS.forEach(block => {
    defaultBlockSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
  });

  if (users.length === 0) {
    const superAdminUser: User = ensureUserFields({
        ...SUPERADMIN_INITIAL_DATA, 
        profilePicUrl: undefined, 
    });
    setItem(LOCAL_STORAGE_KEYS.USERS, [superAdminUser]);
    setItem(LOCAL_STORAGE_KEYS.WHITELIST, [SUPERADMIN_CURP]);
    setItem(LOCAL_STORAGE_KEYS.POSTS, []);
    setItem(LOCAL_STORAGE_KEYS.VOTES, []);
    setItem(LOCAL_STORAGE_KEYS.ELECTION_SETTINGS, defaultElectionSettings);
    setItem(LOCAL_STORAGE_KEYS.BLOCK_SETTINGS, defaultBlockSettings);
  } else {
    const superadminIndex = users.findIndex(u => u.curp === SUPERADMIN_INITIAL_DATA.curp);
    if (superadminIndex === -1) {
        const superAdminUserToAdd: User = ensureUserFields({
            ...SUPERADMIN_INITIAL_DATA,
            profilePicUrl: undefined,
        });
        users.push(superAdminUserToAdd);
    } else {
        const existingSuperAdmin = users[superadminIndex];
        users[superadminIndex] = ensureUserFields({
            ...SUPERADMIN_INITIAL_DATA, // Ensure all superadmin defaults are present
            ...existingSuperAdmin,      // Override with existing values
            // Explicitly ensure new fields from SUPERADMIN_INITIAL_DATA if they are missing
            ...Object.fromEntries(Object.entries(SUPERADMIN_INITIAL_DATA).filter(([key, value]) => value === undefined && !(key in existingSuperAdmin)))
        });
    }
    
    users = users.map(user => ensureUserFields(user));
    setItem(LOCAL_STORAGE_KEYS.USERS, users);

    const whitelist = getItem<string[]>(LOCAL_STORAGE_KEYS.WHITELIST, []);
    if (!whitelist.includes(SUPERADMIN_CURP)) {
        whitelist.push(SUPERADMIN_CURP);
        setItem(LOCAL_STORAGE_KEYS.WHITELIST, whitelist);
    }

    const storedElectionSettings = getItem<any>(LOCAL_STORAGE_KEYS.ELECTION_SETTINGS, null);
    if (storedElectionSettings === null) {
        setItem(LOCAL_STORAGE_KEYS.ELECTION_SETTINGS, defaultElectionSettings);
    } else {
        setItem(LOCAL_STORAGE_KEYS.ELECTION_SETTINGS, ensureElectionSettingsFields(storedElectionSettings));
    }

    const storedBlockSettings = getItem<any>(LOCAL_STORAGE_KEYS.BLOCK_SETTINGS, null);
    if (storedBlockSettings === null) {
        setItem(LOCAL_STORAGE_KEYS.BLOCK_SETTINGS, defaultBlockSettings);
    } else {
        setItem(LOCAL_STORAGE_KEYS.BLOCK_SETTINGS, ensureBlockSettingsFields(storedBlockSettings));
    }
  }
};


// User Management
export const getUsers = (): User[] => getItem<any[]>(LOCAL_STORAGE_KEYS.USERS, []).map(user => ensureUserFields(user));
export const getUserByCurp = (curp: string): User | undefined => getUsers().find(u => u.curp === curp);
export const updateUser = (updatedUser: User): void => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === updatedUser.id);
  if (userIndex !== -1) {
    users[userIndex] = ensureUserFields(updatedUser);
    setItem(LOCAL_STORAGE_KEYS.USERS, users);
  }
};
export const addUser = (userData: Omit<User, 'id' | 'votesCast' | 'profilePicUrl' | 'canChangeBlock' | 'peerNominations' | 'hasPendingPeerNominationDecision' | 'registrationToken' | 'registrationTokenExpiry' | 'nominationsMade' | 'hasLoggedInOnce' | 'eligibilitySelfDeclaration' | 'adminEligibilityVerification' | 'isEligibleForVoting' | 'hasRevokedCandidacyPreviously' | 'celular' | 'telefonoExtension' | 'consideracionesParticulares' | 'descripcionAdicional' | 'doctoradoTitulo' | 'maestriaTitulo' | 'licenciaturaTitulo' | 'diplomadoTitulo' | 'claveCentroTrabajo' | 'nombreCentroTrabajo' | 'entidadCentroTrabajo' | 'municipioCentroTrabajo' | 'localidadCentroTrabajo' | 'tipoCentroTrabajo' | 'servicioEducativoCentroTrabajo' | 'sostenimientoCentroTrabajo' | 'subcontrolCentroTrabajo' | 'turnoCentroTrabajo'> & Partial<Pick<User, 'celular' | 'telefonoExtension' | 'consideracionesParticulares' | 'descripcionAdicional' | 'doctoradoTitulo' | 'maestriaTitulo' | 'licenciaturaTitulo' | 'diplomadoTitulo' | 'claveCentroTrabajo' | 'nombreCentroTrabajo' | 'entidadCentroTrabajo' | 'municipioCentroTrabajo' | 'localidadCentroTrabajo' | 'tipoCentroTrabajo' | 'servicioEducativoCentroTrabajo' | 'sostenimientoCentroTrabajo' | 'subcontrolCentroTrabajo' | 'turnoCentroTrabajo'>>): User => {
  const users = getUsers();
  const newUser: User = ensureUserFields({
    ...userData,
    id: userData.curp, // Use CURP as ID
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
    // Initialize new additional profile fields from userData or to undefined
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
    turnoCentroTrabajo: userData.turnoCentroTrabajo || undefined,
  });
  users.push(newUser);
  setItem(LOCAL_STORAGE_KEYS.USERS, users);
  return newUser;
};
export const deleteUser = (userId: string): void => {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  setItem(LOCAL_STORAGE_KEYS.USERS, filteredUsers);
};

// Password Recovery Functions
export const getUserEmailsByCurp = (curp: string): string[] => {
  const users = getUsers();
  const userEmails = users
    .filter(u => u.curp === curp && u.email && u.email.trim() !== '')
    .map(u => u.email);
  
  // Remover duplicados
  return [...new Set(userEmails)];
};

export const setPasswordResetToken = (curp: string, token: string, expiryMinutes: number = 30): boolean => {
  const user = getUserByCurp(curp);
  if (!user) return false;
  
  const expiry = Date.now() + expiryMinutes * 60 * 1000;
  const updatedUser = {
    ...user,
    registrationToken: token,
    registrationTokenExpiry: expiry
  };
  
  updateUser(updatedUser);
  return true;
};

export const validatePasswordResetToken = (curp: string, token: string): { valid: boolean; expired?: boolean; user?: User } => {
  const user = getUserByCurp(curp);
  
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

export const resetPassword = async (curp: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const validation = validatePasswordResetToken(curp, token);
  
  if (!validation.valid) {
    if (validation.expired) {
      return { success: false, message: 'El código de verificación ha expirado. Solicita uno nuevo.' };
    }
    return { success: false, message: 'Código de verificación inválido.' };
  }
  
  if (!validation.user) {
    return { success: false, message: 'Usuario no encontrado.' };
  }
  
  // Hash the password before storing it
  const { hashPassword } = await import('./passwordService');
  const hashedPassword = await hashPassword(newPassword);
  
  // Actualizar contraseña y limpiar token
  const updatedUser = {
    ...validation.user,
    passwordDigest: hashedPassword,
    registrationToken: undefined,
    registrationTokenExpiry: undefined
  };
  
  updateUser(updatedUser);
  return { success: true, message: 'Contraseña actualizada exitosamente.' };
};

// Whitelist Management (CURP-based)
export const getWhitelist = (): string[] => getItem<string[]>(LOCAL_STORAGE_KEYS.WHITELIST, []);
export const addToWhitelist = (curp: string): void => {
  const whitelist = getWhitelist();
  const upperCurp = curp.toUpperCase();
  if (!whitelist.includes(upperCurp)) {
    whitelist.push(upperCurp);
    setItem(LOCAL_STORAGE_KEYS.WHITELIST, whitelist);
  }
};
export const removeFromWhitelist = (curp: string): void => {
  const upperCurp = curp.toUpperCase();
  const whitelist = getWhitelist().filter(c => c !== upperCurp);
  setItem(LOCAL_STORAGE_KEYS.WHITELIST, whitelist);
};
export const isWhitelisted = (curp: string): boolean => getWhitelist().includes(curp.toUpperCase());

// Post Management
export const getPosts = (): Post[] => {
    // Ensure transientVideoFile is not part of the retrieved object structure from localStorage
    return getItem<Omit<Post, 'transientVideoFile'>[]>(LOCAL_STORAGE_KEYS.POSTS, []).map(post => ({
        ...post,
        likes: post.likes || [],
        dislikes: post.dislikes || [],
        videoFileName: post.videoFileName || undefined,
        videoDuration: post.videoDuration || undefined,
        videoDataUrl: post.videoDataUrl || undefined, // Include video Base64 data
        // transientVideoFile will be undefined here, which is correct
    }));
};
export const getPostsByCandidate = (candidateId: string): Post[] => getPosts().filter(p => p.authorId === candidateId).sort((a,b) => b.timestamp - a.timestamp);

export const addPost = (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'transientVideoFile'> & { transientVideoFile?: File }): Post => {
  const posts = getPosts();
  // Create a new object for storage, excluding transientVideoFile
  const { transientVideoFile, ...storablePostData } = postData;
  const newPostForStorage: Omit<Post, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'transientVideoFile'> = {
    ...storablePostData, // Spread only the storable parts
    videoFileName: storablePostData.videoFileName || undefined,
    videoDuration: storablePostData.videoDuration || undefined,
    videoDataUrl: storablePostData.videoDataUrl || undefined, // Store the video Base64 data
  };

  const newPostWithTimestamp: Post = {
    ...newPostForStorage,
    id: generateId(),
    timestamp: Date.now(),
    likes: [],
    dislikes: [],
    transientVideoFile: transientVideoFile, // Keep it for the in-memory object
  };
  
  // Add the version *without* transientVideoFile to localStorage
  const allPostsForStorage = [...posts, { ...newPostWithTimestamp, transientVideoFile: undefined }];
  setItem(LOCAL_STORAGE_KEYS.POSTS, allPostsForStorage);
  
  return newPostWithTimestamp; // Return the full object for immediate use in UI
};
export const updatePostReactions = (postId: string, userId: string, reactionType: 'like' | 'dislike'): Post | undefined => {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return undefined;

  const post = posts[postIndex];
  post.likes = post.likes.filter(uid => uid !== userId);
  post.dislikes = post.dislikes.filter(uid => uid !== userId);

  if (reactionType === 'like') {
    post.likes.push(userId);
  } else {
    post.dislikes.push(userId);
  }
  
  posts[postIndex] = post;
  setItem(LOCAL_STORAGE_KEYS.POSTS, posts.map(p => ({...p, transientVideoFile: undefined }))); // Ensure transientVideoFile isn't saved
  return post; // Return post with transientVideoFile if it was there
};
export const deletePost = (postId: string): void => {
    let posts = getPosts();
    posts = posts.filter(p => p.id !== postId);
    setItem(LOCAL_STORAGE_KEYS.POSTS, posts.map(p => ({...p, transientVideoFile: undefined }))); // Ensure transientVideoFile isn't saved
};

// Vote Management
export const getVotes = (): VoteRecord[] => getItem<VoteRecord[]>(LOCAL_STORAGE_KEYS.VOTES, []); 

export const addVote = (voterId: string, candidateId: string, blockOfCandidacy: CandidateBlock): VoteRecord | null => {
  const voter = getUserByCurp(voterId);
  if (!voter || (voter.votesCast && voter.votesCast[blockOfCandidacy])) {
    return null;
  }

  const votes = getVotes(); 
  const newVote: VoteRecord = {
    id: generateId(),
    voterId,
    candidateId,
    blockOfCandidacy,
    timestamp: Date.now(),
  };
  votes.push(newVote);
  setItem(LOCAL_STORAGE_KEYS.VOTES, votes);

  if (!voter.votesCast) {
    voter.votesCast = {};
  }
  voter.votesCast[blockOfCandidacy] = candidateId;
  updateUser(voter); 
  
  return newVote;
};
export const getVotesForCandidate = (candidateId: string): VoteRecord[] => {
    return getVotes().filter(v => v.candidateId === candidateId); 
};

// Auth persistence
export const getLoggedInUserCurp = (): string | null => getItem<string | null>(LOCAL_STORAGE_KEYS.LOGGED_IN_USER_CURP, null);
export const setLoggedInUserCurp = (curp: string | null): void => setItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER_CURP, curp);


// --- Nomination System Functions ---
const isVotingPeriodActiveNow = (): boolean => {
  const settings = getElectionSettings();
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
    console.log(`[DEBUG storageService] Período de votación de un día (${settings.votingPeriod.startDate}):`);
    console.log(`  isActive: ${isActive}`);
    console.log(`  currentDayStart: ${currentDayStart}, periodStart: ${periodStart}, periodEnd: ${periodEnd}`);
  }
  
  return isActive;
};

export const selfNominateAsCandidate = async (userCurp: string, selfDeclarationAnswers: EligibilityAnswers): Promise<{ success: boolean; message: string; user?: User }> => {
  const user = getUserByCurp(userCurp);
  if (!user) return { success: false, message: "Usuario no encontrado." };

  if (user.hasRevokedCandidacyPreviously) {
    return { success: false, message: "Ya no puedes postularte como candidato después de haber retirado tu candidatura previamente en este proceso electoral." };
  }
  if (!isWhitelisted(userCurp)) return { success: false, message: "Tu CURP no está en la lista blanca. No puedes postularte." };
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
  updateUser(user);
  return { success: true, message: "¡Te has postulado como candidato! Un administrador revisará tu elegibilidad.", user };
};

export const revokeCandidacy = async (userCurp: string): Promise<{ success: boolean; message: string; user?: User }> => {
  const user = getUserByCurp(userCurp);
  if (!user || user.role === UserRole.SUPERADMIN) {
      return { success: false, message: "Usuario no encontrado o no aplicable." };
  }

  if (isVotingPeriodActiveNow()) {
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
  updateUser(user);

  // Send notification to superadministrator about candidacy withdrawal
  try {
    const { sendCandidacyWithdrawalNotification } = await import('../services/emailService');
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

export const addPeerNomination = (nominatorCurp: string, nomineeCurp: string): { success: boolean; message: string; nominee?: User } => {
  let nominator = getUserByCurp(nominatorCurp);
  const nominee = getUserByCurp(nomineeCurp);

  if (!nominator || !nominee) return { success: false, message: "Nominador o nominado no encontrado." };

  if (nominee.hasRevokedCandidacyPreviously) {
    return { success: false, message: `El usuario ${nominee.nombre} ${nominee.apellidoPaterno} retiró su candidatura previamente y ya no puede ser nominado en este proceso electoral.`, nominee };
  }
  if (nominator.curp === nominee.curp) return { success: false, message: "No puedes nominarte a ti mismo de esta forma." };
  if (nominator.assignedBlock !== nominee.assignedBlock) return { success: false, message: "Solo puedes nominar a colegas de tu mismo bloque." };
  if (!isWhitelisted(nominee.curp)) return { success: false, message: "El usuario nominado no está en la lista blanca." };
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
    const previouslyNominatedUser = alreadyNominatedUserCurp ? getUserByCurp(alreadyNominatedUserCurp) : undefined;
    const prevNomineeName = previouslyNominatedUser ? `${previouslyNominatedUser.nombre} ${previouslyNominatedUser.apellidoPaterno}` : `CURP ${alreadyNominatedUserCurp}`;
    return { success: false, message: `Ya has utilizado tu nominación para el bloque ${nominee.assignedBlock} (nominaste a ${prevNomineeName}). Solo puedes nominar a una persona por bloque.`, nominee };
  }

  if (nominee.peerNominations.some(pn => pn.nominatorId === nominatorCurp)) {
      return { success: false, message: `Ya has enviado una nominación a ${nominee.nombre} ${nominee.apellidoPaterno}.`, nominee };
  }

  const newNomination: PeerNomination = { nominatorId: nominatorCurp, timestamp: Date.now() };
  nominee.peerNominations.push(newNomination);
  nominee.hasPendingPeerNominationDecision = true;
  updateUser(nominee);

  if (!nominator.nominationsMade) {
    nominator.nominationsMade = {};
  }
  nominator.nominationsMade[nominee.assignedBlock] = nominee.curp;
  updateUser(nominator);
  
  return { success: true, message: `${nominee.nombre} ${nominee.apellidoPaterno} ha sido nominado. Has utilizado tu nominación para el bloque ${nominee.assignedBlock}. El nominado deberá completar un formulario de elegibilidad.`, nominee };
};

export const acceptPeerNomination = async (nomineeCurp: string, selfDeclarationAnswers: EligibilityAnswers): Promise<{ success: boolean; message: string; user?: User }> => {
  const nominee = getUserByCurp(nomineeCurp);
  if (!nominee) return { success: false, message: "Nominado no encontrado." };

  if (nominee.hasRevokedCandidacyPreviously) {
    nominee.hasPendingPeerNominationDecision = false; 
    nominee.peerNominations = [];
    updateUser(nominee);
    return { success: false, message: "No puedes aceptar la postulación porque retiraste tu candidatura previamente en este proceso electoral." };
  }
  if (!nominee.hasPendingPeerNominationDecision || nominee.peerNominations.length === 0) return { success: false, message: "No tienes nominaciones pendientes o ya has tomado una decisión." };
  if (!isWhitelisted(nomineeCurp)) { 
      nominee.hasPendingPeerNominationDecision = false; 
      nominee.peerNominations = [];
      updateUser(nominee);
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
  updateUser(nominee);
  return { success: true, message: "¡Has aceptado la postulación y ahora eres candidato! Un administrador revisará tu elegibilidad.", user: nominee };
};

export const rejectPeerNomination = (nomineeCurp: string): User | null => {
  const nominee = getUserByCurp(nomineeCurp);
  if (!nominee) return null;

  const blockOfNomination = nominee.assignedBlock; 

  nominee.peerNominations.forEach(pn => {
    const nominator = getUserByCurp(pn.nominatorId);
    if (nominator && nominator.nominationsMade && nominator.nominationsMade[blockOfNomination] === nomineeCurp) {
      delete nominator.nominationsMade[blockOfNomination];
      updateUser(nominator);
    }
  });

  nominee.peerNominations = []; 
  nominee.hasPendingPeerNominationDecision = false;
  nominee.eligibilitySelfDeclaration = {}; 
  updateUser(nominee);
  return nominee;
};

export const getNominatableUsersInBlock = (block: CandidateBlock, currentUserCurp: string): User[] => {
  const allUsers = getUsers();
  const currentUser = getUserByCurp(currentUserCurp);

  if (currentUser && currentUser.nominationsMade && currentUser.nominationsMade[block]) {
    return []; 
  }

  return allUsers.filter(user => 
    user.curp !== currentUserCurp &&
    user.assignedBlock === block &&
    isWhitelisted(user.curp) &&
    user.hasLoggedInOnce && 
    !user.isRegisteredAsCandidate && 
    user.role !== UserRole.SUPERADMIN && 
    !user.hasRevokedCandidacyPreviously && 
    !user.peerNominations.some(pn => pn.nominatorId === currentUserCurp) && 
    (user.antiguedad !== undefined && user.antiguedad >= 1) 
  );
};

// --- Election Settings Functions ---
export const getElectionSettings = (): ElectionSettings => {
    const storedSettings = getItem<any>(LOCAL_STORAGE_KEYS.ELECTION_SETTINGS, {
        nominationPeriod: null,
        votingPeriod: null,
        allowOverlap: false, 
    });
    return ensureElectionSettingsFields(storedSettings);
};

export const saveElectionSettings = (settings: ElectionSettings): void => {
    setItem(LOCAL_STORAGE_KEYS.ELECTION_SETTINGS, ensureElectionSettingsFields(settings));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('electionSettingsChanged'));
    }
};

// --- Block Settings Functions ---
export const getBlockSettings = (): AllBlockSettings => {
    const defaultBlockSettings: AllBlockSettings = {} as AllBlockSettings;
    ALL_CANDIDATE_BLOCKS.forEach(block => {
        defaultBlockSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
    });
    const storedSettings = getItem<any>(LOCAL_STORAGE_KEYS.BLOCK_SETTINGS, defaultBlockSettings);
    return ensureBlockSettingsFields(storedSettings);
};

export const saveBlockSettings = (settings: AllBlockSettings): void => {
    setItem(LOCAL_STORAGE_KEYS.BLOCK_SETTINGS, ensureBlockSettingsFields(settings));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('blockSettingsChanged'));
    }
};

export const updateCandidateCountsAtNominationEnd = (): void => {
    const currentBlockSettings = getBlockSettings();
    const registeredCandidates = getUsers().filter(u => u.isRegisteredAsCandidate && u.role === UserRole.CANDIDATE);
    
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
    saveBlockSettings(updatedBlockSettings);
    console.log("Candidate counts updated after nomination period.", updatedBlockSettings);
};


// Call initializeData on load to ensure structure exists
initializeData();

// Development utility functions for testing storage management
// These functions are only available in development mode for testing purposes

export const devStorageUtils = {
  // Fill localStorage to simulate quota exceeded scenarios  
  fillStorageForTesting: (targetPercentage: number = 95) => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Storage testing utilities only available in development mode');
      return;
    }
    
    const storageInfo = getStorageInfo();
    const currentUsage = storageInfo.used;
    const targetUsage = (storageInfo.used + storageInfo.available) * (targetPercentage / 100);
    const bytesToAdd = targetUsage - currentUsage;
    
    if (bytesToAdd > 0) {
      const fakeData = 'x'.repeat(Math.floor(bytesToAdd / 2)); // Divide by 2 because of string encoding
      try {
        localStorage.setItem('__dev_test_storage_filler__', fakeData);
        console.log(`Storage filled to ${targetPercentage}% for testing purposes`);
        return true;
      } catch (error) {
        console.log('Storage limit reached during test fill');
        return false;
      }
    }
    return false;
  },

  // Clear test storage data
  clearTestData: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    localStorage.removeItem('__dev_test_storage_filler__');
    console.log('Test storage data cleared');
  },

  // Get detailed storage breakdown
  getDetailedStorageInfo: () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    const breakdown: Record<string, number> = {};
    let total = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length + key.length;
        breakdown[key] = size;
        total += size;
      }
    }
    
    // Sort by size descending
    const sortedBreakdown = Object.entries(breakdown)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [key, value]) => {
        acc[key] = `${(value / 1024).toFixed(2)} KB`;
        return acc;
      }, {} as Record<string, string>);
    
    console.table(sortedBreakdown);
    console.log(`Total storage used: ${(total / 1024).toFixed(2)} KB`);
    
    return sortedBreakdown;
  }
};

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).devStorageUtils = devStorageUtils;
  console.log('🔧 Dev Storage Utils available: window.devStorageUtils');
  console.log('📊 Commands: fillStorageForTesting(95), clearTestData(), getDetailedStorageInfo()');
}
