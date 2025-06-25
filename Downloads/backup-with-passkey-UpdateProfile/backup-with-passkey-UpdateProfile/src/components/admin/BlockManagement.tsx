import React, { useState, useEffect, FormEvent } from 'react';
import { Card, Button } from '../common/CommonComponents';
import { AllBlockSettings, CandidateBlock, ALL_CANDIDATE_BLOCKS } from '../../types';
import { getBlockSettings, saveBlockSettings } from '../../services/databaseService';
import { useElection } from '../../contexts/ElectionContext'; // To get nomination period status
import { useToast } from '../../contexts/ToastContext'; // Add toast context import

interface BlockManagementProps {
  onSettingsChanged: () => void; // Callback to notify parent of changes
}

// Helper function to create the initial or reset state for infoMessages
const getInitialInfoMessages = (): Record<CandidateBlock, string | null> => {
  return ALL_CANDIDATE_BLOCKS.reduce((acc, block) => {
    acc[block] = null;
    return acc;
  }, {} as Record<CandidateBlock, string | null>);
};

const BlockManagement: React.FC<BlockManagementProps> = ({ onSettingsChanged }) => {
  // Initialize with proper default structure
  const getDefaultBlockSettings = (): AllBlockSettings => {
    const defaultSettings = {} as AllBlockSettings;
    ALL_CANDIDATE_BLOCKS.forEach(block => {
      defaultSettings[block] = { isActive: true, candidateCountAtNominationEnd: undefined };
    });
    return defaultSettings;
  };

  const [blockSettings, setBlockSettings] = useState<AllBlockSettings>(getDefaultBlockSettings());
  const [localChanges, setLocalChanges] = useState<Partial<AllBlockSettings>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [infoMessages, setInfoMessages] = useState<Record<CandidateBlock, string | null>>(getInitialInfoMessages());

  const { nominationPeriodInfo } = useElection();
  const { success, error: showError } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getBlockSettings();
      setBlockSettings(settings);
    };
    loadSettings();

    // Listen for external changes to block settings (e.g. candidate count updates)
    const handleSettingsUpdate = async () => {
        const settings = await getBlockSettings();
        setBlockSettings(settings);
        setLocalChanges({}); // Reset local changes if external update occurs
    };
    window.addEventListener('blockSettingsChanged', handleSettingsUpdate);
    return () => window.removeEventListener('blockSettingsChanged', handleSettingsUpdate);
  }, []);

  const handleToggleBlock = (block: CandidateBlock) => {    setInfoMessages(prev => ({ ...prev, [block]: null }));

    const currentStatus = localChanges[block]?.isActive !== undefined 
                          ? localChanges[block]!.isActive 
                          : blockSettings[block].isActive;
    const newIsActive = !currentStatus;

    let blockInfoMessage = newIsActive 
      ? `El bloque ${block} se HABILITARÁ para votación y visualización.`
      : `El bloque ${block} se DESHABILITARÁ. No será visible para votación.`;

    // Constraint check: Cannot enable if nomination period is past and no candidates were registered.
    if (newIsActive && nominationPeriodInfo.isPast && (blockSettings[block].candidateCountAtNominationEnd === 0 || blockSettings[block].candidateCountAtNominationEnd === undefined) ) {
        showError(`Error para ${block}: No se puede habilitar este bloque porque no tuvo candidatos registrados en el último periodo de nominación concluido.`);
        // Do not apply the change to localChanges, effectively reverting the toggle visually if save fails.
        // Or, for instant feedback, don't even set the localChange here if constraint fails.
        // For now, let's allow the UI to toggle, but save will prevent it.
        // Better: prevent the toggle in UI directly for this specific case if all info is present.
        // Update: The save logic will ultimately prevent this. The UI toggle is temporary.
         blockInfoMessage = `ADVERTENCIA: ${block} no tuvo candidatos en la última nominación. Su habilitación podría no ser efectiva si se guarda así.`;
    }
    
    setInfoMessages(prev => ({ ...prev, [block]: blockInfoMessage }));

    setLocalChanges(prev => ({
      ...prev,
      [block]: {
        ...blockSettings[block], // Preserve candidate count
        ...(prev[block] || {}),  // Preserve existing local changes for this block
        isActive: newIsActive,
      },
    }));
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Individual info messages are handled by handleToggleBlock

    const settingsToSave: AllBlockSettings = { ...blockSettings };
    let constraintViolated = false;
    let finalErrorMessages: string[] = [];

    for (const blockKey in localChanges) {
      const block = blockKey as CandidateBlock;
      const change = localChanges[block];
      if (change) {
        if (change.isActive && nominationPeriodInfo.isPast && (settingsToSave[block].candidateCountAtNominationEnd === 0 || settingsToSave[block].candidateCountAtNominationEnd === undefined)) {
          finalErrorMessages.push(`Error para ${block}: No se puede habilitar. No tuvo candidatos en la última nominación.`);
          constraintViolated = true;
          // Revert this specific change in localChanges for UI consistency if needed, or rely on full refresh.
          // For now, we proceed to save valid changes, and errors are displayed.
        } else {
          settingsToSave[block] = { ...settingsToSave[block], isActive: change.isActive };
        }
      }
    }
    
    if (constraintViolated && finalErrorMessages.length > 0) {
        showError(finalErrorMessages.join(" "));
        // Don't save if critical constraints are violated, or save only valid parts.
        // Current logic: Error message shown, but valid parts might still save if we don't return.
        // Let's ensure only fully valid settings are saved or none at all if a constraint is hit.
        // Decision: If any constraint violated, do not proceed with saving any changes for `isActive` flags that failed.
        // We should merge localChanges into a *copy* of blockSettings, validate, then save.

        // Rebuild settingsToSave from scratch, applying local changes ONLY IF VALID
        let validSettingsToSave = { ...blockSettings };
        let actualChangesMade = false;

        for (const blockKey in localChanges) {
            const block = blockKey as CandidateBlock;
            const localChange = localChanges[block];
            if (!localChange) continue;

            const originalIsActive = blockSettings[block].isActive;
            const newIsActive = localChange.isActive;

            if (newIsActive === originalIsActive) continue; // No change in active status for this block

            if (newIsActive && nominationPeriodInfo.isPast && (blockSettings[block].candidateCountAtNominationEnd === 0 || blockSettings[block].candidateCountAtNominationEnd === undefined)) {
                // Constraint violated for this block, do not apply this change
                if (!finalErrorMessages.some(msg => msg.includes(block))) { // Avoid duplicate error messages
                    finalErrorMessages.push(`Error para ${block}: No se puede habilitar. No tuvo candidatos en la última nominación.`);
                }
            } else {
                validSettingsToSave[block] = { ...validSettingsToSave[block], isActive: newIsActive };
                actualChangesMade = true;
            }
        }        if (finalErrorMessages.length > 0) {
             showError(finalErrorMessages.join(" "));
        }        if (actualChangesMade) {
             await saveBlockSettings(validSettingsToSave);
             setBlockSettings(validSettingsToSave); // Update main state
             success('Configuración de bloques guardada (con posibles omisiones por errores).');
        } else if (finalErrorMessages.length === 0) {
             success('No se realizaron cambios o ya estaban aplicados.');
        }
        
        setLocalChanges({}); // Clear local changes after attempting save
        setIsLoading(false);
        onSettingsChanged(); // Notify parent to refresh related data
        
        const clearMsgTimer = setTimeout(() => { setInfoMessages(getInitialInfoMessages()); }, 5000);
        return () => clearTimeout(clearMsgTimer);

    } else { // No constraint violations detected initially, proceed to save all local changes
        for (const blockKey in localChanges) {
             settingsToSave[blockKey as CandidateBlock] = {
                ...settingsToSave[blockKey as CandidateBlock],
                isActive: localChanges[blockKey as CandidateBlock]!.isActive,
             };        }
        await saveBlockSettings(settingsToSave);
        setBlockSettings(settingsToSave);
        setLocalChanges({});
        success('Configuración de bloques guardada con éxito.');
    }

    setIsLoading(false);
    onSettingsChanged(); // Notify parent to refresh related data

    const clearMsgTimer = setTimeout(() => { setInfoMessages(getInitialInfoMessages()); }, 3000);
    return () => clearTimeout(clearMsgTimer);
  };

  const hasPendingChanges = Object.keys(localChanges).length > 0;
  return (
    <Card title="Gestión de Bloques de Candidatos">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-neutral-400">
          Habilita o deshabilita los bloques para la votación. Un bloque no puede habilitarse si no tuvo candidatos en el último periodo de nominación concluido.
          Los conteos de candidatos se actualizan automáticamente al finalizar un periodo de nominación.
        </p>

        <div className="space-y-3">
          {ALL_CANDIDATE_BLOCKS.map(block => {
            const currentIsActive = localChanges[block]?.isActive !== undefined 
                                  ? localChanges[block]!.isActive 
                                  : blockSettings[block].isActive;
            const candidateCount = blockSettings[block].candidateCountAtNominationEnd;
            const countText = candidateCount !== undefined ? `${candidateCount} cand.` : 'N/A';

            return (
              <div key={block} className="p-3 border border-border-gray/70 dark:border-neutral-600 rounded-container-third bg-card-bg dark:bg-neutral-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-text-primary dark:text-neutral-100">{block}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        nominationPeriodInfo.isPast && (candidateCount === 0 || candidateCount === undefined)
                            ? 'bg-error-bg text-error-text dark:bg-red-800/50 dark:text-red-300'
                            : candidateCount !== undefined && candidateCount > 0
                            ? 'bg-success-bg text-success-text dark:bg-green-800/50 dark:text-green-300'
                            : 'bg-gray-200 text-text-tertiary dark:bg-neutral-700 dark:text-neutral-400'
                    }`}>
                        {nominationPeriodInfo.isPast ? `Nominación pasada: ${countText}` : `Conteo pendiente`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-3 text-xs font-medium ${currentIsActive ? 'text-success-text dark:text-green-400' : 'text-error-text dark:text-red-400'}`}>
                      {currentIsActive ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(block)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none apple-focus-ring
                        ${currentIsActive ? 'bg-custom-pink' : 'bg-gray-300 dark:bg-neutral-600'}`}
                      aria-pressed={currentIsActive}
                    >
                      <span className="sr-only">Toggle {block}</span>
                      <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                          ${currentIsActive ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
                {infoMessages[block] && (
                    <p className={`text-xs mt-1.5 ${infoMessages[block]!.includes("ADVERTENCIA") || infoMessages[block]!.includes("Error") ? "text-warning-text dark:text-orange-300" : "text-info-text dark:text-pink-300"}`}>
                        {infoMessages[block]}
                    </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3">
          <Button type="submit" isLoading={isLoading} disabled={isLoading || !hasPendingChanges}>
            Guardar Cambios en Bloques
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BlockManagement;
