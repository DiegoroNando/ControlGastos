/**
 * Service for managing in-app notifications
 */

export interface NotificationData {
  type: 'candidacy_withdrawal' | 'voting_reminder' | 'nomination_reminder' | 'general';
  title: string;
  message: string;
  read: boolean;
  userData?: {
    nombre: string;
    apellidoPaterno: string;
    curp: string;
    assignedBlock: string;
  };
}

/**
 * Creates a candidacy withdrawal notification for superadministrators
 * @param user The user who withdrew their candidacy
 */
export const createCandidacyWithdrawalNotification = (user: any): NotificationData => {
  return {
    type: 'candidacy_withdrawal',
    title: 'Retiro de Candidatura',
    message: `${user.nombre} ${user.apellidoPaterno} ha retirado su candidatura del bloque ${user.assignedBlock}. Se requiere seguimiento administrativo.`,
    read: false,
    userData: {
      nombre: user.nombre,
      apellidoPaterno: user.apellidoPaterno,
      curp: user.curp,
      assignedBlock: user.assignedBlock
    }
  };
};

/**
 * Creates a voting reminder notification
 * @param daysRemaining Number of days remaining in voting period
 * @param nonVotersCount Number of users who haven't voted
 */
export const createVotingReminderNotification = (daysRemaining: number, nonVotersCount: number): NotificationData => {
  return {
    type: 'voting_reminder',
    title: 'Recordatorio de Votación',
    message: `El período de votación termina en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}. ${nonVotersCount} usuario${nonVotersCount !== 1 ? 's' : ''} aún no ha${nonVotersCount !== 1 ? 'n' : ''} votado.`,
    read: false
  };
};

/**
 * Creates a nomination reminder notification
 * @param daysRemaining Number of days remaining in nomination period
 */
export const createNominationReminderNotification = (daysRemaining: number): NotificationData => {
  return {
    type: 'nomination_reminder',
    title: 'Período de Nominaciones',
    message: `Quedan ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} para el cierre de nominaciones de candidatos.`,
    read: false
  };
};

/**
 * Creates a general notification
 * @param title Notification title
 * @param message Notification message
 */
export const createGeneralNotification = (title: string, message: string): NotificationData => {
  return {
    type: 'general',
    title,
    message,
    read: false
  };
};
