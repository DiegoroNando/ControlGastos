import React, { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

type StrengthLevel = 'empty' | 'weak' | 'medium' | 'strong' | 'very-strong';

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password,
  className = ''
}) => {
  const { strengthLevel, score, feedback } = useMemo(() => {
    if (!password) {
      return { strengthLevel: 'empty' as StrengthLevel, score: 0, feedback: 'La contraseña es obligatoria' };
    }
    
    // Criteria
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
    
    // Calculate score (0-4)
    let score = 0;
    if (password.length >= 6) score += 1;
    if (hasMinLength) score += 1;
    if ((hasUppercase && hasLowercase) || (hasNumbers && (hasUppercase || hasLowercase))) score += 1;
    if (hasSpecialChars && hasNumbers) score += 1;
    
    // Determine strength level
    let strengthLevel: StrengthLevel = 'weak';
    if (score === 0) strengthLevel = 'weak';
    else if (score === 1) strengthLevel = 'weak';
    else if (score === 2) strengthLevel = 'medium';
    else if (score === 3) strengthLevel = 'strong';
    else if (score >= 4) strengthLevel = 'very-strong';
    
    // Generate feedback
    let feedback = '';
    if (!hasMinLength) {
      feedback = 'Se recomienda al menos 8 caracteres';
    } else if (!hasUppercase || !hasLowercase) {
      feedback = 'Incluye letras mayúsculas y minúsculas';
    } else if (!hasNumbers) {
      feedback = 'Incluye al menos un número';
    } else if (!hasSpecialChars) {
      feedback = 'Incluye al menos un carácter especial';
    } else {
      feedback = '¡Excelente contraseña!';
    }
    
    return { strengthLevel, score, feedback };
  }, [password]);
  
  const strengthColors = {
    'empty': 'bg-gray-300 dark:bg-neutral-600',
    'weak': 'bg-red-500',
    'medium': 'bg-orange-500',
    'strong': 'bg-blue-500',
    'very-strong': 'bg-green-500'
  };
  
  const strengthLabels = {
    'empty': '',
    'weak': 'Débil',
    'medium': 'Media',
    'strong': 'Fuerte',
    'very-strong': 'Muy fuerte'
  };
  
  return (
    <div className={`w-full space-y-1 ${className}`}>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
        {/* Progress bars with different widths based on strength */}
        {strengthLevel !== 'empty' && (
          <div 
            className={`h-full transition-all duration-300 ${strengthColors[strengthLevel]}`} 
            style={{ width: `${(score / 4) * 100}%` }}
          ></div>
        )}
      </div>
      
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary dark:text-neutral-400">
          {strengthLevel !== 'empty' && strengthLabels[strengthLevel]}
        </span>
        <span className={`
          text-xs
          ${strengthLevel === 'weak' ? 'text-red-500' : ''}
          ${strengthLevel === 'medium' ? 'text-orange-500' : ''}
          ${strengthLevel === 'strong' ? 'text-blue-500' : ''}
          ${strengthLevel === 'very-strong' ? 'text-green-500' : ''}
          ${strengthLevel === 'empty' ? 'text-text-tertiary dark:text-neutral-500' : ''}
        `}>
          {feedback}
        </span>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
