
import React, { useState, useRef, useEffect } from 'react';
import { User, Post } from '../../types';
import { Button, Modal } from '../common/CommonComponents'; 
import { DEFAULT_PROFILE_PIC_BASE_URL } from '../../constants';

interface CandidateVotingUILayoutCardProps {
  candidate: User;
  posts: Post[];
  isVotingActive: boolean;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onPostReaction: (postId: string, reactionType: 'like' | 'dislike') => void;
  onDeletePost?: (postId: string) => void; 
  currentUserId?: string; 
}

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CommentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443h2.884M7.5 9h9M7.5 12h9m-9 3h2.25m-2.25 3h13.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6.75v8.25a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EllipsisIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#4b4b4b] dark:text-neutral-300 cursor-pointer">
    <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
  </svg>
);

const GalleryIconPlaceholder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 dark:text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const VideoIconLarge = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 dark:text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
    </svg>
);


export const CandidateVotingUILayoutCard: React.FC<CandidateVotingUILayoutCardProps> = ({
  candidate,
  posts,
  isVotingActive,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  onPostReaction,
  onDeletePost,
  currentUserId
}) => {
  const profilePic = candidate.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(candidate.nombre + ' ' + candidate.apellidoPaterno)}`;
  const candidateFullName = `${candidate.nombre} ${candidate.apellidoPaterno} ${candidate.apellidoMaterno}`;
  const candidatePuesto = candidate.puesto || 'Puesto no especificado';
  const candidateBlockAbbreviation = candidate.assignedBlock.split(' - ')[0]; 

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalContentUrl, setMediaModalContentUrl] = useState<string | null>(null);
  const [mediaModalType, setMediaModalType] = useState<'image' | 'video' | null>(null);
  const [currentPostForModal, setCurrentPostForModal] = useState<Post | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);


  let ageDisplay = '';
  if (candidate.fechaNacimiento) {
    const birthDate = new Date(candidate.fechaNacimiento + 'T00:00:00Z'); 
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    ageDisplay = `${Math.abs(ageDate.getUTCFullYear() - 1970)} años`;
  }
    const openMediaModal = (post: Post) => {
    if (!post.mediaUrl) return;
    
    setCurrentPostForModal(post);
    setMediaModalType(post.mediaType || 'image');

    if (post.mediaType === 'video') {
        if (post.transientVideoFile) {
            // Use the current session video file if available
            if (videoObjectUrlRef.current) {
                URL.revokeObjectURL(videoObjectUrlRef.current);
            }
            videoObjectUrlRef.current = URL.createObjectURL(post.transientVideoFile);
            setMediaModalContentUrl(videoObjectUrlRef.current);
        } else if (post.videoDataUrl) {
            // Use the stored video Base64 data for persistent playback
            setMediaModalContentUrl(post.videoDataUrl);
        } else {
            // Fallback to thumbnail only
            setMediaModalContentUrl(post.mediaUrl);
        }
    } else {
        setMediaModalContentUrl(post.mediaUrl);
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

  return (
    <>    <div className="spectra-card bg-gradient-card-light dark:bg-gradient-card-dark rounded-xl w-full flex flex-col md:flex-row p-6 md:p-10 gap-6 shadow-spectra-lg">
      {/* Left side - Takes 60% width on md screens and up */}
      <section className="flex-1 md:w-3/5 flex flex-col gap-6">
        <span className="text-[13px] text-text-secondary dark:text-text-secondary-dark font-normal">
          Perfil
        </span>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <img 
            alt={`Foto de perfil de ${candidateFullName}`} 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover bg-light-gray/50 dark:bg-neutral-700 border-2 border-white/50 dark:border-neutral-600 shadow-spectra-md" 
            src={profilePic}
          />
          <div className="text-text-primary dark:text-neutral-300 flex flex-col gap-1 text-center md:text-left">
            <h2 className="font-extrabold text-xl md:text-2xl leading-tight spectra-gradient-text">
              {candidateFullName}
            </h2>
            <p className="text-lg font-normal leading-tight text-text-secondary dark:text-text-secondary-dark">
              {candidatePuesto}
            </p>
            {ageDisplay && (
              <p className="text-base font-normal leading-tight text-text-secondary dark:text-neutral-400">
                {ageDisplay}
              </p>
            )}
            <p className="text-sm font-normal leading-snug max-w-[280px] mt-1 text-text-tertiary dark:text-neutral-500">
              {candidate.areaDepartamentoDireccion}
              <br/>
              {candidate.assignedBlock}
            </p>
          </div>
        </div>        <Button
          variant="primary"
          className={`text-white font-extrabold text-xl rounded-full py-3 w-full max-w-md mx-auto md:mx-0 spectra-btn-primary-enhanced
            ${!isVotingActive ? 'opacity-60 cursor-not-allowed' : 'spectra-cta-pulse'}`}
          disabled={true} 
          title={isVotingActive ? "Votar (función deshabilitada para auto-voto)" : "El periodo de votación no está activo."}
        >
          Votar
        </Button>
        <p className="text-[11px] text-text-secondary dark:text-neutral-400 max-w-md mx-auto md:mx-0 leading-relaxed text-justify whitespace-pre-line">
          {candidate.descripcionAdicional || 'El candidato no ha proporcionado una descripción adicional.'}
        </p>
      </section>

      {/* Right side - Takes 40% width on md screens and up */}
      <section className="spectra-card bg-light-gray/20 dark:bg-neutral-700/30 backdrop-blur-md rounded-xl p-4 md:p-6 w-full md:w-2/5 flex flex-col gap-4">
        <h3 className="font-extrabold text-2xl text-text-primary dark:text-accent-gold">
          {candidateBlockAbbreviation}
        </h3>
        
        <div className="flex-grow space-y-3 overflow-y-auto scrollbar-thin max-h-[500px] pr-1 -mr-2">
          {posts.length > 0 ? (
             posts.map(post => {
                let mediaDisplayContent = null;
                if (post.mediaUrl) {
                    const isActualVideoPlaceholder = post.mediaType === 'video' && post.mediaUrl?.startsWith('video_placeholder:');
                    const canDisplayMedia = post.mediaType === 'image' || (post.mediaType === 'video' && !isActualVideoPlaceholder);

                    if (canDisplayMedia) {
                         mediaDisplayContent = (
                            <button 
                                type="button" 
                                onClick={() => openMediaModal(post)} 
                                className="relative rounded-md overflow-hidden bg-[#1f1f1f] dark:bg-black w-full aspect-video flex items-center justify-center group focus:outline-none focus:ring-1 focus:ring-custom-pink dark:focus:ring-custom-gold focus:ring-offset-1 dark:focus:ring-offset-neutral-700"
                                aria-label={`Abrir ${post.mediaType === 'image' ? 'imagen' : 'miniatura de video'} de la publicación`}
                            >                               <img 
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
                                <div className="placeholder-icon hidden items-center justify-center w-full h-full absolute inset-0 bg-[#1f1f1f] dark:bg-black">
                                    {post.mediaType === 'image' ? <GalleryIconPlaceholder /> : <VideoIconLarge />}
                                    <div className="absolute bottom-2 left-2 right-2 text-center">
                                        <p className="text-xs text-white/80 truncate">
                                            {post.mediaType === 'image' ? 'Imagen no disponible' : `Video: ${post.videoFileName || 'Sin nombre'}`}
                                        </p>
                                        {post.mediaType === 'video' && post.videoDuration && (
                                            <p className="text-[10px] text-white/60">
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
                        mediaDisplayContent = (
                            <div className="relative rounded-md overflow-hidden bg-[#1f1f1f] dark:bg-black w-full aspect-video flex flex-col items-center justify-center p-2">
                                <VideoIconLarge />
                                <p className="text-xs text-white/80 mt-2 text-center truncate w-full px-1" title={`${fileName} (${fileType})`}>
                                    {fileName}
                                </p>
                                <p className="text-[10px] text-white/60">({fileType})</p>
                            </div>
                        );
                    }
                }

                return (                 <article key={post.id} className="spectra-card bg-card-bg/60 dark:bg-neutral-800/80 rounded-container-second p-3 flex flex-col gap-2 text-[10px] text-text-primary dark:text-neutral-300 shadow-spectra-sm">
                    <header className="flex justify-between items-start">
                        <div>
                            <p className="font-normal text-sm truncate max-w-[200px] sm:max-w-xs">
                                {post.content.substring(0,50) + (post.content.length > 50 ? "..." : "")}
                            </p>
                            <p className="text-[9px] text-text-tertiary dark:text-neutral-500 font-light">
                                Publicación
                            </p>
                        </div>
                         {onDeletePost && currentUserId === post.authorId && (
                            <button onClick={() => onDeletePost(post.id)} title="Eliminar publicación"> <EllipsisIcon /> </button>
                         )}
                    </header>
                    {mediaDisplayContent}
                    <p className="text-[10px] leading-tight text-text-secondary dark:text-neutral-400 whitespace-pre-line">
                        {post.content}
                    </p>
                    <footer className="flex justify-between items-center text-text-tertiary dark:text-neutral-500 text-[9px] pt-1 border-t border-light-gray/20 dark:border-neutral-700 mt-1">
                        <div className="flex items-center gap-1">
                            <ClockIcon />
                            <span>{new Date(post.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => onPostReaction(post.id, 'like')}
                             className={`flex items-center gap-1 ${post.likes.includes(currentUserId || '') ? 'text-primary-maroon dark:text-accent-gold' : 'hover:text-primary-maroon dark:hover:text-accent-gold'}`}
                            >
                                <CommentIcon />
                                <span>{post.likes?.length || 0}</span>
                            </button>
                        </div>
                    </footer>
                </article>
                );
             })
          ) : (
            <p className="text-center text-sm text-text-secondary dark:text-neutral-400 py-10">
              No hay publicaciones disponibles.
            </p>
          )}
        </div>
          {posts.length > 0 && totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">            <Button 
                onClick={onPrevPage} 
                disabled={currentPage === 1} 
                variant="secondary" 
                size="sm"
                className="text-[12px] font-normal rounded-md py-1.5 px-4 h-auto spectra-btn-secondary-enhanced"
            >
              Anterior
            </Button>
            <span className="text-xs text-text-secondary dark:text-neutral-400">
              Pág {currentPage} de {totalPages}
            </span>
            <Button 
                onClick={onNextPage} 
                disabled={currentPage === totalPages} 
                variant="secondary" 
                size="sm"
                className="text-[12px] font-normal rounded-md py-1.5 px-4 h-auto spectra-btn-secondary-enhanced"
            >
              Siguiente
            </Button>
          </div>
        )}
      </section>
    </div>
    {isMediaModalOpen && mediaModalContentUrl && currentPostForModal && (
        <Modal 
            isOpen={isMediaModalOpen} 
            onClose={closeMediaModal} 
            title={mediaModalType === 'image' ? 'Vista Previa de Imagen' : `Video: ${currentPostForModal.videoFileName || 'Video'}`} 
            size={mediaModalType === 'video' ? "2xl" : "xl"}
        >
            <div className="flex flex-col items-center">              {mediaModalType === 'image' ? (
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
    </>
  );
};
