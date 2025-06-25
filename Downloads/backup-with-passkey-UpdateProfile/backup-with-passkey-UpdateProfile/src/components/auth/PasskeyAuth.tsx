import React, { useState, useEffect } from 'react';
import { Button } from '../common/CommonComponents';
import { passkeyAuthService, isPasskeySupported } from '../../services/passkeyAuthService';
import { useToast } from '../../contexts/ToastContext';
import { User } from '../../types';

// Inline SVG Icons
const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

interface PasskeyLoginProps {
  onLoginSuccess: (user: User) => void;
  onFallbackToCredentials: () => void;
}

export const PasskeyLogin: React.FC<PasskeyLoginProps> = ({
  onLoginSuccess,
  onFallbackToCredentials,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    // Check if passkeys are supported in this browser
    const supported = isPasskeySupported();
    setIsSupported(supported);
  }, []);

  const handlePasskeyAuth = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await passkeyAuthService.authenticateWithPasskey();
      
      if (result.verified) {
        showSuccess('Autenticación con passkey exitosa');
        
        // The server should return user information in the result
        if (result.user) {
          setTimeout(() => {
            onLoginSuccess(result.user);
          }, 1000);
        } else {
          // If no user is returned, this is a demo implementation
          setError('Esta es una implementación de demostración. En producción, el servidor devolvería los datos de usuario.');
        }
      } else {
        setError(result.error || 'No se pudo verificar la passkey');
      }
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con passkey');
      console.error('Passkey authentication error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Passkeys no soportadas
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Tu navegador no soporta WebAuthn/passkeys o está deshabilitado.
        </p>
        <Button onClick={onFallbackToCredentials} variant="secondary">
          Usar CURP y contraseña
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <KeyIcon className="h-16 w-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
            Autenticación con Passkey
          </h3>
          <p className="text-indigo-800 dark:text-indigo-200 mb-4">
            Inicia sesión rápidamente y de forma segura usando tu passkey (huella digital, reconocimiento facial o PIN).
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={handlePasskeyAuth} 
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <KeyIcon className="h-4 w-4" />
            )}
            {isProcessing ? 'Autenticando...' : 'Iniciar sesión con passkey'}
          </Button>
          <Button onClick={onFallbackToCredentials} variant="secondary">
            Usar CURP y contraseña
          </Button>
        </div>
      </div>
    </div>
  );
};

interface PasskeyRegistrationProps {
  curp: string;
  nombre: string;
  onRegistrationSuccess: () => void;
  onCancel: () => void;
}

export const PasskeyRegistration: React.FC<PasskeyRegistrationProps> = ({
  curp,
  nombre,
  onRegistrationSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const { success: showSuccess } = useToast();

  useEffect(() => {
    // Check if passkeys are supported in this browser
    const supported = isPasskeySupported();
    setIsSupported(supported);
  }, []);

  const handleRegisterPasskey = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await passkeyAuthService.registerPasskey(curp, nombre);
      
      if (result.verified) {
        showSuccess('Passkey registrada exitosamente');
        onRegistrationSuccess();
      } else {
        setError(result.error || 'No se pudo registrar la passkey');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar passkey');
      console.error('Passkey registration error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Passkeys no soportadas
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Tu navegador no soporta WebAuthn/passkeys o está deshabilitado.
        </p>
        <Button onClick={onCancel} variant="secondary">
          Continuar sin passkey
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <KeyIcon className="h-16 w-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
            Registrar Passkey
          </h3>
          <p className="text-indigo-800 dark:text-indigo-200 mb-4">
            Registra una passkey para iniciar sesión más rápido y de forma segura en el futuro. 
            Puedes usar tu huella digital, reconocimiento facial o PIN.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button 
            onClick={handleRegisterPasskey} 
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <KeyIcon className="h-4 w-4" />
            )}
            {isProcessing ? 'Registrando...' : 'Registrar passkey'}
          </Button>
          <Button onClick={onCancel} variant="secondary">
            Omitir
          </Button>
        </div>
      </div>
    </div>
  );
};
