import React, { useState } from 'react';
import { OptimizedImage } from '../common/OptimizedImage';
import { DEFAULT_PROFILE_PIC_BASE_URL } from '../../constants';
import type { User } from '../../types';
import { globalCache } from '../../services/cacheService';

interface CandidateProfileImageProps {
  candidate: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  avatarClassName?: string;
  priority?: boolean;
  showBadge?: boolean;
  badgeClassName?: string;
  onClick?: () => void;
}

/**
 * Componente optimizado para renderizar imágenes de perfil de candidatos
 * - Utiliza caché para mejorar rendimiento
 * - Carga perezosa inteligente según visibilidad
 * - Fallback a UI-Avatars si no hay imagen
 * - Tamaños predefinidos
 */
const OptimizedCandidateProfileImage: React.FC<CandidateProfileImageProps> = ({
  candidate,
  size = 'md',
  className = '',
  avatarClassName = '',
  priority = false,
  showBadge = false,
  badgeClassName = '',
  onClick
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Dimensiones según el tamaño
  const dimensions = {
    sm: { width: 40, height: 40 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
    xl: { width: 128, height: 128 }
  };
  
  // Clases de tamaño para el contenedor
  const containerSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };
  
  // Clases para el badge según el tamaño
  const badgeSizeClasses = {
    sm: 'w-3.5 h-3.5 border border-white',
    md: 'w-5 h-5 border-2 border-white',
    lg: 'w-6 h-6 border-2 border-white',
    xl: 'w-7 h-7 border-2 border-white'
  };
  
  // Nombre del candidato para la imagen de fallback
  const candidateName = `${candidate.nombre} ${candidate.apellidoPaterno}`;
  
  // Generar la URL de la imagen o usar la de caché
  const getImageUrl = () => {
    if (!candidate.profilePicUrl) {
      return `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(candidateName)}`;
    }
    
    // Intentar obtener de caché
    const cacheKey = `profile_pic_${candidate.id}`;
    const cachedUrl = globalCache.get<string>(cacheKey);
    
    if (cachedUrl) {
      return cachedUrl;
    }
    
    // Si no está en caché, guardarla
    globalCache.set(cacheKey, candidate.profilePicUrl, 5 * 60 * 1000); // 5 minutos
    return candidate.profilePicUrl;
  };
  
  const isEligible = candidate.isEligibleForVoting && candidate.isRegisteredAsCandidate;
  
  return (
    <div 
      className={`${containerSizeClasses[size]} relative rounded-full overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <OptimizedImage
        src={getImageUrl()}
        alt={`Perfil de ${candidateName}`}
        defaultUserName={candidateName}
        className={`object-cover w-full h-full ${avatarClassName}`}
        width={dimensions[size].width}
        height={dimensions[size].height}
        priority={priority}
        onLoad={() => setIsImageLoaded(true)}
      />
        {showBadge && isImageLoaded && (
        <div 
          className={`absolute bottom-0 right-0 ${badgeSizeClasses[size]} rounded-full ${
            isEligible 
              ? 'bg-success-text dark:bg-green-500' 
              : 'bg-gray-300 dark:bg-neutral-600'
          } ${badgeClassName} flex items-center justify-center shadow-sm`} 
          title={isEligible ? 'Candidato elegible para votación' : 'No elegible para votación'}
        >
          {isEligible ? (
            // Ícono de candidato elegible - check con persona
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="white" 
              className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
            >
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.498 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          ) : (
            // Ícono para no elegible - X
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="white" 
              className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
            >
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedCandidateProfileImage;
