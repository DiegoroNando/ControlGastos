import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../common/CommonComponents';
import { faceAuthService, getFaceAuthCapabilities } from '../../services/faceAuthService';
import { useToast } from '../../contexts/ToastContext';

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

const RotateCcwIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

interface FaceRegistrationProps {
  onFaceRegistered: (faceId: string) => void;
  onSkip: () => void;
  userCurp: string;
  isRequired?: boolean;
}

export const FaceRegistration: React.FC<FaceRegistrationProps> = ({
  onFaceRegistered,
  onSkip,
  userCurp,
  isRequired = false
}) => {  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<'instructions' | 'camera' | 'preview' | 'processing' | 'success'>('instructions');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { success } = useToast();
  
  const capabilities = getFaceAuthCapabilities();

  useEffect(() => {
    // Initialize face auth service
    faceAuthService.initialize();
    
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCameraLoading(true);
      console.log('🎥 Starting camera...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }
      
      // First check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('📹 Available video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('✅ Camera stream obtained:', mediaStream);
      console.log('Stream active:', mediaStream.active);
      console.log('Video tracks:', mediaStream.getVideoTracks().length);
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Add event listeners to debug video loading
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded');
          console.log('Video natural dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('Video element size:', videoRef.current?.clientWidth, 'x', videoRef.current?.clientHeight);
          
          // Force video to play immediately
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('✅ Video playing successfully');
              setIsCameraLoading(false);
            }).catch(err => {
              console.error('❌ Video play error:', err);
              setIsCameraLoading(false);
            });
          }
        };
        
        videoRef.current.oncanplay = () => {
          console.log('✅ Video can play');
          setIsCameraLoading(false);
        };
        
        videoRef.current.onplaying = () => {
          console.log('✅ Video is now playing');
          setIsCameraLoading(false);
        };
        
        videoRef.current.onerror = (err) => {
          console.error('❌ Video element error:', err);
          setError('Error al mostrar la cámara');
          setIsCameraLoading(false);
        };
        
        videoRef.current.onloadstart = () => {
          console.log('🎥 Video load started');
        };
        
        videoRef.current.onstalled = () => {
          console.log('⚠️ Video stalled');
        };
        
        // Set attributes for better compatibility
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Manually trigger play after a short delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.paused) {
            console.log('🔄 Manually triggering video play');
            videoRef.current.play().catch(err => {
              console.error('❌ Manual play failed:', err);
            });
          }
        }, 100);
      }
      
      setStep('camera');
    } catch (err: any) {
      console.error('❌ Camera access error:', err);
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Permisos de cámara denegados. Por favor permite el acceso a la cámara.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No se encontró ninguna cámara en el dispositivo.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'La cámara está siendo usada por otra aplicación.';
      } else {
        errorMessage += 'Verifica los permisos de cámara y que no esté siendo usada por otra aplicación.';
      }
      
      setError(errorMessage);
      setIsCameraLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
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
    startCamera();
  }, [startCamera]);

  const confirmAndRegister = useCallback(async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    setStep('processing');
    setError(null);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      // Only check for face detection and quality
      const result = await faceAuthService.registerUserFace(userCurp, blob);
      if (result.success) {
        setStep('success');
        success('¡Rostro detectado correctamente!');
        setTimeout(() => {
          onFaceRegistered('face-detected'); // No real faceId
        }, 1500);
      } else {
        setError(result.error || 'No se detectó un rostro válido.');
        setStep('preview');
      }
    } catch (err) {
      setError('Error al procesar la detección facial');
      setStep('preview');
      console.error('Face detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, userCurp, onFaceRegistered, success]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      // Ensure video track is enabled
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && !videoTrack.enabled) {
        videoTrack.enabled = true;
      }
      // Try to play the video
      videoRef.current.play().then(() => {
        console.log('Video play() resolved');
      }).catch((err) => {
        console.error('Video play error:', err);
      });
    }
  }, [stream]);

  if (!capabilities.cameraAvailable) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Cámara no disponible
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Tu dispositivo no tiene acceso a cámara o no está disponible.
        </p>        <Button onClick={onSkip} variant="secondary">
          Continuar sin registro facial
        </Button>
      </div>
    );
  }

  if (!capabilities.serviceConfigured) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
        <AlertTriangleIcon className="h-12 w-12 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
          Servicio temporal no disponible
        </h3>
        <p className="text-orange-700 dark:text-orange-300 mb-4">
          El registro facial estará disponible próximamente.
        </p>
        <Button onClick={onSkip} variant="secondary">
          Continuar sin registro facial
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">      {/* Instructions Step */}
      {step === 'instructions' && (
        <div className="text-center space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <CameraIcon className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Registro Facial Opcional
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Registra tu rostro para poder usar autenticación facial en futuros inicios de sesión.
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
          
          {/* Camera diagnostic info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Estado de la cámara:</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>✓ Navegador compatible: {navigator.mediaDevices ? 'Sí' : 'No'}</p>
              <p>✓ API getUserMedia: {(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') ? 'Disponible' : 'No disponible'}</p>
              <p>✓ Protocolo seguro: {window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? 'Sí' : 'No (requerido para cámara)'}</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}
            
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={startCamera} 
              className="flex items-center gap-2"
              isLoading={isCameraLoading}
              disabled={isCameraLoading}
            >
              <CameraIcon className="h-4 w-4" />
              {isCameraLoading ? 'Iniciando cámara...' : 'Comenzar registro facial'}
            </Button>
            {!isRequired && (
              <Button onClick={onSkip} variant="secondary">
                Omitir por ahora
              </Button>
            )}
          </div>
        </div>
      )}{/* Camera Step */}
      {step === 'camera' && (
        <div className="text-center space-y-4">
          <div className="relative inline-block bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ minWidth: '320px', minHeight: '240px' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                playsInline
                muted
                autoPlay
                style={{ 
                  minHeight: '240px', 
                  minWidth: '320px',
                  maxHeight: '480px',
                  maxWidth: '640px',
                  objectFit: 'cover',
                  display: 'block',
                  visibility: 'visible',
                  backgroundColor: '#000'
                }}
                onCanPlay={() => setIsCameraLoading(false)}
                onPlaying={() => setIsCameraLoading(false)}
              />
              
              {/* Loading overlay */}
              {isCameraLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg flex items-center justify-center z-10">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              )}
              
              {/* Frame overlay */}
              <div className="absolute inset-2 border-2 border-blue-500 rounded-lg pointer-events-none z-5">
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>
              </div>
              
              {/* Stream status indicator */}
              {stream && !isCameraLoading && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                  ● En vivo
                </div>
              )}

              {/* Debug overlay */}
              <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-800 px-2 py-1 rounded shadow">
                <span>readyState: {{0:'HAVE_NOTHING',1:'HAVE_METADATA',2:'HAVE_CURRENT_DATA',3:'HAVE_FUTURE_DATA',4:'HAVE_ENOUGH_DATA'}[videoRef.current?.readyState||0]}</span><br/>
                <span>w: {videoRef.current?.videoWidth||'-'} h: {videoRef.current?.videoHeight||'-'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Posiciona tu rostro dentro del marco y haz clic en capturar
            </p>
            {stream && (
              <p className="text-green-600 dark:text-green-400 text-sm">
                ✓ Cámara conectada correctamente
              </p>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={capturePhoto} 
              className="flex items-center gap-2"
              disabled={!stream || isCameraLoading}
            >
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
            ¿La foto se ve bien? Esta imagen se usará para tu autenticación facial.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={confirmAndRegister} 
              disabled={isProcessing}
              className="flex items-center gap-2"
            >              <CheckCircleIcon className="h-4 w-4" />
              Confirmar y registrar
            </Button>            <Button onClick={retakePhoto} variant="secondary" className="flex items-center gap-2">
              <RotateCcwIcon className="h-4 w-4" />
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
            Procesando tu registro facial...
          </p>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className="text-center space-y-4">
          <CheckCircleIcon className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto" />
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
            ¡Rostro detectado correctamente!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Se detectó un rostro válido y de buena calidad. (No se almacena información biométrica por restricciones de Azure)
          </p>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
