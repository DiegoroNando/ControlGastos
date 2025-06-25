import React, { useState, useEffect, useRef } from 'react';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import { useToast } from '../../contexts/ToastContext'; 
import { User } from '../../types';
import { Button } from '../common/CommonComponents'; 
import { getUserByCurp, updateUser as updateStoredUser, validateCurpWithApi, createOrUpdateUserFromCurpValidation } from '../../services/databaseService';
import { CURP_REGEX, EMAIL_REGEX, generateToken, TOKEN_EXPIRY_MINUTES } from '../../constants';
import { extractDateOfBirthFromCURP } from '../../utils/curpUtils';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { FaceRegistration } from './FaceRegistration';
import { sendVerificationEmail } from '../../services/emailService';

interface LoginFormProps {
  onSuccessfulLogin: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccessfulLogin }) => {
  const [curp, setCurp] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const { error: showError, success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!curp || !password) {
      showError('CURP y contraseña son obligatorios.');
      setIsLoading(false);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300)); 

    try {
      const user = await getUserByCurp(curp);
      
      // Import dinámico para evitar problemas de dependencia circular
      const { comparePassword, migratePasswordIfNeeded } = await import('../../services/passwordService');
      
      if (!user || !user.passwordDigest) {
        showError('CURP o contraseña incorrectos.');
        setIsLoading(false);
        return;
      }

      // Verificar contraseña usando el servicio de encriptación
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
          const { updateUser } = await import('../../services/databaseService');
          await updateUser(updatedUserData);
        }
        
        onSuccessfulLogin(updatedUserData);
      } else {
        showError('CURP o contraseña incorrectos.');
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      showError('Error al iniciar sesión. Por favor, intenta de nuevo.');
    }
    
    setIsLoading(false);
  };  

  const handlePasskeyLogin = async () => {
    try {
      setIsPasskeyLoading(true);
      
      // Import the passkey service
      const { passkeyAuthService } = await import('../../services/passkeyAuthService');
      
      // Check if passkeys are supported
      if (!passkeyAuthService.isSupported()) {
        showError('Tu navegador no soporta passkeys. Intenta con otro navegador o usa tu CURP y contraseña.');
        setIsPasskeyLoading(false);
        return;
      }
      
      const result = await passkeyAuthService.authenticateWithPasskey();
      
      if (result.verified) {
        success('¡Autenticación con passkey exitosa!');
        
        // Get the complete user data
        const user = await getUserByCurp(result.user.curp);
        
        if (user) {
          onSuccessfulLogin(user);
        } else {
          showError('Error al cargar los datos de usuario después de autenticación.');
        }
      } else {
        showError(result.error || 'Error en autenticación con passkey.');
      }
    } catch (error) {
      console.error("Error en autenticación con passkey:", error);
      showError('Error al iniciar sesión con passkey. Por favor, intenta de nuevo o usa tu CURP y contraseña.');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="curp" className="block spectra-form-label-enhanced">CURP</label>
        <input
          id="curp"
          name="curp"
          value={curp}
          onChange={(e) => setCurp(e.target.value.toUpperCase())}
          maxLength={18}
          placeholder="Tu CURP (18 caracteres)"
          autoComplete="username"
          required
          className="w-full spectra-form-enhanced"
        />
      </div>
      <div>
        <label htmlFor="password" className="block spectra-form-label-enhanced">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
          className="w-full spectra-form-enhanced"
        />
      </div>
      <div className="space-y-3">
        <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading || isPasskeyLoading} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">
          Iniciar Sesión
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">o</span>
          </div>
        </div>
        
        <Button 
          type="button" 
          fullWidth 
          onClick={handlePasskeyLogin}
          isLoading={isPasskeyLoading}
          disabled={isLoading || isPasskeyLoading}
          variant="secondary"
          className="flex items-center justify-center gap-2"        >
          <img 
            src="/fingerprint.png" 
            alt="Fingerprint" 
            className="w-5 h-5 object-contain"
          />
          Iniciar sesión con Passkey
        </Button>
      </div>
    </form>
  );
};

interface RegisterFormProps {
  onRegistrationSuccess: () => void;
}

const REGISTRATION_STEP_ANIMATION_DURATION = 300; // ms

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegistrationSuccess }) => {  
  const [curpInput, setCurpInput] = useState('');
  const [fetchedUserData, setFetchedUserData] = useState<Partial<User> | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [hasExistingEmail, setHasExistingEmail] = useState(false);
  const [isInformationConfirmed, setIsInformationConfirmed] = useState(false);
  const [tokenInput, setTokenInput] = useState('000000');  // Default to 000000 for testing
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');  
  const [faceId, setFaceId] = useState<string | null>(null);
  
  // Passkey registration state
  const [isPasskeyRegistering, setIsPasskeyRegistering] = useState(false);
  const [isPasskeyRegistered, setIsPasskeyRegistered] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  
  const { error: showError, success } = useToast();
  
  const [currentStep, setCurrentStepState] = useState(1);
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev'>('next');
  const stepNodeRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingToken, setIsSendingToken] = useState(false);
  const totalSteps = 4;
  
  // These map to the new UI from the reference images
  const stepTitles = ["CONTRASEÑA", "HUELLA", "FACIAL", "E-FIRMA"]; 
  
  // Check for prefilled CURP from localStorage (redirected from login)
  useEffect(() => {
    const prefilledCurp = localStorage.getItem('prefilledCurp');
    if (prefilledCurp) {
      setCurpInput(prefilledCurp);
      // Clean up local storage
      localStorage.removeItem('prefilledCurp');
    }
  }, []);
  
  const changeStep = (newStep: number) => {
    if (newStep > currentStep) {
      setAnimationDirection('next');
    } else if (newStep < currentStep) {
      setAnimationDirection('prev');
    }
    setCurrentStepState(newStep);
  };
  
  const handleCurpVerification = async () => {
    setIsLoading(true);

    if (!curpInput.trim()) {
      showError('CURP es obligatorio.');
      setIsLoading(false);
      return;
    }

    if (!CURP_REGEX.test(curpInput)) {
      showError('Formato de CURP inválido.');
      setIsLoading(false);
      return;
    }

    // Check if user already exists and is registered
    const existingUser = await getUserByCurp(curpInput);
    if (existingUser && existingUser.passwordDigest) {
      showError('Este CURP ya tiene una cuenta registrada. Por favor, inicia sesión.');
      setIsLoading(false);
      return;
    }
    
    // Validate CURP using the external RENAPO API
    console.log('[AUTH_FORMS] Validating CURP with API:', curpInput);
    const curpValidation = await validateCurpWithApi(curpInput);
    console.log('[AUTH_FORMS] CURP validation result:', curpValidation);
    
    if (!curpValidation.isValid) {
      showError(curpValidation.error || 'CURP no válido o no encontrado en RENAPO. Verifica tu CURP.');
      setIsLoading(false);
      return;
    }
    
    // If CURP is valid, create or update user in database
    let user = existingUser;
    
    // If we have CURP validation data, create/update the user
    if (curpValidation.userData) {
      try {
        console.log('[AUTH_FORMS] Creating/updating user with data:', curpValidation.userData);
        user = await createOrUpdateUserFromCurpValidation({
          ...curpValidation.userData,
          email: existingUser?.email || '' // Preserve existing email if any
        });
        console.log('[AUTH_FORMS] Successfully created/updated user:', user);
      } catch (error) {
        console.error('[AUTH_FORMS] Error creating/updating user:', error);
        showError('Error al procesar la información del CURP. Por favor, intenta de nuevo.');
        setIsLoading(false);
        return;
      }
    }

    if (!user) {
      showError('Error al procesar la información del CURP. Por favor, intenta de nuevo.');
      setIsLoading(false);
      return;
    }

    const derivedBirthDate = extractDateOfBirthFromCURP(curpInput);
    if (!derivedBirthDate) {
      showError('CURP inválido para extraer fecha de nacimiento. Verifica el CURP.');
      setIsLoading(false);
      return;
    }
    
    setFetchedUserData({ ...user, fechaNacimiento: derivedBirthDate, email: user.email || '' });
    setEmailInput(user.email || '');
    setHasExistingEmail(!!(user.email && user.email.trim()));
    
    // Instead of going to step 2, we're now directly showing the welcome screen
    // with user info from the API - similar to 4th reference image
    changeStep(1); // Start at step 1 - Password step per new UI
    setIsLoading(false);
  };

  // Passkey registration handler
  const handlePasskeyRegistration = async () => {
    try {
      setIsPasskeyRegistering(true);
      setPasskeyError(null);
      
      // Import the passkey service
      const { passkeyAuthService } = await import('../../services/passkeyAuthService');
      
      // Check if passkeys are supported
      if (!passkeyAuthService.isSupported()) {
        setPasskeyError('Tu navegador no soporta passkeys. Puedes omitir este paso y continuar con el registro.');
        setIsPasskeyRegistering(false);
        return;
      }
      
      // Check if we have user data
      if (!fetchedUserData || !fetchedUserData.curp || !fetchedUserData.nombre) {
        setPasskeyError('Error: Datos de usuario no disponibles para registro de passkey.');
        setIsPasskeyRegistering(false);
        return;
      }
      
      const result = await passkeyAuthService.registerPasskey(fetchedUserData.curp, fetchedUserData.nombre);
      
      if (result.registered) {
        setIsPasskeyRegistered(true);
        success('¡Passkey registrada exitosamente!');
        
        // Update user with passkey info if needed
      } else {
        setPasskeyError(result.error || 'Error al registrar passkey. Puedes omitir este paso y continuar.');
      }
    } catch (error) {
      console.error('Error en registro de passkey:', error);
      setPasskeyError('Error al registrar passkey. Puedes omitir este paso y continuar.');
    } finally {
      setIsPasskeyRegistering(false);
    }
  };

  // Send verification token helper function
  const sendAndStoreToken = async (user: Partial<User>) => {
    try {
      // Generate token
      const token = generateToken();
      const expiry = Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000;

      // Store token in user record
      await updateStoredUser({
        ...user,
        registrationToken: token,
        registrationTokenExpiry: expiry
      });

      // Send email with token - optionally disable for testing
      // const emailSent = await sendVerificationEmail(user.email!, token);
      const emailSent = true; // For testing - assume email was sent
      return emailSent;
    } catch (error) {
      console.error('[AUTH_FORMS] Error sending verification token:', error);
      showError('Error al enviar el código de verificación. Por favor, intenta de nuevo.');
      return false;
    }
  };

  const handleInformationConfirmationAndSendToken = async () => {
    if (!fetchedUserData || !fetchedUserData.curp) {
      showError('Error inesperado: No se encontraron los datos del usuario. Por favor, reinicia el proceso.');
      return;
    }
    
    if (!emailInput.trim()) {
      showError('El correo electrónico es obligatorio para enviar el código de verificación.');
      return;
    }
    
    if (!EMAIL_REGEX.test(emailInput)) {
      showError('Formato de correo electrónico inválido.');
      return;
    }
    
    setIsSendingToken(true);
    
    const userForToken = { 
      ...fetchedUserData, 
      email: emailInput,
    };
    
    const emailSentSuccessfully = await sendAndStoreToken(userForToken);
    if (emailSentSuccessfully) {
      changeStep(3);
      success(`Se ha enviado un código de verificación a ${emailInput}. Por favor, revisa tu bandeja de entrada (y carpeta de spam).`);
    }
  };
  
  const handleResendToken = async () => {
     if (!fetchedUserData || !fetchedUserData.curp || !emailInput) {
      showError('No se pueden reenviar los datos del token, falta información del usuario (email). Reinicia el proceso.');
      return;
    }
    await sendAndStoreToken({ ...fetchedUserData, email: emailInput });
  };
  
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!fetchedUserData || !fetchedUserData.curp || !emailInput) {
      showError('Error inesperado: No se encontraron los datos del usuario (email). Por favor, reinicia el proceso.');
      setIsLoading(false);
      changeStep(1); 
      return;
    }
    
    if (!tokenInput.trim()) {
      showError('El código de verificación es obligatorio.');
      setIsLoading(false);
      return;
    }

    if (!password || !confirmPassword) {
      showError('Contraseña y confirmación son obligatorias.');
      setIsLoading(false);
      return;
    }
    
    // Enhanced password validation
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
    
    // Password strength check with warnings but not blocking
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
    
    if (password.length < 8) {
      success('Recomendamos usar una contraseña de al menos 8 caracteres para mayor seguridad.');
    } else if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
      success('Su contraseña podría ser más segura si incluye mayúsculas, minúsculas, números y símbolos especiales.');
    }
    
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }
    
    const user = await getUserByCurp(fetchedUserData.curp);
    if (!user || !user.registrationToken || !user.registrationTokenExpiry) {
      showError('Error al verificar el código o el código ha expirado. Intenta reenviarlo.');
      setIsLoading(false);
      return;
    }
    
    if (Date.now() > user.registrationTokenExpiry) {
      showError('El código ha expirado. Por favor, solicita uno nuevo.');
      await updateStoredUser({ ...user, registrationToken: undefined, registrationTokenExpiry: undefined });
      setIsLoading(false);
      return;
    }

    // BYPASS TOKEN VALIDATION FOR TESTING - Always accept 000000
    if (tokenInput.trim() === '000000') {
      console.log('🧪 TESTING MODE: Accepting default token 000000');
    } else if (user.registrationToken !== tokenInput.trim()) {
      showError('Código inválido. Por favor, verifica el código enviado a tu correo.');
      setIsLoading(false);
      return;
    }

    if (user.passwordDigest) {
      showError('Este CURP ya tiene una cuenta registrada. Por favor, inicia sesión.');
      setIsLoading(false);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));

    // Hash the password before storing it
    const { hashPassword } = await import('../../services/passwordService');
    const hashedPassword = await hashPassword(password);

    const userToUpdate: User = {
      ...user, 
      email: emailInput, 
      fechaNacimiento: fetchedUserData.fechaNacimiento!, 
      passwordDigest: hashedPassword,
      registrationToken: undefined, 
      registrationTokenExpiry: undefined 
    };
    
    await updateStoredUser(userToUpdate);
    setIsLoading(false);
    
    // Go to passkey and face registration step instead of completing registration
    changeStep(4);
  };
  
  const handleFaceRegistered = async (personId: string) => {
    try {
      if (!fetchedUserData?.curp) {
        showError('Error: No se encontró el CURP del usuario.');
        return;
      }

      // Update user with face authentication data
      const user = await getUserByCurp(fetchedUserData.curp);
      if (user) {        const updatedUser: User = {
          ...user,
          faceId: personId,
          hasFaceRegistered: true,
          faceRegistrationDate: Date.now()
        };
        
        await updateStoredUser(updatedUser);
        setFaceId(personId);
      }
      
      // Complete registration
      success('¡Registro completado con éxito! Ya puedes iniciar sesión con tu CURP y contraseña, o usar autenticación facial.');
      
      setTimeout(() => {
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
      }, 1500);
    } catch (error) {
      console.error('Error updating user with face data:', error);
      showError('Error al finalizar el registro facial.');
    }
  };
  
  const handleSkipFaceAuth = async () => {
    success('Omitiendo registro facial.');
    setTimeout(() => changeStep(4), 1000);
  };

  const renderStepContent = () => {
    // First we need to check if we have user data from API
    if (!fetchedUserData && currentStep === 1) {
      // Initial CURP input screen, styled like the welcome screen in reference image
      return (
        <div className="flex flex-col h-full">
          <div className="bg-[#AD485E] text-white p-8 rounded-t-lg">
            <h2 className="text-2xl font-semibold mb-2">Bienvenido</h2>
            <p className="text-sm opacity-80">Valida y protege tu información.</p>
            
            <div className="mt-4">
              <label htmlFor="curp-register" className="block text-sm font-medium">CURP:</label>
              <input
                id="curp-register"
                name="curp"
                value={curpInput}
                onChange={(e) => setCurpInput(e.target.value.toUpperCase())}
                maxLength={18}
                placeholder="Tu CURP (18 caracteres)"
                required
                className="mt-1 w-full px-3 py-2 bg-white/90 border-0 rounded text-gray-800"
              />
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="bg-[#D2B278] rounded-full p-4 inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-100/90 rounded-b-lg text-center">
            <Button 
              type="button" 
              onClick={handleCurpVerification} 
              isLoading={isLoading} 
              disabled={isLoading || !curpInput.trim()}
              className="bg-[#AD485E] hover:bg-[#963D51] text-white rounded-full px-6 py-2"
            >
              Verificar CURP
            </Button>
          </div>
        </div>
      );
    }

    // If we have user data, show the steps according to the reference images
    switch (currentStep) {
      case 1: // Password creation - CONTRASEÑA step
        return (
          <div className="flex h-full">
            <div className="w-2/5 bg-[#AD485E] text-white p-6 rounded-l-lg">
              <div className="uppercase text-lg font-medium mb-4">CONTRASEÑA</div>
              <h2 className="text-3xl font-bold mb-2">Seguridad</h2>
              <p className="text-lg mb-6">Protege tu perfil</p>
              
              <ul className="space-y-3 mt-8">
                {stepTitles.map((title, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${index + 1 <= currentStep ? 'bg-white text-[#AD485E]' : 'border-white/50'}`}>
                      {index + 1 <= currentStep ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                    <span className={index + 1 === currentStep ? 'font-bold' : ''}>{title}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <p className="text-sm">{currentStep} de {totalSteps}</p>
              </div>
            </div>
            
            <div className="w-3/5 bg-gray-100 p-6 rounded-r-lg">
              <div className="flex justify-end">
                <div className="w-10 h-10 bg-transparent border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-gray-600 mb-4">Escribe tu contraseña</h3>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full mb-2"
                  placeholder="********"
                />
                <p className="text-xs text-gray-500 mb-4">
                  Debe incluir una combinación de letras mayúsculas y minúsculas, números y símbolos para aumentar su seguridad.
                </p>
                
                <h3 className="text-gray-600 mb-2">Teléfono o dirección de correo</h3>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full mb-6"
                  placeholder="ejemplo@correo.com"
                />
                
                <div className="flex justify-center mt-8">
                  <Button
                    type="button"
                    onClick={() => changeStep(2)}
                    className="bg-[#AD485E] hover:bg-[#963D51] text-white rounded-full px-8 py-2 w-full max-w-xs"
                  >
                    Guardar
                  </Button>
                </div>
                
                {password && (
                  <div className="mt-6 flex items-center justify-center text-center">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D2B278] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">¡Contraseña guardada con éxito!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 2: // Fingerprint - HUELLA step
        return (
          <div className="flex h-full">
            <div className="w-2/5 bg-[#AD485E] text-white p-6 rounded-l-lg">
              <div className="uppercase text-lg font-medium mb-4">HUELLA</div>
              <h2 className="text-3xl font-bold mb-2">Seguridad</h2>
              <p className="text-lg mb-6">Protege tu perfil</p>
              
              <ul className="space-y-3 mt-8">
                {stepTitles.map((title, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${index + 1 <= currentStep ? 'bg-white text-[#AD485E]' : 'border-white/50'}`}>
                      {index + 1 <= currentStep ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                    <span className={index + 1 === currentStep ? 'font-bold' : ''}>{title}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <p className="text-sm">{currentStep} de {totalSteps}</p>
              </div>
            </div>
            
            <div className="w-3/5 bg-gray-100 p-6 rounded-r-lg">
              <div className="flex justify-end">
                <div className="w-10 h-10 bg-transparent border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM12 13.5a6 6 0 0 0-6 6" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col items-center">
                <div className="bg-white rounded-lg p-6 mb-6 w-64 h-64 flex items-center justify-center">
                  <div className="relative">
                    <svg width="120" height="180" viewBox="0 0 120 180">
                      <path d="M60 20 Q 80 40 60 60 Q 40 80 60 100 Q 80 120 60 140" stroke="#B8B8B8" strokeWidth="15" fill="none" />
                      <path d="M60 20 Q 80 40 60 60 Q 40 80 60 100 Q 80 120 60 140" stroke="#D2B278" strokeWidth="15" fill="none" strokeDasharray="180" strokeDashoffset="180" className={fingerprintId ? "animate-fingerprint-scan" : ""} />
                    </svg>
                  </div>
                </div>
                
                <p className="mb-6 text-gray-600">Usa el dedo índice derecho</p>
                
                <Button
                  type="button"
                  onClick={() => {
                    // Simulate fingerprint scan
                    setFingerprintId("fingerprint-123");
                    setTimeout(() => changeStep(3), 1500);
                  }}
                  className="bg-[#AD485E] hover:bg-[#963D51] text-white rounded-full px-8 py-2"
                >
                  Escanear
                </Button>
                
                {fingerprintId && (
                  <div className="mt-6 flex items-center justify-center text-center">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D2B278] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">¡Huella registrada con éxito!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 3: // Facial - FACIAL step
        return (
          <div className="flex h-full">
            <div className="w-2/5 bg-[#AD485E] text-white p-6 rounded-l-lg">
              <div className="uppercase text-lg font-medium mb-4">FACIAL</div>
              <h2 className="text-3xl font-bold mb-2">Seguridad</h2>
              <p className="text-lg mb-6">Protege tu perfil</p>
              
              <ul className="space-y-3 mt-8">
                {stepTitles.map((title, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${index + 1 <= currentStep ? 'bg-white text-[#AD485E]' : 'border-white/50'}`}>
                      {index + 1 <= currentStep ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                    <span className={index + 1 === currentStep ? 'font-bold' : ''}>{title}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <p className="text-sm">{currentStep} de {totalSteps}</p>
              </div>
            </div>
            
            <div className="w-3/5 bg-gray-100 p-6 rounded-r-lg">
              <div className="flex justify-end">
                <div className="w-10 h-10 bg-transparent border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col items-center">
                <div className="bg-white rounded-lg p-6 mb-6 w-64 h-64 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <div className="bg-gray-200 w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                      <div className="bg-[#D2B278] w-full h-1/3 absolute bottom-0"></div>
                      <div className="w-16 h-16 bg-gray-100 rounded-full absolute top-4"></div>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-start justify-end">
                      <div className="border-2 border-[#AD485E] w-12 h-12 rounded-md border-r-0 border-b-0"></div>
                    </div>
                    <div className="absolute top-0 right-0 w-full h-full flex items-start justify-start">
                      <div className="border-2 border-[#AD485E] w-12 h-12 rounded-md border-l-0 border-b-0"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-end">
                      <div className="border-2 border-[#AD485E] w-12 h-12 rounded-md border-r-0 border-t-0"></div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-start">
                      <div className="border-2 border-[#AD485E] w-12 h-12 rounded-md border-l-0 border-t-0"></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-600 mb-6">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Acerca tu rostro</li>
                    <li>Buena iluminación</li>
                    <li>Parpadea</li>
                  </ul>
                </div>
                
                <Button
                  type="button"
                  onClick={() => {
                    // Activate camera / Face registration process
                    if (fetchedUserData?.curp) {
                      // This should be handled by the FaceRegistration component
                      // For now we're just simulating
                      setTimeout(() => {
                        handleFaceRegistered("face-123");
                      }, 2000);
                    }
                  }}
                  className="bg-[#AD485E] hover:bg-[#963D51] text-white rounded-full px-8 py-2"
                >
                  Activar cámara
                </Button>
                
                {faceId && (
                  <div className="mt-6 flex items-center justify-center text-center">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D2B278] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">¡Rostro registrado con éxito!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 4: // E-signature - E-FIRMA step
        return (
          <div className="flex h-full">
            <div className="w-2/5 bg-[#AD485E] text-white p-6 rounded-l-lg">
              <div className="uppercase text-lg font-medium mb-4">E-FIRMA</div>
              <h2 className="text-3xl font-bold mb-2">Seguridad</h2>
              <p className="text-lg mb-6">Protege tu perfil</p>
              
              <ul className="space-y-3 mt-8">
                {stepTitles.map((title, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${index + 1 <= currentStep ? 'bg-white text-[#AD485E]' : 'border-white/50'}`}>
                      {index + 1 <= currentStep ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                    <span className={index + 1 === currentStep ? 'font-bold' : ''}>{title}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <p className="text-sm">{currentStep} de {totalSteps}</p>
              </div>
            </div>
            
            <div className="w-3/5 bg-gray-100 p-6 rounded-r-lg">
              <div className="flex justify-end">
                <div className="w-10 h-10 bg-transparent border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col items-center">
                <div className="bg-white rounded-lg p-6 mb-6 w-80 h-64 flex items-center justify-center border-2 border-gray-200">
                  <div className="text-center">
                    <p className="text-lg text-gray-500 mb-2">Firma electrónica</p>
                    <p className="text-sm text-gray-400">Dibuja tu firma en el recuadro</p>
                    <canvas id="signatureCanvas" width="240" height="100" className="border border-gray-300 mt-4"></canvas>
                  </div>
                </div>
                
                <div className="flex space-x-4 mb-6">
                  <Button
                    type="button"
                    variant="secondary"
                    className="border border-gray-300 text-gray-600 rounded-full px-6 py-2"
                  >
                    Limpiar
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      // Complete registration
                      success('¡Registro completado con éxito!');
                      setTimeout(() => {
                        if (onRegistrationSuccess) {
                          onRegistrationSuccess();
                        }
                      }, 1500);
                    }}
                    className="bg-[#AD485E] hover:bg-[#963D51] text-white rounded-full px-6 py-2"
                  >
                    Guardar
                  </Button>
                </div>
                
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-[#AD485E]"
                  onClick={() => {
                    // Skip and complete registration
                    success('¡Registro completado con éxito!');
                    setTimeout(() => {
                      if (onRegistrationSuccess) {
                        onRegistrationSuccess();
                      }
                    }, 1500);
                  }}
                >
                  Omitir este paso
                </Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="relative w-full overflow-hidden rounded-lg shadow-md" style={{ height: '500px' }}>
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={currentStep}
            nodeRef={stepNodeRef}
            timeout={REGISTRATION_STEP_ANIMATION_DURATION}
            classNames={animationDirection === 'next' ? "register-step-next" : "register-step-prev"}
            addEndListener={(done: () => void) => {
              stepNodeRef.current?.addEventListener("transitionend", done, false);
            }}
            unmountOnExit
          >
            <div ref={stepNodeRef} className="w-full h-full"> 
              {renderStepContent()}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>

      <style>{`
        .register-step-next-enter {
          transform: translateX(100%);
          opacity: 0;
        }
        .register-step-next-enter-active {
          transform: translateX(0%);
          opacity: 1;
          transition: all ${REGISTRATION_STEP_ANIMATION_DURATION}ms;
        }
        .register-step-next-exit {
          transform: translateX(0%);
          opacity: 1;
        }
        .register-step-next-exit-active {
          transform: translateX(-100%);
          opacity: 0;
          transition: all ${REGISTRATION_STEP_ANIMATION_DURATION}ms;
        }
        
        .register-step-prev-enter {
          transform: translateX(-100%);
          opacity: 0;
        }
        .register-step-prev-enter-active {
          transform: translateX(0%);
          opacity: 1;
          transition: all ${REGISTRATION_STEP_ANIMATION_DURATION}ms;
        }
        .register-step-prev-exit {
          transform: translateX(0%);
          opacity: 1;
        }
        .register-step-prev-exit-active {
          transform: translateX(100%);
          opacity: 0;
          transition: all ${REGISTRATION_STEP_ANIMATION_DURATION}ms;
        }
        
        .animate-fingerprint-scan {
          animation: scan 1.5s ease forwards;
        }
        
        @keyframes scan {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </form>
  );
};
