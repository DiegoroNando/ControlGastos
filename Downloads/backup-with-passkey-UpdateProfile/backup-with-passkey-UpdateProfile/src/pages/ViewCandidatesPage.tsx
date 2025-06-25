
import React, { useState, useEffect, useMemo } from 'react';
import { CandidateCard } from '../components/candidate/CandidateComponents';
import { PageTitle, LoadingSpinner, Input, Select, Card, ConfirmationModal } from '../components/common/CommonComponents';
import { User, CandidateBlock, ALL_CANDIDATE_BLOCKS, UserRole, AllBlockSettings } from '../types';
import { getUsers, addVote, getBlockSettings } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';
import { useElection } from '../contexts/ElectionContext';
import { useToast } from '../contexts/ToastContext';

const ViewCandidatesPage: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { votingPeriodInfo, isLoadingSettings: isLoadingElectionSettings } = useElection();
  const { success, error: showError } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState<CandidateBlock | ''>('');
  
  const [selectedCandidateToVote, setSelectedCandidateToVote] = useState<User | null>(null);
  const [showConfirmVoteModal, setShowConfirmVoteModal] = useState(false);
  const [blockSettings, setBlockSettings] = useState<AllBlockSettings | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingUsers(true);
      try {
        const [users, settings] = await Promise.all([
          getUsers(),
          getBlockSettings()
        ]);
        setAllUsers(users);
        setBlockSettings(settings);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadData();

    const handleBlockSettingsChange = async () => {
      try {
        const settings = await getBlockSettings();
        setBlockSettings(settings);
      } catch (error) {
        console.error('Error updating block settings:', error);
      }
    };
    window.addEventListener('blockSettingsChanged', handleBlockSettingsChange);
    return () => window.removeEventListener('blockSettingsChanged', handleBlockSettingsChange);
  }, []);
  const votableCandidates = useMemo(() => {
    if (!blockSettings) return [];
    return allUsers.filter(user => 
        user.isRegisteredAsCandidate && 
        user.isEligibleForVoting && // Added this check
        user.hasLoggedInOnce &&
        blockSettings[user.assignedBlock]?.isActive 
    );
  }, [allUsers, blockSettings]);  const handleVoteClick = (candidate: User) => {
    if (!currentUser || (currentUser.votesCast && currentUser.votesCast[candidate.assignedBlock]) || currentUser.role === UserRole.SUPERADMIN) return; 
    if (!votingPeriodInfo.isActive) {
        showError('El periodo de votación no está activo.');
        return;
    }
    if (!candidate.profilePicUrl) {
        showError('Este candidato no tiene foto de perfil y no se puede votar por él.');
        return;
    }
     if (!candidate.isEligibleForVoting) {
        showError('Este candidato no es elegible para votación en este momento.');
        return;
    }
    if (!blockSettings || !blockSettings[candidate.assignedBlock]?.isActive) {
        showError(`El bloque ${candidate.assignedBlock} no está habilitado para votación.`);
        return;
    }
    setSelectedCandidateToVote(candidate);
    setShowConfirmVoteModal(true);
  };  const confirmVoteForCandidate = async () => {
    if (!currentUser || !selectedCandidateToVote || (currentUser.votesCast && currentUser.votesCast[selectedCandidateToVote.assignedBlock]) || currentUser.role === UserRole.SUPERADMIN) return;
    if (!votingPeriodInfo.isActive) {
        showError('El periodo de votación no está activo. No se puede procesar el voto.');
        setShowConfirmVoteModal(false);
        setSelectedCandidateToVote(null);
        return;
    }
     if (!selectedCandidateToVote.isEligibleForVoting) {
        showError('El candidato seleccionado no es elegible para votación. No se puede procesar el voto.');
        setShowConfirmVoteModal(false);
        setSelectedCandidateToVote(null);
        return;
    }
    if (!blockSettings || !blockSettings[selectedCandidateToVote.assignedBlock]?.isActive) {
        showError(`El bloque ${selectedCandidateToVote.assignedBlock} no está habilitado para votación. No se puede procesar el voto.`);
        setShowConfirmVoteModal(false);
        setSelectedCandidateToVote(null);
        return;
    }

    try {
        const voteResult = await addVote(currentUser.id, selectedCandidateToVote.id, selectedCandidateToVote.assignedBlock);
        if (voteResult) {
            const updatedVotesCast = { ...(currentUser.votesCast || {}), [selectedCandidateToVote.assignedBlock]: selectedCandidateToVote.id };
            updateCurrentUser({ ...currentUser, votesCast: updatedVotesCast });
            success(`¡Has votado por ${selectedCandidateToVote.nombre} ${selectedCandidateToVote.apellidoPaterno} en el bloque ${selectedCandidateToVote.assignedBlock}!`);
        } else {
            showError('Error al procesar tu voto. Es posible que ya hayas votado en este bloque o el usuario no exista.');
        }
    } catch (error) {
        console.error('Error casting vote:', error);
        showError('Error al procesar tu voto. Por favor intenta de nuevo.');
    }
    setShowConfirmVoteModal(false);
    setSelectedCandidateToVote(null);
  };
  const totalActiveBlocksToVoteIn = useMemo(() => {
    return blockSettings ? ALL_CANDIDATE_BLOCKS.filter(block => blockSettings[block]?.isActive).length : 0;
  }, [blockSettings]);
  
  const votesCastCount = currentUser ? Object.keys(currentUser.votesCast || {}).length : 0;

  if (isLoadingUsers || isLoadingElectionSettings) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  const displayableBlocks = blockSettings ? ALL_CANDIDATE_BLOCKS.filter(b => blockSettings[b]?.isActive) : [];

  return (    <div className="space-y-8">
      <PageTitle 
        title="Votación por Bloques" 
        subtitle={currentUser?.role !== UserRole.SUPERADMIN ? "Explora los candidatos y emite tu voto para un candidato en cada bloque habilitado. ¡Tu voz cuenta!" : "Visualiza todos los candidatos registrados y elegibles en el sistema, agrupados por bloque habilitado."} 
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <Input
                label="Buscar candidato por nombre:"
                name="candidateSearch"
                placeholder="Ej: Juan Pérez..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
                label="Filtrar por Bloque (visualización):"
                name="blockFilter"
                value={filterBlock}
                onChange={(e) => setFilterBlock(e.target.value as CandidateBlock | '')}
                options={[{ value: '', label: 'Mostrar Todos los Bloques Habilitados' }, ...displayableBlocks.map(b => ({ value: b, label: b }))]}
            />        </div>        {currentUser && currentUser.role !== UserRole.SUPERADMIN && totalActiveBlocksToVoteIn > 0 && (
            <div className={`p-4 rounded-container-second border spectra-card ${votesCastCount === totalActiveBlocksToVoteIn ? 'bg-success-bg dark:bg-success-bg-dark border-success-border dark:border-success-border-dark text-success-text dark:text-success-text-dark' : 'bg-info-bg dark:bg-info-bg-dark border-info-border dark:border-info-border-dark text-info-text dark:text-info-text-dark'}`}>
                <h4 className="font-semibold mb-1">Estado General de Votación</h4>
                <p>Has votado en {votesCastCount} de {totalActiveBlocksToVoteIn} bloques habilitados. {votesCastCount < totalActiveBlocksToVoteIn && votingPeriodInfo.isActive ? "Puedes continuar votando en los bloques restantes." : ""}</p>
            </div>
        )}
         {currentUser && currentUser.role !== UserRole.SUPERADMIN && totalActiveBlocksToVoteIn === 0 && (
            <div className="p-4 rounded-container-second border spectra-card bg-warning-bg dark:bg-warning-bg-dark border-warning-border dark:border-warning-border-dark text-warning-text dark:text-warning-text-dark">
                <h4 className="font-semibold mb-1">Votación No Disponible</h4>
                <p>Actualmente no hay bloques habilitados para la votación. Por favor, consulta con el administrador.</p>
            </div>
        )}
      </Card>

      {displayableBlocks.map(block => {
        if (filterBlock && filterBlock !== block) return null; 

        const candidatesInBlock = votableCandidates.filter(c => { // Use votableCandidates
            const nameMatch = `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno}`.toLowerCase().includes(searchTerm.toLowerCase());
            return c.assignedBlock === block && nameMatch;
        });
        
        const hasVotedInThisBlock = !!(currentUser?.votesCast && currentUser.votesCast[block]);
        const votedForCandidateIdInBlock = currentUser?.votesCast ? currentUser.votesCast[block] : undefined;

        return (          <Card key={block} title={`Candidatos para: ${block}`} className="mb-8" padding="md">
            {currentUser && currentUser.role !== UserRole.SUPERADMIN && (
                hasVotedInThisBlock && votedForCandidateIdInBlock ? (
                <div className="p-4 rounded-container-second border spectra-card bg-success-bg dark:bg-success-bg-dark border-success-border dark:border-success-border-dark text-success-text dark:text-success-text-dark mb-4">
                    <p>Ya has votado en este bloque por el candidato con CURP: {votedForCandidateIdInBlock}.</p>
                </div>
                ) : votingPeriodInfo.isActive ? (
                <div className="p-4 rounded-container-second border spectra-card bg-info-bg dark:bg-info-bg-dark border-info-border dark:border-info-border-dark text-info-text dark:text-info-text-dark mb-4">
                    <p>Puedes emitir tu voto para un candidato en este bloque.</p>
                </div>
                ) : (
                <div className="p-4 rounded-container-second border bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300 mb-4">
                    <p>El periodo de votación {votingPeriodInfo.isUpcoming ? 'es próximo' : votingPeriodInfo.isPast ? 'ha finalizado' : 'no está activo/definido'}.</p>
                </div>
                )
            )}

            {candidatesInBlock.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {candidatesInBlock.map(candidate => {
                  const isCandidateActuallyVotable = !!candidate.profilePicUrl && candidate.isEligibleForVoting; // Added isEligibleForVoting check
                  const canUserGenerallyVoteInThisBlock = !!currentUser &&
                                                        currentUser.role !== UserRole.SUPERADMIN &&
                                                        !hasVotedInThisBlock &&
                                                        votingPeriodInfo.isActive;
                  const showVoteButtonForThisCandidate = canUserGenerallyVoteInThisBlock && isCandidateActuallyVotable;

                  return (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onVote={() => handleVoteClick(candidate)}
                      canVote={showVoteButtonForThisCandidate}
                      hasVotedForThisCandidate={votedForCandidateIdInBlock === candidate.id}
                      isVotable={isCandidateActuallyVotable}
                      isVotingPeriodActive={votingPeriodInfo.isActive}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-text-secondary dark:text-neutral-400 text-center py-6">
                No hay candidatos elegibles y activos {searchTerm ? 'que coincidan con tu búsqueda ' : ''} en este bloque.
              </p>
            )}
          </Card>
        );
      })}
      
      {selectedCandidateToVote && (
        <ConfirmationModal
          isOpen={showConfirmVoteModal}
          onClose={() => setShowConfirmVoteModal(false)}
          onConfirm={confirmVoteForCandidate}
          title="Confirmar Voto"
          message={
            <div className="space-y-2">
                <p>¿Estás seguro que deseas votar por:</p>
                <p className="font-semibold">{selectedCandidateToVote.nombre} {selectedCandidateToVote.apellidoPaterno}</p>
                <p>para el bloque <span className="font-medium">{selectedCandidateToVote.assignedBlock}</span>?</p>
                <p className="text-xs text-text-tertiary dark:text-neutral-400 mt-2">Esta acción no se puede deshacer para este bloque.</p>
            </div>
          }
          confirmText="Sí, Votar"
        />
      )}
    </div>
  );
};

export default ViewCandidatesPage;
