import React, { useState, useRef, useEffect } from 'react';
import { Post } from '../../types';
import { Button, Card, ConfirmationModal, Modal } from '../common/CommonComponents';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext'; // Add toast context import
import { addPost as serviceAddPost, getStorageInfo, clearOldVideoData } from '../../services/databaseService';

interface CreatePostFormProps {
  onPostCreated: (newPost: Post) => void;
}

const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEO_DURATION_S = 120;
const VIDEO_THUMBNAIL_WIDTH = 640; // Width for the captured video thumbnail

const FileUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);
const VideoPreviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
    </svg>
);


export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { error: showError } = useToast();

  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null); // Store the raw File object
  const [mediaPreview, setMediaPreview] = useState<string | null>(null); // For image Data URI or video thumbnail Data URI
  const [mediaTypeForPreview, setMediaTypeForPreview] = useState<'image' | 'video' | null>(null);
  const [videoFileNameForPreview, setVideoFileNameForPreview] = useState<string | null>(null);
  const [videoDurationForPreview, setVideoDurationForPreview] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));


  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para generar un nombre aleatorio para archivos
  const generateRandomFileName = (originalFile: File): string => {
    const fileExtension = originalFile.name.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const randomId = `${randomString}_${timestamp}`;
    return fileExtension ? `${randomId}.${fileExtension}` : randomId;
  };

  // Función para crear un nuevo objeto File con nombre aleatorio
  const createFileWithRandomName = (originalFile: File): File => {
    const randomFileName = generateRandomFileName(originalFile);
    const newFile = new File([originalFile], randomFileName, {
      type: originalFile.type,
      lastModified: originalFile.lastModified,
    });
    
    // Preservar propiedades personalizadas si existen
    if ((originalFile as any).videoDataUrl) {
      (newFile as any).videoDataUrl = (originalFile as any).videoDataUrl;
    }
    
    console.log(`Archivo renombrado: "${originalFile.name}" → "${randomFileName}"`);
    return newFile;
  };

  const createVideoPlaceholder = (fileName: string, duration: number): string | null => {
    try {
      const placeholderCanvas = document.createElement('canvas');
      placeholderCanvas.width = VIDEO_THUMBNAIL_WIDTH;
      placeholderCanvas.height = Math.round(VIDEO_THUMBNAIL_WIDTH * 9 / 16); // Aspect ratio 16:9
      
      const ctx = placeholderCanvas.getContext('2d');
      if (!ctx) {
        console.error('No se pudo obtener contexto 2D para placeholder');
        return null;
      }

      // Fondo oscuro
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(0, 0, placeholderCanvas.width, placeholderCanvas.height);
      
      // Icono de video (círculo con triángulo)
      const centerX = placeholderCanvas.width / 2;
      const centerY = placeholderCanvas.height / 2;
      const radius = 40;
      
      // Círculo
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Triángulo (play button)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(centerX - 15, centerY - 20);
      ctx.lineTo(centerX - 15, centerY + 20);
      ctx.lineTo(centerX + 20, centerY);
      ctx.closePath();
      ctx.fill();
      
      // Texto con información del archivo
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Video Preview', centerX, centerY + radius + 30);
      
      ctx.font = '12px Inter, Arial, sans-serif';
      // Truncar nombre de archivo si es muy largo
      const maxFileNameLength = 25;
      const displayFileName = fileName.length > maxFileNameLength 
        ? fileName.substring(0, maxFileNameLength) + '...' 
        : fileName;
      ctx.fillText(displayFileName, centerX, centerY + radius + 50);
      
      if (duration > 0) {
        ctx.fillText(formatDuration(duration), centerX, centerY + radius + 70);
      }
      
      return placeholderCanvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error creando placeholder de video:', error);
      return null;
    }
  };

  const captureVideoFrame = (videoFile: File, callback: (dataUrl: string | null, duration: number, videoDataUrl?: string) => void) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let objectURL: string | null = null;
    
    console.log('=== Iniciando captura de video ===');
    console.log('Archivo:', videoFile.name, 'Tipo:', videoFile.type, 'Tamaño:', (videoFile.size / (1024 * 1024)).toFixed(2), 'MB');
    
    // Limpiar cualquier src anterior
    video.src = "";
    video.load();

    const cleanup = () => {
        console.log('Limpiando recursos de video');
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (objectURL) {
            URL.revokeObjectURL(objectURL);
            objectURL = null;
        }
        video.removeEventListener('loadedmetadata', handleVideoMetadata);
        video.removeEventListener('loadeddata', handleVideoLoaded);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleVideoError);
        video.src = "";
    };

    const handleVideoMetadata = () => {
        console.log('Metadata cargada - Duración:', video.duration, 'Dimensiones:', video.videoWidth, 'x', video.videoHeight);
        
        if (isNaN(video.duration) || video.duration <= 0) {
            console.error('Duración de video inválida:', video.duration);
            showError('Error: Duración del video inválida.');
            cleanup();
            callback(null, 0);
            return;
        }
        
        if (video.duration > MAX_VIDEO_DURATION_S) {
            showError(`La duración del video no debe exceder ${MAX_VIDEO_DURATION_S} segundos (${formatDuration(MAX_VIDEO_DURATION_S)}). Duración actual: ${formatDuration(video.duration)}.`);
            cleanup();
            callback(null, video.duration); 
            return;
        }

        // Verificar dimensiones del video
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.error('Dimensiones de video inválidas:', video.videoWidth, 'x', video.videoHeight);
            showError('Error: No se pudieron obtener las dimensiones del video.');
            cleanup();
            callback(null, video.duration);
            return;
        }
    };

    const handleVideoLoaded = () => {
        console.log('Video data cargada, ReadyState:', video.readyState);
    };

    const handleCanPlay = () => {
        console.log('Video puede reproducirse, intentando capturar frame');
        try {
            const aspectRatio = video.videoWidth / video.videoHeight;
            canvas.width = VIDEO_THUMBNAIL_WIDTH;
            canvas.height = Math.round(VIDEO_THUMBNAIL_WIDTH / aspectRatio);

            console.log('Canvas configurado:', canvas.width, 'x', canvas.height);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('No se pudo obtener contexto 2D del canvas');
                showError('Error: No se pudo obtener el contexto del canvas.');
                cleanup();
                callback(null, video.duration);
                return;
            }

            // Timeout para evitar colgarse
            timeoutId = setTimeout(() => {
                console.log('Timeout en generación de miniatura');
                showError('Timeout al generar la miniatura del video.');
                cleanup();
                callback(null, video.duration);
            }, 15000); // 15 segundos de timeout

            // Intentar capturar frame inmediatamente
            console.log('Posición de video actual:', video.currentTime);
            
            // Asegurar que estamos en el primer frame
            video.currentTime = 0.1; // Ir a 0.1 segundos para evitar frames negros iniciales
            
            // Esperar a que se actualice la posición
            video.addEventListener('seeked', () => {
                console.log('Posición actualizada a:', video.currentTime);
                captureFrame();
            }, { once: true });
            
        } catch (error) {
            console.error('Error configurando captura de video:', error);
            showError('Error al procesar el video para generar la miniatura.');
            cleanup();
            callback(null, video.duration);
        }
    };

    const captureFrame = () => {
        try {
            console.log('Ejecutando captureFrame - ReadyState:', video.readyState, 'CurrentTime:', video.currentTime);
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                console.error('No hay contexto de canvas disponible');
                cleanup();
                callback(null, video.duration);
                return;
            }

            if (video.readyState < 2) { // HTMLMediaElement.HAVE_CURRENT_DATA
                console.error('Video no está listo para captura. ReadyState:', video.readyState);
                cleanup();
                callback(null, video.duration);
                return;
            }

            if (video.videoWidth <= 0 || video.videoHeight <= 0) {
                console.error('Dimensiones de video inválidas para captura:', video.videoWidth, 'x', video.videoHeight);
                cleanup();
                callback(null, video.duration);
                return;
            }

            // Limpiar canvas y dibujar frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir a imagen
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            console.log('Miniatura generada exitosamente, tamaño:', thumbnailDataUrl.length, 'caracteres');
            
            // Verificar que la imagen no está vacía (solo data: header)
            if (thumbnailDataUrl.length < 100) {
                console.error('Miniatura generada es demasiado pequeña, posiblemente vacía');
                cleanup();
                callback(null, video.duration);
                return;
            }
            
            // Convertir el video completo a Base64
            console.log('Convirtiendo video a Base64...');
            const reader = new FileReader();
            reader.onloadend = () => {
                const videoDataUrl = reader.result as string;
                console.log('Video convertido a Base64, tamaño:', (videoDataUrl.length / (1024 * 1024)).toFixed(2), 'MB');
                cleanup();
                callback(thumbnailDataUrl, video.duration, videoDataUrl);
            };
            reader.onerror = () => {
                console.error('Error al convertir video a Base64');
                cleanup();
                callback(thumbnailDataUrl, video.duration); // Al menos devolver la miniatura
            };
            reader.readAsDataURL(videoFile);
            
        } catch (error) {
            console.error('Error al capturar frame:', error);
            cleanup();
            callback(null, video.duration);
        }
    };

    const handleVideoError = (event: Event) => {
        console.error('Error al cargar video:', event);
        const target = event.target as HTMLVideoElement;
        if (target && target.error) {
            console.error('Código de error:', target.error.code, 'Mensaje:', target.error.message);
        }
        showError('Error al cargar el video para generar la miniatura.');
        cleanup();
        callback(null, 0);
    };

    // Configurar event listeners
    video.addEventListener('loadedmetadata', handleVideoMetadata, { once: true });
    video.addEventListener('loadeddata', handleVideoLoaded, { once: true });
    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('error', handleVideoError, { once: true });

    // Crear URL del objeto para el video
    objectURL = URL.createObjectURL(videoFile);
    video.src = objectURL;
    video.load();

    console.log('Video carga iniciada con URL:', objectURL);
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = event.target.files?.[0];
    if (!originalFile) {
      clearMedia();
      return;
    }    // Crear archivo con nombre aleatorio para evitar conflictos
    const file = createFileWithRandomName(originalFile);

    setMediaPreview(null);
    setMediaTypeForPreview(null);
    setVideoFileNameForPreview(null);
    setVideoDurationForPreview(null);
    setSelectedRawFile(null);

    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(fileType)) {
        showError('Tipo de imagen no válido. Permitidos: JPG, PNG, GIF, WEBP.');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        showError(`El tamaño de la imagen no debe exceder ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
        setMediaTypeForPreview('image');
        setSelectedRawFile(file);
      };
      reader.readAsDataURL(file);
    } else if (fileType.startsWith('video/')) {
      if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(fileType)) {
        showError('Tipo de video no válido. Permitidos: MP4, WebM, MOV.');
        return;
      }
      
      captureVideoFrame(file, (thumbnailDataUrl, duration, videoDataUrl) => {
        console.log('Callback de captureVideoFrame:', { 
          hasThumbnail: !!thumbnailDataUrl, 
          duration, 
          hasVideoData: !!videoDataUrl,
          originalFileName: originalFile.name,
          randomFileName: file.name
        });

        if (thumbnailDataUrl) {
          console.log('Usando miniatura generada exitosamente');
          setMediaPreview(thumbnailDataUrl);
          setMediaTypeForPreview('video');
          // Mostrar el nombre original al usuario, pero usar el aleatorio internamente
          setVideoFileNameForPreview(originalFile.name);
          setVideoDurationForPreview(duration);
          setSelectedRawFile(file);
          // Store the video Base64 data for persistence
          (file as any).videoDataUrl = videoDataUrl;
        } else {
          console.log('No se pudo generar miniatura, creando placeholder');
          // Si no se pudo generar miniatura pero el video es válido, crear placeholder
          if (duration > 0 && duration <= MAX_VIDEO_DURATION_S) {
            const placeholderDataUrl = createVideoPlaceholder(originalFile.name, duration);
            if (placeholderDataUrl) {
              console.log('Placeholder creado exitosamente');
              setMediaPreview(placeholderDataUrl);
              setMediaTypeForPreview('video');
              // Mostrar el nombre original al usuario
              setVideoFileNameForPreview(originalFile.name);
              setVideoDurationForPreview(duration);
              setSelectedRawFile(file);
              // Aún así, intentar almacenar el video completo si está disponible
              if (videoDataUrl) {
                (file as any).videoDataUrl = videoDataUrl;
              }
            } else {
              console.error('No se pudo crear placeholder');
              showError('No se pudo procesar el video. Intenta con otro archivo.');
              clearMedia();
            }
          } else if (duration > MAX_VIDEO_DURATION_S) {
            console.log('Video excede duración máxima');
            // El error ya fue establecido en captureVideoFrame
          } else {
            console.error('Video inválido o sin duración');
            showError('Video inválido. Intenta con otro archivo.');
            clearMedia();
          }
        }
      });
    } else {
      showError('Tipo de archivo no soportado. Sube imágenes o videos.');
    }
  };
  const clearMedia = () => {
    setSelectedRawFile(null);
    setMediaPreview(null);
    setMediaTypeForPreview(null);
    setVideoFileNameForPreview(null);
    setVideoDurationForPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedRawFile) {
      showError('El contenido o un archivo multimedia es obligatorio.');
      return;
    }    setIsLoading(true);

    if (!currentUser || !currentUser.isRegisteredAsCandidate) {
        showError('Solo los candidatos pueden crear publicaciones.');
        setIsLoading(false);
        return;
    }

    let mediaUrl: string | undefined = undefined;
    let mediaType: 'image' | 'video' | undefined = undefined;
    let videoFileName: string | undefined = undefined;
    let videoDuration: number | undefined = undefined;
    let videoDataUrl: string | undefined = undefined;
    let transientVideoFile: File | undefined = undefined;

    if (selectedRawFile) {
      if (mediaTypeForPreview === 'image' && mediaPreview?.startsWith('data:image')) {
        mediaType = 'image';
        mediaUrl = mediaPreview;
      } else if (mediaTypeForPreview === 'video' && mediaPreview?.startsWith('data:image')) {
        mediaType = 'video';
        mediaUrl = mediaPreview; 
        videoFileName = videoFileNameForPreview || selectedRawFile.name;
        videoDuration = videoDurationForPreview || 0;
        videoDataUrl = (selectedRawFile as any).videoDataUrl; // Get the stored video Base64
        transientVideoFile = selectedRawFile; // Keep the raw file for in-memory use
      }
    }

    // Prepare post data
    const newPostData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'dislikes'> = {
      authorId: currentUser.id,
      content,
      mediaUrl,
      mediaType,
      videoFileName,
      videoDuration,
      videoDataUrl, // Include the video Base64 data for persistence
      transientVideoFile, // Will be passed to onPostCreated
    };    try {
      await new Promise(resolve => setTimeout(resolve, 300)); 
      const newPost = await serviceAddPost(newPostData);
      onPostCreated(newPost); // newPost here includes transientVideoFile
      setContent('');
      clearMedia();
    } catch (err) {
      console.error('Error creating post:', err);
      
      if (err instanceof Error && err.message.includes('Storage quota exceeded')) {
        // Handle storage quota error with user-friendly message and recovery options
        const storageInfo = getStorageInfo();
        console.log('Storage usage:', storageInfo);
        
        if (mediaTypeForPreview === 'video') {
          // For video posts, offer to save without full video data
          showError(`Almacenamiento lleno (${storageInfo.used} bytes usados). El video se guardará solo como miniatura. Para videos completos, libera espacio eliminando publicaciones antiguas.`);
            try {
            // Attempt to save without video data
            const fallbackPostData = {
              ...newPostData,
              videoDataUrl: undefined // Remove video data, keep only thumbnail
            };
            const newPost = await serviceAddPost(fallbackPostData);
            onPostCreated(newPost);
            setContent('');
            clearMedia();
            return;
          } catch (fallbackError) {
            console.error('Fallback save also failed:', fallbackError);
          }
        }          // Try to clear old video data and retry
        const clearedCount = await clearOldVideoData();
        if (clearedCount > 0) {
          showError(`Almacenamiento optimizado (liberados ${clearedCount} videos antiguos). Intenta publicar nuevamente.`);
        } else {
          showError('Almacenamiento lleno. Elimina publicaciones antiguas para continuar.');
        }
      } else {
        showError('Error al crear la publicación.');
      }
    } finally {
      setIsLoading(false);
    }
  };  return (
    <Card title="Crear Nueva Publicación" className="spectra-card bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-md border border-light-gray-alt/20 dark:border-accent-gold/20">
      <form onSubmit={handleSubmit} className="space-y-4">
        <StorageIndicator />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe algo sobre tu propuesta o ideas..."
          rows={4}
          className="spectra-input w-full bg-white/80 dark:bg-neutral-700/60 backdrop-blur-sm border border-light-gray-alt/30 dark:border-accent-gold/30 focus:border-primary-maroon dark:focus:border-accent-gold rounded-container-third shadow-spectra-sm text-text-primary dark:text-neutral-100 placeholder-text-tertiary dark:placeholder-neutral-400 transition-colors duration-200"
        />
        
        <div>
            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1.5">
                Adjuntar Multimedia (Opcional)
            </label>
            <div className="flex items-center space-x-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="spectra-btn-secondary !px-3 !py-1.5 !text-sm !h-auto"
                >
                    <FileUploadIcon />
                    Seleccionar Archivo
                </Button>
                {selectedRawFile && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearMedia}
                        className="!text-error-text dark:!text-red-400 !px-2 !py-1"
                        title="Quitar archivo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Quitar
                    </Button>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v"
                onChange={handleFileChange}
                className="hidden"
            />
            <p className="text-xs text-text-tertiary dark:text-neutral-500 mt-1">
                Imágenes (JPG, PNG, GIF, WEBP) hasta {MAX_IMAGE_SIZE_MB}MB. Videos (MP4, WEBM, MOV) hasta {formatDuration(MAX_VIDEO_DURATION_S)}.
            </p>
        </div>

        {mediaPreview && (
          <div className="mt-2 p-2 border border-light-gray-alt/30 dark:border-accent-gold/30 rounded-container-third bg-light-gray/20 dark:bg-neutral-700/30 backdrop-blur-sm">
            {mediaTypeForPreview === 'image' ? (
              <img src={mediaPreview} alt="Vista previa" className="max-h-40 max-w-full rounded-md object-contain mx-auto" />
            ) : mediaTypeForPreview === 'video' ? (
              <div className="flex flex-col items-center text-sm text-text-secondary dark:text-neutral-300">
                 <img src={mediaPreview} alt="Miniatura de video" className="max-h-40 max-w-full rounded-md object-contain mx-auto mb-2" />
                 <div className="flex items-center">
                    <VideoPreviewIcon /> 
                    <span>{videoFileNameForPreview} ({videoDurationForPreview ? formatDuration(videoDurationForPreview) : 'Duración desconocida'})</span>
                 </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading} disabled={isLoading} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">Publicar</Button>
        </div>
      </form>
    </Card>
  );
};

interface PostCardProps {
  post: Post;
  onReaction: (postId: string, reactionType: 'like' | 'dislike') => void;
  onDelete?: (postId: string) => void;
  allowDelete?: boolean;
}

const ThreeDotsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
  </svg>
);

const GalleryIconPlaceholder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 dark:text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const VideoIconLarge = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 dark:text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
    </svg>
);


export const PostCard: React.FC<PostCardProps> = ({ post, onReaction, onDelete, allowDelete }) => {
  const { currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalContentUrl, setMediaModalContentUrl] = useState<string | null>(null);
  const [mediaModalType, setMediaModalType] = useState<'image' | 'video' | null>(null);
  const [currentPostForModal, setCurrentPostForModal] = useState<Post | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);


  const MAX_COLLAPSED_HEIGHT_PX = 72; 

  useEffect(() => {
    if (contentRef.current) {
      setIsTruncated(contentRef.current.scrollHeight > MAX_COLLAPSED_HEIGHT_PX);
    }
  }, [post.content]);


  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (!currentUser) return;
    onReaction(post.id, reactionType);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    setShowDeleteConfirm(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openMediaModal = (clickedPost: Post) => { // Accept post object
    if (!clickedPost.mediaUrl) return;

    setCurrentPostForModal(clickedPost);
    setMediaModalType(clickedPost.mediaType || 'image');

    if (clickedPost.mediaType === 'video') {
        if (clickedPost.transientVideoFile) {
            // Use the current session video file if available
            if (videoObjectUrlRef.current) {
                URL.revokeObjectURL(videoObjectUrlRef.current);
            }
            videoObjectUrlRef.current = URL.createObjectURL(clickedPost.transientVideoFile);
            setMediaModalContentUrl(videoObjectUrlRef.current);
        } else if (clickedPost.videoDataUrl) {
            // Use the stored video Base64 data for persistent playback
            setMediaModalContentUrl(clickedPost.videoDataUrl);
        } else {
            // Fallback to thumbnail only
            setMediaModalContentUrl(clickedPost.mediaUrl);
        }
    } else {
        setMediaModalContentUrl(clickedPost.mediaUrl); 
    }
    setIsMediaModalOpen(true);
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setMediaModalContentUrl(null);
    setMediaModalType(null);
    setCurrentPostForModal(null);
    if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
        videoObjectUrlRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => {
        if (videoObjectUrlRef.current) {
            URL.revokeObjectURL(videoObjectUrlRef.current);
        }
    };
  }, []);


  const formatDuration = (seconds: number | undefined): string => {
    if (seconds === undefined) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  let mediaContent = null;
  if (post.mediaUrl) {
    const isActualVideoPlaceholder = post.mediaType === 'video' && post.mediaUrl?.startsWith('video_placeholder:'); 
    const canDisplayMedia = post.mediaType === 'image' || (post.mediaType === 'video' && !isActualVideoPlaceholder);

    if (canDisplayMedia) {
        mediaContent = (
            <button 
                type="button" 
                onClick={() => openMediaModal(post)} // Pass post object here
                className="my-3 rounded-container-third overflow-hidden aspect-video bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center w-full group focus:outline-none focus:ring-2 focus:ring-custom-pink focus:ring-offset-2 dark:focus:ring-offset-neutral-800 relative"
                aria-label={`Abrir ${post.mediaType === 'image' ? 'imagen' : 'miniatura de video'} de la publicación`}
            >
                <img 
                    src={post.mediaUrl} 
                    alt={post.mediaType === 'image' ? "Contenido de la publicación" : `Miniatura de video: ${post.videoFileName || 'Video'}`}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none'; 
                        const placeholder = target.parentElement?.querySelector('.placeholder-icon');
                        if (placeholder) {
                            placeholder.classList.remove('hidden');
                            placeholder.classList.add('flex');
                        }
                    }}
                    onLoad={(e) => {
                        // Asegurar que el placeholder esté oculto si la imagen carga correctamente
                        const target = e.target as HTMLImageElement;
                        const placeholder = target.parentElement?.querySelector('.placeholder-icon');
                        if (placeholder) {
                            placeholder.classList.add('hidden');
                            placeholder.classList.remove('flex');
                        }
                    }}
                />
                <div className="placeholder-icon hidden items-center justify-center w-full h-full absolute inset-0 bg-neutral-200 dark:bg-neutral-700">
                    {post.mediaType === 'image' ? <GalleryIconPlaceholder /> : <VideoIconLarge />}
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                            {post.mediaType === 'image' ? 'Imagen no disponible' : `Video: ${post.videoFileName || 'Sin nombre'}`}
                        </p>
                        {post.mediaType === 'video' && post.videoDuration && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                ({formatDuration(post.videoDuration)})
                            </p>
                        )}
                    </div>
                </div>
            </button>
        );
    } else if (isActualVideoPlaceholder) { 
        const parts = post.mediaUrl.split(':');
        const fileName = parts[1];
        const fileType = parts[2];
        mediaContent = (
            <div className="my-3 p-3 rounded-container-third bg-neutral-200 dark:bg-neutral-700 flex flex-col items-center justify-center aspect-video">
                <VideoIconLarge />
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-2 text-center truncate w-full px-2" title={`${fileName} (${fileType})`}>
                    Video: {fileName}
                </p>
                <p className="text-[10px] text-text-tertiary dark:text-neutral-500">({fileType})</p>
                <p className="text-[10px] text-text-tertiary dark:text-neutral-500 mt-1">Previsualización no disponible.</p>
            </div>
        );
    }
  }


  return (
    <Card className="spectra-card mb-4 shadow-spectra-md rounded-container-third bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-md overflow-hidden border border-light-gray-alt/20 dark:border-accent-gold/20" padding="none">      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-2 bg-gradient-to-r from-transparent via-slate-100/30 dark:via-slate-800/30 to-transparent rounded-lg">
           <div className="flex-grow"> </div>
          {allowDelete && onDelete && currentUser && currentUser.id === post.authorId && (
            <div className="relative flex items-center" ref={menuRef}>              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="!text-slate-500 dark:!text-slate-400 hover:!text-slate-700 dark:hover:!text-slate-200 hover:!bg-slate-100/60 dark:hover:!bg-slate-700/40 !p-1.5 -mr-1 -mt-1 rounded-container-fourth transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-slate-300/40 dark:focus:ring-slate-600/40"
                aria-label="Opciones de publicación"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
              >
                <ThreeDotsIcon />
              </Button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-container-fourth shadow-spectra-lg border border-slate-200/60 dark:border-slate-600/40 z-10 py-2">
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 hover:translate-x-1 flex items-center space-x-2 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span>Eliminar Publicación</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p 
            ref={contentRef}
            className={`text-text-primary dark:text-neutral-100 text-sm mb-1 leading-relaxed ${!isExpanded && isTruncated ? 'overflow-hidden' : ''}`}
            style={!isExpanded && isTruncated ? { maxHeight: `${MAX_COLLAPSED_HEIGHT_PX}px` } : {}}
        >
            {post.content}
        </p>
        {isTruncated && (
             <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-xs text-primary-maroon dark:text-accent-gold hover:underline font-medium mb-2 transition-colors duration-200"
            >
                {isExpanded ? 'Ver menos' : 'Ver más'}
            </button>
        )}

        <p className="text-xs text-text-tertiary dark:text-neutral-500 mb-3">Publicación</p>

        {mediaContent}
      </div>

      <div className="px-4 sm:px-5 pb-3 pt-2 border-t border-light-gray-alt/30 dark:border-accent-gold/20 bg-card-bg/20 dark:bg-neutral-800/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-text-tertiary dark:text-neutral-400">
          <span>{new Date(post.timestamp).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
          <div className="flex items-center space-x-3">            <button 
              onClick={() => handleReaction('like')} 
              className={`spectra-post-btn flex items-center space-x-1 group transition-all duration-200 rounded-container-fourth ${
                post.likes.includes(currentUser?.id || '') 
                  ? 'spectra-post-btn active text-primary-maroon dark:text-accent-gold font-medium bg-primary-maroon-light dark:bg-accent-gold-light' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-primary-maroon dark:hover:text-accent-gold hover:bg-primary-maroon-light/30 dark:hover:bg-accent-gold-light/30'
              }`}
              aria-pressed={post.likes.includes(currentUser?.id || '')}
              aria-label={`Me gusta, ${post.likes.length} actualmente`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform duration-200 group-hover:scale-110">
                <path d="M18.9 8.1c0-.9-.7-1.6-1.6-1.6h-4.2c.1-.6.2-1.3.2-2 0-2.2-1.8-4-4-4-.6 0-1.1.5-1.1 1.1v1.4c0 1.1-.4 2.1-1.1 2.9L5.6 7.4c-.2.2-.4.3-.7.3H3.6c-.9 0-1.6.7-1.6 1.6v7.1c0 .9.7 1.6 1.6 1.6h1.3c.3 0 .5.1.7.3l1.5 1.5c.7.7 1.7 1.1 2.9 1.1h4.4c1.3 0 2.4-.9 2.7-2.1l1.4-6.2c.2-.9-.3-1.8-1.2-2.1-.2-.1-.3-.1-.4-.1v-.8z"/>
              </svg>
              <span className="text-xs font-medium">{post.likes.length}</span>
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            title="Confirmar Eliminación"
            message="¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer."
            confirmText="Sí, Eliminar"
            confirmButtonVariant="danger"
        />
      )}
      
      {isMediaModalOpen && mediaModalContentUrl && currentPostForModal && (
        <Modal 
            isOpen={isMediaModalOpen} 
            onClose={closeMediaModal} 
            title={mediaModalType === 'image' ? 'Vista Previa de Imagen' : `Video: ${currentPostForModal.videoFileName || 'Video'}`} 
            size={mediaModalType === 'video' ? "2xl" : "xl"}
        >
            <div className="flex flex-col items-center">
              {mediaModalType === 'image' ? (
                <img 
                    src={mediaModalContentUrl} 
                    alt="Imagen ampliada" 
                    className="max-w-full max-h-[70vh] object-contain rounded-md"
                />
              ) : mediaModalType === 'video' && currentPostForModal && (
                currentPostForModal.transientVideoFile && mediaModalContentUrl.startsWith('blob:') ? (
                    // Current session video with blob URL
                    <video 
                        src={mediaModalContentUrl} 
                        poster={currentPostForModal.mediaUrl} 
                        controls 
                        autoPlay
                        className="max-w-full max-h-[70vh] rounded-md"
                    />
                ) : currentPostForModal.videoDataUrl && mediaModalContentUrl.startsWith('data:video') ? (
                    // Persistent video with Base64 data
                    <video 
                        src={mediaModalContentUrl} 
                        poster={currentPostForModal.mediaUrl} 
                        controls 
                        autoPlay
                        className="max-w-full max-h-[70vh] rounded-md"
                    />
                ) : (
                    // Fallback to thumbnail with information
                    <>
                        <img 
                            src={currentPostForModal.mediaUrl} 
                            alt={`Miniatura de ${currentPostForModal.videoFileName || 'video'}`}
                            className="max-w-full max-h-[60vh] object-contain rounded-md"
                        />
                        <div className="mt-3 text-center">
                            <p className="text-sm text-text-secondary dark:text-neutral-300">
                                {currentPostForModal.videoFileName && <span>Archivo: {currentPostForModal.videoFileName}</span>}
                                {currentPostForModal.videoDuration && <span> ({formatDuration(currentPostForModal.videoDuration)})</span>}
                            </p>
                        </div>
                    </>
                )
              )}
            </div>
        </Modal>
      )}
    </Card>
  );
};


interface PostListProps {
  posts: Post[];
  onReaction: (postId: string, reactionType: 'like' | 'dislike') => void;
  onDeletePost?: (postId: string) => void;
  currentUserId?: string;
  className?: string;
}

export const PostList: React.FC<PostListProps> = ({ posts, onReaction, onDeletePost, currentUserId, className = '' }) => {
  if (!posts.length) {
    return <p className="text-text-secondary dark:text-neutral-400 text-center py-8">No hay publicaciones disponibles.</p>;
  }
  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map(post => (
        <PostCard
            key={post.id}
            post={post}
            onReaction={onReaction}
            onDelete={onDeletePost}
            allowDelete={!!onDeletePost && post.authorId === currentUserId}
        />
      ))}
    </div>
  );
};

// Storage usage indicator component
const StorageIndicator: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    const updateStorageInfo = () => {
      const info = getStorageInfo();
      setStorageInfo(info);
    };

    updateStorageInfo();
    // Update storage info every 30 seconds
    const interval = setInterval(updateStorageInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!storageInfo) return null;
  const handleClearOldData = async () => {
    const clearedCount = await clearOldVideoData();
    if (clearedCount > 0) {
      const info = getStorageInfo();
      setStorageInfo(info);
      alert(`Se liberó espacio eliminando datos de video de ${clearedCount} publicaciones antiguas.`);
    } else {
      alert('No hay datos de video antiguos para eliminar.');
    }
  };

  if (storageInfo.percentage < 75) return null; // Only show when storage is getting full
  return (
    <div className="mb-4 p-3 bg-warning-bg/60 dark:bg-warning-bg-dark/40 border border-warning-text/30 dark:border-warning-text-dark/30 rounded-container-third backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-warning-text dark:text-warning-text-dark">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125S3.75 19.903 3.75 17.625V6.375m16.5 0V9.75c0 2.278-3.694 4.125-8.25 4.125S3.75 12.028 3.75 9.75V6.375" />
          </svg>
          <span className="text-sm font-medium text-warning-text dark:text-warning-text-dark">
            Almacenamiento: {storageInfo.usedMB}MB usados ({storageInfo.percentage.toFixed(1)}%)
          </span>
        </div>
        {storageInfo.percentage > 85 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClearOldData}
            className="spectra-btn-secondary text-xs"
          >
            Liberar Espacio
          </Button>
        )}
      </div>
      <div className="mt-2 w-full bg-light-gray-alt/30 dark:bg-neutral-700/50 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            storageInfo.percentage < 70 ? 'bg-success-text dark:bg-success-text-dark' :
            storageInfo.percentage < 90 ? 'bg-warning-text dark:bg-warning-text-dark' : 'bg-error-text dark:bg-error-text-dark'
          }`}
          style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
        ></div>
      </div>
      {storageInfo.percentage > 90 && (
        <p className="mt-2 text-xs text-warning-text dark:text-warning-text-dark">
          Almacenamiento casi lleno. Los videos nuevos se guardarán solo como miniaturas.
        </p>
      )}
    </div>
  );
};
