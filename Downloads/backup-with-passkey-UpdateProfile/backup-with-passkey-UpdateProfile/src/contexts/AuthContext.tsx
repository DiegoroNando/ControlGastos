
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, UserRole } from '../types';
import { 
  getUserByCurp, 
  updateUser as updateStoredUser,
  getAuthSession,
  setAuthSession,
  clearAuthSession
} from '../services/databaseService';
import { LOCAL_STORAGE_KEYS, SESSION_TIMEOUT_MINUTES, MAX_SESSION_DURATION_HOURS } from '../constants';
import { generateId } from '../constants'; // For sessionId

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (updatedUserData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<number | null>(null);
  const maxSessionTimerRef = useRef<number | null>(null);

  const handleLogout = useCallback(async (reason?: string) => {
    const localSessionId = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID);
    const localUserCurp = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER_CURP);

    if (localUserCurp) {
      await clearAuthSession(localUserCurp, localSessionId || undefined);
    }
    
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER_CURP);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY_TIMESTAMP);

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (maxSessionTimerRef.current) clearTimeout(maxSessionTimerRef.current);
    
    console.log(`Logged out. ${reason ? `Reason: ${reason}` : ''}`);
  }, []);
  
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY_TIMESTAMP, Date.now().toString());
    
    inactivityTimerRef.current = window.setTimeout(() => { // window.setTimeout returns number
      handleLogout('Inactivity timeout');
    }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
  }, [handleLogout]);

  const handleUserActivity = useCallback(() => {
    if (currentUser) { // Only reset if a user is logged in
      resetInactivityTimer();
    }
  }, [currentUser, resetInactivityTimer]);

  useEffect(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (maxSessionTimerRef.current) clearTimeout(maxSessionTimerRef.current);
    };
  }, [handleUserActivity]);


  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUserCurp = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER_CURP);
        const storedSessionId = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID);
        const lastActivityStored = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY_TIMESTAMP);

        if (storedUserCurp && storedSessionId) {
          const user = await getUserByCurp(storedUserCurp);
          if (!user) {
            await handleLogout('User not found in DB during init');
            return;
          }
          
          const dbSession = await getAuthSession(storedUserCurp);

          if (!dbSession || dbSession.sessionId !== storedSessionId || !dbSession.active) {
            await handleLogout('Session mismatch or inactive in DB');
            return;
          }

          // Check max session duration
          const sessionStartTime = dbSession.timestamp; 
          if (Date.now() - sessionStartTime > MAX_SESSION_DURATION_HOURS * 60 * 60 * 1000) {
            await handleLogout('Max session duration exceeded');
            return;
          }
          
          // Check inactivity from last stored activity time
          if (lastActivityStored) {
            const lastActivity = parseInt(lastActivityStored, 10);
            if (Date.now() - lastActivity > SESSION_TIMEOUT_MINUTES * 60 * 1000) {
                await handleLogout('Session expired due to inactivity (checked on load)');
                return;
            }
          }


          setCurrentUser(user);
          resetInactivityTimer(); // Start inactivity timer for current session

          // Set max duration timer
          if (maxSessionTimerRef.current) clearTimeout(maxSessionTimerRef.current);
          const timeRemainingMax = (sessionStartTime + MAX_SESSION_DURATION_HOURS * 60 * 60 * 1000) - Date.now();
          if (timeRemainingMax > 0) {
            maxSessionTimerRef.current = window.setTimeout(() => { // window.setTimeout returns number
              handleLogout('Max session duration reached');
            }, timeRemainingMax);
          } else { // Should have been caught above, but as a safeguard
             await handleLogout('Max session duration exceeded (safeguard)');
             return;
          }

        } else {
           // No stored CURP or Session ID, ensure clean state
           await handleLogout('No active session found locally');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        await handleLogout('Error during auth initialization');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handleLogout is stable due to useCallback with empty deps.

  const login = useCallback(async (user: User) => {
    let userToAuth = user;
    if (!user.hasLoggedInOnce) {
      const updatedUserForLogin = { ...user, hasLoggedInOnce: true };
      await updateStoredUser(updatedUserForLogin); 
      userToAuth = updatedUserForLogin;    
    }
    
    const newSessionId = generateId(); // Generate a unique session ID
    await setAuthSession(userToAuth.curp, newSessionId); // Store session in DB
    
    setCurrentUser(userToAuth);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGGED_IN_USER_CURP, userToAuth.curp);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ID, newSessionId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ACTIVITY_TIMESTAMP, Date.now().toString());

    resetInactivityTimer();

    // Set max duration timer for new session
    if (maxSessionTimerRef.current) clearTimeout(maxSessionTimerRef.current);
    maxSessionTimerRef.current = window.setTimeout(() => { // window.setTimeout returns number
        handleLogout('Max session duration reached');
    }, MAX_SESSION_DURATION_HOURS * 60 * 60 * 1000);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetInactivityTimer, handleLogout]); // Added handleLogout as it's used in timers

  const logout = useCallback(async () => {
    await handleLogout('User initiated logout');
  }, [handleLogout]);

  const updateCurrentUser = useCallback(async (updatedUserData: Partial<User>) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedUserData };
      updateStoredUser(newUser).catch(err => console.error("Failed to update user in DB:", err)); 
      return newUser;
    });
  }, []);


  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
