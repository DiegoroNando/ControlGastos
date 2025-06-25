// import React, { useState, useEffect } from 'react';
// import { useToast } from '../../contexts/ToastContext';
// import { User } from '../../types';
// import { getUserByCurp, updateUser as updateStoredUser, validateCurpWithApi, createOrUpdateUserFromCurpValidation } from '../../services/databaseService';
// import { CURP_REGEX, EMAIL_REGEX, generateToken, TOKEN_EXPIRY_MINUTES } from '../../constants';
// import { extractDateOfBirthFromCURP } from '../../utils/curpUtils';
// import PasswordStrengthIndicator from './PasswordStrengthIndicator';
// import { FaceRegistration } from './FaceRegistration';
// import { Button } from '../common/CommonComponents';

// interface LoginFormProps {
//   onSuccessfulLogin: (user: User) => void;
// }

// export const LoginForm: React.FC<LoginFormProps> = ({ onSuccessfulLogin }) => {
//   const [curp, setCurp] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
//   const { error: showError, success } = useToast();
//   // const { login } = useAuth(); // login call will be handled by AuthPage
//   // const navigate = useNavigate(); // navigation will be handled by AuthPage
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);    if (!curp || !password) {
//       showError('CURP y contraseña son obligatorios.');
//       setIsLoading(false);
//       return;
//     }
    
//     await new Promise(resolve => setTimeout(resolve, 300)); 

//     try {      const user = await getUserByCurp(curp);
      
//       // Import dinámico para evitar problemas de dependencia circular
//       const { comparePassword, migratePasswordIfNeeded } = await import('../../services/passwordService');
      
//       if (!user || !user.passwordDigest) {
//         showError('CURP o contraseña incorrectos.');
//         setIsLoading(false);
//         return;
//       }

//       // Verificar contraseña usando el servicio de encriptación
//       const isMatch = await comparePassword(password, user.passwordDigest);
      
//       if (isMatch) {
//         // Si la contraseña es correcta, verificamos si necesita ser migrada a un hash más seguro
//         const migratedPassword = await migratePasswordIfNeeded(password, user.passwordDigest);
        
//         // Preparar los datos del usuario actualizado
//         let updatedUserData = { ...user };
        
//         if (migratedPassword) {
//           // Si la contraseña fue migrada, actualizamos el usuario con la nueva hash
//           updatedUserData.passwordDigest = migratedPassword;
//           console.log('Password migrated to more secure hash for user:', user.curp);
//         }
        
//         // Marcar que el usuario ha iniciado sesión al menos una vez
//         if (!user.hasLoggedInOnce) {
//           updatedUserData.hasLoggedInOnce = true;
//         }
        
//         // Actualizar usuario solo si hay cambios
//         if (migratedPassword || !user.hasLoggedInOnce) {
//           const { updateUser } = await import('../../services/databaseService');
//           await updateUser(updatedUserData);
//         }
        
//         onSuccessfulLogin(updatedUserData);
//         // login(user); // Moved to AuthPage after transition
//         // navigate(ROUTES.DASHBOARD); // Moved to AuthPage after transition
//       } else {
//         showError('CURP o contraseña incorrectos.');
//       }
//     } catch (error) {
//       console.error("Error en autenticación:", error);
//       showError('Error al iniciar sesión. Por favor, intenta de nuevo.');
//     }
    
//     setIsLoading(false);
//   };  

//   const handlePasskeyLogin = async () => {
//     try {
//       setIsPasskeyLoading(true);
      
//       // Import the passkey service
//       const { passkeyAuthService } = await import('../../services/passkeyAuthService');
      
//       // Check if passkeys are supported
//       if (!passkeyAuthService.isSupported()) {
//         showError('Tu navegador no soporta passkeys. Intenta con otro navegador o usa tu CURP y contraseña.');
//         setIsPasskeyLoading(false);
//         return;
//       }
      
//       const result = await passkeyAuthService.authenticateWithPasskey();
      
//       if (result.verified) {
//         success('¡Autenticación con passkey exitosa!');
        
//         // Get the complete user data
//         const user = await getUserByCurp(result.user.curp);
        
//         if (user) {
//           onSuccessfulLogin(user);
//         } else {
//           showError('Error al cargar los datos de usuario después de autenticación.');
//         }
//       } else {
//         showError(result.error || 'Error en autenticación con passkey.');
//       }
//     } catch (error) {
//       console.error("Error en autenticación con passkey:", error);
//       showError('Error al iniciar sesión con passkey. Por favor, intenta de nuevo o usa tu CURP y contraseña.');
//     } finally {
//       setIsPasskeyLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div>        <label htmlFor="curp" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">CURP</label>
//         <input
//           id="curp"
//           name="curp"
//           value={curp}
//           onChange={(e) => setCurp(e.target.value.toUpperCase())}
//           maxLength={18}
//           placeholder="Tu CURP (18 caracteres)"
//           autoComplete="username"
//           required
//           className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm"
//         />
//       </div>
//       <div>        <label htmlFor="password" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Contraseña</label>
//         <input
//           id="password"
//           name="password"
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Tu contraseña"
//           autoComplete="current-password"
//           required
//           className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm"
//         />
//       </div>      <div className="space-y-3">
//         <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading || isPasskeyLoading} size="md">
//           Iniciar Sesión
//         </Button>
        
//         <div className="relative">
//           <div className="absolute inset-0 flex items-center">
//             <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
//           </div>
//           <div className="relative flex justify-center text-sm">            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">o</span>
//           </div>
//         </div>
        
//         <Button 
//           type="button" 
//           fullWidth 
//           onClick={handlePasskeyLogin}
//           isLoading={isPasskeyLoading}
//           disabled={isLoading || isPasskeyLoading}
//           variant="secondary"
//           className="flex items-center justify-center gap-2"
//         >
//           <img 
//             src="/fingerprint.png" 
//             alt="Fingerprint" 
//             className="w-5 h-5 object-contain"
//           />
//           Iniciar sesión con Passkey
//         </Button>
//       </div>
//     </form>
//   );
// };

// interface RegisterFormProps {
//   onRegistrationSuccess: (user: User) => void;
// }

// export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegistrationSuccess }) => {
//   const [curpInput, setCurpInput] = useState('');
//   const [fetchedUserData, setFetchedUserData] = useState<Partial<User> | null>(null);  const [emailInput, setEmailInput] = useState('');
//   const [isInformationConfirmed, setIsInformationConfirmed] = useState(false);
//   const [tokenInput, setTokenInput] = useState('000000');  const [password, setPassword] = useState('');
//   const [faceId, setFaceId] = useState<string | null>(null);
  
//   // Passkey registration state
//   const [isPasskeyRegistering, setIsPasskeyRegistering] = useState(false);
//   const [isPasskeyRegistered, setIsPasskeyRegistered] = useState(false);
//   const [passkeyError, setPasskeyError] = useState<string | null>(null);
  
//   const { error: showError, success } = useToast();
  
//   const [currentStep, setCurrentStepState] = useState<number>(1);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSendingToken, setIsSendingToken] = useState(false);
  
//   // Check for prefilled CURP from localStorage (redirected from login)
//   useEffect(() => {
//     const prefilledCurp = localStorage.getItem('prefilledCurp');
//     if (prefilledCurp) {
//       setCurpInput(prefilledCurp);
//       localStorage.removeItem('prefilledCurp');
//     }  }, []);
  
//   const changeStep = (newStep: number) => {
//     setCurrentStepState(newStep);
//   };
  
//   const handleCurpVerification = async () => {
//     setIsLoading(true);

//     if (!curpInput.trim()) {
//       showError('CURP es obligatorio.');
//       setIsLoading(false);
//       return;
//     }

//     if (!CURP_REGEX.test(curpInput)) {
//       showError('Formato de CURP inválido.');
//       setIsLoading(false);
//       return;
//     }

//     // Check if user already exists and is registered
//     const existingUser = await getUserByCurp(curpInput);
//     if (existingUser && existingUser.passwordDigest) {
//       showError('Este CURP ya tiene una cuenta registrada. Por favor, inicia sesión.');
//       setIsLoading(false);
//       return;
//     }    // Validate CURP using the external RENAPO API
//     console.log('[AUTH_FORMS] Validating CURP with API:', curpInput);
//     const curpValidation = await validateCurpWithApi(curpInput);
//     console.log('[AUTH_FORMS] CURP validation result:', curpValidation);
    
//     if (!curpValidation.isValid) {
//       showError(curpValidation.error || 'CURP no válido o no encontrado en RENAPO. Verifica tu CURP.');
//       setIsLoading(false);
//       return;
//     }    // If CURP is valid, create or update user in database
//     let user = existingUser;
    
//     // If we have CURP validation data, create/update the user
//     if (curpValidation.userData) {
//       try {
//         console.log('[AUTH_FORMS] Creating/updating user with data:', curpValidation.userData);
//         user = await createOrUpdateUserFromCurpValidation({
//           ...curpValidation.userData,
//           email: existingUser?.email || '' // Preserve existing email if any
//         });
//         console.log('[AUTH_FORMS] Successfully created/updated user:', user);      } catch (error) {
//         console.error('[AUTH_FORMS] Error creating/updating user:', error);
//         showError('Error al procesar la información del CURP. Por favor, intenta de nuevo.');
//         setIsLoading(false);
//         return;
//       }
//     }

//     if (!user) {
//       showError('Error al procesar la información del CURP. Por favor, intenta de nuevo.');
//       setIsLoading(false);
//       return;
//     }

//     const derivedBirthDate = extractDateOfBirthFromCURP(curpInput);
//     if (!derivedBirthDate) {
//       showError('CURP inválido para extraer fecha de nacimiento. Verifica el CURP.');
//       setIsLoading(false);
//       return;
//     }    setFetchedUserData({ ...user, fechaNacimiento: derivedBirthDate, email: user.email || '' });
//     setEmailInput(user.email || '');
//     changeStep(2);
//     setIsLoading(false);
//   };
//   const sendAndStoreToken = async (userToUpdate: Partial<User>): Promise<boolean> => {
//     setIsSendingToken(true);

//     if (!userToUpdate.curp || !userToUpdate.email) {
//         showError('Error: Información de usuario incompleta para enviar el código de verificación. Contacta al administrador.');
//         setIsSendingToken(false);
//         return false;
//     }
    
//     const token = generateToken();
//     const expiry = Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000;    const fullUserFromStorage = await getUserByCurp(userToUpdate.curp!);
//     if (!fullUserFromStorage) {
//         showError('Error inesperado: No se encontró el usuario para actualizar el código. Reinicia el proceso.');
//         setIsSendingToken(false);
//         return false;
//     }

//     const updatedUserForToken: User = {
//       ...fullUserFromStorage, 
//       email: userToUpdate.email!,
//       registrationToken: token,
//       registrationTokenExpiry: expiry,    };    await updateStoredUser(updatedUserForToken); 

//     // BYPASS EMAIL FOR TESTING - Always return true
//     console.log('🧪 TESTING MODE: Bypassing email verification');
//     console.log(`Would send verification email to: ${userToUpdate.email!} with token: ${token}`);
//     setIsSendingToken(false);
//     return true;

//     /* Original email sending code (commented out for testing):
//     const emailSent = await sendVerificationEmail(userToUpdate.email!, token);
//     setIsSendingToken(false);

//     if (emailSent) {
//       return true;    } else {
//       showError('No se pudo enviar el correo de verificación. Inténtalo de nuevo o contacta al administrador si el problema persiste.');
//       await updateStoredUser({ ...updatedUserForToken, registrationToken: undefined, registrationTokenExpiry: undefined });
//       return false;
//     }
//     */
//   };
//   const handleInformationConfirmationAndSendToken = async () => {
//     if (!isInformationConfirmed) {
//       showError('Debes confirmar que tu información es correcta.');
//       return;
//     }
//     if (!emailInput.trim() || !EMAIL_REGEX.test(emailInput)) {
//       showError('Por favor, proporciona un correo electrónico válido.');
//       return;
//     }
//     if (!fetchedUserData || !fetchedUserData.curp) {
//       showError('Error inesperado: datos de usuario no disponibles. Reinicia el proceso.');
//       changeStep(1);
//       return;
//     }

//     const userForToken = { ...fetchedUserData, email: emailInput };
    
//     const emailSentSuccessfully = await sendAndStoreToken(userForToken);
//     if (emailSentSuccessfully) {
//       changeStep(3);
//       success(`Se ha enviado un código de verificación a ${emailInput}. Por favor, revisa tu bandeja de entrada (y carpeta de spam).`);
//     }
//   };
//   const handleResendToken = async () => {
//      if (!fetchedUserData || !fetchedUserData.curp || !emailInput) {
//       showError('No se pueden reenviar los datos del token, falta información del usuario (email). Reinicia el proceso.');
//       return;
//     }
//     await sendAndStoreToken({ ...fetchedUserData, email: emailInput });
//   };
//     const handleSubmitRegistration = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     if (!fetchedUserData || !fetchedUserData.curp || !emailInput) {
//       showError('Error inesperado: No se encontraron los datos del usuario (email). Por favor, reinicia el proceso.');
//       setIsLoading(false);
//       changeStep(1); 
//       return;
//     }
    
//     if (!tokenInput.trim()) {
//       showError('El código de verificación es obligatorio.');
//       setIsLoading(false);
//       return;
//     }    if (!password) {
//       showError('La contraseña es obligatoria.');
//       setIsLoading(false);
//       return;
//     }    if (password.length < 6) {
//       showError('La contraseña debe tener al menos 6 caracteres.');
//       setIsLoading(false);
//       return;
//     }const user = await getUserByCurp(fetchedUserData.curp);
//     if (!user || !user.registrationToken || !user.registrationTokenExpiry) {
//       showError('Error al verificar el código o el código ha expirado. Intenta reenviarlo.');
//       setIsLoading(false);
//       return;
//     }    if (Date.now() > user.registrationTokenExpiry) {
//       showError('El código ha expirado. Por favor, solicita uno nuevo.');
//       await updateStoredUser({ ...user, registrationToken: undefined, registrationTokenExpiry: undefined });
//       setIsLoading(false);
//       return;
//     }

//     // BYPASS TOKEN VALIDATION FOR TESTING - Always accept 000000
//     if (tokenInput.trim() === '000000') {
//       console.log('🧪 TESTING MODE: Accepting default token 000000');
//     } else if (user.registrationToken !== tokenInput.trim()) {
//       showError('Código inválido. Por favor, verifica el código enviado a tu correo.');
//       setIsLoading(false);
//       return;
//     }

//     if (user.passwordDigest) {
//       showError('Este CURP ya tiene una cuenta registrada. Por favor, inicia sesión.');
//       setIsLoading(false);
//       return;
//     }
//       await new Promise(resolve => setTimeout(resolve, 300));

//     // Hash the password before storing it
//     const { hashPassword } = await import('../../services/passwordService');
//     const hashedPassword = await hashPassword(password);

//     const userToUpdate: User = {
//       ...user, 
//       email: emailInput, 
//       fechaNacimiento: fetchedUserData.fechaNacimiento!, 
//       passwordDigest: hashedPassword,
//       registrationToken: undefined, 
//       registrationTokenExpiry: undefined 
//     };
    
//     await updateStoredUser(userToUpdate);
//     setIsLoading(false);
    
//     // Go to passkey registration step (now separate from face registration)
//     changeStep(4);
//   };
//     const handleFaceRegistered = async (personId: string) => {
//     try {
//       if (!fetchedUserData?.curp) {
//         showError('Error: No se encontró el CURP del usuario.');
//         return;
//       }

//       // Update user with face authentication data
//       const user = await getUserByCurp(fetchedUserData.curp);
//       if (user) {        const updatedUser: User = {
//           ...user,
//           faceId: personId,
//           hasFaceRegistered: true,
//           faceRegistrationDate: Date.now()
//         };
//           await updateStoredUser(updatedUser);
//         setFaceId(personId);
        
//         // Complete registration
//         success('¡Registro completado con éxito! Ya puedes iniciar sesión con tu CURP y contraseña, o usar autenticación facial.');
        
//         setTimeout(() => {
//           if (onRegistrationSuccess) {
//             onRegistrationSuccess(updatedUser);
//           }
//         }, 1500);
//       }
//     } catch (error) {
//       console.error('Error updating user with face data:', error);
//       showError('Error al finalizar el registro facial.');
//     }
//   };
  
//   const handleSkipFaceAuth = async () => {
//     if (!fetchedUserData?.curp) {
//       showError('Error: No se encontró el CURP del usuario.');
//       return;
//     }

//     // Get current user data to pass to success callback
//     const user = await getUserByCurp(fetchedUserData.curp);
//     if (!user) {
//       showError('Error: No se encontró el usuario.');
//       return;
//     }

//     success('¡Registro completado con éxito! Ya puedes iniciar sesión con tu CURP y contraseña.');
    
//     setTimeout(() => {
//       if (onRegistrationSuccess) {
//         onRegistrationSuccess(user);
//       }
//     }, 1500);  };
  
//   // Passkey registration handler
//   const handlePasskeyRegistration = async () => {
//     try {
//       setIsPasskeyRegistering(true);
//       setPasskeyError(null);
      
//       if (!fetchedUserData?.curp) {
//         showError('Error: CURP no disponible para registro de passkey.');
//         setIsPasskeyRegistering(false);
//         return;
//       }
      
//       // Check if passkeys are supported
//       const { passkeyAuthService } = await import('../../services/passkeyAuthService');
      
//       if (!passkeyAuthService.isSupported()) {
//         setPasskeyError('Tu navegador no soporta passkeys. Continúa con el registro facial o finaliza el registro.');
//         setIsPasskeyRegistering(false);
//         return;
//       }
      
//       // Register passkey
//       const nombreCompleto = `${fetchedUserData.nombre} ${fetchedUserData.apellidoPaterno} ${fetchedUserData.apellidoMaterno}`;
//       console.log('Attempting passkey registration with:', {
//         curp: fetchedUserData.curp,
//         nombre: nombreCompleto
//       });
      
//       try {
//         const result = await passkeyAuthService.registerPasskey(fetchedUserData.curp, nombreCompleto);
        
//         if (result.verified) {
//           setIsPasskeyRegistered(true);
//           success('¡Huella registrada correctamente!');
          
//           // Auto-advance to face registration after successful passkey registration
//           setTimeout(() => {
//             changeStep(5);
//           }, 1500);
//         } else {
//           console.error('Passkey verification failed:', result);
//           setPasskeyError(result.error || 'Error al registrar huella.');
//         }      } catch (apiError: any) {
//         console.error('API error during passkey registration:', apiError);
//         setPasskeyError(`Error de API: ${apiError?.message || 'Error desconocido'}`);
//       }
//     } catch (error: any) {
//       console.error('Error during passkey registration:', error);
//       setPasskeyError(`Error al registrar huella: ${error?.message || 'Error desconocido'}. Intenta de nuevo o continúa con el registro.`);
//     } finally {
//       setIsPasskeyRegistering(false);
//     }
//   };
//   const handleSkipPasskey = () => {
//     // Skip passkey registration and go directly to face registration
//     changeStep(5);
//   };
  
//   const renderStepContent = () => {
//     if (currentStep === 1) {
//       // CURP Entry Step - Match homepage sizing
//       return (
//         <div className="w-full max-w-2xl mx-auto space-y-6">
//           <div className="text-center space-y-3">
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//               Verificar CURP
//             </h2>
//             <p className="text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
//               Ingresa tu CURP para verificar su validez en el sistema RENAPO
//             </p>
//           </div>
          
//           <div className="bg-white dark:bg-gray-800 rounded-container-third shadow-spectra-lg border border-gray-200 dark:border-gray-700 p-8">
//             <div className="space-y-6">
//               <div>
//                 <label htmlFor="curp-register" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
//                   CURP *
//                 </label>
//                 <input
//                   id="curp-register"
//                   name="curp"
//                   value={curpInput}
//                   onChange={(e) => setCurpInput(e.target.value.toUpperCase())}
//                   maxLength={18}
//                   placeholder="Tu CURP (18 caracteres)"
//                   required
//                   className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm font-mono tracking-wide text-center"
//                 />
//               </div>
              
//               <Button
//                 type="button"
//                 onClick={handleCurpVerification}
//                 disabled={isLoading || !curpInput.trim()}
//                 isLoading={isLoading}
//                 fullWidth
//                 size="md"
//               >
//                 {isLoading ? 'Verificando...' : 'Siguiente'}
//               </Button>
//             </div>
//           </div>
//         </div>
//       );
//     }if (currentStep === 2 && fetchedUserData) {
//       // Helper function to get month name in Spanish
//       const getMonthName = (month: string) => {
//         const months = [
//           '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
//           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
//         ];
//         return months[parseInt(month)] || month;
//       };

//       // Data Confirmation Step - Redesigned to match reference screenshot
//       let displayBirthDate = 'N/A';
//       const dobStr = fetchedUserData.fechaNacimiento; 
//       if (dobStr) {
//         const parts = dobStr.split('-');
//         if (parts.length === 3) {
//           displayBirthDate = `${parts[2]} de ${getMonthName(parts[1])} ${parts[0]}`;
//         }
//       }      return (
//         <div className="w-full max-w-5xl mx-auto">
//           <div className="grid lg:grid-cols-2 gap-8 items-stretch min-h-[500px]">
//             {/* Left Column - Welcome Card (Dark Maroon) */}
//             <div className="bg-gradient-to-br from-primary-maroon via-primary-maroon-hover to-primary-maroon-darker rounded-container-third shadow-spectra-lg p-8 flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
//               {/* Background decoration */}
//               <div className="absolute inset-0 opacity-10">
//                 <div className="absolute top-6 right-6 w-32 h-32 bg-white rounded-full"></div>
//                 <div className="absolute bottom-6 left-6 w-24 h-24 bg-white rounded-full"></div>
//               </div>
              
//               <div className="relative z-10 space-y-6">
//                 <h2 className="text-2xl font-bold">Bienvenido</h2>
//                 <p className="text-base opacity-90">
//                   Valida y protege tu información
//                 </p>
                
//                 {/* CURP Display */}
//                 <div className="bg-white/20 backdrop-blur-md rounded-container-fourth px-6 py-3 border border-white/30">
//                   <p className="text-xs font-medium opacity-80">CURP:</p>
//                   <p className="font-mono text-base font-bold tracking-wider">
//                     {fetchedUserData.curp}
//                   </p>
//                 </div>
                
//                 {/* Golden Checkmark Icon */}
//                 <div className="flex justify-center">
//                   <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
//                     <svg className="w-8 h-8 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Official Information Card (Light) */}
//             <div className="bg-white dark:bg-gray-50 rounded-container-third shadow-spectra-lg p-8 border border-gray-200">
//               {/* Header with icon */}
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
//                   <svg className="w-4 h-4 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <h3 className="text-base font-bold text-gray-900">
//                   ¡Resultado oficial de tu información!
//                 </h3>
//               </div>
              
//               {/* User Information Fields */}
//               <div className="space-y-4 mb-6">
//                 {/* Name Field */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600 mb-2">Nombre</label>
//                   <div className="bg-gray-100 rounded-container-fourth px-4 py-3 border-2 border-gray-200">
//                     <p className="font-semibold text-gray-900 text-base">
//                       {fetchedUserData.nombre} {fetchedUserData.apellidoPaterno} {fetchedUserData.apellidoMaterno}
//                     </p>
//                   </div>
//                 </div>
                
//                 {/* Birth Date Field */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600 mb-2">Fecha de Nacimiento</label>
//                   <div className="bg-gray-100 rounded-container-fourth px-4 py-3 border-2 border-gray-200">
//                     <p className="font-semibold text-gray-900 text-base">{displayBirthDate}</p>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Email Input Section */}
//               <div className="space-y-4 mb-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-600 mb-2">Correo Electrónico *</label>
//                   <input
//                     type="email"
//                     value={emailInput}
//                     onChange={(e) => setEmailInput(e.target.value)}
//                     placeholder="ejemplo@correo.com"
//                     required
//                     className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm"
//                   />
//                 </div>
                
//                 {/* Confirmation Checkbox */}
//                 <div className="flex items-start space-x-3">
//                   <input
//                     id="informationConfirmed"
//                     name="informationConfirmed"
//                     type="checkbox"
//                     checked={isInformationConfirmed}
//                     onChange={(e) => setIsInformationConfirmed(e.target.checked)}
//                     className="mt-1 h-4 w-4 text-primary-maroon focus:ring-primary-maroon border-gray-300 rounded"
//                   />
//                   <label htmlFor="informationConfirmed" className="text-sm text-gray-700 cursor-pointer">
//                     Confirmo que mi información es correcta y autorizo el envío de un correo de verificación a la dirección proporcionada.
//                   </label>
//                 </div>
//               </div>
              
//               {/* Create Password Button */}
//               <Button
//                 type="button"
//                 onClick={handleInformationConfirmationAndSendToken}
//                 disabled={isLoading || !isInformationConfirmed || !emailInput.trim() || isSendingToken}
//                 isLoading={isSendingToken}
//                 fullWidth
//                 size="md"
//               >
//                 {isSendingToken ? 'Enviando...' : 'Crear contraseña'}
//               </Button>
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     if (currentStep === 3) {
//       // Token and Password Step - Match homepage sizing
//       return (
//         <div className="w-full max-w-5xl mx-auto space-y-6">
//           <div className="text-center space-y-3">
//             <p className="text-base text-gray-600 dark:text-gray-400">
//               Código enviado a <span className="font-semibold text-primary-maroon dark:text-accent-gold">{emailInput}</span>
//             </p>
//           </div>
          
//           <div className="grid lg:grid-cols-2 gap-8 items-stretch min-h-[500px]">
//             {/* Left Column - Security Card (Dark Maroon) */}
//             <div className="bg-gradient-to-br from-primary-maroon via-primary-maroon-hover to-primary-maroon-darker rounded-container-third shadow-spectra-lg p-8 flex flex-col justify-center items-start text-white relative overflow-hidden">
//               {/* Background decoration */}
//               <div className="absolute inset-0 opacity-10">
//                 <div className="absolute top-6 right-6 w-32 h-32 bg-white rounded-full"></div>
//                 <div className="absolute bottom-6 left-6 w-24 h-24 bg-white rounded-full"></div>
//               </div>
              
//               <div className="relative z-10 space-y-6 w-full">
//                 <div className="space-y-2">
//                   <p className="text-sm opacity-90 uppercase tracking-wide">CONTRASEÑA</p>
//                   <h2 className="text-2xl font-bold">Seguridad</h2>
//                   <p className="text-base opacity-90">Protege tu perfil</p>
//                 </div>
                
//                 {/* Security Options List */}
//                 <div className="space-y-3">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
//                       <svg className="w-3 h-3 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <span className="text-base font-medium">Contraseña</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3 opacity-60">
//                     <div className="w-5 h-5 border-2 border-white rounded-full"></div>
//                     <span className="text-base">Huella</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3 opacity-60">
//                     <div className="w-5 h-5 border-2 border-white rounded-full"></div>
//                     <span className="text-base">Facial</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3 opacity-60">
//                     <div className="w-5 h-5 border-2 border-white rounded-full"></div>
//                     <span className="text-base">e-firma</span>
//                   </div>
//                 </div>
                
//                 {/* Step indicator */}
//                 <div className="pt-6">
//                   <p className="text-sm opacity-80">1 de 5</p>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Password Form Card (Light) */}
//             <div className="bg-white dark:bg-gray-50 rounded-container-third shadow-spectra-lg p-8 border border-gray-200">
//               <div className="space-y-6">
//                 {/* Verification Token Section */}
//                 <div className="text-center">
//                   <input
//                     id="verification-token"
//                     name="token"
//                     value={tokenInput}
//                     onChange={(e) => setTokenInput(e.target.value)}
//                     placeholder="000000"
//                     maxLength={6}
//                     required
//                     className="w-full px-4 py-3 text-base font-medium bg-gray-100 border-2 border-gray-200 rounded-container-fourth text-center text-base tracking-widest font-mono font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 focus:border-primary-maroon transition-all duration-200"
//                   />
//                   <div className="text-xs text-blue-600 mt-2">🧪 Testing Mode: Default code is 000000</div>
//                   <button
//                     type="button"
//                     onClick={handleResendToken}
//                     disabled={isSendingToken}
//                     className="text-primary-maroon hover:underline text-xs mt-3 disabled:opacity-50"
//                   >
//                     {isSendingToken ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
//                   </button>
//                 </div>
                
//                 <hr className="border-gray-200" />
                
//                 {/* Password Section */}
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-600 mb-2">Escribe tu contraseña</label>
//                     <input
//                       id="new-password"
//                       name="password"
//                       type="password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       placeholder="Mustang1985."
//                       autoComplete="new-password"
//                       required
//                       className="w-full px-4 py-3 text-base font-medium bg-white/95 border-2 border-primary-maroon rounded-container-fourth text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 focus:border-primary-maroon transition-all duration-200"
//                     />
//                     <p className="text-xs text-gray-500 mt-2">
//                       Debe incluir una combinación de letras mayúsculas y minúsculas, números y símbolos para aumentar su seguridad.
//                     </p>
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-600 mb-2">Teléfono o dirección de correo</label>
//                     <input
//                       type="email"
//                       value={emailInput}
//                       readOnly
//                       className="w-full px-4 py-3 text-base font-medium border-2 border-primary-maroon rounded-container-fourth bg-gray-100 text-gray-700"
//                     />
//                   </div>
                  
//                   <PasswordStrengthIndicator password={password} className="mb-4" />
//                 </div>
                
//                 {/* Save Button */}
//                 <Button
//                   type="submit"
//                   disabled={isLoading || !tokenInput.trim() || !password}
//                   isLoading={isLoading}
//                   fullWidth
//                   size="md"
//                 >
//                   {isLoading ? 'Procesando...' : 'Guardar'}
//                 </Button>
                
//                 {/* Success Message */}
//                 {password && password.length >= 6 && (
//                   <div className="flex items-center justify-center text-primary-maroon">
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>
//                     <span className="text-sm font-medium">¡Contraseña guardada con éxito!</span>
//                     <div className="ml-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
//                       <svg className="w-4 h-4 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>            {/* Progress indicators at bottom */}
//           <div className="flex justify-center space-x-2">
//             <div className="w-8 h-1 bg-primary-maroon rounded"></div>
//             <div className="w-8 h-1 bg-primary-maroon rounded"></div>
//             <div className="w-8 h-1 bg-primary-maroon rounded"></div>
//             <div className="w-8 h-1 bg-gray-300 rounded"></div>
//             <div className="w-8 h-1 bg-gray-300 rounded"></div>
//           </div>
//         </div>
//       );
//     }
    
//     if (currentStep === 4 && fetchedUserData?.curp) {
//       // Step 4: Fingerprint/Passkey Registration - Match homepage sizing
//       return (
//         <div className="w-full max-w-5xl mx-auto space-y-6">
          
//           <div className="grid lg:grid-cols-2 gap-8 items-stretch min-h-[500px]">
            
//             {/* Left Column - Security Card (Dark Maroon) */}
//             <div className="bg-gradient-to-br from-primary-maroon via-primary-maroon-hover to-primary-maroon-darker rounded-container-third shadow-spectra-lg p-8 flex flex-col justify-center items-start text-white relative overflow-hidden">
//               {/* Background decoration */}
//               <div className="absolute inset-0 opacity-10">
//                 <div className="absolute top-6 right-6 w-32 h-32 bg-white rounded-full"></div>
//                 <div className="absolute bottom-6 left-6 w-24 h-24 bg-white rounded-full"></div>
//               </div>
              
//               <div className="relative z-10 space-y-6 w-full">
//                 <div className="space-y-2">
//                   <p className="text-sm opacity-90 uppercase tracking-wide">HUELLA</p>
//                   <h2 className="text-2xl font-bold">Seguridad</h2>
//                   <p className="text-base opacity-90">Protege tu perfil</p>
//                 </div>
                
//                 {/* Security Options List */}
//                 <div className="space-y-3">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
//                       <svg className="w-3 h-3 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <span className="text-base font-medium">Contraseña</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3">
//                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
//                       isPasskeyRegistered 
//                         ? 'bg-white' 
//                         : 'border-2 border-white'
//                     }`}>
//                       {isPasskeyRegistered && (
//                         <svg className="w-3 h-3 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       )}
//                     </div>
//                     <span className="text-base">Huella</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3 opacity-60">
//                     <div className="w-5 h-5 border-2 border-white rounded-full"></div>
//                     <span className="text-base">Facial</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3 opacity-60">
//                     <div className="w-5 h-5 border-2 border-white rounded-full"></div>
//                     <span className="text-base">e-firma</span>
//                   </div>
//                 </div>
                
//                 {/* Step indicator */}
//                 <div className="pt-6">
//                   <p className="text-sm opacity-80">2 de 4</p>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Fingerprint Registration Interface */}
//             <div className="bg-white dark:bg-gray-50 rounded-container-third shadow-spectra-lg p-8 border border-gray-200">
//               <div className="space-y-6 flex flex-col justify-center items-center text-center min-h-full">
                
//                 {/* Large Fingerprint Icon */}
//                 <div className="relative">
//                   <div className={`w-32 h-32 rounded-lg flex items-center justify-center border-4 transition-all duration-300 ${
//   isPasskeyRegistering 
//     ? 'border-yellow-400 bg-yellow-50 shadow-lg animate-pulse' 
//     : isPasskeyRegistered 
//       ? 'border-yellow-400 bg-yellow-50 shadow-lg' 
//       : 'border-gray-300 bg-gray-100'
// }`}>
//   <div className="relative">
//     <img 
//       src="/fingerprint.png" 
//       alt="Fingerprint" 
//       className={`w-16 h-16 object-contain transition-all duration-300 ${
//         isPasskeyRegistering 
//           ? 'filter brightness-110 contrast-110' 
//           : isPasskeyRegistered 
//             ? 'filter brightness-110 contrast-110' 
//             : 'filter grayscale opacity-70'
//       }`}
//     />
    
//     {/* Scanning effect overlay */}
//     {isPasskeyRegistering && (
//       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent animate-pulse"></div>
//     )}
    
//     {/* Success glow effect */}
//     {isPasskeyRegistered && (
//       <div className="absolute inset-0 bg-yellow-400/20 rounded-lg animate-pulse"></div>
//     )}
//   </div>
// </div>
                
//                 <div className="space-y-3">
//                   <p className="text-base text-gray-700">Usa el dedo índice derecho</p>
                  
//                   {passkeyError && (
//                     <div className="p-3 rounded-container-fourth bg-red-50 border border-red-200">
//                       <p className="text-red-700 text-center text-sm">{passkeyError}</p>
//                     </div>
//                   )}
//                     {!isPasskeyRegistered ? (
//                     <div className="space-y-3">
//                       <Button 
//                         onClick={handlePasskeyRegistration} 
//                         disabled={isPasskeyRegistering}
//                         isLoading={isPasskeyRegistering}
//                         size="md"
//                       >
//                         {isPasskeyRegistering ? 'Escaneando...' : 'Escanear'}
//                       </Button>
                      
//                       {/* Skip Button */}
//                       <Button
//                         type="button"
//                         onClick={handleSkipPasskey}
//                         variant="ghost"
//                         size="md"
//                         fullWidth
//                       >
//                         Omitir por ahora
//                       </Button>
//                     </div>
//                   ) : (
//                     <div className="flex items-center justify-center space-x-2 text-primary-maroon">
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                       <span className="text-sm font-medium">¡Huella registrada con éxito!</span>
//                       <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
//                         <svg className="w-4 h-4 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
//               </div>
//             </div>
//           </div>
          
//         </div>
//       );
//     }
    
//     if (currentStep === 5 && fetchedUserData?.curp) {
//       // Step 5: Face Registration - Match homepage sizing
//       return (
//         <div className="w-full max-w-5xl mx-auto space-y-6">
          
//           <div className="grid lg:grid-cols-2 gap-8 items-stretch min-h-[500px]">
            
//             {/* Left Column - Facial Security Card (Dark Maroon) */}
//             <div className="bg-gradient-to-br from-primary-maroon via-primary-maroon-hover to-primary-maroon-darker rounded-container-third shadow-spectra-lg p-8 flex flex-col justify-center items-start text-white relative overflow-hidden">
//               {/* Background decoration */}
//               <div className="absolute inset-0 opacity-10">
//                 <div className="absolute top-6 right-6 w-32 h-32 bg-white rounded-full"></div>
//                 <div className="absolute bottom-6 left-6 w-24 h-24 bg-white rounded-full"></div>
//               </div>
              
//               <div className="relative z-10 space-y-6 w-full">
//                 <div className="space-y-2">
//                   <p className="text-sm opacity-90 uppercase tracking-wide">FACIAL</p>
//                   <h2 className="text-2xl font-bold">Seguridad</h2>
//                   <p className="text-base opacity-90">Protege tu perfil</p>
//                 </div>
                
//                 {/* Security Options List */}
//                 <div className="space-y-3">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
//                       <svg className="w-3 h-3 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <span className="text-base font-medium">Contraseña</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3">
//                     <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
//                       <svg className="w-3 h-3 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <span className="text-base">Huella</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3">
//                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
//                       faceId 
//                         ? 'bg-white' 
//                         : 'border-2 border-white'
//                     }`}>
//                       {faceId && (
//                         <svg className="w-3 h-3 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       )}
//                     </div>
//                     <span className="text-base">Facial</span>
//                   </div>
                  
//                   <div className="flex items-center space-x-3 opacity-60">
//                     <div className="w-5 h-5 border-2 border-white rounded-full"></div>
//                     <span className="text-base">e-firma</span>
//                   </div>
//                 </div>
                
//                 {/* Step indicator */}
//                 <div className="pt-6">
//                   <p className="text-sm opacity-80">3 de 4</p>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Face Registration Interface */}
//             <div className="bg-white dark:bg-gray-50 rounded-container-third shadow-spectra-lg p-8 border border-gray-200">
//               <div className="space-y-6 flex flex-col justify-center items-center text-center min-h-full">
                
//                 {/* Face Recognition Interface */}
//                 <div className="space-y-4">
                  
//                   {/* Large Face Recognition Area */}
//                   <div className="relative">
//                     <div className="w-32 h-40 bg-gray-100 rounded-container-third flex items-center justify-center border-4 border-gray-300 relative overflow-hidden">
//                       {/* Face outline */}
//                       <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
//                         <div className="w-16 h-20 rounded-full border-4 border-dashed border-gray-400 relative">
//                           {/* Face features placeholder */}
//                           <div className="absolute top-6 left-4 w-2 h-2 bg-gray-400 rounded-full"></div>
//                           <div className="absolute top-6 right-4 w-2 h-2 bg-gray-400 rounded-full"></div>
//                           <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gray-400 rounded"></div>
//                           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-400 rounded"></div>
//                         </div>
//                       </div>
                      
//                       {/* Scanning corners */}
//                       <div className="absolute top-3 left-3 w-4 h-4 border-l-4 border-t-4 border-red-500"></div>
//                       <div className="absolute top-3 right-3 w-4 h-4 border-r-4 border-t-4 border-red-500"></div>
//                       <div className="absolute bottom-3 left-3 w-4 h-4 border-l-4 border-b-4 border-red-500"></div>
//                       <div className="absolute bottom-3 right-3 w-4 h-4 border-r-4 border-b-4 border-red-500"></div>
//                     </div>
                    
//                     {/* Success indicator when registered */}
//                     {faceId && (
//                       <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white">
//                         <svg className="w-4 h-4 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                     )}
//                   </div>
                  
//                   {/* Instructions */}
//                   <div className="space-y-2">
//                     <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
//                       <div className="flex items-center space-x-2">
//                         <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
//                         <span>Acerca tu rostro</span>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
//                         <span>Buena iluminación</span>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
//                         <span>Parpadea</span>
//                       </div>
//                     </div>
//                   </div>                  {/* Face Registration Component Integration */}
//                   <div className={`${faceId ? 'hidden' : ''}`}>
//                     <FaceRegistration
//                       userCurp={fetchedUserData.curp}
//                       onFaceRegistered={handleFaceRegistered}
//                       onSkip={handleSkipFaceAuth}
//                     />
//                   </div>
                  
//                   {/* Success Message when face is registered */}
//                   {faceId && (
//                     <div className="flex items-center justify-center space-x-2 text-primary-maroon">
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                       <span className="text-sm font-medium">¡Rostro registrado con éxito!</span>
//                       <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
//                         <svg className="w-4 h-4 text-primary-maroon" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                     </div>
//                   )}
                  
//                 </div>                
//               </div>
//             </div>
//           </div>
          
//         </div>
//       );
//     }
    
//     return null;
//   };

//   return (
//     <form onSubmit={
//         currentStep === 3 ? handleSubmitRegistration : 
//         (e) => e.preventDefault()
//       } className="w-full">
      
//       <div className="w-full">
//         {renderStepContent()}
//       </div>      {/* Navigation for steps 2, 3, 4, and 5 */}
//       {(currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5) && (
//         <div className="mt-6 flex justify-center">
//           <Button
//             type="button"
//             onClick={() => changeStep(currentStep - 1)}
//             disabled={isLoading || isSendingToken}
//             variant="ghost"
//             size="sm"
//           >
//             ← Volver
//           </Button>
//         </div>
//       )}
//     </form>
//   );
// };


import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { User } from '../../types';
import { getUserByCurp, updateUser as updateStoredUser, validateCurpWithApi, createOrUpdateUserFromCurpValidation } from '../../services/databaseService';
import { CURP_REGEX, EMAIL_REGEX, generateToken, TOKEN_EXPIRY_MINUTES } from '../../constants';
import { extractDateOfBirthFromCURP } from '../../utils/curpUtils';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { FaceRegistration } from './FaceRegistration';
import { Button } from '../common/CommonComponents';

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
        <label htmlFor="curp" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">CURP</label>
        <input
          id="curp"
          name="curp"
          value={curp}
          onChange={(e) => setCurp(e.target.value.toUpperCase())}
          maxLength={18}
          placeholder="Tu CURP (18 caracteres)"
          autoComplete="username"
          required
          className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
          className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm"
        />
      </div>
      <div className="space-y-3">
        <Button type="submit" fullWidth isLoading={isLoading} disabled={isLoading || isPasskeyLoading} size="md">
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
          className="flex items-center justify-center gap-2"
        >
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
  onRegistrationSuccess: (user: User) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegistrationSuccess }) => {
  const [curpInput, setCurpInput] = useState('');
  const [fetchedUserData, setFetchedUserData] = useState<Partial<User> | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isInformationConfirmed, setIsInformationConfirmed] = useState(false);
  const [tokenInput, setTokenInput] = useState('000000');
  const [password, setPassword] = useState('');
  const [faceId, setFaceId] = useState<string | null>(null);
  
  // Passkey registration state
  const [isPasskeyRegistering, setIsPasskeyRegistering] = useState(false);
  const [isPasskeyRegistered, setIsPasskeyRegistered] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  
  const { error: showError, success } = useToast();
  
  const [currentStep, setCurrentStepState] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingToken, setIsSendingToken] = useState(false);
  
  // Check for prefilled CURP from localStorage (redirected from login)
  useEffect(() => {
    const prefilledCurp = localStorage.getItem('prefilledCurp');
    if (prefilledCurp) {
      setCurpInput(prefilledCurp);
      localStorage.removeItem('prefilledCurp');
    }
  }, []);
  
  const changeStep = (newStep: number) => {
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
    changeStep(2);
    setIsLoading(false);
  };

  const sendAndStoreToken = async (userToUpdate: Partial<User>): Promise<boolean> => {
    setIsSendingToken(true);

    if (!userToUpdate.curp || !userToUpdate.email) {
        showError('Error: Información de usuario incompleta para enviar el código de verificación. Contacta al administrador.');
        setIsSendingToken(false);
        return false;
    }
    
    const token = generateToken();
    const expiry = Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000;
    const fullUserFromStorage = await getUserByCurp(userToUpdate.curp!);
    if (!fullUserFromStorage) {
        showError('Error inesperado: No se encontró el usuario para actualizar el código. Reinicia el proceso.');
        setIsSendingToken(false);
        return false;
    }

    const updatedUserForToken: User = {
      ...fullUserFromStorage, 
      email: userToUpdate.email!,
      registrationToken: token,
      registrationTokenExpiry: expiry,
    };
    await updateStoredUser(updatedUserForToken); 

    // BYPASS EMAIL FOR TESTING - Always return true
    console.log('🧪 TESTING MODE: Bypassing email verification');
    console.log(`Would send verification email to: ${userToUpdate.email!} with token: ${token}`);
    setIsSendingToken(false);
    return true;
  };

  const handleInformationConfirmationAndSendToken = async () => {
    if (!isInformationConfirmed) {
      showError('Debes confirmar que tu información es correcta.');
      return;
    }
    if (!emailInput.trim() || !EMAIL_REGEX.test(emailInput)) {
      showError('Por favor, proporciona un correo electrónico válido.');
      return;
    }
    if (!fetchedUserData || !fetchedUserData.curp) {
      showError('Error inesperado: datos de usuario no disponibles. Reinicia el proceso.');
      changeStep(1);
      return;
    }

    const userForToken = { ...fetchedUserData, email: emailInput };
    
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
    if (!password) {
      showError('La contraseña es obligatoria.');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
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
    
    // Go to passkey registration step (now separate from face registration)
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
      if (user) {
        const updatedUser: User = {
          ...user,
          faceId: personId,
          hasFaceRegistered: true,
          faceRegistrationDate: Date.now()
        };
        await updateStoredUser(updatedUser);
        setFaceId(personId);
        
        // Complete registration
        success('¡Registro completado con éxito! Ya puedes iniciar sesión con tu CURP y contraseña, o usar autenticación facial.');
        
        setTimeout(() => {
          if (onRegistrationSuccess) {
            onRegistrationSuccess(updatedUser);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating user with face data:', error);
      showError('Error al finalizar el registro facial.');
    }
  };
  
  const handleSkipFaceAuth = async () => {
    if (!fetchedUserData?.curp) {
      showError('Error: No se encontró el CURP del usuario.');
      return;
    }

    // Get current user data to pass to success callback
    const user = await getUserByCurp(fetchedUserData.curp);
    if (!user) {
      showError('Error: No se encontró el usuario.');
      return;
    }

    success('¡Registro completado con éxito! Ya puedes iniciar sesión con tu CURP y contraseña.');
    
    setTimeout(() => {
      if (onRegistrationSuccess) {
        onRegistrationSuccess(user);
      }
    }, 1500);
  };
  
  // Passkey registration handler
  const handlePasskeyRegistration = async () => {
    try {
      setIsPasskeyRegistering(true);
      setPasskeyError(null);
      
      if (!fetchedUserData?.curp) {
        showError('Error: CURP no disponible para registro de passkey.');
        setIsPasskeyRegistering(false);
        return;
      }
      
      // Check if passkeys are supported
      const { passkeyAuthService } = await import('../../services/passkeyAuthService');
      
      if (!passkeyAuthService.isSupported()) {
        setPasskeyError('Tu navegador no soporta passkeys. Continúa con el registro facial o finaliza el registro.');
        setIsPasskeyRegistering(false);
        return;
      }
      
      // Register passkey
      const nombreCompleto = `${fetchedUserData.nombre} ${fetchedUserData.apellidoPaterno} ${fetchedUserData.apellidoMaterno}`;
      console.log('Attempting passkey registration with:', {
        curp: fetchedUserData.curp,
        nombre: nombreCompleto
      });
      
      try {
        const result = await passkeyAuthService.registerPasskey(fetchedUserData.curp, nombreCompleto);
        
        if (result.verified) {
          setIsPasskeyRegistered(true);
          success('¡Huella registrada correctamente!');
          
          // Auto-advance to face registration after successful passkey registration
          setTimeout(() => {
            changeStep(5);
          }, 1500);
        } else {
          console.error('Passkey verification failed:', result);
          setPasskeyError(result.error || 'Error al registrar huella.');
        }
      } catch (apiError: any) {
        console.error('API error during passkey registration:', apiError);
        setPasskeyError(`Error de API: ${apiError?.message || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error during passkey registration:', error);
      setPasskeyError(`Error al registrar huella: ${error?.message || 'Error desconocido'}. Intenta de nuevo o continúa con el registro.`);
    } finally {
      setIsPasskeyRegistering(false);
    }
  };
  const handleSkipPasskey = () => {
    // Skip passkey registration and go directly to face registration
    changeStep(5);
  };
  
  const renderStepContent = () => {
    if (currentStep === 1) {
      // CURP Entry Step - Match homepage sizing
      return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verificar CURP
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Ingresa tu CURP para verificar su validez en el sistema RENAPO
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-container-third shadow-spectra-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="curp-register" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  CURP *
                </label>
                <input
                  id="curp-register"
                  name="curp"
                  value={curpInput}
                  onChange={(e) => setCurpInput(e.target.value.toUpperCase())}
                  maxLength={18}
                  placeholder="Tu CURP (18 caracteres)"
                  required
                  className="w-full px-4 py-3 text-base font-medium bg-white/95 dark:bg-slate-700/95 border-2 border-slate-300/80 dark:border-slate-600/80 rounded-container-fourth text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-maroon/30 dark:focus:ring-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold transition-all duration-200 backdrop-blur-sm font-mono tracking-wide text-center"
                />
              </div>
              
              <Button
                type="button"
                onClick={handleCurpVerification}
                disabled={isLoading || !curpInput.trim()}
                isLoading={isLoading}
                fullWidth
                size="md"
              >
                {isLoading ? 'Verificando...' : 'Siguiente'}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    if (currentStep === 2 && fetchedUserData) {
      // Helper function to get month name in Spanish
      const getMonthName = (month: string) => {
        const months = [
          '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[parseInt(month)] || month;
      };

      // Data Confirmation Step - Redesigned to match reference screenshot
      let displayBirthDate = 'N/A';
      const dobStr = fetchedUserData.fechaNacimiento; 
      if (dobStr) {
        const parts = dobStr.split('-');
        if (parts.length === 3) {
          displayBirthDate = `${parts[2]} de ${getMonthName(parts[1])} ${parts[0]}`;
        }
      }
      return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
  <div className="flex bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-4xl">
    {/* Barra lateral */}
    <div className="bg-[#A82E56] text-white p-10 flex flex-col items-center w-1/3 min-w-[260px]">
      <h2 className="text-3xl font-bold mb-2 text-white">Datos Personales</h2>
      <p className="mb-6 text-sm opacity-80 text-white">Oficiales obtenidos con tu CURP</p>
      <input
        className="bg-white text-rose-800 font-mono text-center rounded-full px-4 py-2 mb-8 w-full"
        value={`${fetchedUserData.curp || ''}`}
        readOnly
      />
      <div className="mt-auto">
        <img
          src="./PNG/3d-04.png"
          alt="imagen registro"
          className="object-contain max-w-full w-20 h-15 shadow-lg"
        />
      </div>
    </div>
    {/* Contenido principal */}
    <div className="flex-1 p-10 bg-[#FFFDFD] relative">
      <div className="absolute right-8 top-8 flex gap-1">
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
      </div>
      <div className="mb-6 flex items-center gap-2">
        <span className="font-semibold text-gray-700">¡Resultado oficial de tu información!</span>
        <span className="ml-2 inline-block align-middle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#F6E7B2"/>
            <path d="M12 8v4l2 2" stroke="#D6C08D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nombre</label>
          <input
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent"
            value={`${fetchedUserData.nombre || ''} ${fetchedUserData.apellidoPaterno || ''} ${fetchedUserData.apellidoMaterno || ''}`}
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Fecha de Nacimiento</label>
          <input
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent"
            value={displayBirthDate}
            readOnly
          />
        </div>
        {/* Si tienes domicilio, descomenta esto:
        <div>
          <label className="block text-sm text-gray-600 mb-1">Domicilio</label>
          <input
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent"
            value={fetchedUserData.domicilio || ''}
            readOnly
          />
        </div>
        */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Correo Electrónico *</label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent"
          />
        </div>
        <div className="flex items-start space-x-3">
          <input
            id="informationConfirmed"
            name="informationConfirmed"
            type="checkbox"
            checked={isInformationConfirmed}
            onChange={(e) => setIsInformationConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 text-rose-800 focus:ring-rose-800 border-gray-300 rounded"
          />
          <label htmlFor="informationConfirmed" className="text-sm text-gray-700 cursor-pointer">
            Confirmo que mi información es correcta y autorizo el envío de un correo de verificación a la dirección proporcionada.
          </label>
        </div>
        <button
          type="button"
          onClick={handleInformationConfirmationAndSendToken}
          disabled={isLoading || !isInformationConfirmed || !emailInput.trim() || isSendingToken}
          className="mt-4 bg-rose-800 text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-rose-700 transition self-end disabled:opacity-60"
        >
          {isSendingToken ? 'Enviando...' : 'Crear contraseña'}
        </button>
      </form>
    </div>
  </div>
</div>
          
      );
    }
    
    if (currentStep === 3) {
      // Token and Password Step - Match homepage sizing
      return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
  <div className="flex bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-4xl">
    {/* lleft column */}
    <div className="bg-[#A82E56] text-white p-10 flex flex-col items-center w-1/3 min-w-[260px]">
      <h2 className="text-3xl font-bold mb-2 text-white">Seguridad</h2>
      <p className="mb-6 text-sm opacity-80 text-white">Protege tu Perfil</p>
      {/* Menú colum */}
      <div className="flex flex-col gap-2 w-full mb-8">
        <label className="flex items-center gap-2 font-bold text-white">
          <img
            src="./PNG/AUTORIDAD [Recuperado]-12.png"
            alt="imagen registro"
            className="object-contain max-w-full w-5 h-5 shadow-lg"
          />
          Contraseña
        </label>
        <label className="flex items-center gap-2 text-white opacity-90">
          <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
          Huella
        </label>
        <label className="flex items-center gap-2 text-white opacity-90">
          <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
          Facial
        </label>
        <label className="flex items-center gap-2 text-white opacity-90">
          <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
          e-firma
        </label>
      </div>
      <span className="text-xs opacity-80 mt-auto text-white">1 de 4</span>
    </div>
    {/* Right column*/}
    <div className="flex-1 p-10 bg-[#FFFDFD] relative">
      <div className="absolute right-8 top-8 flex gap-1">
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
      </div>
      <div className="mb-6">
        {password && password.length >= 6 ? (
          <span className="font-semibold text-gray-700 flex items-center gap-2">
            ¡Contraseña guardada con éxito!
            <span className="ml-2 inline-block align-middle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#F6E7B2"/>
                <path d="M12 8v4l2 2" stroke="#D6C08D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </span>
        ) : (
          <span className="font-semibold text-gray-700">Código enviado a <span className="font-semibold text-primary-maroon">{emailInput}</span></span>
        )}
      </div>
      <form onSubmit={handleSubmitRegistration} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Escribe tu contraseña</label>
          <input
            id="new-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mustang1985."
            autoComplete="new-password"
            required
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent"
          />
          <p className="mb-6 text-sm">Debes incluir una combinación de letras mayúsculas y minúsculas, números y símbolos para aumentar seguridad</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Teléfono o dirección de correo</label>
          <input
            type="email"
            value={emailInput}
            readOnly
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Código de verificación</label>
          <input
            id="verification-token"
            name="token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="000000"
            maxLength={6}
            required
            className="w-full border-2 border-rose-300 rounded-full px-4 py-2 bg-transparent text-center font-mono font-bold tracking-widest"
          />
          <div className="text-xs text-blue-600 mt-2">🧪 Testing Mode: Default code is 000000</div>
          <button
            type="button"
            onClick={handleResendToken}
            disabled={isSendingToken}
            className="text-primary-maroon hover:underline text-xs mt-3 disabled:opacity-50"
          >
            {isSendingToken ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
          </button>
        </div>
        <div>
          <PasswordStrengthIndicator password={password} className="mb-4" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !tokenInput.trim() || !password}
          className="mt-4 bg-rose-800 text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-rose-700 transition self-end disabled:opacity-60"
        >
          {isLoading ? 'Procesando...' : 'Guardar'}
        </button>
      </form>
    </div>
  </div>
</div>
      );
    }
    
    if (currentStep === 4 && fetchedUserData?.curp) {
      // Step 4: Fingerprint/Passkey Registration - Match homepage sizing
      return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="flex bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-4xl">
        {/* left bar */}
        <div className="bg-[#A82E56] text-white p-10 flex flex-col items-center w-1/3 min-w-[260px]">
          <h2 className="text-3xl font-bold mb-2 text-white">Seguridad</h2>
          <p className="mb-6 text-sm opacity-80 text-white">Protege tu Perfil</p>
          <div className="flex flex-col gap-2 w-full mb-8">
            <label className="flex items-center gap-2 font-bold text-white">
              <img
                src="./PNG/AUTORIDAD [Recuperado]-12.png"
                alt="check"
                className="object-contain max-w-full w-5 h-5 shadow-lg"
              />
              Contraseña
            </label>
            <label className="flex items-center gap-2 text-white opacity-90">
              <img
                src="./PNG/AUTORIDAD [Recuperado]-12.png"
                alt="check"
                className="object-contain max-w-full w-5 h-5 shadow-lg"
              />
              Huella
            </label>
            <label className="flex items-center gap-2 text-white opacity-90">
              <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
              Facial
            </label>
            <label className="flex items-center gap-2 text-white opacity-90">
              <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
              e-firma
            </label>
          </div>
           <span className="text-xs opacity-80 mt-auto text-white">2 de 4</span>
        </div>
        {/* card function */}
        <div className="flex-1 p-10 bg-[#FFFDFD] relative flex flex-col items-center justify-center">
          <div className="absolute right-8 top-8 flex gap-1">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
          </div>
          <div className="mb-6">
            {isPasskeyRegistered ? (
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                ¡Huella registrada con éxito!
                <span className="ml-2 inline-block align-middle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#F6E7B2"/>
                    <path d="M12 8v4l2 2" stroke="#D6C08D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
            ) : (
              <span className="font-semibold text-gray-700">Escanea tu huella</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-4">
            {/* Icono de huella */}
            <div className={`w-32 h-32 rounded-lg flex items-center justify-center border-4 transition-all duration-300 ${
              isPasskeyRegistering
                ? 'border-yellow-400 bg-yellow-50 shadow-lg animate-pulse'
                : isPasskeyRegistered
                  ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                  : 'border-gray-300 bg-gray-100'
            }`}>
              <img
              src="./public/fingerprint.png"
                alt="Fingerprint"
                className={`w-16 h-16 object-contain transition-all duration-300 ${
                  isPasskeyRegistering
                    ? 'filter brightness-110 contrast-110'
                    : isPasskeyRegistered
                      ? 'filter brightness-110 contrast-110'
                      : 'filter grayscale opacity-70'
                }`}
              />
              
            </div>
            <p className="mb-6 text-sm">Usa el dedo índice derecho</p>
            {passkeyError && (
              <div className="p-3 rounded-container-fourth bg-red-50 border border-red-200">
                <p className="text-red-700 text-center text-sm">{passkeyError}</p>
              </div>
            )}
            {!isPasskeyRegistered ? (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  onClick={handlePasskeyRegistration}
                  disabled={isPasskeyRegistering}
                  isLoading={isPasskeyRegistering}
                  size="md"
                  fullWidth
                  
                >
                  {isPasskeyRegistering ? 'Escaneando...' : 'Escanear'}
                </Button>
                <Button
                  type="button"
                  onClick={handleSkipPasskey}
                  variant="ghost"
                  size="md"
                  fullWidth
                >
                  Omitir por ahora
                </Button>
              </div>
            ) : null}
          </div>
          </div>
          </div>
        </div>
  
      );
    }
    
    if (currentStep === 5 && fetchedUserData?.curp) {
      // Step 5: Face Registration - Match homepage sizing
      return (

    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="flex bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-4xl">
        {/* left column*/}
        <div className="bg-[#A82E56] text-white p-10 flex flex-col items-center w-1/3 min-w-[260px]">
          <h2 className="text-3xl font-bold mb-2 text-white">Seguridad</h2>
          <p className="mb-6 text-sm opacity-80 text-white">Protege tu Perfil</p>
          <div className="flex flex-col gap-2 w-full mb-8">
            <label className="flex items-center gap-2 font-bold text-white">
              <img
                src="./PNG/AUTORIDAD [Recuperado]-12.png"
                alt="imagen registro"
                className="object-contain max-w-full w-5 h-5 shadow-lg"
              />
              Contraseña
            </label>
            <label className="flex items-center gap-2 text-white opacity-90">
              <img
                src="./PNG/AUTORIDAD [Recuperado]-12.png"
                alt="imagen registro"
                className="object-contain max-w-full w-5 h-5 shadow-lg"
              />
              Huella
            </label>
            <label className="flex items-center gap-2 text-white opacity-90">
              <img
                src="./PNG/AUTORIDAD [Recuperado]-12.png"
                alt="imagen registro"
                className="object-contain max-w-full w-5 h-5 shadow-lg"
              />
              Facial
            </label>
            <label className="flex items-center gap-2 text-white opacity-90">
              <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
              e-firma
            </label>
          </div>
          <span className="text-xs opacity-80 mt-auto text-white">3 de 4</span>
        </div>
        {/* rigth column  */}
        <div className="flex-1 p-10 bg-[#FFFDFD] relative flex flex-col items-center justify-center">
          <div className="absolute right-8 top-8 flex gap-1">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
          </div>
          <div className="mb-6">
            {faceId ? (
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                ¡Rostro registrado con éxito!
                <span className="ml-2 inline-block align-middle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#F6E7B2"/>
                    <path d="M12 8v4l2 2" stroke="#D6C08D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
            ) : (
              <span className="font-semibold text-gray-700">Centra tu imagen, con buena iluminación</span>
            )}
          </div>

<div className="flex flex-row items-center justify-center gap-8 w-full">
  {/* Área de reconocimiento facial */}
  <div className="flex flex-col items-center gap-4 w-full">
    <img
      src="./PNG/AUTORIDAD [Recuperado]-06.png"
      alt="face register"
      className="object-contain max-w-full w-20 h-15 shadow-lg"
    />
    {/* instructions */}
    <div className="flex flex-col items-center gap-2 text-xs text-gray-600">
      <span>Instrucciones:</span>
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span>Acerca tu rostro</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span>Buena iluminación</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span>Parpadea</span>
      </div>
    </div>
    {/* Componente de registro facial */}
    <div className={`${faceId ? 'hidden' : ''} w-full`}>
      <FaceRegistration
        userCurp={fetchedUserData.curp}
        onFaceRegistered={handleFaceRegistered}
        onSkip={handleSkipFaceAuth}
      />
    </div>
    {/* message  */}
    {faceId && (
      <div className="flex items-center justify-center space-x-2 text-primary-maroon">
        {/* ...mensaje de éxito... */}
      </div>
    )}
  </div>
</div>

        </div>
      </div>
    </div>
  );
}
       
    
    return null;
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {renderStepContent()}
      </div>
      {/* Navigation for steps 2, 3, 4, and 5 */}
      {(currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5) && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            onClick={() => changeStep(currentStep - 1)}
            disabled={isLoading || isSendingToken}
            variant="ghost"
            size="sm"
          >
            ← Volver
          </Button>
        </div>
      )}
    </div>
  );
};