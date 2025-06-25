import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert } from '../common/CommonComponents';
import { EligibilityCriterionKey, EligibilityAnswers } from '../../types';
import { ELIGIBILITY_QUESTIONS } from '../../constants';

interface EligibilityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: EligibilityAnswers) => void;
  antiguedad: number | undefined;
}

const allCriteriaKeys = Object.keys(ELIGIBILITY_QUESTIONS) as EligibilityCriterionKey[];

export const EligibilityFormModal: React.FC<EligibilityFormModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit,
    antiguedad 
}) => {
  const [answers, setAnswers] = useState<EligibilityAnswers>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {    // Pre-fill seniority based on profile, but allow user to confirm
    if (isOpen) {
      setAnswers(prev => ({
        ...prev,
        [EligibilityCriterionKey.HAS_MINIMUM_SENIORITY]: antiguedad !== undefined && antiguedad >= 12 ? true : null,
      }));
    }
  }, [isOpen, antiguedad]);

  const handleAnswerChange = (criterion: EligibilityCriterionKey, value: boolean) => {
    setAnswers(prev => ({ ...prev, [criterion]: value }));
    setError(null); // Clear error when user changes an answer
  };

  const handleSubmit = () => {
    setError(null);
    const unansweredCriteria = allCriteriaKeys.filter(key => answers[key] === null || answers[key] === undefined);
    if (unansweredCriteria.length > 0) {
      setError(`Por favor, responde todas las preguntas. Falta: ${ELIGIBILITY_QUESTIONS[unansweredCriteria[0]].question}`);
      return;
    }

    onSubmit(answers);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Declaración de Elegibilidad para Candidatura" size="lg">
      <div className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        
        <Alert 
            type="warning" 
            title="Aviso Importante sobre tu Candidatura"
            message={
                <>
                    <p>Si decides postularte o aceptar una nominación y te conviertes en candidato, una vez que el <strong>periodo de votación oficial dé inicio</strong>, ya <strong>no podrás retirar tu candidatura</strong> para el proceso electoral actual.</p>
                    <p className="mt-1">No obstante, podrás seguir participando en las votaciones y, si el periodo de nominación aún estuviera activo y no lo has hecho, nominar a un colega de tu bloque.</p>
                </>
            }
            className="mb-5"
        />
        
        <p className="text-sm text-text-secondary dark:text-neutral-400">
          Por favor, responde con veracidad a las siguientes preguntas para determinar tu elegibilidad como candidato.
        </p>
        {allCriteriaKeys.map(key => {
          const criterionKey = key as EligibilityCriterionKey;
          const questionDetail = ELIGIBILITY_QUESTIONS[criterionKey];
          const isSeniorityQuestion = criterionKey === EligibilityCriterionKey.HAS_MINIMUM_SENIORITY;          const seniorityMet = antiguedad !== undefined && antiguedad >= 12;

          return (
            <div key={criterionKey} className="p-3 border border-border-gray dark:border-neutral-600 rounded-container-third bg-gray-50 dark:bg-neutral-700/30">
              <p className="font-medium text-text-primary dark:text-neutral-200 mb-1.5">{questionDetail.question}</p>
              {isSeniorityQuestion && (
                <p className="text-xs text-text-tertiary dark:text-neutral-400 mb-2">
                  Antigüedad registrada en tu perfil: {antiguedad !== undefined ? `${antiguedad} mes(es)` : 'No registrada'}.
                  {seniorityMet ? ' (Cumple con el mínimo de 12 meses)' : ' (No cumple con el mínimo de 12 meses o no está registrada)'}
                </p>
              )}
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={criterionKey}
                    checked={answers[criterionKey] === true}
                    onChange={() => handleAnswerChange(criterionKey, true)}
                    disabled={isSeniorityQuestion && !seniorityMet} // Disable Yes if seniority not met
                    className="form-radio h-4 w-4 text-custom-pink focus:ring-custom-pink apple-focus-ring"
                  />
                  <span className={isSeniorityQuestion && !seniorityMet && answers[criterionKey] === true ? 'text-gray-400' : 'text-text-secondary dark:text-neutral-300'}>Sí</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={criterionKey}
                    checked={answers[criterionKey] === false}
                    onChange={() => handleAnswerChange(criterionKey, false)}
                    disabled={isSeniorityQuestion && seniorityMet} // Disable No if seniority is met
                    className="form-radio h-4 w-4 text-custom-pink focus:ring-custom-pink apple-focus-ring"
                  />
                  <span className={isSeniorityQuestion && seniorityMet && answers[criterionKey] === false ? 'text-gray-400' : 'text-text-secondary dark:text-neutral-300'}>No</span>
                </label>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end space-x-3 pt-3">
          <Button variant="secondary" onClick={onClose} className="spectra-btn-secondary-enhanced">Cancelar</Button>
          <Button onClick={handleSubmit} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">Confirmar y Continuar</Button>
        </div>
      </div>
    </Modal>
  );
};
