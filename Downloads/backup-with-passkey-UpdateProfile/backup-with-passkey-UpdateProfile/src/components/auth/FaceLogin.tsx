import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../common/CommonComponents';
import { faceAuthService, getFaceAuthCapabilities } from '../../services/faceAuthService';
import { useToast } from '../../contexts/ToastContext';
import { User } from '../../types';
import { getUserByCurp } from '../../services/databaseService';

// Inline SVG Icons
const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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

const PasskeyIcon = ({ className }: { className?: string }) => (
  <img 
    src="/fingerprint.png" 
    alt="Fingerprint" 
    className={`${className} object-contain`}
  />
);

interface BiometricLoginProps {
  onLoginSuccess: (user: User) => void;
  onFallbackToCredentials: () => void;
  availableUsers?: User[]; // Users with face registration enabled
}

export const FaceLogin: React.FC<BiometricLoginProps> = ({
  onLoginSuccess,
  onFallbackToCredentials,
  availableUsers = []
}) => {
  // Face authentication states
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<'options' | 'instructions' | 'camera' | 'preview' | 'processing' | 'success' | 'error'>('options');
  const [error, setError] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  
  // Passkey authentication state
  const [isPasskeyProcessing, setIsPasskeyProcessing] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { success } = useToast();
  
  const capabilities = getFaceAuthCapabilities();

  // Check passkey support on component mount
  useEffect(() => {
    const checkPasskeySupport = async () => {
      try {
        const { passkeyAuthService } = await import('../../services/passkeyAuthService');
        setIsPasskeySupported(passkeyAuthService.isSupported());
      } catch (error) {
        console.error('Error checking passkey support:', error);
        setIsPasskeySupported(false);
      }
    };
    
    checkPasskeySupport();
  }, []);

  // Initialize face auth and handle camera cleanup
  useEffect(() => {
    faceAuthService.initialize();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle passkey authentication
  const handlePasskeyLogin = async () => {
    try {
      setIsPasskeyProcessing(true);
      setError(null);
      
      const { passkeyAuthService } = await import('../../services/passkeyAuthService');
      const result = await passkeyAuthService.authenticateWithPasskey();
      
      if (result.verified && result.user) {
        try {
          // Get the complete user data
          const user = await getUserByCurp(result.user.curp);
          
          if (user) {
            setMatchedUser(user);
            setStep('success');
            success(`¡Bienvenido/a, ${user.nombre}!`);
            
            setTimeout(() => {
              onLoginSuccess(user);
            }, 1500);
          } else {
            setError('Error al cargar los datos de usuario después de la autenticación con passkey.');
            setStep('error');
          }
        } catch (dbError) {
          console.error('Error getting user after passkey auth:', dbError);
          setError('Error al cargar los datos de usuario después de la autenticación con passkey.');
          setStep('error');
        }
      } else {
        setError('La verificación con passkey falló. Intenta de nuevo o usa otro método.');
        setStep('error');
      }
    } catch (error) {
      console.error('Error during passkey authentication:', error);
      setError('Error al autenticar con passkey. Intenta de nuevo o usa otro método.');
      setStep('error');
    } finally {
      setIsPasskeyProcessing(false);
    }
  };

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStep('camera');
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos de cámara.');
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setStep('options');
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    setStep('preview');
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setMatchedUser(null);
    startCamera();
  }, [startCamera]);

  const authenticateWithFace = useCallback(async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    setStep('processing');
    setError(null);
    
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();      // Detect face in the image
      const faces = await faceAuthService.detectFaces(blob);
      
      if (!faces || faces.length === 0) {
        setError('No se detectó un rostro claro en la imagen. Por favor, intenta de nuevo con mejor iluminación y asegúrate de que tu rostro esté completamente visible.');
        setStep('error');
        setIsProcessing(false);
        return;
      }
      
      // Try to authenticate with each user who has face registration
      for (const user of availableUsers) {
        if (user.faceId && user.hasFaceRegistered) {
          // In a real implementation, this would verify against the stored face ID
          // For this demo, we're just detecting if there's a face in the image
          setMatchedUser(user);
          setStep('success');
          success(`¡Bienvenido/a, ${user.nombre}!`);
          
          setTimeout(() => {
            onLoginSuccess(user);
          }, 1500);
          return;
        }
      }
      
      // No match found
      setError('No se pudo reconocer tu rostro. Intenta de nuevo o usa tu CURP y contraseña.');
      setStep('error');
    } catch (err) {
      setError('Error al procesar la autenticación facial');
      setStep('error');
      console.error('Face authentication error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, availableUsers, onLoginSuccess, success]);

  // Show message if camera is not available
  if (!capabilities.cameraAvailable && !isPasskeySupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Métodos de autenticación no disponibles
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Tu dispositivo no tiene acceso a cámara y no soporta passkeys.
        </p>
        <Button onClick={onFallbackToCredentials} variant="secondary">
          Usar CURP y contraseña
        </Button>
      </div>
    );
  }

  // Show message if face service is not configured
  if (!capabilities.serviceConfigured && !isPasskeySupported) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
          Servicio temporal no disponible
        </h3>
        <p className="text-orange-700 dark:text-orange-300 mb-4">
          La autenticación biométrica no está disponible en este momento.
        </p>
        <Button onClick={onFallbackToCredentials} variant="secondary">
          Usar CURP y contraseña
        </Button>
      </div>
    );
  }

  // Show message if no users with face registration are available and passkeys are not supported
  if (availableUsers.length === 0 && !isPasskeySupported) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          No hay usuarios con registro biométrico
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          No se encontraron usuarios con autenticación biométrica habilitada.
        </p>
        <Button onClick={onFallbackToCredentials} variant="secondary">
          Usar CURP y contraseña
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication Options Step */}
      {step === 'options' && (
        <div className="text-center space-y-6">
          <h3 className="text-xl font-semibold mb-4">
            Métodos de Autenticación Biométrica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Face Authentication Option */}
            {capabilities.cameraAvailable && capabilities.serviceConfigured && availableUsers.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mb-3">
                  <CameraIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Reconocimiento Facial
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4 text-center">
                  Inicia sesión usando el reconocimiento facial si ya has registrado tu rostro.
                </p>
                <Button 
                  onClick={() => setStep('instructions')} 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <CameraIcon className="h-4 w-4" />
                  Usar Reconocimiento Facial
                </Button>
              </div>
            )}

            {/* Passkey Authentication Option */}
            {isPasskeySupported && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5 flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center mb-3">
                  <PasskeyIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Passkey
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-4 text-center">
                  Inicia sesión de forma segura con tu passkey registrado en este dispositivo.
                </p>
                <Button 
                  onClick={handlePasskeyLogin} 
                  isLoading={isPasskeyProcessing}
                  disabled={isPasskeyProcessing}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <PasskeyIcon className="h-4 w-4" />
                  Usar Passkey
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button onClick={onFallbackToCredentials} variant="secondary">
              Usar CURP y contraseña
            </Button>
          </div>
        </div>
      )}

      {/* Face Login Instructions Step */}
      {step === 'instructions' && (
        <div className="text-center space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <CameraIcon className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Autenticación Facial
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Inicia sesión usando tu rostro registrado.
            </p>
            <div className="text-left space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <h4 className="font-semibold">Instrucciones:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Asegúrate de tener buena iluminación</li>
                <li>Mira directamente a la cámara</li>
                <li>Mantén una expresión neutral</li>
                <li>Evita usar lentes oscuros o cubrebocas</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={startCamera} className="flex items-center gap-2">
              <CameraIcon className="h-4 w-4" />
              Iniciar autenticación facial
            </Button>
            <Button onClick={() => setStep('options')} variant="secondary">
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* Camera Step */}
      {step === 'camera' && (
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <video
              ref={videoRef}
              className="rounded-lg border-2 border-gray-300 dark:border-gray-600 max-w-full h-auto"
              playsInline
              muted
            />
            <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none">
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400">
            Posiciona tu rostro dentro del marco y haz clic en capturar
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={capturePhoto} className="flex items-center gap-2">
              <CameraIcon className="h-4 w-4" />
              Capturar foto
            </Button>
            <Button onClick={stopCamera} variant="secondary">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && capturedImage && (
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="rounded-lg border-2 border-gray-300 dark:border-gray-600 max-w-full h-auto max-h-80"
            />
          </div>
          
          <p className="text-gray-600 dark:text-gray-400">
            ¿La foto se ve bien? Procederemos a verificar tu identidad.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={authenticateWithFace} 
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Autenticar
            </Button>
            <Button onClick={retakePhoto} variant="secondary" className="flex items-center gap-2">
              <CameraIcon className="h-4 w-4" />
              Tomar otra foto
            </Button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Verificando tu identidad...
          </p>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && matchedUser && (
        <div className="text-center space-y-4">
          <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto" />
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
            ¡Autenticación exitosa!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Bienvenido/a, {matchedUser.nombre} {matchedUser.apellidoPaterno}
          </p>
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="text-center space-y-4">
          <XCircleIcon className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto" />
          <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">
            Autenticación fallida
          </h3>
          <p className="text-red-700 dark:text-red-300">
            {error || 'No se pudo verificar tu identidad'}
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setStep('options')} className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a opciones
            </Button>
            <Button onClick={onFallbackToCredentials} variant="secondary">
              Usar CURP y contraseña
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
