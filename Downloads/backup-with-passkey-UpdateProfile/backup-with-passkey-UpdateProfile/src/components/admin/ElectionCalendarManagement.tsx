

import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, Input, Button } from '../common/CommonComponents';
import MiniCalendar from '../common/MiniCalendar'; // Import MiniCalendar
import { ElectionSettings, ElectionPeriod } from '../../types';
import { getElectionSettings, saveElectionSettings } from '../../services/databaseService';
import { useToast } from '../../contexts/ToastContext';
import { 
  isBusinessDay, 
  findNextBusinessDay, 
  addBusinessDays,
  isoToDateUTC,
  dateToIsoUTC,
  countBusinessDays
} from '../../utils/dateUtils';

const ElectionCalendarManagement: React.FC = () => {
  const { success, error: showError, info } = useToast();const [nominationStartDate, setNominationStartDate] = useState('');
  const [nominationEndDate, setNominationEndDate] = useState('');
  const [nominationDuration, setNominationDuration] = useState('');
  const [nominationCalendarDisplayMonth, setNominationCalendarDisplayMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [nominationSelectionState, setNominationSelectionState] = useState<'none' | 'start-selected'>('none');

  const [votingStartDate, setVotingStartDate] = useState('');
  const [votingEndDate, setVotingEndDate] = useState('');
  const [votingDuration, setVotingDuration] = useState('');
  const [votingCalendarDisplayMonth, setVotingCalendarDisplayMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [votingSelectionState, setVotingSelectionState] = useState<'none' | 'start-selected'>('none');
    const [allowOverlap, setAllowOverlap] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const todayIso = useMemo(() => dateToIsoUTC(findNextBusinessDay(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())))), []);
  const [minSelectableVoteDate, setMinSelectableVoteDate] = useState(todayIso);
  // Load initial settings and apply defaults
  useEffect(() => {
    const loadSettings = async () => {
      const currentSettings = await getElectionSettings();
      let today = new Date();
      today = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

      let currentNomStartDate = '';
      let currentNomEndDate = '';
      let currentNomDuration = '';

      let currentVoteStartDate = '';
      let currentVoteEndDate = '';
      let currentVoteDuration = '';

      // --- Nomination Period ---
      if (currentSettings.nominationPeriod) {
        currentNomStartDate = currentSettings.nominationPeriod.startDate;
        currentNomEndDate = currentSettings.nominationPeriod.endDate;
        const duration = countBusinessDays(currentNomStartDate, currentNomEndDate);
        if (duration > 0) currentNomDuration = duration.toString();
      } else {
        const defaultNomStartObj = findNextBusinessDay(today);
        currentNomStartDate = dateToIsoUTC(defaultNomStartObj);
        currentNomDuration = "1";
        const defaultNomEndIso = addBusinessDays(currentNomStartDate, parseInt(currentNomDuration));
        currentNomEndDate = defaultNomEndIso;
      }
      setNominationStartDate(currentNomStartDate);
      setNominationEndDate(currentNomEndDate);
      setNominationDuration(currentNomDuration);
      const nomDisplayMonthDate = isoToDateUTC(currentNomStartDate) || new Date(today.getFullYear(), today.getMonth(), 1);      setNominationCalendarDisplayMonth(new Date(Date.UTC(nomDisplayMonthDate.getUTCFullYear(), nomDisplayMonthDate.getUTCMonth(), 1)));

      // --- Voting Period ---
      if (currentSettings.votingPeriod) {
        currentVoteStartDate = currentSettings.votingPeriod.startDate;
        currentVoteEndDate = currentSettings.votingPeriod.endDate;
        const duration = countBusinessDays(currentVoteStartDate, currentVoteEndDate);
        if (duration > 0) currentVoteDuration = duration.toString();
      } else {
        const nomEndObjForVoteStart = isoToDateUTC(currentNomEndDate);
        const dayAfterNomEnd = new Date(nomEndObjForVoteStart.valueOf());
        dayAfterNomEnd.setUTCDate(dayAfterNomEnd.getUTCDate() + 1);
        
        const defaultVoteStartObj = findNextBusinessDay(dayAfterNomEnd);
        currentVoteStartDate = dateToIsoUTC(defaultVoteStartObj);
        currentVoteDuration = "1";
        const defaultVoteEndIso = addBusinessDays(currentVoteStartDate, parseInt(currentVoteDuration));
        currentVoteEndDate = defaultVoteEndIso;
      }
      setVotingStartDate(currentVoteStartDate);
      setVotingEndDate(currentVoteEndDate);
      setVotingDuration(currentVoteDuration);
      
      // Restore allowOverlap setting
      setAllowOverlap(currentSettings.allowOverlap || false);
    };

    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to update voting period constraints and display based on nomination period and overlap
  useEffect(() => {
    let earliestValidVoteStartObjForEffect: Date;
    const nomStartDateObj = nominationStartDate ? isoToDateUTC(nominationStartDate) : null;
    const nomEndDateObj = nominationEndDate ? isoToDateUTC(nominationEndDate) : null;
    const todayAsDateObj = isoToDateUTC(todayIso);

    if (allowOverlap) {
        if (nomStartDateObj) {
            if (nomStartDateObj > todayAsDateObj) {
                earliestValidVoteStartObjForEffect = findNextBusinessDay(nomStartDateObj); 
            } else {
                earliestValidVoteStartObjForEffect = todayAsDateObj; 
            }
        } else {
            earliestValidVoteStartObjForEffect = todayAsDateObj; 
        }
    } else { 
        if (nomEndDateObj) {
            const dayAfterNomEnd = new Date(nomEndDateObj.valueOf());
            dayAfterNomEnd.setUTCDate(dayAfterNomEnd.getUTCDate() + 1);
            earliestValidVoteStartObjForEffect = findNextBusinessDay(dayAfterNomEnd);
        } else {
            if (nomStartDateObj && nomStartDateObj > todayAsDateObj) {
                 earliestValidVoteStartObjForEffect = findNextBusinessDay(nomStartDateObj);
            } else {
                 earliestValidVoteStartObjForEffect = todayAsDateObj;
            }
        }
    }
    const earliestValidVoteStartIsoForEffect = dateToIsoUTC(earliestValidVoteStartObjForEffect);

    setMinSelectableVoteDate(earliestValidVoteStartIsoForEffect);
    setVotingCalendarDisplayMonth(
      new Date(Date.UTC(earliestValidVoteStartObjForEffect.getUTCFullYear(), earliestValidVoteStartObjForEffect.getUTCMonth(), 1))
    );

    if (votingStartDate) {
      const currentVoteStartObj = isoToDateUTC(votingStartDate);
      if (currentVoteStartObj < earliestValidVoteStartObjForEffect) {
        setVotingStartDate(earliestValidVoteStartIsoForEffect);
        if (!votingDuration && votingEndDate && isoToDateUTC(votingEndDate) < earliestValidVoteStartObjForEffect) {
            setVotingEndDate(''); 
        }
      }
    } else if (!votingStartDate && (nominationStartDate || nominationEndDate)) {
      setVotingStartDate(earliestValidVoteStartIsoForEffect);
      if (!votingDuration) setVotingEndDate('');
    }
  }, [
    nominationStartDate, 
    nominationEndDate, 
    allowOverlap, 
    todayIso, 
    votingStartDate, 
    votingDuration,  
    votingEndDate    
  ]);


  const updateEndDateFromDuration = useCallback((
    startDate: string, 
    durationStr: string, 
    setEndDate: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const durationNum = parseInt(durationStr);
    if (startDate && durationNum > 0) {
      let startDateObj = isoToDateUTC(startDate); 
      const calculatedEndDate = addBusinessDays(dateToIsoUTC(startDateObj), durationNum);
      if (calculatedEndDate) {
        setEndDate(calculatedEndDate);
      }
    } else if (startDate && durationStr === '0') { 
        let startDateObj = isoToDateUTC(startDate);
        if (isBusinessDay(startDateObj)) {
           setEndDate(dateToIsoUTC(startDateObj));
        } else {
            setEndDate(''); 
        }
    } else if (!startDate || !durationStr) {
        // No action if start date or duration is cleared by this function's trigger
    }
  }, []);
  
  useEffect(() => updateEndDateFromDuration(nominationStartDate, nominationDuration, setNominationEndDate), [nominationStartDate, nominationDuration, updateEndDateFromDuration]);
  useEffect(() => updateEndDateFromDuration(votingStartDate, votingDuration, setVotingEndDate), [votingStartDate, votingDuration, updateEndDateFromDuration]);  const handleDateInputChange = (
    value: string, 
    setDate: React.Dispatch<React.SetStateAction<string>>,
    setOtherDate: React.Dispatch<React.SetStateAction<string>>, 
    setDuration: React.Dispatch<React.SetStateAction<string>>,
    setCalendarMonth: React.Dispatch<React.SetStateAction<Date>>,
    setSelectionState: React.Dispatch<React.SetStateAction<'none' | 'start-selected'>>,
    isStartDate: boolean
    ) => {
    if (value) {
      let dateObj = isoToDateUTC(value);
      if (!isBusinessDay(dateObj)) {
        const nextBizDay = findNextBusinessDay(dateObj);
        const nextBizDayIso = dateToIsoUTC(nextBizDay);
        setDate(nextBizDayIso);
        info(`Fecha ajustada al próximo día hábil: ${nextBizDayIso}.`);
        setCalendarMonth(new Date(Date.UTC(nextBizDay.getUTCFullYear(), nextBizDay.getUTCMonth(), 1)));
      } else {
        setDate(value);
        setCalendarMonth(new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), 1)));
      }
      if (!isStartDate) {
        setDuration(''); 
        setSelectionState('none');
      } else {
        setSelectionState('start-selected');
      }
    } else { 
      setDate('');
      if(isStartDate) setOtherDate(''); 
      setDuration(''); 
      setSelectionState('none');
    }
  };const handleNominationCalendarClick = (dateIso: string) => {
    const clickedDateObj = isoToDateUTC(dateIso); 

    // Si ya tenemos fecha de inicio y fin, o si la fecha clicada es anterior a la fecha de inicio actual,
    // o si no hay fecha de inicio seleccionada, establecemos esta como fecha de inicio
    if (!nominationStartDate || (nominationStartDate && nominationEndDate) || 
        (nominationStartDate && clickedDateObj < isoToDateUTC(nominationStartDate))) {
      // Establecer fecha de inicio y limpiar fecha de fin
      setNominationStartDate(dateIso);
      setNominationEndDate('');
      setNominationDuration('');
      setNominationSelectionState('start-selected');
      setNominationCalendarDisplayMonth(new Date(Date.UTC(clickedDateObj.getUTCFullYear(), clickedDateObj.getUTCMonth(),1)));
      info(`Fecha de inicio seleccionada: ${dateIso}. Haga clic en otra fecha para establecer el final del período.`);
    } else if (nominationStartDate === dateIso) {
      // Si hacemos clic en la misma fecha que ya está seleccionada como inicio, no hacemos nada
      // Esto previene comportamientos inesperados con doble clic
      return;
    } else { 
      // Establecer fecha de fin y calcular duración
      setNominationEndDate(dateIso);
      const newDuration = countBusinessDays(nominationStartDate, dateIso);
      setNominationDuration(newDuration > 0 ? newDuration.toString() : '');
      setNominationSelectionState('none');
      success(`Período de nominación configurado: ${nominationStartDate} a ${dateIso} (${newDuration} días hábiles).`);
    }
  };  const handleVotingCalendarClick = (dateIso: string) => {
    const clickedDateObj = isoToDateUTC(dateIso);

    // Si ya tenemos fecha de inicio y fin, o si la fecha clicada es anterior a la fecha de inicio actual,
    // o si no hay fecha de inicio seleccionada, establecemos esta como fecha de inicio
    if (!votingStartDate || (votingStartDate && votingEndDate) || 
        (votingStartDate && clickedDateObj < isoToDateUTC(votingStartDate))) {
      // Establecer fecha de inicio y limpiar fecha de fin
      setVotingStartDate(dateIso);
      setVotingEndDate('');
      setVotingDuration('');
      setVotingSelectionState('start-selected');
      setVotingCalendarDisplayMonth(new Date(Date.UTC(clickedDateObj.getUTCFullYear(), clickedDateObj.getUTCMonth(), 1)));
      info(`Fecha de inicio seleccionada: ${dateIso}. Haga clic en otra fecha para establecer el final del período.`);
    } else if (votingStartDate === dateIso) {
      // Si hacemos clic en la misma fecha que ya está seleccionada como inicio, no hacemos nada
      // Esto previene comportamientos inesperados con doble clic
      return;
    } else {
      // Establecer fecha de fin y calcular duración
      setVotingEndDate(dateIso);
      const newDuration = countBusinessDays(votingStartDate, dateIso);
      setVotingDuration(newDuration > 0 ? newDuration.toString() : '');
      setVotingSelectionState('none');
      success(`Período de votación configurado: ${votingStartDate} a ${dateIso} (${newDuration} días hábiles).`);
    }
  };  const handleDurationChange = (
    value: string,
    setDuration: React.Dispatch<React.SetStateAction<string>>,
    setSelectionState: React.Dispatch<React.SetStateAction<'none' | 'start-selected'>>
  ) => {
    if (/^\d*$/.test(value)) { 
        setDuration(value);
        if (value === '') {
          setSelectionState('none');
        }
    }
  };
  
  const validateAndFormatPeriods = useCallback((): { 
    valid: boolean; 
    nominationPeriod: ElectionPeriod | null; 
    votingPeriod: ElectionPeriod | null; 
    errorMessage?: string 
  } => {
    let finalNominationPeriod: ElectionPeriod | null = null;
    let finalVotingPeriod: ElectionPeriod | null = null;

    if (nominationStartDate) {
      if (!nominationEndDate) return { valid: false, nominationPeriod: null, votingPeriod: null, errorMessage: 'Periodo de Nominación: Se requiere fecha de fin o definir una duración válida.' };
      const nomStartObj = isoToDateUTC(nominationStartDate);
      const nomEndObj = isoToDateUTC(nominationEndDate);
      if (!isBusinessDay(nomStartObj) || !isBusinessDay(nomEndObj)) return { valid: false, nominationPeriod: null, votingPeriod: null, errorMessage: 'Periodo de Nominación: Las fechas de inicio y fin deben ser días hábiles.' };
      if (nomEndObj < nomStartObj) return { valid: false, nominationPeriod: null, votingPeriod: null, errorMessage: 'Periodo de Nominación: La fecha de fin no puede ser anterior a la fecha de inicio.' };
      finalNominationPeriod = { startDate: dateToIsoUTC(nomStartObj), endDate: dateToIsoUTC(nomEndObj) };
    } else if (nominationEndDate || (nominationDuration && parseInt(nominationDuration) > 0)) {
         return { valid: false, nominationPeriod: null, votingPeriod: null, errorMessage: 'Periodo de Nominación: Se requiere fecha de inicio si se define el periodo.' };
    }

    if (votingStartDate) {
      if (!votingEndDate) return { valid: false, nominationPeriod: finalNominationPeriod, votingPeriod: null, errorMessage: 'Periodo de Votación: Se requiere fecha de fin o definir una duración válida.' };
      const voteStartObj = isoToDateUTC(votingStartDate);
      const voteEndObj = isoToDateUTC(votingEndDate);
      if (!isBusinessDay(voteStartObj) || !isBusinessDay(voteEndObj)) return { valid: false, nominationPeriod: finalNominationPeriod, votingPeriod: null, errorMessage: 'Periodo de Votación: Las fechas de inicio y fin deben ser días hábiles.' };
      if (voteEndObj < voteStartObj) return { valid: false, nominationPeriod: finalNominationPeriod, votingPeriod: null, errorMessage: 'Periodo de Votación: La fecha de fin no puede ser anterior a la fecha de inicio.' };
      finalVotingPeriod = { startDate: dateToIsoUTC(voteStartObj), endDate: dateToIsoUTC(voteEndObj) };
    } else if (votingEndDate || (votingDuration && parseInt(votingDuration) > 0)) {
        return { valid: false, nominationPeriod: finalNominationPeriod, votingPeriod: null, errorMessage: 'Periodo de Votación: Se requiere fecha de inicio si se define el periodo.' };
    }

    if (finalNominationPeriod && finalVotingPeriod) {
      const nomStartObj = isoToDateUTC(finalNominationPeriod.startDate);
      const voteStartObj = isoToDateUTC(finalVotingPeriod.startDate);

      if (voteStartObj < nomStartObj) {
        return { valid: false, nominationPeriod: finalNominationPeriod, votingPeriod: finalVotingPeriod, errorMessage: 'Error de secuencia: El periodo de votación no puede iniciar antes que el periodo de nominación.' };
      }
      
      if (!allowOverlap) {
        const nomEndObj = isoToDateUTC(finalNominationPeriod.endDate);
        if (nomEndObj >= voteStartObj) {
          return { valid: false, nominationPeriod: finalNominationPeriod, votingPeriod: finalVotingPeriod, errorMessage: 'Conflicto de fechas: La nominación debe finalizar antes del inicio de la votación (considerando días hábiles). Marque "Permitir superposición" si es intencional.' };
        }
      }
    }
    
    return { valid: true, nominationPeriod: finalNominationPeriod, votingPeriod: finalVotingPeriod };
  }, [nominationStartDate, nominationEndDate, nominationDuration, votingStartDate, votingEndDate, votingDuration, allowOverlap]);
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validationResult = validateAndFormatPeriods();

    if (!validationResult.valid) {
      showError(validationResult.errorMessage || "Error de validación desconocido.");
      setIsLoading(false);
      return;
    }

    const newSettings: ElectionSettings = {
      nominationPeriod: validationResult.nominationPeriod,
      votingPeriod: validationResult.votingPeriod,
      allowOverlap: allowOverlap, // Save the allowOverlap state
    };    
    await new Promise(resolve => setTimeout(resolve, 300)); 

    await saveElectionSettings(newSettings);
    success('Configuración del calendario electoral guardada con éxito.');
    setIsLoading(false);
  };
  
  const isNomEndDateReadOnly = parseInt(nominationDuration) > 0 && !!nominationStartDate;
  const isVoteEndDateReadOnly = parseInt(votingDuration) > 0 && !!votingStartDate;
  
  const minNomEndDate = nominationStartDate || todayIso;
  const minVoteEndDate = votingStartDate || minSelectableVoteDate;

  return (
    <Card title="Gestión de Calendario Electoral">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Column 1: Nomination Period */}
            <div className="space-y-3">
                <h3 className="text-md font-semibold text-text-primary dark:text-custom-gold">Etapa 1: Periodo de Nominación</h3>                <Input
                    label="Duración (días hábiles)"
                    type="number"
                    name="nominationDuration"
                    value={nominationDuration}
                    onChange={(e) => handleDurationChange(e.target.value, setNominationDuration, setNominationSelectionState)}
                    placeholder="Ej: 5 (prioridad)"
                    min="0"
                    containerClassName="mb-0 sm:max-w-xs"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">                    <Input
                    label="Fecha de Inicio (Manual)"
                    type="date"
                    name="nominationStartDate"
                    value={nominationStartDate}
                    onChange={(e) => handleDateInputChange(e.target.value, setNominationStartDate, setNominationEndDate, setNominationDuration, setNominationCalendarDisplayMonth, setNominationSelectionState, true)}
                    min={todayIso}
                    />
                    <Input
                    label="Fecha de Fin (Manual)"
                    type="date"
                    name="nominationEndDate"
                    value={nominationEndDate}
                    onChange={(e) => handleDateInputChange(e.target.value, setNominationEndDate, ()=>{}, setNominationDuration, setNominationCalendarDisplayMonth, setNominationSelectionState, false)}
                    readOnly={isNomEndDateReadOnly}
                    min={minNomEndDate}
                    className={isNomEndDateReadOnly ? "bg-gray-100 dark:bg-neutral-700/70 cursor-not-allowed" : ""}
                    />
                </div>                <MiniCalendar
                    title="Seleccionar Rango para Nominación"
                    currentDisplayMonthDate={nominationCalendarDisplayMonth}
                    onMonthChange={setNominationCalendarDisplayMonth}
                    selectedStartDateIso={nominationStartDate}
                    selectedEndDateIso={nominationEndDate}
                    onDateClick={handleNominationCalendarClick}
                    minSelectableDateIso={todayIso}
                    highlightColorName="pink"
                    selectionState={nominationSelectionState}
                />
                <p className="text-xs text-text-tertiary dark:text-neutral-400">
                    Defina por duración y fecha de inicio (recomendado), o seleccione rango en calendario (actualizará duración), o ingrese fechas manualmente.
                    Fechas se ajustarán a días hábiles.
                </p>
            </div>

            {/* Column 2: Voting Period */}
            <div className="space-y-3">
                <h3 className="text-md font-semibold text-text-primary dark:text-custom-gold">Etapa 2: Periodo de Votación</h3>                <Input
                    label="Duración (días hábiles)"
                    type="number"
                    name="votingDuration"
                    value={votingDuration}
                    onChange={(e) => handleDurationChange(e.target.value, setVotingDuration, setVotingSelectionState)}
                    placeholder="Ej: 10 (prioridad)"
                    min="0"
                    containerClassName="mb-0 sm:max-w-xs"
                    />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">                    <Input
                    label="Fecha de Inicio (Manual)"
                    type="date"
                    name="votingStartDate"
                    value={votingStartDate}
                    onChange={(e) => handleDateInputChange(e.target.value, setVotingStartDate, setVotingEndDate, setVotingDuration, setVotingCalendarDisplayMonth, setVotingSelectionState, true)}
                    min={minSelectableVoteDate}
                    />
                    <Input
                    label="Fecha de Fin (Manual)"
                    type="date"
                    name="votingEndDate"
                    value={votingEndDate}
                    onChange={(e) => handleDateInputChange(e.target.value, setVotingEndDate, ()=>{}, setVotingDuration, setVotingCalendarDisplayMonth, setVotingSelectionState, false)}
                    readOnly={isVoteEndDateReadOnly}
                    min={minVoteEndDate}
                    className={isVoteEndDateReadOnly ? "bg-gray-100 dark:bg-neutral-700/70 cursor-not-allowed" : ""}
                    />
                </div>                <MiniCalendar
                    title="Seleccionar Rango para Votación"
                    currentDisplayMonthDate={votingCalendarDisplayMonth}
                    onMonthChange={setVotingCalendarDisplayMonth}
                    selectedStartDateIso={votingStartDate}
                    selectedEndDateIso={votingEndDate}
                    onDateClick={handleVotingCalendarClick}
                    minSelectableDateIso={minSelectableVoteDate}
                    highlightColorName="pink"
                    selectionState={votingSelectionState}
                />
                <p className="text-xs text-text-tertiary dark:text-neutral-400">
                    Defina por duración y fecha de inicio, o seleccione rango en calendario, o ingrese fechas manualmente. Fechas deben ser días hábiles.
                </p>
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border-gray/30 dark:border-neutral-700/30">
            <h4 className="text-sm font-semibold text-text-primary dark:text-neutral-200 mb-1.5">Opciones de Superposición:</h4>
            <div className="flex items-center">                <input
                id="allowOverlap"
                name="allowOverlap"
                type="checkbox"
                checked={allowOverlap}
                onChange={(e) => setAllowOverlap(e.target.checked)}
                className="h-4 w-4 text-custom-pink border-border-gray dark:border-neutral-600 rounded focus:ring-custom-pink apple-focus-ring"
                />
                <label htmlFor="allowOverlap" className="ml-2 block text-sm text-text-primary dark:text-neutral-200">
                Permitir que el inicio de la votación se superponga con el fin de la nominación.
                </label>
            </div>
            <p className="text-xs text-text-tertiary dark:text-neutral-400 mt-1">
                Nota: El periodo de votación nunca podrá iniciar antes que el periodo de nominación (considerando días hábiles).
            </p>
        </div>
        
        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            Guardar Configuración
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ElectionCalendarManagement;
