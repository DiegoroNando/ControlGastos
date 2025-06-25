
import React from 'react';
import { User, EligibilityCriterionKey, EligibilityAnswers } from '../../types';
import { ELIGIBILITY_QUESTIONS } from '../../constants';

interface EligibilityChecksAdminViewProps {
  user: User;
  adminVerificationAnswers: EligibilityAnswers;
  onAdminAnswerChange: (criterion: EligibilityCriterionKey, value: boolean | null) => void;
  isFinalVerificationChecked: boolean;
  onFinalVerificationChange: (isChecked: boolean) => void;
  isUserSeniorityMet: boolean;
}

const allCriteriaKeys = Object.keys(ELIGIBILITY_QUESTIONS) as EligibilityCriterionKey[];

export const EligibilityChecksAdminView: React.FC<EligibilityChecksAdminViewProps> = ({
  user,
  adminVerificationAnswers,
  onAdminAnswerChange,
  isFinalVerificationChecked,
  onFinalVerificationChange,
  isUserSeniorityMet
}) => {
  const selfDeclaration = user.eligibilitySelfDeclaration || {};
  const allAdminChecksPositive = isUserSeniorityMet && allCriteriaKeys.every(key => {
    const criterionKey = key as EligibilityCriterionKey;
    const expected = ELIGIBILITY_QUESTIONS[criterionKey].expectedAnswer;
    // Admin must verify according to the expected outcome.
    // If expected is true, admin must check Yes. If expected is false, admin must check No.
    // This means admin's 'true' answer always signifies "passes this check".
    return adminVerificationAnswers[criterionKey] === true;
  });


  return (
    <div className="space-y-4 p-4 border border-border-gray dark:border-neutral-600 rounded-container-third bg-gray-50/50 dark:bg-neutral-700/40">
      <h4 className="text-md font-semibold text-text-primary dark:text-custom-gold mb-3">
        Verificación de Elegibilidad del Candidato (Admin)
      </h4>
      
      {allCriteriaKeys.map(key => {
        const criterionKey = key as EligibilityCriterionKey;
        const questionDetail = ELIGIBILITY_QUESTIONS[criterionKey];
        const userDeclaredAnswer = selfDeclaration[criterionKey];
        
        let userDeclaredText = 'No respondido';
        if (userDeclaredAnswer === true) userDeclaredText = 'Sí';
        else if (userDeclaredAnswer === false) userDeclaredText = 'No';        const isSeniorityQuestion = criterionKey === EligibilityCriterionKey.HAS_MINIMUM_SENIORITY;
        let seniorityDisplay = '';
        if(isSeniorityQuestion) {
            seniorityDisplay = `(Antigüedad registrada: ${user.antiguedad ?? 'N/A'} meses - ${isUserSeniorityMet ? "Cumple" : "No Cumple"})`;
        }


        return (
          <div key={criterionKey} className="py-2 border-b border-border-gray/50 dark:border-neutral-600/50 last:border-b-0">
            <p className="text-sm font-medium text-text-secondary dark:text-neutral-300 mb-0.5">
              {questionDetail.question} {isSeniorityQuestion ? seniorityDisplay : ''}
            </p>
            <p className="text-xs text-text-tertiary dark:text-neutral-400 mb-1.5">
              Respuesta del Usuario: <span className="font-semibold">{userDeclaredText}</span>
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-text-primary dark:text-neutral-200">Verificación Admin:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`admin_${criterionKey}`}
                  checked={adminVerificationAnswers[criterionKey] === true}
                  onChange={() => onAdminAnswerChange(criterionKey, true)}
                  className="form-radio h-4 w-4 text-custom-pink focus:ring-custom-pink apple-focus-ring"
                />
                <span className="text-xs text-text-secondary dark:text-neutral-300">Sí (Cumple requisito)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`admin_${criterionKey}`}
                  checked={adminVerificationAnswers[criterionKey] === false}
                  onChange={() => onAdminAnswerChange(criterionKey, false)}
                  className="form-radio h-4 w-4 text-custom-pink focus:ring-custom-pink apple-focus-ring"
                />
                <span className="text-xs text-text-secondary dark:text-neutral-300">No (No cumple requisito)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`admin_${criterionKey}`}
                  checked={adminVerificationAnswers[criterionKey] === null || adminVerificationAnswers[criterionKey] === undefined}
                  onChange={() => onAdminAnswerChange(criterionKey, null)}
                  className="form-radio h-4 w-4 text-custom-pink focus:ring-custom-pink apple-focus-ring"
                />
                <span className="text-xs text-text-secondary dark:text-neutral-300">Pendiente</span>
              </label>
            </div>
          </div>
        );
      })}

      <div className="mt-4 pt-4 border-t border-border-gray dark:border-neutral-600">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFinalVerificationChecked}
            onChange={(e) => onFinalVerificationChange(e.target.checked)}
            disabled={!allAdminChecksPositive}
            className="h-4 w-4 text-custom-pink border-gray-300 rounded focus:ring-custom-pink apple-focus-ring"
          />
          <span className={`text-sm font-medium ${!allAdminChecksPositive ? 'text-text-tertiary dark:text-neutral-500' : 'text-text-primary dark:text-neutral-100'}`}>
            Marcar como "Elegible para Votación" (Todas las verificaciones deben ser positivas y antigüedad cumplida)
          </span>
        </label>        {!allAdminChecksPositive && isFinalVerificationChecked && (
            <p className="text-xs text-error-text dark:text-red-400 mt-1">
                No se puede marcar como elegible. Revise que la antigüedad sea &gt;= 12 meses y todas las verificaciones de admin sean "Sí (Cumple requisito)".
            </p>
        )}
      </div>
    </div>
  );
};
