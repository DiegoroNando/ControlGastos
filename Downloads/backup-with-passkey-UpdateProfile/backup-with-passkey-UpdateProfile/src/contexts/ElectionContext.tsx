
import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react';
import { ElectionSettings, ElectionPeriod } from '../types';
import { getElectionSettings, updateCandidateCountsAtNominationEnd } from '../services/databaseService';
import { isoToDateUTC, dateToIsoUTC, countBusinessDays } from '../utils/dateUtils';
import { LOCAL_STORAGE_KEYS } from '../constants';

interface PeriodInfo {
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isUpcoming: boolean;
  isPast: boolean;
  isDefined: boolean;
  daysRemainingText: string;
  periodText: string;
}

interface ElectionContextType {
  electionSettings: ElectionSettings | null;
  isLoadingSettings: boolean;
  nominationPeriodInfo: PeriodInfo;
  votingPeriodInfo: PeriodInfo;
}

const defaultPeriodInfo: PeriodInfo = {
  startDate: null,
  endDate: null,
  isActive: false,
  isUpcoming: false,
  isPast: false,
  isDefined: false,
  daysRemainingText: 'Periodo no definido.',
  periodText: 'Periodo no definido.',
};

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

const calculatePeriodInfo = (period: ElectionPeriod | null, periodName: string): PeriodInfo => {
  if (!period || !period.startDate || !period.endDate) {
    return {
      ...defaultPeriodInfo,
      daysRemainingText: `${periodName}: Periodo no definido.`,
      periodText: `${periodName}: Periodo no definido.`
    };
  }
  
  // Obtener la fecha actual en UTC de manera más robusta
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const currentActualDayUTC = todayUTC;

  const startDateObj = isoToDateUTC(period.startDate);
  const endDateObj = isoToDateUTC(period.endDate);
  
  // Para incluir todo el día final (hasta 23:59:59), agregamos casi un día completo a la fecha de fin
  const endDateObjEndOfDay = new Date(endDateObj.getTime() + (24 * 60 * 60 * 1000) - 1); // 23:59:59.999

  const isDefined = !!(period.startDate && period.endDate);
  let isActive = false;
  let isUpcoming = false;
  let isPast = false;
  let daysRemainingText = `${periodName}: `;
  let periodText = `${periodName}: `;
  if (isDefined) {
    // Para períodos activos, verificamos si la fecha actual está dentro del rango
    // incluyendo todo el día final (hasta 23:59:59.999)
    const currentDayStart = todayUTC.getTime();
    const periodStart = startDateObj.getTime();
    const periodEnd = endDateObj.getTime();
    const periodEndInclusive = endDateObjEndOfDay.getTime();
    
    // La fecha actual debe estar dentro del rango de fechas del período
    isActive = currentDayStart >= periodStart && currentDayStart <= periodEnd;
    isUpcoming = currentDayStart < periodStart;
    isPast = currentDayStart > periodEnd;    // Para debugging de períodos de un solo día
    if (process.env.NODE_ENV === 'development' && period.startDate === period.endDate) {
      console.log(`[DEBUG] Período de un día (${period.startDate}):`);
      console.log(`  currentDayStart: ${currentDayStart} (${new Date(currentDayStart).toISOString()})`);
      console.log(`  periodStart: ${periodStart} (${new Date(periodStart).toISOString()})`);
      console.log(`  periodEnd: ${periodEnd} (${new Date(periodEnd).toISOString()})`);
      console.log(`  periodEndInclusive: ${periodEndInclusive} (${new Date(periodEndInclusive).toISOString()})`);
      console.log(`  isActive: ${isActive}, isPast: ${isPast}, isUpcoming: ${isUpcoming}`);
    }

    const startDateFormatted = startDateObj.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    const endDateFormatted = endDateObj.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    periodText += `Del ${startDateFormatted} al ${endDateFormatted}.`;

    if (isActive) {
      const businessDaysLeft = countBusinessDays(dateToIsoUTC(currentActualDayUTC), period.endDate);
      daysRemainingText += `Activo. ${businessDaysLeft > 0 ? `Quedan ${businessDaysLeft} día(s) hábil(es).` : 'Finaliza hoy.'}`;
    } else if (isUpcoming) {
      const businessDaysUntilStart = countBusinessDays(dateToIsoUTC(currentActualDayUTC), period.startDate);
      daysRemainingText += `Próximo. ${businessDaysUntilStart > 0 ? `Inicia en ${businessDaysUntilStart} día(s) hábil(es).` : 'Inicia pronto.'}`;
    } else if (isPast) {
      daysRemainingText += 'Finalizado.';
    }
  } else {
    daysRemainingText += 'Periodo no definido.';
    periodText += 'Periodo no definido.';
  }

  return {
    startDate: period.startDate,
    endDate: period.endDate,
    isActive,
    isUpcoming,
    isPast,
    isDefined,
    daysRemainingText,
    periodText,
  };
};

export const ElectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [electionSettings, setElectionSettings] = useState<ElectionSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getElectionSettings();
        setElectionSettings(settings);
        setIsLoadingSettings(false);        // Snapshot candidate counts if nomination period just ended
        if (settings && settings.nominationPeriod && settings.nominationPeriod.endDate) {
          const nomEndDate = isoToDateUTC(settings.nominationPeriod.endDate);
          const now = new Date();
          const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          
          // Para incluir todo el día final (hasta 23:59:59), agregamos casi un día completo a la fecha de fin
          const nomEndDateEndOfDay = new Date(nomEndDate.getTime() + (24 * 60 * 60 * 1000) - 1);
          
          // Usar comparación de timestamps para mayor precisión
          if (todayUTC.getTime() > nomEndDateEndOfDay.getTime()) { // Nomination period is in the past
            const lastSnapshotDate = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SNAPSHOT_NOM_END_DATE);
            if (lastSnapshotDate !== settings.nominationPeriod.endDate) {
              console.log('[ElectionProvider] Nomination period ended. Updating candidate counts for blocks.');
              await updateCandidateCountsAtNominationEnd();
              localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SNAPSHOT_NOM_END_DATE, settings.nominationPeriod.endDate);
            }
          }
        }
      } catch (error) {
        console.error('Error loading election settings:', error);
        setIsLoadingSettings(false);
      }
    };

    loadSettings(); 

    const handleSettingsChange = () => {
      loadSettings(); 
    };

    window.addEventListener('electionSettingsChanged', handleSettingsChange);
    // Listen for block settings changes too, if they might affect election logic (indirectly)
    // window.addEventListener('blockSettingsChanged', handleSettingsChange);


    return () => {
      window.removeEventListener('electionSettingsChanged', handleSettingsChange);
      // window.removeEventListener('blockSettingsChanged', handleSettingsChange);
    };
  }, []); 

  const nominationPeriodInfo = useMemo(() => calculatePeriodInfo(electionSettings?.nominationPeriod || null, 'Nominación'), [electionSettings?.nominationPeriod]);
  const votingPeriodInfo = useMemo(() => calculatePeriodInfo(electionSettings?.votingPeriod || null, 'Votación'), [electionSettings?.votingPeriod]);

  return (
    <ElectionContext.Provider value={{ electionSettings, isLoadingSettings, nominationPeriodInfo, votingPeriodInfo }}>
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = (): ElectionContextType => {
  const context = useContext(ElectionContext);
  if (context === undefined) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};
