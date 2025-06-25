import React, { useState, useEffect } from 'react';
import { DEFAULT_PROFILE_PIC_BASE_URL } from '../../constants';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  defaultUserName?: string;
  placeholderColor?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente para optimizar la carga de imágenes
 * - Carga perezosa para mejor rendimiento
 * - Manejo de errores con imagen predeterminada
 * - Imagen de marcador de posición durante la carga
 * - Soporte para UI-Avatars como fallback
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  defaultUserName,
  placeholderColor = '#f5f5f7',
  width,
  height,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src);

  useEffect(() => {
    // Resetear estado cuando cambia la fuente
    setIsLoaded(false);
    setError(false);
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    setError(true);
    
    // Si hay un nombre de usuario predeterminado, usar UI-Avatars como respaldo
    if (defaultUserName) {
      setImgSrc(`${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(defaultUserName)}`);
    }
    
    if (onError) onError();
  };

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Estilo para el placeholder (se muestra durante la carga)
  const placeholderStyle: React.CSSProperties = {
    backgroundColor: placeholderColor,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
  };

  return (
    <div className="relative" style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 animate-pulse rounded-inherit"
          style={placeholderStyle}
        />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : loading}
        width={width}
        height={height}
        draggable={false}
      />
    </div>
  );
};

export default OptimizedImage;
