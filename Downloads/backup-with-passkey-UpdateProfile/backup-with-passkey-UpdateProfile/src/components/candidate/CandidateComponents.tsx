
import React from 'react'; 
import { Link } from 'react-router-dom';
import { User, CandidateBlock } from '../../types'; 
import { Button, Card } from '../common/CommonComponents'; 
import { DEFAULT_PROFILE_PIC_BASE_URL } from '../../constants';
import { generateCandidatePostsUrl } from '../../services/routeSecurityService';

interface CandidateCardProps {
  candidate: User;
  onVote?: (candidateId: string, block: CandidateBlock) => void; 
  canVote?: boolean; 
  hasVotedForThisCandidate?: boolean; 
  isVotable?: boolean; 
  isVotingPeriodActive?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ 
    candidate, 
    onVote, 
    canVote, 
    hasVotedForThisCandidate, 
    isVotable = true,
    isVotingPeriodActive = false
}) => {
  const profilePic = candidate.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(candidate.nombre + ' ' + candidate.apellidoPaterno)}`;
  
  return (
    <Card className={`spectra-card transition-all duration-300 ease-out hover:shadow-spectra-lg hover:-translate-y-1 flex flex-col h-full ${
      !isVotable 
        ? 'opacity-70 bg-card-bg/40 dark:bg-neutral-800/30' 
        : 'bg-gradient-card-light dark:bg-gradient-card-dark'
    } backdrop-blur-md border border-light-gray-alt/20 dark:border-accent-gold/20`} padding="md">
      <div className="flex flex-col items-center text-center flex-grow">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-maroon/20 dark:border-accent-gold/30 shadow-spectra-md mb-4 flex-shrink-0 bg-gradient-to-br from-primary-maroon/10 to-primary-maroon/5 dark:from-accent-gold/10 dark:to-accent-gold/5">
            <img src={profilePic} alt={`${candidate.nombre}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary dark:text-accent-gold-brighter mb-1 spectra-gradient-text">{candidate.nombre} {candidate.apellidoPaterno}</h3>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-1 font-medium">{candidate.assignedBlock}</p>
        {!isVotable && <p className="text-xs text-error-text dark:text-red-400 mt-1.5 px-2 py-1 bg-error-bg/20 dark:bg-red-900/20 rounded-full">Perfil incompleto (sin foto). No se puede votar.</p>}
      </div>          <div className="mt-auto pt-4 space-y-3 w-full"> 
          <Link to={generateCandidatePostsUrl(candidate.id)} className="w-full block">
               <Button variant="secondary" size="sm" fullWidth className="spectra-btn-secondary-enhanced">Ver Perfil y Publicaciones</Button>
          </Link>
          {onVote && canVote && isVotable && (
          <Button 
              variant="primary" 
              size="sm" 
              onClick={() => onVote(candidate.id, candidate.assignedBlock)}
              disabled={!isVotingPeriodActive} 
              title={!isVotingPeriodActive ? "El periodo de votación no está activo" : `Votar por ${candidate.nombre.split(' ')[0]} en ${candidate.assignedBlock}`}
              fullWidth
              className="spectra-btn-primary-enhanced spectra-cta-pulse"
          >
              Votar por {candidate.nombre.split(' ')[0]}
          </Button>
          )}
          {hasVotedForThisCandidate && ( 
              <div className="text-sm text-success-text dark:text-success-text-dark font-medium pt-1.5 text-center bg-success-bg/20 dark:bg-success-bg-dark/20 rounded-lg py-2 px-3 border border-success-text/20 dark:border-success-text-dark/20">¡Has votado por este candidato en este bloque!</div>
          )}
      </div>
    </Card>
  );
};
