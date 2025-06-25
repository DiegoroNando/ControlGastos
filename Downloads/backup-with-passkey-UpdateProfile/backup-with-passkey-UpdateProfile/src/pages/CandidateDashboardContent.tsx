import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useElection } from '../contexts/ElectionContext';
import { useToast } from '../contexts/ToastContext';
import { ProfileCard, EditProfileForm } from '../components/profile/ProfileComponents';
import { CreatePostForm } from '../components/post/PostComponents';
import { CandidateVotingUILayoutCard } from '../components/candidate/CandidateVotingUILayoutCard';
import { PageTitle, Card, LoadingSpinner, Button, Modal, ProgressStepper, ConfirmationModal } from '../components/common/CommonComponents';
import { User, Post, UserRole, EligibilityAnswers } from '../types';
import { 
  getPostsByCandidate, 
  updatePostReactions, 
  deletePost as storageDeletePost,
  addPeerNomination,
  getNominatableUsersInBlock,
  getUserByCurp,
  revokeCandidacy as storageRevokeCandidacy,
  selfNominateAsCandidate
} from '../services/databaseService';
import { useNotifications } from '../hooks/useNotifications';
import { createCandidacyWithdrawalNotification } from '../services/notificationService';
import { notifyOnCandidacyWithdrawal } from '../services/realTimeNotificationManager';
import { DEFAULT_PROFILE_PIC_BASE_URL, DOF_LINK_ELIGIBILITY, ROUTES } from '../constants';
import { generateCandidatePostsUrl } from '../services/routeSecurityService';
import { isoToDateUTC } from '../utils/dateUtils';
import { EligibilityFormModal } from '../components/profile/EligibilityFormModal';

// The sidebar functionality is now managed by CommonComponents.tsx

const POSTS_PER_PAGE = 2;

const formatDateForDisplay = (isoDateString: string | null): string => {
  if (!isoDateString) return 'FECHA INDEFINIDA';
  const dateObj = isoToDateUTC(isoDateString);
  const day = dateObj.toLocaleDateString('es-MX', { day: '2-digit', timeZone: 'UTC' });
  const month = dateObj.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' }).toUpperCase();
  return `${day}-${month}`;
};

const CandidateDashboardContent: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { nominationPeriodInfo, votingPeriodInfo, isLoadingSettings: isLoadingElectionSettings } = useElection();
  const { success, error, info } = useToast();
  const { addNotification } = useNotifications();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [allCandidatePosts, setAllCandidatePosts] = useState<Post[]>([]); // Stores all posts
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const [showNominateModal, setShowNominateModal] = useState(false);
  const [nominatableUsers, setNominatableUsers] = useState<User[]>([]);
  const [isLoadingNominatable, setIsLoadingNominatable] = useState(false);
  const [nominationActionLoading, setNominationActionLoading] = useState<string | boolean>(false);
  const [showRevokeConfirmationModal, setShowRevokeConfirmationModal] = useState(false);
  
  const [currentPostsPage, setCurrentPostsPage] = useState(1);
  
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityActionType, setEligibilityActionType] = useState<'selfNominate' | null>(null);


  const electionProgressStep = useMemo(() => {
    if (votingPeriodInfo.isActive) return 3; 
    if (nominationPeriodInfo.isPast && votingPeriodInfo.isUpcoming) return 2; 
    if (nominationPeriodInfo.isActive) return 1; 
    if (votingPeriodInfo.isPast) return 3; 
    if (nominationPeriodInfo.isPast) return 2; 
    if (nominationPeriodInfo.isUpcoming) return 1; 
    return 1; 
  }, [nominationPeriodInfo, votingPeriodInfo]);

  const stepVisualOverrides = useMemo<Array<'completed' | 'rejected' | null>>(() => {
    if (!currentUser) return [null, null, null];
    const overrides: Array<'completed' | 'rejected' | null> = [null, null, null];

    if (nominationPeriodInfo.isPast) {
      overrides[0] = 'completed';
    }

    const canDetermineApprovalStatus = nominationPeriodInfo.isPast && 
                                     (votingPeriodInfo.isUpcoming || votingPeriodInfo.isActive || votingPeriodInfo.isPast);
    if (canDetermineApprovalStatus) {
      overrides[1] = currentUser.isEligibleForVoting ? 'completed' : 'rejected';
    } else {
      overrides[1] = null; 
    }
    
    if (votingPeriodInfo.isPast) {
      if (overrides[1] === 'completed') { 
        overrides[2] = 'completed';
      } else {
        overrides[2] = null; 
      }
    } else {
       overrides[2] = null; 
    }

    return overrides;
  }, [currentUser, nominationPeriodInfo, votingPeriodInfo]);
  
  const electionStepDetails = useMemo(() => {
    const nomDetails = (
      <>
        <div className={`font-medium ${nominationPeriodInfo.isActive ? 'text-success-text dark:text-green-400' : nominationPeriodInfo.isUpcoming ? 'text-warning-text dark:text-orange-400' : 'text-text-tertiary dark:text-neutral-400'}`}>
            {nominationPeriodInfo.daysRemainingText}
        </div>
        <span className="text-xs text-text-secondary dark:text-neutral-500 block mt-0.5">
            {nominationPeriodInfo.periodText}
        </span>
      </>
    );
    
    const approvalStatusForCandidate = () => {
      if (!currentUser || !currentUser.isRegisteredAsCandidate) {
          return <div className="font-medium text-text-tertiary dark:text-neutral-400">Estado: Información de aprobación no disponible.</div>;
      }

      const canDetermineApprovalStatus = nominationPeriodInfo.isPast && (votingPeriodInfo.isUpcoming || votingPeriodInfo.isActive || votingPeriodInfo.isPast);

      if (canDetermineApprovalStatus) {
          if (currentUser.isEligibleForVoting) {
              return <div className="font-medium text-success-text dark:text-green-400">Estado: ¡Aprobado para la etapa de votaciones!</div>;
          } else {
              return <div className="font-medium text-error-text dark:text-red-400">Estado: No fue aprobado para la etapa de votaciones. <a href={DOF_LINK_ELIGIBILITY} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600 dark:hover:text-red-300">Ver requisitos</a>.</div>;
          }
      } else if (nominationPeriodInfo.isActive) {
          return <div className="font-medium text-warning-text dark:text-orange-400">Estado: Pendiente de revisión. Tu estado de aprobación se mostrará aquí una vez que el periodo de nominación concluya.</div>;
      } else { 
          return <div className="font-medium text-text-tertiary dark:text-neutral-400">Estado: En espera. La revisión de aprobación comenzará después del periodo de nominación.</div>;
      }
    };

    const approvalDetails = (
      <>
        {approvalStatusForCandidate()}
        {votingPeriodInfo.isUpcoming && votingPeriodInfo.startDate && (
          <span className="text-xs text-text-secondary dark:text-neutral-500 block mt-0.5">
            Votación programada: Del {isoToDateUTC(votingPeriodInfo.startDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
            {votingPeriodInfo.endDate ? ` al ${isoToDateUTC(votingPeriodInfo.endDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}` : ''}.
          </span>
        )}
      </>
    );

    const voteDetails = (
      <>
         <div className={`font-medium ${votingPeriodInfo.isActive ? 'text-success-text dark:text-green-400' : votingPeriodInfo.isUpcoming ? 'text-warning-text dark:text-orange-400' : 'text-text-tertiary dark:text-neutral-400'}`}>
            {votingPeriodInfo.daysRemainingText}
        </div>
        <span className="text-xs text-text-secondary dark:text-neutral-500 block mt-0.5">
            {votingPeriodInfo.periodText}
        </span>
      </>
    );
    return [nomDetails, approvalDetails, voteDetails];
  }, [nominationPeriodInfo, votingPeriodInfo, currentUser]);

  const fetchCandidateData = useCallback(async () => {
    if (currentUser && currentUser.isRegisteredAsCandidate) {
      setIsLoadingPosts(true);
      try {
        // For posts fetched from storage, transientVideoFile will be undefined.
        // This is correct as File objects are not stored.
        const posts = await getPostsByCandidate(currentUser.id);
        setAllCandidatePosts(posts);
      } catch (error) {
        console.error('Error fetching candidate posts:', error);
        setAllCandidatePosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);
    useEffect(() => {
    if (currentUser && currentUser.isRegisteredAsCandidate && !currentUser.profilePicUrl) {
      info('¡Importante! Debes subir una foto de perfil para que los usuarios puedan votar por ti.');
    }
  }, [currentUser, info]);

  if (!currentUser || !currentUser.isRegisteredAsCandidate || isLoadingElectionSettings) {
     if (isLoadingElectionSettings || !currentUser) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
     }
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-container-second">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Acceso Denegado</h3>
        <p className="text-red-700 dark:text-red-300">No tienes acceso a este dashboard o no estás registrado como candidato.</p>
      </div>
    );
  }
  const handleProfileSave = (updatedUser: User) => {
    updateCurrentUser(updatedUser);
    setIsEditingProfile(false);
    success('Perfil actualizado con éxito.');
  };
  const handleEligibilitySubmit = async (answers: EligibilityAnswers) => {
    if (!currentUser || !eligibilityActionType) return;
    
    setNominationActionLoading(true);
    setShowEligibilityModal(false);

    let result;
    if (eligibilityActionType === 'selfNominate') { 
      result = await selfNominateAsCandidate(currentUser.curp, answers);
    }    if (result && result.success && result.user) {
      updateCurrentUser(result.user);
      success(result.message);    } else if (result) {
      error(result.message);
    }
    setNominationActionLoading(false);
    setEligibilityActionType(null);
  };
  const handlePostCreated = (newPost: Post) => {
    // newPost from CreatePostForm includes transientVideoFile if it's a video
    setAllCandidatePosts(prevPosts => [newPost, ...prevPosts]);
    success('Publicación creada con éxito.');
    setCurrentPostsPage(1); 
  };
  const handlePostReaction = async (postId: string, reactionType: 'like' | 'dislike') => {
    if (!currentUser) return;
    const updatedPost = await updatePostReactions(postId, currentUser.id, reactionType);
    if (updatedPost) {
      setAllCandidatePosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...updatedPost, transientVideoFile: p.transientVideoFile || updatedPost.transientVideoFile } : p));
    }
  };
  const handleDeletePost = async (postId: string) => {
    await storageDeletePost(postId);
    const newPosts = allCandidatePosts.filter(p => p.id !== postId);
    setAllCandidatePosts(newPosts);

    const totalPagesAfterDelete = Math.ceil(newPosts.length / POSTS_PER_PAGE);
    if (currentPostsPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPostsPage(totalPagesAfterDelete);
    } else if (newPosts.length === 0) {
        setCurrentPostsPage(1);
    }    success('Publicación eliminada.');
  };  const handleInitiateRevokeCandidacy = () => {
    if (votingPeriodInfo.isActive) {
      error('No puedes retirar tu candidatura mientras el periodo de votación está activo.');
      return;
    }
    setShowRevokeConfirmationModal(true);
  };  const executeRevokeCandidacy = async () => {
      if (!currentUser) return;
      setShowRevokeConfirmationModal(false);
      setNominationActionLoading(true); 
      const result = await storageRevokeCandidacy(currentUser.curp);      if (result.success && result.user) {
        updateCurrentUser(result.user);
        success(result.message);
        
        // Add in-app notification for superadministrators
        try {
          const notificationData = createCandidacyWithdrawalNotification(currentUser);
          addNotification(notificationData);
        } catch (notificationError) {
          console.error('Error creating withdrawal notification:', notificationError);
          // Don't fail the withdrawal if notification creation fails
        }

        // Trigger real-time notification refresh for all superadmin users
        try {
          await notifyOnCandidacyWithdrawal(currentUser.curp);
        } catch (realtimeError) {
          console.error('Error triggering real-time notification:', realtimeError);
          // Don't fail the withdrawal if real-time notification fails
        }
      } else {
        error(result.message);
      }
      setNominationActionLoading(false);
  };


  const hasAlreadyNominatedInBlock = useMemo(() => {
    if (!currentUser || !currentUser.nominationsMade) return false;
    return !!currentUser.nominationsMade[currentUser.assignedBlock];
  }, [currentUser]);  const openNominateModal = async () => {
    if (!nominationPeriodInfo.isActive) {
      info('El periodo de nominación para colegas no está activo.');
      return;
    }
    if (hasAlreadyNominatedInBlock) {
      info('Ya has nominado a un colega en tu bloque. Solo se permite una nominación por bloque.');
      return;
    }
    setIsLoadingNominatable(true);
    setShowNominateModal(true);
    
    try {
      if(currentUser) {
        const users = await getNominatableUsersInBlock(currentUser.assignedBlock, currentUser.curp);
        setNominatableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching nominatable users:', error);
      setNominatableUsers([]);
    } finally {
      setIsLoadingNominatable(false);
    }
  };
  const handleNominateUser = async (nomineeCurp: string) => {
    if (!currentUser || !nominationPeriodInfo.isActive) {
      info('El periodo de nominación para colegas no está activo.');
      return;
    }
    setNominationActionLoading(nomineeCurp);
    const result = await addPeerNomination(currentUser.curp, nomineeCurp);
    if (result.success) {
      success(result.message);
      const refreshedCurrentUser = await getUserByCurp(currentUser.curp);
      if (refreshedCurrentUser) updateCurrentUser(refreshedCurrentUser);
      
      if(refreshedCurrentUser) {
        const users = await getNominatableUsersInBlock(refreshedCurrentUser.assignedBlock, refreshedCurrentUser.curp);
        setNominatableUsers(users);
      }
      const updatedHasNominated = !!(refreshedCurrentUser?.nominationsMade && refreshedCurrentUser.nominationsMade[refreshedCurrentUser.assignedBlock]);
      if (updatedHasNominated) {
        setShowNominateModal(false); 
      }    } else {
      error(result.message);
    }
    setNominationActionLoading(false);
  };

  const displayIneligibilityMessage = currentUser.isRegisteredAsCandidate && !currentUser.isEligibleForVoting;

  const getIneligibilityAlertMessage = (): React.ReactNode => {
    let messageParts: React.ReactNode[] = [
        "Tu postulación como candidato está registrada, pero aún no cumples con todos los requisitos para aparecer en la etapa de votación o está pendiente de revisión por el administrador."
    ];
    
    messageParts.push(<br key="br_link_sep_cand"/>); 
    messageParts.push(
        <span key="linkSpan_cand" className="block mt-2">
            Si tienes dudas, consulta los requisitos <a href={DOF_LINK_ELIGIBILITY} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-orange-700 dark:hover:text-orange-200">aquí</a>.
        </span>
    );
    return <>{messageParts}</>;
  };
  
  const votesCastCount = Object.keys(currentUser.votesCast || {}).length;
  
  const totalPostPages = Math.ceil(allCandidatePosts.length / POSTS_PER_PAGE);
  const paginatedPostsForCard = allCandidatePosts.slice(
    (currentPostsPage - 1) * POSTS_PER_PAGE,
    currentPostsPage * POSTS_PER_PAGE
  );

  const handleNextPostsPage = () => {
    setCurrentPostsPage((prev) => Math.min(prev + 1, totalPostPages));
  };

  const handlePrevPostsPage = () => {
    setCurrentPostsPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard de Candidato" subtitle="Gestiona tu perfil, publicaciones y nomina colegas." />
      
      {displayIneligibilityMessage && nominationPeriodInfo.isPast && (votingPeriodInfo.isUpcoming || votingPeriodInfo.isActive || votingPeriodInfo.isPast) && (
         <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-container-second">
           <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-400 mb-2">Estado de Candidatura: No Aprobado / Pendiente</h3>
           <div className="text-orange-700 dark:text-orange-300">
             {getIneligibilityAlertMessage()}
           </div>
         </div>
      )}

      <Card title="Estado de los Periodos Electorales" padding="none">
         <ProgressStepper 
            totalSteps={3} 
            currentStep={electionProgressStep}
            stepTitles={["Nominación", "Aprobación", "Votación"]}
            stepDetails={electionStepDetails}
            stepVisualOverrides={stepVisualOverrides}
          />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
          {isEditingProfile ? (
            <EditProfileForm 
              user={currentUser} 
              onSave={handleProfileSave} 
              onCancel={() => setIsEditingProfile(false)} 
            />
          ) : (
             <div className="w-full"> 
                <ProfileCard 
                    user={currentUser} 
                    onEdit={() => setIsEditingProfile(true)}
                />
            </div>
          )}
           <Card title="Gestión de Candidatura y Nominaciones">
            <div className="space-y-3">                {currentUser.isRegisteredAsCandidate && currentUser.role !== UserRole.SUPERADMIN && (
                    <Button 
                        onClick={handleInitiateRevokeCandidacy} 
                        variant="danger" 
                        isLoading={typeof nominationActionLoading === 'boolean' && nominationActionLoading && showRevokeConfirmationModal} 
                        fullWidth
                        className="py-3 h-auto spectra-btn-danger-enhanced"
                        disabled={!!currentUser.hasRevokedCandidacyPreviously || votingPeriodInfo.isActive}
                        title={
                            currentUser.hasRevokedCandidacyPreviously ? "Ya retiraste tu candidatura previamente." 
                            : votingPeriodInfo.isActive ? "No se puede retirar la candidatura durante el periodo de votación."
                            : "Retirar mi candidatura"
                        }
                    >
                        {currentUser.hasRevokedCandidacyPreviously ? 'Candidatura Retirada Previamente' : 'Retirar mi Candidatura'}
                    </Button>
                )}
                 {currentUser.role !== UserRole.SUPERADMIN && (
                    <Button
                        onClick={openNominateModal}
                        variant="secondary"
                        disabled={!nominationPeriodInfo.isActive && !hasAlreadyNominatedInBlock} 
                        fullWidth
                        title={
                            !nominationPeriodInfo.isActive 
                            ? "El periodo de nominación para colegas no está activo."
                            : hasAlreadyNominatedInBlock 
                            ? "Ya has utilizado tu nominación para este bloque." 
                            : `Nominar Colega de mi Bloque (${currentUser.assignedBlock})`
                        }
                        className="py-3 h-auto spectra-btn-secondary-enhanced"
                    >
                        {hasAlreadyNominatedInBlock ? 'Ya Nominaste en tu Bloque' : `Nominar Colega de mi Bloque`}
                    </Button>
                 )}
                {!nominationPeriodInfo.isDefined && (
                     <p className="text-xs text-warning-text dark:text-orange-400">
                        El periodo de nominación no ha sido definido por el administrador.
                    </p>
                )}
                 {nominationPeriodInfo.isDefined && !nominationPeriodInfo.isActive && (
                    <p className="text-xs text-text-secondary dark:text-neutral-400">
                        El periodo de nominación está {nominationPeriodInfo.isPast ? 'finalizado' : 'próximo'}. Las nominaciones no están disponibles.
                    </p>
                )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">          <Card padding="none">
              <div className="spectra-card bg-gradient-card-light dark:bg-gradient-card-dark w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 flex flex-col items-center text-center">
                      <p className="text-[10px] sm:text-xs uppercase text-text-secondary dark:text-text-secondary-dark tracking-widest mb-1 font-serif">VOTACIÓN PARA</p>
                      <div className="inline-block">
                          <h1 className="font-serif spectra-gradient-text text-4xl sm:text-5xl font-semibold border-b-2 border-light-gray-alt/50 dark:border-accent-gold/30 pb-1 leading-tight">Comité de Ética</h1>
                      </div>
                      <h2 className="font-serif text-text-tertiary dark:text-neutral-500 text-2xl sm:text-3xl font-semibold mt-1 select-none">USICAMM</h2>
                      <p className="font-serif text-text-secondary dark:text-text-secondary-dark text-sm sm:text-base mt-1 tracking-widest font-semibold select-none">2025</p>
                      
                      <div className="mt-2">
                          {(nominationPeriodInfo.isDefined && nominationPeriodInfo.startDate && nominationPeriodInfo.endDate) || (votingPeriodInfo.isDefined && votingPeriodInfo.startDate && votingPeriodInfo.endDate) ? (
                          <p className="text-xs sm:text-sm font-serif font-semibold text-primary-maroon dark:text-accent-gold">
                              {nominationPeriodInfo.isDefined && nominationPeriodInfo.startDate && nominationPeriodInfo.endDate 
                                  ? `Nominación: del ${formatDateForDisplay(nominationPeriodInfo.startDate)} al ${formatDateForDisplay(nominationPeriodInfo.endDate)}`
                                  : votingPeriodInfo.isDefined && votingPeriodInfo.startDate && votingPeriodInfo.endDate 
                                  ? `Votación: del ${formatDateForDisplay(votingPeriodInfo.startDate)} al ${formatDateForDisplay(votingPeriodInfo.endDate)}`
                                  : ""
                              }
                          </p>
                          ) : (
                          <p className="text-xs sm:text-sm font-serif text-text-tertiary dark:text-neutral-500">
                              Periodos electorales no definidos.
                          </p>
                          )}
                      </div>
                  </div>                  <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 md:gap-5 shrink-0 md:mt-8">
                      <Button 
                          disabled={true}
                          className="text-lg font-serif font-normal px-10 md:px-12 py-3 w-full sm:w-auto select-none spectra-btn-primary-enhanced"
                          title="Ya estás registrado como candidato."
                      >
                          Ya Eres Candidato
                      </Button>
                      <Button 
                          onClick={openNominateModal}
                          variant="secondary"
                          disabled={!nominationPeriodInfo.isActive && !hasAlreadyNominatedInBlock}
                          className="text-lg font-serif font-normal px-10 md:px-12 py-3 w-full sm:w-auto select-none spectra-btn-secondary-enhanced"
                          title={
                              !nominationPeriodInfo.isActive 
                              ? "El periodo de nominación para colegas no está activo." 
                              : hasAlreadyNominatedInBlock 
                              ? "Ya has nominado a un colega en tu bloque." 
                              : `Nominar Colega de mi Bloque (${currentUser.assignedBlock})`
                          }
                      >
                          {hasAlreadyNominatedInBlock ? 'Ya Nominaste' : `NOMINAR`}
                      </Button>
                  </div>
              </div>
          </Card>
          
          <CreatePostForm onPostCreated={handlePostCreated} />
          
          {isLoadingPosts ? (
            <div className="flex justify-center items-center min-h-[300px]">
                <LoadingSpinner size="lg" />
            </div>
          ) : (
            <CandidateVotingUILayoutCard
                candidate={currentUser}
                posts={paginatedPostsForCard} // Pass paginated posts
                isVotingActive={votingPeriodInfo.isActive}
                currentPage={currentPostsPage}
                totalPages={totalPostPages}
                onNextPage={handleNextPostsPage}
                onPrevPage={handlePrevPostsPage}
                onPostReaction={handlePostReaction}
                onDeletePost={handleDeletePost}
                currentUserId={currentUser.id}
            />
          )}

           <Card title="Acciones Adicionales">
            <div className="space-y-3">
                <p className="text-text-secondary dark:text-neutral-400">Funciones y enlaces útiles para tu candidatura:</p>
                <ul className="list-disc list-inside text-text-primary dark:text-neutral-300 space-y-1">                    <li>
                        <Link to={generateCandidatePostsUrl(currentUser.id)} className="text-custom-pink hover:underline">
                            Ver mi perfil público (como lo ven otros)
                        </Link>
                    </li>
                    <li>
                        <Link to={ROUTES.VIEW_CANDIDATES} className="text-custom-pink hover:underline">
                            Explorar todos los candidatos
                        </Link>
                    </li>
                    {currentUser.role === UserRole.CANDIDATE && currentUser.isEligibleForVoting && (
                        <li>
                            Estado de mis votos emitidos: has votado en {votesCastCount} bloque(s).
                        </li>
                    )}
                </ul>
            </div>
          </Card>
        </div>
      </div>
      
      {showEligibilityModal && eligibilityActionType && currentUser && (
        <EligibilityFormModal
          isOpen={showEligibilityModal}
          onClose={() => { setShowEligibilityModal(false); setEligibilityActionType(null); }}
          onSubmit={handleEligibilitySubmit}
          antiguedad={currentUser.antiguedad}
        />
      )}

      <Modal isOpen={showNominateModal} onClose={() => setShowNominateModal(false)} title={`Nominar Colega del Bloque ${currentUser.assignedBlock}`} size="lg">
        {isLoadingNominatable ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
          nominatableUsers.length > 0 ? (
            <ul className="space-y-3 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
              {nominatableUsers.map(userToNominate => (
                <li key={userToNominate.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700/50 rounded-container-third hover:bg-gray-100 dark:hover:bg-neutral-600/70">
                  <div className="flex items-center">
                    <img 
                        src={userToNominate.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(userToNominate.nombre + ' ' + userToNominate.apellidoPaterno)}`} 
                        alt={`${userToNominate.nombre} ${userToNominate.apellidoPaterno}`}
                        className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200 dark:border-neutral-600"
                    />
                    <div>
                        <p className="font-medium text-text-primary dark:text-neutral-100">{userToNominate.nombre} {userToNominate.apellidoPaterno} {userToNominate.apellidoMaterno}</p>
                        <p className="text-xs text-text-tertiary dark:text-neutral-400 font-mono">{userToNominate.curp}</p>
                    </div>
                  </div>                  <Button 
                    size="sm" 
                    onClick={() => handleNominateUser(userToNominate.curp)} 
                    disabled={
                        nominationActionLoading === userToNominate.curp || 
                        userToNominate.peerNominations.some(pn => pn.nominatorId === currentUser?.curp) || 
                        !nominationPeriodInfo.isActive ||
                        hasAlreadyNominatedInBlock 
                    }
                    isLoading={nominationActionLoading === userToNominate.curp}
                    className="spectra-btn-primary-enhanced"
                    title={
                        !nominationPeriodInfo.isActive 
                        ? "Periodo de nominación no activo" 
                        : hasAlreadyNominatedInBlock
                        ? "Ya has utilizado tu nominación para este bloque."
                        : userToNominate.peerNominations.some(pn => pn.nominatorId === currentUser?.curp) 
                        ? 'Ya nominado por ti' 
                        : `Nominar a ${userToNominate.nombre}`
                    }
                  >
                    {userToNominate.peerNominations.some(pn => pn.nominatorId === currentUser?.curp) ? 'Nominado' : 'Nominar'}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-text-secondary dark:text-neutral-400 py-6">
                {hasAlreadyNominatedInBlock 
                    ? "Ya has nominado a un colega en tu bloque."
                    : "No hay usuarios elegibles para nominar en tu bloque en este momento (asegúrate que tengan antigüedad registrada, no sean ya candidatos y hayan iniciado sesión)."
                }
            </p>
          )
        )}
      </Modal>

      {showRevokeConfirmationModal && currentUser && (            <ConfirmationModal
                isOpen={showRevokeConfirmationModal}
                onClose={() => setShowRevokeConfirmationModal(false)}
                onConfirm={executeRevokeCandidacy}
                title="Confirmar Retiro de Candidatura"
                message={
                    <>
                        <p>Estás a punto de retirar tu candidatura. <strong>Esta acción es irreversible para el proceso electoral actual.</strong></p>
                        <p className="mt-2">No podrás volver a postularte como candidato ni ser nominado por otros en este ciclo electoral.</p>
                        <p className="mt-2">Sin embargo, podrás seguir votando (si cumples los requisitos) y nominar a un colega si aún no lo has hecho y el periodo de nominación está activo.</p>
                        
                        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-container-third">
                            <p className="font-semibold text-orange-800 dark:text-orange-400">📋 Proceso Administrativo Requerido:</p>
                            <p className="mt-1 text-orange-700 dark:text-orange-300 text-sm">
                                Después de confirmar el retiro, <strong>deberás enviar un oficio formal solicitando tu declinación a la presidencia dentro de los próximos 3 días hábiles</strong> para completar oficialmente el proceso.
                            </p>
                        </div>
                        
                        <p className="mt-4 font-semibold">¿Estás seguro de que deseas continuar?</p>
                    </>
                }
                confirmText="Sí, Retirar Candidatura"
                cancelText="No, Mantener Candidatura"
                confirmButtonVariant="danger"
                isLoading={typeof nominationActionLoading === 'boolean' && nominationActionLoading}
            />
        )}
    </div>
  );
};

export default CandidateDashboardContent;
