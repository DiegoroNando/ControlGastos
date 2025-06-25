import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useElection } from '../contexts/ElectionContext'; 
import { ProfileCard, EditProfileForm } from '../components/profile/ProfileComponents';
import { EligibilityFormModal } from '../components/profile/EligibilityFormModal';
import { PageTitle, Card, Alert, Button, Modal, LoadingSpinner, ProgressStepper } from '../components/common/CommonComponents';
import { useToast } from '../contexts/ToastContext';
import { User, UserRole, ALL_CANDIDATE_BLOCKS, EligibilityAnswers } from '../types';
import { 
  selfNominateAsCandidate, 
  addPeerNomination,
  getNominatableUsersInBlock,
  getUserByCurp,
  getUsers
} from '../services/databaseService';
import { DEFAULT_PROFILE_PIC_BASE_URL, ROUTES, DOF_LINK_ELIGIBILITY } from '../constants';
import { generateCandidatePostsUrl } from '../services/routeSecurityService';
import { isoToDateUTC } from '../utils/dateUtils';


const UserDashboardContent: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { success, error, warning, info } = useToast();
  const { nominationPeriodInfo, votingPeriodInfo, isLoadingSettings: isLoadingElectionSettings } = useElection();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [nominatableUsers, setNominatableUsers] = useState<User[]>([]);
  const [isLoadingNominatable, setIsLoadingNominatable] = useState(false);  const [nominationActionLoading, setNominationActionLoading] = useState<string | boolean>(false); 

  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityActionType, setEligibilityActionType] = useState<'selfNominate' | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingNominees, setIsLoadingNominees] = useState(true);
  const nomineesScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Fetch all users for the nominees list
    const fetchUsers = async () => {
      setIsLoadingNominees(true);
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        setAllUsers([]);
      } finally {
        setIsLoadingNominees(false);
      }
    };      fetchUsers();
  }, [currentUser?.curp]);

  const nominatedCandidates = useMemo(() => {
    return allUsers.filter(user =>
      user.isRegisteredAsCandidate &&
      user.isEligibleForVoting && // Only show fully eligible candidates
      user.role === UserRole.CANDIDATE 
    ).sort((a,b) => `${a.nombre} ${a.apellidoPaterno}`.localeCompare(`${b.nombre} ${b.apellidoPaterno}`));
  }, [allUsers]);

  const scrollNominees = (direction: 'left' | 'right') => {
    if (nomineesScrollRef.current) {
      const scrollAmount = nomineesScrollRef.current.clientWidth * 0.75; // Scroll by 75% of visible width
      nomineesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };


  const electionProgressStep = useMemo(() => {
    if (votingPeriodInfo.isActive) return 3; // Voting takes precedence if active
    // Approval phase: Nomination is past, and voting is upcoming (not yet active, not past)
    if (nominationPeriodInfo.isPast && votingPeriodInfo.isUpcoming) return 2; 
    if (nominationPeriodInfo.isActive) return 1; // Nomination active
    
    // Fallback conditions for display when no primary phase is "active"
    if (votingPeriodInfo.isPast) return 3; // All done, show voting as last completed
    if (nominationPeriodInfo.isPast) return 2; // Nom past, voting not started or defined, show approval as relevant
    if (nominationPeriodInfo.isUpcoming) return 1; // Nom upcoming
    
    return 1; // Default (e.g., periods not defined)
  }, [nominationPeriodInfo, votingPeriodInfo]);

  const stepVisualOverrides = useMemo<Array<'completed' | 'rejected' | null>>(() => {
    const overrides: Array<'completed' | 'rejected' | null> = [null, null, null];
    if (nominationPeriodInfo.isPast) {
      overrides[0] = 'completed';
    }
    // For users, "Aprobación" step (index 1) doesn't get a 'completed' or 'rejected' override.
    // Its visual state is determined by electionProgressStep (active/pending).
    if (votingPeriodInfo.isPast) {
      overrides[2] = 'completed';
    }
    return overrides;
  }, [nominationPeriodInfo, votingPeriodInfo]);
  
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

    const approvalDetails = (
      <>
        <div className={`font-medium text-warning-text dark:text-orange-400`}>
          Aprobación de Candidatos
        </div>
         <span className="text-xs text-text-secondary dark:text-neutral-500 block mt-0.5">
          {nominationPeriodInfo.isPast && (votingPeriodInfo.isUpcoming || votingPeriodInfo.isActive)
            ? "Los administradores están revisando las postulaciones."
            : nominationPeriodInfo.isActive
            ? "Este paso se activará después del periodo de nominación."
            : "Esperando inicio del periodo de nominación."
          }
        </span>
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
  }, [nominationPeriodInfo, votingPeriodInfo]);


  if (!currentUser || isLoadingElectionSettings) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  }
  const handleProfileSave = (updatedUser: User) => {
    updateCurrentUser(updatedUser);
    setIsEditingProfile(false);
    success('Perfil actualizado con éxito.');
  };  const openEligibilityModal = (actionType: 'selfNominate') => {
    if (!currentUser) return;
    if (currentUser.hasRevokedCandidacyPreviously) {
        error('Ya no puedes postularte como candidato después de haber retirado tu candidatura previamente en este proceso electoral.');
        return;
    }
    if (!nominationPeriodInfo.isActive) {
      warning('El periodo de nominación no está activo.');
      return;
    }
    if (currentUser.role !== UserRole.SUPERADMIN && (currentUser.antiguedad === undefined || currentUser.antiguedad < 12)) {
        error('Para postularte, debes tener al menos 12 meses de antigüedad en el servicio público (registrada en tu perfil).');
        setIsEditingProfile(true); // Prompt to edit profile
        return;
    }
    setEligibilityActionType(actionType);
    setShowEligibilityModal(true);
  };const handleEligibilitySubmit = async (answers: EligibilityAnswers) => {
    if (!currentUser || !eligibilityActionType) return;
    
    setNominationActionLoading(true);
    setShowEligibilityModal(false);

    let result;
    if (eligibilityActionType === 'selfNominate') {
      result = await selfNominateAsCandidate(currentUser.curp, answers);
    }    if (result && result.success && result.user) {
      updateCurrentUser(result.user);
      success(result.message);
    } else if (result) {
      error(result.message);
    }
    setNominationActionLoading(false);
    setEligibilityActionType(null);
  };

  const hasAlreadyNominatedInBlock = !!(currentUser.nominationsMade && currentUser.nominationsMade[currentUser.assignedBlock]);  const openNominateColleagueModal = async () => {
    if (!nominationPeriodInfo.isActive) {
      warning('El periodo de nominación para colegas no está activo.');
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
  };  const handleNominateUser = async (nomineeCurp: string) => {
    if (!currentUser || !nominationPeriodInfo.isActive) {
      warning('El periodo de nominación para colegas no está activo.');
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
      // Check if the user has now made a nomination in their block after this action
      const updatedHasNominated = !!(refreshedCurrentUser?.nominationsMade && refreshedCurrentUser.nominationsMade[refreshedCurrentUser.assignedBlock]);      if (updatedHasNominated) {
        setShowNominateModal(false); 
      }    } else {
      error(result.message);
    }
    setNominationActionLoading(false);
  };
  
  const votesCastCount = Object.keys(currentUser.votesCast || {}).length;
  const totalBlocksToVoteIn = ALL_CANDIDATE_BLOCKS.length;

  const displayIneligibilityMessage = currentUser.isRegisteredAsCandidate && !currentUser.isEligibleForVoting;

  const getIneligibilityAlertMessage = (): React.ReactNode => {
    let messageParts: React.ReactNode[] = [
        "Tu postulación como candidato está registrada, pero aún no cumples con todos los requisitos para aparecer en la etapa de votación o está pendiente de revisión por el administrador."
    ];
    
    messageParts.push(<br key="br_link_sep"/>); // Add a line break before the link
    messageParts.push(
        <span key="linkSpan" className="block mt-2">
            Si tienes dudas, consulta los requisitos <a href={DOF_LINK_ELIGIBILITY} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-orange-700 dark:hover:text-orange-200">aquí</a>.
        </span>
    );
    return <>{messageParts}</>;
  };
    const formatDateForDisplay = (isoDateString: string | null): string => {
    if (!isoDateString) return 'FECHA INDEFINIDA';
    const dateObj = isoToDateUTC(isoDateString);
    const day = dateObj.toLocaleDateString('es-MX', { day: '2-digit', timeZone: 'UTC' });
    const month = dateObj.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' }).toUpperCase();
    return `${day}-${month}`;
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard del Usuario" subtitle="Gestiona tu perfil, nomina candidatos y emite tus votos." />
      
      {displayIneligibilityMessage && (
         <Alert 
            type="warning" 
            title="Revisión de Candidatura Pendiente o No Aprobada"
            message={getIneligibilityAlertMessage()}
            className="mb-6"
          />
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
                 <ProfileCard user={currentUser} onEdit={() => setIsEditingProfile(true)} />
            </div>
          )}
        </div>        <div className="lg:col-span-2 space-y-8">
            <Card padding="none">
                <div className="spectra-card bg-gradient-card-light dark:bg-gradient-card-dark w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Left side: Main text content */}
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
                    </div>

                    {/* Right side: Buttons */}                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 md:gap-5 shrink-0 md:mt-8">
                        <Button 
                            onClick={() => openEligibilityModal('selfNominate')}
                            isLoading={nominationActionLoading === true && eligibilityActionType === 'selfNominate'} 
                            disabled={!nominationPeriodInfo.isActive || (typeof nominationActionLoading === 'boolean' && nominationActionLoading) || !!currentUser.hasRevokedCandidacyPreviously}
                            className="text-lg font-serif font-normal px-10 md:px-12 py-3 w-full sm:w-auto select-none spectra-btn-primary-enhanced spectra-cta-pulse"
                            title={
                                !nominationPeriodInfo.isActive ? "El periodo de nominación no está activo" 
                                : !!currentUser.hasRevokedCandidacyPreviously ? "No puedes volver a postularte tras retirar tu candidatura." 
                                : `Postularme para ${currentUser.assignedBlock}`
                            }
                        >
                            NOMINARME
                        </Button>
                        <Button 
                            onClick={openNominateColleagueModal}
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
            
            {/* NOMINADOS CARD */}
            <Card title="NOMINADOS">
                {isLoadingNominees ? (
                    <div className="flex justify-center items-center h-40">
                        <LoadingSpinner />
                    </div>
                ) : nominatedCandidates.length > 0 ? (
                    <div className="relative">
                        <div
                            ref={nomineesScrollRef}
                            className="flex overflow-x-auto py-4 space-x-6 no-scrollbar" 
                        >
                            {nominatedCandidates.map(candidate => (
                                <div key={candidate.id} className="flex-shrink-0 w-32 text-center space-y-3">
                                    <img
                                        src={candidate.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(candidate.nombre + ' ' + candidate.apellidoPaterno)}`}
                                        alt={`${candidate.nombre} ${candidate.apellidoPaterno}`}
                                        className="w-24 h-24 mx-auto rounded-full object-cover border-2 border-gray-300 dark:border-neutral-600 shadow-md"
                                    />                                    <Link to={generateCandidatePostsUrl(candidate.id)} className="block">
                                        <Button variant="secondary" size="sm" fullWidth className="!text-xs !py-1.5 h-auto leading-snug spectra-btn-secondary-enhanced">
                                            Ver perfil
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {nominatedCandidates.length > 4 && ( // Heuristic to show arrows if content might overflow
                            <>                                <button
                                    onClick={() => scrollNominees('left')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-card-bg/80 dark:bg-neutral-700/80 hover:bg-card-bg dark:hover:bg-neutral-700 rounded-full shadow-spectra-md transition-all opacity-80 hover:opacity-100 focus:outline-none apple-focus-ring spectra-icon-btn"
                                    aria-label="Anterior nominado"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-text-primary dark:text-neutral-200">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => scrollNominees('right')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-card-bg/80 dark:bg-neutral-700/80 hover:bg-card-bg dark:hover:bg-neutral-700 rounded-full shadow-spectra-md transition-all opacity-80 hover:opacity-100 focus:outline-none apple-focus-ring spectra-icon-btn"
                                    aria-label="Siguiente nominado"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-text-primary dark:text-neutral-200">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-text-secondary dark:text-neutral-400 py-10">
                        Actualmente no hay nominados elegibles para mostrar.
                    </p>
                )}
            </Card>


            <Card title="Acciones Adicionales">
                <div className="space-y-3 text-center">
                    <p className="text-text-secondary dark:text-neutral-400">Desde aquí puedes acceder a las principales funciones:</p>
                    <ul className="list-disc list-inside text-text-primary dark:text-neutral-300 space-y-1">
                        <li>Ver la lista de <Link to={ROUTES.VIEW_CANDIDATES} className="text-custom-pink hover:underline">Candidatos</Link> y emitir tu voto (si el periodo de votación está activo).</li>
                        <li>Actualizar tu información de perfil (botón "Editar Perfil" arriba).</li>
                    </ul>
                </div>
                {votesCastCount > 0 && currentUser.role !== UserRole.SUPERADMIN && (
                    <Alert 
                        type="success" 
                        title="Voto(s) Emitido(s)" 
                        message={`Gracias por participar. Has votado en ${votesCastCount} de ${totalBlocksToVoteIn} bloque(s).`} 
                        className="mt-4" />
                )}
                {votesCastCount < totalBlocksToVoteIn && currentUser.role !== UserRole.CANDIDATE && currentUser.role !== UserRole.SUPERADMIN && (
                    <Alert 
                        type="info" 
                        title="Votación" 
                        message={
                            votingPeriodInfo.isActive 
                            ? `El periodo de votación está activo. Aún puedes votar en ${totalBlocksToVoteIn - votesCastCount} bloque(s) restante(s).` 
                            : votingPeriodInfo.isUpcoming 
                            ? "El periodo de votación es próximo. Prepárate para votar." 
                            : votingPeriodInfo.isPast 
                            ? "El periodo de votación ha finalizado." 
                            : "El periodo de votación no está definido."
                        } 
                        className="mt-4" />
                )}
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
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleNominateUser(userToNominate.curp)} 
                    disabled={
                        nominationActionLoading === userToNominate.curp || 
                        userToNominate.peerNominations.some(pn => pn.nominatorId === currentUser?.curp) || 
                        !nominationPeriodInfo.isActive ||
                        hasAlreadyNominatedInBlock 
                    }
                    isLoading={nominationActionLoading === userToNominate.curp}
                    title={
                        !nominationPeriodInfo.isActive 
                        ? "Periodo de nominación no activo" 
                        : hasAlreadyNominatedInBlock
                        ? "Ya has utilizado tu nominación para este bloque."
                        : userToNominate.peerNominations.some(pn => pn.nominatorId === currentUser?.curp) 
                        ? 'Ya nominado por ti' 
                        : `Nominar a ${userToNominate.nombre}`
                    }
                    className="!py-2 h-auto"
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
                    : "No hay usuarios elegibles para nominar en tu bloque en este momento (asegúrate que tengan antigüedad requerida, no sean ya candidatos, hayan iniciado sesión y no hayan sido nominados por ti)."
                }
            </p>
          )
        )}
      </Modal>
    </div>
  );
};

export default UserDashboardContent;
