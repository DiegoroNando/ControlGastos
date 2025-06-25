import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { RegisterForm } from '../components/auth/AuthForms';
import { FaceLogin } from '../components/auth/FaceLogin';
import WelcomePage from '../components/auth/WelcomePage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import { ROUTES } from '../constants';
import { LoadingSpinner } from '../components/common/CommonComponents';
import DynamicBackgroundShapes from '../components/common/DynamicBackgroundShapes'; 
import LoginTransitionOverlay from '../components/common/LoginTransitionOverlay';
import { getUserByCurp, updateUser, isWhitelisted, resetPassword, getUsers } from '../services/databaseService';
import { generateToken } from '../constants';
import { sendVerificationEmail } from '../services/emailService';
import { PasswordStrengthIndicator } from '../components/auth/PasswordStrengthIndicator';

const ANIMATION_DURATION = 1500; // Duration for the login success transition animation + buffer in ms
const OVERLAY_TRANSITION_DURATION = 350; // Duration for the overlay's own enter/exit animation

const AuthPage: React.FC = () => {    const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot-password' | 'face-login' | 'welcome'>('login');
  const auth = useAuth();
  const navigate = useNavigate();
  const { success, error: showError, warning, info } = useToast();
  const [showLoginTransition, setShowLoginTransition] = useState(false);
  const overlayNodeRef = useRef<HTMLDivElement>(null);
  
  // Store the registered user data for welcome page and auto-login
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  
  // Estados para el formulario compacto de login
  const [curp, setCurp] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);  // Estados para autenticación facial
  const [usersWithFaceAuth, setUsersWithFaceAuth] = useState<User[]>([]);
  
  // Estado para mostrar campo de contraseña
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Estados para recuperación de contraseña
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2 | 3>(1);
  const [forgotCurp, setForgotCurp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');  const [isSendingResetToken, setIsSendingResetToken] = useState(false);

  // If auth context is still loading and there's no current user, show spinner.
  if (auth.isLoading && !auth.currentUser) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-gray dark:bg-neutral-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is logged in (either from a previous session or after successful login),
  // navigate to the dashboard. AuthPage should not be rendered.
  if (auth.currentUser) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // If we reach here, user is not logged in and auth context is not loading.  // Proceed to render login/register form.
  const handleRegistrationSuccess = async (user: User) => {
    // Store the user data for the welcome page and later auto-login
    setRegisteredUser(user);
    success('¡Registro completado! Bienvenido al sistema.');
    setCurrentView('welcome');
  };  const handleWelcomeContinue = async () => {
    // Auto-login the user after they've seen the welcome message
    if (registeredUser) {
      try {
        setShowLoginTransition(true); // Show transition animation
        setTimeout(async () => {
          await auth.login(registeredUser);
          // Navigation to dashboard will be handled automatically by AuthContext
        }, ANIMATION_DURATION);
      } catch (error) {
        console.error('Error logging in after welcome:', error);
        showError('Error al iniciar sesión. Por favor, inicia sesión manualmente.');
        setCurrentView('login');
      }
    } else {
      // Fallback: navigate to dashboard if user is already logged in
      navigate(ROUTES.DASHBOARD);
    }
  };
  const handleForgotPassword = () => {
    setCurrentView('forgot-password');
    setForgotPasswordStep(1);
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
    setForgotPasswordStep(1);
    setForgotCurp('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
  };
  const handleSendResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingResetToken(true);

    if (!forgotCurp) {
      showError('CURP es obligatorio.');
      setIsSendingResetToken(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    const user = await getUserByCurp(forgotCurp);
    if (!user) {
      showError('No se encontró una cuenta con este CURP.');
      setIsSendingResetToken(false);
      return;
    }
    if (!user.passwordDigest) {
       showError('Esta cuenta no tiene una contraseña establecida. Por favor, completa el registro o contacta al administrador.');
       setIsSendingResetToken(false);
       return;
    }

    // Generar token de recuperación
    const token = generateToken();
    const expiry = Date.now() + 30 * 60 * 1000; // 30 minutos

    // Actualizar usuario con token de recuperación
    const updatedUser: User = {
      ...user,
      registrationToken: token,
      registrationTokenExpiry: expiry
    };
    await updateUser(updatedUser);

    // Enviar email
    const emailSent = await sendVerificationEmail(user.email, token);
    if (emailSent) {
      // Obscuring email for privacy
      const obscuredEmail = user.email.replace(/^(.{2})(.*)@(.*)\.(.*)$/, (_, start, middle, domain, tld) => {
        const obscuredMiddle = '*'.repeat(Math.min(middle.length, 3));
        return `${start}${obscuredMiddle}@${domain.substring(0, 1)}...${domain.substring(domain.length-1)}.${tld}`;
      });
      
      setForgotPasswordStep(2);
      success(`Se ha enviado un código de recuperación a ${obscuredEmail}. Revisa tu bandeja de entrada y carpeta de spam.`);
    } else {
      showError('Error al enviar el correo. Intenta de nuevo más tarde.');
    }
    setIsSendingResetToken(false);
  };  const handleVerifyResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!resetToken || !newPassword || !confirmNewPassword) {
      showError('Todos los campos son obligatorios.');
      setIsLoading(false);
      return;
    }

    // Enhanced password validation
    if (newPassword.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    // Password strength check with warnings but not blocking
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumbers = /[0-9]/.test(newPassword);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(newPassword);

    if (newPassword.length < 8) {
      warning('Recomendamos usar una contraseña de al menos 8 caracteres para mayor seguridad.');
      // Continue with validation - just a warning
    } else if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
      warning('Su contraseña podría ser más segura si incluye mayúsculas, minúsculas, números y símbolos especiales.');
      // Continue with validation - just a warning
    }

    if (newPassword !== confirmNewPassword) {
      showError('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }
    
    const user = await getUserByCurp(forgotCurp);
    
    if (!user) {
      showError('Usuario no encontrado.');
      setIsLoading(false);
      return;
    }
    if (!user.registrationToken || !user.registrationTokenExpiry) {
      showError('Token no válido o usuario no encontrado (sin token).');
      setIsLoading(false);
      return;
    }

    if (user.registrationToken !== resetToken) {
      showError('Código de verificación incorrecto.');
      setIsLoading(false);
      return;
    }

    if (Date.now() > user.registrationTokenExpiry) {
      showError('El código de verificación ha expirado. Solicita uno nuevo.');
      setIsLoading(false);
      return;
    }

    // Use reset password service to properly hash and update the password
    const result = await resetPassword(forgotCurp, resetToken, newPassword);

    if (result.success) {
      success('¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.');
      setTimeout(() => {
        handleBackToLogin();
      }, 2000);
    } else {
      showError(result.message || 'Error al actualizar la contraseña. Intenta de nuevo.');
    }
    
    setIsLoading(false);
  };
    const handleLoginInitiation = async (loggedInUser: User) => {
    setShowLoginTransition(true); // Trigger visual transition
    setTimeout(async () => {
        await auth.login(loggedInUser); // Update auth context. This will cause a re-render.
                                  // The `if (auth.currentUser)` check above will then navigate.
    }, ANIMATION_DURATION); 
  };
  const handleCompactLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!curp || !password) {
      showError('CURP y contraseña son obligatorios.');
      setIsLoading(false);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Get user from database
      const user = await getUserByCurp(curp);
      
      // Import dinámico para evitar problemas de dependencia circular
      const { comparePassword, migratePasswordIfNeeded } = await import('../services/passwordService');
      
      // Verificar si el usuario existe en la lista blanca pero no tiene contraseña
      if (!user && await isWhitelisted(curp)) {
        // Usuario en lista blanca pero no ha completado registro
        setIsLoading(false);
        setCurrentView('register');
        info('Tu CURP está registrado en el sistema pero necesitas completar tu registro. Por favor, completa el formulario.');
        // Pre-rellenar el CURP en el formulario de registro (se implementará en RegisterForm)
        localStorage.setItem('prefilledCurp', curp);
        return;
      }
      
      if (!user || !user.passwordDigest) {
        showError('CURP o contraseña incorrectos.');
        setIsLoading(false);
        return;
      }      // Verificar contraseña usando el servicio de encriptación
      const isMatch = await comparePassword(password, user.passwordDigest);
      
      if (isMatch) {
        // Si la contraseña es correcta, verificamos si necesita ser migrada a un hash más seguro
        const migratedPassword = await migratePasswordIfNeeded(password, user.passwordDigest);
        
        // Preparar los datos del usuario actualizado
        let updatedUserData = { ...user };
        
        if (migratedPassword) {
          // Si la contraseña fue migrada, actualizamos el usuario con la nueva hash
          updatedUserData.passwordDigest = migratedPassword;
          console.log('Password migrated to more secure hash for user:', user.curp);
        }
        
        // Marcar que el usuario ha iniciado sesión al menos una vez
        if (!user.hasLoggedInOnce) {
          updatedUserData.hasLoggedInOnce = true;
        }
        
        // Actualizar usuario solo si hay cambios
        if (migratedPassword || !user.hasLoggedInOnce) {
          await updateUser(updatedUserData);
        }
        
        await handleLoginInitiation(updatedUserData);
      } else {
        showError('CURP o contraseña incorrectos.');
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      showError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    }
    
    setIsLoading(false);
  };

  // Load users with face authentication on component mount
  useEffect(() => {
    const loadUsersWithFaceAuth = async () => {
      try {
        const allUsers = await getUsers();
        const faceAuthUsers = allUsers.filter(user => user.hasFaceRegistered && user.faceId);
        setUsersWithFaceAuth(faceAuthUsers);
      } catch (error) {
        console.error('Error loading users with face authentication:', error);
      }
    };

    loadUsersWithFaceAuth();
  }, []);  
  // Check if passkey is supported on component mount
  useEffect(() => {
    const checkPasskeySupport = async () => {
      try {
        // Just check but don't store the result since we're not using it in the new design
        const { isPasskeySupported } = await import('../services/passkeyAuthService');
        isPasskeySupported(); // Call but don't store
      } catch (error) {
        console.error('Error checking passkey support:', error);
      }
    };
    
    checkPasskeySupport();
  }, []);

  const handleBackToLoginFromFace = () => {
    setCurrentView('login');
  };

  // Show welcome page if current view is welcome
  if (currentView === 'welcome') {
    return <WelcomePage onContinue={handleWelcomeContinue} registeredUser={registeredUser} />;
  }

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-neutral-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full opacity-10" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="backgroundPattern" patternUnits="userSpaceOnUse" width="100" height="100">
              <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.3"/>
              <circle cx="80" cy="50" r="1.5" fill="currentColor" opacity="0.2"/>
              <circle cx="50" cy="80" r="1" fill="currentColor" opacity="0.4"/>
              <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
              <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#backgroundPattern)"/>
        </svg>
      </div>
      <DynamicBackgroundShapes />
      
      <CSSTransition
        nodeRef={overlayNodeRef}
        in={showLoginTransition}
        timeout={OVERLAY_TRANSITION_DURATION}
        classNames="login-overlay-transition"
        unmountOnExit
      >
        <LoginTransitionOverlay ref={overlayNodeRef} />
      </CSSTransition>      <div className={`relative z-10 w-[90vw] h-[90vh] mx-auto rounded-container-first overflow-hidden transition-opacity duration-300 shadow-2xl ${showLoginTransition ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Contenedor principal con imagen de fondo completa */}
        <div className="relative w-full h-full flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-hidden">
          {/* Imagen de fondo principal */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/B1-02.png" 
              alt="Sistema de Votaciones - Comité de Ética" 
              className="w-full h-full object-cover transform scale-105 filter blur-[2px]"
            />            {/* Overlay con gradiente para mejorar contraste */}
            <div className="absolute inset-0 bg-gradient-to-br from-custom-pink/50 via-custom-pink/40 to-custom-pink/60 dark:from-custom-pink/60 dark:via-custom-pink/50 dark:to-custom-pink/70"></div>
          </div>
            {/* Inicio button - top right */}
          <div className={`absolute top-6 right-6 z-20 transition-all duration-500 ease-in-out ${currentView === 'login' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.05] border border-white/30">
              Inicio
            </button>
          </div>          {/* Vista de Login */}
          <div className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-500 ease-in-out ${currentView === 'login' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-full pointer-events-none'}`}>
            
            {/* Container for absolute positioning */}
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Títulos positioned absolutely on the left - Right aligned to end at same point, moved further left */}
              <div className="absolute left-4 lg:left-8 top-1/2 transform -translate-y-1/2 text-center lg:text-right z-10">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white text-shadow-lg mb-4 leading-tight">
                  BIENVENIDO
                </h1>
                <h2 className="text-sm sm:text-base lg:text-lg xl:text-xl text-yellow-300 font-light tracking-wide text-shadow mb-3">
                  USUARIO
                </h2>
              </div>

              {/* Organic blob with form - absolutely centered */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
                {/* Organic blob container using B1-03.png - increased size */}
                <div className="relative w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px] flex items-center justify-center">
                  
                  {/* B1-03.png blob background */}
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <img 
                      src="./PNG/B1-03.png" 
                      alt="Organic Blob Shape" 
                      className="w-full h-full object-contain filter drop-shadow-2xl"
                      style={{
                        filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.3)) drop-shadow(0 10px 10px rgba(0,0,0,0.2))',
                      }}
                    />
                  </div>                  {/* Form content inside blob - perfectly centered, NO BACKGROUND BOX */}
                  <div className="relative z-10 flex flex-col items-center justify-center p-6 max-w-[260px]">{/* Formulario de login */}
                    <div className="w-full space-y-4">
                      <form onSubmit={handleCompactLogin} className="space-y-4">
                        <input
                          type="text"
                          value={curp}
                          onChange={(e) => {
                            const newCurp = e.target.value.toUpperCase();
                            setCurp(newCurp);
                            if (!newCurp) {
                              setPassword('');
                              setShowPasswordField(false);
                            }
                          }}
                          placeholder="Escribe tu CURP"
                          className="w-full px-4 py-3 text-sm text-center bg-white text-black placeholder-black/60 border border-white/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white/70 transition-all shadow-lg font-medium"
                          maxLength={18}
                          required
                          disabled={isLoading}
                        />
                        
                        {/* Mostrar contraseña cuando se solicite */}
                        {showPasswordField && (
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}                            placeholder="Contraseña"
                            className="w-full px-4 py-3 text-sm text-center bg-transparent backdrop-blur-md border border-white/60 rounded-full placeholder-white/70 dark:placeholder-white/70 text-white dark:text-white focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white/70 transition-all shadow-lg font-medium"
                            required
                            disabled={isLoading}
                            autoFocus
                          />
                        )}
                        <button type="submit" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1}></button>
                      </form>
                    </div>                    {/* Register/Login button with white oval background */}
                    <div className="mt-4">
                      <div className=" backdrop-blur-md rounded-full p-1 shadow-lg">
                        <button
                          onClick={(e) => {
                            if (showPasswordField && curp && password) {
                              // Login if password field is shown and both fields are filled
                              handleCompactLogin(e as any);
                            } else {
                              // Register
                              setCurrentView('register');
                            }
                          }}
                          className="px-6 py-2.5  text-white text-sm font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.05] spectra-cta-pulse border-2 border-white/90"
                          disabled={isLoading}
                        >
                          {showPasswordField && curp && password ? 'Acceder' : 'Regístrate'}
                        </button>
                      </div>
                    </div>                    {/* Links below blob - smaller text to prevent wrapping */}

                  </div>
                </div>
              </div>
            </div>
          </div>          {/* Vista de Registro */}
          <div className={`absolute inset-0 z-10 transition-all duration-500 ease-in-out ${currentView === 'register' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-full pointer-events-none'}`}>
            <div className="w-full h-full">              {/* Contenedor del formulario de registro - Full width */}              <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-lg rounded-lg register-form-shadow border border-white/50 dark:border-neutral-700/60 p-6 lg:p-8 w-full h-full overflow-y-auto">
                {/* Header del formulario */}
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-custom-pink to-custom-pink-hover dark:from-custom-gold dark:to-custom-gold-hover bg-clip-text text-transparent mb-2">
                    Registro de Usuario
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Complete el proceso de registro para acceder al sistema
                  </p>
                  <div className="mt-2 sm:mt-3 w-12 sm:w-16 h-1 bg-gradient-to-r from-custom-pink to-custom-gold mx-auto rounded-full"></div>
                </div>
                
                {/* Formulario de registro */}
                <div className="register-form-container">
                  <RegisterForm onRegistrationSuccess={handleRegistrationSuccess} />
                </div>
                
                {/* Botón para volver al login */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-neutral-700 text-center">                  <button
                    onClick={() => {
                      setCurrentView('login');
                    }}
                    className="inline-flex items-center text-primary-maroon dark:text-accent-gold hover:text-primary-maroon-hover dark:hover:text-accent-gold-hover font-medium text-xs sm:text-sm transition-all duration-200 group spectra-nav-btn"
                  >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vista de Recuperación de Contraseña */}
          <div className={`absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6 lg:p-12 transition-all duration-500 ease-in-out ${currentView === 'forgot-password' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-y-full pointer-events-none'}`}>
            <div className="w-full max-w-sm sm:max-w-lg lg:max-w-xl mx-auto">              {/* Contenedor del formulario de recuperación */}
              <div className="bg-white/85 dark:bg-neutral-800/85 backdrop-blur-md rounded-container-second register-form-shadow border border-white/40 dark:border-neutral-700/50 p-4 sm:p-6 lg:p-8">
                {/* Header del formulario */}
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-custom-pink dark:text-custom-gold mb-2">
                    Recuperar Contraseña
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    {forgotPasswordStep === 1 && "Ingresa tu CURP para recibir un código de recuperación"}
                    {forgotPasswordStep === 2 && "Ingresa el código y tu nueva contraseña"}
                  </p>
                  <div className="mt-2 sm:mt-3 w-12 sm:w-16 h-1 bg-gradient-to-r from-custom-pink to-custom-gold mx-auto rounded-full"></div>
                </div>
                  {/* Formularios según el paso */}
                {forgotPasswordStep === 1 && (
                  <form onSubmit={handleSendResetToken} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-curp" className="block spectra-form-label-enhanced">
                        CURP
                      </label>
                      <input
                        id="forgot-curp"
                        type="text"
                        value={forgotCurp}
                        onChange={(e) => setForgotCurp(e.target.value.toUpperCase())}
                        placeholder="Ingresa tu CURP (18 caracteres)"
                        className="w-full spectra-form-enhanced"
                        maxLength={18}
                        required
                        disabled={isSendingResetToken}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendingResetToken || !forgotCurp}
                      className="mx-auto block min-w-[180px] max-w-xs w-full sm:w-auto px-6 py-2 spectra-btn-primary-enhanced spectra-btn-cta-pulse rounded-full text-white font-semibold text-base disabled:text-gray-400 disabled:bg-opacity-70"
                      style={{transition: 'background 0.2s, color 0.2s'}}
                    >
                      {isSendingResetToken ? 'Enviando...' : 'Enviar Código'}
                    </button>
                  </form>
                )}                {forgotPasswordStep === 2 && (
                  <form onSubmit={handleVerifyResetToken} className="space-y-6">
                    <div>
                      <label htmlFor="reset-token" className="block spectra-form-label-enhanced">
                        Código de Verificación
                      </label>
                      <p className="spectra-form-description-enhanced mb-3">
                        Revisa tu bandeja de entrada y carpeta de spam. El código expira en 30 minutos.
                      </p>
                      <input
                        id="reset-token"
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Ingresa el código de 6 dígitos"
                        className="w-full spectra-token-input-enhanced"
                        maxLength={6}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="spectra-info-card-enhanced">
                      <h4 className="spectra-form-section-header">Nueva Contraseña</h4>
                      <p className="spectra-form-description-enhanced mb-4">
                        Crea una contraseña segura para proteger tu cuenta.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="new-password" className="block spectra-form-label-enhanced">
                            Contraseña
                          </label>
                          <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres (recomendado 8+)"
                            className="w-full spectra-form-enhanced"
                            minLength={6}
                            required
                            disabled={isLoading}
                          />
                          
                          {/* Password strength indicator */}
                          <PasswordStrengthIndicator password={newPassword} className="mt-3 mb-3" />
                        </div>
                        
                        {/* Enhanced password requirements */}
                        <div className="spectra-password-requirements">
                          <p className="text-sm font-medium spectra-info-text-primary mb-2">
                            Para mayor seguridad, incluye:
                          </p>
                          <ul className="space-y-1">
                            <li className={`flex items-center space-x-2 ${newPassword.length >= 8 ? "spectra-requirement-met" : "spectra-requirement-pending"}`}>
                              <span className="spectra-requirement-icon">
                                {newPassword.length >= 8 ? "✓" : "○"}
                              </span>
                              <span>Al menos 8 caracteres</span>
                            </li>
                            <li className={`flex items-center space-x-2 ${(/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) ? "spectra-requirement-met" : "spectra-requirement-pending"}`}>
                              <span className="spectra-requirement-icon">
                                {(/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) ? "✓" : "○"}
                              </span>
                              <span>Letras mayúsculas y minúsculas</span>
                            </li>
                            <li className={`flex items-center space-x-2 ${/[0-9]/.test(newPassword) ? "spectra-requirement-met" : "spectra-requirement-pending"}`}>
                              <span className="spectra-requirement-icon">
                                {/[0-9]/.test(newPassword) ? "✓" : "○"}
                              </span>
                              <span>Al menos un número</span>
                            </li>
                            <li className={`flex items-center space-x-2 ${/[^A-Za-z0-9]/.test(newPassword) ? "spectra-requirement-met" : "spectra-requirement-pending"}`}>
                              <span className="spectra-requirement-icon">
                                {/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"}
                              </span>
                              <span>Al menos un símbolo especial (@#$%&*)</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div>
                          <label htmlFor="confirm-new-password" className="block spectra-form-label-enhanced">
                            Confirmar Contraseña
                          </label>
                          <input
                            id="confirm-new-password"
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Repite la nueva contraseña"
                            className={`w-full spectra-form-enhanced ${
                              confirmNewPassword && newPassword !== confirmNewPassword 
                                ? 'spectra-form-error-enhanced' 
                                : confirmNewPassword && newPassword === confirmNewPassword 
                                ? 'spectra-form-success-enhanced' 
                                : ''
                            }`}
                            required
                            disabled={isLoading}
                          />
                          {confirmNewPassword && newPassword !== confirmNewPassword && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                              <span className="mr-1">⚠</span>
                              Las contraseñas no coinciden
                            </p>
                          )}
                          {confirmNewPassword && newPassword === confirmNewPassword && (
                            <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                              <span className="mr-1">✓</span>
                              Las contraseñas coinciden
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !resetToken || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                      className="w-full spectra-btn-primary-enhanced spectra-btn-cta-pulse"
                    >
                      {isLoading ? 'Actualizando Contraseña...' : 'Actualizar Contraseña'}
                    </button>
                  </form>
                )}
                
                {/* Botón para volver al login */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-neutral-700 text-center">                  <button
                    onClick={handleBackToLogin}
                    className="inline-flex items-center text-primary-maroon dark:text-accent-gold hover:text-primary-maroon-hover dark:hover:text-accent-gold-hover font-medium text-xs sm:text-sm transition-all duration-200 group spectra-nav-btn"
                  >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vista de Autenticación Facial */}
          <div className={`absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6 lg:p-12 transition-all duration-500 ease-in-out ${currentView === 'face-login' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-y-full pointer-events-none'}`}>
            <div className="w-full max-w-sm sm:max-w-lg lg:max-w-xl mx-auto">
              {/* Contenedor del formulario de autenticación facial */}
              <div className="bg-white/85 dark:bg-neutral-800/85 backdrop-blur-md rounded-container-second register-form-shadow border border-white/40 dark:border-neutral-700/50 p-4 sm:p-6 lg:p-8">
                {/* Header del formulario */}
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-custom-pink dark:text-custom-gold mb-2">
                    Autenticación Biométrica
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Inicia sesión usando tu rostro registrado o passkey
                  </p>
                  <div className="mt-2 sm:mt-3 w-12 sm:w-16 h-1 bg-gradient-to-r from-custom-pink to-custom-gold mx-auto rounded-full"></div>
                </div>
                
                {/* Componente de autenticación facial */}
                <FaceLogin
                  onLoginSuccess={handleLoginInitiation}
                  onFallbackToCredentials={handleBackToLoginFromFace}
                  availableUsers={usersWithFaceAuth}
                />
                
                {/* Botón para volver al login */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-neutral-700 text-center">
                  <button
                    onClick={handleBackToLoginFromFace}
                    className="inline-flex items-center text-primary-maroon dark:text-accent-gold hover:text-primary-maroon-hover dark:hover:text-accent-gold-hover font-medium text-xs sm:text-sm transition-all duration-200 group spectra-nav-btn"
                  >
                    <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            </div>
          </div>          {/* Simplified footer - only visible in login view */}
          <div className={`absolute bottom-8 left-0 right-0 z-20 transition-all duration-500 ease-in-out ${currentView === 'login' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                    <div className="mt-6 text-center pt-1">
                      <div className="text-white/85 text-xs">
                        <button 
                          onClick={handleForgotPassword}
                          className="hover:text-white cursor-pointer transition-all duration-200 text-shadow-lg font-medium spectra-nav-btn"
                        >
                          Olvidé mi contraseña
                        </button>
                        <span className="mx-1">|</span>                        <button 
                          onClick={() => {
                            if (curp && !showPasswordField) {
                              // Show password field if CURP is entered
                              setShowPasswordField(true);
                            } else if (curp && password && showPasswordField) {
                              // Attempt login if both fields are filled
                              handleCompactLogin({ preventDefault: () => {} } as any);
                            }
                          }}
                          className="hover:text-white cursor-pointer transition-all duration-200 text-shadow-lg font-medium spectra-nav-btn"
                        >
                          Iniciar sesión                        </button>
                      </div>
                    </div>
            <div className="text-left pl-6 space-x-6 text-xs">
              <span className="text-white/75 hover:text-white/90 cursor-pointer transition-colors text-shadow-lg font-medium">
                Legal
              </span>
              <span className="text-white/75 hover:text-white/90 cursor-pointer transition-colors text-shadow-lg font-medium">
                Privacidad
              </span>
              <span className="text-white/75 hover:text-white/90 cursor-pointer transition-colors text-shadow-lg font-medium">
                Cookie
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
